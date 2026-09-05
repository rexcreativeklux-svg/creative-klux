"use client";

/**
 * ToolHistoryRow — one tool's past work as a horizontal shelf on the Product
 * Studio landing page, with a "See more" that opens the lot in an overlay.
 *
 * The same shape as the Classics / Studio preset rows above it, and built on the
 * same {@link PresetStrip}, deliberately: those rows already taught the page's
 * one sideways-scrolling gesture, and a second kind of shelf that scrolled
 * differently would be a new thing to learn for no reason.
 *
 * ⚠️ THE ROW HIDES ITSELF WHEN THERE IS NOTHING IN IT. A heading over an empty
 * strip reads as a broken shelf, and on a fresh account eight of the nine tools
 * have never been used — so an "always visible" row per tool would fill the page
 * with the user's own emptiness. Nothing to show, nothing drawn.
 *
 * ⚠️ THE STRIP HOLDS EVERYTHING — no cap, and no "+N more" tile ending it. The
 * row is meant to be scrolled until it runs out, the way a shelf of thumbnails
 * should be; a tile that stops the pictures partway through to advertise the
 * rest interrupts exactly the gesture it is sitting in. "See all" in the header
 * is the way to the grid, and it is there whether the row is long or short.
 *
 * ⚠️ WHICH MAKES `loading="lazy"` LOAD-BEARING, not a nicety. A heavy account
 * can have hundreds of results per tool: the tiles are cheap DOM, but fetching
 * every picture in nine rows on page load would not be. Lazy leaves the ones
 * off to the right unfetched until they are scrolled to.
 */

import { useState } from "react";
import { Play } from "lucide-react";
import { PresetStrip } from "@/app/(dashboard)/(pages)/product-studio/PresetStrip";

/** Does this history item render as a video? Mirrors ProductHistoryGrid. */
const isVideoItem = (item) => item?.type === "video" || !!item?.videoSrc;

/**
 * @param {object} props
 * @param {{id: string, name: string, Icon: Function, color: string, tool: string}} props.tool
 * @param {Array} props.items That tool's finished results, newest first.
 * @param {(index: number) => void} props.onOpenItem Open the viewer at this tile.
 * @param {() => void} props.onSeeMore Open the overlay with everything.
 * @param {() => void} props.onOpenTool Launch the tool itself.
 */
export default function ToolHistoryRow({
  tool,
  items,
  onOpenItem,
  onSeeMore,
  onOpenTool,
}) {
  /**
   * Whether the shelf is wider than the screen gives it — reported by the strip
   * itself, which is the only thing that can know.
   *
   * ⚠️ MEASURED, NOT COUNTED. "More than N tiles" is the obvious test and it is
   * wrong at both ends: three results overflow on a phone, and twelve do not on
   * a wide monitor with the sidebar collapsed. The row is asking a question
   * about the viewport, so the viewport has to answer it — and it re-answers on
   * resize, so the button appears and disappears as the window changes.
   */
  const [overflowing, setOverflowing] = useState(false);

  // ⚠️ AFTER the hook, not before it. An early return above a useState is the
  // classic conditional-hook crash — and this component genuinely does return
  // early for a tool with no history.
  if (!items || items.length === 0) return null;

  const { Icon } = tool;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* The heading opens the tool. A shelf of things a tool made is the most
            natural place to ask it for another one, and the row would otherwise
            be the one part of this page you cannot start work from. */}
        <button
          onClick={onOpenTool}
          className="flex items-center gap-2 min-w-0 cursor-pointer group/title"
        >
          {Icon && (
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tool.color}`}
            >
              <Icon className="w-4 h-4" />
            </span>
          )}
          <h3 className="text-base font-semibold text-gray-900 truncate group-hover/title:text-blue-700 transition-colors">
            {tool.name}
          </h3>
          <span className="text-xs text-gray-400 shrink-0 tabular-nums">
            {items.length}
          </span>
        </button>

        {/* ⚠️ ONLY WHEN THE ROW ACTUALLY OVERFLOWS. On a shelf whose every tile
            is already on screen, "See all" opens a grid of the same three
            pictures — a link that promises more and delivers what you are
            looking at. The scroll is the reason it exists, so no scroll, no
            link. */}
        {overflowing && (
          <button
            onClick={onSeeMore}
            className="text-sm text-gray-500 hover:text-gray-900 shrink-0 cursor-pointer transition-colors"
          >
            See all
          </button>
        )}
      </div>

      <PresetStrip onOverflowChange={setOverflowing}>
        {items.map((item, i) => (
          <button
            key={item.id ?? item.url ?? i}
            onClick={() => onOpenItem(i)}
            className="relative shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 hover:border-blue-400 transition-colors cursor-pointer"
          >
            {isVideoItem(item) ? (
              <>
                {/* Poster frame only — `preload="metadata"` fetches a header
                    rather than the clip. A shelf that autoplayed would be tens
                    of megabytes to look at a row of thumbnails, and this page
                    can have several such rows. */}
                <video
                  src={item.videoSrc || item.url}
                  poster={item.thumbnail || undefined}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover pointer-events-none"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  </span>
                </span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
            )}
          </button>
        ))}

      </PresetStrip>
    </section>
  );
}
