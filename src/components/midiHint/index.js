import React from "react";
import { createPortal } from "react-dom";
import * as stylex from "@stylexjs/stylex";

import { tokens } from "theme/variables.stylex";

const styles = stylex.create({
  anchor: {
    display: "flex",
    flexDirection: "column",
    width: "fit-content",
    maxWidth: "100%"
  },
  tip: {
    position: "fixed",
    zIndex: 200,
    width: 240,
    margin: 0,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.stencilOrange,
    borderRadius: 4,
    backgroundColor: tokens.slightlyDarkerBlack,
    color: tokens.drumLabel,
    fontFamily: tokens.baseFontFamily,
    fontSize: 13,
    fontWeight: "normal",
    lineHeight: 1.35,
    letterSpacing: 0,
    textAlign: "left",
    pointerEvents: "none",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
  }
});

const MidiHint = props => {
  const { text, children } = props;
  const [tip, setTip] = React.useState(null);
  const timer = React.useRef(null);

  const clear = React.useCallback(() => {
    window.clearTimeout(timer.current);
    setTip(null);
  }, []);

  React.useEffect(() => clear, [clear]);

  const onEnter = React.useCallback(
    event => {
      if (!text) return;
      const rect = event.currentTarget.getBoundingClientRect();
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const width = 240;
        const raw = rect.left + rect.width / 2;
        const left = Math.max(
          width / 2 + 8,
          Math.min(window.innerWidth - width / 2 - 8, raw)
        );
        const below = rect.top < 72;
        setTip({
          left,
          top: below ? rect.bottom + 8 : rect.top - 8,
          below
        });
      }, 400);
    },
    [text]
  );

  if (!text) return children;

  const placed = tip
    ? {
        left: tip.left,
        top: tip.top,
        transform: tip.below
          ? "translate(-50%, 0)"
          : "translate(-50%, -100%)"
      }
    : null;

  return (
    <div
      {...stylex.props(styles.anchor)}
      onMouseEnter={onEnter}
      onMouseLeave={clear}
      onMouseDown={clear}
    >
      {children}
      {placed
        ? createPortal(
            <div {...stylex.props(styles.tip)} style={placed}>
              {text}
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default MidiHint;
