import v8profiler from 'v8-profiler-lambda';
import * as urlLib from 'url';
import get from 'lodash.get';
import request from './request';
import getEnabledStatus from './enabled';
import getSignerHostname from './signer';
import getDnsPromise from './dns';

const pkg = require('../package.json');

const defaultConfig = {
  recSamples: true,
  sampleRate: 1000,
  enabled: false,
  debug: false
};

const signingUrlHostname = 'signer.iopipe.com';

class ProfilerPlugin {
  constructor(pluginConfig = defaultConfig, invocationInstance) {
    this.invocationInstance = invocationInstance;
    this.token = { token: get(this.invocationInstance, 'config.clientId') };
    this.config = Object.assign({}, defaultConfig, pluginConfig);
    this.signingUrlIp = getDnsPromise(getSignerHostname());
    this.enabled = getEnabledStatus(this.config.enabled);

    this.hooks = {
      'pre:invoke': this.preInvoke.bind(this),
      'post:invoke': this.postInvoke.bind(this)
    };
    return this;
  }

  log(logline) {
    this.config.debug ? console.log(logline) : null;
  }

  get meta() {
    return {
      name: pkg.name,
      version: pkg.version,
      homepage: pkg.homepage,
      enabled: this.enabled
    };
  }

  // Send data to signing API, which will enable the data to be uploaded to S3
  preInvoke() {
    if (!getEnabledStatus(this.enabled)) return;
    // otherwise we're enabled
    this.enabled = true;
    // reset DNS in case of update
    this.signingUrlIp = getDnsPromise(signingUrlHostname);
    v8profiler.setSamplingInterval(this.config.sampleRate);
    v8profiler.startProfiling(undefined, this.config.recSamples);
  }

  async getSignedUrl(obj = this.invocationInstance) {
    const { startTimestamp, context = {} } = obj;
    const signingRes = await request(
      JSON.stringify({
        arn: context.invokedFunctionArn,
        requestId: context.awsRequestId,
        timestamp: startTimestamp
      }),
      'POST',
      {
        ipAddress: await this.signingUrlIp,
        hostname: signingUrlHostname,
        path: '/'
      },
      this.token
    );

    // Parse response to get signed url
    const response = JSON.parse(signingRes);
    return response.signedRequest;
  }

  async postInvoke() {
    try {
      if (!getEnabledStatus(this.enabled)) return;

      const profile = v8profiler.stopProfiling();
      const output = await new Promise((resolve, reject) => {
        profile.export((err, data) => {
          profile.delete();
          err ? reject(err) : resolve(data);
        });
      });

      const signedRequestURL = await this.getSignedUrl();

      await request(output, 'PUT', urlLib.parse(signedRequestURL));
    } catch (e) {
      this.log(e);
    }
  }
}

export default function instantiateProfilerPlugin(pluginOpts) {
  return invocationInstance => {
    return new ProfilerPlugin(pluginOpts, invocationInstance);
  };
}
