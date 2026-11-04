import {
  ACCENT,
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

// Instrument ids match store-constants. extra[0] is MPK knob 2 and extra[1]
// is knob 3, in the same rows as the knobs under Level. null means that knob
// does nothing while this instrument is selected.
export const INSTRUMENTS = [
  {
    id: ACCENT,
    name: "Accent",
    screen: "ACCENT",
    extra: [null, null],
    voices: null
  },
  {
    id: BASS_DRUM,
    name: "Bass Drum",
    screen: "BASS DRUM",
    extra: ["tone", "decay"],
    voices: null
  },
  {
    id: SNARE_DRUM,
    name: "Snare Drum",
    screen: "SNARE",
    extra: ["tone", "snappy"],
    voices: null
  },
  {
    id: LOW_CONGA_LOW_TOM,
    name: "Low Conga/Tom",
    screen: "LOW C/T",
    extra: ["tuning", null],
    voices: ["Low Conga", "Low Tom"]
  },
  {
    id: MID_CONGA_MID_TOM,
    name: "Mid Conga/Tom",
    screen: "MID C/T",
    extra: ["tuning", null],
    voices: ["Mid Conga", "Mid Tom"]
  },
  {
    id: HI_CONGA_HI_TOM,
    name: "Hi Conga/Tom",
    screen: "HI C/T",
    extra: ["tuning", null],
    voices: ["Hi Conga", "Hi Tom"]
  },
  {
    id: CLAVES_RIMSHOT,
    name: "Claves/Rimshot",
    screen: "CLAVE",
    extra: [null, null],
    voices: ["Claves", "Rimshot"]
  },
  {
    id: MARACAS_HANDCLAP,
    name: "Maracas/Handclap",
    screen: "CLAP",
    extra: [null, null],
    voices: ["Maracas", "Handclap"]
  },
  {
    id: COWBELL,
    name: "Cowbell",
    screen: "COWBELL",
    extra: [null, null],
    voices: null
  },
  {
    id: CYMBAL,
    name: "Cymbal",
    screen: "CYMBAL",
    extra: ["tone", "decay"],
    voices: null
  },
  {
    id: OPEN_HIHAT,
    name: "Open Hi-hat",
    screen: "OPEN HAT",
    extra: [null, "decay"],
    voices: null
  },
  {
    id: CLSD_HIHAT,
    name: "Closed Hi-hat",
    screen: "CLSD HAT",
    extra: [null, null],
    voices: null
  }
];

export const CONTROL_LABELS = {
  level: "Level",
  tone: "Tone",
  decay: "Decay",
  snappy: "Snappy",
  tuning: "Tuning"
};

export const CONTROL_SHORT = {
  level: "Lvl",
  tone: "Tone",
  decay: "Dcy",
  snappy: "Snap",
  tuning: "Tune"
};

export const HINT = {
  instrument: "MPK encoder · instrument",
  master: "MPK knob 8 · master",
  tempo: "MPK mod wheel · tempo",
  fine: "MPK knob 6 · fine tempo",
  variation: "MPK − and + · basic variation",
  introFill: "MPK Shift and − / + · I/F variation",
  preScale: "MPK knob 7 · pre-scale",
  autoFill: "MPK knob 5 · auto fill",
  start: "MPK Stop/Play",
  tap: "MPK Tap · intro/fill",
  mode: "MPK knob 4 · mode",
  clear:
    "MPK Record clears in Pattern Clear. Record, then a pad, sets the length."
};

// Knobs 1–8 are CC 24–31, the numbers Akai's MPK Mini 4 playground reads.
export const KNOBS = [
  {
    n: 1,
    cc: 24,
    name: "Level",
    detail: "Level of the instrument selected with the center encoder."
  },
  {
    n: 2,
    cc: 25,
    name: "Tone or tuning",
    detail:
      "Tone, or tuning, when that instrument has it. Idle for accent, cowbell, claves, maracas, and the hats."
  },
  {
    n: 3,
    cc: 26,
    name: "Decay or snappy",
    detail:
      "Decay or snappy when that instrument has it. Open hat decay is this knob. Idle when the column has no third control."
  },
  {
    n: 4,
    cc: 27,
    name: "Mode",
    detail: "Pattern Clear, 1st Part, 2nd Part, and Manual Play."
  },
  {
    n: 5,
    cc: 28,
    name: "Auto fill in",
    detail: "Manual, then every 16, 12, 8, 4, or 2 measures."
  },
  {
    n: 6,
    cc: 29,
    name: "Fine tempo",
    detail: "Fine tempo. The mod wheel is the main tempo."
  },
  {
    n: 7,
    cc: 30,
    name: "Pre-scale",
    detail:
      "How many steps make one beat. 1 is 3 steps, 2 is 6, 3 is 4, and 4 is 8. 3 is the normal setting."
  },
  {
    n: 8,
    cc: 31,
    name: "Master volume",
    detail: "Master volume."
  }
];

export const BUTTONS = [
  {
    name: "Center encoder",
    detail:
      "Turn it to step through the instruments. The orange outline is the column knobs 1–3 are editing. Press it to switch conga/tom, claves/rimshot, or maracas/handclap."
  },
  {
    name: "− and +",
    detail:
      "Step Basic Variation toward A or toward B. Hold Shift for I/F Variation, A or B."
  },
  {
    name: "Mod wheel",
    detail: "Tempo."
  },
  {
    name: "Stop / Play",
    detail: "Same as Start/Stop."
  },
  {
    name: "Tap Tempo",
    detail:
      "Same as TAP. In Manual Play that arms the intro/fill, the way the button on the panel does."
  },
  {
    name: "Record",
    detail:
      "The round button beside Stop/Play. In Pattern Clear it clears the selected pattern. In 1st Part or 2nd Part, press it and then a pad to set that step as the last step."
  }
];

const COLUMN = ["1st", "2nd", "3rd", "4th"];

// Pad notes follow the Mini 4: bank A is 36–43, bank B is 44–51.
// Top row of a bank is the higher four notes. Each row is one color group.
const GROUP_DEFS = [
  {
    label: "Red",
    color: "#d03933",
    rgb: { r: 0xd0, g: 0x39, b: 0x33 },
    bank: "A",
    row: "top",
    notes: [40, 41, 42, 43],
    steps: [0, 1, 2, 3]
  },
  {
    label: "Orange",
    color: "#e98e2f",
    rgb: { r: 0xe9, g: 0x8e, b: 0x2f },
    bank: "A",
    row: "bottom",
    notes: [36, 37, 38, 39],
    steps: [4, 5, 6, 7]
  },
  {
    label: "Yellow",
    color: "#dfd442",
    rgb: { r: 0xdf, g: 0xd4, b: 0x42 },
    bank: "B",
    row: "top",
    notes: [48, 49, 50, 51],
    steps: [8, 9, 10, 11]
  },
  {
    label: "White",
    color: "#e9e8e7",
    rgb: { r: 0xe9, g: 0xe8, b: 0xe7 },
    bank: "B",
    row: "bottom",
    notes: [44, 45, 46, 47],
    steps: [12, 13, 14, 15]
  }
];

export const PAD_GROUPS = GROUP_DEFS;

export const STEPS = new Array(16);
export const NOTE_TO_STEP = {};

GROUP_DEFS.forEach(group => {
  group.steps.forEach((step, index) => {
    const note = group.notes[index];
    STEPS[step] = {
      step,
      note,
      pad: note - 36,
      bank: group.bank,
      row: group.row,
      column: COLUMN[index],
      label: group.label,
      color: group.color,
      rgb: group.rgb
    };
    NOTE_TO_STEP[note] = step;
  });
});

export function instrumentById(id) {
  for (let i = 0; i < INSTRUMENTS.length; i++) {
    if (INSTRUMENTS[i].id === id) return INSTRUMENTS[i];
  }
  return INSTRUMENTS[0];
}

export function knobIndexFor(id, controlName) {
  if (controlName === "level") return 1;
  const extra = instrumentById(id).extra;
  const index = extra.indexOf(controlName);
  if (index < 0) return 0;
  return index + 2;
}

export function instrumentKnobHint(id, controlName) {
  const knob = knobIndexFor(id, controlName);
  if (!knob) return "";
  return "MPK knob " + knob + " · " + CONTROL_LABELS[controlName];
}

export function voiceHint(id) {
  const inst = instrumentById(id);
  if (!inst.voices) return "";
  return "MPK encoder press · " + inst.voices[0] + " / " + inst.voices[1];
}

export function stepHint(step) {
  return "MPK pad · step " + (step + 1) + ". Record, then this pad, sets the length.";
}

export function dimRgb(rgb) {
  const scale = 0.22;
  return {
    r: Math.round(rgb.r * scale),
    g: Math.round(rgb.g * scale),
    b: Math.round(rgb.b * scale)
  };
}

export function knobLine(extra) {
  if (!extra[0] && !extra[1]) return "K1 Level";
  const left = extra[0] ? CONTROL_SHORT[extra[0]] : "--";
  const right = extra[1] ? CONTROL_SHORT[extra[1]] : "--";
  return "K2 " + left + "  K3 " + right;
}
