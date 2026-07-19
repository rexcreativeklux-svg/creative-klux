"use client";

import React from "react";
import { ImagePlus } from "lucide-react";
import { frameGeo } from "@/(lib)/design/frames";

/**
 * FramePreview — one clickable frame tile for the Frames library. Renders the
 * frame's shape as a grey fill (keeping aspect) with an image glyph, so it reads
 * as "drop a photo here". Geometry comes from the shared frameGeo, so previews
 * can't drift from the canvas/export rendering.
 *
 * Props: { frameKey: string, label: string, onPick: (key) => void }
 */
export default function FramePreview({ frameKey, label, onPick }) {
  const { path, viewBox } = frameGeo(frameKey);
  const [vw, vh] = viewBox;

  return (
    <button
      onClick={() => onPick(frameKey)}
      title={label}
      className="relative w-full aspect-square rounded-lg border border-gray-200 p-2 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50/40 transition cursor-pointer group"
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        <path
          d={path}
          className="fill-gray-200 group-hover:fill-blue-200 transition-colors"
        />
      </svg>
      <ImagePlus className="absolute w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
    </button>
  );
}
