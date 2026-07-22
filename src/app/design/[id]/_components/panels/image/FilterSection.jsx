"use client";

import React, { useState } from "react";
import { IMAGE_FILTERS } from "@/(lib)/design/imageAdjust";
import { proxiedSrc } from "@/(lib)/design/renderDesign";
import { SectionHeader, PresetStrip } from "./imageEditControls";

/**
 * FilterSection — design-editor-style Filter: a header with "See more", a
 * horizontal strip of filter thumbnails previewed on the real image, and (when
 * expanded) the full filter grid. Writes el.filter.
 */
export default function FilterSection({ editor }) {
  const [expanded, setExpanded] = useState(false);
  const el = editor?.selectedElement;
  const thumb = el?.src ? proxiedSrc(el.src) : null;
  const activeId = el?.filter || "none";

  const pickFilter = (id) =>
    editor.updateElement(el.id, { filter: id }, { record: true });

  const Tile = ({ f, strip = false }) => {
    const active = activeId === f.id;
    return (
      <button
        onClick={() => pickFilter(f.id)}
        title={f.label}
        className={`flex flex-col items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer transition-colors ${
          strip ? "shrink-0 w-[68px]" : "w-full"
        } ${active ? "border-blue-500 ring-1 ring-blue-400" : "border-gray-200 hover:border-blue-400"}`}
      >
        <span
          className="relative flex items-center justify-center rounded-md w-full overflow-hidden bg-gray-100"
          style={{ height: strip ? 44 : 56 }}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={f.label}
              crossOrigin="anonymous"
              draggable={false}
              className="w-full h-full object-cover"
              style={{ filter: f.css || "none" }}
            />
          ) : (
            <span className="w-full h-full bg-gray-100" style={{ filter: f.css || "none" }} />
          )}
        </span>
        <span className={`text-[10px] ${active ? "text-blue-600 font-medium" : "text-gray-600"}`}>
          {f.label}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      <SectionHeader title="Filters" expanded={expanded} onToggle={() => setExpanded((v) => !v)} />

      {!expanded ? (
        <PresetStrip>
          {IMAGE_FILTERS.map((f) => (
            <Tile key={f.id} f={f} strip />
          ))}
        </PresetStrip>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {IMAGE_FILTERS.map((f) => (
            <Tile key={f.id} f={f} />
          ))}
        </div>
      )}
    </div>
  );
}
