"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

/**
 * BrandNavItem — one row in the Brand Kit sub-nav. Shows a count when the
 * section has anything in it, so an empty section reads as empty before you
 * open it.
 *
 * Props: { section: {label, icon}, count?, active?, onClick }
 */
export default function BrandNavItem({ section, count, active, onClick }) {
  const { label, icon: Icon } = section;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition ${
        active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`} />
      <span className="flex-1 min-w-0 text-left text-sm font-medium truncate">
        {label}
      </span>
      {count > 0 && (
        <span className="text-[10px] font-semibold text-gray-400 shrink-0">
          {count}
        </span>
      )}
      <ChevronRight
        className={`w-3.5 h-3.5 shrink-0 ${active ? "text-blue-400" : "text-gray-300"}`}
      />
    </button>
  );
}
