export const settings = {
  sampleRate: 1,
  running: false,
  recSamples: false,
  profiles: []
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
      cb(undefined, 'woot');
    },
    delete: () => {
      settings.profiles.pop();
    }
  };
}

export default {
  setSamplingInterval,
  startProfiling,
  stopProfiling
};
