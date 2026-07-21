"use client";

import React from "react";
import { X } from "lucide-react";
import {
  IMAGE_FILTERS,
  IMAGE_ADJUSTMENTS,
  IMAGE_SHADOWS,
} from "@/(lib)/design/imageAdjust";
import { proxiedSrc } from "@/(lib)/design/renderDesign";

/**
 * EditImagePanel — the "Edit image" side panel opened from the image toolbar.
 * Canva-style Adjust (sliders) + Filters (presets) + Shadows, ported from the
 * standalone photo editor's model. Everything writes to the selected image
 * element and resolves to a CSS filter string (see imageAdjust.js) that renders
 * live and bakes into the PNG export. Colocated with the image-toolbar UI.
 *
 * Props: { editor, onClose }
 */
export default function EditImagePanel({ editor, onClose }) {
  const el = editor?.selectedElement;
  const isImage = el && el.type === "image";
  const adjust = el?.adjust || {};
  const thumb = isImage && el.src ? proxiedSrc(el.src) : null;

  const setAdjust = (key, value) =>
    editor.updateElement(
      el.id,
      { adjust: { ...adjust, [key]: value } },
      { record: true },
    );

  const resetAdjust = () =>
    editor.updateElement(el.id, { adjust: {} }, { record: true });

  const pickFilter = (id) =>
    editor.updateElement(el.id, { filter: id }, { record: true });

  const pickShadow = (id) =>
    editor.updateElement(
      el.id,
      { imgShadow: id === "none" ? null : id },
      { record: true },
    );

  const hasAdjust = IMAGE_ADJUSTMENTS.some((a) => (adjust[a.key] ?? a.def) !== a.def);

  return (
    <section className="w-[300px] shrink-0 bg-surface border-r border-gray-200 flex flex-col">
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800">Edit image</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {!isImage ? (
        <p className="px-4 py-6 text-xs text-gray-400">
          Select an image to edit it.
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
          {/* Adjust */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500">Adjust</p>
              <button
                onClick={resetAdjust}
                disabled={!hasAdjust}
                className={`text-[11px] font-semibold transition ${
                  hasAdjust
                    ? "text-blue-600 hover:text-blue-700 cursor-pointer"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                Reset
              </button>
            </div>
            {IMAGE_ADJUSTMENTS.map((a) => (
              <Slider
                key={a.key}
                label={a.label}
                min={a.min}
                max={a.max}
                value={adjust[a.key] ?? a.def}
                onChange={(v) => setAdjust(a.key, v)}
              />
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-gray-500">Filters</p>
            <div className="grid grid-cols-3 gap-x-2.5 gap-y-3">
              {IMAGE_FILTERS.map((f) => (
                <ThumbTile
                  key={f.id}
                  label={f.label}
                  thumb={thumb}
                  filter={f.css}
                  active={(el.filter || "none") === f.id}
                  onClick={() => pickFilter(f.id)}
                />
              ))}
            </div>
          </div>

          {/* Shadows */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-gray-500">Shadows</p>
            <div className="grid grid-cols-3 gap-x-2.5 gap-y-3">
              {IMAGE_SHADOWS.map((s) => (
                <ShadowTile
                  key={s.id}
                  label={s.label}
                  kind={s.id}
                  active={(el.imgShadow || "none") === s.id}
                  onClick={() => pickShadow(s.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Slider({ label, min, max, value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-600">{label}</p>
        <span className="text-[11px] text-gray-400 tabular-nums">{Math.round(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-blue-600"
      />
    </div>
  );
}

// A filter preview: the element's own image with the filter applied + a label.
function ThumbTile({ label, thumb, filter, active, onClick }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`w-full aspect-square rounded-lg border overflow-hidden cursor-pointer transition ${
          active ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
        }`}
        title={label}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={label}
            crossOrigin="anonymous"
            draggable={false}
            className="w-full h-full object-cover"
            style={{ filter: filter || "none" }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100" style={{ filter: filter || "none" }} />
        )}
      </button>
      <span className={`text-[11px] font-medium ${active ? "text-blue-600" : "text-gray-600"}`}>
        {label}
      </span>
    </div>
  );
}

// A small preview swatch for the shadow presets.
function ShadowTile({ label, kind, active, onClick }) {
  const shadow =
    kind === "drop"
      ? "0 6px 8px rgba(0,0,0,0.4)"
      : kind === "glow"
        ? "0 0 9px rgba(0,0,0,0.5)"
        : "none";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`w-full h-14 rounded-lg border flex items-center justify-center bg-gray-50 cursor-pointer transition ${
          active ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
        }`}
        title={label}
      >
        <span
          className="w-8 h-8 rounded-md bg-violet-300"
          style={{ boxShadow: shadow }}
        />
      </button>
      <span className={`text-[11px] font-medium ${active ? "text-blue-600" : "text-gray-600"}`}>
        {label}
      </span>
    </div>
  );
}
