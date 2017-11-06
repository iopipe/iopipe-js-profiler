export default function getEnabledStatus(enabledStatus) {
  return (
    enabledStatus ||
    (process.env.IOPIPE_ENABLE_PROFILER === 'true' ||
      process.env.IOPIPE_ENABLE_PROFILER === true)
  );
}
