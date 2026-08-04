"use client";

// app/(components)/home/useRotatingIndex.js
// ─────────────────────────────────────────────────────────────────────────────
// "Which slide should be up right now?", answered by the clock rather than by a
// timer that started when this particular tab opened.
//
// Written for the home hero's backdrop rotation but deliberately knows nothing
// about it: hand it a length and an interval and it hands back an index.

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/* ── "Does this user want motion?" as an external store ────────────────────
   matchMedia is a subscribable browser store, so useSyncExternalStore reads it
   directly instead of mirroring it into state via an effect. That keeps the
   value correct if the OS setting is toggled while the page is open, and gives
   SSR a defined answer. */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** @param {() => void} onChange @returns {() => void} unsubscribe */
function subscribeToReducedMotion(onChange) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** The server assumes motion is fine, so the markup it sends is the same either
    way — this flag only ever gates a timer, never anything that renders. */
const getReducedMotionOnServer = () => false;

/** True when the OS asks for less animation. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer,
  );
}

/**
 * Which slot the current clock window lands on.
 *
 * Time is chopped into fixed `intervalMs` windows counted from the Unix epoch,
 * and the window number picks the slot. Two properties follow, and they are the
 * whole point:
 *
 *   • **Stable across reloads.** The answer depends only on the clock — nothing
 *     drawn, nothing stored — so refreshing mid-window returns the same slot.
 *   • **The same for everyone.** Epoch milliseconds are UTC, so a visitor in
 *     Lagos and one in Toronto are inside the same window at the same moment
 *     and see the same backdrop. No timezone enters the calculation.
 *
 * A drifting device clock is the one thing that breaks the second half: someone
 * whose clock is an hour out sits in a neighbouring window. Fixing that
 * properly needs a server-sent timestamp, which is not worth it for a backdrop.
 *
 * @param {number} count      how many slots there are
 * @param {number} intervalMs how long one slot is held
 * @param {number} [now]      epoch ms; injectable so this stays testable
 * @returns {number} the slot index, always within range
 */
export function windowIndex(count, intervalMs, now = Date.now()) {
  if (count < 1 || intervalMs < 1) return 0;
  return Math.floor(now / intervalMs) % count;
}

/** Milliseconds until the current window ends — when the slot next changes. */
function msUntilNextWindow(intervalMs, now = Date.now()) {
  return intervalMs - (now % intervalMs);
}

/**
 * useRotatingIndex — the index to show, derived from the clock.
 *
 *     const { index } = useRotatingIndex(slides.length, { intervalMs: 5000 });
 *
 * The order is the array's own order, advanced one step per window and wrapping
 * at the end. It is not random: randomness would mean a reload lands somewhere
 * new and two people looking at the same moment disagree, which is exactly what
 * this hook exists to prevent.
 *
 * Three things it does that a bare setInterval does not:
 *   • resolves the opening index on the client only. The server cannot know
 *     when the page will actually be looked at — and a prerendered or cached
 *     response would bake in a stale window — so slot 0 is what the server
 *     sends and the real slot is resolved on mount. Hence `instant` below.
 *   • ticks on the window boundary, not `intervalMs` after mount. Someone who
 *     arrives four hours into a five-hour window sees it change in one hour, at
 *     the same moment as everyone else, rather than five hours later on a
 *     schedule private to their tab.
 *   • recomputes when the tab is shown again, so a laptop that slept through a
 *     boundary is right the moment it wakes rather than at its next stale tick.
 *
 * Returns `{ index, instant }`. `instant` is true only for that first client
 * resolve — the caller should skip its transition while it's set, or the page
 * opens on a cross-fade out of index 0 that nobody asked to see. It clears a
 * frame later, well before any boundary, so real changes still animate.
 *
 * @param {number} count
 * @param {{intervalMs?: number, enabled?: boolean}} [options]
 * @returns {{index: number, instant: boolean}}
 */
export function useRotatingIndex(count, { intervalMs = 5000, enabled = true } = {}) {
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(true);
  const reduced = usePrefersReducedMotion();

  const syncToClock = useCallback(() => {
    setIndex(windowIndex(count, intervalMs));
  }, [count, intervalMs]);

  // Resolve the real slot — client-side, once per mount.
  useEffect(() => {
    let restore;

    const resolve = requestAnimationFrame(() => {
      syncToClock();

      // Re-arm the fade on the *following* frame, once that slot has been
      // painted. Not in the same commit: a browser starts a transition
      // whenever the new style has one, so setting the duration and the
      // opacity together would animate the very swap we are hiding.
      restore = requestAnimationFrame(() => setInstant(false));
    });

    return () => {
      cancelAnimationFrame(resolve);
      cancelAnimationFrame(restore);
    };
  }, [syncToClock]);

  // Boundary ticks. Reduced motion keeps the meaning it already had: nothing
  // is scheduled, so the backdrop resolved on arrival holds for the visit.
  // That costs no correctness — a reload still lands on the window everyone
  // else is in.
  useEffect(() => {
    if (!enabled || reduced || count < 2) return;

    let timer;

    // setTimeout to the boundary rather than setInterval from mount: the
    // change has to land on the shared boundary, and re-arming each time
    // also avoids the drift a long-lived interval accumulates.
    const arm = () => {
      timer = setTimeout(() => {
        syncToClock();
        arm();
      }, msUntilNextWindow(intervalMs));
    };

    arm();

    // A sleeping machine does not fire timers. Catch up on the way back in.
    const onVisible = () => {
      if (document.hidden) return;
      syncToClock();
      clearTimeout(timer);
      arm();
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [count, intervalMs, enabled, reduced, syncToClock]);

  // A shorter list arriving later (or a filtered pool) must not leave the
  // index pointing past the end.
  return { index: count > 0 ? index % count : 0, instant };
}

export default useRotatingIndex;
