"use client";

import React from "react";
import { BRAND_SECTIONS } from "./sections";
import BrandNavItem from "./BrandNavItem";

/**
 * BrandNavList — the Logos / Colors / Fonts rows.
 *
 * Props: { activeId?, counts: {[id]: number}, onSelect: (section) => void }
 */
export default function BrandNavList({ activeId, counts, onSelect }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {BRAND_SECTIONS.map((section) => (
        <BrandNavItem
          key={section.id}
          section={section}
          count={counts?.[section.id]}
          active={section.id === activeId}
          onClick={() => onSelect(section)}
        />
      ))}
    </nav>
  );
}
