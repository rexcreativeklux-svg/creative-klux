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
  Minus,
  CirclePlus,
} from "lucide-react";
import { isLineShape } from "@/(lib)/design/shapes";

const FONT_SIZES = [12, 14, 16, 18, 24, 32, 40, 48, 64, 80, 96, 120];

/**
 * Floating context bar for the selected element. Renders type-specific
 * controls (text vs shape vs image) plus shared actions.
 */
export default function EditorContextBar({
  element,
  onChange,
  onDuplicate,
  onRemove,
  onMoveLayer,
  addNodeMode,
  onToggleAddNode,
}) {
  if (!element) return null;

  const patch = (p) => onChange(element.id, p, { record: true });

  const isLine = element.type === "shape" && isLineShape(element.shape);
  const isCurve = element.type === "curve";

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 bg-surface border border-gray-200 shadow-lg rounded-xl px-2 py-1.5 max-w-[calc(100%-24px)] overflow-x-auto">
      {element.type === "text" && (
        <>
          <ColorInput
            value={element.fill || element.color || "#111111"}
            onChange={(v) => patch({ fill: v, color: v })}
            title="Text color"
          />
          {element.sticky && (
            <ColorInput
              value={element.background || "#FEF08A"}
              onChange={(v) => patch({ background: v })}
              title="Note color"
            />
          )}
          {/* Sticky notes auto-fit their font, so no manual size control. */}
          {!element.sticky && (
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
          )}
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

      {isLine && (
        <>
          <ColorInput
            value={element.fill || "#111111"}
            onChange={(v) => patch({ fill: v })}
            title="Line color"
          />
          <DirectionControl
            rotation={element.rotation || 0}
            onSet={(deg) => patch({ rotation: deg })}
          />
          <AddNodeToggle active={addNodeMode} onClick={onToggleAddNode} />
          <Divider />
        </>
      )}

      {isCurve && (
        <>
          <ColorInput
            value={element.stroke || "#111111"}
            onChange={(v) => patch({ stroke: v })}
            title="Line color"
          />
          <label className="flex items-center gap-1 text-[11px] text-gray-500 px-1">
            Weight
            <input
              type="range"
              min={1}
              max={40}
              value={element.strokeWidth || 4}
              onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
              className="w-16 cursor-pointer"
            />
          </label>
          <AddNodeToggle active={addNodeMode} onClick={onToggleAddNode} />
          <Divider />
        </>
      )}

      {element.type === "shape" && !isLine && (
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

function AddNodeToggle({ active, onClick }) {
  return (
    <Toggle
      active={active}
      onClick={onClick}
      title={active ? "Click the line to add a node (Esc to stop)" : "Add node"}
    >
      <CirclePlus className="w-4 h-4" />
    </Toggle>
  );
}

function DirectionControl({ rotation, onSet }) {
  // Lines look identical at r and r+180, so normalize into [0,180) for matching.
  const norm = Math.round((((rotation % 180) + 180) % 180));
  const dirs = [
    { deg: 0, label: "Horizontal" },
    { deg: 45, label: "Diagonal down" },
    { deg: 90, label: "Vertical" },
    { deg: 135, label: "Diagonal up" },
  ];
  return (
    <div className="flex items-center">
      {dirs.map((d) => (
        <Toggle
          key={d.deg}
          active={norm === d.deg}
          onClick={() => onSet(d.deg)}
          title={d.label}
        >
          <Minus className="w-4 h-4" style={{ transform: `rotate(${d.deg}deg)` }} />
        </Toggle>
      ))}
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
