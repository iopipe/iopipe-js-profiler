import check from './enabled';

describe('Getting enabled status of plugin', () => {
  it('defaults to false', () => {
    expect(check()).toBeFalsy();
  });

  it('is true if enabled flag passed', () => {
    expect(check(true)).toBeTruthy();
  });

  it('is true if environment variable set, and overrides config', () => {
    process.env.IOPIPE_ENABLE_PROFILER = true;
    expect(check()).toBeTruthy();
    expect(check(false)).toBeTruthy();
    delete process.env.IOPIPE_ENABLE_PROFILER;
  });

  it('is true if environment variable is set but config true', () => {
    process.env.IOPIPE_ENABLE_PROFILER = 'foo';
    expect(check(true)).toBeTruthy();
    delete process.env.IOPIPE_ENABLE_PROFILER;
  });
});
