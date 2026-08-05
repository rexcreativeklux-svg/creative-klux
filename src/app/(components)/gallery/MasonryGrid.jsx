"use client";

// components/gallery/MasonryGrid.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A JS column masonry (the Unsplash pattern) for the image tab.
//
// Why not CSS `columns`? With CSS columns the browser balances the WHOLE flow
// across columns, so a batch of "loading more" skeletons appended at the end
// piles into whichever column the flow happens to continue in — not at the
// bottom of every column. Here we instead distribute items into N explicit
// column stacks and append skeletons to the bottom of EACH stack, so the loader
// always reads as the masonry continuing to fill.
//
// Placement is deterministic (item i → column i % N), so appending a new page
// only extends the columns — already-rendered items never jump between columns
// (no reflow / no flicker) the way CSS-column balancing would cause.

import { Fragment, useEffect, useRef, useState } from "react";

// Varied skeleton heights (px) so the placeholders look like real photos of
// different aspect ratios rather than a uniform block.
const SKELETON_HEIGHTS = [176, 224, 200, 256, 192, 240];

/**
 * Column-count thresholds, measured against the GRID'S OWN WIDTH in px.
 * Each entry is [minContainerWidth, columns], widest first.
 *
 * Tuned so a tile never drops below ~150px, which is where thumbnails stop
 * being recognisable.
 */
const COLUMN_STEPS = [
  [950, 5],
  [700, 4],
  [480, 3],
];
const MIN_COLUMNS = 2;

/**
 * How many columns fit, based on the container rather than the window.
 *
 * ── WHY NOT window.innerWidth ───────────────────────────────────────────────
 * This used to read `window.innerWidth` against the Tailwind breakpoints, which
 * is only correct when the grid IS the viewport. It is not: the gallery sits in
 * the content area, which the desktop sidebar narrows by 224px. So a 1100px
 * window put five columns into an ~830px pane — ~150px tiles with the gutters,
 * and worse with a secondary sidebar open. The same mismatch made the grid
 * ignore the sidebar collapsing.
 *
 * ResizeObserver watches the element that actually holds the columns, so the
 * count is right in any container: full width, beside a sidebar, inside a
 * split pane, or in a modal.
 *
 * @param {import("react").RefObject<HTMLElement>} ref The grid container.
 * @returns {number} Column count (never below MIN_COLUMNS).
 */
function useResponsiveColumns(ref) {
  const [cols, setCols] = useState(MIN_COLUMNS);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Guard for older Safari and for test environments without the API —
    // the grid stays at MIN_COLUMNS rather than throwing.
    if (typeof ResizeObserver !== "function") {
      console.warn("⚠️ [masonry] ResizeObserver unavailable — using 2 columns");
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const step = COLUMN_STEPS.find(([min]) => width >= min);
      // setState from the observer CALLBACK, not the effect body — it is an
      // external subscription, which is exactly what effects are for.
      setCols(step ? step[1] : MIN_COLUMNS);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return cols;
}

/**
 * @param {object} props
 * @param {object[]} props.items                       Items to lay out.
 * @param {(item: object, index: number) => React.Key} [props.getKey]
 * @param {(item: object, index: number) => React.ReactNode} props.renderItem
 * @param {boolean} [props.loadingMore]                Show skeletons under each column.
 * @param {number} [props.skeletonPerColumn]           Skeletons per column while loading.
 * @param {number} [props.gap]                         Gap between tiles/columns (px).
 */
export default function MasonryGrid({
  items = [],
  getKey = (it, i) => it?.id ?? i,
  renderItem,
  loadingMore = false,
  skeletonPerColumn = 2,
  gap = 12,
}) {
  const containerRef = useRef(null);
  const columns = useResponsiveColumns(containerRef);

  // Round-robin the items into column buckets. Deterministic → stable across
  // pagination appends (an item keeps its column as long as the count is fixed).
  const buckets = Array.from({ length: columns }, () => []);
  items.forEach((it, i) => buckets[i % columns].push({ it, i }));

  return (
    <div ref={containerRef} className="flex items-start" style={{ gap }}>
      {buckets.map((bucket, c) => (
        <div
          key={c}
          className="flex min-w-0 flex-1 flex-col"
          style={{ gap }}
        >
          {bucket.map(({ it, i }) => (
            <Fragment key={getKey(it, i)}>{renderItem(it, i)}</Fragment>
          ))}

          {/* Load-more skeletons at the bottom of THIS column. */}
          {loadingMore &&
            Array.from({ length: skeletonPerColumn }).map((_, s) => (
              <div
                key={`sk-${c}-${s}`}
                className="w-full animate-pulse rounded-2xl bg-gray-200"
                style={{
                  height: SKELETON_HEIGHTS[(c + s) % SKELETON_HEIGHTS.length],
                }}
              />
            ))}
        </div>
      ))}
    </div>
  );
}
