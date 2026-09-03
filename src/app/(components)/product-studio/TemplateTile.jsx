"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

/**
 * One template tile — a looping clip when the template has a playable `src`,
 * a still otherwise. Product Video's clips (productVideoTemplates.js) and
 * Product Staging's scenes (stagingTemplates.js) normalise to the same tile
 * shape, so both tools' rows and "See all" grids share this one component.
 *
 * PLAYBACK. Clips are `preload="none"` and only start once the tile is actually
 * on screen. The row scrolls horizontally, so a tile scrolled out of it is
 * clipped by the scroller and stops intersecting — off-screen tiles never fetch
 * a byte, and ones you scroll past pause instead of decoding into nothing.
 * `poster` covers the gap while a clip buffers, so a tile is never blank.
 *
 * @param {object} props
 * @param {{id: string, poster: string, src: string|null, alt?: string, category?: string}} props.template
 * @param {boolean} props.selected
 * @param {(template: object) => void} props.onSelect
 * @param {string} [props.className] Sizing — the row and the grid size differently.
 * @param {string} [props.objectPosition="object-top"] Crop anchor for stills.
 *   Video-model tiles want the head kept (`object-top`); product SCENES want
 *   the middle, where the styling actually is.
 * @param {string} [props.label] Optional name shown on a gradient strip along
 *   the bottom — a scene template is nothing without its name; a clip doesn't
 *   need one, so callers that don't pass it get the bare tile as before.
 * @param {string} [props.applyLabel] Opt-in hover affordance: when set, hovering
 *   the tile dims it and shows this text as a centred pill (Product Video's
 *   "Apply Template"). It is a prop rather than the default because a clip whose
 *   prompt REPLACES what you typed should say so before you click, while the
 *   tools that only mark a selection should not grow a call-to-action they don't
 *   need. Purely decorative — the tile is already a button, so a tap on touch
 *   (where there is no hover) applies the template exactly as it always did.
 */
export default function TemplateTile({
  template,
  selected,
  onSelect,
  className = "",
  objectPosition = "object-top",
  label,
  applyLabel,
}) {
  const videoRef = useRef(null);
  const playable = Boolean(template.src);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Rejects when the browser declines autoplay; the poster stays up,
          // which is a perfectly good tile.
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [template.src]);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(template)}
      aria-pressed={selected}
      className={`group relative overflow-hidden rounded-xl border-2 transition-colors cursor-pointer ${
        selected ? "border-blue-500" : "border-transparent hover:border-gray-200"
      } ${className}`}
    >
      {playable ? (
        <video
          ref={videoRef}
          src={template.src}
          poster={template.poster}
          muted
          loop
          playsInline
          preload="none"
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={template.poster}
          alt={template.alt || template.category || "template"}
          loading="lazy"
          className={`w-full h-full object-cover ${objectPosition}`}
        />
      )}

      {/* Hover scrim + "Apply Template" pill.

          Rendered BEFORE the name strip so the strip stays crisp on top of the
          scrim rather than being dimmed with the artwork.

          The pill is deliberately hard-coded light-on-dark (`bg-black/55`,
          `text-white`) instead of using the theme tokens. It never sits on a
          themed surface — only ever on this scrim, which is black in both
          themes — so `bg-surface`/`text-gray-900` would flip it to dark-on-dark
          the moment the dark theme is on (see the same trap noted in
          TemplateBrowserModal's tabs). */}
      {applyLabel && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          {/* `max-w` + wrapping, not a fixed pill: the same component renders at
              96px wide in the sidebar shelf and ~200px in the "See all" grid.
              At the shelf size a one-line "Apply Template" is wider than the
              tile, so it wraps to two lines there and stays on one in the grid,
              instead of spilling past the rounded corners in either. */}
          <span className="max-w-[88%] rounded-xl border border-white/70 bg-black/55 px-2.5 py-1 text-center text-[10px] font-semibold leading-tight text-white shadow-lg backdrop-blur-[2px]">
            {applyLabel}
          </span>
        </span>
      )}

      {label && (
        <span className="absolute inset-x-0 bottom-0 px-1.5 pb-1 pt-4 bg-linear-to-t from-black/70 to-transparent text-[10px] font-medium text-white text-center leading-tight truncate">
          {label}
        </span>
      )}

      {selected && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </span>
      )}
    </button>
  );
}
