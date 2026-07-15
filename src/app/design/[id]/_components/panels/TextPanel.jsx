"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, X, Type } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  EDITOR_FONTS,
  FONT_COMBINATIONS,
  ensureEditorFontsLoaded,
} from "@/(lib)/design/fonts";

/** Heading / subheading / body ladder. */
const DEFAULT_STYLES = [
  { label: "Add a heading", content: "Add a heading", fontSize: 72, fontWeight: "bold", preview: "text-2xl font-bold" },
  { label: "Add a subheading", content: "Add a subheading", fontSize: 44, fontWeight: 600, preview: "text-lg font-semibold" },
  { label: "Add a little bit of body text", content: "Add a little bit of body text", fontSize: 26, fontWeight: "normal", preview: "text-sm" },
];

export default function TextPanel({ insert, editor }) {
  const { activeBrand } = useAuth();
  const [query, setQuery] = useState("");

  useEffect(() => {
    ensureEditorFontsLoaded();
  }, []);

  const q = query.trim().toLowerCase();
  const fonts = useMemo(
    () => (q ? EDITOR_FONTS.filter((f) => f.name.toLowerCase().includes(q)) : EDITOR_FONTS),
    [q],
  );

  const selectedText =
    editor.selectedElement?.type === "text" ? editor.selectedElement : null;

  // Clicking a font: apply to the selected text, else drop a new heading in it.
  const useFont = (family) => {
    if (selectedText) {
      editor.updateElement(selectedText.id, { fontFamily: family }, { record: true });
    } else {
      insert.text({ content: "Add a heading", fontSize: 48, fontWeight: "bold", fontFamily: family });
    }
  };

  const brandFonts = (activeBrand?.fonts || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="p-3 flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 focus-within:border-blue-400 bg-surface">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fonts"
          className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-400"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {q ? (
        <FontList fonts={fonts} onPick={useFont} activeFamily={selectedText?.fontFamily} />
      ) : (
        <>
          <button
            onClick={() => insert.text({ content: "Your text", fontSize: 40, fontWeight: "bold" })}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer transition"
          >
            <Plus className="w-4 h-4" /> Add a text box
          </button>

          {/* Default text styles */}
          <Section title="Default text styles">
            <div className="flex flex-col gap-2">
              {DEFAULT_STYLES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => insert.text(s)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition"
                >
                  <span className={`text-gray-800 ${s.preview}`}>{s.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Brand fonts */}
          {brandFonts.length > 0 && (
            <Section title="Brand fonts">
              <div className="flex flex-col gap-1.5">
                {brandFonts.map((name) => (
                  <FontRow
                    key={name}
                    label={name}
                    family={`'${name}', sans-serif`}
                    onPick={useFont}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Font combinations */}
          <Section title="Font combinations">
            <div className="grid grid-cols-2 gap-2">
              {FONT_COMBINATIONS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => insert.text(c)}
                  className="h-16 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-center px-2 overflow-hidden"
                  style={{ fontFamily: c.fontFamily, fontWeight: c.fontWeight, color: c.fill }}
                  title={`Add "${c.name}"`}
                >
                  <span className="text-base truncate">{c.content}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Fonts */}
          <Section
            title="Fonts"
            hint={selectedText ? "Applies to selected text" : undefined}
          >
            <FontList fonts={fonts} onPick={useFont} activeFamily={selectedText?.fontFamily} />
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        {hint && <span className="text-[10px] text-blue-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function FontList({ fonts, onPick, activeFamily }) {
  if (!fonts.length) {
    return <p className="text-xs text-gray-400 text-center py-6">No fonts found.</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {fonts.map((f) => (
        <FontRow
          key={f.name}
          label={f.name}
          family={f.family}
          active={activeFamily === f.family}
          onPick={onPick}
        />
      ))}
    </div>
  );
}

function FontRow({ label, family, active, onPick }) {
  return (
    <button
      onClick={() => onPick(family)}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
        active ? "border-blue-300 bg-blue-50/50" : "border-transparent hover:bg-gray-50"
      }`}
      title={`Use ${label}`}
    >
      <Type className="w-3.5 h-3.5 text-gray-300 shrink-0" />
      <span className="text-lg text-gray-800 truncate" style={{ fontFamily: family }}>
        {label}
      </span>
    </button>
  );
}
