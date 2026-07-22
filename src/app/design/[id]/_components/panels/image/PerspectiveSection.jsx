"use client";

import React from "react";
import { Slider, SectionHeader } from "./imageEditControls";

/**
 * PerspectiveSection — Horizontal / Vertical keystone sliders (−100…100). Writes
 * el.perspective, which PerspectiveImage renders on screen and renderDesign
 * bakes into the export via the same warp.
 */
export default function PerspectiveSection({ editor }) {
  const el = editor?.selectedElement;
  const p = el?.perspective || { h: 0, v: 0 };
  const has = !!(p.h || p.v);

  const setP = (key, value) =>
    editor.updateElement(el.id, { perspective: { ...p, [key]: value } }, { record: true });

  const reset = () =>
    editor.updateElement(el.id, { perspective: null }, { record: true });

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Perspective"
        action={
          <button
            onClick={reset}
            disabled={!has}
            className={`text-[11px] font-semibold transition ${
              has ? "text-blue-600 hover:text-blue-700 cursor-pointer" : "text-gray-300 cursor-not-allowed"
            }`}
          >
            Reset
          </button>
        }
      />
      <Slider label="Horizontal" min={-100} max={100} value={p.h || 0} onChange={(v) => setP("h", v)} />
      <Slider label="Vertical" min={-100} max={100} value={p.v || 0} onChange={(v) => setP("v", v)} />
    </div>
  );
}
