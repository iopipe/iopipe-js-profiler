const lambdaCallback = require('./callback')
const lambdaContext = require('./callback')
const v8profiler = require('v8-profiler')
const AWS = require('aws-sdk')
const s3 = new AWS.S3();


var profiler = {}


profiler.constructor = function profilerConfig (userConfig) {
  var userConfig = (userConfig) ? userConfig : {}
  config = {
    s3bucket: userConfig.s3bucket || 'lambda-profiler-dumps',
    recsamples: userConfig.recsamples || true,
    sampleRate: userConfig.sampleRate || 100
  }
  var decorator = (userFunction) => {
    return function profiledUserFunction (event, context, callback) {
      v8profiler.setSamplingInterval(config.sampleRate)
      v8profiler.startProfiling(undefined, config.recsamples)

      var stopAndSend = () => {
        return new Promise ((resolve, reject) => {
          var profile = v8profiler.stopProfiling()
          profile.export(
            (err, output) => {
              (err) ? reject(err) : s3.putObject({
                Body: output,
                Bucket: config.s3bucket,
                Key: context.awsRequestId + ".cpuprofile"
              }, (err, data) => {
                (err) ? reject(err) : s3.getSignedUrl(
                  'getObject',
                  {
                    Bucket: config.s3bucket,
                    Key: context.awsRequestId + ".cpuprofile"
                  },
                  (err, url) => {
                    (err) ? reject(err) : (() => {
                      context.iopipe.log('profiler_url', url)
                      resolve(url)
                    })()
                  }
                )
              })
            }
          )
        })
      }

      var newCallback = function wrappedCallback (err, data) {
        stopAndSend().then(() => { callback(err, data) })
      }
      var newContext = lambdaContext(context, stopAndSend)

      try {
        userFunction(event, newContext, newCallback)
      }
      catch (e) {
        stopAndSend().then(() => { throw e })
      }
    } 
  }

  return decorator
}

module.exports = profiler.constructor
