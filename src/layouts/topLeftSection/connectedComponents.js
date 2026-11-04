import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  onModeChange,
  onInstrumentTrackChange,
  onAutoFillInChange,
  onTempoChange,
  onFineTempoChange,
  onClearDown,
  onClearUp,
  onClearDragStart,
  onClearDragEnd,
  onLengthArmToggle
} from "actionCreators";

import { MODE_FIRST_PART, MODE_SECOND_PART } from "store-constants";

import ClearButton from "components/clearButton";
import ModeKnob from "components/modeKnob";
import InstrumentSelectorKnob from "components/instrumentSelectorKnob";
import AutoFillInKnob from "components/autoFillInKnob";
import TempoKnob from "components/tempoKnob";
import FineTempoKnob from "components/fineTempoKnob";

export const ConnectedClearButton = props => {
  const draggable = useSelector(state =>
    [MODE_FIRST_PART, MODE_SECOND_PART].includes(state.selectedMode)
  );
  const armed = useSelector(state => state.lengthArmed);

  const dispatch = useDispatch();
  const dragged = React.useRef(false);
  const onMouseDown = React.useCallback(() => {
    dragged.current = false;
    dispatch(onClearDown());
  }, [dispatch]);
  const onMouseUp = React.useCallback(() => {
    dispatch(onClearUp());
    if (draggable && !dragged.current) dispatch(onLengthArmToggle());
    dragged.current = false;
  }, [dispatch, draggable]);
  const onDragStart = React.useCallback(() => {
    dragged.current = true;
    dispatch(onClearDragStart());
  }, [dispatch]);
  const onDragEnd = React.useCallback(() => dispatch(onClearDragEnd()), [
    dispatch
  ]);

  return (
    <ClearButton
      {...props}
      draggable={draggable}
      armed={armed}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  );
};

export const ConnectedModeKnob = props => {
  const value = useSelector(state => state.selectedMode);

  const dispatch = useDispatch();
  const onChange = React.useCallback(
    value => {
      dispatch(onModeChange(value));
    },
    [dispatch]
  );

  return <ModeKnob {...props} value={value} onChange={onChange} />;
};

export const ConnectedInstrumentSelectorKnob = props => {
  const value = useSelector(state => state.selectedInstrumentTrack);

  const dispatch = useDispatch();
  const onChange = React.useCallback(
    value => {
      dispatch(onInstrumentTrackChange(value));
    },
    [dispatch]
  );

  return (
    <InstrumentSelectorKnob {...props} value={value} onChange={onChange} />
  );
};

export const ConnectedAutoFillInKnob = props => {
  const value = useSelector(state => state.autoFillInPosition);

  const dispatch = useDispatch();
  const onChange = React.useCallback(
    value => {
      dispatch(onAutoFillInChange(value));
    },
    [dispatch]
  );

  return <AutoFillInKnob {...props} value={value} onChange={onChange} />;
};

export const ConnectedTempoKnob = props => {
  const value = useSelector(state => state.tempo);

  const dispatch = useDispatch();
  const onChange = React.useCallback(
    value => {
      dispatch(onTempoChange(value));
    },
    [dispatch]
  );

  return <TempoKnob {...props} value={value} onChange={onChange} />;
};

export const ConnectedFineTempoKnob = props => {
  const value = useSelector(state => state.fineTempo);

  const dispatch = useDispatch();
  const onChange = React.useCallback(
    value => {
      dispatch(onFineTempoChange(value));
    },
    [dispatch]
  );

  return <FineTempoKnob {...props} value={value} onChange={onChange} />;
};
