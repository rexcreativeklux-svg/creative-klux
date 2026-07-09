"use client";

import React from "react";
import {
  Trash2,
  Copy,
  BringToFront,
  SendToBack,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

const FONT_SIZES = [12, 14, 16, 18, 24, 32, 40, 48, 64, 80, 96, 120];

/**
 * Floating context bar for the selected element. Renders type-specific
 * controls (text vs shape vs image) plus shared actions.
 */
export default function EditorContextBar({ element, onChange, onDuplicate, onRemove, onMoveLayer }) {
  if (!element) return null;

  const patch = (p) => onChange(element.id, p, { record: true });

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-surface border border-gray-200 shadow-lg rounded-xl px-2 py-1.5 max-w-[calc(100%-24px)] overflow-x-auto">
      {element.type === "text" && (
        <>
          <ColorInput
            value={element.fill || element.color || "#111111"}
            onChange={(v) => patch({ fill: v, color: v })}
            title="Text color"
          />
          <select
            value={element.fontSize || 16}
            onChange={(e) => patch({ fontSize: Number(e.target.value) })}
            className="h-8 rounded-lg border border-gray-200 text-xs px-1.5 text-gray-700 cursor-pointer bg-surface"
            title="Font size"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Toggle
            active={element.fontWeight === "bold" || Number(element.fontWeight) >= 600}
            onClick={() =>
              patch({
                fontWeight:
                  element.fontWeight === "bold" || Number(element.fontWeight) >= 600
                    ? "normal"
                    : "bold",
              })
            }
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Toggle>
          <div className="flex items-center">
            {[
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
            ].map(([al, Icon]) => (
              <Toggle
                key={al}
                active={(element.textAlign || "left") === al}
                onClick={() => patch({ textAlign: al })}
                title={`Align ${al}`}
              >
                <Icon className="w-4 h-4" />
              </Toggle>
            ))}
          </div>
          <Divider />
        </>
      )}

      {element.type === "shape" && (
        <>
          <ColorInput
            value={element.fill || "#6366f1"}
            onChange={(v) => patch({ fill: v })}
            title="Fill"
          />
          {element.shape !== "circle" && element.shape !== "triangle" && (
            <label className="flex items-center gap-1 text-[11px] text-gray-500 px-1">
              Radius
              <input
                type="range"
                min={0}
                max={Math.round(Math.min(element.width, element.height) / 2)}
                value={element.borderRadius || 0}
                onChange={(e) => patch({ borderRadius: Number(e.target.value) })}
                className="w-16 cursor-pointer"
              />
            </label>
          )}
          <Divider />
        </>
      )}

      {/* Opacity — shared */}
      <label className="flex items-center gap-1 text-[11px] text-gray-500 px-1">
        Opacity
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((element.opacity ?? 1) * 100)}
          onChange={(e) => patch({ opacity: Number(e.target.value) / 100 })}
          className="w-16 cursor-pointer"
        />
      </label>

      <Divider />

      <IconBtn onClick={() => onMoveLayer(element.id, "front")} title="Bring to front">
        <BringToFront className="w-4 h-4" />
      </IconBtn>
      <IconBtn onClick={() => onMoveLayer(element.id, "back")} title="Send to back">
        <SendToBack className="w-4 h-4" />
      </IconBtn>
      <IconBtn onClick={() => onDuplicate(element.id)} title="Duplicate">
        <Copy className="w-4 h-4" />
      </IconBtn>
      <IconBtn onClick={() => onRemove(element.id)} title="Delete" danger>
        <Trash2 className="w-4 h-4" />
      </IconBtn>
    </div>
  );
}

function ColorInput({ value, onChange, title }) {
  return (
    <label
      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden relative shrink-0"
      title={title}
      style={{ background: value }}
    >
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  );
}

function Toggle({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer ${
        active ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer text-gray-500 ${
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-6 bg-gray-200 mx-0.5 shrink-0" />;
}
