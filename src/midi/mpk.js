import {
  onInstrumentChange,
  onInstrumentTrackChange,
  onMasterVolumeChange,
  onTempoChange,
  onFineTempoChange,
  onPreScaleChange,
  onBasicVariationChange,
  onIFVariationChange,
  onAutoFillInChange,
  onModeChange,
  onStartStopButtonClick,
  onTapButtonClick,
  onStepButtonClick,
  onClearDragDrop,
  onClearDown,
  onClearUp
} from "actionCreators";
import {
  MODE_PATTERN_CLEAR,
  MODE_FIRST_PART,
  MODE_SECOND_PART,
  MODE_MANUAL_PLAY,
  MODE_RHYTHM_TRACK_PLAY,
  MODE_RHYTHM_TRACK_COMPOSE
} from "store-constants";
import stepButtonSelector from "selectors/stepButton";
import { requestAudioInit } from "audioCtxContext";
import { pulse } from "midi/highlight";
import { noteMidiAccess } from "midi/out";
import {
  INSTRUMENTS,
  STEPS,
  dimRgb,
  instrumentById,
  knobLine
} from "midi/map";
import { getController, subscribeController } from "midi/controllerMap";
import {
  assertSysex,
  padColorMessage,
  screenLineMessages,
  screenOwnerMessage
} from "midi/sysex";

const MODE_CYCLE = [
  MODE_PATTERN_CLEAR,
  MODE_FIRST_PART,
  MODE_SECOND_PART,
  MODE_MANUAL_PLAY,
  MODE_RHYTHM_TRACK_PLAY,
  MODE_RHYTHM_TRACK_COMPOSE
];

const STEP_LIGHTS = [];
for (let step = 0; step < 16; step++) {
  STEP_LIGHTS.push(stepButtonSelector(step));
}

let redux = null;
let access = null;
let inputs = [];
let output = null;
let sysexOk = false;
let ownerFor = null;
let connectTask = null;
let lastScreen = "";
let shiftDown = false;
let lengthArmedAt = 0;
let seenState = null;
let statusLine = "";
let painted = new Array(16);
let lastBytes = "";
let lastBytesAt = 0;
const held = new Set();
const lastPress = {};
const stepAt = new Array(16).fill(0);
const knobSeen = {};
const knobSent = {};
const knobLive = {};

const listeners = [];
let snapshot = {
  open: false,
  status: "idle",
  message: "Plug in a controller and connect it."
};

function publish(patch) {
  snapshot = Object.assign({}, snapshot, patch);
  for (let i = 0; i < listeners.length; i++) listeners[i]();
}

export function getMpkSnapshot() {
  return snapshot;
}

