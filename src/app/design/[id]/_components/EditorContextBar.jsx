"use client";

import React, { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  CirclePlus,
  MoveVertical,
  ChevronDown,
} from "lucide-react";
import { isLineShape } from "@/(lib)/design/shapes";
import { addRow, addCol, removeRow, removeCol } from "@/(lib)/design/tableUtils";
import { EDITOR_FONTS } from "@/(lib)/design/fonts";

/**
 * Floating formatting toolbar for the selected element (top of the stage).
 * Renders type-specific formatting — rich text controls, shape fill, etc. The
 * per-element *actions* (lock / duplicate / delete / layer order) live in the
 * floating EditorElementMenu pinned to the element itself.
 */
export default function EditorContextBar({
  element,
  onChange,
  addNodeMode,
  onToggleAddNode,
  activeCell,
  onClearActiveCell,
  onOpenFontPanel,
}) {
  const [menu, setMenu] = useState(null); // 'spacing' | null

  if (!element) return null;

  const patch = (p) => onChange(element.id, p, { record: true });
  // Table row/col helpers return {} when they'd drop below 1×1 — skip those so
  // hitting the limit doesn't push an empty (no-op) undo entry.
  const tableEdit = (p) => {
    if (p && Object.keys(p).length) patch(p);
  };
  // Delete the row/column of the clicked cell (falls back to the last track when
  // nothing is selected), then drop the now-stale active cell.
  const deleteTrack = (fn, index) => {
    const p = fn(element, index);
    if (p && Object.keys(p).length) {
      patch(p);
      onClearActiveCell?.();
    }
  };

  const isLine = element.type === "shape" && isLineShape(element.shape);
  const isCurve = element.type === "curve";

  const isBold =
    element.fontWeight === "bold" || Number(element.fontWeight) >= 600;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-1.5 bg-surface border border-gray-200 shadow-lg rounded-xl px-2 py-1.5 max-w-[calc(100vw-340px)] overflow-x-auto">
        {element.type === "text" && (
        <>
          <FontButton value={element.fontFamily} onClick={onOpenFontPanel} />
          {/* Sticky notes auto-fit their font, so no manual size control. */}
          {!element.sticky && (
            <SizeStepper
              value={element.fontSize || 40}
              onChange={(v) => patch({ fontSize: v })}
            />
          )}
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
          <Toggle
            active={isBold}
            onClick={() => patch({ fontWeight: isBold ? "normal" : "bold" })}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Toggle>
          <Toggle
            active={element.fontStyle === "italic"}
            onClick={() =>
              patch({
                fontStyle: element.fontStyle === "italic" ? "normal" : "italic",
              })
            }
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Toggle>
          <Toggle
            active={!!element.underline}
            onClick={() => patch({ underline: !element.underline })}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
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
          <Toggle
            active={menu === "spacing"}
            onClick={() => setMenu((m) => (m === "spacing" ? null : "spacing"))}
            title="Spacing"
          >
            <MoveVertical className="w-4 h-4" />
          </Toggle>
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

      {element.type === "table" && (
        <>
          <ColorInput
            value={element.headerFill || "#f3f4f6"}
            onChange={(v) => patch({ headerFill: v })}
            title="Header color"
          />
          <ColorInput
            value={element.cellFill || "#ffffff"}
            onChange={(v) => patch({ cellFill: v })}
            title="Cell color"
          />
          <ColorInput
            value={element.textColor || "#111827"}
            onChange={(v) => patch({ textColor: v })}
            title="Text color"
          />
          <ColorInput
            value={element.borderColor || "#d1d5db"}
            onChange={(v) => patch({ borderColor: v })}
            title="Border color"
          />
          <Toggle
            active={element.headerRow !== false}
            onClick={() => patch({ headerRow: element.headerRow === false })}
            title="Header row"
          >
            <span className="text-[11px] font-semibold">H</span>
          </Toggle>
          <div className="flex items-center">
            {[
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
            ].map(([al, Icon]) => (
              <Toggle
                key={al}
                active={(element.align || "left") === al}
                onClick={() => patch({ align: al })}
                title={`Align ${al}`}
              >
                <Icon className="w-4 h-4" />
              </Toggle>
            ))}
          </div>
          <Divider />
          <IconBtn onClick={() => tableEdit(addRow(element))} title="Add row">
            <span className="flex items-center text-[11px] font-medium gap-0.5">
              <Plus className="w-3.5 h-3.5" />R
            </span>
          </IconBtn>
          <IconBtn onClick={() => tableEdit(addCol(element))} title="Add column">
            <span className="flex items-center text-[11px] font-medium gap-0.5">
              <Plus className="w-3.5 h-3.5" />C
            </span>
          </IconBtn>
          <IconBtn
            onClick={() => deleteTrack(removeRow, activeCell?.r)}
            title={
              activeCell ? "Delete selected row" : "Delete last row"
            }
          >
            <span className="flex items-center text-[11px] font-medium gap-0.5">
              <Minus className="w-3.5 h-3.5" />R
            </span>
          </IconBtn>
          <IconBtn
            onClick={() => deleteTrack(removeCol, activeCell?.c)}
            title={
              activeCell ? "Delete selected column" : "Delete last column"
            }
          >
            <span className="flex items-center text-[11px] font-medium gap-0.5">
              <Minus className="w-3.5 h-3.5" />C
            </span>
          </IconBtn>
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
      </div>

      {/* Spacing popover — sibling of the scroll row so it isn't clipped by
          overflow-x-auto. Text only. */}
      {menu === "spacing" && element.type === "text" && (
        <SpacingPopover
          letterSpacing={Number(element.letterSpacing) || 0}
          lineHeight={element.lineHeight || 1.3}
          onLetter={(v) => patch({ letterSpacing: v })}
          onLine={(v) => patch({ lineHeight: v })}
        />
      )}
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

/** Font-family control. Clicking it opens the Font side panel (Canva-style)
 *  rather than a dropdown. Shows the current font's name in its own face. */
function FontButton({ value, onClick }) {
  const match = EDITOR_FONTS.find((f) => f.family === value);
  return (
    <button
      onClick={onClick}
      title="Font"
      className="h-8 max-w-[130px] flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs text-gray-700 hover:bg-gray-50 transition cursor-pointer"
    >
      <span className="truncate" style={{ fontFamily: match?.family }}>
        {match?.name || "Font"}
      </span>
      <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
    </button>
  );
}

/** Font-size stepper: − [value] + (Canva-style). */
function SizeStepper({ value, onChange }) {
  const set = (v) => onChange(Math.max(1, Math.min(800, Math.round(v))));
  return (
    <div className="flex items-center rounded-lg border border-gray-200 h-8">
      <button
        onClick={() => set(value - 2)}
        title="Smaller"
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-lg cursor-pointer"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => set(Number(e.target.value) || 1)}
        className="w-10 h-full text-center text-xs text-gray-700 tabular-nums focus:outline-none bg-transparent"
      />
      <button
        onClick={() => set(value + 2)}
        title="Larger"
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-lg cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/** Letter-spacing + line-height sliders, dropped below the toolbar. */
function SpacingPopover({ letterSpacing, lineHeight, onLetter, onLine }) {
  return (
    <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-gray-100 bg-surface p-4 shadow-2xl flex flex-col gap-4">
      <SpacingSlider
        label="Letter spacing"
        min={-5}
        max={30}
        step={0.5}
        value={letterSpacing}
        onChange={onLetter}
      />
      <SpacingSlider
        label="Line spacing"
        min={0.8}
        max={3}
        step={0.1}
        value={lineHeight}
        onChange={onLine}
      />
    </div>
  );
}

function SpacingSlider({ label, min, max, step, value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <span className="w-12 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-600 tabular-nums">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-blue-600"
      />
    </div>
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
