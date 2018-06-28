import * as inspector from 'inspector';
import * as urlLib from 'url';
import get from 'lodash.get';
import * as archiver from 'archiver';

import request from './request';
import enabled from './enabled';
import getSignerHostname from './signer';

const pkg = require('../package.json');

const defaultConfig = {
  recSamples: true,
  sampleRate: 1000,
  enabled: false,
  heapSnapshot: false,
  debug: false
};

class ProfilerPlugin {
  constructor(pluginConfig = defaultConfig, invocationInstance) {
    this.invocationInstance = invocationInstance;
    this.token = get(this.invocationInstance, 'config.clientId');
    this.config = Object.assign({}, defaultConfig, pluginConfig);
    this.profilerEnabled = enabled(
      'IOPIPE_ENABLE_PROFILER',
      this.config.enabled
    );
    this.heapEnabled = enabled(
      'IOPIPE_ENABLE_HEAPSNAPSHOT',
      this.config.heapSnapshot
    );
    this.enabled = this.profilerEnabled || this.heapEnabled;
    this.uploads = [];

    // pre-invoke hooks cannot be async, so create our own promise to wait on
    // before the post-invoke method runs
    this.pluginReadyPromise = Promise.resolve();

    this.hooks = {
      'pre:invoke': this.preInvoke.bind(this),
      'post:invoke': this.postInvoke.bind(this),
      'post:report': this.postReport.bind(this)
    };
    this.session = new inspector.Session();
    // promisify session.post
    this.sessionPost = (key, obj = {}) => {
      return new Promise((resolve, reject) => {
        this.session.post(
          key,
          obj,
          (err, msg) => (err ? reject(err) : resolve(msg))
        );
      });
    };

    return this;
  }

  log(logline) {
    // eslint-disable-next-line no-console
    this.config.debug ? console.log(`@iopipe/profiler::${logline}`) : null;
  }

  get meta() {
    return {
      name: pkg.name,
      version: pkg.version,
      homepage: pkg.homepage,
      enabled: this.enabled,
      uploads: this.uploads
    };
  }

  preInvoke() {
    if (!this.enabled) {
      return;
    }

    const promises = [];

    try {
      this.session.connect();

      if (this.heapEnabled) {
        promises.push(this.sessionPost('HeapProfiler.enable'));
      }

      if (this.profilerEnabled) {
        promises.concat([
          this.sessionPost('Profiler.enable'),
          this.sessionPost('Profiler.setSamplingInterval', {
            interval: this.config.sampleRate
          }),
          this.sessionPost('Profiler.start')
        ]);
      }
      this.pluginReadyPromise = Promise.all(promises);
    } catch (err) {
      this.log(err);
    }
  }

  async getSignedUrl(obj = this.invocationInstance) {
    const { startTimestamp, context = {} } = obj;
    const hostname = getSignerHostname();
    this.log(`Requesting signed url from ${hostname}`);
    const signingRes = await request(
      JSON.stringify({
        arn: context.invokedFunctionArn,
        requestId: context.awsRequestId,
        timestamp: startTimestamp,
        extension: '.zip'
      }),
      'POST',
      {
        hostname,
        path: '/'
      },
      this.token
    );

    // Parse response to get signed url
    const response = JSON.parse(signingRes);
    // attach uploads to plugin data
    this.uploads.push(response.jwtAccess);
    return response.signedRequest;
  }

  async postInvoke() {
    if (!this.enabled) return false;

    try {
      await this.pluginReadyPromise;
    } catch (err) {
      return false;
    }

    return new Promise(async resolve => {
      try {
        const signedRequestURL = await this.getSignedUrl();
        const archive = archiver.default('zip');

        /* NodeJS's Buffer has a fixed-size heap allocation.

           Here an Array, which has dynamic allocation,
           is used to buffer (hold) data received from a stream
           then used to construct a Buffer via Buffer.concat(Array),
           a constructor of Buffer. */
        const archiveBuffer = [];
        const heapSnapshotBufferArr = [];

        archive.on('data', chunk => archiveBuffer.push(chunk));
        archive.on('finish', async () => {
          /* Here uploads to S3 are incompatible with streams.
             Chunked Encoding is not supported for uploads
             to a pre-signed url. */
          await request(
            Buffer.concat(archiveBuffer),
            'PUT',
            urlLib.parse(signedRequestURL)
          );
          resolve();
        });

        const totalWantedFiles = [
          this.profilerEnabled,
          this.heapEnabled
        ].filter(Boolean).length;

        let filesSeen = 0;
        archive.on('entry', () => {
          filesSeen++;
          if (filesSeen >= totalWantedFiles) {
            if (
              typeof this.invocationInstance.context.iopipe.label === 'function'
            ) {
              this.invocationInstance.context.iopipe.label(
                '@iopipe/plugin-profiler'
              );
            }
            archive.finalize();
          }
        });

        if (this.profilerEnabled) {
          this.sessionPost('Profiler.stop').then(({ profile }) => {
            archive.append(JSON.stringify(profile), {
              name: 'profile.cpuprofile'
            });
          });
        }

        if (this.heapEnabled) {
          this.session.on('HeapProfiler.addHeapSnapshotChunk', ({ chunk }) =>
            heapSnapshotBufferArr.push(chunk)
          );

          this.sessionPost('HeapProfiler.takeHeapSnapshot').then(() => {
            archive.append(
              Buffer.concat(heapSnapshotBufferArr.filter(Boolean)),
              {
                name: 'profile.heapsnapshot'
              }
            );
          });
        }
      } catch (e) {
        this.log(`Error in upload: ${e}`);
        resolve();
      }
    });
  }

  postReport() {
    this.session.disconnect();
  }
}

module.exports = function instantiateProfilerPlugin(pluginOpts) {
  return invocationInstance => {
    return new ProfilerPlugin(pluginOpts, invocationInstance);
  };
};
