"use client";

import React from "react";

/**
 * ColorSwatch — one clickable colour chip.
 *
 * Props: { color, onClick, title?, size? }
 */
export default function ColorSwatch({ color, onClick, title, size = "w-9 h-9" }) {
  return (
    <button
      onClick={() => onClick(color)}
      title={title || color}
      className={`${size} rounded-lg border border-gray-200 hover:scale-105 hover:border-blue-400 transition cursor-pointer shadow-sm`}
      style={{ background: color }}
    />
  );
}
