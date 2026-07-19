"use client";

import React, { useState } from "react";

/**
 * TablesLibrary — the Elements › Tables library. Insert a table by hovering the
 * quick grid to size an R×C region and clicking, by typing an exact size, or by
 * picking a common preset. Drops onto the canvas via the editor's `insert.table`
 * API (the same one the Tools rail uses), so tables render and export identically.
 *
 * Rendered inline inside the 300px Elements column (unlike the Tools rail's
 * TablePicker, which is a right-side flyout).
 *
 * Props: { insert }
 */
const MAX_ROWS = 8;
const MAX_COLS = 6;
const LIMIT = 50; // sanity cap for the custom fields

const clampSize = (n) => Math.min(LIMIT, Math.max(1, Math.round(n) || 1));

const PRESETS = [
  { label: "2 × 2", rows: 2, cols: 2 },
  { label: "3 × 3", rows: 3, cols: 3 },
  { label: "2 × 4", rows: 2, cols: 4 },
  { label: "4 × 2", rows: 4, cols: 2 },
];

export default function TablesLibrary({ insert }) {
  const [hover, setHover] = useState({ r: 3, c: 3 });
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const add = (r, c) => insert.table({ rows: clampSize(r), cols: clampSize(c) });

  return (
    <div className="p-3 flex flex-col gap-4">
      {/* Quick grid — hover to size, click to insert */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500">Insert a table</p>
          <span className="text-xs text-gray-400 tabular-nums">
            {hover.r} × {hover.c}
          </span>
        </div>
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)` }}
          onMouseLeave={() => setHover({ r: 0, c: 0 })}
        >
          {Array.from({ length: MAX_ROWS * MAX_COLS }).map((_, i) => {
            const r = Math.floor(i / MAX_COLS) + 1;
            const c = (i % MAX_COLS) + 1;
            const on = r <= hover.r && c <= hover.c;
            return (
              <button
                key={i}
                onMouseEnter={() => setHover({ r, c })}
                onClick={() => add(r, c)}
                title={`${r} × ${c} table`}
                className={`aspect-square rounded-[4px] border transition cursor-pointer ${
                  on
                    ? "bg-blue-100 border-blue-400"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Presets */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          Popular sizes
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => add(p.rows, p.cols)}
              className="h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom size */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          Custom size
        </p>
        <div className="flex items-center gap-1.5">
          <SizeField label="Rows" value={rows} onChange={setRows} />
          <span className="text-gray-400 text-sm">×</span>
          <SizeField label="Cols" value={cols} onChange={setCols} />
          <button
            onClick={() => add(rows, cols)}
            className="ml-1 flex-1 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function SizeField({ label, value, onChange }) {
  return (
    <input
      type="number"
      min={1}
      max={LIMIT}
      value={value}
      aria-label={label}
      title={label}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="w-12 h-8 px-2 rounded-lg border border-gray-200 text-sm text-gray-700 text-center focus:outline-none focus:border-blue-400 tabular-nums"
    />
  );
}
