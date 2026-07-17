"use client";

import React from "react";

/**
 * SignatureTile — one saved signature, click to drop it on the canvas. Renders
 * a text signature in its own font and an uploaded one as its image.
 *
 * Props: { signature: { kind, name?, fontFamily?, color?, src? }, onPick }
 */
export default function SignatureTile({ signature, onPick }) {
  return (
    <button
      onClick={onPick}
      title={signature.name ? `Add "${signature.name}"` : "Add signature"}
      className="w-full h-20 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-center p-2 bg-surface overflow-hidden"
    >
      {signature.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={signature.src}
          alt={signature.name || "Signature"}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <span
          className="text-2xl leading-tight truncate"
          style={{ fontFamily: signature.fontFamily, color: signature.color }}
        >
          {signature.name}
        </span>
      )}
    </button>
  );
}
