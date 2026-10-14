"use client";

import React, { useState } from "react";
import { X, Scan, Image as ImageIcon } from "lucide-react";
import { CROP_RATIOS, MAX_CROP_ROTATE } from "@/(lib)/design/videoCrop";
import { PresetStrip } from "../panels/image/imageEditControls";

/**
 * VideoCropPanel — Canva's Crop side panel for a video: an Aspect ratio
 * carousel (Freeform, Original, 1:1, 16:9 …), a Rotate slider that straightens
 * the footage inside the frame, and Cancel / Done pinned at the bottom.
 *
 * It only edits the crop SESSION (DesignEditor owns it; the overlay on the
 * canvas reads the same session) — nothing touches the element until Done.
 *
 * Props: { session: { ratio, rotate }, onRatio, onRotate, onCancel, onDone, onClose }
 */
export default function VideoCropPanel({ session, onRatio, onRotate, onCancel, onDone, onClose }) {
  return (
    <section className="w-full h-[55dvh] shrink-0 bg-surface border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col lg:w-75 lg:h-auto lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r">
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800">Crop</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {!session ? (
        <p className="px-4 py-6 text-xs text-gray-400">Select a video and press Crop.</p>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-800">Aspect ratio</p>
              <PresetStrip>
                {CROP_RATIOS.map((r) => (
                  <RatioTile
                    key={r.id}
                    ratio={r}
                    active={session.ratio === r.id}
                    onClick={() => onRatio(r.id)}
                  />
                ))}
              </PresetStrip>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-700">Rotate</p>
              <RotateControl value={session.rotate} onChange={onRotate} />
            </div>
          </div>

          <footer className="shrink-0 border-t border-gray-100 p-3 grid grid-cols-2 gap-2">
            <button
              onClick={onCancel}
              className="h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              onClick={onDone}
              className="h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 cursor-pointer transition"
            >
              Done
            </button>
          </footer>
        </>
      )}
    </section>
  );
}

/** One ratio: its shape drawn to scale in a square tile, the name beneath. */
function RatioTile({ ratio, active, onClick }) {
  const icon =
    ratio.id === "free" ? (
      <Scan className="w-6 h-6" />
    ) : ratio.id === "original" ? (
      <ImageIcon className="w-6 h-6" />
    ) : (
      <span
        className="block rounded-[3px] border-2 border-current"
        style={
          ratio.r >= 1
            ? { width: 30, height: Math.round(30 / ratio.r) }
            : { height: 30, width: Math.round(30 * ratio.r) }
        }
      />
    );
  return (
    <button
      onClick={onClick}
      title={ratio.label}
      className="shrink-0 w-24 flex flex-col items-center gap-1.5 cursor-pointer"
    >
      <span
        className={`w-24 h-24 flex items-center justify-center rounded-2xl border-2 text-gray-700 transition ${
          active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-gray-300 bg-gray-50"
        }`}
      >
        {icon}
      </span>
      <span className={`text-xs font-medium ${active ? "text-blue-600" : "text-gray-700"}`}>
        {ratio.label}
      </span>
    </button>
  );
}

/** −45…45° slider with the angle in an editable box. Previews live. */
function RotateControl({ value, onChange }) {
  const [draft, setDraft] = useState(null);
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={-MAX_CROP_ROTATE}
        max={MAX_CROP_ROTATE}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Rotate"
        className="flex-1 cursor-pointer accent-blue-600"
      />
      <input
        value={draft ?? String(value)}
        onFocus={(e) => {
          setDraft(String(value));
          e.target.select();
        }}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d-]/g, ""))}
        onBlur={() => {
          const n = Number(draft);
          setDraft(null);
          if (Number.isFinite(n)) {
            onChange(Math.max(-MAX_CROP_ROTATE, Math.min(MAX_CROP_ROTATE, Math.round(n))));
          }
        }}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        aria-label="Rotate degrees"
        className="w-14 h-10 rounded-lg border border-gray-200 text-center text-sm text-gray-700 tabular-nums focus:outline-none focus:border-blue-400"
      />
    </div>
  );
}
