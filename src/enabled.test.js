import * as enabled from './enabled';

describe('Getting enabled status for profiler', () => {
  it('profiler defaults to false', () => {
    expect(enabled.getProfilerEnabledStatus()).toBeFalsy();
  });

  it('profiler enabled is true if enabled flag passed', () => {
    expect(enabled.getProfilerEnabledStatus(true)).toBeTruthy();
  });

  it('is true if environment variable set, and overrides config', () => {
    process.env.IOPIPE_ENABLE_PROFILER = true;
    expect(enabled.getProfilerEnabledStatus()).toBeTruthy();
    expect(enabled.getProfilerEnabledStatus(false)).toBeTruthy();
    delete process.env.IOPIPE_ENABLE_PROFILER;
  });

  it('is true if environment variable is set but config true', () => {
    process.env.IOPIPE_ENABLE_PROFILER = 'foo';
    expect(enabled.getProfilerEnabledStatus(true)).toBeTruthy();
    delete process.env.IOPIPE_ENABLE_PROFILER;
  });
});

describe('Getting enabled status for heapsnapshot', () => {
  it('heapsnapshot defaults to false', () => {
    expect(enabled.getHeapSnapshotEnabledStatus()).toBeFalsy();
  });

  it('heapsnapshot enabled is true if enabled flag passed', () => {
    expect(enabled.getHeapSnapshotEnabledStatus(true)).toBeTruthy();
  });

  it('is true if environment variable set, and overrides config', () => {
    process.env.IOPIPE_ENABLE_HEAPSNAPSHOT = true;
    expect(enabled.getHeapSnapshotEnabledStatus()).toBeTruthy();
    expect(enabled.getHeapSnapshotEnabledStatus(false)).toBeTruthy();
    delete process.env.IOPIPE_ENABLE_HEAPSNAPSHOT;
  });

  it('is true if environment variable is set but config true', () => {
    process.env.IOPIPE_ENABLE_HEAPSNAPSHOT = 'foo';
    expect(enabled.getHeapSnapshotEnabledStatus(true)).toBeTruthy();
    delete process.env.IOPIPE_ENABLE_HEAPSNAPSHOT;
  });
});
