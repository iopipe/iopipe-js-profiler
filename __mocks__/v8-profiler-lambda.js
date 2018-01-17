const { Readable } = require('stream');

class MockReadable extends Readable {
  constructor(options) {
    super(options);
  }
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
    export: cb => {
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
    export: cb => {
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
