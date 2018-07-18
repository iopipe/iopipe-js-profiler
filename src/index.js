import { promisify } from 'util';
import * as inspector from 'inspector';
import get from 'lodash.get';
import * as archiver from 'archiver';
import { util as coreUtil } from '@iopipe/core';
import { concat } from 'simple-get';

import enabled from './enabled';

const request = promisify(concat);

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
      this.log(`${key}, opts = ${JSON.stringify(obj)}`);
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

    // kick off the S3 signer request early as we have the info necessary
    const promises = [this.getFileUploadMeta()];

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

  getFileUploadMeta() {
    // returns a promise here
    return coreUtil.getFileUploadMeta({
      auth: this.token
    });
  }

  async postInvoke() {
    if (!this.enabled) return false;

    try {
      const [fileUploadMeta = {}] = await this.pluginReadyPromise;
      if (fileUploadMeta.jwtAccess) {
        this.uploads.push(fileUploadMeta.jwtAccess);
        this.signedRequestUrl = fileUploadMeta.signedRequest;
      } else {
        return this.log(`S3 signer service error. Response: ${fileUploadMeta}`);
      }
    } catch (err) {
      this.log(err);
      // if there is an error setting things up, bail early
      return false;
    }

    return new Promise(resolve => {
      try {
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
          await request({
            url: this.signedRequestUrl,
            method: 'PUT',
            body: Buffer.concat(archiveBuffer).toString()
          });
          resolve();
        });

        // Generate 1 or 2 files total depending on options
        // We will use this number to know when we should finish up all the work
        const totalWantedFiles = [
          this.profilerEnabled,
          this.heapEnabled
        ].filter(Boolean).length;

        let filesSeen = 0;
        archive.on('entry', () => {
          filesSeen++;
          if (filesSeen === totalWantedFiles) {
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
          this.session.on('HeapProfiler.addHeapSnapshotChunk', obj =>
            heapSnapshotBufferArr.push(
              obj &&
                obj.params &&
                obj.params.chunk &&
                Buffer.from(obj.params.chunk)
            )
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
