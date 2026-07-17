"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  EDITOR_FONTS,
  FONT_COMBINATIONS,
  ensureEditorFontsLoaded,
} from "@/(lib)/design/fonts";
import PanelSearchInput from "./shared/PanelSearchInput";
import PanelSection from "./shared/PanelSection";
import TextStylePresets from "./text/TextStylePresets";
import FontList from "./shared/FontList";
import FontDropdown from "./shared/FontDropdown";
import FontCombinationGrid from "./text/FontCombinationGrid";
import useTextInsert from "./shared/useTextInsert";
import { brandFontList } from "./shared/brandFonts";

/** "'Playfair Display', serif" → "Playfair Display" (for the dropdown label). */
const familyName = (family) => family?.match(/'([^']+)'/)?.[1] || family;

/**
 * Text panel — add text, restyle the selection. Searching collapses everything
 * to a flat font list; otherwise the sections run: add a text box → default
 * styles → brand fonts → fonts → font combinations.
 *
 * Props: { insert, editor }
 */
export default function TextPanel({ insert, editor }) {
  const { activeBrand } = useAuth();
  const [query, setQuery] = useState("");
  const { selectedText, applyFont } = useTextInsert({ insert, editor });

  useEffect(() => {
    ensureEditorFontsLoaded();
  }, []);

  const q = query.trim().toLowerCase();
  const fonts = useMemo(
    () =>
      q
        ? EDITOR_FONTS.filter((f) => f.name.toLowerCase().includes(q))
        : EDITOR_FONTS,
    [q],
  );

  const brandFonts = useMemo(() => brandFontList(activeBrand), [activeBrand]);

  const activeFamily = selectedText?.fontFamily;

  if (q) {
    return (
      <div className="p-3 flex flex-col gap-4">
        <PanelSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search fonts"
        />
        <FontList fonts={fonts} onPick={applyFont} activeFamily={activeFamily} />
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-4">
      <PanelSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search fonts"
      />

      <button
        onClick={() =>
          insert.text({ content: "Your text", fontSize: 40, fontWeight: "bold" })
        }
        className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer transition"
      >
        <Plus className="w-4 h-4" /> Add a text box
      </button>

      <PanelSection title="Default text styles">
        <TextStylePresets onPick={insert.text} />
      </PanelSection>

      {brandFonts.length > 0 && (
        <PanelSection title="Brand fonts">
          <FontList
            fonts={brandFonts}
            onPick={applyFont}
            activeFamily={activeFamily}
          />
        </PanelSection>
      )}

      <PanelSection
        title="Fonts"
        hint={selectedText ? "Applies to selected text" : undefined}
      >
        <FontDropdown
          fonts={EDITOR_FONTS}
          onPick={applyFont}
          activeFamily={activeFamily}
          activeLabel={familyName(activeFamily) || "Choose a font"}
        />
      </PanelSection>

      <PanelSection title="Font combinations">
        <FontCombinationGrid
          combinations={FONT_COMBINATIONS}
          onPick={insert.text}
        />
      </PanelSection>
    </div>
  );
}
