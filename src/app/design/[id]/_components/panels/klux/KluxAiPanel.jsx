"use client";

import React from "react";
import PanelPlaceholder from "../PanelPlaceholder";
import KluxLogoIcon from "./KluxLogoIcon";

/**
 * Klux AI panel — placeholder. The AI assistant isn't built yet; this keeps the
 * tab present and inspectable, branded with the Klux mark. Swap the body for the
 * real assistant when it's ready.
 */
export default function KluxAiPanel() {
  return (
    <PanelPlaceholder
      icon={KluxLogoIcon}
      title="Klux AI"
      note="Your AI design assistant is coming soon."
    />
  );
}
