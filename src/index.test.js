import mockContext from 'aws-lambda-mock-context';
import _ from 'lodash';
import iopipe from '@iopipe/core';
import Profiler from './index';
import pkg from '../package.json';

jest.mock('v8-profiler-lambda');
jest.mock('./request');

import { putData } from './request';

process.env.IOPIPE_TOKEN = 'test';

beforeEach(() => {
  // reset mock data holder for each test
  putData.length = 0;
});

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

function runFn(opts, fn = (e, ctx) => ctx.succeed('pass')) {
  const context = mockContext();
  iopipe({
    plugins: [Profiler(opts)]
  })(fn)({}, context);
  return context.Promise;
}

test('Works with profiler enabled', async function runTest() {
  await runFn({ enabled: true });
  expect(putData.length).toBe(1);
  expect(putData[0].toString('utf-8')).toMatch(/profile\.cpuprofile/);
});

test('Works with heapSnapshot enabled', async function runTest() {
  await runFn({ heapSnapshot: true });
  expect(putData.length).toBe(1);
  expect(putData[0].toString('utf-8')).toMatch(/profile\.heapsnapshot/);
});

test('Works with both enabled', async function runTest() {
  await runFn({ enabled: true, heapSnapshot: true });
  expect(putData.length).toBe(1);
  expect(putData[0].toString('utf-8')).toMatch(/cpuprofile.*heapsnapshot/);
});
