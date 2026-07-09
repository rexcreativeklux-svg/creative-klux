"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import PanelPlaceholder from "./PanelPlaceholder";

/**
 * Magic Media panel — scaffold.
 * TODO: AI generation (text-to-image / image-to-image). Note the app's current
 * image-gen path is a dead end (base44 removed) — repoint when a service is set.
 * Props available: { insert, setBackground, background, editor }
 */
export default function MagicMediaPanel(/* props */) {
  return (
    <PanelPlaceholder
      icon={Sparkles}
      title="Magic Media"
      note="Ready for its contents — AI image generation will live here."
    />
  );
}
