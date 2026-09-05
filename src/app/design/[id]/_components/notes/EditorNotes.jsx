"use client";

import React, { useEffect, useRef } from "react";
import { NotebookPen, X } from "lucide-react";

/**
 * EditorNotes — a scratchpad that belongs to the design.
 *
 * Somewhere to keep the things that are ABOUT a design but must not appear IN
 * it: the client's feedback, the hex code you keep re-deriving, what still needs
 * doing before it ships. Without this the only place to put them is a text
 * element you have to remember to delete before exporting.
 *
 * ── Where it is saved ─────────────────────────────────────────────────────
 *
 * Inside the design's own JSON, alongside the canvas and elements. That column
 * is the only place the editor already has permission to write, so notes save
 * and autosave with everything else and needed no new field or endpoint. It also
 * means the note travels with the design: duplicate it and the note comes too,
 * which is right — the note is about that design, not about the person.
 *
 * NOT saved per-viewer and not encrypted. Anyone who can open the design can
 * read them, so this is a working scratchpad, not a private one.
 *
 * Props: { value, onChange, onClose }
 */
export default function EditorNotes({ value, onChange, onClose }) {
  const areaRef = useRef(null);

  // Focus on open. Opening a notepad is only ever a prelude to typing in it, so
  // making the user click once more is a step with no decision in it.
  useEffect(() => {
    const node = areaRef.current;
    if (!node) return;
    node.focus();
    // Caret at the end rather than the start: notes are appended to far more
    // often than they are rewritten.
    node.setSelectionRange(node.value.length, node.value.length);
  }, []);

  return (
    <div className="absolute bottom-4 left-4 z-[9998] flex w-72 flex-col rounded-2xl border border-gray-200 bg-surface/95 shadow-2xl backdrop-blur">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-gray-100 px-3">
        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
          <NotebookPen className="h-3.5 w-3.5 text-gray-400" />
          Notes
        </span>
        <button
          onClick={onClose}
          title="Close notes"
          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <textarea
        ref={areaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // Stopped here, so the editor's own shortcuts don't fire while typing.
        // The global handler already skips TEXTAREA, but Delete and the arrow
        // nudge are close enough to a real mistake — deleting the selected
        // element mid-sentence — to be worth the belt and braces.
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="Feedback, to-dos, anything that shouldn't end up on the canvas…"
        rows={8}
        className="w-full resize-none rounded-b-2xl bg-transparent px-3 py-2.5 text-xs leading-relaxed text-gray-700 placeholder:text-gray-400 focus:outline-none"
      />

      <p className="shrink-0 border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-400">
        Saved with the design. Visible to anyone who can open it.
      </p>
    </div>
  );
}
