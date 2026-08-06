"use client";

import React from "react";
import { MAGIC_TABS } from "./constants";

/**
 * MagicTabs — the tool switcher, styled as an underline tab row like Canva's
 * Magic Media header. More tabs than the 300px column fits, so the row scrolls
 * sideways (bar hidden) rather than wrapping or squashing the labels.
 */
export default function MagicTabs({ value, onChange }) {
  return (
    <div className="flex items-center gap-4 border-b border-gray-100 overflow-x-auto hide-scrollbar">
      {MAGIC_TABS.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative -mb-px shrink-0 pb-2 text-sm font-medium transition cursor-pointer ${
              on ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
            {on && (
              <span className="absolute left-0 -bottom-px h-0.5 w-full rounded-full bg-blue-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}
