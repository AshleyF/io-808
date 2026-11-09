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
import SoundModeButton from "components/soundMode";
import {
  CC_FIELDS,
  CUSTOM_ID,
  PRESETS,
  applyPreset,
  getController,
  presetById,
  setCc,
  setKnob,
  setPad,
  subscribeController
} from "midi/controllerMap";

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
    width: 860,
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
    marginBottom: 18,
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
  deviceRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  deviceLabel: {
    marginRight: 8,
    color: tokens.grey,
    fontFamily: tokens.panelFontFamily,
    fontWeight: tokens.fontWeight,
    fontSize: tokens.normalSize,
    letterSpacing: tokens.letterSpacing
  },
  select: {
    backgroundColor: tokens.darkBlack,
    color: tokens.drumLabel,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.grey,
    fontFamily: tokens.panelFontFamily,
    fontSize: 12
  },
  fields: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap"
  },
  field: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "25%",
    marginBottom: 8,
    boxSizing: "border-box",
    paddingRight: 12
  },
  fieldLabel: {
    flexGrow: 1,
    flexShrink: 1,
    marginRight: 8,
    color: tokens.drumLabel,
    fontSize: 13
  },
  input: {
    width: 54,
    flexShrink: 0,
    backgroundColor: tokens.slightlyDarkerBlack,
    color: tokens.drumLabel,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.grey,
    borderRadius: 3,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
    fontFamily: tokens.panelFontFamily,
    fontSize: 13
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  name: {
    width: 140,
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
  },
  confirm: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 400,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 24
  },
  confirmCard: {
    width: 420,
    maxWidth: "100%",
    backgroundColor: tokens.darkBlack,
    color: tokens.drumLabel,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.grey,
    borderRadius: 8,
    paddingTop: 22,
    paddingBottom: 22,
    paddingLeft: 22,
    paddingRight: 22
  },
  confirmActions: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16
  },
  keep: {
    marginRight: 10,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.grey,
    borderRadius: 4,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 14,
    paddingRight: 14,
    color: tokens.drumLabel,
    fontFamily: tokens.panelFontFamily,
    fontSize: tokens.normalSize,
    fontWeight: tokens.fontWeight,
    letterSpacing: tokens.letterSpacing,
    cursor: "pointer"
  }
});

function useMpk() {
  const [snap, setSnap] = React.useState(getMpkSnapshot);
  React.useEffect(() => subscribeMpk(() => setSnap(getMpkSnapshot())), []);
  return snap;
}

function useController() {
  const [snap, setSnap] = React.useState(getController);
  React.useEffect(() => subscribeController(() => setSnap(getController())), []);
  return snap;
}

function unlockAnd(action) {
  requestAudioInit();
  action();
}

function commitNumber(raw, commit) {
  const text = raw.trim();
  if (text === "") {
    commit(null);
    return;
  }
  if (!/^\d{1,3}$/.test(text)) return;
  const n = Number(text);
  if (n > 127) return;
  commit(n);
}

function MidiField(props) {
  const shown = props.value == null ? "" : String(props.value);
  function onChange(event) {
    commitNumber(event.target.value, value => props.commit(props.slot, value));
  }
  return (
    <label {...stylex.props(styles.field)}>
      <span {...stylex.props(styles.fieldLabel)}>{props.label}</span>
      <input
        {...stylex.props(styles.input)}
        aria-label={props.label}
        inputMode="numeric"
        value={shown}
        onChange={onChange}
      />
    </label>
  );
}

function openController() {
  unlockAnd(presentMpk);
}

export const ControllerLink = () => {
  return (
    <button
      type="button"
      {...stylex.props(styles.textButton)}
      onClick={openController}
    >
      Controller
    </button>
  );
};

