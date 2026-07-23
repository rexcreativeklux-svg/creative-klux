"use client";

import React from "react";
import { GRAPHICS, graphicPreviewDataURL } from "@/(lib)/design/graphics";

/**
 * GraphicsLibrary — the Elements › Graphics library. A grid of curated
 * decorative vectors; click one to drop it on the canvas. Inserts via the
 * editor's `insert.graphic` API. Previews reuse the same SVG as the canvas/export
 * so they can't drift.
 *
 * Props: { insert }
 */
export default function GraphicsLibrary({ insert }) {
  return (
    <div className="p-3">
      <div className="grid grid-cols-3 gap-2">
        {GRAPHICS.map((g) => (
          <button
            key={g.key}
            onClick={() => insert.graphic(g.key)}
            title={g.label}
            className="w-full aspect-square rounded-lg border border-gray-200 p-2.5 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50/40 transition cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={graphicPreviewDataURL(g.key)}
              alt={g.label}
              draggable={false}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
