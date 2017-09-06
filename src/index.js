const v8profiler = require('v8-profiler');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const defaultConfig = {
  s3bucket: 'lambda-profiler-dumps',
  s3secondsExpire: 2592000,
  recsamples: true,
  sampleRate: 1000,
  debug: true
};

class ProfilerPlugin {
  constructor(pluginConfig = defaultConfig, invocationInstance) {
    this.invocationInstance = invocationInstance;
    this.config = Object.assign({}, defaultConfig, pluginConfig);

    this.hooks = {
      'pre:invoke': this.preInvoke.bind(this),
      'post:invoke': this.postInvoke.bind(this),
      'post:report': () => {
        console.log('postreport');
      }
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
    var profile = v8profiler.stopProfiling();
    const output = await new Promise((resolve, reject) => {
      profile.export((err, output) => {
        err ? reject(err) : resolve(output);
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
        this.log('foo3')
        // await s3.getSignedUrl(
        //   'getObject',
        //   {
        //     Bucket: this.config.s3bucket,
        //     Key: this.invocationInstance.context.awsRequestId + '.cpuprofile'
        //   },
        //   (s3UrlErr, url) => {
        //     s3UrlErr
        //       ? this.log(s3UrlErr)
        //       : this.invocationInstance.context.iopipe.log(
        //           'IOpipeProfilerUrl',
        //           url
        //         );
        //   }
        // );
      })
      .catch(err => {
        this.log(err);
      });
    this.log('end of hook')
  }
}

module.exports = function instantiateProfilerPlugin(pluginOpts) {
  return invocationInstance => {
    return new ProfilerPlugin(pluginOpts, invocationInstance);
  };
};
