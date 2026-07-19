"use client";

import React from "react";
import { GRID_PRESETS } from "@/(lib)/design/grids";
import GridPreview from "./GridPreview";

/**
 * GridsLibrary — the Elements › Grids library. A set of layout presets; click
 * one to drop an empty photo grid, then double-click a cell (or drop an image
 * onto it) to fill it. Inserts via the editor's `insert.grid` API.
 *
 * Props: { insert }
 */
export default function GridsLibrary({ insert }) {
  return (
    <div className="p-3 flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        Add a grid, then double-click a cell or drop an image on it to fill.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {GRID_PRESETS.map((g) => (
          <GridPreview
            key={`${g.rows}x${g.cols}`}
            rows={g.rows}
            cols={g.cols}
            onPick={insert.grid}
          />
        ))}
      </div>
    </div>
  );
}
