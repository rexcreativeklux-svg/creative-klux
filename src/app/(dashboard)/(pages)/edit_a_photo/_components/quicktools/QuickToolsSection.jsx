"use client";

import { useState } from "react";
import { Palette, Eraser, Crop, Droplet, Rotate3d } from "lucide-react";

/**
 * QuickToolsSection — compact tile grid of one-tap photo tools, matching the
 * design/[id] editor's quick tools: per-tool preview image (lucide-icon
 * fallback), collapsed to 3 tiles with a "See more" toggle. Purely
 * presentational: every action is a handler passed in from PhotoEditor.
 *
 * Tile images live in /public/images/quick-tools (shared with the design editor).
 *
 * Props:
 *   disabled       — true when there's no image to act on (tiles greyed out)
 *   onBgRemover, onBlur, onCrop, onPerspective, onMagicEraser — tile actions
 */
const QUICK_TOOL_IMG = "/images/quick-tools";

// How many tiles show before "See more".
const COLLAPSED_COUNT = 3;

export default function QuickToolsSection({
  disabled,
  onBgRemover,
  onBlur,
  onCrop,
  onPerspective,
  onMagicEraser,
}) {
  const [expanded, setExpanded] = useState(false);

  const tools = [
    { label: "Bg Remover", icon: Palette, img: "backgroundRemover", onClick: onBgRemover },
    { label: "Magic Eraser", icon: Eraser, img: "magicEraser", onClick: onMagicEraser },
    { label: "Crop", icon: Crop, img: "crop", onClick: onCrop },
    { label: "Blur", icon: Droplet, img: "blur", onClick: onBlur },
    { label: "Perspective", icon: Rotate3d, img: "perspective", onClick: onPerspective },
  ];

  const shown = expanded ? tools : tools.slice(0, COLLAPSED_COUNT);

  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500">Quick tools</span>
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
        {shown.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.label}
              onClick={tool.onClick}
              disabled={disabled}
              title={tool.label}
              className="flex flex-col items-center gap-1 p-1 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/40 text-[10px] leading-tight text-center text-gray-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {tool.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${QUICK_TOOL_IMG}/${tool.img}.webp`}
                  alt=""
                  draggable={false}
                  className="w-full aspect-square object-cover rounded-md"
                />
              ) : (
                <span className="w-full aspect-square flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
              )}
              <span className="truncate w-full">{tool.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
