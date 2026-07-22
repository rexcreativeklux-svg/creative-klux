"use client";

import React, { useState } from "react";
import { IMAGE_ADJUSTMENTS } from "@/(lib)/design/imageAdjust";
import { proxiedSrc } from "@/(lib)/design/renderDesign";
import { Slider, SectionHeader, PresetStrip } from "./imageEditControls";

/**
 * AdjustSection — design-editor-style Adjust: a header with Reset + "See more",
 * a horizontal strip of preset "looks" previewed on the real image, and (when
 * expanded) the full preset grid plus the fine adjustment sliders.
 *
 * Presets set the CSS-expressible colour keys the design editor supports
 * (brightness / contrast / saturation / warmth / hue); Blur is left to the fine
 * sliders. Everything writes to el.adjust and renders via buildImageFilter.
 */

// Colour keys a preset controls (blur is intentionally left alone).
const PRESET_KEYS = ["brightness", "contrast", "saturation", "warmth", "hue"];

const ADJUST_PRESETS = [
  { id: "original", label: "Original", values: {} },
  { id: "auto", label: "Auto", values: { brightness: 8, contrast: 12, saturation: 8 } },
  { id: "vivid", label: "Vivid", values: { saturation: 40, contrast: 20 } },
  { id: "warm", label: "Warm", values: { warmth: 35, brightness: 5 } },
  { id: "cool", label: "Cool", values: { warmth: -35 } },
  { id: "bw", label: "B&W", values: { saturation: -100, contrast: 10 } },
  { id: "bright", label: "Bright", values: { brightness: 25 } },
  { id: "fade", label: "Fade", values: { contrast: -20, brightness: 8, saturation: -15 } },
];

// Fill unset preset keys with 0 so a look is deterministic.
const normalize = (v) =>
  PRESET_KEYS.reduce((o, k) => ({ ...o, [k]: v[k] ?? 0 }), {});

// Approximate a preset as a CSS filter for the preview tile (mirrors
// buildImageFilter's colour math).
function previewCss(v) {
  const n = normalize(v);
  const p = [];
  if (n.brightness) p.push(`brightness(${1 + n.brightness / 100})`);
  if (n.contrast) p.push(`contrast(${1 + n.contrast / 100})`);
  if (n.saturation) p.push(`saturate(${Math.max(0, 1 + n.saturation / 100)})`);
  if (n.warmth > 0) p.push(`sepia(${(n.warmth / 100) * 0.5})`);
  else if (n.warmth < 0) p.push(`hue-rotate(${Math.round(n.warmth * 0.35)}deg)`);
  if (n.hue) p.push(`hue-rotate(${n.hue}deg)`);
  return p.join(" ");
}

export default function AdjustSection({ editor }) {
  const [expanded, setExpanded] = useState(false);
  const el = editor?.selectedElement;
  const adjust = el?.adjust || {};
  const thumb = el?.src ? proxiedSrc(el.src) : null;

  const setAdjust = (key, value) =>
    editor.updateElement(el.id, { adjust: { ...adjust, [key]: value } }, { record: true });

  const applyPreset = (p) => {
    const n = normalize(p.values);
    // Keep blur; replace the colour keys with the preset's values.
    editor.updateElement(el.id, { adjust: { ...adjust, ...n } }, { record: true });
  };

  const resetAdjust = () =>
    editor.updateElement(el.id, { adjust: {} }, { record: true });

  const hasAdjust = IMAGE_ADJUSTMENTS.some((a) => (adjust[a.key] ?? a.def) !== a.def);

  // Which preset (if any) matches the live colour adjustments.
  const activeId =
    ADJUST_PRESETS.find((p) => {
      const n = normalize(p.values);
      return PRESET_KEYS.every((k) => n[k] === (adjust[k] ?? 0));
    })?.id ?? null;

  const Tile = ({ p, strip = false }) => {
    const active = activeId === p.id;
    const filter = previewCss(p.values);
    return (
      <button
        onClick={() => applyPreset(p)}
        title={p.label}
        className={`flex flex-col items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer transition-colors ${
          strip ? "shrink-0 w-[68px]" : "w-full"
        } ${active ? "border-blue-500 ring-1 ring-blue-400" : "border-gray-200 hover:border-blue-400"}`}
      >
        <span
          className="relative flex items-center justify-center rounded-md w-full overflow-hidden bg-gray-100"
          style={{ height: strip ? 44 : 56 }}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              crossOrigin="anonymous"
              draggable={false}
              className="w-full h-full object-cover"
              style={{ filter }}
            />
          ) : (
            <span
              className="w-6 h-8 rounded"
              style={{ background: "linear-gradient(135deg,#60a5fa,#a78bfa,#f472b6)", filter }}
            />
          )}
        </span>
        <span className={`text-[10px] ${active ? "text-blue-600 font-medium" : "text-gray-600"}`}>
          {p.label}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      <SectionHeader
        title="Adjust"
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        action={
          <button
            onClick={resetAdjust}
            disabled={!hasAdjust}
            className={`text-[11px] font-semibold transition ${
              hasAdjust ? "text-blue-600 hover:text-blue-700 cursor-pointer" : "text-gray-300 cursor-not-allowed"
            }`}
          >
            Reset
          </button>
        }
      />

      {!expanded ? (
        <PresetStrip>
          {ADJUST_PRESETS.map((p) => (
            <Tile key={p.id} p={p} strip />
          ))}
        </PresetStrip>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {ADJUST_PRESETS.map((p) => (
              <Tile key={p.id} p={p} />
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-1">
            {IMAGE_ADJUSTMENTS.map((a) => (
              <Slider
                key={a.key}
                label={a.label}
                min={a.min}
                max={a.max}
                unit={a.key === "hue" ? "°" : ""}
                value={adjust[a.key] ?? a.def}
                onChange={(v) => setAdjust(a.key, v)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
