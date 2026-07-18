"use client";

import React from "react";
import { KLUX_ACTIONS } from "./kluxActions";

/**
 * KluxSuggestions — the quick-action chips under the empty-state heading. Each
 * fires its seeded prompt through the same send() the composer uses.
 */
export default function KluxSuggestions({ onPick }) {
  return (
    <div className="flex flex-col gap-2.5">
      {KLUX_ACTIONS.map(({ id, label, icon: Icon, prompt }) => (
        <button
          key={id}
          onClick={() => onPick(prompt)}
          className="group flex items-center gap-3 rounded-full border border-gray-200 bg-surface px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#155dfc] hover:bg-blue-50/50 hover:text-gray-900 cursor-pointer"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#155dfc] text-white">
            <Icon className="h-3.5 w-3.5" />
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}
