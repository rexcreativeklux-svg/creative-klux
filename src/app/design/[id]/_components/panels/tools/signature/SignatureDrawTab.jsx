"use client";

import React from "react";
import { Undo2 } from "lucide-react";
import SignatureDrawCanvas from "./SignatureDrawCanvas";
import SignatureColorPicker from "./SignatureColorPicker";

/**
 * SignatureDrawTab — draw a signature freehand. Strokes, weight and colour live
 * in the parent draft, so switching tabs keeps the drawing and "Add" can
 * rasterise it. The result is added as a trimmed transparent PNG.
 *
 * Props: { draft } — the useSignatureDraft bag.
 */
export default function SignatureDrawTab({ draft }) {
  const {
    strokes,
    setStrokes,
    strokeWidth,
    setStrokeWidth,
    color,
    setColor,
  } = draft;

  const commit = (stroke) => setStrokes((s) => [...s, stroke]);
  const undo = () => setStrokes((s) => s.slice(0, -1));
  const clear = () => setStrokes([]);

  return (
    <div className="flex flex-col gap-4">
      <SignatureDrawCanvas
        strokes={strokes}
        onCommit={commit}
        color={color}
        width={strokeWidth}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={undo}
          disabled={!strokes.length}
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-default cursor-pointer transition"
        >
          <Undo2 className="w-4 h-4" /> Undo
        </button>
        <button
          onClick={clear}
          disabled={!strokes.length}
          className="h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-red-300 hover:text-red-500 disabled:opacity-50 disabled:cursor-default cursor-pointer transition"
        >
          Clear
        </button>
      </div>

      <Field label="Weight">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={20}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="flex-1 cursor-pointer accent-blue-600"
          />
          <span className="w-9 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-600 tabular-nums">
            {strokeWidth}
          </span>
        </div>
      </Field>

      <Field label="Color">
        <SignatureColorPicker value={color} onChange={setColor} />
      </Field>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      {children}
    </div>
  );
}
