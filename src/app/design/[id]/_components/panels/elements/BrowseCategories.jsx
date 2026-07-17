"use client";

import React from "react";
import { ELEMENT_CATEGORIES } from "./categories";
import CategoryGrid from "./CategoryGrid";
import PanelSectionHeader from "../shared/PanelSectionHeader";

/**
 * BrowseCategories — the Elements panel's landing view: a "Browse categories"
 * heading over the tile grid.
 *
 * Props: { onPick: (category) => void }
 */
export default function BrowseCategories({ onPick }) {
  return (
    <div className="p-3 flex flex-col gap-3">
      <PanelSectionHeader title="Browse categories" />
      <CategoryGrid categories={ELEMENT_CATEGORIES} onPick={onPick} />
    </div>
  );
}