export function subscribeMpk(listener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

export function openMpkHelp() {
  publish({ open: true });
}

export function closeMpkHelp() {
  publish({ open: false });
}

export function presentMpk() {
  publish({ open: true });
  if (snapshot.status !== "ready" && snapshot.status !== "connecting") {
    connectMpk();
  }
}

function portList(ports) {
  const list = [];
  if (!ports) return list;
  ports.forEach(port => list.push(port));
  return list;
}

function isMpk(port) {
  return /mpk|akai/i.test(port.name || "");
}

function resetHardwareCache() {
  ownerFor = null;
  lastScreen = "";
  painted = new Array(16);
  Object.keys(knobSeen).forEach(key => delete knobSeen[key]);
  Object.keys(knobSent).forEach(key => delete knobSent[key]);
  Object.keys(knobLive).forEach(key => delete knobLive[key]);
}

function send(bytes) {
  if (!output) return;
  try {
    const result = output.send(bytes);
    if (result && typeof result.catch === "function") {
      result.catch(onSendError);
    }
  } catch (error) {
    onSendError(error);
  }
}

function onSendError() {
  if (!output) return;
  output = null;
  resetHardwareCache();
  publish({
    status: "error",
    message: "The controller output closed. Press Connect and try again."
  });
}

function ensureOwner() {
  if (!output || ownerFor === output) return;
  send(screenOwnerMessage());
  ownerFor = output;
}

const MODE_SCREEN = ["Pattern Clear", "1st Part", "2nd Part", "Manual Play", "Play", "Compose"];
const VARIATION_SCREEN = ["Basic A", "Basic AB", "Basic B"];
const FILL_SCREEN = ["Fill manual", "Fill 16", "Fill 12", "Fill 8", "Fill 4", "Fill 2"];

function screenNumber(n) {
  const rounded = Math.round(n * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) return String(Math.round(rounded));
  return rounded.toFixed(1);
}

function screenSigned(n) {
  const text = screenNumber(n);
  if (n > 0) return "+" + text;
  return text;
}

function watchState(state) {
  const id = state.selectedInstrumentTrack;
  const slot = state.instrumentState[id] || {};
  return {
    id: id,
    level: slot.level,
    tone: slot.tone,
    decay: slot.decay,
    snappy: slot.snappy,
    tuning: slot.tuning,
    selector: slot.selector,
    master: state.masterVolume,
    tempo: state.tempo,
    fine: state.fineTempo,
    preScale: state.preScalePosition,
    variation: state.basicVariationPosition,
    fill: state.autoFillInPosition,
    mode: state.selectedMode,
    playing: state.playing,
    intro: state.introFillVariationPosition,
    pattern: state.selectedPattern,
    playPattern: state.selectedPlayPattern,
    playFill: state.selectedPlayFillPattern,
    fillScheduled: state.fillScheduled,
    steps: state.steps,
    lengths: state.patternLengths
  };
}

function stepNote(prevSteps, nextSteps) {
  const keys = Object.keys(nextSteps);
  let count = 0;
  let note = "";
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (prevSteps[key] === nextSteps[key]) continue;
    count++;
    if (count > 1) return "Cleared";
    const match = /STEP_(\d+)/.exec(key);
    const n = match ? Number(match[1]) + 1 : 0;
    note = "Step " + n + (nextSteps[key] ? " on" : " off");
  }
  return note;
}

function lengthNote(prevLengths, nextLengths) {
  const keys = Object.keys(nextLengths);
  let count = 0;
  let note = "";
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (prevLengths[key] === nextLengths[key]) continue;
    count++;
    if (count > 1) return "Length";
    note = "Length " + nextLengths[key];
  }
  return note;
}

function describeChange(prev, next) {
  if (prev.mode !== next.mode) return MODE_SCREEN[next.mode] || "Mode";
  if (prev.playing !== next.playing) return next.playing ? "Play" : "Stop";

  const notes = [];
  if (prev.id !== next.id) {
    if (
      next.mode === MODE_RHYTHM_TRACK_PLAY ||
      next.mode === MODE_RHYTHM_TRACK_COMPOSE
    ) {
      notes.push("Track " + (next.id + 1));
    } else {
      notes.push(instrumentById(next.id).name);
    }
  } else {
    if (prev.selector !== next.selector) {
      const inst = instrumentById(next.id);
      const which = Number(next.selector) === 1 ? 1 : 0;
      notes.push(inst.voices ? inst.voices[which] : "Voice");
    }
    if (prev.level !== next.level) notes.push("Level " + screenNumber(next.level));
    if (prev.tone !== next.tone) notes.push("Tone " + screenNumber(next.tone));
    if (prev.decay !== next.decay) notes.push("Decay " + screenNumber(next.decay));
    if (prev.snappy !== next.snappy) notes.push("Snappy " + screenNumber(next.snappy));
    if (prev.tuning !== next.tuning) notes.push("Tuning " + screenNumber(next.tuning));
  }
  if (prev.master !== next.master) notes.push("Master " + screenNumber(next.master));
  if (prev.tempo !== next.tempo) notes.push("Tempo " + screenNumber(next.tempo));
  if (prev.fine !== next.fine) notes.push("Fine " + screenSigned(next.fine));
  if (prev.preScale !== next.preScale) {
    notes.push("Prescale " + ((next.preScale == null ? 2 : next.preScale) + 1));
  }
  if (prev.variation !== next.variation) {
    notes.push(VARIATION_SCREEN[next.variation] || "Variation");
  }
  if (prev.fill !== next.fill) notes.push(FILL_SCREEN[next.fill] || "Fill");
  if (prev.intro !== next.intro) notes.push(next.intro === 0 ? "I/F A" : "I/F B");
  if (prev.fillScheduled !== next.fillScheduled) {
    notes.push(next.fillScheduled ? "Fill armed" : "Fill off");
  }
  if (prev.pattern !== next.pattern) notes.push("Pattern " + (next.pattern + 1));
  if (prev.playPattern !== next.playPattern) {
    notes.push("Pattern " + (next.playPattern + 1));
  }
  if (prev.playFill !== next.playFill) notes.push("Fill " + (next.playFill + 1));
  if (prev.steps !== next.steps) {
    const note = stepNote(prev.steps, next.steps);
    if (note) notes.push(note);
  }
  if (prev.lengths !== next.lengths) {
    const note = lengthNote(prev.lengths, next.lengths);
    if (note) notes.push(note);
  }
  if (notes.length === 1) return notes[0];
  return "";
}

