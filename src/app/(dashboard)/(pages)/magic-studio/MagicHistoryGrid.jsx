"use client";

/**
 * MagicHistoryGrid — renders a Magic Studio BACKEND tool's generation history in
 * the modal's right canvas, in place of a session-only results list. It mirrors
 * the Product Studio `ProductHistoryGrid`, but Magic Studio tools produce
 * different media types, so each item renders by its own inferred `type`
 * (image / video / persona-text) — see normalizeMagicHistoryItem in
 * src/(lib)/magic-studio-api.js.
 *
 * Items come from {@link useMagicHistory} (newest first) and every generation
 * refreshes them. Each item gets the shared ⋯ {@link ResultActionsMenu}:
 * Download / Copy link / Save to gallery are handled here with the shared
 * saveToGallery helpers; Delete + the optional "Generate video" action are
 * passed in by the modal (they need modal state / the history refresh).
 *
 * On-device tools (audio_to_text, text_to_audio) never persist history, so the
 * modal keeps its session-result canvas for those and doesn't mount this grid.
 */

import { useState } from "react";
import { Loader2, MoreHorizontal, Play, Check } from "lucide-react";
import { toast } from "sonner";
import MasonryGrid from "@/app/(components)/gallery/MasonryGrid";
import ResultActionsMenu, {
  buildResultActions,
} from "@/app/(components)/product-studio/ResultActionsMenu";
import {
  galleryFileMeta,
  saveUrlToGallery,
  downloadImageUrl,
} from "@/app/(components)/product-studio/saveToGallery";
import Lightbox from "@/app/(components)/Lightbox";
import PublishModal from "@/app/(components)/PublishModal";

// Width of ResultActionsMenu (its w-52). Used to right-align the menu under the
// ⋯ trigger so it opens INSIDE the tile instead of spilling past its right edge.
const MENU_WIDTH = 208;

// Pull a file extension off a hosted URL (ignoring any query/hash), falling back
// to a type-appropriate default when the URL has none — so a video downloads as
// .mp4 and saves with the right MIME instead of the image helper's .png default.
function extFromUrl(url, fallback) {
  const clean = String(url || "")
    .split("?")[0]
    .split("#")[0];
  const m = clean.match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : fallback;
}

// Stands in for the in-flight generation as the masonry's first item.
const GENERATING_ITEM = { id: "__generating", type: "generating" };

// The picker's selection mark, the same as My Library's (see MediaCard): an empty
// circle on hover that says the tile can be picked, a filled check and ring once
// it has been.
function SelectionMark({ selected }) {
  return (
    <>
      {selected && (
        <span className="absolute inset-0 z-10 rounded-2xl ring-2 ring-inset ring-blue-600 pointer-events-none" />
      )}
      <span
        className={`absolute top-2 left-2 z-20 flex h-6 w-6 items-center justify-center rounded-full shadow transition-opacity ${
          selected
            ? "bg-blue-600 text-white"
            : "border border-white/70 bg-white/85 text-transparent opacity-0 group-hover:opacity-100"
        }`}
      >
        <Check className="h-4 w-4" />
      </span>
    </>
  );
}

/**
 * @param {object} props
 * @param {Array} props.items History items from useMagicHistory.
 * @param {boolean} props.loading Whether the initial history fetch is in flight.
 * @param {boolean} [props.generating] Show a leading "generating" tile.
 * @param {string} [props.generatingLabel] Copy under the generating spinner.
 * @param {string} [props.resultType="image"] The tool's primary result type — drives
 *   the shape of the generating tile.
 * @param {(id: string|number) => void} props.onDelete Delete an item (modal refreshes history).
 * @param {(string|number|null)} [props.removingId] Item currently being deleted.
 * @param {(file: File) => Promise<unknown>} props.uploadMedia Auth uploader (Save to gallery).
 * @param {string} [props.filePrefix="magic"] File-name prefix for downloads / saves.
 * @param {(url: string) => void} [props.onGenerateVideo] Optional "Generate video" (image items).
 * @param {string[]|null} [props.selectableTypes=null] Media types a tile may be
 *   selected as (e.g. ["image"] or ["image","video"]) — used inside the media
 *   picker so only results the requesting form accepts (its `allowedTypes`) can be
 *   selected and Applied. A tile whose type isn't listed opens the lightbox as
 *   usual. null (the standalone modal) → nothing is selectable.
 * @param {string[]} [props.selectedUrls=[]] URLs currently selected (drives the ring).
 * @param {(item: object) => void} [props.onToggleSelect] Toggle selection for a tile.
 */
