"use client";

import React, { useState } from "react";
import { Sparkles, Eraser, Crop, Droplet, Rotate3d } from "lucide-react";

// How many tiles show before "See more" (design-editor style).
const COLLAPSED_COUNT = 3;

/**
 * ImageQuickTools — compact one-tap tile grid at the top of the "Edit image"
 * panel, styled like the design editor reference (per-tool preview image with a
 * lucide-icon fallback). Purely presentational: every tile reuses a handler
 * passed down from DesignEditor via `imageActions`. Colocated beside
 * EditImagePanel.
 *
 * Tile images live in /public/images/quick-tools (copied from the design editor).
 *
 * Props:
 *   imageActions — { onRemoveBg, onStartErase, onStartCrop, onBlur, onPerspective }
 *                  (BG/Eraser/Crop take the element id)
 *   elementId    — the selected image element's id
 */
const QUICK_TOOL_IMG = "/images/quick-tools";

export default function ImageQuickTools({ imageActions, elementId }) {
  const [expanded, setExpanded] = useState(false);

  if (!imageActions) return null;

  const tools = [
    { label: "BG Remover", icon: Sparkles, img: "backgroundRemover", onClick: () => imageActions.onRemoveBg?.(elementId) },
    { label: "Eraser", icon: Eraser, img: "magicEraser", onClick: () => imageActions.onStartErase?.(elementId) },
    { label: "Crop", icon: Crop, img: "crop", onClick: () => imageActions.onStartCrop?.(elementId) },
    { label: "Blur", icon: Droplet, img: "blur", onClick: () => imageActions.onBlur?.(elementId) },
    { label: "Perspective", icon: Rotate3d, img: "perspective", onClick: () => imageActions.onPerspective?.(elementId) },
  ];

  const shown = expanded ? tools : tools.slice(0, COLLAPSED_COUNT);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500">Quick tools</p>
        {tools.length > COLLAPSED_COUNT && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            {expanded ? "See less" : "See more"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {shown.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              onClick={t.onClick}
              title={t.label}
              className="flex flex-col items-center gap-1 p-1 rounded-lg border border-gray-200 text-[10px] leading-tight font-medium text-gray-600 hover:border-blue-400 hover:bg-blue-50/40 transition cursor-pointer"
            >
              {t.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${QUICK_TOOL_IMG}/${t.img}.webp`}
                  alt=""
                  draggable={false}
                  className="w-full aspect-square object-cover rounded-md"
                />
              ) : (
                <span className="w-full aspect-square flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
              )}
              <span className="truncate w-full text-center">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
