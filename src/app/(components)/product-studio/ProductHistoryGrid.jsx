"use client";

/**
 * ProductHistoryGrid — renders a Product Studio tool's generation history in the
 * modal's right-content area (Virtual Model, Product Staging, Ghost Mannequin).
 * It replaces the old session-only results list: items come from
 * {@link useProductHistory} (newest first) and every generation refreshes them.
 *
 * Each item gets the shared ⋯ {@link ResultActionsMenu}. Download / Copy link /
 * Save to gallery are handled here with the shared saveToGallery helpers so the
 * modals don't re-implement them; Delete + the optional regenerate actions are
 * passed in by the modal (they need modal state / the history refresh).
 */

import { useState } from "react";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import ResultActionsMenu, { buildResultActions } from "./ResultActionsMenu";
import { saveUrlToGallery, downloadImageUrl } from "./saveToGallery";
import Lightbox from "@/app/(components)/Lightbox";

/**
 * @param {object} props
 * @param {Array} props.items History items ({ id, url, ... }) from useProductHistory.
 * @param {boolean} props.loading Whether the initial history fetch is in flight.
 * @param {boolean} [props.generating] Show a leading "generating" tile.
 * @param {string} [props.generatingLabel] Copy under the generating spinner.
 * @param {(id: string|number) => void} props.onDelete Delete an item (modal refreshes history).
 * @param {(string|number|null)} [props.removingId] Item currently being deleted.
 * @param {(file: File) => Promise<unknown>} props.uploadMedia Auth uploader (for Save to gallery).
 * @param {string} props.filePrefix File-name prefix for downloads / saves.
 * @param {string} [props.aspectClass="aspect-square"] Tile aspect ratio class.
 * @param {() => void} [props.onChangeSomething] Optional "Change something" action.
 * @param {() => void} [props.onOtherAngles] Optional "Other angles" action.
 * @param {(url: string) => void} [props.onGenerateVideo] Optional "Generate video" action.
 */
export default function ProductHistoryGrid({
  items,
  loading,
  generating = false,
  generatingLabel = "Generating your image…",
  onDelete,
  removingId = null,
  uploadMedia,
  filePrefix = "klux",
  aspectClass = "aspect-square",
  onChangeSomething,
  onOtherAngles,
  onGenerateVideo,
}) {
  const [imageMenu, setImageMenu] = useState(null); // { id, url, x, y }
  const [lightboxIndex, setLightboxIndex] = useState(null); // index into items

  const handleDownload = async (url) => {
    const t = toast.loading("Downloading…");
    try {
      await downloadImageUrl(url, { filePrefix });
      toast.success("Downloaded", { id: t });
    } catch (err) {
      console.error(`❌ [${filePrefix}] history download failed:`, err);
      toast.error(err?.message || "Couldn't download the image", { id: t });
    }
  };

  const handleSaveToGallery = async (url) => {
    const t = toast.loading("Saving to gallery…");
    try {
      await saveUrlToGallery(url, uploadMedia, { filePrefix });
      toast.success("Saved to gallery", { id: t });
    } catch (err) {
      console.error(`❌ [${filePrefix}] history save to gallery failed:`, err);
      toast.error(err?.message || "Couldn't save to gallery", { id: t });
    }
  };

  // Initial load with nothing yet — a light spinner instead of flashing an
  // empty grid (the modal only mounts this once it's decided to show history).
  if (loading && items.length === 0 && !generating) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">History</h3>
        <p className="text-xs text-gray-500">
          Automatically deleted in 30 days
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* Leading generating tile — keeps the in-flight generation visible. */}
        {generating && (
          <div
            className={`relative rounded-xl overflow-hidden ${aspectClass} bg-gray-100 flex flex-col items-center justify-center gap-2 text-center px-2`}
          >
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            <span className="text-[11px] text-gray-500 leading-tight">
              {generatingLabel}
            </span>
          </div>
        )}

        {items.map((item, i) => {
          const isRemoving = removingId != null && item.id === removingId;
          return (
            <button
              key={item.id ?? item.url}
              onClick={() => setLightboxIndex(i)}
              className={`relative rounded-xl overflow-hidden group ${aspectClass} bg-gray-100 cursor-pointer text-left`}
            >
              <img
                src={item.url}
                alt="generation"
                className="w-full h-full object-cover"
              />
              {isRemoving && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageMenu((p) =>
                    p?.item?.id === item.id
                      ? null
                      : { item, x: e.clientX, y: e.clientY },
                  );
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-surface/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </span>
            </button>
          );
        })}
      </div>

      {imageMenu && (
        <ResultActionsMenu
          x={imageMenu.x}
          y={imageMenu.y}
          onClose={() => setImageMenu(null)}
          actions={buildResultActions({
            onChangeSomething,
            // "Other angles" regenerates from THIS result: the modal reuses the
            // item's own output image + the model it was generated with (carried
            // in the history record), so the whole item is handed over.
            onOtherAngles: onOtherAngles
              ? () => onOtherAngles(imageMenu.item)
              : undefined,
            onGenerateVideo: onGenerateVideo
              ? () => onGenerateVideo(imageMenu.item.url)
              : undefined,
            onDownload: () => handleDownload(imageMenu.item.url),
            onCopyLink: () => {
              navigator.clipboard.writeText(imageMenu.item.url);
              toast.success("Link copied!");
            },
            onSaveToGallery: () => handleSaveToGallery(imageMenu.item.url),
            onDelete: () => onDelete?.(imageMenu.item.id),
          })}
        />
      )}

      {lightboxIndex != null && items[lightboxIndex] && (
        <Lightbox
          items={items}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDownload={(item) => handleDownload(item.url)}
        />
      )}
    </div>
  );
}
