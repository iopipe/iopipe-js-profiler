const { Readable } = require('stream');

class MockReadable extends Readable {
  constructor(options) {
    super(options);
  }
  /* A readable is "done" when a null is sent. */
  _read(size) { this.push(null); }
}

export const settings = {
  sampleRate: 1,
  running: false,
  recSamples: false,
  profiles: [],
  heapProfiles: []
};

function setSamplingInterval(sampleRate) {
  settings.sampleRate = sampleRate;
}

function startProfiling(name, recSamples) {
  settings.running = true;
  settings.recSamples = recSamples;
}

function stopProfiling() {
  settings.running = false;
  return {
    export: () => {
      settings.profiles.push(1);
      return new MockReadable();
    },
    delete: () => {
      settings.profiles.pop();
    }
  };
}

function takeSnapshot() {
  return {
    export: () => {
      settings.heapProfiles.push(1);
      return new MockReadable();
    },
    delete: () => {
      settings.heapProfiles.pop();
    }
  };
}

export default {
  setSamplingInterval,
  startProfiling,
  stopProfiling,
  takeSnapshot
};
