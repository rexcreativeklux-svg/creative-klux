"use client";

import React from "react";

/**
 * BrandEmptyState — shared "nothing here yet" block for the brand sections.
 * Every section can be empty (a brand may have no logo, no colours, no fonts),
 * so this is the common case, not an edge case.
 *
 * Props: { icon, title, note }
 */
export default function BrandEmptyState({ icon: Icon, title, note }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 px-2 text-center">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <p className="text-xs font-semibold text-gray-700">{title}</p>
      <p className="text-[11px] text-gray-400 leading-relaxed max-w-[220px]">{note}</p>
    </div>
  );
}
