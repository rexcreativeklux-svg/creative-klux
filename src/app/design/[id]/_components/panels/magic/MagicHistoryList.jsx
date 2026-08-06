"use client";

import React from "react";
import { Loader2, Play, Trash2, ImageOff } from "lucide-react";

/**
 * MagicHistoryList — one Magic Studio tool's generation history, sized for the
 * editor's 300px sidebar. Items come from `useMagicHistory` (POST
 * /magic-studio/history), newest first — the same records the Magic Studio page
 * shows, so a generation made here appears there and vice versa.
 *
 * The Magic Studio page renders history through MagicHistoryGrid, which is built
 * for its wide canvas (lightbox, publish, save-to-gallery, ⋯ menu). In the editor
 * the panel only needs the two things a designer wants from a past result — see
 * it, put it on the page — so this is a compact two-up grid: click a tile to drop
 * it on the canvas, hover for delete.
 *
 * Non-image records still render (a video or persona copy generated elsewhere is
 * part of the honest history) but can't be placed — `onPick` is what decides
 * that, and it routes through the editor's one media-insert rule.
 *
 * Props: { items, loading, generating, onPick, onDelete, removingId }
 */
export default function MagicHistoryList({
  items = [],
  loading = false,
  generating = false,
  onPick,
  onDelete,
  removingId = null,
}) {
  // First load with nothing to show yet — a spinner beats an empty grid that
  // fills in a beat later.
  if (loading && items.length === 0 && !generating) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!generating && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <ImageOff className="h-6 w-6 text-gray-300" />
        <p className="text-xs text-gray-400">
          Nothing generated yet — your results will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-gray-400">
        Newest first · automatically deleted after 30 days
      </p>

      <div className="grid grid-cols-2 gap-2">
        {/* Leading tile for the run that's still in flight, so switching to
            History mid-generation doesn't look empty. */}
        {generating && (
          <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-gray-100 px-2 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-[10px] leading-tight text-gray-500">
              Generating…
            </span>
          </div>
        )}

        {items.map((item) => (
          <HistoryTile
            key={item.id ?? item.url ?? item.content}
            item={item}
            removing={removingId != null && item.id === removingId}
            onPick={onPick}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

/** One history record: image thumb, video poster, or a snippet of copy. */
function HistoryTile({ item, removing, onPick, onDelete }) {
  const isText = item.type === "text";

  return (
    <div className="group relative">
      <button
        onClick={() => onPick?.(item)}
        title={item.prompt || "Add to design"}
        className={`relative w-full overflow-hidden rounded-lg border border-gray-200 transition hover:border-blue-400 cursor-pointer ${
          isText ? "bg-surface p-2 text-left" : "aspect-square bg-gray-50"
        }`}
      >
        {isText ? (
          <p className="line-clamp-5 text-[11px] leading-snug text-gray-600">
            {item.content}
          </p>
        ) : item.type === "video" ? (
          <>
            <video
              src={item.videoSrc || item.url}
              poster={item.thumbnail || undefined}
              muted
              playsInline
              preload="metadata"
              className="pointer-events-none h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-white text-white" />
              </span>
            </span>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail || item.url}
            alt={item.prompt || "Generated result"}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}

        {removing && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </span>
        )}
      </button>

      {/* Delete stays visible on touch (no hover to reveal it there). */}
      {onDelete && item.id != null && (
        <button
          onClick={() => onDelete(item.id)}
          disabled={removing}
          title="Delete"
          aria-label="Delete result"
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/55 text-white opacity-100 transition hover:bg-red-500 disabled:opacity-40 cursor-pointer lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
