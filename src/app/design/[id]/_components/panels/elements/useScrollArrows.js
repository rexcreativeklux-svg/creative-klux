"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Sub-pixel slack: scrollLeft is fractional at non-integer zoom, so an exact
// comparison would leave the right arrow showing at the true end of the strip.
const EPSILON = 2;

/**
 * useScrollArrows — tracks how far a horizontal scroller is scrolled so callers
 * can show a left arrow only when there's content behind, and a right arrow only
 * when there's content ahead.
 *
 * Returns { ref, canLeft, canRight, onScroll, scrollBy } — spread `ref` and
 * `onScroll` onto the scrolling element; `scrollBy(-1 | 1)` pages it.
 */
export default function useScrollArrows() {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > EPSILON);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - EPSILON);
  }, []);

  // The panel is resizable and shape SVGs settle after first paint, so re-measure
  // on any size change rather than only on mount.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync]);

  const scrollBy = useCallback((dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  return { ref, canLeft, canRight, onScroll: sync, scrollBy };
}
