"use client";

import React from "react";
import PanelViewHeader from "./PanelViewHeader";

/**
 * PanelView — shell for any drilled-in panel view: a header that stays put while
 * the body scrolls (the scroll container is the sidebar's panel wrapper), over
 * whatever the view renders. The body owns its own padding.
 *
 * Props: { title, chip?, onBack, children }
 */
export default function PanelView({ title, chip, onBack, children }) {
  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 bg-surface px-3 py-2 border-b border-gray-100">
        <PanelViewHeader title={title} chip={chip} onBack={onBack} />
      </div>
      {children}
    </div>
  );
}
