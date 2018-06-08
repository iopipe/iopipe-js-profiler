import mockContext from 'aws-lambda-mock-context';
import _ from 'lodash';
import iopipe from '@iopipe/core';
import Profiler from './index';
import pkg from '../package.json';

jest.mock('v8-profiler-lambda');
jest.mock('./request');

import { settings as profilerRuntime } from 'v8-profiler-lambda';
import { putData } from './request';

test('Can instantiate plugin without options', () => {
  const plugin = Profiler();
  const inst = plugin({});
  expect(_.isFunction(inst.hooks['pre:invoke'])).toBe(true);
  expect(_.isFunction(inst.preInvoke)).toBe(true);
  expect(_.isFunction(inst.hooks['post:invoke'])).toBe(true);
  expect(_.isFunction(inst.postInvoke)).toBe(true);
  expect(_.isPlainObject(inst.config)).toBe(true);
  expect(inst.config.recSamples).toBe(true);
  expect(inst.config.sampleRate).toBe(1000);
  expect(inst.config.debug).toBe(false);
  expect(inst.meta.name).toBe('@iopipe/profiler');
  expect(inst.meta.version).toBe(pkg.version);
  expect(inst.meta.homepage).toBe(
    'https://github.com/iopipe/iopipe-plugin-profiler#readme'
  );
  inst.postReport();
});

test('Can instantiate plugin with options', () => {
  const pluginWithOptions = Profiler({
    recSamples: false,
    sampleRate: 100,
    debug: true
  });
  const inst = pluginWithOptions({});
  expect(inst.config.recSamples).toBe(false);
  expect(inst.config.sampleRate).toBe(100);
  expect(inst.config.debug).toBe(true);
  inst.postReport();
});

test('works with iopipe', async function runTest() {
  const iopipeInstance = iopipe({
    token: 'test',
    plugins: [Profiler({ debug: true, enabled: true })]
  });
  const wrappedFn = iopipeInstance((event, context) => {
    // add expectation here that the profiler is running
    context.succeed('wow');
  });
  const context = mockContext({ functionName: 'test-1' });
  wrappedFn({}, context);

  const val = await context.Promise;
  expect(val).toBe('wow');
  expect(profilerRuntime.running).toBe(false);
  expect(putData.length).toBe(1);
  // Test that the data returned has the zip format magic bytes.
  expect(putData[0].slice(0, 4)).toEqual(Buffer([80, 75, 3, 4]));
});

test('running post-invoke adds uploads to metadata', async function runTest() {
  const plugin = Profiler({ enabled: true });
  const inst = plugin({});
  expect(_.isEmpty(inst.uploads)).toBeTruthy();
  await inst.hooks['post:invoke']();
  expect(inst.uploads[0]).toBe('this-is-a-token');
});
