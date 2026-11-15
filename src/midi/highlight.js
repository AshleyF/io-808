import React from "react";

const lit = {};
const listeners = new Set();
let timer = null;

function emit() {
  listeners.forEach(listener => listener());
}

export function pulse(mark) {
  if (!mark) return;
  Object.keys(lit).forEach(key => {
    if (key !== mark) delete lit[key];
  });
  lit[mark] = true;
  emit();
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    delete lit[mark];
    emit();
  }, 700);
}

export function useGlow(mark) {
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    if (!mark) return undefined;
    const sync = () => {
      const next = !!lit[mark];
      setOn(prev => (prev === next ? prev : next));
    };
    listeners.add(sync);
    sync();
    return () => listeners.delete(sync);
  }, [mark]);

  return !!mark && on;
}
