"use client";

import React, { useState } from "react";

/**
 * TablePicker — Canva-style grid selector for the Table tool. Hover to
 * highlight an R×C region and click to insert, or type an exact size below for
 * tables larger than the quick grid. Colocated with the Table tool under
 * panels/tools/table/, mirroring the signature tool.
 */
const MAX_ROWS = 8;
const MAX_COLS = 8;
const LIMIT = 50; // sanity cap for the custom fields

const clampSize = (n) => Math.min(LIMIT, Math.max(1, Math.round(n) || 1));

export default function TablePicker({ onPick }) {
  const [hover, setHover] = useState({ r: 3, c: 3 });
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const createCustom = () => onPick(clampSize(rows), clampSize(cols));

  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max p-3 rounded-2xl bg-surface shadow-2xl border border-gray-100 z-50">
      <p className="text-sm font-bold text-gray-800 mb-0.5">Table</p>
      <p className="text-xs text-gray-500 mb-2 tabular-nums">
        {hover.r} × {hover.c}
      </p>
      <div
        className="grid gap-1"
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
              onClick={() => onPick(r, c)}
              className={`w-5 h-5 rounded-[3px] border transition cursor-pointer ${
                on
                  ? "bg-blue-100 border-blue-400"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              }`}
            />
          );
        })}
      </div>

      {/* Custom size — type an exact rows × columns (e.g. 4 × 6) */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          Custom size
        </p>
        <div className="flex items-center gap-1.5">
          <SizeField label="Rows" value={rows} onChange={setRows} />
          <span className="text-gray-400 text-sm">×</span>
          <SizeField label="Cols" value={cols} onChange={setCols} />
          <button
            onClick={createCustom}
            className="ml-1 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
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
