// app/(components)/appearance/skins.js
// ─────────────────────────────────────────────────────────────────────────────
// The skin line-up, and the ONE skin choice the whole app shares.
//
// A skin is a whole-app appearance pack: a palette and a wallpaper. What it
// LOOKS like is entirely in app/skins.css — read that file first, it explains
// the system. What is here is the list the picker renders and the choice
// itself.
//
// ⚠️ THE TWO HALVES ARE KEYED BY `id` AND NOTHING ENFORCES IT. An entry here
// with no `[data-skin="<id>"]` block in skins.css is a tile that appears to do
// nothing; a block there with no entry here is a skin nobody can reach. Add
// both, or neither.
//
// Why nothing here carries colours: the swatch in the panel paints itself from
// the CSS (see .ck-skin-swatch), so a preview cannot drift from the skin it
// previews. Duplicating the palette into JS to draw a thumbnail is exactly the
// drift this avoids.
//
// The choice is stored the same way the composer's model choice is —
// useSyncExternalStore over module state mirrored to localStorage. See
// studio/composerModel.js for why that shape rather than a context: every
// mounted picker follows a change with no provider to wrap the app in, the
// server gets a defined snapshot to prerender, and a second tab's change
// arrives through the `storage` event.
//
// ⚠️ Applying the skin is NOT React's job. `data-skin` on <html> is written
// here (applySkin) and by the boot script in app/layout.js, which runs before
// first paint — a returning user must never see the default palette flash
// before an effect swaps it. Anything that changes the skin must go through
// setSkin so both stay in step.

import { useSyncExternalStore } from "react";

/**
 * What "no skin" is called. Deliberately NOT a skin: it is the absence of the
 * `data-skin` attribute, so the app as designed needs no block in skins.css and
 * cannot drift from itself.
 *
 * ⚠️ The ID stays "default" — it is what is already in people's localStorage
 * and what the boot script in layout.js compares against. Only the LABEL is
 * "None", because in a grid of skins "None" says what picking it does and
 * "Default" reads like a fifteenth appearance to choose between.
 */
export const DEFAULT_SKIN_ID = "default";

/**
 * The skins, in the order the panel shows them. `label` is the only copy — keep
 * it to about sixteen characters, which is what fits a tile without truncating
 * at the panel's two-column width.
 *
 * Adding one: an entry here, and the pair of blocks in skins.css. Nothing else.
 *
 * The order is deliberate, not alphabetical: None first, then the illustrated
 * ones (which are what someone is browsing FOR), then the quieter gradient
 * skins that are more about working in than looking at.
 */
export const SKINS = [
  { id: DEFAULT_SKIN_ID, label: "None" },

  // Illustrated — a drawn SVG plate per theme, out of /public/skins.
  { id: "aurora", label: "Aurora Ridge" },
  { id: "winter", label: "Winter" },
  { id: "halloween", label: "Halloween Night" },
  { id: "mexican", label: "Mexican Heritage" },
  { id: "doodle", label: "Doodle Art" },
  { id: "retro", label: "Retro Sun" },
  { id: "swell", label: "Ocean Swell" },

  // Composed from gradients, no assets.
  { id: "nebula", label: "Emerald Nebula" },
  { id: "city", label: "City Lights" },
  { id: "sakura", label: "Sakura Midnight" },
  { id: "clay", label: "Claymorphism" },
  { id: "felt", label: "Felt Landscape" },
  { id: "stellar", label: "Stellar" },
  { id: "dune", label: "Desert Dune" },
  { id: "arctic", label: "Arctic Frost" },
  { id: "neon", label: "Neon Grid" },
  { id: "mocha", label: "Mocha" },
  { id: "midnight", label: "Midnight Ink" },
];

/** Namespaced, like the app's other preference keys. */
const STORAGE_KEY = "ck:skin";

const isKnownSkin = (id) => SKINS.some((skin) => skin.id === id);

/**
 * The last value handed to React. `null` means "not read yet" — set back to
 * null whenever the underlying value might have changed, so the next
 * getSnapshot re-reads instead of serving a stale id.
 */
let snapshot = null;
const listeners = new Set();

const readStored = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && isKnownSkin(saved) ? saved : DEFAULT_SKIN_ID;
  } catch {
    // Private-mode Safari and a blocked-cookies Chrome throw on access rather
    // than returning null. A skin is a preference; losing it is fine, taking
    // the sidebar down with it is not.
    return DEFAULT_SKIN_ID;
  }
};

/**
 * Put the skin on <html>, which is what every rule in skins.css keys off.
 *
 * Default REMOVES the attribute rather than setting `data-skin="default"` —
 * `[data-skin]` matches on presence, so leaving an attribute behind would keep
 * the whole derived-token block live and quietly re-point the palette to
 * variables no block defines.
 */
const applySkin = (id) => {
  const root = document.documentElement;
  if (id === DEFAULT_SKIN_ID) root.removeAttribute("data-skin");
  else root.setAttribute("data-skin", id);
};

const emit = () => listeners.forEach((listener) => listener());

/** Another tab wrote the key — or cleared storage entirely (`key === null`). */
const handleStorage = (event) => {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = null;
  // Re-read and re-apply: the other tab changed the appearance, not just the
  // stored string, and this tab is showing the old one until it repaints.
  applySkin(getSnapshot());
  emit();
};

const subscribe = (listener) => {
  listeners.add(listener);
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
const getServerSnapshot = () => DEFAULT_SKIN_ID;

/**
 * Change the app-wide skin: repaint now, remember for next time.
 *
 * @param {string} id A SKINS id. Anything else is ignored rather than stored,
 *   so a retired skin can't strand a returning user on an appearance that has
 *   no CSS left to render it.
 */
export function setSkin(id) {
  if (!isKnownSkin(id)) {
    console.warn(`⚠️ [appearance] ignoring unknown skin "${id}"`);
    return;
  }
  if (getSnapshot() === id) return;

  snapshot = id;
  applySkin(id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage full or blocked. The skin still applies for this session — it
    // just won't outlive the tab.
    console.warn("⚠️ [appearance] couldn't persist the skin choice");
  }
  console.log(`🎨 [appearance] skin → ${id}`);
  emit();
}

/**
 * The shared skin choice, shaped like useState.
 *
 * ⚠️ On the server and on the very first client render this returns
 * DEFAULT_SKIN_ID even for someone who has a skin stored — React has to
 * render the same tree the server sent or hydration tears. The PAGE is
 * already wearing the right skin by then (the boot script set the attribute
 * before paint); it is only this value that catches up on the next tick, which
 * is why the picker's tick can flicker to Default for a frame and the app
 * behind it never does.
 *
 * @returns {[string, (id: string) => void]}
 */
export function useSkin() {
  const skin = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [skin, setSkin];
}
