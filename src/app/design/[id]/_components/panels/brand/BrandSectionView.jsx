"use client";

import React from "react";
import LogosSection from "./LogosSection";
import ColorsSection from "./ColorsSection";
import FontsSection from "./FontsSection";

/** Maps a nav section id to the panel that renders it. */
const CONTENT = {
  logos: LogosSection,
  colors: ColorsSection,
  fonts: FontsSection,
};

/**
 * BrandSectionView — renders the open brand section's content.
 *
 * Props: { section, brand, insert, editor, setBackground }
 */
export default function BrandSectionView({ section, ...props }) {
  const Content = CONTENT[section.id];
  return Content ? <Content {...props} /> : null;
}
