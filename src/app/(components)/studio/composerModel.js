// app/(components)/studio/composerModel.js
// ─────────────────────────────────────────────────────────────────────────────
// The model line-up, and the ONE model choice the whole app shares.
//
// The choice is a device preference, not a property of any one composer: the box
// on the home page and the box on the chat page are the same setting seen twice.
// Picking GPT-5.6 Sol in one and finding Claude Sonnet 5 still selected in the
// other would read as a bug, so the value lives here — in module state, mirrored
// to localStorage — rather than in each composer's useState.
//
// useSyncExternalStore, rather than a context or an effect that copies
// localStorage into state, because it solves all three halves of "the same
// wherever it's used" at once:
//
//   · every mounted composer re-renders the moment any one of them changes the
//     model, with no provider to wrap the app in;
//   · localStorage doesn't exist on the server, and getServerSnapshot gives React
//     a defined value to prerender rather than a hydration mismatch to warn about;
//   · the `storage` event carries a change made in another tab straight into this
//     one, so two open tabs don't disagree.
//
// ⚠️ Stored values are VALIDATED against MODEL_OPTIONS on the way in and on the
// way out. A model retired from the list above would otherwise sit in a returning
// user's localStorage forever, and the composer would submit an id the API has
// never heard of — the fallback puts them back on the default instead.

import { useSyncExternalStore } from "react";
import { Cpu, Sparkles } from "lucide-react";

/**
 * The model menu's sections, in the order they appear. Each option below carries
 * the id of the one it belongs to; ComposerDropdown folds them up and counts
 * them itself, so adding a model is a one-line change here and nothing else.
 *
 * ⚠️ An option whose `group` matches nothing here still shows — it just sits
 * loose above the sections rather than disappearing.
 */
export const MODEL_GROUPS = [
  { id: "claude", label: "Claude", icon: Sparkles },
  { id: "gpt", label: "GPT", icon: Cpu },
];

/** Model tiers. Labels are placeholders until the real line-up is decided. */
export const MODEL_OPTIONS = [
  // --- CLAUDE MODELS ---
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", group: "claude", icon: Sparkles },
  { id: "claude-opus-5", label: "Claude Opus 5", group: "claude", icon: Sparkles },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", group: "claude", icon: Sparkles },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", group: "claude", icon: Sparkles },

  // --- GPT MODELS ---
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", group: "gpt", icon: Cpu },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", group: "gpt", icon: Cpu },
  { id: "gpt-5.3-codex", label: "GPT-5.3 Codex", group: "gpt", icon: Cpu },
  { id: "gpt-5.2-pro", label: "GPT-5.2 Pro", group: "gpt", icon: Cpu },
  { id: "gpt-5.2", label: "GPT-5.2", group: "gpt", icon: Cpu },
  { id: "gpt-5.1", label: "GPT-5.1", group: "gpt", icon: Cpu },
  { id: "gpt-5-pro", label: "GPT-5 Pro", group: "gpt", icon: Cpu },
  { id: "gpt-5", label: "GPT-5", group: "gpt", icon: Cpu },
  { id: "gpt-5-mini", label: "GPT-5 Mini", group: "gpt", icon: Cpu },
  { id: "gpt-5-nano", label: "GPT-5 Nano", group: "gpt", icon: Cpu },
  { id: "gpt-4.1", label: "GPT-4.1", group: "gpt", icon: Cpu },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", group: "gpt", icon: Cpu },
  { id: "gpt-4o", label: "GPT-4o", group: "gpt", icon: Cpu },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", group: "gpt", icon: Cpu },
];

/**
 * What a user who has never chosen gets, and what an unreadable or retired
 * stored value falls back to.
 *
 * ⚠️ Deliberately an EXPLICIT id rather than MODEL_OPTIONS[0].id — reordering the
 * list above must not silently change everyone's default.
 */
export const DEFAULT_MODEL_ID = "gpt-5.6-terra";

/** Namespaced so it can't collide with the app's older bare keys ("token", "user"). */
const STORAGE_KEY = "ck:composer-model";

const isKnownModel = (id) => MODEL_OPTIONS.some((option) => option.id === id);

/**
 * The last value handed to React. `null` means "not read yet" — it is set back
 * to null whenever the underlying value might have changed, so the next
 * getSnapshot re-reads instead of serving a stale string.
 *
 * ⚠️ getSnapshot runs on EVERY render of every subscribed component, so it must
 * be cheap and must return the same value until something actually changes.
 * Reading localStorage there unconditionally would do neither.
 */
let snapshot = null;
const listeners = new Set();

const readStored = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && isKnownModel(saved) ? saved : DEFAULT_MODEL_ID;
  } catch {
    // Private-mode Safari and a blocked-cookies Chrome both throw on access
    // rather than returning null. The preference is a convenience, so losing it
    // is fine; taking the composer down with it is not.
    return DEFAULT_MODEL_ID;
  }
};

const emit = () => listeners.forEach((listener) => listener());

/** Another tab wrote the key — or cleared storage entirely (`key === null`). */
const handleStorage = (event) => {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = null;
  emit();
};

const subscribe = (listener) => {
  listeners.add(listener);
  // One window listener for however many composers are mounted, attached with
  // the first and dropped with the last.
  if (listeners.size === 1) window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
};

const getSnapshot = () => {
  if (snapshot === null) snapshot = readStored();
  return snapshot;
};

/** What the server prerenders with — it has no localStorage to consult. */
const getServerSnapshot = () => DEFAULT_MODEL_ID;

/**
 * Change the app-wide model. Every mounted composer follows on the next render.
 *
 * @param {string} id A MODEL_OPTIONS id. Anything else is ignored rather than
 *   stored, so a stale caller can't strand the user on a model that isn't real.
 */
export function setComposerModel(id) {
  if (!isKnownModel(id)) {
    console.warn(`⚠️ [composer] ignoring unknown model "${id}"`);
    return;
  }
  if (getSnapshot() === id) return;

  snapshot = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage full or blocked. The choice still applies for this session — it
    // just won't outlive the tab.
    console.warn("⚠️ [composer] couldn't persist the model choice");
  }
  console.log(`🧠 [composer] model → ${id}`);
  emit();
}

/**
 * The shared model choice, shaped like useState so a composer reads
 * `const [model, setModel] = useComposerModel()`.
 *
 * @returns {[string, (id: string) => void]}
 */
export function useComposerModel() {
  const model = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [model, setComposerModel];
}
