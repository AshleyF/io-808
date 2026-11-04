import React from "react";
import * as stylex from "@stylexjs/stylex";
import usePress from "react-gui/use-press";

import { themeStyles } from "theme/styles";
import { tokens } from "theme/variables.stylex";

const noOp = () => {};

const styles = stylex.create({
  wrapper: {
    position: "relative"
  },
  instructionLabel: {
    color: tokens.white,
    position: "absolute",
    width: 100,
    bottom: -36,
    left: -15,
    transition: "opacity 1s"
  },
  clearButton: {
    width: 27,
    height: 27,
    borderRadius: "50%",
    backgroundColor: tokens.red,
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: tokens.grey,
    cursor: "pointer"
  },
  draggable: {
    cursor: "move"
  },
  armed: {
    cursor: "pointer",
    transform: "scale(0.92) translateZ(0)",
    boxShadow: "0 0 0 3px rgba(208, 57, 51, 0.55)"
  },
  interactive: {
    ":hover": {
      transform: "scale(1.08) translateZ(0)"
    }
  },
  active: {
    transform: "scale(1.0) translateZ(0)",
    ":hover": {
      transform: "scale(1.0) translateZ(0)"
    }
  },
  visible: {
    opacity: 1
  }
});

const ClearButton = props => {
  const {
    onMouseDown = noOp,
    onMouseUp = noOp,
    draggable = false,
    armed = false,
    onDragEnd = noOp,
    onDragStart = noOp
  } = props;

  const ref = React.useRef(null);

  const [isActive, onPressChange] = React.useState(false);
  usePress(ref, {
    onPressChange,
    onPressStart: onMouseDown,
    onPressEnd: onMouseUp
  });

  if (draggable) {
    return (
      <div {...stylex.props(styles.wrapper)}>
        <div
          ref={ref}
          {...stylex.props(
            styles.clearButton,
            styles.draggable,
            armed && styles.armed
          )}
          draggable={true}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
        />
        <div
          {...stylex.props(
            themeStyles.labelGreySmall,
            styles.instructionLabel,
            styles.visible
          )}
        >
          {armed
            ? "Click the last step"
            : "Drag to a step, or click, then the step"}
        </div>
      </div>
    );
  }

  return (
    <div {...stylex.props(styles.wrapper)}>
      <div
        ref={ref}
        {...stylex.props(
          styles.clearButton,
          styles.interactive,
          isActive && styles.active
        )}
      />
      <div
        {...stylex.props(themeStyles.labelGreySmall, styles.instructionLabel)}
      >
        Drag to a Step Button to set Pattern Length
      </div>
    </div>
  );
};

export default ClearButton;
