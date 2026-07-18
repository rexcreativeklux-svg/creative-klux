"use client";

// components/gallery/GallerySkeleton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Loading placeholders for the GRID media tabs (video / audio / document / and
// the editor's 2-up uploads grid), sized to match each MediaCard body so a
// "loading more" state reads as the same layout filling in.
//
// The image tab uses a JS column masonry instead (see MasonryGrid), which renders
// its own per-column skeletons — a CSS grid can't place skeletons at the bottom
// of a masonry.
//
// Renders a Fragment of bare tiles — no wrapper — so it drops straight INSIDE the
// existing grid container and flows with the real cards.

import { Fragment } from "react";

const TILE = "bg-gray-200 animate-pulse rounded-2xl w-full";

/**
 * @param {object} props
 * @param {"video"|"audio"|"document"|"image"} [props.type]  Active media type (for aspect ratio).
 * @param {number} [props.count]  How many placeholder tiles to render.
 */
export default function GallerySkeleton({ type = "image", count = 4 }) {
  const aspect =
    type === "video"
      ? "aspect-video"
      : type === "audio"
        ? "h-20"
        : "aspect-square"; // image / document

  return (
    <Fragment>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`sk-${i}`} className={`${TILE} ${aspect}`} />
      ))}
    </Fragment>
  );
}
