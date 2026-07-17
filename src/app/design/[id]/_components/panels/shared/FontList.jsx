"use client";

import React from "react";
import FontRow from "./FontRow";

/**
 * FontList — a flat list of font rows.
 *
 * Props: { fonts: [{name, family}], onPick, activeFamily? }
 */
export default function FontList({ fonts, onPick, activeFamily }) {
  if (!fonts.length) {
    return <p className="text-xs text-gray-400 text-center py-6">No fonts found.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {fonts.map((f) => (
        <FontRow
          key={f.name}
          label={f.name}
          family={f.family}
          active={activeFamily === f.family}
          onPick={onPick}
        />
      ))}
    </div>
  );
}
