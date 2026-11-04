import React from "react";
import { createPortal } from "react-dom";
import * as stylex from "@stylexjs/stylex";

import { tokens } from "theme/variables.stylex";
import { requestAudioInit } from "audioCtxContext";
import {
  closeMpkHelp,
  connectMpk,
  getMpkSnapshot,
  presentMpk,
  subscribeMpk
} from "midi/mpk";
import { BUTTONS, KNOBS, PAD_GROUPS } from "midi/map";

const styles = stylex.create({
  textButton: {
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    color: tokens.grey,
    fontFamily: tokens.panelFontFamily,
    fontWeight: tokens.fontWeight,
    fontSize: tokens.largeSize,
    letterSpacing: tokens.letterSpacing,
    cursor: "pointer",
    textDecoration: "none",
    ":hover": {
      color: tokens.drumLabel
    }
  },
  statusButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    color: tokens.grey,
    fontFamily: tokens.panelFontFamily,
    fontWeight: tokens.fontWeight,
    fontSize: tokens.normalSize,
    letterSpacing: tokens.letterSpacing,
    cursor: "pointer",
    ":hover": {
      color: tokens.drumLabel
    }
  },
  dot: {
    width: 8,
    height: 8,
    marginRight: 8,
    borderRadius: "50%",
    backgroundColor: tokens.grey
  },
  dotOn: {
    backgroundColor: "#3ecf8e"
  },
  backdrop: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    padding: 24
  },
  card: {
    width: 720,
    maxWidth: "100%",
    maxHeight: "100%",
    overflowY: "auto",
    backgroundColor: tokens.darkBlack,
    color: tokens.drumLabel,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.grey,
    borderRadius: 8,
    paddingTop: 22,
    paddingBottom: 28,
    paddingLeft: 28,
    paddingRight: 28,
    fontFamily: tokens.baseFontFamily,
    fontSize: 15,
    fontWeight: "normal",
    lineHeight: 1.45,
    textAlign: "left",
    userSelect: "text"
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8
  },
  title: {
    margin: 0,
    color: tokens.stencilOrange,
    fontFamily: tokens.panelFontFamily,
    fontSize: 22,
    fontWeight: tokens.fontWeight,
    letterSpacing: tokens.letterSpacing
  },
  close: {
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    color: tokens.grey,
    fontFamily: tokens.panelFontFamily,
    fontSize: tokens.normalSize,
    fontWeight: tokens.fontWeight,
    letterSpacing: tokens.letterSpacing,
    cursor: "pointer",
    ":hover": {
      color: tokens.drumLabel
    }
  },
  lead: {
    marginTop: 0,
    marginBottom: 16
  },
  status: {
    marginTop: 0,
    marginBottom: 12,
    color: tokens.grey
  },
  connect: {
    marginBottom: 22,
    backgroundColor: tokens.stencilOrange,
    borderWidth: 0,
    borderRadius: 4,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 14,
    paddingRight: 14,
    color: tokens.darkGrey,
    fontFamily: tokens.panelFontFamily,
    fontSize: tokens.normalSize,
    fontWeight: tokens.fontWeight,
    letterSpacing: tokens.letterSpacing,
    cursor: "pointer"
  },
  connectBusy: {
    opacity: 0.6,
    cursor: "default"
  },
  heading: {
    marginTop: 18,
    marginBottom: 8,
    color: tokens.stencilOrange,
    fontFamily: tokens.panelFontFamily,
    fontSize: tokens.normalSize,
    fontWeight: tokens.fontWeight,
    letterSpacing: "0.08em"
  },
  note: {
    marginTop: 0,
    marginBottom: 8,
    color: tokens.grey
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  name: {
    width: 168,
    paddingTop: 7,
    paddingBottom: 7,
    paddingRight: 16,
    color: tokens.stencilOrange,
    fontWeight: "bold",
    verticalAlign: "top"
  },
  detail: {
    paddingTop: 7,
    paddingBottom: 7,
    color: tokens.drumLabel,
    verticalAlign: "top"
  },
  banks: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start"
  },
  bank: {
    marginRight: 28
  },
  bankLabel: {
    marginBottom: 6,
    color: tokens.grey,
    fontFamily: tokens.panelFontFamily,
    fontSize: tokens.smallSize,
    fontWeight: tokens.fontWeight,
    letterSpacing: tokens.letterSpacing
  },
  row: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 6
  },
  pad: {
    width: 46,
    height: 36,
    marginRight: 6,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: tokens.panelFontFamily,
    fontWeight: tokens.fontWeight,
    fontSize: tokens.normalSize
  },
  groupLabel: {
    width: 64,
    display: "flex",
    alignItems: "center",
    color: tokens.grey,
    fontSize: 12
  }
});

function useMpk() {
  const [snap, setSnap] = React.useState(getMpkSnapshot);
  React.useEffect(() => subscribeMpk(() => setSnap(getMpkSnapshot())), []);
  return snap;
}

function unlockAnd(action) {
  requestAudioInit();
  action();
}

export const MpkHelpLink = () => {
  return (
    <button
      type="button"
      {...stylex.props(styles.textButton)}
      onClick={() => unlockAnd(presentMpk)}
    >
      MPK Mini
    </button>
  );
};

