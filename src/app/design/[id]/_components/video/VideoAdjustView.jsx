"use client";

import React, { useState } from "react";
import { Wand2, Lightbulb, Sun, Droplets } from "lucide-react";
import { toast } from "sonner";
import { proxiedSrc } from "@/(lib)/design/renderDesign";
import { captureVideoFrame, clipRange } from "@/(lib)/design/video";

/**
 * VideoAdjustView — Canva's Adjust for a video: Auto-adjust, then
 *
 *   White balance — Temperature, Tint
 *   Light         — Brightness, Contrast, Highlights, Shadows, Whites, Blacks
 *   Color         — Vibrance, Saturation
 *
 * and Reset adjustments pinned at the bottom. Every value is −100…100 and
 * lands in `el.adjust`; buildImageFilter turns it into CSS + an SVG tone curve
 * (toneFilter.js), live on the playing video and in the export alike.
 * Temperature is stored as `warmth`, the key the image Adjust already uses, so
 * copy style and older designs agree on it.
 *
 * Dragging previews live: the history entry is pushed when the thumb is
 * pressed, and the moves write without one — a whole drag is one undo step.
 *
 * Props: { editor }
 */
const GROUPS = [
  {
    title: "White balance",
    icon: Lightbulb,
    rows: [
      { key: "warmth", label: "Temperature", track: "linear-gradient(90deg,#7c9cf0,#efe7dc,#e8a75c)" },
      { key: "tint", label: "Tint", track: "linear-gradient(90deg,#8fd18a,#ece6ef,#c48be0)" },
    ],
  },
  {
    title: "Light",
    icon: Sun,
    rows: [
      { key: "brightness", label: "Brightness" },
      { key: "contrast", label: "Contrast" },
      { key: "highlights", label: "Highlights" },
      { key: "shadows", label: "Shadows" },
      { key: "whites", label: "Whites" },
      { key: "blacks", label: "Blacks" },
    ],
  },
  {
    title: "Color",
    icon: Droplets,
    rows: [
      { key: "vibrance", label: "Vibrance" },
      { key: "saturation", label: "Saturation" },
    ],
  },
];

const ALL_KEYS = GROUPS.flatMap((g) => g.rows.map((r) => r.key));