function statusText(state) {
  const next = watchState(state);
  if (!seenState) {
    seenState = next;
    statusLine = instrumentById(next.id).name;
    return statusLine;
  }
  const note = describeChange(seenState, next);
  seenState = next;
  if (note) statusLine = note;
  return statusLine;
}

function screenLines(state) {
  const inst = instrumentById(state.selectedInstrumentTrack);
  return [inst.screen, knobLine(inst.extra), statusText(state)];
}

export function syncHardware(state) {
  if (!state) return;
  const lines = screenLines(state);
  if (!output || !sysexOk) return;
  ensureOwner();
  for (let step = 0; step < 16; step++) {
    const on = !!STEP_LIGHTS[step](state);
    if (painted[step] === on) continue;
    painted[step] = on;
    const pad = STEPS[step];
    send(padColorMessage(pad.pad, on ? pad.rgb : dimRgb(pad.rgb)));
  }
  const key = lines.join("\n");
  if (key !== lastScreen) {
    lastScreen = key;
    const bg = { r: 0, g: 0, b: 0 };
    const fg = { r: 255, g: 255, b: 255 };
    for (let line = 0; line < lines.length; line++) {
      const messages = screenLineMessages(line, lines[line], bg, fg);
      send(messages[0]);
      send(messages[1]);
    }
  }
  placeKnobs(state);
}

function describe() {
  if (!inputs.length) {
    return {
      status: "error",
      message:
        "MIDI is allowed, but no controller is connected. Plug one in and press Connect."
    };
  }
  const names = inputs
    .map(port => port.name || "Controller")
    .filter((name, index, all) => all.indexOf(name) === index)
    .join(", ");
  let message = "Listening on " + names + ".";
  if (output && !sysexOk) {
    message += " Pad lights need SysEx permission. Press Connect and allow it.";
  } else if (output) {
    message += " Pad lights go out through " + (output.name || "the controller") + ".";
  }
  return { status: "ready", message };
}

function bindPorts() {
  if (!access) return;
  for (let i = 0; i < inputs.length; i++) inputs[i].onmidimessage = null;
  inputs = portList(access.inputs);
  for (let i = 0; i < inputs.length; i++) inputs[i].onmidimessage = onMidi;
  const pool = portList(access.outputs).filter(isMpk);
  const next =
    pool.find(port => /plugin|midiout\s*3|port\s*3/i.test(port.name || "")) ||
    (pool.length >= 3 ? pool[2] : null) ||
    pool[0] ||
    null;
  if (next !== output) {
    output = next;
    resetHardwareCache();
  }
  publish(describe());
  noteMidiAccess(access);
  if (redux) syncHardware(redux.getState());
}

function acceptAccess(midiAccess) {
  access = midiAccess;
  sysexOk = midiAccess.sysexEnabled !== false;
  midiAccess.onstatechange = bindPorts;
  bindPorts();
}

