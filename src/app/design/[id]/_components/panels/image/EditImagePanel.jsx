"use client";

import React from "react";
import { X } from "lucide-react";
import ImageQuickTools from "./ImageQuickTools";
import AdjustSection from "./AdjustSection";
import FilterSection from "./FilterSection";
import ShadowsSection from "./ShadowsSection";
import PerspectiveSection from "./PerspectiveSection";

/**
 * EditImagePanel — the "Edit image" side panel opened from the image toolbar.
 * Design-editor style: a Quick tools grid on top, then Adjust / Filters /
 * Shadows, each a colocated section (preset strip + "See more"). Everything
 * writes to the selected image element and resolves to a CSS filter string (see
 * imageAdjust.js) that renders live and bakes into the PNG export.
 *
 * Props: { editor, imageActions, onClose }
 */
export default function EditImagePanel({ editor, imageActions, onClose }) {
  const el = editor?.selectedElement;
  const isImage = el && el.type === "image";

  return (
    <section className="w-full h-[55dvh] shrink-0 bg-surface border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col lg:w-75 lg:h-auto lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r">
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800">Edit image</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {!isImage ? (
        <p className="px-4 py-6 text-xs text-gray-400">Select an image to edit it.</p>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
          {/* Quick tools — one-tap image actions, first in the panel. */}
          <ImageQuickTools imageActions={imageActions} elementId={el.id} />

          <AdjustSection editor={editor} />
          <FilterSection editor={editor} />
          <ShadowsSection editor={editor} />
          <PerspectiveSection editor={editor} />
        </div>
      )}
    </section>
  );
}
