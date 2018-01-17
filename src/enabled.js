function getProfilerEnabledStatus(enabledStatus) {
  return (
    enabledStatus ||
    (process.env.IOPIPE_ENABLE_PROFILER === 'true' ||
      process.env.IOPIPE_ENABLE_PROFILER === true)
  );
}

function getHeapSnapshotEnabledStatus(enabledStatus) {
  return (
    enabledStatus ||
    (process.env.IOPIPE_ENABLE_HEAPSNAPSHOT === 'true' ||
      process.env.IOPIPE_ENABLE_HEAPSNAPSHOT === true)
  );
}

module.exports = { getProfilerEnabledStatus, getHeapSnapshotEnabledStatus };
