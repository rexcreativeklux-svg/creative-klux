"use client";

import React from "react";
import ShapeGrid from "../../ShapeGrid";
import { makeShapePicker } from "../../shapePicker";

/**
 * ShapeGroupView — the "See all" gallery for one shape group: every shape in the
 * group, large and borderless so the silhouette itself is what you scan. The
 * group's name and back arrow live in the panel header (see ElementsPanel).
 *
 * Props: { group: {keys}, insert }
 */
export default function ShapeGroupView({ group, insert }) {
  return (
    <div className="p-3">
      <ShapeGrid
        keys={group.keys}
        onPick={makeShapePicker(insert)}
        cols={3}
        variant="plain"
      />
    </div>
  );
}
