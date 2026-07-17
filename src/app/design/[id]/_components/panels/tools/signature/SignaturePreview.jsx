"use client";

import React from "react";

/**
 * SignaturePreview — the framed box showing the signature as it'll land on the
 * canvas. Renders the live text; falls back to a prompt while the name is empty.
 *
 * Props: { name, fontFamily, color }
 */
export default function SignaturePreview({ name, fontFamily, color }) {
  return (
    <div className="h-24 rounded-xl border border-gray-200 bg-surface flex items-center justify-center px-3 overflow-hidden">
      {name.trim() ? (
        <span
          className="text-3xl leading-tight truncate"
          style={{ fontFamily, color }}
        >
          {name}
        </span>
      ) : (
        <span className="text-xs text-gray-400">Your signature appears here</span>
      )}
    </div>
  );
}
