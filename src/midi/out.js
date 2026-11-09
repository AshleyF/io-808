import {
  BASS_DRUM,
  SNARE_DRUM,
  LOW_CONGA_LOW_TOM,
  MID_CONGA_MID_TOM,
  HI_CONGA_HI_TOM,
  CLAVES_RIMSHOT,
  MARACAS_HANDCLAP,
  COWBELL,
  CYMBAL,
  OPEN_HIHAT,
  CLSD_HIHAT
} from "store-constants";

const listeners = new Set();

let mode = "audio";
let outputId = "";
let access = null;
let outputs = [];
let pendingAccess = null;

function snapshot() {
  return {
    mode,
    outputId,
    ready: access != null,
    outputs: outputs.map(port => ({
      id: port.id,
      name: port.name || "MIDI output"
    }))
  };
}

function emit() {
  listeners.forEach(listener => listener());
}

export function getSoundSnapshot() {
  return snapshot();
}

export function subscribeSound(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isMidiMode() {
  return mode === "midi";
}

function refreshPorts() {
  outputs = access ? Array.from(access.outputs.values()) : [];
  if (outputId && !outputs.some(port => port.id === outputId)) {
    outputId = "";
    mode = "audio";
  }
  emit();
}

export function noteMidiAccess(midiAccess) {
  if (!midiAccess) return;
  access = midiAccess;
  refreshPorts();
}

export function ensureMidiOutputs() {
  if (access) {
    refreshPorts();
    return;
  }
  emit();
  if (pendingAccess || typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
    return;
  }
  pendingAccess = navigator
    .requestMIDIAccess()
    .then(midi => {
      access = midi;
      const prior = midi.onstatechange;
      midi.onstatechange = event => {
        if (typeof prior === "function") prior(event);
        refreshPorts();
      };
      refreshPorts();
    })
    .catch(() => emit())
    .then(() => {
      pendingAccess = null;
    });
}

export function chooseOutput(id) {
  if (!id) {
    outputId = "";
    mode = "audio";
    emit();
    return;
  }
  outputId = id;
  mode = "midi";
  emit();
}

function currentOutput() {
  if (!access || !outputId) return null;
  return access.outputs.get(outputId) || null;
}

export function playDrum(note, velocity) {
  if (mode !== "midi" || !note) return;
  const port = currentOutput();
  if (!port) return;
  const vel = Math.max(1, Math.min(127, velocity | 0));
  try {
    port.send([0x99, note, vel]);
  } catch (error) {
    return;
  }
  window.setTimeout(() => {
    try {
      port.send([0x89, note, 0]);
    } catch (error) {
      // The port can close between the note and its release.
    }
  }, 80);
}

// General MIDI drum notes, channel 10. The second voice is the tom, rimshot, or clap.
export function drumNote(id, selector) {
  const alt = Number(selector) === 1;
  switch (id) {
    case BASS_DRUM:
      return 36;
    case SNARE_DRUM:
      return 38;
    case LOW_CONGA_LOW_TOM:
      return alt ? 45 : 64;
    case MID_CONGA_MID_TOM:
      return alt ? 47 : 63;
    case HI_CONGA_HI_TOM:
      return alt ? 50 : 62;
    case CLAVES_RIMSHOT:
      return alt ? 37 : 75;
    case MARACAS_HANDCLAP:
      return alt ? 39 : 70;
    case COWBELL:
      return 56;
    case CYMBAL:
      return 49;
    case OPEN_HIHAT:
      return 46;
    case CLSD_HIHAT:
      return 42;
    default:
      return 0;
  }
}
