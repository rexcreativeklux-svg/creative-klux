"use client";

import React from "react";
import ShapeTile from "../../ShapeTile";
import ScrollArrowButton from "./ScrollArrowButton";
import useScrollArrows from "./useScrollArrows";

// Roughly five tiles across the 300px panel, matching the browse rows' density.
const TILE_WIDTH = 48;

/**
 * HorizontalShapeStrip — one row of shape tiles that scrolls sideways, with a
 * chevron on each side that only appears when there's more to scroll to. The
 * edges fade under the arrows so a half-clipped tile reads as "more this way"
 * rather than as a broken shape.
 *
 * Props: { keys: string[], onPick: (key) => void }
 */
export default function HorizontalShapeStrip({ keys, onPick }) {
  const { ref, canLeft, canRight, onScroll, scrollBy } = useScrollArrows();

  return (
    <div className="relative">
      {canLeft && (
        <>
          <span className="absolute left-0 top-0 bottom-0 w-10 z-[5] pointer-events-none bg-gradient-to-r from-surface to-transparent" />
          <ScrollArrowButton side="left" onClick={() => scrollBy(-1)} />
        </>
      )}

      <div
        ref={ref}
        onScroll={onScroll}
        className="flex gap-2 overflow-x-auto hide-scrollbar scroll-smooth"
      >
        {keys.map((key) => (
          <div
            key={key}
            className="shrink-0"
            style={{ width: TILE_WIDTH }}
          >
            <ShapeTile shape={key} onPick={onPick} />
          </div>
        ))}
      </div>

      {canRight && (
        <>
          <span className="absolute right-0 top-0 bottom-0 w-10 z-[5] pointer-events-none bg-gradient-to-l from-surface to-transparent" />
          <ScrollArrowButton side="right" onClick={() => scrollBy(1)} />
        </>
      )}
    </div>
  );
}
