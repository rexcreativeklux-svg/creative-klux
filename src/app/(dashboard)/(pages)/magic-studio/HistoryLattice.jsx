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

import { useEffect, useState } from "react";
import {
  Copy,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  Play,
  Volume2,
  X,
} from "lucide-react";
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

/** Elapsed seconds as "8s" / "1:24" — minutes only once there are any. */
const formatElapsed = (seconds) =>
  seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * The in-flight cell.
 *
 * ⚠️ TWO KINDS OF WAIT, and the difference is why `progress` may be null. The
 * on-device engines report real percentages; a backend generation is a request
 * we are waiting on, and the client cannot see inside it. So a bar is drawn ONLY
 * when there is a true number behind it — a bar that advances on a guess is
 * worse than no bar, because it makes a promise the run can't keep.
 *
 * The elapsed counter shows either way, and carries the wait on its own where
 * there is no percentage. It is the part that distinguishes "still working" from
 * "quietly died": a video legitimately runs for minutes, and a still spinner
 * alone would have people reloading the page on a job that was fine.
 *
 * The counter runs from mount, which is exactly the life of one run — the tile
 * appears when generating starts and is replaced by the result — so there is no
 * timer to reset and nothing to reconcile when a second run follows the first.
 */
function GeneratingCell({ label, progress }) {
  const [seconds, setSeconds] = useState(0);
  const hasProgress = typeof progress === "number";

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-3 border-b border-r border-gray-200 bg-gray-50 px-5 text-center">
      <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
      <p className="text-xs font-medium leading-snug text-gray-600">{label}</p>

      {hasProgress ? (
        <div className="w-full max-w-36">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          >
            {/* Transitioning WIDTH, not transform: the bar has to end exactly
                where the percentage says, and a scaled element rounds. */}
            <div
              className="h-full rounded-full bg-blue-500 transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] tabular-nums text-gray-400">
            {progress}% · {formatElapsed(seconds)}
          </p>
        </div>
      ) : (
        <p className="text-[11px] tabular-nums text-gray-400">
          {formatElapsed(seconds)}
        </p>
      )}
    </div>
  );
}

/**
 * What a result of this type should be saved as when the URL doesn't say.
 *
 * ⚠️ THE FALLBACK CARRIES REAL WEIGHT HERE. Text to Audio runs in the browser
 * and its result is a `blob:` URL, which has no extension at all — so every
 * fallback is the one that gets used, and a single default of "png" saved
 * generated speech as a .png that nothing would open.
 */
const DEFAULT_EXT = { video: "mp4", audio: "mp3", image: "png" };

/** Extension from a hosted URL, ignoring query/hash, with a type-aware default. */
function extFromUrl(url, type) {
  const clean = String(url || "")
    .split("?")[0]
    .split("#")[0];
  const match = clean.match(/\.([a-z0-9]{2,5})$/i);
  return match ? match[1].toLowerCase() : DEFAULT_EXT[type] || "png";
}

/**
 * @param {object} props
 * @param {Array} props.items      History, newest first.
 * @param {boolean} props.loading  Initial fetch in flight.
 * @param {boolean} [props.generating] A run is in flight — takes the first cell
 *   so the wait is visible where the result will land, rather than only as a
 *   spinner on the send button.
 * @param {string} [props.generatingLabel] Copy under that cell's spinner.
 * @param {number|null} [props.generatingProgress] Whole percent, when the run
 *   can actually report one. Null draws the elapsed counter alone — see the
 *   note on GeneratingCell for why that isn't a bar at zero.
 * @param {(id: string|number) => void} [props.onDelete]
 * @param {string|number|null} [props.removingId]
 * @param {string} [props.emptyHint] One quiet line dropped into the first cell
 *   when there is no history at all — omit it for a completely bare lattice.
 */
