"use client";

import React from "react";
import { FRAMES } from "@/(lib)/design/frames";
import FramePreview from "./FramePreview";

/**
 * FramesLibrary — the Elements › Frames library. A grid of frame shapes; click
 * one to drop an empty frame onto the canvas, then double-click it (or drop an
 * image onto it) to fill it. Inserts via the editor's `insert.frame` API.
 *
 * Props: { insert }
 */
export default function FramesLibrary({ insert }) {
  return (
    <div className="p-3 flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        Add a frame, then double-click it or drop an image on it to fill.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {FRAMES.map((f) => (
          <FramePreview
            key={f.key}
            frameKey={f.key}
            label={f.label}
            onPick={insert.frame}
          />
        ))}
      </div>
    </div>
  );
}
