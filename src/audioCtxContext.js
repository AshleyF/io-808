import React from "react";

import WAAClock from "waaclock";

let audioCtx = undefined;
let clock = undefined;
let pendingInit = null;
const audioReadyListeners = [];
const audioResetListeners = [];

export function subscribeAudioReset(listener) {
  audioResetListeners.push(listener);
  return () => {
    const index = audioResetListeners.indexOf(listener);
    if (index >= 0) audioResetListeners.splice(index, 1);
  };
}

export function resetAudio() {
  const listeners = audioResetListeners.slice();
  listeners.forEach(listener => listener());
  if (clock) {
    try {
      clock.stop();
    } catch (error) {
      // The clock may already be stopped.
    }
  }
  clock = undefined;
  pendingInit = null;
  if (audioCtx) {
    const ctx = audioCtx;
    audioCtx = undefined;
    if (ctx.close) ctx.close();
  }
}

export function subscribeAudioReady(listener) {
  audioReadyListeners.push(listener);
  return () => {
    const index = audioReadyListeners.indexOf(listener);
    if (index >= 0) audioReadyListeners.splice(index, 1);
  };
}

function triggerSilentAudio(audioCtx) {
  const buffer = audioCtx.createBuffer(1, 1, 22050);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);

  if (source.start) {
    source.start(0);
  } else if (source.play) {
    source.play(0);
  } else if (source.noteOn) {
    source.noteOn(0);
  }
}

export function isAudioRunning() {
  return clock != null && audioCtx != null && audioCtx.state === "running";
}

export function currentAudioContext() {
  return audioCtx;
}

export function requestAudioInit() {
  if (audioCtx != null && clock != null) {
    if (audioCtx.state === "suspended" && audioCtx.resume) {
      return audioCtx.resume().catch(() => {});
    }
    return Promise.resolve();
  }
  if (pendingInit) return pendingInit;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return Promise.resolve();
  if (
    audioCtx == null &&
    navigator.userActivation &&
    navigator.userActivation.hasBeenActive === false
  ) {
    return Promise.resolve();
  }

  pendingInit = new Promise(resolve => {
    if (audioCtx == null) audioCtx = new AudioContext();

    const finish = () => {
      if (clock == null && audioCtx.state === "running") {
        triggerSilentAudio(audioCtx);
        clock = new WAAClock(audioCtx, { toleranceEarly: 0.09 });
        audioReadyListeners.forEach(listener => listener());
      }
      pendingInit = null;
      resolve();
    };

    if (audioCtx.state === "suspended" && audioCtx.resume) {
      const resume = audioCtx.resume().catch(() => {});
      const timeout = new Promise(resolve => {
        window.setTimeout(resolve, 300);
      });
      Promise.race([resume, timeout]).then(finish);
    } else {
      finish();
    }
  });

  return pendingInit;
}

const AudioCtxContext = React.createContext({
  getAudioContext: () => audioCtx,
  getClock: () => clock,
  requestInit: () => requestAudioInit()
});

export default AudioCtxContext;
