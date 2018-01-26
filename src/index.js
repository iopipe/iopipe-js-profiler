import v8profiler from 'v8-profiler-lambda';
import * as urlLib from 'url';
import get from 'lodash.get';
import request from './request';
import * as enabled from './enabled';
import getSignerHostname from './signer';
import * as archiver from 'archiver';

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
    this.profilerEnabled = enabled.getProfilerEnabledStatus(
      this.config.enabled
    );
    this.heapsnapshotEnabled = enabled.getHeapSnapshotEnabledStatus(
      this.config.heapSnapshot
    );
    this.enabled = this.profilerEnabled || this.heapsnapshotEnabled;

    this.hooks = {
      'pre:invoke': this.preInvoke.bind(this),
      'post:invoke': this.postInvoke.bind(this)
    };
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
      enabled: this.enabled
    };
  }

  preInvoke() {
    if (this.profilerEnabled) {
      v8profiler.setSamplingInterval(this.config.sampleRate);
      v8profiler.startProfiling(undefined, this.config.recSamples);
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
        content_type: 'application/zip'
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
    return response.signedRequest;
  }

  async postInvoke() {
    if (!this.enabled) return false;

    return new Promise(async resolve => {
      try {
        const signedRequestURL = await this.getSignedUrl();
        const archive = archiver.default('zip');
        const archiveBuffer = [];

        archive.on('data', chunk => {
          archiveBuffer.push(chunk);
        });
        archive.on('finish', async () => {
          await request(
            Buffer.concat(archiveBuffer),
            'PUT',
            urlLib.parse(signedRequestURL)
          );
          resolve();
        });

        if (this.profilerEnabled) {
          const profile = v8profiler.stopProfiling();
          archive.append(profile.export(), { name: 'profile.cpuprofile' });
        }
        if (this.heapsnapshotEnabled) {
          const heap = v8profiler.takeSnapshot();
          archive.append(heap.export(), { name: 'profile.heapsnapshot' });
        }
        archive.finalize();
      } catch (e) {
        console.log('@iopipe/profiler::Error in upload:', e);
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
