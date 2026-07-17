"use client";

import React from "react";
import PanelSection from "../shared/PanelSection";
import HorizontalShapeStrip from "./HorizontalShapeStrip";

/**
 * ShapeCategoryRow — one shape group (Lines, Polygons, …) as a browse row: its
 * label, a "See all" that opens the group's own gallery, and the shapes as a
 * sideways-scrolling strip.
 *
 * Props: { category: {label, keys}, onSeeAll, onPick }
 */
export default function ShapeCategoryRow({ category, onSeeAll, onPick }) {
  return (
    <PanelSection title={category.label} action="See all" onAction={onSeeAll}>
      <HorizontalShapeStrip keys={category.keys} onPick={onPick} />
    </PanelSection>
  );
}
