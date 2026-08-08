// app/(components)/appearance/wallpapers.js
// ─────────────────────────────────────────────────────────────────────────────
// The photo behind the app — the Appearance panel's "Images" section — and the
// Pexels search that finds one.
//
// ── An image is NOT a skin ───────────────────────────────────────────────────
// The two are deliberately different axes, and they compose:
//
//     SKIN   palette + wallpaper   ("what colour is this app")
//     IMAGE  wallpaper only        ("what is behind it")
//
// So picking a photo swaps the art and leaves the skin's colours alone, and a
// photo picked with no skin on gets a neutral glass palette instead (see
// `:root[data-wallpaper]:not([data-skin])` in skins.css). That is why this is a
// second store rather than a longer SKINS list: a photo cannot say what the
// gray ramp should be, and pretending otherwise would mean hand-authoring a
// palette for every image Pexels can return.
//
// ⚠️ Stored as JSON, not a bare URL, because the panel has to redraw the chosen
// tile and Pexels asks for the photographer to be credited — both need more
// than the src. Anything unparseable is dropped rather than repaired: the
// preference is a convenience and a half-restored one is worse than none.

import { useSyncExternalStore } from "react";

/** Namespaced, like the app's other preference keys. */
const STORAGE_KEY = "ck:wallpaper";

/**
 * What the Images grid shows before anyone searches. Landscape, low-detail,
 * and abstract on purpose — the app's own chrome sits on top of whatever this
 * returns, so the default page should not be portraits and busy interiors.
 */
export const DEFAULT_QUERY = "abstract gradient texture";

/**
 * The Art tab's collections — curated Pexels searches that come back looking
 * like ARTWORK rather than like photography.
 *
 * ⚠️ EVERY QUERY HERE WAS RUN AGAINST THE LIVE API AND PICKED ON WHAT CAME
 * BACK, not on what it sounds like. Pexels is a photo library, so the
 * difference between a query that returns art and one that returns a
 * photograph OF art is not guessable:
 *
 *   "watercolor landscape painting" → photos of brushes and paint tubes
 *   "watercolor background"         → actual watercolour washes        ✓
 *   "vintage poster art"            → photos of posters on a wall
 *   "geometric abstract art"        → actual geometric compositions    ✓
 *   "cyberpunk neon"                → portraits of people in costume
 *   "fluid art marble"              → actual marbled fluid art         ✓
 *
 * Retune by running the query and reading the `alt` text of what returns —
 * that is the only description of the pixels available without eyes on them.
 *
 * The labels lean on the skins deliberately: someone who liked Emerald Nebula
 * should find Cosmic without translating "nebula" into a search term.
 */
export const ART_COLLECTIONS = [
  { id: "cosmic", label: "Cosmic", query: "nebula galaxy space" },
  { id: "aurora", label: "Aurora", query: "aurora borealis" },
  { id: "gradient", label: "Gradient", query: "gradient color background" },
  { id: "fluid", label: "Fluid", query: "fluid art marble" },
  { id: "watercolour", label: "Watercolour", query: "watercolor background" },
  { id: "geometric", label: "Geometric", query: "geometric abstract art" },
  { id: "clay", label: "Clay", query: "clay 3d render abstract" },
  { id: "blossom", label: "Blossom", query: "cherry blossom night" },
  { id: "surreal", label: "Surreal", query: "digital art landscape" },
  { id: "street", label: "Street art", query: "mural street art" },
  { id: "spooky", label: "Spooky", query: "halloween night illustration" },
];

/**
 * Six real Pexels photos, hard-coded, so the Images grid is NEVER empty.
 *
 * They are what shows before the first search resolves, and what stays if the
 * request fails outright — no key configured, no network, Pexels down, rate
 * limit hit. A picker whose whole job is "choose a background" showing an
 * empty box and an error is worse than one showing six backgrounds you can
 * actually pick, and every one of these applies exactly like a searched
 * result: same shape, same store, same CSS.
 *
 * ⚠️ These are LIVE URLs on Pexels' CDN, captured from the app's own route, so
 * they are as durable as any other result — but they are the one thing here
 * that can rot without anything failing loudly. If a tile ever comes up blank,
 * re-capture the set rather than patching one entry.
 */
export const FALLBACK_WALLPAPERS = [
  { id: "7135053", url: "https://images.pexels.com/photos/7135053/pexels-photo-7135053.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", thumb: "https://images.pexels.com/photos/7135053/pexels-photo-7135053.jpeg?auto=compress&cs=tinysrgb&h=350", photographer: "Codioful" },
  { id: "6985120", url: "https://images.pexels.com/photos/6985120/pexels-photo-6985120.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", thumb: "https://images.pexels.com/photos/6985120/pexels-photo-6985120.jpeg?auto=compress&cs=tinysrgb&h=350", photographer: "Codioful" },
  { id: "7130471", url: "https://images.pexels.com/photos/7130471/pexels-photo-7130471.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", thumb: "https://images.pexels.com/photos/7130471/pexels-photo-7130471.jpeg?auto=compress&cs=tinysrgb&h=350", photographer: "Codioful" },
  { id: "29355930", url: "https://images.pexels.com/photos/29355930/pexels-photo-29355930.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", thumb: "https://images.pexels.com/photos/29355930/pexels-photo-29355930.jpeg?auto=compress&cs=tinysrgb&h=350", photographer: "Landiva Weber" },
  { id: "12564253", url: "https://images.pexels.com/photos/12564253/pexels-photo-12564253.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", thumb: "https://images.pexels.com/photos/12564253/pexels-photo-12564253.jpeg?auto=compress&cs=tinysrgb&h=350", photographer: "Steve A Johnson" },
  { id: "28494633", url: "https://images.pexels.com/photos/28494633/pexels-photo-28494633.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", thumb: "https://images.pexels.com/photos/28494633/pexels-photo-28494633.jpeg?auto=compress&cs=tinysrgb&h=350", photographer: "Steve A Johnson" },
];

