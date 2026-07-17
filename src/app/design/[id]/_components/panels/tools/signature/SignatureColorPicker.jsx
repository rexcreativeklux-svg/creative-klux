"use client";

import React from "react";

// Ink colours. Custom covers everything else via the native picker.
const PRESETS = ["#111827", "#1d4ed8"];

/**
 * SignatureColorPicker — preset ink swatches plus any colour.
 *
 * Props: { value, onChange }
 */
export default function SignatureColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {PRESETS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={c}
          className={`w-9 h-9 rounded-full border transition cursor-pointer hover:scale-105 ${
            value === c
              ? "ring-2 ring-blue-500 ring-offset-1 border-transparent"
              : "border-gray-200"
          }`}
          style={{ background: c }}
        />
      ))}

      <label
        className="w-9 h-9 rounded-full cursor-pointer relative overflow-hidden shrink-0"
        style={{
          background:
            "conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)",
        }}
        title="Pick any color"
      >
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
    </div>
  );
}
