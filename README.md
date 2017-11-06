# IOpipe Profiler Plugin

This is a profiler and tracing library for use with [IOpipe](https://iopipe.com)
and AWS Lambda.

## Installation:

With [yarn](https://yarnpkg.com/) (recommended) in project directory:

`yarn add iopipe-plugin-profiler`

With npm in project directory:

`npm install iopipe-plugin-profiler`

Then include the plugin with IOpipe in your serverless function:

```
const iopipeLib = require('iopipe');
const profiler = require('iopipe-plugin-profiler');

const iopipe = iopipeLib({
  plugins: [profiler()]
});

exports.handler = iopipe((event, context) => {
  context.succeed('Wow!');
});
```

## Config

#### `enabled` (bool: optional = true)

By default, this plugin will _not_ run the profiler. You must enable profiling on your function either by setting this variable, or setting `IOPIPE_ENABLE_PROFILER=true` in your environment. The environment variable setting (either true or unset) takes precedence over plugin config.

#### `recSamples` (bool: optional = true)

Record samples, defaults to true.

#### `sampleRate` (number: optional = 1000)

Change the sampling interval, in microseconds. Defaults to 1000us.

#### `debug` (bool: optional = false)

Show debugging logs.

## Environment Variables

To enable profiling via environment variable, set `IOPIPE_ENABLE_PROFILER` to true in your environment.

## License

Apache-2.0 see [LICENSE](https://www.apache.org/licenses/LICENSE-2.0.html)

Copyright 2017, IOpipe, Inc.
