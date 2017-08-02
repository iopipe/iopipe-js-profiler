'use strict'

function Context(context, callback) {
  var old_done = context.done
  context.done = function(err, data) {
    callback.then(() => {
      old_done(err, data)
    })
  }
  return context
}

module.exports = Context
