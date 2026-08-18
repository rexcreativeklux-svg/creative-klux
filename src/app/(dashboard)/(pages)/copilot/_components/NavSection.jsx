"use client";

/**
 * NavSection — a collapsible block in the primary sidebar: a muted header row
 * with a disclosure chevron, and a body underneath.
 *
 * Favorites, Recents and Copilot ideas all use it, so the rule separating them,
 * the header's type and the chevron's rotation are decided once. It sits in its
 * own file rather than inside CopilotNavSections because the ideas block is on
 * the OTHER sidebar tab and cannot import it from there without dragging the
 * whole copilot catalog along with it.
 *
 * ⚠️ Expanded rail only. Collapsed, the rail is a 60px strip of icons with no
 * room for a section label — callers are responsible for not rendering there.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {boolean} props.open
 * @param {() => void} props.onToggle
 * @param {React.ReactNode} props.children  Shown only while open.
 */

import { ChevronDown } from "lucide-react";

export default function NavSection({ label, open, onToggle, children }) {
  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <span className="flex-1 text-left truncate">{label}</span>
        {/* Rotated rather than swapped for a ChevronRight, so the arrow turns
            through the transition instead of popping to a different glyph. */}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && children}
    </div>
  );
}