export default function MagicHistoryGrid({
  items,
  loading,
  generating = false,
  generatingLabel = "Generating…",
  resultType = "image",
  onDelete,
  removingId = null,
  uploadMedia,
  filePrefix = "magic",
  onGenerateVideo,
  selectableTypes = null,
  selectedUrls = [],
  onToggleSelect,
}) {
  // Whether a given item type may be selected here (gated by the caller's
  // allowedTypes). Text results are never selectable.
  const canSelectType = (type) =>
    Array.isArray(selectableTypes) && selectableTypes.includes(type);
  const [menu, setMenu] = useState(null); // { item, x, y }
  const [publishItem, setPublishItem] = useState(null); // item being published
  const [lightboxIndex, setLightboxIndex] = useState(null); // index into mediaItems

  // Only images/videos are viewable in the lightbox (persona text isn't). We
  // key the lightbox off this filtered list so arrow navigation skips text.
  const mediaItems = items.filter(
    (it) => it.type === "image" || it.type === "video",
  );
  const openLightbox = (item) => {
    const idx = mediaItems.findIndex((m) => m.id === item.id);
    if (idx >= 0) setLightboxIndex(idx);
  };

  const handleDownload = async (item) => {
    const t = toast.loading("Downloading…");
    try {
      const ext = extFromUrl(item.url, item.type === "video" ? "mp4" : "png");
      await downloadImageUrl(item.url, { filePrefix, ext });
      toast.success("Downloaded", { id: t });
    } catch (err) {
      console.error(`❌ [${filePrefix}] history download failed:`, err);
      toast.error(err?.message || "Couldn't download that result", { id: t });
    }
  };

  const handleSaveToGallery = async (item) => {
    const t = toast.loading("Saving to gallery…");
    try {
      // ⚠️ DERIVED FROM THE ITEM'S TYPE, not assumed to be an image. This used
      // to build `image/<ext>` for whatever it was handed, so saving a clip
      // would have uploaded it as `image/mp4` — which is why the action was
      // only ever offered on pictures. See galleryFileMeta.
      const { ext, mime, category } = galleryFileMeta(item.url, item.type);
      await saveUrlToGallery(item.url, uploadMedia, {
        filePrefix,
        ext,
        mime,
        category,
      });
      toast.success("Saved to gallery", { id: t });
    } catch (err) {
      console.error(`❌ [${filePrefix}] history save to gallery failed:`, err);
      toast.error(err?.message || "Couldn't save to gallery", { id: t });
    }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  // Build the ⋯ actions for one item — each type shows only what applies.
  const actionsFor = (item) => {
    if (item.type === "text") {
      return buildResultActions({
        onCopy: item.content ? () => copyText(item.content) : undefined,
        onDelete: () => onDelete?.(item.id),
      });
    }
    if (item.type === "video") {
      return buildResultActions({
        onPublish: item.url ? () => setPublishItem(item) : undefined,
        onDownload: () => handleDownload(item),
        onCopyLink: item.url ? () => copyLink(item.url) : undefined,
        // A clip belongs in the library as much as a picture does — it is how
        // it becomes the source of the next run, or media in a post.
        onSaveToGallery: item.url ? () => handleSaveToGallery(item) : undefined,
        onDelete: () => onDelete?.(item.id),
      });
    }
    // image (and audio, which shares everything here but "Generate video")
    return buildResultActions({
      onGenerateVideo:
        onGenerateVideo && item.url && item.type !== "audio"
          ? () => onGenerateVideo(item.url)
          : undefined,
      onPublish: item.url ? () => setPublishItem(item) : undefined,
      onDownload: () => handleDownload(item),
      onCopyLink: item.url ? () => copyLink(item.url) : undefined,
      onSaveToGallery: item.url ? () => handleSaveToGallery(item) : undefined,
      onDelete: () => onDelete?.(item.id),
    });
  };

  // Anchor the menu to the ⋯ trigger (not the raw click point) so it opens
  // inside the tile: right-aligned under the button and dropping downward.
  const openMenu = (item, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu((p) =>
      p?.item?.id === item.id
        ? null
        : { item, x: rect.right - MENU_WIDTH, y: rect.bottom + 6 },
    );
  };

  // Initial load with nothing yet — a light spinner instead of flashing an empty
  // grid (the modal only mounts this once it's decided to show history).
  if (loading && items.length === 0 && !generating) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // The generating placeholder tile matches the result shape.
  const genTileAspect = resultType === "video" ? "aspect-video" : "aspect-square";

  return (
    <div>
      {/* Masonry rather than square cells: a design's copy runs to its edges, and
          cropping it to fit hides the very thing you're choosing between. */}
      <MasonryGrid
        items={generating ? [GENERATING_ITEM, ...items] : items}
        getKey={(item, i) => item.id ?? item.url ?? item.content ?? i}
        renderItem={(item) => {
          // Leading generating tile — keeps the in-flight generation visible.
          if (item === GENERATING_ITEM) {
            return (
              <div
                className={`relative rounded-2xl overflow-hidden ${genTileAspect} bg-gray-100 flex flex-col items-center justify-center gap-2 text-center px-2`}
              >
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                <span className="text-[11px] text-gray-500 leading-tight">
                  {generatingLabel}
                </span>
              </div>
            );
          }

          const isRemoving = removingId != null && item.id === removingId;
          // Keep this item's ⋯ trigger visible while its menu is open, so
          // clicking ⋯ (and moving to the menu) doesn't make the trigger vanish.
          // Below `lg` it is always visible — there is no hover on a phone, so
          // hiding it there put Download / Save / Delete out of reach entirely.
          const menuOpen = menu?.item?.id === item.id;
          const triggerVisibility = menuOpen
            ? "opacity-100"
            : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100";

          // ── Persona text result ──
          if (item.type === "text") {
            return (
              <div
                key={item.id ?? item.content}
                className="relative group rounded-2xl border border-gray-200 bg-surface p-4"
              >
                {isRemoving && (
                  <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <button
                  onClick={(e) => openMenu(item, e)}
                  aria-label="Result actions"
                  className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-surface/90 text-gray-700 hover:text-blue-600 flex items-center justify-center shadow ${triggerVisibility} transition-opacity cursor-pointer`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <p className="text-sm text-gray-700 leading-relaxed pr-8 whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
            );
          }

          // ── Video result — a clickable poster thumbnail (plays in the
          // lightbox), so the grid stays a clean set of tiles. ──
          if (item.type === "video") {
            const canSel = canSelectType("video");
            const isSel = canSel && selectedUrls.includes(item.url);
            return (
              <button
                key={item.id ?? item.url}
                onClick={() =>
                  canSel ? onToggleSelect?.(item) : openLightbox(item)
                }
                className="relative group block w-full rounded-2xl overflow-hidden bg-black aspect-video cursor-pointer text-left"
              >
                <video
                  src={item.videoSrc || item.url}
                  poster={item.thumbnail || undefined}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover pointer-events-none"
                />
                {/* Play badge */}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-11 h-11 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </span>
                </span>
                {canSel && <SelectionMark selected={isSel} />}
                {isRemoving && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <span
                  onClick={(e) => openMenu(item, e)}
                  role="button"
                  aria-label="Result actions"
                  className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-surface/90 text-gray-700 hover:text-blue-600 flex items-center justify-center shadow ${triggerVisibility} transition-opacity cursor-pointer`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              </button>
            );
          }

          // ── Image result (default) — click to select (picker) or open the
          // lightbox (standalone). ──
          const canSelImg = canSelectType("image");
          const isSelImg = canSelImg && selectedUrls.includes(item.url);
          return (
            <button
              key={item.id ?? item.url}
              onClick={() =>
                canSelImg ? onToggleSelect?.(item) : openLightbox(item)
              }
              className="relative group block w-full rounded-2xl overflow-hidden bg-gray-100 cursor-pointer text-left"
            >
              {/* min-h holds a tile open until its image arrives and sets the
                  real height. */}
              <img
                src={item.url}
                alt="generation"
                className="block w-full h-auto min-h-24 transition-transform duration-300 group-hover:scale-[1.03]"
              />
              {canSelImg && <SelectionMark selected={isSelImg} />}
              {isRemoving && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <span
                onClick={(e) => openMenu(item, e)}
                role="button"
                aria-label="Result actions"
                className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-surface/90 text-gray-700 hover:text-blue-600 flex items-center justify-center shadow ${triggerVisibility} transition-opacity cursor-pointer`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            </button>
          );
        }}
      />

      {menu && (
        <ResultActionsMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          actions={actionsFor(menu.item)}
        />
      )}

      {lightboxIndex != null && mediaItems[lightboxIndex] && (
        <Lightbox
          items={mediaItems}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Publish flow — reuses the shared PublishModal with the generated media
          wrapped as a minimal creative (its hosted URL is the image to post). */}
      {publishItem && (
        <PublishModal
          creative={{
            id: publishItem.id,
            name: "Magic Studio creation",
            // "all" → the picker offers both social platforms and ad platforms,
            // so Magic Studio media can go out as a post or an ad.
            category: "all",
            image: publishItem.url,
            isVideo: publishItem.type === "video",
            copy: {},
          }}
          onClose={() => setPublishItem(null)}
          showToast={(msg, type) =>
            type === "error" ? toast.error(msg) : toast.success(msg)
          }
        />
      )}
    </div>
  );
}
