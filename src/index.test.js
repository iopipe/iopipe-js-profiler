import mockContext from 'aws-lambda-mock-context';
import _ from 'lodash';
import iopipe from '@iopipe/core';
import nock from 'nock';

import pkg from '../package';

const profiler = require('./index');

process.env.IOPIPE_TOKEN = 'test';

const putData = [];

beforeEach(() => {
  // reset mock data holder for each test
  putData.length = 0;

  // intercept http calls
  nock(/signer/)
    .post('/')
    .reply(200, { jwtAccess: '1234', signedRequest: 'https://aws.com' });

  nock(/aws\.com/)
    .put('/', body => {
      putData.push(body);
      return body;
    })
    .reply(200);
});

test('Can instantiate plugin without options', () => {
  const plugin = profiler();
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
  const pluginWithOptions = profiler({
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

async function runFn(opts, fn = (e, ctx) => ctx.succeed('pass')) {
  const context = mockContext();
  let inspectableInv;
  iopipe({
    plugins: [profiler(opts), inv => (inspectableInv = inv)]
  })(fn)({}, context);
  const val = await context.Promise;
  expect(inspectableInv.report.report.labels).toContain(
    '@iopipe/plugin-profiler'
  );
  return val;
}

test('Works with profiler enabled', async function runTest() {
  await runFn({ enabled: true });
  expect(putData).toHaveLength(1);
  expect(putData[0].toString()).toMatch(/profile\.cpuprofile/);
});

test('Works with heapSnapshot enabled', async function runTest() {
  await runFn({ heapSnapshot: true });
  expect(putData).toHaveLength(1);
  expect(putData[0].toString()).toMatch(/profile\.heapsnapshot/);
});

test('Works with both enabled', async function runTest() {
  await runFn({ enabled: true, heapSnapshot: true });
  expect(putData).toHaveLength(1);
  expect(putData[0].toString()).toMatch(/cpuprofile[^]+heapsnapshot/);
});
