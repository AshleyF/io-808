import React from "react";
import { useSelector } from "react-redux";
import * as stylex from "@stylexjs/stylex";

import { tokens } from "theme/variables.stylex";
import { isAudioRunning, requestAudioInit, subscribeAudioReady } from "audioCtxContext";
import { getSoundSnapshot, isMidiMode, subscribeSound } from "midi/out";

const styles = stylex.create({
  backdrop: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 400,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    padding: 24
  },
  card: {
    width: 420,
    maxWidth: "100%",
    backgroundColor: tokens.darkBlack,
    color: tokens.drumLabel,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.grey,
    borderRadius: 8,
    paddingTop: 22,
    paddingBottom: 24,
    paddingLeft: 28,
    paddingRight: 28,
    fontFamily: tokens.baseFontFamily,
    fontSize: 15,
    lineHeight: 1.45,
    textAlign: "left"
  },
  title: {
    margin: 0,
    marginBottom: 8,
    color: tokens.stencilOrange,
    fontFamily: tokens.panelFontFamily,
    fontSize: 22,
    fontWeight: tokens.fontWeight,
    letterSpacing: tokens.letterSpacing
  },
  body: {
    marginTop: 0,
    marginBottom: 18
  },
  button: {
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
  }
});

const AudioUnlock = () => {
  const playing = useSelector(state => state.playing);
  const [ready, setReady] = React.useState(isAudioRunning);
  const [midi, setMidi] = React.useState(isMidiMode);

  React.useEffect(() => {
    if (isAudioRunning()) setReady(true);
    return subscribeAudioReady(() => setReady(true));
  }, []);
  React.useEffect(
    () => subscribeSound(() => setMidi(getSoundSnapshot().mode === "midi")),
    []
  );

  if (!playing || ready) return null;

  return (
    <div {...stylex.props(styles.backdrop)}>
      <div {...stylex.props(styles.card)}>
        <h2 {...stylex.props(styles.title)}>Enable audio</h2>
        <p {...stylex.props(styles.body)}>
          {midi
            ? "Play is on, but the browser will not run the pattern until you click the page."
            : "Play is on, but the browser is blocking sound until you click the page."}
        </p>
        <button
          type="button"
          {...stylex.props(styles.button)}
          onClick={() => {
            requestAudioInit().then(() => {
              if (isAudioRunning()) setReady(true);
            });
          }}
        >
          Enable audio
        </button>
      </div>
    </div>
  );
};

export default AudioUnlock;
