import v8profiler from 'v8-profiler';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

const defaultConfig = {
  s3bucket: 'lambda-profiler-dumps',
  s3secondsExpire: 2592000,
  recsamples: true,
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

  preInvoke() {
    v8profiler.setSamplingInterval(this.config.sampleRate);
    v8profiler.startProfiling(undefined, this.config.recsamples);
  }

  async postInvoke() {
    this.log('post-invoke');
    const profile = v8profiler.stopProfiling();
    const output = await new Promise((resolve, reject) => {
      profile.export((err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
    await s3
      .putObject({
        Body: output,
        Bucket: this.config.s3bucket,
        Key: `${this.invocationInstance.context.awsRequestId}.cpuprofile`
      })
      .promise()
      .then(async data => {
        this.log(data);
      })
      .catch(err => {
        this.log(err);
      });
    this.log('end of hook');
  }
}

module.exports = function instantiateProfilerPlugin(pluginOpts) {
  return invocationInstance => {
    return new ProfilerPlugin(pluginOpts, invocationInstance);
  };
};
