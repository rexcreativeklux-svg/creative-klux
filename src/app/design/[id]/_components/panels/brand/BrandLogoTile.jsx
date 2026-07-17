"use client";

import React, { useState } from "react";
import { ImageOff } from "lucide-react";

/**
 * BrandLogoTile — the brand logo, click to drop it on the canvas.
 *
 * Imported logos are third-party URLs that can be dead or CORS-blocked, so a
 * load failure is expected, not exceptional: we show the URL as unreachable
 * instead of a broken-image glyph, and don't offer it as insertable — a
 * CORS-blocked image taints the canvas and breaks PNG export, which is a much
 * worse failure than not adding it.
 *
 * Props: { src, onPick }
 */
export default function BrandLogoTile({ src, onPick }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div
        className="w-full h-24 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 px-3"
        title={src}
      >
        <ImageOff className="w-5 h-5" />
        <span className="text-[10px] text-gray-400 text-center leading-tight">
          Logo image couldn’t load
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onPick(src)}
      title="Add logo to canvas"
      className="w-full h-24 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition bg-gray-50 flex items-center justify-center p-3"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Brand logo"
        onError={() => setBroken(true)}
        className="max-h-full max-w-full object-contain"
      />
    </button>
  );
}
