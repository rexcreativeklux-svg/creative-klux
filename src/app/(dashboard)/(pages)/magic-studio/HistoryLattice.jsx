"use client";

/**
 * HistoryLattice — the Magic Studio landing canvas.
 * ─────────────────────────────────────────────────────────────────────────────
 * A hairline grid that runs edge to edge, with generations filling it from the
 * top-left. The lattice is drawn WHETHER OR NOT there is anything in it: an
 * account with no history sees the empty cells, not a placeholder illustration,
 * so the page reads as a canvas waiting to be filled rather than as a failure.
 *
 * ⚠️ THE CELL COUNT IS PADDED TO A MULTIPLE OF 12, and 12 is not arbitrary — it
 * is the lowest common multiple of the 2 / 3 / 4 column counts this grid uses
 * across its breakpoints. Padding to it means the last row is full at EVERY
 * width, so the lattice never ends in a ragged half-row that reads as a
 * rendering bug. The same multiple doubles as the floor, so an empty account
 * still gets a full screen of cells.
 *
 * How the hairlines are drawn: the container owns the top and left edges and
 * every cell owns its right and bottom. Each line therefore has exactly one
 * author — give all four sides to the cells and every interior line is drawn
 * twice, at two physical pixels on a retina screen where the outer edges are
 * one, and the grid visibly thickens in the middle.
 */

import { useState } from "react";
import { FileText, Loader2, MoreHorizontal, Play, Volume2 } from "lucide-react";
import { toast } from "sonner";
import Lightbox from "@/app/(components)/Lightbox";
import ResultActionsMenu, {
  buildResultActions,
} from "@/app/(components)/product-studio/ResultActionsMenu";
import { downloadImageUrl } from "@/app/(components)/product-studio/saveToGallery";
import { toolById } from "./magicTools";

/** Width of ResultActionsMenu (its `w-52`), so the menu opens inside the cell. */
const MENU_WIDTH = 208;

/** See the ⚠️ above — LCM of the 2 / 3 / 4 column counts. */
const CELL_MULTIPLE = 12;

/** Extension from a hosted URL, ignoring query/hash, with a type-aware default. */
function extFromUrl(url, fallback) {
  const clean = String(url || "")
    .split("?")[0]
    .split("#")[0];
  const match = clean.match(/\.([a-z0-9]{2,5})$/i);
  return match ? match[1].toLowerCase() : fallback;
}

/**
 * @param {object} props
 * @param {Array} props.items      Merged history, newest first.
 * @param {boolean} props.loading  Initial fetch in flight.
 * @param {(id: string|number) => void} [props.onDelete]
 * @param {string|number|null} [props.removingId]
 * @param {string} [props.emptyHint] One quiet line dropped into the first cell
 *   when there is no history at all — omit it for a completely bare lattice.
 */
