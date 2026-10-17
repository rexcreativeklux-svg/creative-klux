"use client";

import React, { useMemo, useState } from "react";
import { COMBO_THEMES, TEXT_COMBOS } from "./textCombos";
import ScrollArrowButton from "../../elements/ScrollArrowButton";
import useScrollArrows from "../../elements/useScrollArrows";
import TextComboGrid from "./TextComboGrid";

/** "All", then the themes in their catalogue order. */
const THEME_CHIPS = [{ id: "all", label: "All" }, ...COMBO_THEMES];

/**
 * The theme filter: one row of pills that scrolls sideways, with the same edge
 * arrows as every browse row — twenty-eight pills wrapped would be eight lines.
 */
function ThemeChips({ value, onChange }) {
  const { ref, canLeft, canRight, onScroll, scrollBy } = useScrollArrows();
  return (
    <div className="relative">
      {canLeft && <ScrollArrowButton side="left" onClick={() => scrollBy(-1)} />}
      <div ref={ref} onScroll={onScroll} className="flex gap-1.5 overflow-x-auto hide-scrollbar scroll-smooth">
        {THEME_CHIPS.map((chip) => {
          const on = chip.id === value;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(chip.id)}
              className={`h-8 shrink-0 px-3 rounded-full text-xs font-semibold transition cursor-pointer ${
                on ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
      {canRight && <ScrollArrowButton side="right" onClick={() => scrollBy(1)} />}
    </div>
  );
}

/**
 * TextTemplatesTab — pick a theme, pick a design; it lands on the page as its
 * separate parts, all selected (see useTextTools.insertCombo).
 *
 * Props: { onPick: (combo) => void }
 */
export default function TextTemplatesTab({ onPick }) {
  const [theme, setTheme] = useState("all");
  const combos = useMemo(
    () => (theme === "all" ? TEXT_COMBOS : TEXT_COMBOS.filter((combo) => combo.theme === theme)),
    [theme],
  );

  return (
    <div className="flex flex-col gap-3">
      <ThemeChips value={theme} onChange={setTheme} />
      <TextComboGrid combos={combos} onPick={onPick} />
    </div>
  );
}
