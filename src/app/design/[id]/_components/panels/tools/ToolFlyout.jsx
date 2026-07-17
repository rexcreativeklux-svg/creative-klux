"use client";

import React from "react";
import { X, ArrowLeft } from "lucide-react";

/**
 * ToolFlyout — the panel that opens beside the Tools rail (Lines, Shapes,
 * Signature). Positioned to escape the rail rightward; the body scrolls and
 * owns its own padding. An optional back arrow appears when `onBack` is given,
 * for flyouts with an inner drill-in (Signature → Create).
 *
 * Props: { title, width?, onClose, onBack?, children }
 */
export default function ToolFlyout({ title, width = "w-64", onClose, onBack, children }) {
  return (
    <div
      className={`absolute left-full top-1/2 -translate-y-1/2 ml-2 ${width} max-h-[74vh] rounded-2xl bg-surface shadow-2xl border border-gray-100 z-50 flex flex-col`}
    >
      <header className="h-11 shrink-0 flex items-center gap-1 px-3 border-b border-gray-100">
        {onBack && (
          <button
            onClick={onBack}
            title="Back"
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer transition -ml-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <p className="flex-1 text-sm font-bold text-gray-800 truncate">{title}</p>
        <button
          onClick={onClose}
          title="Close"
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
        >
          <X className="w-4 h-4" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
