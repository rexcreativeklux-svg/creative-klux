"use client";

import React from "react";
import CategoryTile from "./CategoryTile";

/**
 * CategoryGrid — lays the element category tiles out three-up, matching Canva's
 * Browse categories block.
 *
 * Props: { categories, onPick: (category) => void }
 */
export default function CategoryGrid({ categories, onPick }) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-4">
      {categories.map((cat) => (
        <CategoryTile
          key={cat.id}
          category={cat}
          onClick={() => onPick(cat)}
        />
      ))}
    </div>
  );
}
