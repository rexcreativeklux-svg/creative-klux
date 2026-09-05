"use client";

import React from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { readTextStyle, takesTextStyle } from "@/(lib)/design/groupStyling";

/**
 * TextStylesTab — the "Text styles" ladder in the Font panel. Each preset
 * applies a size/weight (and sometimes spacing/italic) to the selected text,
 * the way Canva's Text styles do. The row previews the style at a sidebar size
 * and, on hover, shows a spec chip of exactly what it imports.
 */
const TEXT_STYLES = [
  { id: "title", label: "Title", fontSize: 96, fontWeight: "bold", preview: "text-3xl font-extrabold" },
  { id: "subtitle", label: "Subtitle", fontSize: 48, fontWeight: 600, preview: "text-xl font-semibold" },
  { id: "heading-1", label: "Heading 1", fontSize: 72, fontWeight: "bold", preview: "text-2xl font-bold" },
  { id: "heading-2", label: "Heading 2", fontSize: 56, fontWeight: "bold", preview: "text-xl font-bold" },
  { id: "subheading", label: "Subheading", fontSize: 44, fontWeight: 600, preview: "text-lg font-semibold" },
  { id: "overline", label: "OVERLINE", fontSize: 16, fontWeight: 600, letterSpacing: 2, preview: "text-xs font-semibold tracking-widest" },
  { id: "body-lg", label: "Body large", fontSize: 32, fontWeight: "normal", preview: "text-base" },
  { id: "body", label: "Body", fontSize: 26, fontWeight: "normal", preview: "text-sm" },
  { id: "caption", label: "Caption", fontSize: 18, fontWeight: "normal", preview: "text-xs text-gray-500" },
  { id: "quote", label: "Quote", fontSize: 36, fontWeight: "normal", fontStyle: "italic", preview: "text-lg italic" },
];

const isBold = (w) => w === "bold" || Number(w) >= 600;

// Human label for a weight value.
const weightLabel = (w) => {
  if (w === "bold") return "Bold";
  const n = Number(w);
  if (n >= 700) return "Bold";
  if (n >= 600) return "Semibold";
  if (n >= 500) return "Medium";
  return "Regular";
};

// "96px · Bold · +2 spacing · Italic" — exactly what the preset imports.
const specOf = (s) =>
  [
    `${s.fontSize}px`,
    weightLabel(s.fontWeight),
    s.letterSpacing ? `+${s.letterSpacing} spacing` : null,
    s.fontStyle === "italic" ? "Italic" : null,
  ]
    .filter(Boolean)
    .join(" · ");

export default function TextStylesTab({ editor }) {
  const el = editor?.selectedElement;

  const apply = (s) => {
    if (!takesTextStyle(el)) {
      toast.info("Select a text layer to apply a style.");
      return;
    }
    editor.updateElement(
      el.id,
      {
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        letterSpacing: s.letterSpacing || 0,
        fontStyle: s.fontStyle || "normal",
      },
      { record: true },
    );
  };

  // A style is "active" when size + bold-ness both match the selection — read
  // through the group where there is one, so a group of headings shows the same
  // row highlighted that one of those headings would.
  const activeId = takesTextStyle(el)
    ? TEXT_STYLES.find(
        (s) =>
          s.fontSize === readTextStyle(el, "fontSize") &&
          isBold(s.fontWeight) === isBold(readTextStyle(el, "fontWeight")),
      )?.id
    : null;

  return (
    <div className="flex flex-col gap-2 p-3">
      {TEXT_STYLES.map((s) => (
        <button
          key={s.id}
          onClick={() => apply(s)}
          title={specOf(s)}
          className={`group w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
            activeId === s.id
              ? "border-blue-300 bg-blue-50/50"
              : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"
          }`}
        >
          <span className={`text-gray-800 truncate ${s.preview}`}>
            {s.label}
          </span>

          {/* Spec chip — what this style imports, revealed on hover */}
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {specOf(s)}
            </span>
            {activeId === s.id && (
              <Check className="w-4 h-4 text-blue-500 shrink-0" />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
