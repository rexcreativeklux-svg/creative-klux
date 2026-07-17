"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import FontList from "./FontList";

/**
 * FontDropdown — collapsed, this is a single row showing the current font in its
 * own face; open, it expands a scrollable list in place. It expands inline
 * rather than floating: the sidebar panel is itself a scroll container, so an
 * absolutely-positioned menu would clip at its edge.
 *
 * Props: { fonts, onPick, activeFamily?, activeLabel? }
 */
export default function FontDropdown({ fonts, onPick, activeFamily, activeLabel }) {
  const [open, setOpen] = useState(false);

  // Pick and close — leaving it open would push the combinations back down.
  const pick = (family) => {
    onPick(family);
    setOpen(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition"
      >
        <span
          className="text-base text-gray-800 truncate"
          style={{ fontFamily: activeFamily }}
        >
          {activeLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="max-h-72 overflow-y-auto border-t border-gray-100 p-1">
          <FontList fonts={fonts} onPick={pick} activeFamily={activeFamily} />
        </div>
      )}
    </div>
  );
}
