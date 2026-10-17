"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EDITOR_FONTS, ensureEditorFontsLoaded } from "@/(lib)/design/fonts";
import PanelSearchInput from "./shared/PanelSearchInput";
import PanelSection from "./shared/PanelSection";
import FontList from "./shared/FontList";
import FontDropdown from "./shared/FontDropdown";
import { brandFontList } from "./shared/brandFonts";
import { Segmented } from "./position/positionControls";
import TextStylePresets from "./text/TextStylePresets";
import TextTemplatesTab from "./text/templates/TextTemplatesTab";
import TextComboGrid from "./text/templates/TextComboGrid";
import { searchCombos } from "./text/templates/textCombos";
import TextLookRows from "./text/looks/TextLookRows";
import TextLookView from "./text/looks/TextLookView";
import useTextTools from "./text/useTextTools";
import { familyName } from "./text/textStyle";

/** The two libraries the switch picks between. */
const LIBRARIES = [
  { id: "templates", label: "Templates", title: "Ready-made text designs" },
  { id: "effects", label: "Effects", title: "Outlines, 3D, neon, stickers — on new or selected text" },
];

/** The nearest scrolling ancestor — the sidebar's panel wrapper. */
function scrollParent(node) {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
  }
  return null;
}

/**
 * Text panel — add text, or restyle what's selected.
 *
 * Sectioned like the Elements panel: add a text box → default styles → brand
 * fonts → fonts → one switch between the two libraries:
 *   Templates — ready-made text designs: two or three text boxes in different
 *               fonts and effects, sometimes a shape behind, in a two-up grid by
 *               theme. One lands as its separate parts, all selected.
 *   Effects   — text looks in category rows. They restyle the selected text, or
 *               add new text wearing the look.
 *
 * Searching looks through both templates and fonts; everything else gets out
 * of the way.
 *
 * Props: { insert, editor }
 */
export default function TextPanel({ insert, editor }) {
  const { activeBrand } = useAuth();
  const [query, setQuery] = useState("");
  const [library, setLibrary] = useState("templates");
  // An Effects category's "See all" drills into it. It opens at its top, and
  // Back returns to the spot in the rows it was opened from.
  const [openGroup, setOpenGroup] = useState(null);
  const rootRef = useRef(null);
  const savedScroll = useRef(0);
  const { selectedText, activeLook, applyFont, applyLook, removeLook, insertCombo } =
    useTextTools({ insert, editor });

  useEffect(() => {
    ensureEditorFontsLoaded();
  }, []);

  const openSeeAll = (group) => {
    savedScroll.current = scrollParent(rootRef.current)?.scrollTop || 0;
    setOpenGroup(group);
  };
  useLayoutEffect(() => {
    const scroller = scrollParent(rootRef.current);
    if (scroller) scroller.scrollTop = openGroup ? 0 : savedScroll.current;
  }, [openGroup]);

  const q = query.trim().toLowerCase();
  const fontMatches = useMemo(
    () => (q ? EDITOR_FONTS.filter((f) => f.name.toLowerCase().includes(q)) : null),
    [q],
  );
  const comboMatches = useMemo(() => (q ? searchCombos(q) : []), [q]);
  const brandFonts = useMemo(() => brandFontList(activeBrand), [activeBrand]);
  const activeFamily = selectedText?.fontFamily;

  const search = (
    <PanelSearchInput value={query} onChange={setQuery} placeholder="Search fonts and templates" />
  );

  return (
    <div ref={rootRef}>
      {openGroup ? (
        // Drilled into one Effects category: it gets the whole column, with a way back.
        <TextLookView
          group={openGroup}
          activeLook={activeLook}
          onPick={applyLook}
          onBack={() => setOpenGroup(null)}
        />
      ) : fontMatches ? (
        // Searching is about finding one thing, so everything else gets out of
        // the way rather than being filtered alongside it.
        <div className="p-3 flex flex-col gap-4">
          {search}
          {comboMatches.length > 0 && (
            <PanelSection title="Templates">
              <TextComboGrid combos={comboMatches} onPick={insertCombo} />
            </PanelSection>
          )}
          {comboMatches.length > 0 ? (
            fontMatches.length > 0 && (
              <PanelSection title="Fonts">
                <FontList fonts={fontMatches} onPick={applyFont} activeFamily={activeFamily} />
              </PanelSection>
            )
          ) : fontMatches.length > 0 ? (
            <FontList fonts={fontMatches} onPick={applyFont} activeFamily={activeFamily} />
          ) : (
            <p className="text-xs text-gray-400 text-center py-6">No fonts or templates found.</p>
          )}
        </div>
      ) : (
        <div className="p-3 flex flex-col gap-5">
          {search}

          <button
            type="button"
            onClick={() => insert.text({ content: "Your text", fontSize: 40, fontWeight: "bold" })}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer transition"
          >
            <Plus className="w-4 h-4" /> Add a text box
          </button>

          <PanelSection title="Default text styles">
            <TextStylePresets onPick={insert.text} />
          </PanelSection>

          {brandFonts.length > 0 && (
            <PanelSection title="Brand fonts">
              <FontList fonts={brandFonts} onPick={applyFont} activeFamily={activeFamily} />
            </PanelSection>
          )}

          <PanelSection title="Fonts" hint={selectedText ? "Applies to selected text" : undefined}>
            <FontDropdown
              fonts={EDITOR_FONTS}
              onPick={applyFont}
              activeFamily={activeFamily}
              activeLabel={familyName(activeFamily) || "Choose a font"}
            />
          </PanelSection>

          <Segmented options={LIBRARIES} value={library} onChange={setLibrary} />

          {/* Each library titles its own content, so this isn't wrapped in
              another PanelSection — that would print a heading above headings. */}
          {library === "templates" ? (
            <TextTemplatesTab onPick={insertCombo} />
          ) : (
            <TextLookRows
              activeLook={activeLook}
              onPick={applyLook}
              onSeeAll={openSeeAll}
              onRemove={removeLook}
            />
          )}
        </div>
      )}
    </div>
  );
}
