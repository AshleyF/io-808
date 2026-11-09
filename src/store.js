import { compose, createStore } from "redux";
import { setAutoFreeze } from "immer";

import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";

import rootReducer from "reducers";
import initialState, { createSteps, sanitizeSteps } from "initialState";

import { PERSISTANCE_FILTER } from "store-constants";

setAutoFreeze(false);

const middleware = [];

if ("production" !== process.env.NODE_ENV && window.devToolsExtension) {
  middleware.push(window.devToolsExtension());
}

function reconcileState(inbound, original, reduced, config) {
  const merged = autoMergeLevel2(inbound, original, reduced, config);
  if (!inbound || inbound.steps == null || typeof inbound.steps !== "object") {
    return merged;
  }
  // Replace the step map outright. Merging would keep stray keys left in
  // the base map by taps that fell between the steps.
  merged.steps = createSteps();
  const kept = sanitizeSteps(inbound.steps);
  Object.keys(kept).forEach(key => {
    merged.steps[key] = true;
  });
  return merged;
}

const persistConfig = {
  key: "io-808",
  storage: storage,
  whitelist: PERSISTANCE_FILTER,
  throttle: 100,
  stateReconciler: reconcileState
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
const enhancer = compose(...middleware);

export const store = createStore(persistedReducer, initialState, enhancer);
export const persistor = persistStore(store);

const PERSIST_KEY = "persist:io-808";

function persistBlob(state) {
  const saved = {};
  PERSISTANCE_FILTER.forEach(key => {
    // Reset drops every trigger, including ones the old tap wrote between steps.
    const value = key === "steps" ? {} : state[key];
    saved[key] = JSON.stringify(value == null ? null : value);
  });
  window.localStorage.setItem(PERSIST_KEY, JSON.stringify(saved));
}

export function hardReset() {
  // Stop the persist writer before it can put the old steps back.
  persistor.pause();
  const flushed = persistor.flush();
  try {
    persistBlob(store.getState());
  } catch (error) {
    try {
      window.localStorage.removeItem(PERSIST_KEY);
    } catch (removeError) {
      // Storage can be blocked. The in-memory reset still stands.
    }
  }
  persistor.persist();
  return flushed;
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", function() {
    persistor.flush();
  });
}
