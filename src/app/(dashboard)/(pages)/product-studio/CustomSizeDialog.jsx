"use client";

import { useState } from "react";
import { X } from "lucide-react";

// "Custom size" on the blank-canvas rail: ask for W×H, then hand it back.

const MIN_EDGE = 50;
const MAX_EDGE = 8000;

/**
 * @param {object} props
 * @param {() => void} props.onCancel
 * @param {(w: number, h: number) => void} props.onCreate
 */
export default function CustomSizeDialog({ onCancel, onCreate }) {
  const [w, setW] = useState(1080);
  const [h, setH] = useState(1080);
  const valid = [w, h].every((n) => Number.isFinite(n) && n >= MIN_EDGE && n <= MAX_EDGE);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onCreate(Math.round(w), Math.round(h));
        }}
        className="w-full max-w-xs rounded-2xl bg-surface p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Custom size</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-end gap-2">
          {[
            ["Width", w, setW],
            ["Height", h, setH],
          ].map(([label, value, set]) => (
            <label key={label} className="flex-1 text-xs text-gray-500">
              {label}
              <input
                type="number"
                min={MIN_EDGE}
                max={MAX_EDGE}
                value={Number.isFinite(value) ? value : ""}
                onChange={(e) => set(e.target.valueAsNumber)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-page px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500"
              />
            </label>
          ))}
          <span className="pb-2 text-xs text-gray-400">px</span>
        </div>
        {!valid && (
          <p className="mt-2 text-xs text-red-500">
            Each side must be {MIN_EDGE}–{MAX_EDGE} px.
          </p>
        )}
        <button
          type="submit"
          disabled={!valid}
          className="mt-4 h-9 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          Create design
        </button>
      </form>
    </div>
  );
}
