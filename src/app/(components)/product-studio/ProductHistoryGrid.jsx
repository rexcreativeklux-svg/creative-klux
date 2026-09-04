"use client";

/**
 * ProductHistoryGrid — renders a Product Studio tool's generation history in the
 * modal's right-content area (Virtual Model, Product Staging, Ghost Mannequin,
 * the prompt tools and Product Video). It replaces the old session-only results
 * list: items come from {@link useProductHistory} (newest first) and every
 * generation refreshes them.
 *
 * ⚠️ IT RENDERS BY MEDIA TYPE, because one of these tools makes motion. A tile
 * draws a `<video>` when its item is `type: "video"` (Product Video) and an
 * `<img>` otherwise — reading an .mp4 into an `<img>` is a broken tile, not a
 * result. The type comes off the normalizer (see product-studio-api's
 * normalizeHistoryItem); the still tools never set it and are unaffected.
 *
 * Each item gets the shared ⋯ {@link ResultActionsMenu}, built for what its own
 * type supports — a video has no "Other angles" and no Save to gallery (that
 * uploads into the image library). Download / Copy link / Save to gallery are
 * handled here with the shared saveToGallery helpers so the modals don't
 * re-implement them; Delete + the optional regenerate actions are passed in by
 * the modal (they need modal state / the history refresh).
 */

import { useState } from "react";
import { Loader2, MoreHorizontal, Play } from "lucide-react";
import { toast } from "sonner";
import ResultActionsMenu, { buildResultActions } from "./ResultActionsMenu";
import { saveUrlToGallery, downloadImageUrl } from "./saveToGallery";
import Lightbox from "@/app/(components)/Lightbox";

/**
 * Pull a file extension off a hosted URL (ignoring any query/hash), falling back
 * to a type-appropriate default when the URL has none — so a video downloads as
 * .mp4 instead of the image helper's .png default.
 *
 * @param {string} url
 * @param {string} fallback
 * @returns {string}
 */
function extFromUrl(url, fallback) {
  const clean = String(url || "")
    .split("?")[0]
    .split("#")[0];
  const m = clean.match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : fallback;
}

/** Does this history item render as a video? */
const isVideoItem = (item) => item?.type === "video" || !!item?.videoSrc;

/**
 * @param {object} props
 * @param {Array} props.items History items ({ id, url, type, ... }) from useProductHistory.
 * @param {boolean} props.loading Whether the initial history fetch is in flight.
 * @param {boolean} [props.generating] Show a leading "generating" tile.
 * @param {string} [props.generatingLabel] Copy under the generating spinner.
 * @param {(id: string|number) => void} props.onDelete Delete an item (modal refreshes history).
 * @param {(string|number|null)} [props.removingId] Item currently being deleted.
 * @param {(file: File) => Promise<unknown>} props.uploadMedia Auth uploader (for Save to gallery).
 * @param {string} props.filePrefix File-name prefix for downloads / saves.
 * @param {string} [props.aspectClass="aspect-square"] Tile aspect ratio for IMAGE
 *   items and the generating tile; video tiles are always 16:9.
 * @param {string} [props.gridClass="grid-fluid-[150px]"] Column sizing — video
 *   results need wider tiles than stills to stay watchable.
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
  gridClass = "grid-fluid-[150px]",
  onChangeSomething,
  onOtherAngles,
  onGenerateVideo,
}) {
  const [imageMenu, setImageMenu] = useState(null); // { item, x, y }
  const [lightboxIndex, setLightboxIndex] = useState(null); // index into items

  const handleDownload = async (item) => {
    const t = toast.loading("Downloading…");
    try {
      const ext = extFromUrl(item.url, isVideoItem(item) ? "mp4" : "png");
      await downloadImageUrl(item.url, { filePrefix, ext });
      toast.success("Downloaded", { id: t });
    } catch (err) {
      console.error(`❌ [${filePrefix}] history download failed:`, err);
      toast.error(err?.message || "Couldn't download that result", { id: t });
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
    <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">History</h3>
        <p className="text-xs text-gray-500">
          Automatically deleted in 30 days
        </p>
      </div>

      {/* Container-driven: this grid renders both full-width and inside the
          narrowed pane beside an open sidebar, so a fixed `grid-cols-4` was
          right in neither. 150px is the floor at which a product thumbnail is
          still identifiable. */}
      <div className={`grid ${gridClass} gap-3`}>
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
          const isVideo = isVideoItem(item);
          return (
            <button
              key={item.id ?? item.url}
              onClick={() => setLightboxIndex(i)}
              className={`relative rounded-xl overflow-hidden group ${isVideo ? "aspect-video bg-black" : `${aspectClass} bg-gray-100`} cursor-pointer text-left`}
            >
              {isVideo ? (
                <>
                  {/* Muted, metadata-only: the grid shows the clip's first
                      frame, and it PLAYS in the lightbox. Autoplaying a wall of
                      videos behind a modal is neither watchable nor cheap. */}
                  <video
                    src={item.videoSrc || item.url}
                    poster={item.thumbnail || undefined}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-11 h-11 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </span>
                  </span>
                </>
              ) : (
                <img
                  src={item.url}
                  alt="generation"
                  className="w-full h-full object-cover"
                />
              )}
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
                // Always visible below `lg`: there is no hover on a phone, so
                // hiding it there put Download / Save / Delete out of reach.
                className="absolute top-2 right-2 w-8 h-8 bg-surface/90 rounded-full flex items-center justify-center shadow opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"
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
            // ── Still-only actions ──
            // A clip has no "other angle" to re-render and can't be handed to
            // the video tool as a source frame, and Save to gallery uploads into
            // the IMAGE library — offering any of them on a video would be three
            // menu entries that quietly do the wrong thing.
            onChangeSomething: isVideoItem(imageMenu.item)
              ? undefined
              : onChangeSomething,
            // "Other angles" regenerates from THIS result: the modal reuses the
            // item's own output image + the model it was generated with (carried
            // in the history record), so the whole item is handed over.
            onOtherAngles:
              onOtherAngles && !isVideoItem(imageMenu.item)
                ? () => onOtherAngles(imageMenu.item)
                : undefined,
            onGenerateVideo:
              onGenerateVideo && !isVideoItem(imageMenu.item)
                ? () => onGenerateVideo(imageMenu.item.url)
                : undefined,
            onSaveToGallery: isVideoItem(imageMenu.item)
              ? undefined
              : () => handleSaveToGallery(imageMenu.item.url),
            // ── Shared by both media types ──
            onDownload: () => handleDownload(imageMenu.item),
            onCopyLink: () => {
              navigator.clipboard.writeText(imageMenu.item.url);
              toast.success("Link copied!");
            },
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
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
