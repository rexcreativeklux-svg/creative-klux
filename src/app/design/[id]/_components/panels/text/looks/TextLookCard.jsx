"use client";

import React, { useMemo } from "react";
import ElementArt from "../ElementArt";
import { useFontsVersion, useNearView } from "../cardHooks";
import { lookElement, lookPreviewText } from "./lookStyle";

/** The size a card's word is set at before it's fitted to the card. */
const PREVIEW_SIZE = 96;

/**
 * TextLookCard — one Text effect or single-look template, drawn as the text a
 * pick produces. Dark ground: most looks are made for footage and several are
 * white ink.
 *
 * Props: { template, active?, onPick: (template) => void }
 */
export default function TextLookCard({ template, active = false, onPick }) {
  const [ref, near] = useNearView();
  const fontsVersion = useFontsVersion();

  const art = useMemo(() => {
    if (!near) return null;
    const el = lookElement(template, { content: lookPreviewText(template), fontSize: PREVIEW_SIZE });
    return { elements: [el], bounds: { x: el.x, y: el.y, width: el.width, height: el.height } };
    // fontsVersion: re-measure once the face lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, near, fontsVersion]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onPick(template)}
      title={template.label}
      aria-pressed={active}
      className={`relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-neutral-900 cursor-pointer transition ${
        active ? "ring-2 ring-blue-500 ring-offset-1" : "hover:ring-2 hover:ring-blue-300"
      }`}
    >
      {art && <ElementArt elements={art.elements} bounds={art.bounds} inset={0.12} />}
    </button>
  );
}
