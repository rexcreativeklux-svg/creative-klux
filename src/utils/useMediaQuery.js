"use client";

// utils/useMediaQuery.js
// ─────────────────────────────────────────────────────────────────────────────
// "How wide is the window right now, and is the user touching it?" — answered
// by the browser's own media-query engine rather than by a resize listener we
// maintain ourselves.
//
// Same shape as (components)/home/useRotatingIndex.js: matchMedia IS a
// subscribable store, so useSyncExternalStore reads it directly instead of
// mirroring it into state via an effect. That means no resize handler, no
// stale value after a rotation, and a defined answer during SSR.
//
// ── WHAT THIS IS FOR, AND WHAT IT IS NOT FOR ────────────────────────────────
// Reach for CSS FIRST. `hidden lg:flex` is cheaper, has no hydration story,
// and cannot flash. These hooks exist for the things CSS genuinely cannot do:
//
//   ✅  gating BEHAVIOUR      — attach pinch-zoom listeners only on touch;
//                               trap focus in a sheet but not in a dropdown;
//                               skip an expensive canvas effect on mobile
//   ✅  choosing SEMANTICS    — render a <dialog> vs. a sheet with different
//                               aria roles; pass different props to a library
//   ⚠️  choosing MARKUP       — works, but see the hydration note below
//
// ── THE HYDRATION CONTRACT ──────────────────────────────────────────────────
// The server has no viewport, so it has to guess. It guesses DESKTOP — this
// app is built desktop-first, and that keeps the server's HTML matching what
// the majority of first paints look like.
//
// useSyncExternalStore handles the correction properly: it hydrates with the
// server's answer (so React never logs a mismatch), then swaps to the real
// value and re-renders. The cost is that on a phone, anything switched by
// these hooks renders its DESKTOP form for one frame before correcting.
//
// For behaviour that is invisible. For markup it is a visible flash — so if
// you are picking between two TREES, use CSS classes and let both exist in
// the HTML. Use the hook only to decide what those trees DO.

import { useCallback, useSyncExternalStore } from "react";

/**
 * The app's breakpoints, in px. These MUST stay in step with the
 * `--breakpoint-*` values in globals.css — they are the same scale expressed
 * for JS, and nothing enforces the match automatically.
 *
 * `xs` is ours; the rest are Tailwind's defaults. Note that `lg` (1024) is the
 * app's main structural switch: sidebar vs. drawer, rail vs. bottom bar.
 */
export const BREAKPOINTS = Object.freeze({
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
});

/**
 * One MediaQueryList per query string, reused for the life of the page.
 *
 * This cache is what makes the hook safe: useSyncExternalStore calls
 * `getSnapshot` on every render and re-subscribes whenever `subscribe`
 * changes identity. Creating a fresh MediaQueryList each time would mean a
 * fresh subscription each time — a resubscribe loop that quietly burns CPU.
 *
 * @type {Map<string, MediaQueryList | null>}
 */
const queryCache = new Map();

/**
 * @param {string} query A CSS media query, e.g. "(min-width: 1024px)".
 * @returns {MediaQueryList | null} null when matchMedia is unavailable
 *   (during SSR, or in a test environment that hasn't stubbed it).
 */
function getQueryList(query) {
  if (queryCache.has(query)) return queryCache.get(query);

  let list = null;
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    try {
      list = window.matchMedia(query);
    } catch (error) {
      // An invalid query string throws in some engines rather than never
      // matching. Log it loudly — a silent `false` here would look like a
      // layout bug somewhere else entirely.
      console.error(`❌ [useMediaQuery] invalid query "${query}":`, error);
      list = null;
    }
  }

  queryCache.set(query, list);
  return list;
}

/**
 * Subscribe to a media query. Returns the unsubscribe function React expects.
 *
 * @param {string} query
 * @param {() => void} onChange
 * @returns {() => void}
 */
function subscribeToQuery(query, onChange) {
  const list = getQueryList(query);
  if (!list) return () => {};

  // addEventListener is the modern API; addListener is the Safari <14
  // fallback. Both are still worth carrying — this app targets phones, and
  // old iOS Safari is exactly where the fallback matters.
  if (typeof list.addEventListener === "function") {
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }

  list.addListener(onChange);
  return () => list.removeListener(onChange);
}

/**
 * Track a media query.
 *
 * @param {string} query          A CSS media query, e.g. "(pointer: coarse)".
 * @param {boolean} [serverValue] What the server should assume. Defaults to
 *   false; the wrappers below pass the value that keeps SSR desktop-shaped.
 * @returns {boolean} Whether the query currently matches.
 *
 * @example
 * const canHover = useMediaQuery("(hover: hover)");
 */
export function useMediaQuery(query, serverValue = false) {
  const subscribe = useCallback(
    (onChange) => subscribeToQuery(query, onChange),
    [query],
  );

  const getSnapshot = useCallback(() => getQueryList(query)?.matches ?? false, [query]);

  // Returned during SSR and during hydration, then replaced by the real value.
  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Is the viewport at or above a named breakpoint?
 *
 * Mirrors how Tailwind's `lg:` prefix reads — `useBreakpoint("lg")` is true
 * exactly when `lg:` classes are applying.
 *
 * Assumes TRUE on the server (desktop-first), so SSR output matches the
 * desktop layout.
 *
 * @param {keyof typeof BREAKPOINTS} name
 * @returns {boolean}
 *
 * @example
 * const isDesktop = useBreakpoint("lg");
 * useEffect(() => {
 *   if (isDesktop) return;            // pinch-zoom is touch-only
 *   return attachPinchZoom(stageRef.current);
 * }, [isDesktop]);
 */
export function useBreakpoint(name) {
  const min = BREAKPOINTS[name];

  if (min === undefined) {
    // Thrown rather than defaulted: a typo'd breakpoint that silently
    // resolved to "always desktop" would be near-impossible to spot in a UI.
    throw new Error(
      `[useBreakpoint] unknown breakpoint "${name}". Expected one of: ${Object.keys(BREAKPOINTS).join(", ")}`,
    );
  }

  return useMediaQuery(`(min-width: ${min}px)`, true);
}

/**
 * The app's main structural switch — true below `lg` (1024px), where the
 * sidebar becomes a drawer, panels become sheets and the bottom nav appears.
 *
 * Named for what it means to the layout rather than for the number, so the
 * threshold can move in one place. Assumes FALSE on the server (desktop).
 *
 * @returns {boolean}
 */
export function useIsCompact() {
  return !useBreakpoint("lg");
}

/**
 * Is the primary input a finger rather than a mouse?
 *
 * The right question for anything about hit areas, hover affordances or
 * gesture handling — a 900px-wide *window* on a desktop is not a touch device,
 * and a 1400px tablet is. Pairs with the `pointer: coarse` gate on `ck-tap`
 * in globals.css, so JS and CSS agree on who counts as touch.
 *
 * Assumes FALSE on the server (mouse).
 *
 * @returns {boolean}
 */
export function useIsTouch() {
  return useMediaQuery("(pointer: coarse)", false);
}
