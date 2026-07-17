"use client";

import React from "react";

/**
 * FontCombinationTile — previews one preset in its own font and colour. The
 * label wraps to two lines rather than truncating, so "GOLDEN HOUR" reads as
 * itself instead of "GOLDEN HO…".
 *
 * Props: { combination, onPick: (combination) => void }
 */
export default function FontCombinationTile({ combination: c, onPick }) {
  return (
    <button
      onClick={() => onPick(c)}
      title={`Add "${c.name}"`}
      className="h-20 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-center px-2 overflow-hidden"
      style={{
        fontFamily: c.fontFamily,
        fontWeight: c.fontWeight,
        color: c.fill,
        letterSpacing: c.letterSpacing,
      }}
    >
      <span className="text-sm leading-tight text-center line-clamp-2">
        {c.content}
      </span>
    </button>
  );
}