export const ControllerStatus = () => {
  const snap = useMpk();
  const connected = snap.status === "ready";
  return (
    <button
      type="button"
      {...stylex.props(styles.statusButton)}
      title={connected ? "Controller connected" : "No controller connected"}
      onClick={openController}
    >
      <span {...stylex.props(styles.dot, connected ? styles.dotOn : null)} />
      Controller
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
  const rows = ["top", "bottom"].map(row =>
    PAD_GROUPS.find(group => group.bank === props.bank && group.row === row)
  );
  return (
    <div {...stylex.props(styles.bank)}>
      <div {...stylex.props(styles.bankLabel)}>Bank {props.bank}</div>
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
  return (
    <table {...stylex.props(styles.table)}>
      <tbody>
        {props.rows.map(row => (
          <tr key={row.name}>
            <td {...stylex.props(styles.name)}>{row.name}</td>
            <td {...stylex.props(styles.detail)}>{row.detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const SettingsDialog = () => {
  const snap = useMpk();
  const controller = useController();
  const [pending, setPending] = React.useState(null);

  React.useEffect(() => {
    if (!snap.open) return undefined;
    const onKey = event => {
      if (event.key === "Escape") {
        if (pending) setPending(null);
        else closeMpkHelp();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [snap.open, pending]);

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
  const chosen = presetById(controller.presetId);
  const pendingPreset = pending ? presetById(pending) : null;
  const detail = chosen
    ? chosen.detail
    : "These numbers no longer match a device preset.";
  const map = controller.map;

  function pickPreset(id) {
    if (id === CUSTOM_ID || id === controller.presetId) return;
    if (controller.presetId === CUSTOM_ID) setPending(id);
    else applyPreset(id);
  }

  function onPresetChange(event) {
    pickPreset(event.target.value);
  }

  function connectController() {
    unlockAnd(connectMpk);
  }

  function keepClick(event) {
    event.stopPropagation();
  }

  function cancelReplace(event) {
    event.stopPropagation();
    setPending(null);
  }

  function keepMapping() {
    setPending(null);
  }

  function replaceMapping() {
    applyPreset(pending);
    setPending(null);
  }

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
        aria-labelledby="settings-title"
        onClick={keepClick}
      >
        <div {...stylex.props(styles.header)}>
          <h2 id="settings-title" {...stylex.props(styles.title)}>
            Settings
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
          The green light in the header means a controller is connected. Chrome
          or Edge is required. Firefox and Safari have no Web MIDI.
        </p>
        <p {...stylex.props(styles.status)}>{snap.message}</p>
        <button
          type="button"
          {...connectProps}
          disabled={busy}
          onClick={connectController}
        >
          {connectLabel}
        </button>
        <SoundModeButton />

        <div {...stylex.props(styles.heading)}>DEVICE</div>
        <div {...stylex.props(styles.deviceRow)}>
          <span {...stylex.props(styles.deviceLabel)}>Mapping</span>
          <select
            {...stylex.props(styles.select)}
            value={controller.presetId}
            onChange={onPresetChange}
          >
            {controller.presetId === CUSTOM_ID ? (
              <option value={CUSTOM_ID}>Custom</option>
            ) : null}
            {PRESETS.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
        <p {...stylex.props(styles.note)}>{detail}</p>

        <div {...stylex.props(styles.heading)}>KNOBS</div>
        <p {...stylex.props(styles.note)}>
          CC numbers, 0–127. Blank leaves a control unused.
        </p>
        <div {...stylex.props(styles.fields)}>
          {KNOBS.map(knob => (
            <MidiField
              key={knob.n}
              label={"Knob " + knob.n}
              value={map.knobs[knob.n - 1]}
              commit={setKnob}
              slot={knob.n - 1}
            />
          ))}
        </div>

        <div {...stylex.props(styles.heading)}>BUTTONS</div>
        <div {...stylex.props(styles.fields)}>
          {CC_FIELDS.map(field => (
            <MidiField
              key={field.key}
              label={field.label}
              value={map[field.key]}
              commit={setCc}
              slot={field.key}
            />
          ))}
        </div>

        <div {...stylex.props(styles.heading)}>PADS</div>
        <p {...stylex.props(styles.note)}>
          Note numbers for steps 1–16. On the MPK Mini 4 preset, bank A is
          steps 1–8 and bank B is steps 9–16. The top row of a bank is the
          first four steps.
        </p>
        <div {...stylex.props(styles.fields)}>
          {map.pads.map((note, index) => (
            <MidiField
              key={index}
              label={"Step " + (index + 1)}
              value={note}
              commit={setPad}
              slot={index}
            />
          ))}
        </div>

        <div {...stylex.props(styles.heading)}>WHAT THEY DO</div>
        <Rows rows={knobRows} />
        <Rows rows={BUTTONS} />
        <div {...stylex.props(styles.banks)}>
          <PadBank bank="A" />
          <PadBank bank="B" />
        </div>
        <p {...stylex.props(styles.note)}>
          Press a pad to toggle that step. In 1st Part or 2nd Part, press
          Record and then a pad to set the pattern length. Leave note repeat
          off, or a held pad will keep flipping.
        </p>
      </div>
      {pendingPreset ? (
        <div
          {...stylex.props(styles.confirm)}
          onClick={cancelReplace}
        >
          <div
            {...stylex.props(styles.confirmCard)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="replace-mapping-title"
            onClick={keepClick}
          >
            <h2 id="replace-mapping-title" {...stylex.props(styles.title)}>
              Replace mapping
            </h2>
            <p>
              Replace your mapping with the {pendingPreset.name} preset? The
              numbers you changed will be replaced.
            </p>
            <div {...stylex.props(styles.confirmActions)}>
              <button
                type="button"
                {...stylex.props(styles.keep)}
                onClick={keepMapping}
              >
                Keep mine
              </button>
              <button
                type="button"
                {...stylex.props(styles.connect)}
                onClick={replaceMapping}
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body
  );
};
