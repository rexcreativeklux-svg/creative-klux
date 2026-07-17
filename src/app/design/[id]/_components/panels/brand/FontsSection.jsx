"use client";

import React, { useEffect } from "react";
import { Type } from "lucide-react";
import { ensureEditorFontsLoaded } from "@/(lib)/design/fonts";
import FontList from "../shared/FontList";
import useTextInsert from "../shared/useTextInsert";
import BrandEmptyState from "./BrandEmptyState";
import { brandFontList } from "../shared/brandFonts";

/**
 * FontsSection — the brand's fonts. Picking one restyles the selected text, or
 * drops a new heading in it — same rule as the Text panel, via useTextInsert.
 *
 * Props: { brand, insert, editor }
 */
export default function FontsSection({ brand, insert, editor }) {
  const { selectedText, applyFont } = useTextInsert({ insert, editor });
  const fonts = brandFontList(brand);

  // Brand fonts aren't necessarily in EDITOR_FONTS, but the previews still need
  // the editor's stylesheet present for any that are.
  useEffect(() => {
    ensureEditorFontsLoaded();
  }, []);

  if (!fonts.length) {
    return (
      <BrandEmptyState
        icon={Type}
        title="No brand fonts"
        note="Add fonts to this brand and they'll be one click away here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <FontList
        fonts={fonts}
        onPick={applyFont}
        activeFamily={selectedText?.fontFamily}
      />
      <p className="text-[10px] text-gray-400">
        {selectedText
          ? "Applies to the selected text."
          : "Adds a heading in that font."}
      </p>
    </div>
  );
}
