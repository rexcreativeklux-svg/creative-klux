"use client";

import React from "react";

// "section" = a top-level heading (Browse categories). "sub" = a group label
// inside a library (LINES, FONTS, FONT COMBINATIONS, …).
const TITLE_STYLES = {
  section: "text-sm font-semibold text-gray-800",
  sub: "text-[11px] font-semibold text-gray-400 uppercase tracking-wider",
};

/**
 * PanelSectionHeader — a heading with an optional right-hand slot: either an
 * action ("See all" / "Show less") or a passive hint ("Applies to selected
 * text"). Shared by every sidebar panel so heading weight and spacing can't
 * drift between them.
 *
 * Props: { title, variant?: "section" | "sub", action?, onAction?, hint? }
 */
export default function PanelSectionHeader({
  title,
  variant = "section",
  action,
  onAction,
  hint,
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className={TITLE_STYLES[variant] || TITLE_STYLES.section}>{title}</h3>
      {action ? (
        <button
          onClick={onAction}
          className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
        >
          {action}
        </button>
      ) : (
        hint && <span className="text-[10px] text-blue-500 shrink-0">{hint}</span>
      )}
    </div>
  );
}
