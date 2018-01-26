import enabled from './enabled';

describe('Getting enabled status for profiler', () => {
  it('profiler defaults to false', () => {
    expect(enabled()).toBeFalsy();
  });

  it('profiler with env name and no config var is value of env value', () => {
    process.env.TEST_ENV_VAR = true;
    expect(enabled('TEST_ENV_VAR')).toBeTruthy();
    delete process.env.TEST_ENV_VAR;
  });

  it('profiler env only is env value', () => {
    delete process.env.TEST_ENV_VAR;
    expect(enabled('TEST_ENV_VAR')).toBeFalsy();
    process.env.IOPIPE_ENABLE_PROFILER = false;
    expect(enabled('IOPIPE_ENABLE_PROFILER', true)).toBeFalsy();
    delete process.env.TEST_ENV_VAR;
  });

  it('profiler enabled is true if config key is true', () => {
    delete process.env.TEST_ENV_VAR;
    expect(enabled('TEST_ENV_VAR', true)).toBeTruthy();
  });

  it('profiler is disabled if env is explicit false string', () => {
    process.env.IOPIPE_ENABLE_PROFILER = false;
    expect(enabled('IOPIPE_ENABLE_PROFILER', true)).toBeFalsy();
    delete process.env.IOPIPE_ENABLE_PROFILER;
  });

  it('is true if environment variable set, and overrides config', () => {
    process.env.IOPIPE_ENABLE_PROFILER = true;
    expect(enabled('IOPIPE_ENABLE_PROFILER', true)).toBeTruthy();
    expect(enabled('IOPIPE_ENABLE_PROFILER', false)).toBeTruthy();
    delete process.env.IOPIPE_ENABLE_PROFILER;
  });

  it('is true if environment variable is set but config true', () => {
    process.env.IOPIPE_ENABLE_PROFILER = 'value not true or false';
    expect(enabled('IOPIPE_ENABLE_PROFILER', true)).toBeTruthy();
    delete process.env.IOPIPE_ENABLE_PROFILER;
  });
});
