import v8profiler from 'v8-profiler';
import request from './request';

const pkg = require('../package.json');

const defaultConfig = {
  recSamples: true,
  sampleRate: 1000,
  debug: false
};

class ProfilerPlugin {
  constructor(pluginConfig = defaultConfig, invocationInstance) {
    this.invocationInstance = invocationInstance;
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
    v8profiler.setSamplingInterval(this.config.sampleRate);
    v8profiler.startProfiling(undefined, this.config.recSamples);
  }

  async postInvoke() {
    this.log('post-invoke');
    const profile = v8profiler.stopProfiling();
    const output = await new Promise((resolve, reject) => {
      profile.export((err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
    // Send data to signing API
    request(output, {}).then(res => {
      // use signature to send to S3
      // request()
      console.log(res);
    });
    this.log('end of hook');
  }
}

export default function instantiateProfilerPlugin(pluginOpts) {
  return invocationInstance => {
    return new ProfilerPlugin(pluginOpts, invocationInstance);
  };
}
