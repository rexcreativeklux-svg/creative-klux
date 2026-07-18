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

import { Fragment, useEffect, useState } from "react";

// Varied skeleton heights (px) so the placeholders look like real photos of
// different aspect ratios rather than a uniform block.
const SKELETON_HEIGHTS = [176, 224, 200, 256, 192, 240];

/**
 * Responsive column count matching the old `columns-2 sm:3 md:4 lg:5` classes
 * (Tailwind breakpoints: sm 640 · md 768 · lg 1024), measured off the viewport
 * so it behaves exactly like the CSS-columns layout it replaces.
 */
function useResponsiveColumns() {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCols(5);
      else if (w >= 768) setCols(4);
      else if (w >= 640) setCols(3);
      else setCols(2);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
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
  const columns = useResponsiveColumns();

  // Round-robin the items into column buckets. Deterministic → stable across
  // pagination appends (an item keeps its column as long as the count is fixed).
  const buckets = Array.from({ length: columns }, () => []);
  items.forEach((it, i) => buckets[i % columns].push({ it, i }));

  return (
    <div className="flex items-start" style={{ gap }}>
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
