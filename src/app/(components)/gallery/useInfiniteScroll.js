"use client";

// components/gallery/useInfiniteScroll.js
// ─────────────────────────────────────────────────────────────────────────────
// A reusable "load the next page when the bottom comes into view" hook, built on
// IntersectionObserver. It auto-detects the nearest scrollable ancestor of the
// sentinel, so the SAME hook works for the window (gallery page), a modal's
// inner overflow container (MediaPickerModal) and the editor side panel alike —
// callers don't have to know or pass their scroll container.
//
// Usage:
//   const sentinelRef = useInfiniteScroll({ onLoadMore, hasMore, loading });
//   ...
//   <div ref={sentinelRef} />   // place just after the grid

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Walk up from a node to the nearest vertically-scrollable ancestor. Returns
 * null when none is found, which IntersectionObserver treats as the viewport.
 *
 * Deliberately does NOT require the ancestor to be overflowing right now. This
 * runs the moment the sentinel mounts, when the grid's images have no intrinsic
 * height yet and the container therefore isn't taller than its box — an
 * `overflow-y: auto` ancestor is the scrolling and clipping context whether or
 * not it happens to overflow at this instant. Demanding `scrollHeight >
 * clientHeight` here silently resolved a modal's own scroller to the viewport.
 *
 * @param {HTMLElement | null} node
 * @returns {HTMLElement | null}
 */
function getScrollParent(node) {
  let el = node?.parentElement || null;
  while (el) {
    const { overflowY } = window.getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(overflowY)) return el;
    el = el.parentElement;
  }
  return null; // → viewport
}

/**
 * @param {object} opts
 * @param {() => void} opts.onLoadMore   Called when the sentinel scrolls into view.
 * @param {boolean} opts.hasMore         Stop observing when there's nothing left.
 * @param {boolean} [opts.loading]       Re-arm the observer after a load settles.
 * @param {string} [opts.rootMargin]     Pre-fetch distance from the edge.
 * @returns {(el: HTMLElement | null) => void} callback ref for the sentinel.
 */
export default function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading = false,
  rootMargin = "400px",
}) {
  // A CALLBACK ref, not an object ref, and the node is STATE so that attaching
  // the sentinel re-runs the effect.
  //
  // Callers render the sentinel only once there's a grid to put it under, which
  // is a render or two after this hook first runs — so with an object ref the
  // first effect pass saw `null` and bailed, and whether it ever ran again came
  // down to luck: it needed `hasMore` or `loading` to change value AFTER the
  // sentinel mounted. On the gallery page it did (that caller passes the
  // initial-load flag, which flips true→false as page 1 lands). In the media
  // picker and the editor's uploads panel it did not — they pass `loadingMore`,
  // which is false before page 1 and false after, while `hasMore` is true in
  // both. The observer was never created there and only the first 30 items ever
  // loaded, no matter how far you scrolled.
  const [node, setNode] = useState(null);
  const sentinelRef = useCallback((el) => {
    setNode(el);
  }, []);

  // Keep the latest callback without re-creating the observer on every render.
  // Synced in an effect rather than assigned during render — the observer only
  // reads it from its own callback, long after this has committed.
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!node || !hasMore) return;

    const root = getScrollParent(node);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreRef.current?.();
      },
      { root, rootMargin, threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
    // `loading` is a dep so the observer re-arms once a page settles: if the
    // sentinel is still on screen (content didn't fill the container) it fires
    // again for the next page.
  }, [node, hasMore, loading, rootMargin]);

  return sentinelRef;
}
