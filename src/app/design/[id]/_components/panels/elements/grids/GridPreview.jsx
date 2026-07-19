"use client";

import React from "react";

/**
 * GridPreview — one clickable grid-layout tile. Draws a miniature of the rows ×
 * cols layout as grey cells, so it reads as "a photo grid". Clicking inserts an
 * empty grid of that size via the editor's `insert.grid`.
 *
 * Props: { rows, cols, onPick: ({rows, cols}) => void }
 */
export default function GridPreview({ rows, cols, onPick }) {
  return (
    <button
      onClick={() => onPick({ rows, cols })}
      title={`${rows} × ${cols} grid`}
      className="w-full aspect-square rounded-lg border border-gray-200 p-2 hover:border-blue-400 hover:bg-blue-50/40 transition cursor-pointer group"
    >
      <div
        className="w-full h-full grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div
            key={i}
            className="rounded-[3px] bg-gray-200 group-hover:bg-blue-200 transition-colors"
          />
        ))}
      </div>
    </button>
  );
}
