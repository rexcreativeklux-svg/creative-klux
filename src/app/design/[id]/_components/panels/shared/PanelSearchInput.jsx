"use client";

import React from "react";
import { Search, X } from "lucide-react";

/**
 * PanelSearchInput — controlled search box with a clear button, sized for the
 * sidebar panels.
 *
 * Props: { value, onChange: (string) => void, placeholder }
 */
export default function PanelSearchInput({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 focus-within:border-blue-400 bg-surface">
      <Search className="w-4 h-4 text-gray-400 shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-400"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          title="Clear"
          className="text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
