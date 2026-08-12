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

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Play,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AudioCard from "@/app/(components)/gallery/AudioCard";
import Lightbox from "@/app/(components)/Lightbox";
import ResultActionsMenu, {
  buildResultActions,
} from "@/app/(components)/product-studio/ResultActionsMenu";
import { downloadImageUrl } from "@/app/(components)/product-studio/saveToGallery";
import PublishModal from "@/app/(components)/PublishModal";
import { toolById } from "./magicTools";

/** Width of ResultActionsMenu (its `w-52`), so the menu opens inside the cell. */
const MENU_WIDTH = 208;

/** See the ⚠️ above — LCM of the 2 / 3 / 4 column counts. */
const CELL_MULTIPLE = 12;

/**
 * The shape of one cell — WIDE, NOT SQUARE, so the canvas shows three row rules
 * instead of two. At four columns a square cell is roughly as tall as half the
 * viewport, which puts the second rule at the fold and every rule after it out
 * of sight; the lattice then reads as a couple of big boxes rather than as a
 * grid you are filling in.
 *
 * ⚠️ Every cell kind uses this — result, audio, generating, empty. The lattice
 * only reads as a lattice while they all agree on one shape, so a cell that
 * sets its own aspect would tear a row in half.
 */
const CELL_SHAPE = "aspect-3/2";

/** Elapsed seconds as "8s" / "1:24" — minutes only once there are any. */
const formatElapsed = (seconds) =>
  seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * The in-flight cell — a soft breathing orb with YOUR OWN WORDS on it.
 *
 * ⚠️ THE PROMPT IS THE CONTENT, not a caption. Four runs in flight at once are
 * four identical spinners over a generic "Generating…", and there is no way to
 * tell which is the one you care about; showing what each was asked for makes
 * the cell the thing itself rather than a placeholder standing in for it. The
 * tool's own working label is the fallback for the inputs that have no
 * words — a source image, an audio take.
 *
 * ⚠️ TWO KINDS OF WAIT, and the difference is why `progress` may be null. The
 * on-device engines report real percentages; a backend generation is a request
 * we are waiting on, and the client cannot see inside it. So a bar is drawn ONLY
 * when there is a true number behind it — a bar that advances on a guess is
 * worse than no bar, because it makes a promise the run can't keep.
 *
 * The elapsed counter shows either way, and carries the wait on its own where
 * there is no percentage. It is the part that distinguishes "still working" from
 * "quietly died": a video legitimately runs for minutes, and a still tile alone
 * would have people reloading the page on a job that was fine. The pulse on the
 * orb does the same job the old spinner did — motion is what says "alive" — but
 * without putting a loading widget in the middle of the canvas.
 *
 * The counter runs from mount, which is exactly the life of one run — the tile
 * appears when generating starts and is replaced by the result — so there is no
 * timer to reset and nothing to reconcile when a second run follows the first.
 */
