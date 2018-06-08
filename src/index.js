import * as inspector from 'inspector';
import * as urlLib from 'url';
import get from 'lodash.get';
import request from './request';
import enabled from './enabled';
import getSignerHostname from './signer';
import * as archiver from 'archiver';
import * as stream from 'stream';

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
    this.heapsnapshotEnabled = enabled(
      'IOPIPE_ENABLE_HEAPSNAPSHOT',
      this.config.heapSnapshot
    );
    this.enabled = this.profilerEnabled || this.heapsnapshotEnabled;
    this.uploads = [];

    this.hooks = {
      'pre:invoke': this.preInvoke.bind(this),
      'post:invoke': this.postInvoke.bind(this)
    };
    this.inspector = new inspector.Session();

    // Enable the remote inspector (on localhost)

    try {
      this.inspector.connect();
    } catch (err) {
      this.log(`warning connecting to inspector: ${err}`);
    }

    return this;
  }

  log(logline) {
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
    if (this.heapsnapshotEnabled) {
      this.inspector.post('HeapProfiler.enable', err => {
        if (err) {
          this.log(`Error enabling profiler::${err}`);
        }
      });
    }
    if (this.profilerEnabled) {
      this.inspector.post('Profiler.enable', errEnable => {
        if (errEnable) {
          this.log(`Error enabling profiler::${errEnable}`);
        }
        this.inspector.post(
          'Profiler.setSamplingInterval',
          { interval: this.config.sampleRate },
          err => {
            if (err) {
              this.log(`Error from profiler::${err}`);
            }
            this.inspector.post('Profiler.start', errStart => {
              if (errStart) {
                this.log(`Error starting profiler::${errStart}`);
              }
            });
          }
        );
      });
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

        archive.on('data', chunk => {
          archiveBuffer.push(chunk);
        });
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

        if (this.profilerEnabled) {
          this.inspector.post('Profiler.stop', (err, { profile }) => {
            archive.append(JSON.stringify(profile), {
              name: 'profile.cpuprofile'
            });
            archive.finalize();
          });
        }
        const heap = new stream.PassThrough();
        if (this.heapsnapshotEnabled) {
          this.inspector.post('HeapProfiler.takeHeapSnapshot', () => {
            this.inspector.on(
              'HeapProfiler.addHeapSnapshotChunk',
              ({ chunk }) => {
                heap.write(chunk);
              }
            );
            this.inspector.on(
              'HeapProfiler.reportHeapSnapshotProgress',
              ([, , finished]) => {
                if (finished) {
                  heap.end();
                  archive.finalize();
                }
              }
            );
            archive.append(heap, { name: 'profile.heapsnapshot' });
          });
        }
      } catch (e) {
        this.log(`Error in upload: ${e}`);
        resolve();
      }
    });
  }
}

module.exports = function instantiateProfilerPlugin(pluginOpts) {
  return invocationInstance => {
    return new ProfilerPlugin(pluginOpts, invocationInstance);
  };
};
