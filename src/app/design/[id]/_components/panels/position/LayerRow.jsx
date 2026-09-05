"use client";

import React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { isClipped } from "@/(lib)/design/clip";

/**
 * LayerRow — one row of the layers list: what the element LOOKS like, not what
 * its type is called.
 *
 * The list used to print a type name, so a page of photos read as
 * "Image / Image / Image" and picking the right one meant clicking through them.
 * A layer list is a visual index or it is nothing, so every row previews its own
 * element.
 */

/** The name for a row: the element's own words wherever it has them. */
export function layerName(el) {
  if (!el) return "Element";
  if (el.name) return el.name;

  const words = (el.content || el.text || "").toString().trim();
  if (words) return words.length > 30 ? `${words.slice(0, 30)}…` : words;

  if (el.type === "group") {
    const n = el.children?.length || 0;
    return n ? `Group of ${n}` : "Group";
  }
  if (el.type === "table") return `Table ${el.rows}×${el.cols}`;
  if (el.type === "shape") {
    const shape = el.shape || "shape";
    return shape.charAt(0).toUpperCase() + shape.slice(1);
  }

  const type = el.type || "element";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * A 36px square standing in for the element.
 *
 * Deliberately not a real render: putting the actual renderer in every row would
 * mount a copy of the whole element tree — charts, tables, grouped children —
 * per row, re-rendered on every store change, for a 36px thumbnail. These few
 * cases cover what is actually hard to tell apart in a list.
 */
function LayerThumb({ el }) {
  const base =
    "w-9 h-9 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50";

  if (el.type === "image" && el.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={el.src}
        alt=""
        draggable={false}
        className={`${base} object-cover`}
      />
    );
  }

  if (el.type === "text") {
    return (
      <span
        className={`${base} flex items-center justify-center px-0.5 text-[9px] font-bold leading-none`}
        style={{ color: el.color || el.fill || "#111827" }}
      >
        {/* First two characters only — anything more is a smudge at this size. */}
        {(el.content || el.text || "Aa").toString().trim().slice(0, 2) || "Aa"}
      </span>
    );
  }

  const fill = el.fill || el.background || el.backgroundColor;
  return (
    <span
      className={base}
      style={
        fill && fill !== "transparent"
          ? { background: fill }
          : {
              // The usual "nothing here" chequer, so an unfilled shape doesn't
              // read as a thumbnail that failed to load.
              backgroundImage:
                "linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%)," +
                "linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 4px 4px",
            }
      }
    />
  );
}

/**
 * Props: { el, depth, selected, dragging, dropTarget, onSelect, onToggleHidden,
 *          dragHandlers }
 *
 * `dragHandlers` comes straight from useLayerReorder — the row knows how to
 * look, the hook knows how to move.
 */
export default function LayerRow({
  el,
  depth,
  selected,
  dragging,
  dropTarget,
  onSelect,
  onToggleHidden,
  dragHandlers,
}) {
  return (
    <div
      draggable
      onClick={(e) => onSelect(el.id, e)}
      {...dragHandlers}
      className={`group flex select-none items-center gap-2.5 rounded-lg border px-2 py-1.5 transition
        cursor-grab active:cursor-grabbing ${dragging ? "opacity-40" : ""} ${
          selected
            ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-400"
            : dropTarget
              ? "border-blue-400 bg-blue-50/40"
              : "border-gray-200 hover:bg-gray-50"
        }`}
    >
      <LayerThumb el={el} />

      <span
        className={`min-w-0 flex-1 truncate text-xs ${
          el.hidden
            ? "text-gray-300 line-through"
            : selected
              ? "font-semibold text-blue-700"
              : "font-medium text-gray-700"
        }`}
      >
        {layerName(el)}
        {isClipped(el.clip) && (
          <span className="ml-1 text-[10px] font-normal text-gray-400">cropped</span>
        )}
      </span>

      {el.locked && <Lock className="w-3 h-3 shrink-0 text-gray-400" />}

      <button
        type="button"
        title={el.hidden ? "Show" : "Hide"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleHidden(el.id);
        }}
        // A hidden layer keeps its button visible whatever the pointer is doing:
        // it is the only way back, and hunting for it by hovering blind rows is
        // how a layer stays lost.
        className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-md text-gray-400 transition
          cursor-pointer hover:bg-gray-200 hover:text-gray-700 ${
            el.hidden ? "" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          }`}
      >
        {el.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>

      {/* The same depth the Arrange tab reads out, on every row — so a Forward
          or Backward shows up as a number moving, not only as a row hopping. */}
      <span className="shrink-0 w-4 text-right text-[10px] tabular-nums text-gray-400">
        {depth}
      </span>
    </div>
  );
}
