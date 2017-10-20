import v8profiler from 'v8-profiler';
import * as urlLib from 'url';
import get from 'lodash.get';
import merge from 'lodash.merge';
import request from './request';
import { signingUrl } from './constants';

const pkg = require('../package.json');

const defaultConfig = {
  recSamples: true,
  sampleRate: 1000,
  debug: false
};

class ProfilerPlugin {
  constructor(pluginConfig = defaultConfig, invocationInstance) {
    this.invocationInstance = invocationInstance;
    this.token = { token: get(this.invocationInstance, 'config.clientId') };
    this.config = Object.assign({}, defaultConfig, pluginConfig);

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
    return { name: pkg.name, version: pkg.version, homepage: pkg.homepage };
  }

  // Send data to signing API, which will enable the data to be uploaded to S3
  preInvoke() {
    if (process.env.IOPIPE_DISABLE_PROFILING) return;
    v8profiler.setSamplingInterval(this.config.sampleRate);
    v8profiler.startProfiling(undefined, this.config.recSamples);
  }

  async postInvoke() {
    let signedRequest;
    let profileUrl;
    if (process.env.IOPIPE_DISABLE_PROFILING) return;
    this.log('post-invoke');
    const profile = v8profiler.stopProfiling();
    const output = await new Promise((resolve, reject) => {
      profile.export((err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
    // Send data to signing API
    this.log('sending request');
    await request(
      JSON.stringify({
        arn: this.invocationInstance.context.invokedFunctionArn,
        requestId: this.invocationInstance.context.awsRequestId,
        timestamp: this.invocationInstance.startTimestamp
      }),
      'POST',
      merge(signingUrl, this.token)
    ).then(async signingRes => {
      // Capture other statuses
      if (signingRes.status !== 201) {
        this.log(`${signingRes.status}: ${signingRes.apiResponse}`);
        return;
      }
      // use signature to send to S3
      try {
        const response = JSON.parse(signingRes.apiResponse);
        signedRequest = response.signedRequest;
        profileUrl = response.url;
      } catch (e) {
        this.log(`Error parsing signing API response: ${JSON.stringify(e)}`);
        return;
      }

      // Add profile url to report
      const { report } = this.invocationInstance.report;
      report.profileUrl = profileUrl;

      await request(output, 'PUT', urlLib.parse(signedRequest)).then(() => {
        this.log('end of hook');
      });
    });
  }
}

export default function instantiateProfilerPlugin(pluginOpts) {
  return invocationInstance => {
    return new ProfilerPlugin(pluginOpts, invocationInstance);
  };
}
