"use client";

import React from "react";
import { X } from "lucide-react";
import {
  TEXT_EFFECTS,
  EFFECT_CONTROLS,
  EFFECT_COLOR,
  EFFECT_PRESETS,
  defaultEffectParams,
  textEffectCss,
} from "@/(lib)/design/textEffects";
import { readTextStyle, takesTextStyle } from "@/(lib)/design/groupStyling";

/**
 * EffectsPanel — Canva-style text effects (Shadow, Lift, Hollow, Outline, Echo,
 * Glow, Neon, Background) opened from the context toolbar's "Effects" button.
 * Writes `el.textEffect = { type, ...params }`, which both the on-canvas editor
 * and the PNG export read (see textEffects.js / renderDesign.js).
 *
 * Layout mirrors Canva: a scrollable body of labelled effect tiles + the active
 * effect's controls, and a pinned "Remove effect" footer that never scrolls.
 * Applies to `editor.selectedElement` — always the live selection.
 *
 * Props: { editor, onClose }
 */
export default function EffectsPanel({ editor, onClose }) {
  const el = editor?.selectedElement;
  // Read through a group to the words inside it, so opening this on a group
  // shows the effect its text is actually wearing.
  const current = readTextStyle(el, "textEffect");
  const effect = current || { type: "none" };
  const controls = EFFECT_CONTROLS[effect.type] || [];
  const hasColor = !!EFFECT_COLOR[effect.type];
  const hasEffect = !!current && effect.type !== "none";

  const pickEffect = (type) => {
    if (!el) return;
    // Re-picking the same base effect keeps its params; a new one seeds
    // defaults. Either way this drops any preset badge.
    const next =
      effect.type === type && !effect.preset ? effect : defaultEffectParams(type);
    editor.updateElement(el.id, { textEffect: next }, { record: true });
  };

  const pickPreset = (preset) => {
    if (!el) return;
    editor.updateElement(
      el.id,
      { textEffect: { ...preset.config, preset: preset.id } },
      { record: true },
    );
  };

  const setParam = (key, value) => {
    if (!el) return;
    // Tweaking a value detaches it from the preset (it's now custom).
    const { preset, ...rest } = effect;
    editor.updateElement(
      el.id,
      { textEffect: { ...rest, [key]: value } },
      { record: true },
    );
  };

  const removeEffect = () => {
    if (el) editor.updateElement(el.id, { textEffect: null }, { record: true });
  };

  // A group with text in it counts: the patches above go to the group and are
  // dealt out to every text member (see groupStyling).
  const isTextSelected = takesTextStyle(el);

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

      {!isTextSelected ? (
        <p className="px-4 py-6 text-xs text-gray-400">
          Select a text element to add an effect.
        </p>
      ) : (
        <>
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
            <p className="text-xs font-semibold text-gray-500">Style</p>
            <div className="grid grid-cols-3 gap-x-2.5 gap-y-4">
              {TEXT_EFFECTS.filter((fx) => fx.id !== "none").map((fx) => (
                <EffectSwatch
                  key={fx.id}
                  fx={fx}
                  active={effect.type === fx.id && !effect.preset}
                  onClick={() => pickEffect(fx.id)}
                />
              ))}
            </div>

            {/* One-click curated looks */}
            <p className="text-xs font-semibold text-gray-500 pt-1">Templates</p>
            <div className="grid grid-cols-3 gap-x-2.5 gap-y-4">
              {EFFECT_PRESETS.map((p) => (
                <PresetSwatch
                  key={p.id}
                  preset={p}
                  active={effect.preset === p.id}
                  onClick={() => pickPreset(p)}
                />
              ))}
            </div>

            {/* Colour + sliders for the active effect */}
            {(hasColor || controls.length > 0) && (
              <div className="flex flex-col gap-4 pt-1 border-t border-gray-100">
                {hasColor && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm font-semibold text-gray-700">Color</p>
                    <label
                      className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer overflow-hidden relative"
                      style={{
                        background: effect.color || EFFECT_COLOR[effect.type],
                      }}
                      title="Effect color"
                    >
                      <input
                        type="color"
                        value={effect.color || EFFECT_COLOR[effect.type]}
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

          {/* Pinned footer — never scrolls (Canva-style) */}
          <footer className="shrink-0 border-t border-gray-100 p-3">
            <button
              onClick={removeEffect}
              disabled={!hasEffect}
              className={`w-full h-10 rounded-lg text-sm font-semibold transition ${
                hasEffect
                  ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Remove effect
            </button>
          </footer>
        </>
      )}
    </section>
  );
}

// A tile rendering the word "Ag" with the effect applied + its label below, so
// the user previews it before committing. Built on the same textEffectCss the
// canvas uses. Glow/Neon get a dark backing so the light glow reads.
function EffectSwatch({ fx, active, onClick }) {
  const dark = fx.id === "glow" || fx.id === "neon";
  const fxCss = textEffectCss({
    fontSize: 26,
    fill: dark ? "#ffffff" : "#111111",
    textEffect: defaultEffectParams(fx.id),
  });
  const bg = fxCss?.background;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`w-full h-16 rounded-xl border flex items-center justify-center overflow-hidden cursor-pointer transition ${
          active
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-gray-200 hover:border-gray-300"
        }`}
        style={{ background: dark ? "#1f2430" : "#ffffff" }}
        title={fx.label}
      >
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: dark ? "#ffffff" : "#111111",
            lineHeight: 1,
            ...(fxCss?.css || {}),
            ...(bg
              ? {
                  background: bg.color,
                  borderRadius: bg.radius,
                  padding: `${bg.padY}px ${bg.padX}px`,
                }
              : {}),
          }}
        >
          Ag
        </span>
      </button>
      <span
        className={`text-[11px] font-medium ${active ? "text-blue-600" : "text-gray-600"}`}
      >
        {fx.label}
      </span>
    </div>
  );
}

// A curated-look tile: renders "Ag" with the preset's bundled config applied.
function PresetSwatch({ preset, active, onClick }) {
  const cfg = preset.config;
  const dark = cfg.type === "glow" || cfg.type === "neon";
  const fxCss = textEffectCss({
    fontSize: 26,
    fill: dark ? "#ffffff" : "#111111",
    textEffect: cfg,
  });
  const bg = fxCss?.background;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`w-full h-16 rounded-xl border flex items-center justify-center overflow-hidden cursor-pointer transition ${
          active
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-gray-200 hover:border-gray-300"
        }`}
        style={{ background: dark ? "#1f2430" : "#ffffff" }}
        title={preset.label}
      >
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: dark ? "#ffffff" : "#111111",
            lineHeight: 1,
            ...(fxCss?.css || {}),
            ...(bg
              ? {
                  background: bg.color,
                  borderRadius: bg.radius,
                  padding: `${bg.padY}px ${bg.padX}px`,
                }
              : {}),
          }}
        >
          Ag
        </span>
      </button>
      <span
        className={`text-[11px] font-medium ${active ? "text-blue-600" : "text-gray-600"}`}
      >
        {preset.label}
      </span>
    </div>
  );
}

function Slider({ label, min, max, value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <span className="w-12 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-600 tabular-nums">
          {Math.round(value)}
        </span>
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
