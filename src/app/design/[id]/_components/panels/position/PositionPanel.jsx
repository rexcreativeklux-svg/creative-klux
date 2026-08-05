"use client";

import React from "react";
import {
  X,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from "lucide-react";

/**
 * PositionPanel — Canva-style "Position" panel opened from the context toolbar.
 * Arranges layer order, aligns the element to the page, and exposes exact
 * X/Y/W/H/rotation. Applies to `editor.selectedElement`, so it never holds a
 * stale reference to a deselected element.
 *
 * Props: { editor, onClose }
 */
export default function PositionPanel({ editor, onClose }) {
  const el = editor?.selectedElement;

  const arrange = (dir) => el && editor.moveLayer(el.id, dir);

  // Snap the element to an edge/centre of the page.
  const align = (kind) => {
    if (!el) return;
    const { width: cw, height: ch } = editor.canvas;
    const p = {};
    if (kind === "left") p.x = 0;
    else if (kind === "center") p.x = Math.round((cw - el.width) / 2);
    else if (kind === "right") p.x = Math.round(cw - el.width);
    else if (kind === "top") p.y = 0;
    else if (kind === "middle") p.y = Math.round((ch - el.height) / 2);
    else if (kind === "bottom") p.y = Math.round(ch - el.height);
    editor.updateElement(el.id, p, { record: true });
  };

  const setNum = (key, value) => {
    const v = Number(value);
    if (Number.isNaN(v)) return;
    editor.updateElement(el.id, { [key]: Math.round(v) }, { record: true });
  };

  return (
    <section className="w-full h-[55dvh] shrink-0 bg-surface border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col lg:w-75 lg:h-auto lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r">
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800">Position</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {!el ? (
        <p className="px-4 py-6 text-xs text-gray-400">
          Select an element to position it.
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
          {/* Layer order */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-gray-500">Arrange</p>
            <div className="grid grid-cols-2 gap-2">
              <RowButton icon={ArrowUp} label="Forward" onClick={() => arrange("forward")} />
              <RowButton icon={ArrowDown} label="Backward" onClick={() => arrange("backward")} />
              <RowButton icon={BringToFront} label="To front" onClick={() => arrange("front")} />
              <RowButton icon={SendToBack} label="To back" onClick={() => arrange("back")} />
            </div>
          </div>

          {/* Align to page */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-gray-500">Align to page</p>
            <div className="grid grid-cols-3 gap-2">
              <IconTile icon={AlignHorizontalJustifyStart} title="Left" onClick={() => align("left")} />
              <IconTile icon={AlignHorizontalJustifyCenter} title="Center" onClick={() => align("center")} />
              <IconTile icon={AlignHorizontalJustifyEnd} title="Right" onClick={() => align("right")} />
              <IconTile icon={AlignVerticalJustifyStart} title="Top" onClick={() => align("top")} />
              <IconTile icon={AlignVerticalJustifyCenter} title="Middle" onClick={() => align("middle")} />
              <IconTile icon={AlignVerticalJustifyEnd} title="Bottom" onClick={() => align("bottom")} />
            </div>
          </div>

          {/* Exact geometry */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-gray-500">Advanced</p>
            <div className="grid grid-cols-2 gap-2.5">
              <NumField label="X" value={Math.round(el.x)} onChange={(v) => setNum("x", v)} />
              <NumField label="Y" value={Math.round(el.y)} onChange={(v) => setNum("y", v)} />
              <NumField label="W" value={Math.round(el.width)} onChange={(v) => setNum("width", v)} />
              <NumField label="H" value={Math.round(el.height)} onChange={(v) => setNum("height", v)} />
              <NumField
                label="Rotation"
                value={Math.round(el.rotation || 0)}
                onChange={(v) => setNum("rotation", v)}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function RowButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="h-9 flex items-center gap-2 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition"
    >
      <Icon className="w-4 h-4 text-gray-500" />
      {label}
    </button>
  );
}

function IconTile({ icon: Icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-11 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 cursor-pointer transition"
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 h-9 rounded-lg border border-gray-200 bg-gray-50 focus-within:border-blue-400 focus-within:bg-surface transition overflow-hidden px-2.5">
      <span className="text-[11px] font-semibold text-gray-400 select-none min-w-[54px]">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 h-full bg-transparent text-sm text-gray-700 tabular-nums focus:outline-none"
      />
    </label>
  );
}
