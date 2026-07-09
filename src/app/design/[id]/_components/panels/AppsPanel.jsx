"use client";

import React from "react";
import { LayoutGrid } from "lucide-react";
import PanelPlaceholder from "./PanelPlaceholder";

/**
 * Apps panel — scaffold.
 * TODO: integrations / mini-apps grid (e.g. Pexels, background removal, brand
 * import). Props available: { insert, setBackground, background, editor }
 */
export default function AppsPanel(/* props */) {
  return (
    <PanelPlaceholder
      icon={LayoutGrid}
      title="Apps"
      note="Ready for its contents — connect mini-apps and integrations here."
    />
  );
}
