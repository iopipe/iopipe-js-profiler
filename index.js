const lambdaCallback = require('./callback')
const lambdaContext = require('./callback')
const v8profiler = require('v8-profiler')
const AWS = require('aws-sdk')
const s3 = new AWS.S3();


var profiler = {}


profiler.constructor = (userConfig) => {
  var userConfig = (userConfig) ? userConfig : {}
  config = {
    s3bucket: userConfig.s3bucket || 'lambda-profiler-dumps',
    recsamples: userConfig.recsamples || true,
    sampleRate: userConfig.sampleRate || 100
  }
  var decorator = (userFunction) => {
    return (event, context, callback) => {
      v8profiler.setSamplingInterval(config.sampleRate)
      v8profiler.startProfiling(undefined, config.recsamples)

      var stopAndSend = new Promise ((resolve, reject) => {
        var profile = v8profiler.stopProfiling()
        profile.export((err, output) => {
          (err) ? reject(err) : s3.putObject({
            Body: output,
            Bucket: config.s3bucket,
            Key: context.awsRequestId + ".cpuprofile"
          }, (err, data) => {
            if (err) {
              reject(err)
              return
            }
            resolve(data)
          })
        })
      })

      var newCallback = lambdaCallback(callback, stopAndSend)
      var newContext = lambdaContext(context, stopAndSend)

      try {
        userFunction(event, context, callback)
      }
      catch (e) {
        stopAndSend().then(() => { throw e })
      }
    } 
  }

  return decorator
}

module.exports = profiler.constructor