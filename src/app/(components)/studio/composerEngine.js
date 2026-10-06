// app/(components)/studio/composerEngine.js
// ─────────────────────────────────────────────────────────────────────────────
// Which engine builds the design when the chat says "create", and the ONE
// choice of it the whole app shares.
//
//   "redesign" → Scraive templates + /creatives/redesign. Layered: every text,
//                shape and image comes back as its own element. The default.
//   "magic"    → Magic Studio's /magic-studio/generate. A finished picture,
//                which the chat wraps as a one-image design so it previews,
//                saves and opens in the editor like any other.
//
// Same store as composerModel.js, for the same reasons: the home composer and
// the chat composer are one setting seen twice, so the value lives in module
// state mirrored to localStorage, read through useSyncExternalStore. See that
// file for why each piece is there.
//
// ⚠️ READ AT CREATE TIME, not at send time. The chat page looks the engine up
// when the assistant's `type: "create"` reply lands, so switching mid-chat
// applies to the next design without touching the conversation.

import { useSyncExternalStore } from "react";

/** The engine menu, in the order it shows. `description` is the menu's sub-line. */
export const ENGINE_OPTIONS = [
  {
    id: "redesign",
    label: "Editable design",
    description: "Layered — edit every text, shape and image later",
  },
  {
    id: "magic",
    label: "Image",
    description: "A finished picture from Magic Studio",
  },
];

/** An explicit id, so reordering the menu can't change anyone's default. */
export const DEFAULT_ENGINE_ID = "redesign";

/** Namespaced beside the model key ("ck:composer-model"). */
const STORAGE_KEY = "ck:composer-engine";

const isKnownEngine = (id) => ENGINE_OPTIONS.some((option) => option.id === id);

let snapshot = null;
const listeners = new Set();

const readStored = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && isKnownEngine(saved) ? saved : DEFAULT_ENGINE_ID;
  } catch {
    // Blocked storage throws rather than returning null — fall back, don't crash.
    return DEFAULT_ENGINE_ID;
  }
};

const emit = () => listeners.forEach((listener) => listener());

const handleStorage = (event) => {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = null;
  emit();
};

const subscribe = (listener) => {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", handleStorage);
  };
};

const getSnapshot = () => {
  if (snapshot === null) snapshot = readStored();
  return snapshot;
};

const getServerSnapshot = () => DEFAULT_ENGINE_ID;

/**
 * The engine in effect right now, for code that runs outside render — the chat
 * page's create handler reads it at the moment the create reply lands.
 *
 * @returns {"redesign"|"magic"}
 */
export const getComposerEngine = () =>
  typeof window === "undefined" ? DEFAULT_ENGINE_ID : getSnapshot();

/**
 * Change the app-wide engine. Every mounted composer follows on the next render.
 *
 * @param {string} id An ENGINE_OPTIONS id; anything else is ignored.
 */
export function setComposerEngine(id) {
  if (!isKnownEngine(id)) {
    console.warn(`⚠️ [composer] ignoring unknown engine "${id}"`);
    return;
  }
  if (getSnapshot() === id) return;

  snapshot = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    console.warn("⚠️ [composer] couldn't persist the engine choice");
  }
  console.log(`⚙️ [composer] engine → ${id}`);
  emit();
}

/**
 * The shared engine choice, shaped like useState:
 * `const [engine, setEngine] = useComposerEngine()`.
 *
 * @returns {[string, (id: string) => void]}
 */
export function useComposerEngine() {
  const engine = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [engine, setComposerEngine];
}
