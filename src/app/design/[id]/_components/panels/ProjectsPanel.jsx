"use client";

import React from "react";
import { FolderOpen } from "lucide-react";
import PanelPlaceholder from "./PanelPlaceholder";

/**
 * Projects panel — scaffold.
 * TODO: list the user's designs/creations (fetchDesigns) so they can open or
 * pull one in. Props available: { insert, setBackground, background, editor }
 */
export default function ProjectsPanel(/* props */) {
  return (
    <PanelPlaceholder
      icon={FolderOpen}
      title="Projects"
      note="Ready for its contents — your saved designs will live here."
    />
  );
}
