"use client";

import React from "react";
import { PenTool } from "lucide-react";
import PanelPlaceholder from "./PanelPlaceholder";

/**
 * Tools panel — scaffold.
 * TODO: fill with the editing tools you want (e.g. background remover, resize,
 * effects, crop). Props available: { insert, setBackground, background, editor }
 */
export default function ToolsPanel(/* props */) {
  return (
    <PanelPlaceholder
      icon={PenTool}
      title="Tools"
      note="Ready for its contents — drop the editing tools here."
    />
  );
}
