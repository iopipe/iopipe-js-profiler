Lambda Profiler
---------------

## Description

This is a profiler and tracing library for use with AWS Lambda.

It requires a C-based extension to be compiled and loaded. Compilation
of this requires access to a Docker-based host.

For convenience, a pre-compiled version which works with AWS Lambda
is available as the npm module `lambda-profiler`. The source-version
of this module is published as `lambda-profiler-src`. This defies
typical convention of publishing sources as cross-compilation for
AWS Lambda is non-trivial and Docker as a build requirement for npm
modules is atypical.

This module is designed for both local development, and for deploying
on AWS Lambda, using separatey compiled C extensions for NodeJS/v8.

## Installation:

Run:

`npm install lambda-profiler`

## License

Apache-2.0 see [LICENSE](https://www.apache.org/licenses/LICENSE-2.0.html)

Copyright 2017,  IOpipe, Inc.
