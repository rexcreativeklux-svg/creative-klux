"use client";

import React, { useMemo, useState, useEffect } from "react";
import { X, Pipette, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

/**
 * ColorPanel — Canva-style colour picker opened from the context toolbar's
 * colour swatch (text fill, note colour, shape fill, table colours, line
 * colour…). Renders as a contextual side panel (no rail tab), mirroring
 * FontPanel. Which colour it edits is described by `target`:
 *
 *   target = { title, keys, fallback }
 *     keys     — element properties the picked colour is written to (e.g.
 *                ["fill","color"] for text, ["headerFill"] for a table header)
 *     fallback — shown when the element has none of those keys set
 *
 * The panel always applies to `editor.selectedElement`, so it never holds a
 * stale reference to a deselected element.
 *
 * Props: { editor, target, onClose }
 */

// Default swatch palette — a broad, Canva-like spread.
const DEFAULT_SWATCHES = [
  "#000000", "#545454", "#737373", "#a6a6a6", "#d9d9d9", "#ffffff",
  "#ff3131", "#ff5757", "#ff66c4", "#cb6ce6", "#8c52ff", "#5e17eb",
  "#0097b2", "#0cc0df", "#5ce1e6", "#38b6ff", "#5271ff", "#004aad",
  "#00bf63", "#7ed957", "#c1ff72", "#ffde59", "#ffbd59", "#ff914d",
];

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

// Normalize any value to a #rrggbb string, or null when it isn't a solid hex.
const toHex = (v) => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return HEX_RE.test(s) ? (s.startsWith("#") ? s : `#${s}`).toLowerCase() : null;
};

// Collect the unique solid colours already used across the design's elements
// (and page background) so the user can reuse them — Canva's "Colours in this
// design" row.
const COLOR_KEYS = [
  "fill",
  "color",
  "stroke",
  "background",
  "headerFill",
  "cellFill",
  "textColor",
  "borderColor",
];
function collectDesignColors(elements = [], background) {
  const seen = new Set();
  const out = [];
  const add = (v) => {
    const hex = toHex(v);
    if (hex && !seen.has(hex)) {
      seen.add(hex);
      out.push(hex);
    }
  };
  add(background);
  for (const el of elements) {
    for (const k of COLOR_KEYS) add(el?.[k]);
  }
  return out;
}

export default function ColorPanel({ editor, target, onClose }) {
  const { activeBrand } = useAuth();
  const el = editor?.selectedElement;

  // Current colour for the target — first set key wins, else the fallback.
  const current =
    (target?.keys?.map((k) => el?.[k]).find(Boolean)) ||
    target?.fallback ||
    "#000000";
  const currentHex = toHex(current) || "#000000";

  const [hexInput, setHexInput] = useState(currentHex.slice(1));

  // Keep the hex field in step when the selection / target colour changes.
  useEffect(() => {
    setHexInput(currentHex.slice(1));
  }, [currentHex]);

  const designColors = useMemo(
    () => collectDesignColors(editor?.elements, editor?.canvas?.background),
    [editor?.elements, editor?.canvas?.background],
  );

  const brandColors = [activeBrand?.primary_color, activeBrand?.secondary_color]
    .map(toHex)
    .filter(Boolean);

  const apply = (color) => {
    const hex = toHex(color);
    if (!hex) return;
    if (!el || !target?.keys?.length) {
      toast.info("Select an element to change its colour.");
      return;
    }
    const patch = {};
    for (const k of target.keys) patch[k] = hex;
    editor.updateElement(el.id, patch, { record: true });
  };

  const onHexChange = (raw) => {
    const cleaned = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setHexInput(cleaned);
    if (cleaned.length === 6) apply(`#${cleaned}`);
  };

  const pickEyedropper = async () => {
    if (typeof window === "undefined" || !window.EyeDropper) {
      toast.info("Your browser doesn't support the eyedropper.");
      return;
    }
    try {
      const ed = new window.EyeDropper();
      const { sRGBHex } = await ed.open();
      apply(sRGBHex);
    } catch {
      /* user cancelled — no-op */
    }
  };

  return (
    <section className="w-[300px] shrink-0 bg-surface border-r border-gray-200 flex flex-col">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800">
          {target?.title || "Color"}
        </h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        {/* Custom colour — native well, eyedropper, hex field */}
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-semibold text-gray-500">Custom color</p>
          <div className="flex items-center gap-2">
            <label
              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer overflow-hidden relative shrink-0"
              title="Pick a color"
              style={{ background: currentHex }}
            >
              <input
                type="color"
                value={currentHex}
                onChange={(e) => apply(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <button
              onClick={pickEyedropper}
              title="Eyedropper"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer transition shrink-0"
            >
              <Pipette className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center h-9 rounded-lg border border-gray-200 bg-gray-50 focus-within:border-blue-400 focus-within:bg-surface transition overflow-hidden">
              <span className="pl-2.5 pr-1 text-sm text-gray-400 select-none">
                #
              </span>
              <input
                value={hexInput}
                onChange={(e) => onHexChange(e.target.value)}
                placeholder="000000"
                spellCheck={false}
                className="flex-1 min-w-0 h-full bg-transparent text-sm text-gray-700 uppercase tracking-wide focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Colours already used in this design */}
        {designColors.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-gray-500">
              Colors in this design
            </p>
            <SwatchGrid
              colors={designColors}
              active={currentHex}
              onPick={apply}
            />
          </div>
        )}

        {/* Brand kit colours */}
        {brandColors.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-gray-500">Brand Kit</p>
            <SwatchGrid
              colors={brandColors}
              active={currentHex}
              onPick={apply}
            />
          </div>
        )}

        {/* Default palette */}
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-semibold text-gray-500">Default colors</p>
          <SwatchGrid
            colors={DEFAULT_SWATCHES}
            active={currentHex}
            onPick={apply}
          />
        </div>
      </div>
    </section>
  );
}

// A responsive 6-per-row grid of colour chips. White gets a visible border so
// it doesn't vanish against the panel; the active colour shows a check.
function SwatchGrid({ colors, active, onPick }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {colors.map((c, i) => {
        const isActive = toHex(c) === toHex(active);
        const isLight = isLightColor(c);
        return (
          <button
            key={`${c}-${i}`}
            onClick={() => onPick(c)}
            title={c}
            className={`aspect-square rounded-full border cursor-pointer transition hover:scale-110 ${
              isActive
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200"
            } flex items-center justify-center`}
            style={{ background: c }}
          >
            {isActive && (
              <Check
                className={`w-3.5 h-3.5 ${isLight ? "text-gray-700" : "text-white"}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Rough luminance test so the active-check icon stays legible on light chips.
function isLightColor(hex) {
  const h = toHex(hex);
  if (!h) return false;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
