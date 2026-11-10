// Controller mappings. The page ships with the MPK Mini 4 numbers as the
// default preset. A saved mapping lives in localStorage, separate from the
// pattern save file.

const STORAGE_KEY = "io808.controller";

// Steps 1–4 are the top row, 5–8 the bottom row, then bank B the same way.
// Factory pad notes on the Mini 4, Mini mk3, and Mini Plus use this layout.
const PAD_NOTES = [40, 41, 42, 43, 36, 37, 38, 39, 48, 49, 50, 51, 44, 45, 46, 47];

const CC_KEYS = [
  "mod",
  "encoder",
  "encoderPress",
  "shift",
  "minus",
  "plus",
  "tap",
  "record",
  "play",
  "playAlso",
  "stop"
];

export const CC_FIELDS = [
  { key: "mod", label: "Mod wheel" },
  { key: "encoder", label: "Encoder turn" },
  { key: "encoderPress", label: "Encoder press" },
  { key: "shift", label: "Shift" },
  { key: "minus", label: "−" },
  { key: "plus", label: "+" },
  { key: "tap", label: "Tap" },
  { key: "record", label: "Record" },
  { key: "play", label: "Play" },
  { key: "playAlso", label: "Play, also" },
  { key: "stop", label: "Stop" }
];

function miniMap(knobs, buttons) {
  const map = {
    knobs: knobs.slice(),
    pads: PAD_NOTES.slice()
  };
  for (let i = 0; i < CC_KEYS.length; i++) {
    const key = CC_KEYS[i];
    map[key] = buttons && buttons[key] != null ? buttons[key] : null;
  }
  return map;
}

const MINI_4 = miniMap([24, 25, 26, 27, 28, 29, 30, 31], {
  mod: 1,
  encoder: 14,
  encoderPress: 13,
  shift: 17,
  minus: 80,
  plus: 81,
  tap: 82,
  record: 77,
  play: 76,
  playAlso: 118,
  stop: 117
});

// Mini mk3 factory program "PGM: MPC": knobs CC 70–77, mod CC 1,
// bank A notes 36–43, bank B notes 44–51. No transport row.
const MINI_MK3 = miniMap([70, 71, 72, 73, 74, 75, 76, 77], { mod: 1 });

export const CUSTOM_ID = "custom";

export const PRESETS = [
  {
    id: "mpk-mini-4",
    name: "MPK Mini 4",
    detail:
      "Default. Knobs are CC 24–31. Pads are notes 36–51. Play is CC 76 and CC 118, and Stop is CC 117.",
    map: MINI_4
  },
  {
    id: "mpk-mini-mk3",
    name: "MPK Mini mk3",
    detail:
      "Factory program. Knobs are CC 70–77, the joystick mod axis is CC 1, and the pads use notes 36–51. It has no transport row, so those controls are blank.",
    map: MINI_MK3
  },
  {
    id: "mpk-mini-plus",
    name: "MPK Mini Plus",
    detail:
      "The Mini Plus default program uses the same knob CCs (70–77) and pad notes (36–51) as the Mini mk3. Its menu encoder and transport buttons are left blank.",
    map: MINI_MK3
  }
];

function cloneMap(map) {
  const next = {
    knobs: map.knobs.slice(),
    pads: map.pads.slice()
  };
  for (let i = 0; i < CC_KEYS.length; i++) next[CC_KEYS[i]] = map[CC_KEYS[i]];
  return next;
}

function midiNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!isFinite(n) || Math.floor(n) !== n || n < 0 || n > 127) return null;
  return n;
}

function cleanMap(raw) {
  const base = cloneMap(MINI_4);
  if (!raw) return base;
  if (raw.knobs && raw.knobs.length === 8) {
    for (let i = 0; i < 8; i++) base.knobs[i] = midiNumber(raw.knobs[i]);
  }
  if (raw.pads && raw.pads.length === 16) {
    for (let i = 0; i < 16; i++) base.pads[i] = midiNumber(raw.pads[i]);
  }
  for (let i = 0; i < CC_KEYS.length; i++) {
    const key = CC_KEYS[i];
    if (raw[key] === undefined) continue;
    base[key] = midiNumber(raw[key]);
  }
  return base;
}

function sameList(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function sameMap(a, b) {
  if (!sameList(a.knobs, b.knobs) || !sameList(a.pads, b.pads)) return false;
  for (let i = 0; i < CC_KEYS.length; i++) {
    if (a[CC_KEYS[i]] !== b[CC_KEYS[i]]) return false;
  }
  return true;
}

function matchesPreset(id, map) {
  const preset = presetById(id);
  return !!(preset && sameMap(map, preset.map));
}

function readStored() {
  const fresh = { presetId: PRESETS[0].id, map: cloneMap(MINI_4) };
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (!text) return fresh;
    const parsed = JSON.parse(text);
    const map = cleanMap(parsed && parsed.map);
    const id = parsed && parsed.presetId;
    if (matchesPreset(id, map)) return { presetId: id, map: map };
    return { presetId: CUSTOM_ID, map: map };
  } catch (error) {
    return fresh;
  }
}

let current = readStored();
const listeners = [];

function publish() {
  for (let i = 0; i < listeners.length; i++) listeners[i]();
}

function write() {
  if (!matchesPreset(current.presetId, current.map)) {
    const hits = [];
    for (let i = 0; i < PRESETS.length; i++) {
      if (sameMap(current.map, PRESETS[i].map)) hits.push(PRESETS[i].id);
    }
    current.presetId = hits.length === 1 ? hits[0] : CUSTOM_ID;
  }
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ presetId: current.presetId, map: current.map })
    );
  } catch (error) {
    // Private mode can refuse storage. The mapping still works for this visit.
  }
  publish();
}

export function getController() {
  return { presetId: current.presetId, map: current.map };
}

export function subscribeController(listener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

export function presetById(id) {
  for (let i = 0; i < PRESETS.length; i++) {
    if (PRESETS[i].id === id) return PRESETS[i];
  }
  return null;
}

export function applyPreset(id) {
  const preset = presetById(id);
  if (!preset) return;
  current = { presetId: preset.id, map: cloneMap(preset.map) };
  write();
}

export function setKnob(index, value) {
  const next = cloneMap(current.map);
  next.knobs[index] = midiNumber(value);
  current = { presetId: current.presetId, map: next };
  write();
}

export function setCc(key, value) {
  if (CC_KEYS.indexOf(key) < 0) return;
  const next = cloneMap(current.map);
  next[key] = midiNumber(value);
  current = { presetId: current.presetId, map: next };
  write();
}

export function setPad(index, value) {
  const next = cloneMap(current.map);
  next.pads[index] = midiNumber(value);
  current = { presetId: current.presetId, map: next };
  write();
}
