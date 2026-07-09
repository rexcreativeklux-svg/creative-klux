"use client";

import React, { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { SHAPES, SHAPE_CATEGORIES } from "../shapes";
import ShapeSVG from "../ShapeSVG";

// currentColor so previews follow the panel's text color (readable in light AND
// dark — a fixed dark fill vanished on the dark sidebar).
const PREVIEW_FILL = "currentColor";
const COLLAPSED_COUNT = 5; // shapes shown per row before "See all"

/**
 * Elements panel — Canva-style. A search box filters the shape library by name;
 * otherwise shapes are grouped into category rows (Lines, Basic, Polygons, …)
 * each with a "See all" that expands the full category. Clicking a shape drops
 * it on the canvas via insert.shape(key).
 */
export default function ElementsPanel({ insert }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({}); // { [categoryId]: bool }

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    return Object.keys(SHAPES).filter(
      (k) =>
        SHAPES[k].label.toLowerCase().includes(q) ||
        SHAPES[k].category.toLowerCase().includes(q),
    );
  }, [q]);

  return (
    <div className="p-3 flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 focus-within:border-blue-400 bg-surface">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shapes"
          className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-400"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {matches ? (
        matches.length ? (
          <ShapeGrid keys={matches} onPick={insert.shape} />
        ) : (
          <p className="text-xs text-gray-400 text-center py-8">
            No shapes match “{query}”.
          </p>
        )
      ) : (
        SHAPE_CATEGORIES.map((cat) => {
          const isOpen = expanded[cat.id];
          const shown = isOpen ? cat.keys : cat.keys.slice(0, COLLAPSED_COUNT);
          const hasMore = cat.keys.length > COLLAPSED_COUNT;
          return (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {cat.label}
                </p>
                {hasMore && (
                  <button
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [cat.id]: !e[cat.id] }))
                    }
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    {isOpen ? "Show less" : "See all"}
                  </button>
                )}
              </div>
              <ShapeGrid keys={shown} onPick={insert.shape} />
            </div>
          );
        })
      )}
    </div>
  );
}

function ShapeGrid({ keys, onPick }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onPick(key)}
          title={SHAPES[key]?.label || key}
          className="aspect-square rounded-lg border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-center p-2"
        >
          <ShapeSVG shape={key} fill={PREVIEW_FILL} fit />
        </button>
      ))}
    </div>
  );
}
