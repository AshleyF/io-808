import React from "react";
import * as stylex from "@stylexjs/stylex";

import { tokens } from "theme/variables.stylex";
import {
  chooseOutput,
  ensureMidiOutputs,
  getSoundSnapshot,
  subscribeSound
} from "midi/out";

const styles = stylex.create({
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginRight: 0,
    marginBottom: 14
  },
  label: {
    marginRight: 8,
    color: tokens.grey,
    fontFamily: tokens.panelFontFamily,
    fontWeight: tokens.fontWeight,
    fontSize: tokens.normalSize,
    letterSpacing: tokens.letterSpacing
  },
  select: {
    maxWidth: 360,
    backgroundColor: tokens.darkBlack,
    color: tokens.drumLabel,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.grey,
    fontFamily: tokens.panelFontFamily,
    fontSize: 12
  }
});

const AUDIO_ONLY = "";
const CHOOSE_MIDI = "choose-midi-output";

const SoundModeButton = () => {
  const [snap, setSnap] = React.useState(getSoundSnapshot);

  React.useEffect(() => subscribeSound(() => setSnap(getSoundSnapshot())), []);

  const value = snap.mode === "midi" ? snap.outputId : AUDIO_ONLY;
  const other = snap.outputs;

  return (
    <div {...stylex.props(styles.row)}>
      <span {...stylex.props(styles.label)}>Sound output</span>
      <select
        {...stylex.props(styles.select)}
        value={value}
        title="Audio only plays the drums here. An output sends channel 10 notes and stays quiet."
        onChange={event => {
          const next = event.target.value;
          if (next === CHOOSE_MIDI) {
            ensureMidiOutputs();
            return;
          }
          chooseOutput(next);
        }}
      >
        <option value={AUDIO_ONLY}>Audio only (no MIDI)</option>
        {snap.ready ? null : (
          <option value={CHOOSE_MIDI}>Choose MIDI output…</option>
        )}
        {other.map(port => (
          <option key={port.id} value={port.id}>
            {port.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SoundModeButton;
