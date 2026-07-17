"use client";

import React from "react";
import FontCombinationTile from "./FontCombinationTile";

/**
 * FontCombinationGrid — the preset gallery, two-up.
 *
 * Props: { combinations, onPick }
 */
export default function FontCombinationGrid({ combinations, onPick }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {combinations.map((c) => (
        <FontCombinationTile key={c.name} combination={c} onPick={onPick} />
      ))}
    </div>
  );
}
