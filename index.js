const lambdaCallback = require('./callback')
const lambdaContext = require('./callback')
const v8profiler = require('v8-profiler')


var profiler = {}


profiler.constructor = (config) => {
  var decorator = (userFunction) => {
    v8profiler.startProfiling()

    return (event, context, callback) => {
      var stopAndSend = new Promise ((resolve, reject) => {
        var output = v8profiler.stopProfiling()
        console.log(output)
        resolve()
      })

      var newCallback = lambdaCallback(callback, stopAndSend)
      var newContext = lambdaContext(context, stopAndSend)

      userFunction(event, context, callback)
    } 
  }

  return decorator
}

module.exports = profiler.constructor
