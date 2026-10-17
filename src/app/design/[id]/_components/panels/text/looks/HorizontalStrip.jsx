"use client";

import React from "react";
import ScrollArrowButton from "../../elements/ScrollArrowButton";
import useScrollArrows from "../../elements/useScrollArrows";

/**
 * HorizontalStrip — one row of cards that scrolls sideways, with a chevron on
 * each side that only appears when there's more to scroll to. The edges fade
 * under the arrows so a half-clipped card reads as "more this way". The same
 * strip as the Elements panel's shape rows, for any card.
 *
 * Props: { items, itemWidth?, renderItem: (item, index) => node, keyFor? }
 */
export default function HorizontalStrip({ items, itemWidth = 56, renderItem, keyFor = (_item, i) => i }) {
  const { ref, canLeft, canRight, onScroll, scrollBy } = useScrollArrows();

  return (
    <div className="relative">
      {canLeft && (
        <>
          <span className="absolute left-0 top-0 bottom-0 w-10 z-[5] pointer-events-none bg-gradient-to-r from-surface to-transparent" />
          <ScrollArrowButton side="left" onClick={() => scrollBy(-1)} />
        </>
      )}

      <div ref={ref} onScroll={onScroll} className="flex gap-2 overflow-x-auto hide-scrollbar scroll-smooth">
        {items.map((item, i) => (
          <div key={keyFor(item, i)} className="shrink-0" style={{ width: itemWidth }}>
            {renderItem(item, i)}
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
