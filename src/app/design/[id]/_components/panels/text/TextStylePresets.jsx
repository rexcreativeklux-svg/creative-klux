"use client";

import React from "react";

/** Heading / subheading / body ladder. `preview` styles the sidebar row only. */
const DEFAULT_STYLES = [
  { label: "Add a heading", content: "Add a heading", fontSize: 72, fontWeight: "bold", preview: "text-2xl font-bold" },
  { label: "Add a subheading", content: "Add a subheading", fontSize: 44, fontWeight: 600, preview: "text-lg font-semibold" },
  { label: "Add a little bit of body text", content: "Add a little bit of body text", fontSize: 26, fontWeight: "normal", preview: "text-sm" },
];

/**
 * TextStylePresets — the heading/subheading/body ladder. Each row drops its own
 * style onto the canvas.
 *
 * Props: { onPick: (style) => void }
 */
export default function TextStylePresets({ onPick }) {
  return (
    <div className="flex flex-col gap-2">
      {DEFAULT_STYLES.map(({ preview, ...style }) => (
        <button
          key={style.label}
          onClick={() => onPick(style)}
          className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition"
        >
          <span className={`text-gray-800 ${preview}`}>{style.label}</span>
        </button>
      ))}
    </div>
  );
}
