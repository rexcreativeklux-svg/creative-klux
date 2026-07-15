"use client";

import React from "react";
import { SHAPES } from "@/(lib)/design/shapes";
import ShapeSVG from "./ShapeSVG";

// currentColor so previews follow the surrounding text color (readable in light
// AND dark — a fixed dark fill vanished on the dark sidebar).
const PREVIEW_FILL = "currentColor";

/**
 * ShapeGrid — a reusable grid of clickable shape tiles. Shared by the Elements
 * panel and the Tools › Shapes flyout so previews and behaviour can't drift.
 *
 * Props: { keys: string[], onPick: (key) => void, cols?: number }
 */
export default function ShapeGrid({ keys, onPick, cols = 5 }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onPick(key)}
          title={SHAPES[key]?.label || key}
          className="aspect-square rounded-lg border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-center p-2"
        >
          <ShapeSVG shape={key} fill={PREVIEW_FILL} fit />
        </button>
      ))}
    </div>
  );
}
