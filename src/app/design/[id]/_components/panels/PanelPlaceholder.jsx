"use client";

import React from "react";

/**
 * Shared "not built yet" placeholder for sidebar panels that are scaffolded but
 * awaiting their real contents. Each scaffold panel renders one of these so the
 * tab exists and is inspectable; swap the body out as each panel is specced.
 */
export default function PanelPlaceholder({ icon: Icon, title, note }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">{note}</p>
    </div>
  );
}
