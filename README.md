Lambda Profiler
---------------

## Description

This is a profiler and tracing library for use with AWS Lambda.

## Installation:

For convenience, a pre-compiled version which works with AWS Lambda
is available as the npm module `lambda-profiler`. The source-version
of this module is published as `lambda-profiler-src`, see section Building

To install, run:

`npm install lambda-profiler`

## Usage

Decorate your handler function with the function exported by this
module.

```
const ioProfiler = require('lambda-profiler')

module.exports.handler = ioProfiler(
  (event, context, callback) => {
    console.log(event)
    callback()
  }
)
```

## Building

It requires a C-based extension to be compiled and loaded. Compilation
of this should be done such that it is compatible with the AWS Lambda
container filesystem, we have published [awslambda-npm-install](https://github.com/iopipe/awslambda-npm-install)
to simplify the compilation process.

Simply run `awslambda-npm-install` to build binary dependencies into `node_modules`.
Further information on the build and publishing process will be documented as it develops.

This module is designed for both local development, and for deploying
on AWS Lambda, using separatey compiled C extensions for NodeJS/v8.


## License

Apache-2.0 see [LICENSE](https://www.apache.org/licenses/LICENSE-2.0.html)

Copyright 2017,  IOpipe, Inc.
