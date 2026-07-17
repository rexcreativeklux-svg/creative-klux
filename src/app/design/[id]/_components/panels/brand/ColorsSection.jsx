"use client";

import React from "react";
import { Palette } from "lucide-react";
import ColorSwatch from "./ColorSwatch";
import BrandEmptyState from "./BrandEmptyState";
import useBrandColorApply from "./useBrandColorApply";

/**
 * ColorsSection — the brand's palette. The brand record has exactly two colour
 * fields (primary_color / secondary_color), so this is at most two swatches;
 * they're labelled rather than left as two anonymous chips.
 *
 * The panel header already reads "Colors", so there's no section heading here.
 *
 * Props: { brand, editor, setBackground }
 */
export default function ColorsSection({ brand, editor, setBackground }) {
  const { applyColor, target } = useBrandColorApply({ editor, setBackground });

  const brandColors = [
    { label: "Primary", color: brand?.primary_color },
    { label: "Secondary", color: brand?.secondary_color },
  ].filter((c) => c.color);

  if (!brandColors.length) {
    return (
      <BrandEmptyState
        icon={Palette}
        title="No brand colors"
        note="Set a primary and secondary color on this brand and they'll appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {brandColors.map(({ label, color }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <ColorSwatch color={color} onClick={applyColor} title={color} />
            <span className="text-[10px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400">Applies to {target}.</p>
    </div>
  );
}
