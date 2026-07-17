"use client";

import React from "react";
import BrowseCategories from "./elements/BrowseCategories";
import CategoryContent from "./elements/CategoryContent";
import ShapeGroupView from "./elements/ShapeGroupView";
import PanelView from "./elements/PanelView";
import usePanelStack from "./elements/usePanelStack";

/**
 * Elements panel — Canva-style, three levels deep:
 *
 *   Browse categories  →  a category (Shapes)  →  a group's gallery (Stars)
 *
 * Each level pushes onto the panel stack, and every header's back arrow pops one
 * level. The panel's own title ("Elements") lives in EditorSidebar's header;
 * everything below is composed from ./elements/*.
 *
 * Props: { insert, editor, ... } — forwarded untouched to whichever library the
 * active category renders.
 */
export default function ElementsPanel(props) {
  const { view, push, back } = usePanelStack();

  if (!view) {
    return (
      <BrowseCategories
        onPick={(category) => push({ kind: "category", category })}
      />
    );
  }

  // Shapes is the only library with sub-groups today; when a second one grows
  // them, give the view a renderer rather than widening this branch.
  if (view.kind === "shapeGroup") {
    return (
      <PanelView title={view.group.label} onBack={back}>
        <ShapeGroupView group={view.group} insert={props.insert} />
      </PanelView>
    );
  }

  return (
    <PanelView title={view.category.label} chip={view.category} onBack={back}>
      <CategoryContent
        {...props}
        category={view.category}
        onOpenGroup={(group) => push({ kind: "shapeGroup", group })}
      />
    </PanelView>
  );
}