export function connectMpk() {
  if (connectTask) return connectTask;
  if (
    typeof navigator === "undefined" ||
    typeof navigator.requestMIDIAccess !== "function"
  ) {
    publish({
      status: "error",
      message: "This browser has no Web MIDI. Open the page in Chrome or Edge."
    });
    return Promise.resolve();
  }
  publish({ status: "connecting", message: "Waiting for MIDI access…" });
  connectTask = navigator
    .requestMIDIAccess({ sysex: true })
    .catch(() => navigator.requestMIDIAccess())
    .then(acceptAccess)
    .catch(error => {
      publish({
        status: "error",
        message:
          (error && error.message) ||
          "MIDI access was blocked. Press Connect and allow this page to use MIDI."
      });
    })
    .then(() => {
      connectTask = null;
    });
  return connectTask;
}

function same(a, b) {
  return Math.abs(a - b) < 0.0005;
}

function scale(cc, min, max, step) {
  const steps = Math.round((max - min) / step);
  const n = Math.max(0, Math.min(steps, Math.round((cc / 127) * steps)));
  return Math.round((min + n * step) * 1000) / 1000;
}

function zone(cc, count) {
  const index = Math.floor((cc * count) / 128);
  return index >= count ? count - 1 : index;
}

function ccForValue(value, min, max, step) {
  const steps = Math.round((max - min) / step);
  if (!steps) return 0;
  const n = Math.max(0, Math.min(steps, Math.round((value - min) / step)));
  return Math.max(0, Math.min(127, Math.round((n / steps) * 127)));
}

function ccForZone(index, count) {
  const width = 128 / count;
  return Math.max(0, Math.min(127, Math.round(index * width + width / 2)));
}

// Endless knobs send 1 for one step up and 127 for one step down.
function relativeDelta(value) {
  if (value === 1 || value === 127) return value === 1 ? 1 : -1;
  return 0;
}

function rememberKnob(key, cc) {
  knobSeen[key] = cc;
  knobSent[key] = cc;
}

function setRange(key, cc, current, min, max, step, apply) {
  if (knobSent[key] === cc) return false;
  const parked = knobSent[key] != null;
  const dir = relativeDelta(cc);
  if (!parked && dir !== 0) {
    const next = Math.min(max, Math.max(min, current + dir * step));
    const rounded = Math.round(next * 1000) / 1000;
    if (!same(rounded, current)) apply(rounded);
    return true;
  }
  if (knobSeen[key] === cc) return false;
  rememberKnob(key, cc);
  const target = scale(cc, min, max, step);
  if (!same(target, current)) apply(target);
  return true;
}

// Mode shares the whole 0–127 travel: 0 is Pattern Clear, 127 is Compose.
// The encoder stays where it is turned. It is only sent back to the middle
// of the on-screen position when that position was chosen somewhere else.
function travelZone(key, ccNumber, cc, current, count, apply) {
  if (knobSent[key] === cc) return false;
  const prev = knobSeen[key];
  if (prev == null) {
    const park = ccForZone(current, count);
    rememberKnob(key, park);
    knobLive[key] = false;
    send([0xb0, ccNumber, park]);
    return false;
  }
  const dir = relativeDelta(cc);
  if (dir !== 0 && Math.abs(cc - prev) > 2) {
    const nextPos = Math.max(0, Math.min(127, prev + dir));
    knobSeen[key] = nextPos;
    const stepped = zone(nextPos, count);
    if (stepped !== current) apply(stepped);
    return stepped !== current;
  }
  let delta = cc - prev;
  if (delta > 64) delta -= 128;
  if (delta < -64) delta += 128;
  if (Math.abs(delta) > 16 && zone(cc, count) !== current && !knobLive[key]) {
    const park = ccForZone(current, count);
    if (knobSent[key] !== park) {
      rememberKnob(key, park);
      knobLive[key] = false;
      send([0xb0, ccNumber, park]);
    }
    return false;
  }
  if (cc === prev) return false;
  knobLive[key] = true;
  knobSeen[key] = cc;
  const target = zone(cc, count);
  if (target !== current) apply(target);
  return target !== current;
}

function setZone(key, cc, current, count, apply, invert) {
  if (knobSent[key] === cc) return false;
  const parked = knobSent[key] != null;
  const dir = relativeDelta(cc);
  if (!parked && dir !== 0) {
    const step = invert ? -dir : dir;
    const next = Math.min(count - 1, Math.max(0, current + step));
    if (next !== current) apply(next);
    return true;
  }
  if (knobSeen[key] === cc) return false;
  rememberKnob(key, cc);
  let target = zone(cc, count);
  if (invert) target = count - 1 - target;
  if (target !== current) apply(target);
  return true;
}

