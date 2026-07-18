"use client";

import React, { useState } from "react";
import MagicTabs from "./MagicTabs";
import GenerationTab from "./GenerationTab";
import useMagicGenerate from "./useMagicGenerate";

// Button/label noun per tab. Videos and 3D read "Generate video" / "Generate 3D".
const NOUN = { images: "images", graphics: "graphics", videos: "video", "3d": "3D" };

/**
 * Magic Studio panel — our take on Canva's Magic Media. All four tabs (Images,
 * Graphics, Videos, 3D) are live generators sharing GenerationTab; what each
 * shows is driven by its hook (styles/aspect pickers, button label). Each keeps
 * its own prompt and results (separate hook instances), so switching is lossless.
 *
 * Generated visuals are clicked to drop onto the canvas, landing on top of the
 * stack (insert.imageUrl appends, which is the topmost z-order).
 *
 * Props: { insert, setBackground, background, editor }
 */
export default function MagicMediaPanel({ insert }) {
  const [tab, setTab] = useState("images");
  const images = useMagicGenerate("images");
  const graphics = useMagicGenerate("graphics");
  const videos = useMagicGenerate("videos");
  const threeD = useMagicGenerate("3d");

  const byTab = { images, graphics, videos, "3d": threeD };
  const mag = byTab[tab];

  const addToCanvas = (url) => insert?.imageUrl(url);

  return (
    <div className="flex flex-col gap-4 p-4">
      <MagicTabs value={tab} onChange={setTab} />
      <GenerationTab mag={mag} noun={NOUN[tab]} onInsert={addToCanvas} />
    </div>
  );
}
