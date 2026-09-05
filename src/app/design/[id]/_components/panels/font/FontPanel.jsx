"use client";

import React, { useMemo, useState } from "react";
import { Search, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { EDITOR_FONTS } from "@/(lib)/design/fonts";
import { readTextStyle, takesTextStyle } from "@/(lib)/design/groupStyling";
import FontList from "../shared/FontList";
import TextStylesTab from "./TextStylesTab";

/**
 * FontPanel — Canva-style typography panel opened from the text toolbar's font
 * control. Two tabs: "Font" (a searchable/filterable font browser previewed in
 * each face) and "Text styles" (a Title→Body size/weight ladder). Both apply to
 * the currently selected text element via the shared editor state.
 *
 * Props: { editor, onClose }
 */
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "sans", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "display", label: "Display" },
];

export default function FontPanel({ editor, onClose }) {
  const [tab, setTab] = useState("font"); // 'font' | 'styles'
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");

  const el = editor?.selectedElement;
  // For a group, the face its text is currently set in — so the list highlights
  // the right row before anything has been changed.
  const activeFamily = readTextStyle(el, "fontFamily");

  const fonts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EDITOR_FONTS.filter(
      (f) =>
        (cat === "all" || f.category === cat) &&
        (!q || f.name.toLowerCase().includes(q)),
    );
  }, [query, cat]);

  const applyFont = (family) => {
    if (!takesTextStyle(el)) {
      toast.info("Select a text layer to change its font.");
      return;
    }
    // A group takes the same patch: updateElement deals it out to every text
    // member (see groupStyling), so one pick re-sets all the words in there.
    editor.updateElement(el.id, { fontFamily: family }, { record: true });
  };

  return (
    <section className="w-full h-[55dvh] shrink-0 bg-surface border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col lg:w-75 lg:h-auto lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800">Font</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex items-center px-4 border-b border-gray-100">
        {[
          ["font", "Font"],
          ["styles", "Text styles"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative -mb-px py-2.5 px-2 mr-4 text-sm font-medium transition cursor-pointer ${
              tab === id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {label}
            {tab === id && (
              <span className="absolute left-0 -bottom-px h-0.5 w-full rounded-full bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {tab === "font" ? (
        <>
          {/* Search */}
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search fonts…"
                className="w-full pl-9 pr-3 h-9 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:bg-surface transition"
              />
            </div>
          </div>

          {/* Category chips — fill the row evenly, no horizontal scroll */}
          <div className="px-3 pt-2.5 flex gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`flex-1 px-2 py-1.5 rounded-full text-xs font-semibold text-center transition cursor-pointer ${
                  cat === c.id
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : "bg-gray-100 text-gray-500 hover:text-gray-700"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Font list */}
          <div className="flex-1 overflow-y-auto px-2 py-3">
            <FontList fonts={fonts} onPick={applyFont} activeFamily={activeFamily} />
          </div>

          {/* Upload */}
          <div className="shrink-0 border-t border-gray-100 p-3">
            <button
              onClick={() =>
                toast.message("Uploading custom fonts is coming soon.")
              }
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Upload a font
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <TextStylesTab editor={editor} />
        </div>
      )}
    </section>
  );
}
