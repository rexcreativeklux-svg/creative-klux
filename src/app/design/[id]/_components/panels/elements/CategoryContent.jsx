"use client";

import React from "react";
import ShapesBrowser from "./ShapesBrowser";
import UploadsPanel from "../UploadsPanel";
import PanelPlaceholder from "../PanelPlaceholder";

/**
 * Maps a category's `content` key to the library that renders it. Each library
 * owns its own padding and receives `onOpenGroup` so it can drill one level
 * deeper (ShapesBrowser uses it for "See all"; libraries without sub-groups
 * ignore it). The header is supplied by PanelView, not here.
 */
const CONTENT = {
  shapes: ShapesBrowser,
  photos: UploadsPanel,
};

/**
 * CategoryContent — resolves one element category to its library, or a "coming
 * soon" placeholder for tiles whose library isn't built yet.
 *
 * Props: { category, onOpenGroup, ...panelProps (insert, editor, …) }
 */
export default function CategoryContent({ category, onOpenGroup, ...panelProps }) {
  const Content = CONTENT[category.content];

  if (!Content) {
    return (
      <PanelPlaceholder
        icon={category.icon}
        title={`${category.label} coming soon`}
        note={`The ${category.label.toLowerCase()} library isn’t wired up yet. Shapes and Photos are available today.`}
      />
    );
  }

  return <Content {...panelProps} onOpenGroup={onOpenGroup} />;
}
