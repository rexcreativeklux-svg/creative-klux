"use client";

import React from "react";
import { X } from "lucide-react";
import {
  SHAPE_EFFECTS,
  SHAPE_EFFECT_CONTROLS,
  SHAPE_EFFECT_COLOR,
  defaultShapeEffectParams,
  shapeEffectCss,
} from "@/(lib)/design/shapeEffects";

/**
 * ShapeEffectsPanel — shadow, echo and glow for the selected shape.
 *
 * The text equivalent lives next door and this deliberately looks the same:
 * tiles to pick a style, then the sliders that style exposes. Separate rather
 * than merged because the two vocabularies barely overlap — a shape has no
 * Hollow and text has no use for a silhouette glow — and a panel that swaps its
 * entire contents based on the selection is two panels wearing one name.
 *
 * Writes `el.shapeEffect = { type, ...params }`, which the on-canvas element and
 * the PNG export both read (see shapeEffects.js).
 *
 * Props: { editor, onClose }
 */
export default function ShapeEffectsPanel({ editor, onClose }) {
  const el = editor?.selectedElement;
  const isShape = el?.type === "shape";
  const effect = el?.shapeEffect || { type: "none" };
  const controls = SHAPE_EFFECT_CONTROLS[effect.type] || [];
  const hasColor = Boolean(SHAPE_EFFECT_COLOR[effect.type]);

  const pick = (type) => {
    if (!el) return;
    // Re-picking the same style keeps its settings; a new one starts from
    // defaults, so switching back and forth doesn't lose a tuned effect.
    const next =
      effect.type === type ? effect : defaultShapeEffectParams(type);
    editor.updateElement(el.id, { shapeEffect: next }, { record: true });
  };

  const setParam = (key, value) => {
    if (!el) return;
    editor.updateElement(
      el.id,
      { shapeEffect: { ...effect, [key]: value } },
      { record: true },
    );
  };

  const remove = () => {
    if (el) editor.updateElement(el.id, { shapeEffect: null }, { record: true });
  };

  return (
    <section className="w-full h-[55dvh] shrink-0 bg-surface border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col lg:w-75 lg:h-auto lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r">
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800">Effects</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {!isShape ? (
        <p className="px-4 py-6 text-xs text-gray-400">
          Select a shape to add an effect.
        </p>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
            <p className="text-xs font-semibold text-gray-500">Style</p>
            <div className="grid grid-cols-3 gap-x-2.5 gap-y-4">
              {SHAPE_EFFECTS.filter((fx) => fx.id !== "none").map((fx) => (
                <Swatch
                  key={fx.id}
                  fx={fx}
                  active={effect.type === fx.id}
                  onClick={() => pick(fx.id)}
                />
              ))}
            </div>

            {(hasColor || controls.length > 0) && (
              <div className="flex flex-col gap-4 pt-1 border-t border-gray-100">
                {hasColor && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm font-semibold text-gray-700">Color</p>
                    <label
                      className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer overflow-hidden relative"
                      style={{
                        background:
                          effect.color || SHAPE_EFFECT_COLOR[effect.type],
                      }}
                      title="Effect color"
                    >
                      <input
                        type="color"
                        value={effect.color || SHAPE_EFFECT_COLOR[effect.type]}
                        onChange={(e) => setParam("color", e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                  </div>
                )}

                {controls.map((c) => (
                  <Slider
                    key={c.key}
                    label={c.label}
                    min={c.min}
                    max={c.max}
                    value={effect[c.key] ?? c.def}
                    onChange={(v) => setParam(c.key, v)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pinned, so it stays reachable however long the body gets. */}
          <div className="shrink-0 border-t border-gray-100 px-4 py-3">
            <button
              onClick={remove}
              disabled={effect.type === "none"}
              className="w-full h-9 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              Remove effect
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * A tile previewing the effect on a plain square.
 *
 * Previewed with the real renderer rather than hand-written CSS per tile: the
 * swatch is a shape of a known size run through shapeEffectCss, so what the tile
 * shows is what the canvas will do, and a change to the maths cannot leave the
 * two disagreeing.
 */
function Swatch({ fx, active, onClick }) {
  const preview = shapeEffectCss({
    width: 44,
    height: 44,
    shapeEffect: defaultShapeEffectParams(fx.id),
  });

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 cursor-pointer">
      <span
        className={`flex h-14 w-full items-center justify-center rounded-lg border transition ${
          active
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span
          className="block h-6 w-6 rounded-[3px] bg-[#6366f1]"
          style={preview || undefined}
        />
      </span>
      <span className="text-[11px] font-medium text-gray-600">{fx.label}</span>
    </button>
  );
}

function Slider({ label, min, max, value, onChange }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs font-medium text-gray-600">
        {label}
        <span className="tabular-nums text-gray-400">{Math.round(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
    </label>
  );
}
