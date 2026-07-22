"use client";

import React, { useState } from "react";
import { Sun, Palette, Droplet, Move } from "lucide-react";
import {
  IMAGE_SHADOWS,
  shadowDropCss,
  shadowById,
  DEFAULT_SHADOW,
} from "@/(lib)/design/imageAdjust";
import { proxiedSrc } from "@/(lib)/design/renderDesign";
import { Slider, SectionHeader, PresetStrip } from "./imageEditControls";

/**
 * ShadowsSection — design-editor-style Shadows: a header + "See more", a
 * horizontal strip of shadow presets previewed on the real image, and (when
 * expanded) the full grid plus tabbed fine controls (Intensity / Color / Blur /
 * Move). Presets seed `el.imgShadowParams`; editing a control switches the id to
 * "custom" and writes the live params, which buildImageFilter renders as a CSS
 * drop-shadow. Floor-mode shadows (baked sprite) are intentionally omitted.
 */
const SHADOW_SWATCHES = [
  "#000000", "#334155", "#1e293b", "#7c3aed",
  "#2563eb", "#dc2626", "#f59e0b", "#ffffff",
];

const TABS = [
  { id: "intensity", label: "Intensity", Icon: Sun },
  { id: "color", label: "Color", Icon: Palette },
  { id: "blur", label: "Blur", Icon: Droplet },
  { id: "move", label: "Move", Icon: Move },
];

export default function ShadowsSection({ editor }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState("intensity");
  const el = editor?.selectedElement;
  const thumb = el?.src ? proxiedSrc(el.src) : null;
  const activeId = el?.imgShadow || "none";

  // Effective params for the fine controls: custom params, else the active
  // preset's, else a sensible default (so dragging a slider creates a shadow).
  const params = {
    ...DEFAULT_SHADOW,
    ...(el?.imgShadowParams || (activeId !== "none" ? shadowById(activeId) : null) || {}),
  };

  const pickShadow = (s) => {
    if (s.id === "none") {
      editor.updateElement(el.id, { imgShadow: null, imgShadowParams: null }, { record: true });
      return;
    }
    editor.updateElement(
      el.id,
      {
        imgShadow: s.id,
        imgShadowParams: { x: s.x, y: s.y, blur: s.blur, opacity: s.opacity, color: params.color },
      },
      { record: true },
    );
  };

  // Editing a fine control switches to a "custom" shadow with the live params.
  const setParam = (key, value) =>
    editor.updateElement(
      el.id,
      { imgShadow: "custom", imgShadowParams: { ...params, [key]: value } },
      { record: true },
    );

  const Tile = ({ s, strip = false }) => {
    const active = activeId === s.id;
    const filter = s.id === "none" ? "none" : shadowDropCss(s, 0.3);
    return (
      <button
        onClick={() => pickShadow(s)}
        title={s.label}
        className={`flex flex-col items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer transition-colors ${
          strip ? "shrink-0 w-[68px]" : "w-full"
        } ${active ? "border-blue-500 ring-1 ring-blue-400" : "border-gray-200 hover:border-blue-400"}`}
      >
        <span
          className="relative flex items-center justify-center rounded-md w-full overflow-hidden bg-gray-50"
          style={{ height: strip ? 44 : 56 }}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              crossOrigin="anonymous"
              draggable={false}
              style={{ maxHeight: strip ? 30 : 40, maxWidth: "70%", objectFit: "contain", filter }}
            />
          ) : (
            <span
              className="rounded"
              style={{ width: 22, height: 28, background: "linear-gradient(135deg,#e5e7eb,#cbd5e1)", filter }}
            />
          )}
        </span>
        <span className={`text-[10px] ${active ? "text-blue-600 font-medium" : "text-gray-600"}`}>
          {s.label}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      <SectionHeader title="Shadows" expanded={expanded} onToggle={() => setExpanded((v) => !v)} />

      {!expanded ? (
        <PresetStrip>
          {IMAGE_SHADOWS.map((s) => (
            <Tile key={s.id} s={s} strip />
          ))}
        </PresetStrip>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {IMAGE_SHADOWS.map((s) => (
              <Tile key={s.id} s={s} />
            ))}
          </div>

          {/* Fine controls — a tab toggle over each control (design-editor style). */}
          <div className="border-t border-gray-100 pt-3 flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-1.5">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-[10px] cursor-pointer transition-colors ${
                    tab === id
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 text-gray-500 hover:border-blue-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {tab === "intensity" && (
              <Slider label="Intensity" min={0} max={100} unit="%" value={params.opacity} onChange={(v) => setParam("opacity", v)} />
            )}

            {tab === "blur" && (
              <Slider label="Blur" min={0} max={50} value={params.blur} onChange={(v) => setParam("blur", v)} />
            )}

            {tab === "move" && (
              <div className="flex flex-col gap-3">
                <Slider label="Offset X" min={-50} max={50} value={params.x} onChange={(v) => setParam("x", v)} />
                <Slider label="Offset Y" min={-50} max={50} value={params.y} onChange={(v) => setParam("y", v)} />
              </div>
            )}

            {tab === "color" && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {SHADOW_SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setParam("color", c)}
                    title={c}
                    className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer"
                    style={{
                      background: c,
                      outline: params.color?.toLowerCase() === c ? "2px solid #3b82f6" : "none",
                      outlineOffset: 1,
                    }}
                  />
                ))}
                <label
                  className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer relative overflow-hidden"
                  title="Custom color"
                  style={{ background: "conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)" }}
                >
                  <input
                    type="color"
                    value={params.color || "#000000"}
                    onChange={(e) => setParam("color", e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