function placeKnob(key, ccNumber, targetCc) {
  if (knobSent[key] === targetCc) return;
  rememberKnob(key, targetCc);
  knobLive[key] = false;
  send([0xb0, ccNumber, targetCc]);
}

function valueParked(key, value, min, max, step) {
  if (knobSeen[key] == null) return false;
  return same(scale(knobSeen[key], min, max, step), scale(ccForValue(value, min, max, step), min, max, step));
}

function placeKnobs(state) {
  if (!output || !state) return;
  const map = getController().map;
  const knobs = map.knobs;
  const id = state.selectedInstrumentTrack;
  const slot = state.instrumentState[id] || {};
  const inst = instrumentById(id);
  if (knobs[0] != null && !valueParked("k1", slot.level, 0, 100, 2)) {
    placeKnob("k1", knobs[0], ccForValue(slot.level, 0, 100, 2));
  }
  if (
    knobs[1] != null &&
    inst.extra[0] != null &&
    !valueParked("k2", slot[inst.extra[0]], 0, 100, 2)
  ) {
    placeKnob("k2", knobs[1], ccForValue(slot[inst.extra[0]], 0, 100, 2));
  }
  if (
    knobs[2] != null &&
    inst.extra[1] != null &&
    !valueParked("k3", slot[inst.extra[1]], 0, 100, 2)
  ) {
    placeKnob("k3", knobs[2], ccForValue(slot[inst.extra[1]], 0, 100, 2));
  }
  if (knobs[7] != null && !valueParked("master", state.masterVolume, 0, 100, 1)) {
    placeKnob("master", knobs[7], ccForValue(state.masterVolume, 0, 100, 1));
  }
  if (knobs[5] != null && !valueParked("fine", state.fineTempo, -6.75, 6.75, 0.1)) {
    placeKnob("fine", knobs[5], ccForValue(state.fineTempo, -6.75, 6.75, 0.1));
  }
  if (map.mod != null && !valueParked("mod", state.tempo, 30, 300, 6.75)) {
    placeKnob("mod", map.mod, ccForValue(state.tempo, 30, 300, 6.75));
  }
  if (
    knobs[4] != null &&
    (knobSeen.fill == null || zone(knobSeen.fill, 6) !== state.autoFillInPosition)
  ) {
    placeKnob("fill", knobs[4], ccForZone(state.autoFillInPosition, 6));
  }
  const scalePos = state.preScalePosition == null ? 2 : state.preScalePosition;
  if (
    knobs[6] != null &&
    (knobSeen.scale == null || 3 - zone(knobSeen.scale, 4) !== scalePos)
  ) {
    placeKnob("scale", knobs[6], ccForZone(3 - scalePos, 4));
  }
  const modeIndex = MODE_CYCLE.indexOf(state.selectedMode);
  if (
    knobs[3] != null &&
    modeIndex >= 0 &&
    (knobSeen.mode == null || zone(knobSeen.mode, MODE_CYCLE.length) !== modeIndex)
  ) {
    placeKnob("mode", knobs[3], ccForZone(modeIndex, MODE_CYCLE.length));
  }
}

function selectedExtra(state, index) {
  return instrumentById(state.selectedInstrumentTrack).extra[index];
}

