"use client";

import React, { useState } from "react";
import MagicTabs from "./MagicTabs";
import GenerationTab from "./GenerationTab";
import MagicToolTab from "./MagicToolTab";
import useMagicGenerate from "./useMagicGenerate";
import { MAGIC_TABS } from "./constants";

// Button/label noun for the placeholder tabs ("Generate graphics" / "Generate 3D").
const NOUN = { graphics: "graphics", "3d": "3D" };

/**
 * Magic Studio panel — the editor's take on Canva's Magic Media. Two kinds of
 * tab live here, and MAGIC_TABS (constants.js) says which is which:
 *
 *   • LIVE tabs (Images, Variations, Persona) carry a `tool` — the Magic Studio
 *     backend config id. They render {@link MagicToolTab}, which runs the very
 *     same generate + history endpoints as the /magic-studio page. A finished
 *     image drops onto the canvas centred and on top (like an imported image)
 *     and lands in that tool's History at once.
 *   • PLACEHOLDER tabs (Graphics, 3D) have `tool: null` and stay on the local
 *     stub generators in this folder, so pressing Generate explains that the
 *     pipeline isn't connected yet instead of calling the backend.
 *
 * There is no video tab: a design composes to a static image and the editor has
 * no video element, so a generated clip would have nowhere to land — the same
 * rule the uploads panel states in useMediaInsert.
 *
 * Props: { insert, setBackground, background, editor }
 */
export default function MagicMediaPanel({ insert, editor }) {
  const [tab, setTab] = useState("images");
  const activeTab = MAGIC_TABS.find((t) => t.id === tab) || MAGIC_TABS[0];

  // Both placeholder machines are instantiated up front (hooks can't be
  // conditional); only the active one is rendered, and each keeps its own prompt.
  const graphics = useMagicGenerate("graphics");
  const threeD = useMagicGenerate("3d");
  const placeholder = activeTab.id === "3d" ? threeD : graphics;

  return (
    <div className="flex flex-col gap-4 p-4">
      <MagicTabs value={tab} onChange={setTab} />

      {activeTab.tool ? (
        // Keyed by tool so switching tabs gives each tool a clean form + its own
        // history fetch, rather than leaking the previous tool's inputs.
        <MagicToolTab
          key={activeTab.tool}
          toolId={activeTab.tool}
          insert={insert}
          editor={editor}
        />
      ) : (
        <GenerationTab
          mag={placeholder}
          noun={NOUN[activeTab.id]}
          onInsert={(url) => insert?.imageUrl(url)}
        />
      )}
    </div>
  );
}
