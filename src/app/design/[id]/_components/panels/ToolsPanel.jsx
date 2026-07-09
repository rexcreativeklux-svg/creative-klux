"use client";

import React, { useEffect, useState } from "react";
import {
  MousePointer2,
  Pen,
  Paintbrush,
  Highlighter,
  Eraser,
  Blend,
  Slash,
  StickyNote,
  Type,
  Signature,
  Table,
  AlignJustify,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SHAPE_CATEGORIES } from "../shapes";
import ShapeGrid from "../ShapeGrid";

const DRAW = ["pen", "marker", "highlighter", "eraser"];

// Full line library for the Lines flyout, ordered for browsing. Pulled here
// (rather than the raw category) so straight variants lead and elbow/curved trail.
const LINE_TYPES = [
  "line-solid",
  "line-double",
  "line-dashed",
  "line-long-dash",
  "line-dotted",
  "line-dash-dot",
  "line-wavy",
  "line-zigzag",
  "line-arrow",
  "line-arrow-left",
  "line-arrow-both",
  "line-elbow",
  "line-curved",
];

const TOOL_PRESETS = {
  pen: { size: 6, opacity: 1 },
  marker: { size: 16, opacity: 1 },
  highlighter: { size: 24, opacity: 0.35 },
  eraser: { size: 20, opacity: 1 },
};

const PRESET_COLORS = [
  "#111827",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#8b5cf6",
  "#3b82f6",
];

// Canva-style sticky note palette.
const STICKY_COLORS = [
  "#FEF08A",
  "#FDBA74",
  "#FCA5A5",
  "#F9A8D4",
  "#93C5FD",
  "#86EFAC",
  "#C4B5FD",
];

const LABEL = {
  pen: "Pen",
  marker: "Marker",
  highlighter: "Highlighter",
  eraser: "Eraser",
};

/**
 * Tools panel — Canva-style. Floating main rail (centered). Clicking Pen opens a
 * second flyout rail with the draw sub-tools (Pen/Marker/Highlighter/Eraser),
 * a Color swatch (presets + custom picker) and a Weight/Transparency control.
 */
