"use client";

// "See all" for the landing page's Backgrounds row — the Classic, Studio and
// Essentials rails it merges, each under its own heading. Picking a tile
// closes the browser and opens the preset exactly like a tile on the row.

import { X } from "lucide-react";
import StudioPresetTile from "./StudioPresetTile";

/**
 * @param {object} props
 * @param {object[]} props.sections the STUDIO_SECTIONS entries the row merges
 * @param {Set<string>} props.labelled ids of the sections whose tiles show a label
 * @param {(item: object) => void} props.onPick
 * @param {() => void} props.onClose
 */
export default function BackgroundsBrowserModal({
  sections,
  labelled,
  onPick,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* Full screen on phones; 92% of the window from `lg`, like the tool
          shelves' "See all" (TemplateBrowserModal). */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col overflow-hidden bg-surface shadow-xl w-full h-[100dvh] lg:h-[92dvh] lg:w-[92vw] lg:rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3">
          <h3 className="flex-1 text-sm font-semibold text-gray-900">
            Backgrounds
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {sections.map((section) => (
            <section key={section.id}>
              <h2 className="mb-3 text-sm font-semibold text-gray-900">
                {section.title}
              </h2>
              {/* Wrapped, not a scrolling strip — "See all" shows every tile. */}
              <div className="mb-6 flex flex-wrap gap-3">
                {section.items.map((item) => (
                  <StudioPresetTile
                    key={item.id}
                    preset={{ ...item, mode: section.mode }}
                    showLabel={labelled.has(section.id)}
                    onClick={() => {
                      onClose();
                      onPick(item);
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