export const MpkStatusButton = () => {
  const snap = useMpk();
  const connected = snap.status === "ready";
  return (
    <button
      type="button"
      {...stylex.props(styles.statusButton)}
      onClick={() => unlockAnd(presentMpk)}
    >
      <span
        {...stylex.props(styles.dot, connected ? styles.dotOn : null)}
      />
      {connected ? "MPK" : "Connect MPK"}
    </button>
  );
};

function ink(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#232425" : "#fff8ef";
}

function PadBank(props) {
  const { bank } = props;
  const rows = ["top", "bottom"].map(row =>
    PAD_GROUPS.find(group => group.bank === bank && group.row === row)
  );
  return (
    <div {...stylex.props(styles.bank)}>
      <div {...stylex.props(styles.bankLabel)}>Bank {bank}</div>
      {rows.map(group => (
        <div key={group.row} {...stylex.props(styles.row)}>
          {group.steps.map(step => (
            <div
              key={step}
              {...stylex.props(styles.pad)}
              style={{ backgroundColor: group.color, color: ink(group.color) }}
            >
              {step + 1}
            </div>
          ))}
          <div {...stylex.props(styles.groupLabel)}>{group.label}</div>
        </div>
      ))}
    </div>
  );
}

function Rows(props) {
  const { rows } = props;
  return (
    <table {...stylex.props(styles.table)}>
      <tbody>
        {rows.map(row => (
          <tr key={row.name}>
            <td {...stylex.props(styles.name)}>{row.name}</td>
            <td {...stylex.props(styles.detail)}>{row.detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const MpkHelpDialog = () => {
  const snap = useMpk();

  React.useEffect(() => {
    if (!snap.open) return undefined;
    const onKey = event => {
      if (event.key === "Escape") closeMpkHelp();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [snap.open]);

  if (!snap.open) return null;

  const busy = snap.status === "connecting";
  const connectLabel = busy
    ? "Connecting…"
    : snap.status === "ready"
      ? "Reconnect"
      : "Connect";
  const connectProps = busy
    ? stylex.props(styles.connect, styles.connectBusy)
    : stylex.props(styles.connect);

  const knobRows = KNOBS.map(knob => ({
    name: "Knob " + knob.n,
    detail: knob.detail
  }));

  return createPortal(
    <div {...stylex.props(styles.backdrop)} onClick={closeMpkHelp}>
      <div
        {...stylex.props(styles.card)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mpk-help-title"
        onClick={event => event.stopPropagation()}
      >
        <div {...stylex.props(styles.header)}>
          <h2 id="mpk-help-title" {...stylex.props(styles.title)}>
            MPK Mini 4
          </h2>
          <button
            type="button"
            {...stylex.props(styles.close)}
            onClick={closeMpkHelp}
          >
            Close
          </button>
        </div>
        <p {...stylex.props(styles.lead)}>
          Turn the center encoder to pick the instrument. The orange outline
          shows which column knobs 1–3 are editing. Press the encoder to switch
          conga and tom, claves and rimshot, or maracas and handclap. The
          keyboard connection needs Chrome or Edge. Firefox and Safari have no
          Web MIDI.
        </p>
        <p {...stylex.props(styles.status)}>{snap.message}</p>
        <button
          type="button"
          {...connectProps}
          disabled={busy}
          onClick={() => unlockAnd(connectMpk)}
        >
          {connectLabel}
        </button>

        <div {...stylex.props(styles.heading)}>KNOBS</div>
        <p {...stylex.props(styles.note)}>
          Eight knobs, left to right. The top row is 1–4 and the bottom row is
          5–8. Knob 1 is the level of the selected instrument. The mod wheel
          is tempo. Connecting moves the knobs to the values already on screen.
          A control glows on the page while the keyboard is moving it. The
          MIDI menu in the header stays on Audio only (no MIDI) until an
          output is chosen. The page asks for MIDI access when it loads so it
          can connect the keyboard. An output sends General MIDI notes on
          channel 10 and keeps the page quiet.
        </p>
        <Rows rows={knobRows} />

        <div {...stylex.props(styles.heading)}>BUTTONS</div>
        <Rows rows={BUTTONS} />

        <div {...stylex.props(styles.heading)}>PADS</div>
        <p {...stylex.props(styles.note)}>
          Bank A is steps 1–8 and bank B is steps 9–16. The top row is the
          first four of that bank. Pads stay dim in their group color and light
          up in that same color with the step lamps, including the playhead.
          Press a pad to toggle that step. In 1st Part or 2nd Part, press Record
          and then a pad to set the pattern length to that step. In Pattern
          Clear, Record clears the selected pattern. Leave Note Repeat off, or
          a held pad will keep flipping.
        </p>
        <div {...stylex.props(styles.banks)}>
          <PadBank bank="A" />
          <PadBank bank="B" />
        </div>
        <p {...stylex.props(styles.note)}>
          The Mini 4 screen shows the selected instrument and what knobs 2 and
          3 do for it. The bottom line shows the last change: mode, tempo,
          level, tone, master volume, play, or stop. The keyboard is not
          mapped.
        </p>
      </div>
    </div>,
    document.body
  );
};
