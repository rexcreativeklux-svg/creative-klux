"use client";

import React, { useMemo, useState } from "react";
import { SHAPES, SHAPE_CATEGORIES } from "@/(lib)/design/shapes";
import ShapeGrid from "../../ShapeGrid";
import { makeShapePicker } from "../../shapePicker";
import PanelSearchInput from "../shared/PanelSearchInput";
import ShapeCategoryRow from "./ShapeCategoryRow";

/**
 * ShapesBrowser — the Elements › Shapes library. A search box filters the whole
 * library by name; otherwise shapes are grouped into browse rows (Lines, Basic,
 * Polygons, …) that scroll sideways, each with a "See all" that opens the
 * group's own gallery via onOpenGroup.
 *
 * Props: { insert, onOpenGroup: (group) => void }
 */
export default function ShapesBrowser({ insert, onOpenGroup }) {
  const [query, setQuery] = useState("");
  const pick = makeShapePicker(insert);

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
      <PanelSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search shapes"
      />

      {matches ? (
        matches.length ? (
          <ShapeGrid keys={matches} onPick={pick} />
        ) : (
          <p className="text-xs text-gray-400 text-center py-8">
            No shapes match “{query}”.
          </p>
        )
      ) : (
        SHAPE_CATEGORIES.map((cat) => (
          <ShapeCategoryRow
            key={cat.id}
            category={cat}
            onSeeAll={() => onOpenGroup(cat)}
            onPick={pick}
          />
        ))
      )}
    </div>
  );
}
