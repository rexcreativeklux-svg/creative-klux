"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import {
  ANIMATIONS,
  PAGE_PRESETS,
  ANIM_SPEEDS,
} from "@/(lib)/design/animations";

/**
 * AnimatePanel — Canva-style animation picker opened from the context toolbar's
 * "Animate" button. Two tabs:
 *
 *   Page  — applies one animation to EVERY element on the page (Featured page
 *           styles + the General grid).
 *   Text  — animates just the selected element (writes `el.animation`).
 *
 * Animations are stored as `el.animation = { type, speed }` and play as an
 * in-editor preview via `onPlay` (see EditorElement / animations.js). PNG export
 * is a single static frame, so they aren't baked into downloads.
 *
 * Props: { editor, onPlay, onClose }
 */
export default function AnimatePanel({ editor, onPlay, onClose }) {
  const el = editor?.selectedElement;
  const elements = editor?.elements || [];
  const [tab, setTab] = useState("text");

  const speed = el?.animation?.speed || "medium";

  // Page-level animation: the shared type when all elements match, else null.
  const pageType =
    elements.length > 0 &&
    elements.every(
      (e) => (e.animation?.type || null) === (elements[0].animation?.type || null),
    )
      ? elements[0].animation?.type || null
      : null;
  const pageSpeed = elements[0]?.animation?.speed || "medium";

  const activeType = tab === "page" ? pageType : el?.animation?.type || null;
  const activeSpeed = tab === "page" ? pageSpeed : speed;
  const hasAnim = tab === "page" ? !!pageType : !!el?.animation?.type;

  // Apply one animation to every element on the page as a single undo step.
  const setPageAnimation = (type, spd = pageSpeed) => {
    editor.commit();
    for (const e of elements) {
      editor.updateElement(
        e.id,
        { animation: type ? { type, speed: spd } : null },
        { record: false },
      );
    }
    if (type) onPlay?.();
  };

  const setElementAnimation = (type, spd = speed) => {
    if (!el) return;
    editor.updateElement(
      el.id,
      { animation: type ? { type, speed: spd } : null },
      { record: true },
    );
    if (type) onPlay?.();
  };

  const pick = (type) =>
    tab === "page" ? setPageAnimation(type) : setElementAnimation(type);
  const pickPreset = (preset) => setPageAnimation(preset.anim);
  const setSpeed = (spd) =>
    tab === "page"
      ? setPageAnimation(activeType, spd)
      : setElementAnimation(activeType, spd);
  const removeAnimation = () =>
    tab === "page" ? setPageAnimation(null) : setElementAnimation(null);

  const presetActive = (preset) => tab === "page" && pageType === preset.anim;

  const canEdit = tab === "page" ? elements.length > 0 : !!el;

  return (
    <section className="w-[300px] shrink-0 bg-surface border-r border-gray-200 flex flex-col">
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800">Animate</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Page / Text tabs */}
      <div className="shrink-0 flex items-center gap-6 px-4 border-b border-gray-100">
        {[
          ["page", "Page"],
          ["text", "Text"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative py-3 text-sm font-semibold cursor-pointer transition ${
              tab === key ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
            {tab === key && (
              <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {!canEdit ? (
        <p className="px-4 py-6 text-xs text-gray-400">
          {tab === "text"
            ? "Select a text element to animate it."
            : "Add elements to the page to animate them."}
        </p>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
            {/* Featured page styles (Page tab only) */}
            {tab === "page" && (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold text-gray-500">Featured</p>
                <div className="grid grid-cols-3 gap-x-2.5 gap-y-4">
                  {PAGE_PRESETS.map((p) => (
                    <Tile
                      key={p.id}
                      label={p.label}
                      active={presetActive(p)}
                      onClick={() => pickPreset(p)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* General animations (both tabs) */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-semibold text-gray-500">General</p>
              <div className="grid grid-cols-3 gap-x-2.5 gap-y-4">
                {ANIMATIONS.map((a) => (
                  <Tile
                    key={a.id}
                    label={a.label}
                    active={activeType === a.id}
                    onClick={() => pick(a.id)}
                  />
                ))}
              </div>
            </div>

            {/* Speed */}
            {hasAnim && (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold text-gray-500">Speed</p>
                <div className="grid grid-cols-3 gap-2">
                  {ANIM_SPEEDS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSpeed(s.id)}
                      className={`h-9 rounded-lg border text-xs font-medium cursor-pointer transition ${
                        activeSpeed === s.id
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] leading-relaxed text-gray-400">
              Animations play in the editor and preview. PNG downloads are a
              single static frame, so they aren&apos;t included in exports.
            </p>
          </div>

          {/* Pinned footer */}
          <footer className="shrink-0 border-t border-gray-100 p-3">
            <button
              onClick={removeAnimation}
              disabled={!hasAnim}
              className={`w-full h-10 rounded-lg text-sm font-semibold transition ${
                hasAnim
                  ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Remove animation
            </button>
          </footer>
        </>
      )}
    </section>
  );
}

// A named animation tile: an "ABC" chip + label, matching the effects tiles.
function Tile({ label, active, onClick }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`w-full h-16 rounded-xl border flex items-center justify-center cursor-pointer transition ${
          active
            ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50"
            : "border-gray-200 hover:border-gray-300 bg-gray-50"
        }`}
        title={label}
      >
        <span
          className={`text-lg font-bold tracking-wide ${active ? "text-blue-600" : "text-gray-600"}`}
        >
          ABC
        </span>
      </button>
      <span
        className={`text-[11px] font-medium ${active ? "text-blue-600" : "text-gray-600"}`}
      >
        {label}
      </span>
    </div>
  );
}
