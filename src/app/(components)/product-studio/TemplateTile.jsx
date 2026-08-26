"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

/**
 * One template tile — a looping clip when the template has a playable `src`,
 * a still otherwise. Both kinds come out of videoTemplates.js in the same
 * shape, so the row (clips) and the "See all" grid (stills) share this.
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
 */
export default function TemplateTile({
  template,
  selected,
  onSelect,
  className = "",
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
      className={`relative overflow-hidden rounded-xl border-2 transition-colors cursor-pointer ${
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
          className="w-full h-full object-cover object-top"
        />
      )}

      {selected && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </span>
      )}
    </button>
  );
}
