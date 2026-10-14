"use client";

import React, { useState } from "react";
import { Volume2, VolumeX, FlipHorizontal, FlipVertical, Ban } from "lucide-react";
import { BORDER_DASHES, borderDashArray, borderLineCap } from "@/(lib)/design/borderDash";
import { VIDEO_SPEEDS } from "@/(lib)/design/video";

/**
 * The video toolbar's drop-downs — Volume, Speed, Border, Flip. Rendered by
 * EditorContextBar as siblings of its scrolling row, like its other popovers,
 * so overflow-x doesn't clip them.
 *
 * Sliders keep their value locally while dragged and write it back once, on
 * release: a write per pixel of travel would fill the undo history with a
 * single drag. Each popover is keyed by its committed value at the call site,
 * so an undo that changes it underneath re-seeds the local copy.
 */

const PANEL =
  "absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-2xl border border-gray-100 bg-surface p-4 shadow-2xl z-[9999]";

/** Volume — mute toggle and a 0–100 level. */
export function VolumePopover({ el, onCommit }) {
  const muted = !!el.muted;
  const [level, setLevel] = useState(muted ? 0 : Math.round((el.volume ?? 1) * 100));
  const commit = () => onCommit({ volume: level / 100, muted: level === 0 });

  return (
    <div className={`${PANEL} w-64`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-gray-700">Volume</p>
        <span className="w-12 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-600 tabular-nums">
          {level}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          // Unmuting brings back the level it had, or full if that was 0.
          onClick={() =>
            onCommit(muted ? { muted: false, volume: el.volume || 1 } : { muted: true })
          }
          title={muted ? "Unmute" : "Mute"}
          className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg cursor-pointer transition ${
            muted ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          onPointerUp={commit}
          onKeyUp={commit}
          className="w-full cursor-pointer accent-blue-600"
        />
      </div>
    </div>
  );
}

/** Speed — the playback rates Canva offers. */
export function SpeedPopover({ el, onCommit }) {
  const speed = Number(el.speed) || 1;
  return (
    <div className={`${PANEL} w-64`}>
      <p className="text-sm font-semibold text-gray-700 mb-2">Speed</p>
      <div className="grid grid-cols-5 gap-1.5">
        {VIDEO_SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onCommit({ speed: s })}
            className={`h-8 rounded-lg border text-xs font-medium tabular-nums cursor-pointer transition ${
              speed === s
                ? "border-blue-500 bg-blue-50 text-blue-600"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Border — Canva's picker: a row of styles (none, solid, long dash, short
 * dash, dotted) and a Stroke weight slider with its value in a box. Picking a
 * style on a border-less video gives it a weight to show the style with; the
 * colour lives on the toolbar's swatch, which appears once there's a border.
 */
export function BorderPopover({ el, onCommit }) {
  const [weight, setWeight] = useState(Number(el.borderWidth) || 0);
  const [draft, setDraft] = useState(null); // the number box while typing
  const style = weight > 0 ? el.borderDash || "solid" : "none";

  // A weight with no colour would draw in the default; seeding it makes the
  // stored value match what's on screen, for the export and for copy style.
  const write = (w, extra = {}) => {
    const n = Math.round(Math.min(MAX_STROKE, Math.max(0, w)));
    setWeight(n);
    onCommit({
      borderWidth: n,
      ...(n > 0 && !el.borderColor ? { borderColor: "#000000" } : {}),
      ...extra,
    });
  };

  const pickStyle = (id) =>
    id === "none" ? write(0) : write(weight > 0 ? weight : 4, { borderDash: id });

  return (
    <div className={`${PANEL} w-80 flex flex-col gap-4`}>
      <div className="grid grid-cols-5 gap-2">
        {BORDER_DASHES.map((d) => (
          <button
            key={d.id}
            onClick={() => pickStyle(d.id)}
            title={d.label}
            className={`h-11 flex items-center justify-center rounded-xl border-2 cursor-pointer transition ${
              style === d.id ? "border-blue-500" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {d.id === "none" ? (
              <Ban className="w-5 h-5 text-gray-700" />
            ) : (
              <svg width="30" height="4" viewBox="0 0 30 4">
                <line
                  x1="1"
                  y1="2"
                  x2="29"
                  y2="2"
                  stroke="#374151"
                  strokeWidth="2.5"
                  strokeDasharray={borderDashArray(d.id, 2.5).join(" ") || undefined}
                  strokeLinecap={borderLineCap(d.id)}
                />
              </svg>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-700">Stroke weight</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={MAX_STROKE}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            onPointerUp={() => write(weight)}
            onKeyUp={() => write(weight)}
            aria-label="Stroke weight"
            className="flex-1 cursor-pointer accent-blue-600"
          />
          <input
            value={draft ?? String(weight)}
            onFocus={(e) => {
              setDraft(String(weight));
              e.target.select();
            }}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => {
              const n = Number(draft);
              setDraft(null);
              if (Number.isFinite(n)) write(n);
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            aria-label="Stroke weight value"
            className="w-14 h-10 rounded-lg border border-gray-200 text-center text-sm text-gray-700 tabular-nums focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>
    </div>
  );
}

const MAX_STROKE = 100;

/** Flip — horizontal and vertical, one menu like Canva's. */
export function FlipPopover({ el, onCommit }) {
  // Plain action rows, as in Canva: each press flips again, so there is no
  // on/off state worth showing — the video itself shows it.
  const row = (key, label, Icon) => (
    <button
      onClick={() => onCommit({ [key]: !el[key] })}
      className="w-full h-11 flex items-center gap-3 rounded-lg px-3 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer transition"
    >
      <Icon className="w-5 h-5 text-gray-700" />
      {label}
    </button>
  );
  return (
    <div className={`${PANEL} w-60 p-2!`}>
      {row("flipH", "Flip horizontal", FlipHorizontal)}
      {row("flipV", "Flip vertical", FlipVertical)}
    </div>
  );
}

