"use client";

import React from "react";
import { Check, Type } from "lucide-react";

/**
 * FontRow — one pickable font, previewed in its own face.
 *
 * Props: { label, family, active?, onPick: (family) => void }
 */
export default function FontRow({ label, family, active, onPick }) {
  return (
    <button
      onClick={() => onPick(family)}
      title={`Use ${label}`}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
        active ? "border-blue-300 bg-blue-50/50" : "border-transparent hover:bg-gray-50"
      }`}
    >
      {active ? (
        <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
      ) : (
        <Type className="w-3.5 h-3.5 text-gray-300 shrink-0" />
      )}
      <span
        className="text-lg text-gray-800 truncate"
        style={{ fontFamily: family }}
      >
        {label}
      </span>
    </button>
  );
}
