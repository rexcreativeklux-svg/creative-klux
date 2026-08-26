"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Skeleton from "@/app/(components)/skeletons/Skeleton";
import TemplateTile from "./TemplateTile";
import useTemplates from "./useTemplates";
import { TEMPLATE_CATEGORIES } from "./videoTemplates";

// One full screenful of the widest grid, so the shimmer covers what the results
// will actually occupy.
const SKELETONS = 24;

/**
 * The "See all" template browser — category tabs over a grid of Pexels CLIPS.
 *
 * PLAYBACK. A grid this dense would stutter if every tile decoded at once, so
 * TemplateTile only plays what is actually on screen: tiles below the fold
 * never fetch a byte, and ones you scroll past pause. That's what makes a
 * scrolling wall of video affordable here.
 *
 * Picking hands the template back and closes; the caller pins it into the row
 * so the choice is visible where it was made.
 *
 * Mounted only while open, so the hook fetches on open and the category tabs
 * reset each time.
 *
 * @param {object} props
 * @param {string} props.selectedId       Currently selected template id.
 * @param {(template: object) => void} props.onSelect
 * @param {() => void} props.onClose
 */
export default function TemplateBrowserModal({
  selectedId,
  onSelect,
  onClose,
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  // No perPage — the default is what the row uses too, so they share one cache
  // entry instead of each blending "All" separately.
  const { items, loading, error, retry } = useTemplates({
    kind: "videos",
    category: activeCategory,
  });

  return (
    <div
      className="fixed inset-0 z-215 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      {/* Same footprint as the Video Generator shell it opens from — the browser
          reads as that panel expanding rather than as a second, smaller dialog,
          and the extra width goes straight into tile size. */}
      <div
        className="bg-surface shadow-2xl flex flex-col overflow-hidden w-full h-[100dvh] lg:h-[92dvh] lg:w-[95vw] lg:max-w-[1400px] lg:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Template</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 px-6 pt-2 pb-4 overflow-x-auto hide-scrollbar">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 min-h-0 px-6 pt-1 pb-[calc(1.5rem+var(--ck-safe-b))] lg:pb-6 overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {loading
              ? Array.from({ length: SKELETONS }).map((_, i) => (
                  <Skeleton
                    key={i}
                    tone="soft"
                    shimmer
                    className="aspect-3/4 w-full rounded-xl"
                  />
                ))
              : items.map((t) => (
                  <TemplateTile
                    key={t.id}
                    template={t}
                    selected={selectedId === t.id}
                    onSelect={(tpl) => {
                      onSelect(tpl);
                      onClose();
                    }}
                    className="aspect-3/4 w-full"
                  />
                ))}
          </div>

          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16">
              <p className="text-sm text-gray-500 text-center max-w-sm">
                {error || `No ${activeCategory.toLowerCase()} templates right now.`}
              </p>
              {error && (
                <button
                  onClick={retry}
                  className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
