"use client";

import React, { useMemo } from "react";
import ElementArt from "../ElementArt";
import { useFontsVersion, useNearView } from "../cardHooks";
import { buildComboElements } from "./buildCombo";

/**
 * TextComboCard — a Text template as the grid shows it. Light ground, as in
 * Canva: the designs are made for a page, and most are dark ink.
 *
 * Drawn from the same elements a pick lands on the page, once it scrolls near
 * view, and re-measured whenever a web font lands.
 *
 * Props: { combo, onPick: (combo) => void }
 */
export default function TextComboCard({ combo, onPick }) {
  const [ref, near] = useNearView();
  const fontsVersion = useFontsVersion();

  const art = useMemo(() => {
    if (!near) return null;
    try {
      return buildComboElements(combo);
    } catch (error) {
      console.error(`❌ Text template card "${combo.id}" failed to build:`, error);
      return null;
    }
    // fontsVersion: re-measure once the faces land.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combo, near, fontsVersion]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onPick(combo)}
      title={combo.label}
      className="relative w-full aspect-5/4 rounded-lg overflow-hidden bg-gray-100 cursor-pointer transition hover:ring-2 hover:ring-blue-300"
    >
      {art && <ElementArt elements={art.elements} bounds={art.bounds} />}
    </button>
  );
}