export default function ToolsPanel({ tool, setTool, insert }) {
  const [popup, setPopup] = useState(null); // 'color' | 'weight' | null
  const [shapesOpen, setShapesOpen] = useState(false);
  const [linesOpen, setLinesOpen] = useState(false);
  const [stickyOpen, setStickyOpen] = useState(false);

  // Leaving the panel stops drawing so the overlay doesn't block the canvas.
  useEffect(() => {
    return () => setTool((t) => ({ ...t, type: "select" }));
  }, [setTool]);

  const isDraw = DRAW.includes(tool.type);

  const closeFlyouts = () => {
    setShapesOpen(false);
    setLinesOpen(false);
    setStickyOpen(false);
  };

  const pickDraw = (type) => {
    setTool((t) => ({ ...t, type, ...(TOOL_PRESETS[type] || {}) }));
    setPopup(null);
    closeFlyouts();
  };

  const toSelect = () => {
    setTool((t) => ({ ...t, type: "select" }));
    setPopup(null);
  };

  return (
    <div className="relative flex items-center">
      {/* Main rail */}
      <div className="flex flex-col items-center gap-1 py-2.5 px-1.5 rounded-2xl bg-surface shadow-xl border border-gray-100">
        <ToolBtn
          icon={MousePointer2}
          label="Select"
          active={tool.type === "select"}
          onClick={() => {
            toSelect();
            closeFlyouts();
          }}
        />
        <ToolBtn
          icon={Pen}
          label="Draw"
          active={isDraw}
          onClick={() => pickDraw("pen")}
        />
        <ToolBtn
          icon={Blend}
          label="Shapes"
          active={shapesOpen}
          onClick={() => {
            toSelect();
            setLinesOpen(false);
            setShapesOpen((v) => !v);
          }}
        />
        <ToolBtn
          icon={Slash}
          label="Lines"
          active={linesOpen}
          onClick={() => {
            toSelect();
            setShapesOpen(false);
            setLinesOpen((v) => !v);
          }}
        />
        <ToolBtn
          icon={StickyNote}
          label="Sticky note"
          active={stickyOpen}
          onClick={() => {
            toSelect();
            setShapesOpen(false);
            setLinesOpen(false);
            setStickyOpen((v) => !v);
          }}
        />
        <ToolBtn
          icon={Type}
          label="Text"
          onClick={() => {
            closeFlyouts();
            insert.text({
              content: "Your text",
              fontSize: 40,
              fontWeight: "bold",
            });
          }}
        />
        <ToolBtn
          icon={Signature}
          label="Signature"
          onClick={() => pickDraw("pen")}
        />
        <ToolBtn
          icon={Table}
          label="Table"
          onClick={() => {
            closeFlyouts();
            toast.message("Tables are coming soon");
          }}
        />
      </div>

      {/* Pen flyout rail */}
      {isDraw && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 flex items-center">
          <div className="flex flex-col items-center gap-1 py-2.5 px-1.5 rounded-2xl bg-surface shadow-xl border border-gray-100">
            <ToolBtn
              icon={Pen}
              label="Pen"
              active={tool.type === "pen"}
              onClick={() => pickDraw("pen")}
            />
            <ToolBtn
              icon={Paintbrush}
              label="Marker"
              active={tool.type === "marker"}
              onClick={() => pickDraw("marker")}
            />
            <ToolBtn
              icon={Highlighter}
              label="Highlighter"
              active={tool.type === "highlighter"}
              onClick={() => pickDraw("highlighter")}
            />
            <ToolBtn
              icon={Eraser}
              label="Eraser"
              active={tool.type === "eraser"}
              onClick={() => pickDraw("eraser")}
            />

            {tool.type !== "eraser" && (
              <>
                <Divider />
                {/* Color swatch */}
                <div className="group relative">
                  <button
                    onClick={() =>
                      setPopup((p) => (p === "color" ? null : "color"))
                    }
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition cursor-pointer ${popup === "color" ? "bg-blue-50" : "hover:bg-gray-100"}`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                      style={{ background: tool.color }}
                    />
                  </button>
                  <Tooltip>Color</Tooltip>
                </div>
                {/* Weight */}
                <div className="group relative">
                  <button
                    onClick={() =>
                      setPopup((p) => (p === "weight" ? null : "weight"))
                    }
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition cursor-pointer ${popup === "weight" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                  >
                    <AlignJustify className="w-5 h-5" />
                  </button>
                  <Tooltip>Weight</Tooltip>
                </div>
              </>
            )}
          </div>

          {/* Popups */}
          {popup === "color" && tool.type !== "eraser" && (
            <ColorPopup
              title={`${LABEL[tool.type]} colors`}
              value={tool.color}
              onPick={(c) => setTool((t) => ({ ...t, color: c }))}
            />
          )}
          {popup === "weight" && tool.type !== "eraser" && (
            <WeightPopup
              size={tool.size}
              opacity={tool.opacity}
              onSize={(v) => setTool((t) => ({ ...t, size: v }))}
              onOpacity={(v) => setTool((t) => ({ ...t, opacity: v }))}
            />
          )}
        </div>
      )}

      {/* Lines flyout — the full line library, Canva-style vertical strip */}
      {linesOpen && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-28 max-h-[74vh] rounded-2xl bg-surface shadow-2xl border border-gray-100 z-50 flex flex-col">
          <header className="h-11 shrink-0 flex items-center justify-between px-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-800">Lines</p>
            <button
              onClick={() => setLinesOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-2">
            <ShapeGrid
              keys={LINE_TYPES}
              onPick={(key) =>
                key === "line-curved"
                  ? insert.curve()
                  : key === "line-elbow"
                    ? insert.elbow()
                    : insert.shape(key)
              }
              cols={2}
            />
          </div>
        </div>
      )}

      {/* Sticky note flyout — pick a color, drops a typeable note */}
      {stickyOpen && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2">
          <div className="flex flex-col items-center gap-2 p-2 rounded-2xl bg-surface shadow-xl border border-gray-100">
            {STICKY_COLORS.map((c) => (
              <PaperSwatch key={c} color={c} onClick={() => insert.sticky(c)} />
            ))}
          </div>
        </div>
      )}

      {/* Shapes flyout — the full shape library, grouped like the Elements panel */}
      {shapesOpen && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 max-h-[74vh] rounded-2xl bg-surface shadow-2xl border border-gray-100 z-50 flex flex-col">
          <header className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-800">Shapes</p>
            <button
              onClick={() => setShapesOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
            {SHAPE_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {cat.label}
                </p>
                <ShapeGrid keys={cat.keys} onPick={insert.shape} cols={4} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** A mini sticky-paper swatch: colored sheet with sheen, shadow and a folded corner. */
function PaperSwatch({ color, onClick }) {
  return (
    <button
      onClick={onClick}
      title="Add sticky note"
      className="relative w-11 h-11 rounded-md cursor-pointer transition hover:scale-105"
      style={{
        backgroundColor: color,
        backgroundImage:
          "linear-gradient(150deg, rgba(255,255,255,0.45), rgba(255,255,255,0) 45%, rgba(0,0,0,0.06))",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      }}
    >
      <span
        className="absolute right-0 bottom-0"
        style={{
          width: 13,
          height: 13,
          borderBottomRightRadius: 6,
          background:
            "linear-gradient(135deg, transparent 52%, rgba(0,0,0,0.18) 52%, rgba(0,0,0,0.3) 100%)",
        }}
      />
    </button>
  );
}

function ColorPopup({ title, value, onPick }) {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-4 rounded-2xl bg-surface shadow-2xl border border-gray-100 z-50">
      <p className="text-sm font-bold text-gray-800 mb-3">{title}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            className={`w-9 h-9 rounded-full border transition cursor-pointer hover:scale-105 ${value === c ? "ring-2 ring-blue-500 ring-offset-1 border-transparent" : "border-gray-200"}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Custom color
      </p>
      <div className="flex items-center gap-2">
        {/* Any color the user likes */}
        <label
          className="w-9 h-9 rounded-full cursor-pointer relative overflow-hidden shrink-0"
          style={{
            background:
              "conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)",
          }}
          title="Pick any color"
        >
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
            onChange={(e) => onPick(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <input
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-f]{6}$/i.test(v)) onPick(v);
            else onPick(v); // let them keep typing; only applies when valid on canvas
          }}
          className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function WeightPopup({ size, opacity, onSize, onOpacity }) {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-4 rounded-2xl bg-surface shadow-2xl border border-gray-100 z-50 flex flex-col gap-4">
      <Slider label="Weight" min={1} max={60} value={size} onChange={onSize} />
      <Slider
        label="Transparency"
        min={10}
        max={100}
        value={Math.round(opacity * 100)}
        onChange={(v) => onOpacity(v / 100)}
      />
    </div>
  );
}

function Slider({ label, min, max, value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <span className="w-11 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-600 tabular-nums">
          {value}
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

function ToolBtn({ icon: Icon, label, active, onClick }) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`w-11 h-11 flex items-center justify-center rounded-xl transition cursor-pointer ${
          active
            ? "bg-blue-50 text-blue-600"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Icon className="w-5 h-5" />
      </button>
      <Tooltip>{label}</Tooltip>
    </div>
  );
}

function Tooltip({ children }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-lg bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-60 shadow-lg">
      {children}
    </span>
  );
}

function Divider() {
  return <span className="w-7 h-px bg-gray-200 my-1" />;
}