export default function VideoAdjustView({ editor }) {
  const el = editor.selectedElement;
  const adjust = el?.adjust || {};
  const [busy, setBusy] = useState(false);
  const dirty = ALL_KEYS.some((k) => Number(adjust[k]));

  const write = (key, value, record) =>
    editor.updateElement(el.id, { adjust: { ...adjust, [key]: value } }, { record });

  // Reads a frame — the saved still if there is one, otherwise a fresh grab
  // (which is then kept as the still, since the export needs one too) — and
  // REPLACES the tone settings with what it suggests. Replacing rather than
  // adding is what makes a second press land on the same result instead of
  // compounding the first.
  const autoAdjust = async () => {
    const id = el.id;
    setBusy(true);
    try {
      let frame = el.poster || null;
      if (!frame) {
        frame = await captureVideoFrame(el.src, { time: clipRange(el).start || undefined });
        if (frame) editor.updateElement(id, { poster: frame }, { record: false });
      }
      if (!frame) throw new Error("no frame");
      const values = await suggestAdjust(proxiedSrc(frame));
      const next = { ...adjust };
      ALL_KEYS.forEach((k) => delete next[k]);
      editor.updateElement(id, { adjust: { ...next, ...values } }, { record: true });
      toast.success("Auto-adjusted — fine-tune with the sliders");
    } catch {
      toast.error("Couldn't read this video's frames to auto-adjust it.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-7">
        <button
          onClick={autoAdjust}
          disabled={busy}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 cursor-pointer transition"
        >
          <Wand2 className="w-4 h-4" />
          {busy ? "Adjusting…" : "Auto-adjust"}
        </button>

        {GROUPS.map(({ title, icon: Icon, rows }) => (
          <div key={title} className="flex flex-col gap-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Icon className="w-4 h-4" />
              {title}
            </p>
            {rows.map((r) => (
              <AdjustRow
                key={`${el.id}:${r.key}`}
                label={r.label}
                track={r.track}
                value={Number(adjust[r.key]) || 0}
                onBegin={() => editor.commit()}
                onLive={(v) => write(r.key, v, false)}
                onCommit={(v) => write(r.key, v, true)}
              />
            ))}
          </div>
        ))}
      </div>

      <footer className="shrink-0 border-t border-gray-100 p-3">
        <button
          onClick={() => {
            const next = { ...adjust };
            ALL_KEYS.forEach((k) => delete next[k]);
            editor.updateElement(el.id, { adjust: next }, { record: true });
          }}
          disabled={!dirty}
          className="w-full h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default transition"
        >
          Reset adjustments
        </button>
      </footer>
    </div>
  );
}

/** One −100…100 slider with its value in an editable box. */
function AdjustRow({ label, track, value, onBegin, onLive, onCommit }) {
  const [draft, setDraft] = useState(String(value));
  // The box follows the stored value when it changes underneath — a drag, an
  // undo, auto-adjust, reset. Synced during render, not keyed: a key on the
  // value would remount the slider mid-drag and drop the thumb.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(String(value));
  }
  const pct = ((value + 100) / 200) * 100;

  const commitDraft = () => {
    const n = Math.round(Math.min(100, Math.max(-100, Number(draft) || 0)));
    setDraft(String(n));
    if (n !== value) onCommit(n);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-700">{label}</p>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 h-5 flex items-center">
          <div
            className="absolute inset-x-0 h-1.5 rounded-full"
            style={{ background: track || "#e5e7eb" }}
          />
          {/* Fill from the centre to the value, on the plain tracks. */}
          {!track && value !== 0 && (
            <div
              className="absolute h-1.5 rounded-full bg-blue-600"
              style={{ left: `${Math.min(50, pct)}%`, width: `${Math.abs(pct - 50)}%` }}
            />
          )}
          <input
            type="range"
            min={-100}
            max={100}
            value={value}
            onPointerDown={onBegin}
            onKeyDown={onBegin}
            onChange={(e) => onLive(Number(e.target.value))}
            aria-label={label}
            className="relative w-full appearance-none bg-transparent cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border
                       [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:shadow
                       [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-gray-300"
          />
        </div>
        <input
          type="number"
          min={-100}
          max={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => e.key === "Enter" && commitDraft()}
          className="w-14 h-10 rounded-lg border border-gray-200 text-center text-sm text-gray-700 tabular-nums focus:outline-none focus:border-blue-400"
        />
      </div>
    </div>
  );
}

/**
 * Settings read off one frame, the way a photo app's "auto" works:
 *
 *   levels   — Blacks/Whites move the darkest and brightest 2% of the frame
 *              out to the ends of the range (toneFilter's end bands move the
 *              extremes by 0.18 at full strength, which sets the scale);
 *   midtones — Shadows/Highlights pull the median toward the middle;
 *   contrast — opened up when the frame is flat, eased when it's harsh;
 *   balance  — Temperature and Tint cancel the cast in the mid-tones;
 *   colour   — Vibrance in inverse proportion to how saturated it already is.
 *
 * Values outside ±60 are clamped: past that the CSS approximations stop
 * looking like corrections. Zeros are left out, so the sliders read clean.
 */
async function suggestAdjust(src) {
  const img = await new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
  const size = 96;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const lum = [];
  let sum = 0;
  let sumSq = 0;
  let chroma = 0;
  let mr = 0;
  let mg = 0;
  let mb = 0;
  let mids = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lum.push(l);
    sum += l;
    sumSq += l * l;
    chroma += Math.max(r, g, b) - Math.min(r, g, b);
    // The cast is judged on mid-tones: clipped whites and crushed blacks are
    // neutral whatever the lighting was, and would water the reading down.
    if (l > 0.2 && l < 0.85) {
      mr += r;
      mg += g;
      mb += b;
      mids += 1;
    }
  }
  const n = lum.length;
  lum.sort((a, b) => a - b);
  const pct = (p) => lum[Math.min(n - 1, Math.floor(p * n))];
  const lo = pct(0.02);
  const hi = pct(0.98);
  const median = pct(0.5);
  const mean = sum / n;
  const spread = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  const sat = chroma / n;

  const clamp = (v, lim = 60) => Math.round(Math.max(-lim, Math.min(lim, v)));
  const out = {
    blacks: clamp((-(lo - 0.02) / 0.18) * 100),
    whites: clamp(((0.98 - hi) / 0.18) * 100),
    shadows: median < 0.42 ? clamp(((0.47 - median) / 0.22) * 80) : 0,
    highlights: median > 0.6 ? clamp((-(median - 0.55) / 0.22) * 80) : 0,
    contrast: spread < 0.18 ? clamp((0.2 - spread) * 200, 30) : spread > 0.3 ? clamp((0.28 - spread) * 150, 30) : 0,
    vibrance: clamp(sat < 0.12 ? 30 : sat < 0.22 ? 18 : 6, 40),
  };
  if (mids) {
    const r = mr / mids;
    const g = mg / mids;
    const b = mb / mids;
    out.warmth = clamp(-(r - b) * 250, 40); // + warmer, − cooler
    out.tint = clamp((g - (r + b) / 2) * 300, 40); // + magenta, − green
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v));
}
