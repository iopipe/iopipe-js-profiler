# IOpipe Profiler Plugin

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

This is a profiler and tracing library for use with [IOpipe](https://iopipe.com)
and AWS Lambda.

## Installation:

With [yarn](https://yarnpkg.com/) (recommended) in project directory:

`yarn add @iopipe/profiler`

With npm in project directory:

`npm install @iopipe/profiler`

Then include the plugin with IOpipe in your serverless function:

```js
const iopipeLib = require('@iopipe/iopipe');
const profiler = require('@iopipe/profiler');

const iopipe = iopipeLib({
  token: 'TOKEN_HERE',
  plugins: [profiler({ enabled: true, heapSnapshot: true })]
});

exports.handler = iopipe((event, context) => {
  context.succeed('Wow!');
});
```

### Engines

To use >=2.0 of this library, you must be running on Node.js 8 or higher (8.10 and up on AWS Lambda). If you are running on 6.10 on Lambda, use a 1.x version, as the native profiler is not available on that runtime, and will be compiled in the 1.x version of this library.

## Config

#### `enabled` (bool: optional = false)

By default, this plugin will _not_ run the profiler. You must enable profiling on your function either by setting this variable, or setting `IOPIPE_ENABLE_PROFILER=true` in your environment. The environment variable setting (either true or unset) takes precedence over plugin config.

#### `heapSnapshot` (bool: optional = false)

By default, this plugin will not take heap snapshots. To enable heap snapshots, either set this value to true, or setting `IOPIPE_ENABLE_HEAPSNAPSHOT=true` in your environment. The environment variable setting (either true or unset) takes precedence over plugin config.

#### `recSamples` (bool: optional = true)

Record samples, defaults to true.

#### `sampleRate` (number: optional = 1000)

Change the sampling interval, in microseconds. Defaults to 1000us.

#### `debug` (bool: optional = false)

Show debugging logs.

#### `networkTimeout` (number: optional = 5000)

Set timeout in ms for network requests.

## Environment Variables

To enable profiling via environment variable, set `IOPIPE_ENABLE_PROFILER` to true in your environment.

## License

Apache-2.0 see [LICENSE](https://www.apache.org/licenses/LICENSE-2.0.html)

Copyright 2017, IOpipe, Inc.
