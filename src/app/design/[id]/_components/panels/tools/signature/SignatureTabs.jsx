"use client";

import React from "react";

export const SIGNATURE_TABS = [
  { id: "text", label: "Text" },
  { id: "draw", label: "Draw" },
  { id: "upload", label: "Upload" },
];

/**
 * SignatureTabs — Text · Draw · Upload underline tabs.
 *
 * Props: { active, onChange }
 */
export default function SignatureTabs({ active, onChange }) {
  return (
    <div className="flex gap-5 border-b border-gray-100">
      {SIGNATURE_TABS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`pb-2 -mb-px border-b-2 text-sm font-medium transition-colors cursor-pointer ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
