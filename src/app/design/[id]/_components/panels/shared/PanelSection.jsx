"use client";

import React from "react";
import PanelSectionHeader from "./PanelSectionHeader";

/**
 * PanelSection — a labelled block inside a sidebar panel: the group label, its
 * optional action or hint, and the block's content.
 *
 * Props: { title, hint?, action?, onAction?, children }
 */
export default function PanelSection({ title, hint, action, onAction, children }) {
  return (
    <section className="flex flex-col gap-2">
      <PanelSectionHeader
        title={title}
        variant="sub"
        hint={hint}
        action={action}
        onAction={onAction}
      />
      {children}
    </section>
  );
}
