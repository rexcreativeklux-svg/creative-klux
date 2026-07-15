"use client";

/**
 * Lightbox — a shared, full-screen media viewer for generation history, used by
 * both the Product Studio and Magic Studio history grids (ProductHistoryGrid /
 * MagicHistoryGrid). Given a list of media items and the one to open at, it
 * shows the item large on a dimmed backdrop with prev/next navigation, a
 * counter, a download action and close-on-backdrop / ESC.
 *
 * It's a CONTROLLED component: the parent owns the current index (so the ⋯
 * "Download" and the grid stay in sync) and passes `index` + `onIndexChange`.
 * Render it only while open (i.e. when the parent's index is non-null).
 *
 * Each item is `{ url|src, type?, videoSrc?, thumbnail?, alt? }` — images render
 * as a contained <img>; videos (type "video" or with a `videoSrc`) render as an
 * autoplaying <video> with native controls.
 */

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

/**
 * @param {object} props
 * @param {Array} props.items Viewable media items ({ url|src, type?, ... }).
 * @param {number} props.index Current item index (controlled by the parent).
 * @param {(index: number) => void} props.onIndexChange Move to another index.
 * @param {() => void} props.onClose Close the lightbox.
 * @param {(item: object) => void} [props.onDownload] Download the current item.
 */
export default function Lightbox({
  items = [],
  index = 0,
  onIndexChange,
  onClose,
  onDownload,
}) {
  const count = items.length;
  const current = items[index] || null;

  // Move by a delta, wrapping around the ends (only meaningful with >1 item).
  const step = useCallback(
    (delta) => {
      if (count < 2) return;
      onIndexChange?.((index + delta + count) % count);
    },
    [count, index, onIndexChange],
  );

  // Keyboard: ESC closes, ←/→ navigate. Bound to the live index via `step`.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onClose]);

  if (!current) return null;

  const src = current.url || current.src || current.videoSrc;
  const isVideo = current.type === "video" || !!current.videoSrc;

  return (
    <div
      className="fixed inset-0 z-300 bg-black/90 backdrop-blur-sm flex flex-col"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* ── Top bar: hint (center) + download / close (right) ── */}
      <div className="relative flex items-center justify-end px-4 py-3 shrink-0">
        <span className="absolute left-1/2 -translate-x-1/2 text-sm text-white/60 hidden sm:block pointer-events-none">
          Press ESC or click background to close
        </span>
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {onDownload && (
            <button
              onClick={() => onDownload(current)}
              aria-label="Download"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Download className="w-4.5 h-4.5" />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Media stage ── */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-4 sm:px-16 pb-2">
        {count > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div
          className="max-w-full max-h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo ? (
            <video
              key={src}
              src={src}
              poster={current.thumbnail || undefined}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-[80vh] rounded-lg bg-black"
            />
          ) : (
            <img
              src={src}
              alt={current.alt || "Preview"}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </div>

        {count > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* ── Counter ── */}
      {count > 1 && (
        <div className="shrink-0 text-center text-sm text-white/60 pb-4">
          {index + 1} / {count}
        </div>
      )}
    </div>
  );
}