function onKnob(state, slot, value) {
  const id = state.selectedInstrumentTrack;
  const ccNumber = getController().map.knobs[slot];
  if (slot === 0) {
    if (
      setRange(
        "k1",
        value,
        state.instrumentState[id].level,
        0,
        100,
        2,
        next => redux.dispatch(onInstrumentChange(id, "level", next))
      )
    ) {
      pulse("level-" + id);
    }
    return;
  }
  if (slot === 1 || slot === 2) {
    const control = selectedExtra(state, slot - 1);
    if (!control) return;
    if (
      setRange(
        slot === 1 ? "k2" : "k3",
        value,
        state.instrumentState[id][control],
        0,
        100,
        2,
        next => redux.dispatch(onInstrumentChange(id, control, next))
      )
    ) {
      pulse(control + "-" + id);
    }
    return;
  }
  if (slot === 3) {
    const found = MODE_CYCLE.indexOf(state.selectedMode);
    const current = found < 0 ? 0 : found;
    if (
      travelZone("mode", ccNumber, value, current, MODE_CYCLE.length, next =>
        redux.dispatch(onModeChange(MODE_CYCLE[next]))
      )
    ) {
      pulse("mode");
    }
    return;
  }
  if (slot === 4) {
    if (
      setZone("fill", value, state.autoFillInPosition, 6, next =>
        redux.dispatch(onAutoFillInChange(next))
      )
    ) {
      pulse("autoFill");
    }
    return;
  }
  if (slot === 5) {
    if (
      setRange("fine", value, state.fineTempo, -6.75, 6.75, 0.1, next =>
        redux.dispatch(onFineTempoChange(next))
      )
    ) {
      pulse("fine");
    }
    return;
  }
  if (slot === 6) {
    const current = state.preScalePosition == null ? 2 : state.preScalePosition;
    if (
      setZone(
        "scale",
        value,
        current,
        4,
        next => redux.dispatch(onPreScaleChange(next)),
        true
      )
    ) {
      pulse("preScale");
    }
    return;
  }
  if (slot === 7) {
    if (
      setRange("master", value, state.masterVolume, 0, 100, 1, next =>
        redux.dispatch(onMasterVolumeChange(next))
      )
    ) {
      pulse("master");
    }
  }
}

function rising(name, portId, ch, cc, value) {
  const key = portId + ":" + ch + ":" + cc;
  if (value > 0) {
    if (held.has(key)) return false;
    held.add(key);
  } else {
    held.delete(key);
    return false;
  }
  const now = performance.now();
  if (lastPress[name] && now - lastPress[name] < 120) return false;
  lastPress[name] = now;
  return true;
}

function nudgeInstrument(state, dir) {
  const count = INSTRUMENTS.length;
  let next = state.selectedInstrumentTrack + dir;
  if (next < 0) next = count - 1;
  if (next >= count) next = 0;
  redux.dispatch(onInstrumentTrackChange(next));
  pulse("instrument");
}

function onMinusPlus(state, plus) {
  pulse("variation");
  const pos = state.basicVariationPosition;
  const next = plus ? Math.min(2, pos + 1) : Math.max(0, pos - 1);
  if (next !== pos) redux.dispatch(onBasicVariationChange(next));
}

function onIntroFill(state, plus) {
  pulse("introFill");
  const pos = state.introFillVariationPosition;
  const next = plus ? Math.min(1, pos + 1) : Math.max(0, pos - 1);
  if (next !== pos) redux.dispatch(onIFVariationChange(next));
}

function onEncoderPress(state) {
  const id = state.selectedInstrumentTrack;
  const inst = instrumentById(id);
  if (!inst.voices) return;
  pulse("voice-" + id);
  const current = Number(state.instrumentState[id].selector) === 1 ? 1 : 0;
  redux.dispatch(onInstrumentChange(id, "selector", current === 0 ? 1 : 0));
}

function press(name, portId, ch, cc, value) {
  const key = name + ":" + portId + ":" + ch + ":" + cc;
  if (value <= 0) {
    held.delete(key);
    return false;
  }
  if (held.has(key)) return false;
  held.add(key);
  window.setTimeout(() => held.delete(key), 300);
  const now = performance.now();
  if (lastPress[name] && now - lastPress[name] < 250) return false;
  lastPress[name] = now;
  return true;
}

function onTransportMessage(portId, ch, cc, value) {
  if (!press("transport", portId, ch, cc, value)) return;
  pulse("start");
  requestAudioInit();
  redux.dispatch(onStartStopButtonClick());
}

function onModWheel(state, value) {
  if (
    setRange("mod", value, state.tempo, 30, 300, 6.75, next =>
      redux.dispatch(onTempoChange(next))
    )
  ) {
    pulse("tempo");
  }
}

function onEncoder(state, value) {
  if (value === 0) return;
  nudgeInstrument(state, value === 1 ? 1 : -1);
}