export default function HistoryLattice({
  items,
  loading,
  onDelete,
  removingId = null,
  emptyHint,
}) {
  const [menu, setMenu] = useState(null); // { item, x, y }
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // The lightbox only handles images and video, so it is keyed off that subset —
  // arrowing through the grid then skips a persona's text result instead of
  // opening a blank frame on it.
  const mediaItems = items.filter(
    (item) => item.type === "image" || item.type === "video",
  );
  const openLightbox = (item) => {
    const index = mediaItems.findIndex((m) => m.id === item.id);
    if (index >= 0) setLightboxIndex(index);
  };

  const handleDownload = async (item) => {
    const id = toast.loading("Downloading…");
    try {
      const ext = extFromUrl(item.url, item.type === "video" ? "mp4" : "png");
      await downloadImageUrl(item.url, { filePrefix: "magic", ext });
      toast.success("Downloaded", { id });
    } catch (err) {
      console.error("❌ [magic-studio] download failed:", err);
      toast.error(err?.message || "Couldn't download that result", { id });
    }
  };

  const actionsFor = (item) =>
    buildResultActions({
      onDownload: item.url ? () => handleDownload(item) : undefined,
      onCopyLink: item.url
        ? () => {
            navigator.clipboard.writeText(item.url);
            toast.success("Link copied!");
          }
        : undefined,
      onCopy: item.content
        ? () => {
            navigator.clipboard.writeText(item.content);
            toast.success("Copied!");
          }
        : undefined,
      onDelete: onDelete ? () => onDelete(item.id) : undefined,
    });

  // Anchored to the ⋯ button rather than the pointer, so the menu opens tucked
  // under it inside the cell instead of wherever the click happened to land.
  const openMenu = (item, event) => {
    event.stopPropagation();
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu((current) =>
      current?.item?.id === item.id
        ? null
        : { item, x: rect.right - MENU_WIDTH, y: rect.bottom + 6 },
    );
  };

  const cellCount = Math.max(
    CELL_MULTIPLE,
    Math.ceil(items.length / CELL_MULTIPLE) * CELL_MULTIPLE,
  );
  const cells = Array.from({ length: cellCount }, (_, index) => items[index]);

  return (
    <>
      <div className="grid grid-cols-2 border-l border-t border-gray-200 sm:grid-cols-3 lg:grid-cols-4">
        {cells.map((item, index) => {
          // ── Empty cross-section ──
          if (!item) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square border-b border-r border-gray-200"
                aria-hidden="true"
              >
                {/* The hint rides in the FIRST cell only, and only while the
                    whole grid is empty — once there is any history the lattice
                    is self-explanatory and a line of copy in the gaps would
                    just be litter. */}
                {index === 0 && items.length === 0 && !loading && emptyHint && (
                  <div className="flex h-full items-center justify-center p-4">
                    <p className="text-center text-[11px] leading-relaxed text-gray-400">
                      {emptyHint}
                    </p>
                  </div>
                )}
                {index === 0 && loading && (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                  </div>
                )}
              </div>
            );
          }

          const tool = toolById(item.tool);
          const isRemoving = removingId != null && item.id === removingId;
          const isMedia = item.type === "image" || item.type === "video";
          const menuOpen = menu?.item?.id === item.id;

          return (
            <div
              key={item.id ?? `${item.type}-${index}`}
              className="group relative aspect-square border-b border-r border-gray-200"
            >
              <button
                type="button"
                onClick={() => isMedia && openLightbox(item)}
                // Text and audio results have nothing to open, so they are not
                // pretending to be clickable.
                className={`block h-full w-full overflow-hidden text-left ${
                  isMedia ? "cursor-pointer" : "cursor-default"
                }`}
              >
                {item.type === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.prompt || "Generation"}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}

                {item.type === "video" && (
                  <span className="relative block h-full w-full bg-black">
                    <video
                      src={item.videoSrc || item.url}
                      poster={item.thumbnail || undefined}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur">
                        <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                      </span>
                    </span>
                  </span>
                )}

                {item.type === "audio" && (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-50 p-4">
                    <Volume2 className="h-6 w-6 text-gray-400" />
                    <span className="line-clamp-3 text-center text-[11px] text-gray-500">
                      {item.prompt || "Audio"}
                    </span>
                  </span>
                )}

                {item.type === "text" && (
                  <span className="flex h-full w-full flex-col gap-2 p-4">
                    <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="line-clamp-6 whitespace-pre-wrap text-[11px] leading-relaxed text-gray-600">
                      {item.content}
                    </span>
                  </span>
                )}
              </button>

              {/* Which tool made it — the whole point of a MERGED grid is that
                  the answer isn't implied by the page you're on. Media tiles get
                  a scrim behind it; the flat text and audio tiles don't need one. */}
              {tool && (
                <span
                  className={`pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
                    isMedia
                      ? "bg-black/55 text-white backdrop-blur-sm"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <tool.icon className="h-3 w-3 shrink-0" />
                  {tool.short}
                </span>
              )}

              {/* Below `lg` the ⋯ is always on: there is no hover on a phone, so
                  hiding it there puts Download and Delete out of reach entirely.
                  It also stays on while ITS menu is open, so moving the pointer
                  from the trigger to the menu doesn't make the trigger vanish. */}
              <button
                type="button"
                onClick={(event) => openMenu(item, event)}
                aria-label="Result actions"
                className={`absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-gray-700 shadow transition-opacity hover:text-blue-600 ${
                  menuOpen
                    ? "opacity-100"
                    : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                }`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {item.prompt && isMedia && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="line-clamp-2 text-[11px] leading-snug text-white">
                    {item.prompt}
                  </span>
                </span>
              )}

              {isRemoving && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </span>
              )}
            </div>
          );
        })}
      </div>

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
    </>
  );
}