/**
 * Flatten one Pexels photo into the four things this app actually stores.
 *
 * `large2x` rather than `original`: original is frequently 5–8MB and is being
 * used as a background at viewport size, where 1880px wide is already more
 * than any display needs after `background-size: cover`.
 *
 * @param {object} photo A photo from the Pexels payload.
 */
export const toWallpaper = (photo) => ({
  id: String(photo.id),
  url: photo.src?.large2x || photo.src?.large || photo.src?.original || "",
  thumb: photo.src?.medium || photo.src?.small || "",
  // Credit travels WITH the choice, so the panel can show it for a photo
  // restored from storage without re-querying Pexels to find out who took it.
  photographer: photo.photographer || "",
});

/**
 * Search Pexels through the app's own route, which holds the API key
 * server-side (src/app/api/pexels/route.js — it existed before this feature).
 *
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{id: string, url: string, thumb: string, photographer: string}>>}
 */
export async function searchWallpapers(query, signal) {
  const params = new URLSearchParams({
    query: query || DEFAULT_QUERY,
    type: "photos",
    per_page: "18",
    // Landscape only. A portrait photo behind a landscape viewport is cropped
    // to its middle third, which is exactly where a photo's subject is.
    orientation: "landscape",
  });

  const response = await fetch(`/api/pexels?${params}`, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Pexels request failed (${response.status})`);
  }

  const data = await response.json();
  return (data.photos || []).map(toWallpaper).filter((item) => item.url);
}

/**
 * The last value handed to React. `null` means "not read yet".
 */
let snapshot = null;
const listeners = new Set();

const readStored = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return isSafeUrl(parsed?.url) ? parsed : null;
  } catch {
    // Unparseable, or storage is blocked entirely (private-mode Safari throws
    // on access). Either way: no wallpaper, and the app still renders.
    return null;
  }
};

/**
 * Is this URL safe to drop inside `url("…")` in a CSS declaration?
 *
 * REJECTS rather than sanitises, and that is the whole point. The first cut of
 * this stripped the offending characters instead — and quietly turned
 * `https://images.pexels.com/photos/…` into `http://image.pexel.com/photo/…`,
 * because one escaping slip in the character class made a literal `s` part of
 * what got stripped. A validator that returns false is a tile that does
 * nothing; a sanitiser that is wrong is a background that silently 404s and no
 * way to see why.
 *
 * ⚠️ The boot script in app/layout.js applies the SAME five rules by hand
 * (it cannot import this). Change one and change the other, or a URL will be
 * accepted on click and refused on reload.
 *
 * @param {unknown} url
 */
const isSafeUrl = (url) =>
  typeof url === "string" &&
  url.length > 0 &&
  !url.includes('"') &&
  !url.includes("'") &&
  !url.includes(")") &&
  !url.includes(" ") &&
  !url.includes("\\");

/**
 * Put the photo on <html>. Same contract as the skin's attribute: the CSS keys
 * off `data-wallpaper` being PRESENT, and the URL rides in a custom property,
 * so no stylesheet has to know it.
 */
const applyWallpaper = (wallpaper) => {
  const root = document.documentElement;
  if (!wallpaper?.url) {
    root.removeAttribute("data-wallpaper");
    root.style.removeProperty("--ck-wallpaper");
    return;
  }
  root.style.setProperty("--ck-wallpaper", `url("${wallpaper.url}")`);
  root.setAttribute("data-wallpaper", "");
};

const emit = () => listeners.forEach((listener) => listener());

/** Another tab changed it — or cleared storage entirely (`key === null`). */
const handleStorage = (event) => {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = null;
  applyWallpaper(getSnapshot());
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
const getServerSnapshot = () => null;

/**
 * Set or clear the photo behind the app.
 *
 * @param {{id: string, url: string, thumb: string, photographer: string}|null} wallpaper
 *   `null` clears it, which returns the app to its skin's own art (or to a
 *   plain page when no skin is on).
 */
export function setWallpaper(wallpaper) {
  const next = isSafeUrl(wallpaper?.url) ? wallpaper : null;
  if (getSnapshot()?.url === next?.url) return;

  snapshot = next;
  applyWallpaper(next);
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn("⚠️ [appearance] couldn't persist the wallpaper choice");
  }
  console.log(
    next ? `🖼️ [appearance] wallpaper → ${next.id}` : "🖼️ [appearance] wallpaper cleared",
  );
  emit();
}

/**
 * The chosen photo, or null.
 * @returns {[object|null, (wallpaper: object|null) => void]}
 */
export function useWallpaper() {
  const wallpaper = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [wallpaper, setWallpaper];
}
