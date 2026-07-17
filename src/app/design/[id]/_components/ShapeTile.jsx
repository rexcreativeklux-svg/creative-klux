"use client";

import React from "react";
import { SHAPES } from "@/(lib)/design/shapes";
import ShapeSVG from "./ShapeSVG";

// currentColor so previews follow the surrounding text color (readable in light
// AND dark — a fixed dark fill vanished on the dark sidebar).
const PREVIEW_FILL = "currentColor";

// "tile" = the bordered thumbnail used in browse rows and flyouts.
// "plain" = borderless, used where the shape itself is the whole point (the
// "See all" gallery), matching Canva's full-bleed previews.
const VARIANTS = {
  tile: "rounded-lg border border-gray-200 p-2 text-gray-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/40",
  plain: "rounded-lg p-1 text-gray-900 hover:bg-gray-100",
};

/**
 * ShapeTile — one clickable shape preview. Sizing comes from the parent (grid
 * column or strip item width); the tile just fills it.
 *
 * Props: { shape: string, onPick: (key) => void, variant?: "tile" | "plain" }
 */
export default function ShapeTile({ shape, onPick, variant = "tile" }) {
  return (
    <button
      onClick={() => onPick(shape)}
      title={SHAPES[shape]?.label || shape}
      className={`w-full aspect-square cursor-pointer transition flex items-center justify-center ${
        VARIANTS[variant] || VARIANTS.tile
      }`}
    >
      <ShapeSVG shape={shape} fill={PREVIEW_FILL} fit />
    </button>
  );
}
