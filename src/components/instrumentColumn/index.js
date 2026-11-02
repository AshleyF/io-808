import React from "react";
import * as stylex from "@stylexjs/stylex";

// Layouts
import InstrumentColumnLayout from "layouts/instrumentColumn";

// Components
import InstrumentLabel from "components/instrumentLabel";
import DrumSwitch from "components/drumSwitch";
import DrumKnob from "components/drumKnob";
import MidiHint from "components/midiHint";
import { instrumentKnobHint, voiceHint } from "midi/map";

export const EMPTY_CONTROL = "EMPTY";

const styles = stylex.create({
  emptyControl: {
    width: 65,
    height: 95
  },
  drumKnob: {
    width: 65,
    height: 95
  }
});

const ConnectedDrumSwitch = props => {
  const { name, type, values, selector, onChange } = props;
  const handleChange = React.useCallback(
    value => onChange(type, "selector", value),
    [onChange, type]
  );
  return (
    <DrumSwitch
      name={name}
      values={values}
      position={selector}
      onChange={handleChange}
    />
  );
};

const ConnectedDrumKnob = props => {
  const { value, onChange, xstyle, type, controlName, level = false } = props;
  const handleChange = React.useCallback(
    value => onChange(type, controlName, value),
    [controlName, onChange, type]
  );
  return (
    <DrumKnob
      value={value}
      onChange={handleChange}
      xstyle={xstyle}
      level={level}
      label={controlName.toUpperCase()}
    />
  );
};

const InstrumentColumn = props => {
  const {
    config: { type, labels, switchConfig, controls },
    controlState,
    onChange,
    xstyle
  } = props;

  // create label section
  let labelComponents = [];
  labelComponents.push(
    <InstrumentLabel key={`${type}-label-0`} label={labels[0]} />
  );
  if (labels.length == 2) {
    if (switchConfig != null) {
      const { name, values } = switchConfig;
      labelComponents.push(
        <MidiHint key={`${type}-switch`} text={voiceHint(type)}>
          <ConnectedDrumSwitch
            name={name}
            type={type}
            values={values}
            selector={controlState.selector}
            onChange={onChange}
          />
        </MidiHint>
      );
    }
    labelComponents.push(
      <InstrumentLabel key={`${type}-label-1`} label={labels[1]} />
    );
  }

  // create control section
  let controlComponents = [];
  controlComponents.push(
    <MidiHint
      key={`${type}-knob-level`}
      text={instrumentKnobHint(type, "level")}
    >
      <ConnectedDrumKnob
        type={type}
        value={controlState.level}
        onChange={onChange}
        xstyle={styles.drumKnob}
        controlName="level"
        level
      />
    </MidiHint>
  );
  controls.forEach((controlName, index) => {
    if (controlName !== EMPTY_CONTROL) {
      controlComponents.push(
        <MidiHint
          key={`${type}-knob-${index}`}
          text={instrumentKnobHint(type, controlName)}
        >
          <ConnectedDrumKnob
            value={controlState[controlName]}
            onChange={onChange}
            xstyle={styles.drumKnob}
            type={type}
            controlName={controlName}
          />
        </MidiHint>
      );
    } else {
      controlComponents.push(
        <div
          key={`${type}-knob-${index}`}
          {...stylex.props(styles.emptyControl)}
        />
      );
    }
  });

  return (
    <InstrumentColumnLayout labels={labelComponents} xstyle={xstyle}>
      {controlComponents}
    </InstrumentColumnLayout>
  );
};

export default InstrumentColumn;
