"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { RESIZE_GROUPS } from "./resizePresets";

/**
 * ResizePanel — pick a preset (or custom) size to resize the canvas. Applying a
 * size calls editor.resizeCanvas(w, h), which re-fits every element to the new
 * dimensions in one undoable step (see useDesignEditor). No API call — the new
 * size persists through the editor's normal save/autosave.
 *
 * Props: { editor }
 */
export default function ResizePanel({ editor }) {
  const { canvas, resizeCanvas } = editor;
  const [query, setQuery] = useState("");
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");

  const apply = (w, h) => {
    const nw = Math.round(Number(w));
    const nh = Math.round(Number(h));
    if (!nw || !nh || nw < 1 || nh < 1) return;
    resizeCanvas(nw, nh);
  };

  const q = query.trim().toLowerCase();
  const groups = RESIZE_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => !q || it.label.toLowerCase().includes(q)),
  })).filter((g) => g.items.length);

  const isCurrent = (it) => canvas.width === it.w && canvas.height === it.h;

  const inputCls =
    "w-full min-w-0 rounded-lg border border-gray-200 bg-surface px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <div className="flex h-full flex-col">
      {/* Current size + custom + search */}
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-gray-100">
        <p className="mb-2 text-[11px] text-gray-400">
          Current:{" "}
          <span className="font-semibold text-gray-600">
            {canvas.width} × {canvas.height}px
          </span>
        </p>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            value={customW}
            onChange={(e) => setCustomW(e.target.value)}
            placeholder="W"
            className={inputCls}
          />
          <span className="text-xs text-gray-400">×</span>
          <input
            type="number"
            min={1}
            value={customH}
            onChange={(e) => setCustomH(e.target.value)}
            placeholder="H"
            className={inputCls}
          />
          <button
            onClick={() => apply(customW, customH)}
            disabled={!customW || !customH}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Set
          </button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sizes"
          className={`${inputCls} mt-2`}
        />
      </div>

      {/* Preset groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {groups.map((g) => (
          <div key={g.title} className="mb-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {g.title}
            </p>
            <div className="flex flex-col gap-1">
              {g.items.map((it) => {
                const active = isCurrent(it);
                return (
                  <button
                    key={it.id}
                    onClick={() => apply(it.w, it.h)}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition cursor-pointer border ${
                      active
                        ? "border-blue-200 bg-blue-50"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100 text-[11px] font-bold text-blue-600">
                      {it.label[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-gray-700">
                        {it.label}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        {it.w} × {it.h}
                        {it.ratio ? ` · ${it.ratio}` : ""}
                      </span>
                    </span>
                    {active && (
                      <Check className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {!groups.length && (
          <p className="py-6 text-center text-xs text-gray-400">
            No sizes match “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}
