"use client";

import React, { useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import ImageQuickTools from "./ImageQuickTools";
import AdjustSection from "./AdjustSection";
import FilterSection from "./FilterSection";
import ShadowsSection from "./ShadowsSection";
import PerspectiveSection from "./PerspectiveSection";
import EnhanceSection from "./EnhanceSection";
import MagicGrabSection from "./MagicGrabSection";
import AutoSelectSection from "./AutoSelectSection";
import GrabTextSection from "./GrabTextSection";
import BgSceneSection from "./BgSceneSection";
import SketchifySection from "./SketchifySection";
import FaceCutoutSection from "./FaceCutoutSection";
import TextureSection from "./TextureSection";

/**
 * EditImagePanel — the "Edit image" side panel opened from the image toolbar.
 * Design-editor style: a Quick tools grid on top, then Adjust / Filters /
 * Shadows, each a colocated section (preset strip + "See more"). Everything
 * writes to the selected image element and resolves to a CSS filter string (see
 * imageAdjust.js) that renders live and bakes into the PNG export.
 *
 * A handful of Quick tools tiles need more room than one tap — a model that
 * shows a preview, a status strip or a result to accept — so this also owns a
 * small drill-in: `toolView` swaps the whole stack for one full-column section
 * with a back arrow, the same shape design-editor uses for its own tool panel.
 *
 * Props: { editor, imageActions, onClose }
 */

// Tools that drill in rather than opening inline.
const TOOL_VIEWS = {
  enhance: { title: "Enhance", Component: EnhanceSection },
  magicGrab: { title: "Magic grab", Component: MagicGrabSection },
  autoSelect: { title: "Auto-select", Component: AutoSelectSection },
  grabText: { title: "Grab text", Component: GrabTextSection },
  bgScene: { title: "Bg scene", Component: BgSceneSection },
  sketchify: { title: "Sketchify", Component: SketchifySection },
  faceCutout: { title: "Face cutout", Component: FaceCutoutSection },
  texture: { title: "Texture", Component: TextureSection },
};

export default function EditImagePanel({ editor, imageActions, onClose }) {
  const el = editor?.selectedElement;
  const isImage = el && el.type === "image";
  const [toolViewId, setToolViewId] = useState(null);

  // Deselecting the image (or selecting a different element) drops any open
  // tool view — its `element` prop would otherwise silently keep pointing at a
  // photo that's no longer selected. Reset during render (React's own pattern
  // for state that tracks a prop), not in an effect: an effect would let one
  // extra frame render with the old view pointed at the new element first.
  const selectionKey = isImage ? el.id : null;
  const [seenKey, setSeenKey] = useState(selectionKey);
  if (seenKey !== selectionKey) {
    setSeenKey(selectionKey);
    if (toolViewId) setToolViewId(null);
  }

  const view = toolViewId && TOOL_VIEWS[toolViewId];
  const title = view ? view.title : "Edit image";

  return (
    <section className="w-full h-[55dvh] shrink-0 bg-surface border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col lg:w-75 lg:h-auto lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r">
      <header className="h-12 shrink-0 flex items-center gap-1 px-2 border-b border-gray-100">
        {view && (
          <button
            onClick={() => setToolViewId(null)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <h2 className="flex-1 text-sm font-bold text-gray-800 px-2">{title}</h2>
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
      ) : view ? (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <view.Component element={el} editor={editor} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
          {/* Quick tools — one-tap image actions, first in the panel. */}
          <ImageQuickTools
            element={el}
            patch={(p) => editor.updateElement(el.id, p, { record: true })}
            imageActions={imageActions}
            onOpenTool={setToolViewId}
          />

          <AdjustSection editor={editor} />
          <FilterSection editor={editor} />
          <ShadowsSection editor={editor} />
          <PerspectiveSection editor={editor} />
        </div>
      )}
    </section>
  );
}
