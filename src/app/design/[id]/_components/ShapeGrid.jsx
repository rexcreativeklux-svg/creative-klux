"use client";

import React from "react";
import ShapeTile from "./ShapeTile";

/**
 * ShapeGrid — a reusable grid of clickable shape tiles. Shared by the Elements
 * panel and the Tools › Shapes flyout so previews and behaviour can't drift.
 *
 * Props: { keys: string[], onPick: (key) => void, cols?: number, variant? }
 */
export default function ShapeGrid({ keys, onPick, cols = 5, variant = "tile" }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {keys.map((key) => (
        <ShapeTile key={key} shape={key} onPick={onPick} variant={variant} />
      ))}
    </div>
  );
}