function GeneratingCell({ label, prompt, progress, onDismiss, onEdit }) {
  const [seconds, setSeconds] = useState(0);
  const hasProgress = typeof progress === "number";

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`group relative flex ${CELL_SHAPE} items-center justify-center overflow-hidden border-b border-r border-gray-200 bg-gray-50 px-6`}
    >
      {/* The orb. A blurred white disc rather than a gradient stack — `blur-2xl`
          on a solid circle gives the falloff for free, and one element means
          nothing to keep in step when the tile is resized. `blur` renders
          outside the box, hence `overflow-hidden` on the cell. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white blur-2xl [animation-duration:2.6s]"
      />

      {/* aria-live so the wait is announced once, rather than the counter below
          reading a new number out every second. */}
      <p
        aria-live="polite"
        className="relative line-clamp-4 text-center text-[13px] leading-relaxed text-gray-600"
      >
        {prompt?.trim() || label}
      </p>

      {/* Take it off the canvas. The run is NOT cancelled — it is a request
          already in flight, and the result still lands in history when it
          arrives. This only says "stop showing me the wait". */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Hide this from the canvas"
          title="Hide this — the result still lands when it's ready"
          className="absolute left-2 top-2 cursor-pointer rounded-md p-1 text-gray-400 opacity-100 transition-colors hover:bg-gray-200/70 hover:text-gray-700 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <p className="absolute bottom-2.5 left-3 text-[11px] tabular-nums text-gray-400">
        {hasProgress ? `${progress}% · ${formatElapsed(seconds)}` : formatElapsed(seconds)}
      </p>

      {/* Puts the prompt back in the composer to be reworded and run again —
          the normal loop when a wait is long enough that you've thought better
          of what you asked for. */}
      {onEdit && prompt?.trim() && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit this prompt"
          title="Put this prompt back in the composer"
          className="absolute bottom-2 right-2 cursor-pointer rounded-md p-1 text-gray-400 opacity-100 transition-colors hover:bg-gray-200/70 hover:text-gray-700 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      {/* A hairline on the cell's own bottom edge, only where there is a real
          number behind it. Transitioning WIDTH, not transform: the bar has to
          end exactly where the percentage says, and a scaled element rounds. */}
      {hasProgress && (
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-200"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div
            className="h-full bg-blue-500 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
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
 * An audio result — the real player, not a square thumbnail.
 *
 * ⚠️ AUDIO IS THE ONE RESULT WITH NO PICTURE OF ITSELF. Every other type can
 * say what it is in a square: an image is its own thumbnail, a video has a
 * poster, a transcript shows its first lines. A sound has nothing to show, so
 * the tile has to BE the player — a waveform you can scrub, a clock, and a
 * transport — which is a wide, short shape and not a square one. Hence the
 * two-column span; see COLUMN_SPANS.
 *
 * ⚠️ THE ASSET MUST BE MEMOIZED. AudioCard decodes the audio into a waveform in
 * an effect keyed on the whole `asset` object, so a fresh object literal per
 * render re-fetches and re-decodes the file on every render — forever, since
 * decoding sets state. Keyed on the primitives so the identity survives a
 * history refresh that returns an equal item.
 */
function AudioTile({ item, index, onDownload, onOpenMenu }) {
  const { url, blob, duration, format, voiceLabel, alt, prompt } = item;
  const asset = useMemo(
    () => ({
      src: url,
      blob,
      duration,
      format: format || extFromUrl(url, "audio"),
      // "Heart · US female" where the run knew its voice; the words that were
      // spoken otherwise, which is the next most useful way to tell two takes
      // apart in a grid of them.
      title: voiceLabel || alt || prompt || null,
      alt: alt || prompt || null,
    }),
    [url, blob, duration, format, voiceLabel, alt, prompt],
  );

  return (
    <AudioCard
      asset={asset}
      index={index}
      fill
      onDownload={onDownload}
      onOpenMenu={onOpenMenu}
    />
  );
}

/**
 * @param {object} props
 * @param {Array} props.items      History, newest first.
 * @param {boolean} props.loading  Initial fetch in flight.
 * @param {boolean} [props.generating] A run is in flight — takes the first cell
 *   so the wait is visible where the result will land, rather than only as a
 *   spinner on the send button.
 * @param {number} [props.generatingCount=1] How many cells that run will fill —
 *   the composer's "3x". One tile per pending result rather than one for the
 *   batch, so the canvas already shows the shape of what is coming.
 * @param {string} [props.generatingLabel] The tool's working copy, shown on that
 *   cell when the run had no words of its own to show (an image or audio input).
 * @param {string} [props.generatingPrompt] What was actually asked for. This is
 *   the cell's content when there is one — see the note on GeneratingCell.
 * @param {number|null} [props.generatingProgress] Whole percent, when the run
 *   can actually report one. Null draws the elapsed counter alone — see the
 *   note on GeneratingCell for why that isn't a bar at zero.
 * @param {() => void} [props.onDismissGenerating] Take the in-flight cell off
 *   the canvas. Does NOT cancel the run — the caller owns that distinction.
 * @param {() => void} [props.onEditGenerating] Put `generatingPrompt` back in
 *   the composer to be reworded.
 * @param {(id: string|number) => void} [props.onDelete]
 * @param {string|number|null} [props.removingId]
 * @param {string} [props.emptyHint] One quiet line dropped into the first cell
 *   when there is no history at all — omit it for a completely bare lattice.
 */
export default function HistoryLattice({
  items,
  loading,
  generating = false,
  generatingCount = 1,
  generatingLabel = "Generating…",
  generatingPrompt = null,
  generatingProgress = null,
  onDismissGenerating,
  onEditGenerating,
  onDelete,
  removingId = null,
  emptyHint,
}) {
  const [menu, setMenu] = useState(null); // { item, x, y }
  // The result being published, or null. Held here rather than on the menu so
  // the sheet survives the ⋯ closing under it — picking "Publish" dismisses the
  // menu, and a modal keyed off menu state would go with it.
  const [publishItem, setPublishItem] = useState(null);
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

  // Whether this result can go straight out to a platform. Two conditions, and
  // both are needed: the TOOL has to be one of the five that make something
  // publishable (see `publish` in magicTools), and THIS result has to actually
  // be a picture or a clip with a hosted URL behind it — the persona generator
  // is a publishing tool that returns text half the time, and a text tile has
  // nothing to post.
  const canPublish = (item) =>
    !!toolById(item.tool)?.publish &&
    !!item.url &&
    (item.type === "image" || item.type === "video");

  const actionsFor = (item) =>
    buildResultActions({
      onPublish: canPublish(item) ? () => setPublishItem(item) : undefined,
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

  // The generating cells occupy the slots the results will take, so the grid
  // doesn't reshuffle under the pointer when the run lands — each placeholder
  // is replaced in place rather than everything shifting along. One per pending
  // result, so a 3x run reserves three.
  const pending = generating ? Math.max(1, generatingCount) : 0;

  // One cell per result, audio included — see CELL_MULTIPLE for why the total
  // is padded to a multiple of 12.
  const usedColumns = pending + items.length;
  const emptyCount =
    Math.max(
      CELL_MULTIPLE,
      Math.ceil(usedColumns / CELL_MULTIPLE) * CELL_MULTIPLE,
    ) - usedColumns;

  return (
    <>
      <div className="grid grid-cols-2 border-l border-t border-gray-200 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: pending }, (_, index) => (
          <GeneratingCell
            // Index-keyed on purpose: these are interchangeable placeholders
            // for one batch, and the count only changes when the batch does.
            key={`pending-${index}`}
            label={generatingLabel}
            prompt={generatingPrompt}
            progress={generatingProgress}
            onDismiss={onDismissGenerating}
            onEdit={onEditGenerating}
          />
        ))}

        {items.map((item, index) => {
          const tool = toolById(item.tool);
          const isRemoving = removingId != null && item.id === removingId;
          const isMedia = item.type === "image" || item.type === "video";
          const menuOpen = menu?.item?.id === item.id;

          // ⚠️ AUDIO LEAVES THE TILE ENTIRELY — it is not a square with a
          // player crammed in, it is the player. Its own branch before the
          // shared shell below, because almost nothing in that shell applies:
          // no tile button (a <button> may not contain interactive content, and
          // the transport would fight the tile's own click), no hover scrim, no
          // corner ⋯ — the card has its own download and ⋯ along the bottom.
          if (item.type === "audio") {
            return (
              <div
                key={item.id ?? `${item.type}-${index}`}
                // ONE CELL, like every other result. The card fills it rather
                // than sitting in the middle of it, and drops controls as the
                // cell gets small — see the container queries in AudioCard's
                // fill mode, which is what makes a full player survive a ~190px
                // cell on a phone.
                className={`flex ${CELL_SHAPE} min-w-0 border-b border-r border-gray-200 bg-gray-50 p-2`}
              >
                <div className="min-w-0 flex-1">
                  <AudioTile
                    item={item}
                    index={index}
                    onDownload={() => handleDownload(item)}
                    onOpenMenu={(_asset, event) => openMenu(item, event)}
                  />
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id ?? `${item.type}-${index}`}
              className={`group relative ${CELL_SHAPE} border-b border-r border-gray-200`}
            >
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

        {/* The bare lattice the results sit in. Drawn whether or not there is
            anything to put in it — see the ⚠️ at the top of this file. */}
        {Array.from({ length: emptyCount }, (_, index) => (
          <div
            key={`empty-${index}`}
            className={`${CELL_SHAPE} border-b border-r border-gray-200`}
            aria-hidden="true"
          >
            {/* The hint rides in the FIRST cell only, and only while the whole
                grid is empty — once there is any result the lattice is
                self-explanatory and a line of copy in the gaps would just be
                litter. */}
            {index === 0 &&
              items.length === 0 &&
              pending === 0 &&
              !loading &&
              emptyHint && (
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
        ))}
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

      {/* Publishing — the shared PublishModal, with the generation wrapped as a
          minimal creative whose `image` is its hosted URL. The same shape
          MagicHistoryGrid passes, so a result published from the lattice and one
          published from the modal's grid go out identically.

          `category: "all"` so the picker offers social platforms AND ad
          accounts: what a Magic Studio result is for is decided by the person
          who made it, not by the tool that made it. */}
      {publishItem && (
        <PublishModal
          creative={{
            id: publishItem.id,
            name: toolById(publishItem.tool)?.label || "Magic Studio creation",
            category: "all",
            image: publishItem.url,
            copy: {},
          }}
          onClose={() => setPublishItem(null)}
          showToast={(message, type) =>
            type === "error" ? toast.error(message) : toast.success(message)
          }
        />
      )}
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
