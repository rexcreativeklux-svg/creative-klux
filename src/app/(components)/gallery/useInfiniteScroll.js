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

import { useEffect, useRef } from "react";

/**
 * Walk up from a node to the nearest vertically-scrollable ancestor. Returns
 * null when none is found, which IntersectionObserver treats as the viewport.
 * @param {HTMLElement | null} node
 * @returns {HTMLElement | null}
 */
function getScrollParent(node) {
  let el = node?.parentElement || null;
  while (el) {
    const { overflowY } = window.getComputedStyle(el);
    const scrollable = /(auto|scroll|overlay)/.test(overflowY);
    if (scrollable && el.scrollHeight > el.clientHeight) return el;
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
 * @returns {import("react").RefObject<HTMLDivElement>} ref for the sentinel element.
 */
export default function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading = false,
  rootMargin = "400px",
}) {
  const sentinelRef = useRef(null);

  // Keep the latest callback without re-creating the observer on every render.
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const node = sentinelRef.current;
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
    // sentinel is still on screen (content didn't fill the viewport) it fires
    // again for the next page.
  }, [hasMore, loading, rootMargin]);

  return sentinelRef;
}
