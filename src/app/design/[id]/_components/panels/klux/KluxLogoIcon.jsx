"use client";

import React from "react";

/**
 * KluxLogoIcon — the Klux mark, shaped like a lucide icon so it can be dropped
 * into the sidebar rail (and PanelPlaceholder) wherever an `icon` component is
 * expected: it takes the same `className` the rail passes its icons.
 *
 * The logo is a fixed-colour brand SVG, so unlike the lucide icons it doesn't
 * tint on active/inactive — that's intentional; a brand mark keeps its colour.
 */
export default function KluxLogoIcon({ className }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logoblue.svg" alt="Klux AI" className={className} />
  );
}
