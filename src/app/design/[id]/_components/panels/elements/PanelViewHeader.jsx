"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

/**
 * PanelViewHeader — the header for a drilled-in panel view: a back arrow, an
 * optional gradient chip (categories carry one, sub-groups don't) and the title.
 *
 * Props: { title, chip?: { icon, gradient }, onBack }
 */
export default function PanelViewHeader({ title, chip, onBack }) {
  const Icon = chip?.icon;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onBack}
        title="Back"
        aria-label="Back"
        className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer transition"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      {Icon && (
        <span
          className={`w-6 h-6 shrink-0 rounded-md bg-gradient-to-br ${chip.gradient} flex items-center justify-center text-white`}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
        </span>
      )}
      <h3 className="text-sm font-semibold text-gray-800 truncate">{title}</h3>
    </div>
  );
}
