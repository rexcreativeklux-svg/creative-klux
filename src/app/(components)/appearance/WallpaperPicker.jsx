"use client";

// app/(components)/appearance/WallpaperPicker.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The Appearance panel's "Images" tab: a photo from Pexels behind the app.
//
//     [ Search                    ]
//     ┌────────┐ ┌────────┐ ┌────────┐
//     │  none  │ │ photo  │ │ photo  │   ← click to apply, live
//     └────────┘ └────────┘ └────────┘
//
// A photo swaps the WALLPAPER and nothing else — the palette still comes from
// the selected skin, or from the neutral glass treatment when no skin is on.
// See the note at the top of wallpapers.js for why the two are separate axes.
//
// ── The grid is NEVER empty ──────────────────────────────────────────────────
// Three rules, and together they mean there is always something to pick:
//
//   · `photos` starts as FALLBACK_WALLPAPERS, so tiles are on screen in the
//     first frame, before any request has resolved.
//   · a result set is only swapped in when it has something in it, so a search
//     that finds nothing leaves the previous tiles up instead of blanking.
//   · a failed request changes the NOTE, never the tiles.
//
// The tiles are therefore never gated on the request state — only the little
// status line under them is. An earlier cut rendered the grid only when the
// fetch had succeeded, which is how a picker ends up showing an error message
// where its whole reason for existing should be.
//
// ⚠️ The request is aborted if the tab or panel closes, or if the query
// changes underneath it. The panel unmounts on close, so a search left in
// flight would otherwise resolve into a component that is gone.

import { useEffect, useRef, useState } from "react";
import { Ban, Loader2, Search } from "lucide-react";
import {
  ART_COLLECTIONS,
  DEFAULT_QUERY,
  FALLBACK_WALLPAPERS,
  searchWallpapers,
  useWallpaper,
} from "./wallpapers";

/** How long to wait after the last keystroke before asking Pexels. */
const DEBOUNCE_MS = 450;

/**
 * @param {object} props
 * @param {"search"|"art"} [props.mode] Which control sits above the grid:
 *   `search` is the Images tab (type anything), `art` is the Art tab (pick a
 *   curated collection). Everything below that control — the fetch, the None
 *   tile, the grid, the credit line, the never-empty rules — is identical,
 *   which is the whole reason the two tabs are one component. They differ in
 *   how a query is CHOSEN, not in what is done with it.
 */
export default function WallpaperPicker({ mode = "search" }) {
  const isArt = mode === "art";
  const [wallpaper, setWallpaper] = useWallpaper();
  const [collection, setCollection] = useState(ART_COLLECTIONS[0].id);
  // Prefilled, not empty: the box states the search the grid is CURRENTLY
  // showing, so the tiles are explained rather than unattributed — and typing
  // over a selected value is one gesture where filling a blank box is two.
  const [query, setQuery] = useState(DEFAULT_QUERY);
  // Seeded — see "The grid is NEVER empty" above.
  const [photos, setPhotos] = useState(FALLBACK_WALLPAPERS);
  const [busy, setBusy] = useState(true);
  const [note, setNote] = useState("");
  // The query actually sent, so typing doesn't fire a request per keystroke.
  const [committed, setCommitted] = useState(
    isArt ? ART_COLLECTIONS[0].query : DEFAULT_QUERY,
  );

  // Debounce the box into `committed`.
  //
  // The "busy" flip happens HERE, in the timer's callback, and not in the
  // fetch effect below where it reads more naturally. A synchronous setState
  // in an effect body is the cascading render react-hooks/set-state-in-effect
  // exists to catch; a setState in a callback the effect merely SCHEDULED is
  // the pattern the rule is fine with. The initial state covers the first
  // fetch and every later one passes through this timer, so no transition
  // into busy is missed.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const id = setTimeout(() => {
      setBusy(true);
      setCommitted(query.trim() || DEFAULT_QUERY);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  // Fetch whenever the committed query changes.
  useEffect(() => {
    const controller = new AbortController();

    searchWallpapers(committed, controller.signal)
      .then((results) => {
        // Only swap when there is something to swap IN.
        if (results.length) {
          setPhotos(results);
          setNote("");
        } else {
          setNote(`Nothing for “${committed}” — showing the last set.`);
        }
        setBusy(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.warn("⚠️ [appearance] Pexels search failed —", err.message);
        setNote("Couldn't reach Pexels — showing a saved set.");
        setBusy(false);
      });

    return () => controller.abort();
  }, [committed]);

  return (
    <div>
      {isArt ? (
        /* Collections. A wrapping row rather than a scrolling one — eleven
           chips settle into three lines at the panel's width, and a sideways
           scroller hides whatever doesn't fit behind a gesture nobody makes
           in a 300px popover. */
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {ART_COLLECTIONS.map(({ id, label, query: collectionQuery }) => {
            const active = id === collection;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setCollection(id);
                  setBusy(true);
                  setCommitted(collectionQuery);
                }}
                aria-pressed={active}
                className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            );
          })}
          {busy && (
            <span className="flex items-center px-1 text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </span>
          )}
        </div>
      ) : (
        <div className="relative mb-2.5">
          {/* h-* AND w-*: lucide hard-codes height="24" on its <svg>, so a
              width-only class letterboxes the glyph. */}
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search for a background image"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2.5 text-[12px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500/60 focus:bg-surface"
          />
          {busy && (
            <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {/* None, first: clearing has to be as easy as choosing, and with a
            live preview behind the panel it is the control people reach for
            most while browsing. */}
        <button
          type="button"
          onClick={() => setWallpaper(null)}
          aria-pressed={!wallpaper}
          title="No image"
          aria-label="No image"
          className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg border transition-all ${
            wallpaper
              ? "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300 hover:text-gray-600"
              : "border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-600/30"
          }`}
        >
          <Ban className="h-4 w-4" />
        </button>

        {photos.map((photo) => {
          const active = wallpaper?.url === photo.url;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setWallpaper(photo)}
              aria-pressed={active}
              // Pexels asks for the photographer to be credited. There is no
              // room for a caption per tile at this size, so the credit is the
              // tooltip and the accessible name.
              title={`Photo by ${photo.photographer} on Pexels`}
              aria-label={`Use photo by ${photo.photographer}`}
              className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg border transition-all ${
                active
                  ? "border-blue-600 ring-2 ring-blue-600/30"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumb}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
        {note || "Photos from Pexels. Hover a tile for its photographer."}
      </p>
    </div>
  );
}
