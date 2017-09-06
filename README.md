# IOpipe Profiler Plugin

This is a profiler and tracing library for use with [IOpipe](https://iopipe.com)
and AWS Lambda.

## Installation:

For convenience, a pre-compiled version which works with AWS Lambda
is available as the npm module `iopipe-plugin-profiler`. The source-version
of this module is published as `iopipe-plugin-profiler-src`, see section *Building*
for more details.

With [yarn](https://yarnpkg.com/) (recommended) in project directory:

`yarn add iopipe-plugin-profiler`

With npm in project directory:

`npm install iopipe-plugin-profiler`

Then include the plugin with IOpipe in your serverless function:

```
const iopipeLib = require('iopipe');
const profiler = require('iopipe-plugin-profiler');

const iopipe = iopipeLib({
  plugins: [profiler({
      s3bucket: 'my-profiling-data-goes-here'
    })]
});

exports.handler = iopipe((event, context) => {
  context.succeed('Wow!');
});
```

## Config

#### `s3bucket` (string: required)

The name of the s3 bucket where you will store your profiling data. *N.B. s3
bucket names must be unique*.

#### `s3secondsExpire` (Number: optional = 2592000)

#### `recsamples` (bool: optional = true)

#### `sampleRate` (number: optional = 1000)

## Building

It requires a C-based extension to be compiled and loaded. Compilation
of this should be done such that it is compatible with the AWS Lambda
container filesystem, we have published [awslambda-npm-install](https://github.com/iopipe/awslambda-npm-install)
to simplify the compilation process.

Simply run `awslambda-npm-install` to build binary dependencies into `node_modules`.
Further information on the build and publishing process will be documented as it develops.

This module is designed for both local development, and for deploying
on AWS Lambda, using separately compiled C extensions for NodeJS/v8.


## License

Apache-2.0 see [LICENSE](https://www.apache.org/licenses/LICENSE-2.0.html)

Copyright 2017, IOpipe, Inc.
