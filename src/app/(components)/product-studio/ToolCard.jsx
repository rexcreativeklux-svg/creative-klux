"use client";

/**
 * ToolCard — a single tile in the header tool-switcher: tool name on the left, a
 * real thumbnail on the right that falls back to the colored icon tile if the
 * image fails to load. Shared by every Product Studio modal's tool switcher.
 */

import { useState } from "react";

/**
 * @param {object} props
 * @param {object} props.tool   One entry from TOOL_LIST ({ id, name, Icon, color, img }).
 * @param {boolean} props.active Whether this is the currently-open tool.
 * @param {(id: string) => void} props.onClick Called with the tool id when clicked.
 */
export default function ToolCard({ tool, active, onClick }) {
  const [imgOk, setImgOk] = useState(true);
  const { Icon } = tool;
  return (
    <button
      onClick={() => onClick(tool.id)}
      className={`w-full flex items-stretch justify-between gap-2 rounded-xl overflow-hidden h-16 text-left transition-colors ${active ? "ring-2 ring-blue-500 bg-blue-50" : "bg-gray-100 hover:bg-gray-100"}`}
    >
      <span className="text-sm font-semibold text-gray-900 leading-tight self-center pl-3.5 flex-1">
        {tool.name}
      </span>
      <div
        className={`w-20 shrink-0 flex items-center justify-center ${tool.color}`}
      >
        {imgOk ? (
          <img
            src={tool.img}
            alt={tool.name}
            className="w-full h-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <Icon className="w-6 h-6" />
        )}
      </div>
    </button>
  );
}