function onCC(state, cc, value, ch, portId) {
  const map = getController().map;
  if (map.encoderPress != null && cc === map.encoderPress) {
    if (rising("encoder-press", portId, ch, cc, value)) onEncoderPress(state);
    return;
  }
  if (map.encoder != null && cc === map.encoder) {
    onEncoder(state, value);
    return;
  }
  if (map.shift != null && cc === map.shift) {
    shiftDown = value > 0;
    return;
  }
  if (map.record != null && cc === map.record) {
    if (!press("record", portId, ch, cc, value)) return;
    pulse("clear");
    if (
      state.selectedMode === MODE_PATTERN_CLEAR ||
      state.selectedMode === MODE_RHYTHM_TRACK_COMPOSE
    ) {
      lengthArmedAt = 0;
      redux.dispatch(onClearDown());
      redux.dispatch(onClearUp());
    } else if (
      state.selectedMode === MODE_FIRST_PART ||
      state.selectedMode === MODE_SECOND_PART
    ) {
      lengthArmedAt = performance.now();
    }
    return;
  }
  if (
    (map.minus != null && cc === map.minus) ||
    (map.plus != null && cc === map.plus)
  ) {
    const up = cc === map.plus;
    if (rising(up ? "plus" : "minus", portId, ch, cc, value)) {
      if (shiftDown) onIntroFill(state, up);
      else onMinusPlus(state, up);
    }
    return;
  }
  if (map.tap != null && cc === map.tap) {
    if (press("tap", portId, ch, cc, value)) {
      pulse("tap");
      redux.dispatch(onTapButtonClick());
    }
    return;
  }
  if (
    (map.play != null && cc === map.play) ||
    (map.playAlso != null && cc === map.playAlso) ||
    (map.stop != null && cc === map.stop)
  ) {
    onTransportMessage(portId, ch, cc, value);
    return;
  }
  if (map.mod != null && cc === map.mod) {
    onModWheel(state, value);
    return;
  }
  const slot = map.knobs.indexOf(cc);
  if (slot >= 0) onKnob(state, slot, value);
}

function onMidi(event) {
  if (!redux) return;
  const data = event.data;
  if (!data || data.length < 1) return;
  const status = data[0];
  if (status >= 0xf0) return;
  const key = status + ":" + data[1] + ":" + data[2];
  const now = performance.now();
  if (key === lastBytes && now - lastBytesAt < 5) return;
  lastBytes = key;
  lastBytesAt = now;

  const cmd = status & 0xf0;
  if (cmd === 0x90) {
    const velocity = data[2] || 0;
    if (velocity === 0) return;
    const pads = getController().map.pads;
    let step = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i] === data[1]) {
        step = i;
        break;
      }
    }
    if (step == null) return;
    if (now - stepAt[step] < 40) return;
    stepAt[step] = now;
    const mode = redux.getState().selectedMode;
    if (
      lengthArmedAt &&
      now - lengthArmedAt < 4000 &&
      (mode === MODE_FIRST_PART || mode === MODE_SECOND_PART)
    ) {
      lengthArmedAt = 0;
      pulse("clear");
      redux.dispatch(onClearDragDrop(step + 1));
      return;
    }
    pulse("step-" + step);
    redux.dispatch(onStepButtonClick(step));
    return;
  }
  if (cmd === 0xb0 && data.length >= 3) {
    const portId = event.target && event.target.id ? event.target.id : "";
    onCC(redux.getState(), data[1], data[2], (status & 0x0f) + 1, portId);
  }
}

export function attachMpk(store) {
  if (redux) return;
  redux = store;
  try {
    assertSysex();
  } catch (error) {
    console.error(error);
  }
  store.subscribe(() => syncHardware(store.getState()));
  subscribeController(() => {
    Object.keys(knobSeen).forEach(key => delete knobSeen[key]);
    Object.keys(knobSent).forEach(key => delete knobSent[key]);
    Object.keys(knobLive).forEach(key => delete knobLive[key]);
    if (redux) syncHardware(redux.getState());
  });
  window.addEventListener("click", () => {
    requestAudioInit();
  });
  connectMpk();
}
