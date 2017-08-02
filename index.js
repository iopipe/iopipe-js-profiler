const v8profiler = require('v8-profiler')
const AWS = require('aws-sdk')
const s3 = new AWS.S3();
const _ = require('lodash')

class ProfilerPlugin {
  constructor(pluginConfig = defaultConfig, invocationInstance) {
    this.invocationInstance = invocationInstance
    this.config = _.defaults({}, pluginConfig, {
      s3bucket: 'lambda-profiler-dumps',
      s3secondsExpire: 2592000,
      recsamples: true,
      sampleRate: 1000
    });

    this.hooks = {
      'pre:invoke': this.preInvoke.bind(this),
      'post:invoke': this.postInvoke.bind(this)
    }
    return this
  }

  preInvoke() {
    v8profiler.setSamplingInterval(this.config.sampleRate)
    v8profiler.startProfiling(undefined, this.config.recsamples)
  }

  postInvoke() {
    var profile = v8profiler.stopProfiling()

    profile.export(
      (err, output) => {
        (err) ? undefined : s3.putObject({
          Body: output,
          Bucket: this.config.s3bucket,
          Key: this.invocationInstance.context.awsRequestId + ".cpuprofile"
        }, (err, data) => {
          (err) ? undefined : s3.getSignedUrl(
            'getObject',
            {
              Bucket: this.config.s3bucket,
              Key: this.invocationInstance.context.awsRequestId + ".cpuprofile"
            },
            (err, url) => {
              (err) ? undefined : this.invocationInstance.context.iopipe.log('profiler_url', url)
            }
          )
        })
      }
    )
  }
}
