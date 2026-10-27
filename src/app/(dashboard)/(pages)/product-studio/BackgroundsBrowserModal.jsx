"use client";

// "See all" for the landing page's Backgrounds row — every preset rail
// (Classic, Studio, Essentials, Photo Editing Classics, Trending, …) as tabs
// over one grid, laid out like the tool shelves' "See all"
// (TemplateBrowserModal). Picking a tile closes the browser and opens the
// preset exactly like a tile on the row.

import { useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import StudioPresetTile from "./StudioPresetTile";

const ALL = "All";

/**
 * @param {object} props
 * @param {object[]} props.sections the STUDIO_SECTIONS entries to list
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
  const [active, setActive] = useState(ALL);
  const shown = active === ALL ? sections : sections.filter((s) => s.id === active);

  // The tiles draw at a fixed pixel size, so measure one grid column and hand
  // that width down; they then fill their cells at every breakpoint.
  const gridRef = useRef(null);
  const [colWidth, setColWidth] = useState(0);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const first = parseFloat(getComputedStyle(grid).gridTemplateColumns);
      if (first > 0) setColWidth(Math.floor(first));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col overflow-hidden bg-surface shadow-2xl w-full h-[100dvh] lg:h-[92dvh] lg:w-[92vw] lg:rounded-2xl"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">All presets</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-gray-900 text-surface flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section tabs. `text-surface`, not `text-white`, on the active pill —
            see TemplateBrowserModal for why. */}
        <div className="flex items-center gap-2 px-6 pt-2 pb-4 overflow-x-auto hide-scrollbar">
          {[{ id: ALL, title: ALL }, ...sections].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                active === s.id
                  ? "bg-gray-900 text-surface"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 px-6 pt-1 pb-[calc(1.5rem+var(--ck-safe-b))] lg:pb-6 overflow-y-auto">
          <div
            ref={gridRef}
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 items-start"
          >
            {colWidth > 0 &&
              shown.flatMap((section) =>
                section.items.map((item) => (
                  <StudioPresetTile
                    key={item.id}
                    preset={{ ...item, mode: section.mode }}
                    showLabel={labelled.has(section.id)}
                    width={colWidth}
                    onClick={() => {
                      onClose();
                      onPick(item);
                    }}
                  />
                )),
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
