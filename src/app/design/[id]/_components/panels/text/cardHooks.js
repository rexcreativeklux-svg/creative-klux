"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// ── Fonts landing ──────────────────────────────────────────────────────────
// A card's boxes are measured with the face its text is set in; measured
// before that face arrives they fit the fallback instead. Every card re-measures
// when a batch of faces lands — at most once a frame, since they land in bursts.

let fontsVersion = 0;
const listeners = new Set();
let listening = false;
let frame = 0;

function subscribe(listener) {
  listeners.add(listener);
  if (!listening && typeof document !== "undefined" && document.fonts) {
    listening = true;
    document.fonts.addEventListener("loadingdone", () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        fontsVersion += 1;
        listeners.forEach((l) => l());
      });
    });
  }
  return () => listeners.delete(listener);
}

/** A number that changes whenever web fonts finish loading. */
export function useFontsVersion() {
  return useSyncExternalStore(subscribe, () => fontsVersion, () => 0);
}

/**
 * True once the element has come within 200px of view, and from then on — a
 * library is a few hundred cards, and only the ones near view are drawn (and
 * pull their fonts).
 *
 * @returns {[React.RefObject, boolean]}
 */
export function useNearView() {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || near) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setNear(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near]);

  return [ref, near];
}