export default function HistoryLattice({
  items,
  loading,
  generating = false,
  generatingLabel = "Generating…",
  generatingProgress = null,
  onDelete,
  removingId = null,
  emptyHint,
}) {
  const [menu, setMenu] = useState(null); // { item, x, y }
  const [lightboxIndex, setLightboxIndex] = useState(null);
  // A text result open for reading. Its own viewer rather than the Lightbox,
  // which handles media and has no notion of a wall of prose.
  const [reading, setReading] = useState(null);

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
      const ext = extFromUrl(item.url, item.type);
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

  // The generating cell occupies the slot the result will take, so the grid
  // doesn't reshuffle under the pointer when the run lands — the placeholder is
  // replaced in place rather than everything shifting one cell along.
  const filled = items.length + (generating ? 1 : 0);
  const cellCount = Math.max(
    CELL_MULTIPLE,
    Math.ceil(filled / CELL_MULTIPLE) * CELL_MULTIPLE,
  );
  const cells = Array.from({ length: cellCount }, (_, index) =>
    generating ? (index === 0 ? null : items[index - 1]) : items[index],
  );

  return (
    <>
      <div className="grid grid-cols-2 border-l border-t border-gray-200 sm:grid-cols-3 lg:grid-cols-4">
        {generating && (
          <GeneratingCell
            label={generatingLabel}
            progress={generatingProgress}
          />
        )}

        {cells.map((item, index) => {
          // The generating tile above already rendered cell 0.
          if (generating && index === 0) return null;
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
              {/* ⚠️ AUDIO IS NOT WRAPPED IN THE TILE BUTTON. A <button> may not
                  contain interactive content — a player nested in one is invalid
                  HTML, and its transport swallows or fights the tile's own click.
                  So an audio result is its own cell: you can hear it here,
                  before deciding whether it is worth downloading. */}
              {item.type === "audio" ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-50 p-4">
                  <Volume2 className="h-6 w-6 shrink-0 text-gray-400" />
                  <p className="line-clamp-3 text-center text-[11px] text-gray-500">
                    {item.prompt || "Audio"}
                  </p>
                  <audio
                    src={item.url || undefined}
                    controls
                    preload="metadata"
                    // One thing playing at a time. Two tiles talking over each
                    // other is nobody's intent, and the browser won't stop it.
                    onPlay={(event) => {
                      document.querySelectorAll("audio").forEach((player) => {
                        if (player !== event.currentTarget) player.pause();
                      });
                    }}
                    className="h-9 w-full"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (isMedia) openLightbox(item);
                    // A transcript is the whole point of Audio to Text, and five
                    // clamped lines in a square tile is not somewhere you can
                    // read one — so a text tile opens into a reader.
                    else if (item.type === "text" && item.content) setReading(item);
                  }}
                  className={`block h-full w-full overflow-hidden text-left ${
                    isMedia || (item.type === "text" && item.content)
                      ? "cursor-pointer"
                      : "cursor-default"
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

                  {item.type === "text" && (
                    <span className="flex h-full w-full flex-col gap-2 p-4">
                      <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="line-clamp-5 whitespace-pre-wrap text-[11px] leading-relaxed text-gray-600">
                        {item.content}
                      </span>
                      {/* Says the tile is a preview, so a clamped transcript
                          reads as "there is more" rather than as all there is. */}
                      <span className="mt-auto text-[10px] font-medium text-blue-600">
                        Read full text →
                      </span>
                    </span>
                  )}
                </button>
              )}

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

      {reading && <TextReader item={reading} onClose={() => setReading(null)} />}
    </>
  );
}

/**
 * The full text of a result — a transcript, a persona's copy — in something
 * actually shaped for reading, with the two things anyone wants next to hand.
 *
 * Its own component rather than a branch of the Lightbox: that one is built
 * around media, navigation between frames and a download of a file, none of
 * which a wall of prose has any use for.
 */
function TextReader({ item, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    // The page behind is a scrolling canvas; letting it move under a reader
    // that is itself scrollable makes both feel broken.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const download = () => {
    const blob = new Blob([item.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transcript.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    // Backdrop closes; the panel stops the click so a selection drag that ends
    // outside the text doesn't dismiss what you were reading.
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Result text"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-4 py-3">
          <FileText className="h-4 w-4 shrink-0 text-gray-400" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
            Transcript
          </p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(item.content);
              toast.success("Copied!");
            }}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <Copy className="h-3.5 w-3.5 shrink-0" />
            Copy
          </button>
          <button
            type="button"
            onClick={download}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            .txt
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* max-w-prose on the text itself: a transcript set the full width of a
            672px panel is a genuinely harder read than one set to a measure. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {item.content}
          </p>
        </div>
      </div>
    </div>
  );
}
