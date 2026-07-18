"use client";

// components/gallery/GallerySkeleton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Loading placeholders that MATCH the real gallery arrangement (not generic
// square boxes), so a "loading more" state reads as the same layout filling in:
//   • masonry (images)      → varied-height tiles that flow through CSS columns
//   • grid (video/doc/audio)→ aspect-correct tiles matching MediaCard bodies
//
// It renders a Fragment of bare tiles — no wrapper element — so it can be dropped
// straight INSIDE the existing grid/columns container and flow with real cards.

import { Fragment } from "react";

// A rotating set of heights so masonry skeletons look organic, like real photos
// of different aspect ratios rather than a uniform block.
const MASONRY_HEIGHTS = [
  "h-40",
  "h-56",
  "h-44",
  "h-64",
  "h-48",
  "h-52",
  "h-60",
  "h-44",
];

const TILE = "bg-gray-200 animate-pulse rounded-2xl w-full";

/**
 * @param {object} props
 * @param {"image"|"video"|"audio"|"document"} [props.type]  Active media type.
 * @param {boolean} [props.masonry]  True for the images columns layout; false for
 *   a fixed grid (e.g. the editor Uploads panel, which is always a 2-up grid).
 * @param {number} [props.count]     How many placeholder tiles to render.
 */
export default function GallerySkeleton({
  type = "image",
  masonry = type === "image",
  count = 8,
}) {
  const tiles = Array.from({ length: count });

  // Images in a masonry (CSS columns) container → varied heights, and
  // break-inside-avoid so a tile is never split across two columns.
  if (masonry) {
    return (
      <Fragment>
        {tiles.map((_, i) => (
          <div
            key={`sk-${i}`}
            className={`${TILE} ${MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length]} break-inside-avoid`}
          />
        ))}
      </Fragment>
    );
  }

  // Grid layouts — match the aspect ratio each MediaCard type renders.
  const aspect =
    type === "video"
      ? "aspect-video"
      : type === "audio"
        ? "h-20"
        : "aspect-square"; // image / document

  return (
    <Fragment>
      {tiles.map((_, i) => (
        <div key={`sk-${i}`} className={`${TILE} ${aspect}`} />
      ))}
    </Fragment>
  );
}
