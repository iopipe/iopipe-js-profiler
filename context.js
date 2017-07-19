'use strict'

function clone(oldObject) {
  // Basis.
  if (!(oldObject instanceof Object)) {
    return oldObject
  }

  var clonedObject

  // Filter out special objects.
  var Constructor = oldObject.constructor
  switch (Constructor) {
    // Implement other special objects here.
  case Promise:
    clonedObject = oldObject.then()
    break
  case Date:
    clonedObject = new Constructor(oldObject.getTime())
    break
  default:
    clonedObject = new Constructor()
  }

  // Clone each property.
  for (var prop in oldObject) {
    clonedObject[prop] = clone(oldObject[prop])
  }

  return clonedObject
}

function Context(oldContext, callback) {
  let context = clone(oldContext)
  context.succeed = function(data) {
    callback.then(() => {
      oldContext.succeed(data)
    })
  }

  context.fail = function(err) {
    callback.then(() => {
      oldContext.fail(err)
    })
  }

  context.done = function(err, data) {
    callback.then(() => {
      oldContext.done(err, data)
    })
  }

  context.getRemainingTimeInMillis = oldContext.getRemainingTimeInMillis

  /* Map getters/setters */
  context.__defineGetter__('callbackWaitsForEmptyEventLoop',
                           () => { return oldContext.callbackWaitsForEmptyEventLoop })
  context.__defineSetter__('callbackWaitsForEmptyEventLoop',
                           (value) => { oldContext.callbackWaitsForEmptyEventLoop = value })

  return context
}

module.exports = Context
