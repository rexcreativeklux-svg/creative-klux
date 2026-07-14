import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Horizontal "Recent uploads" strip (Photoroom parity). Thumbnails scroll
// sideways; the left/right chevrons only appear on hover AND only when there's
// actually room to scroll that direction. A "See all" link opens the full panel.
//
// Presentational + reusable: the parent owns the images and what a pick does.
//   images     — [{ id, src, alt }]
//   selectedSrc— currently-applied src (ring highlight), optional
//   onSelect   — (src) => void
//   onSeeAll   — () => void   (opens the full RecentUploadsPanel)
export default function RecentUploadsCarousel({
  images = [],
  selectedSrc = null,
  onSelect,
  onSeeAll,
  title = "Recent uploads",
}) {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Measure scroll position to decide which arrows to show. Runs off scroll +
  // ResizeObserver events (both async), so no synchronous setState-in-effect.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    const update = () => {
      setCanLeft(el.scrollLeft > 1);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [images.length]);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  if (!images.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600">{title}</p>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            See all
          </button>
        )}
      </div>

      {/* group → arrows fade in on hover; hidden entirely when not scrollable */}
      <div className="relative group">
        {canLeft && (
          <button
            onClick={() => scrollBy(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-surface shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
        )}
        {canRight && (
          <button
            onClick={() => scrollBy(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-surface shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>
        )}

        <div
          ref={scrollerRef}
          className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img) => {
            const active = selectedSrc && selectedSrc === img.src;
            return (
              <button
                key={img.id}
                onClick={() => onSelect?.(img.src)}
                className={`shrink-0 w-[92px] h-[92px] rounded-lg overflow-hidden border cursor-pointer bg-gray-100 ${
                  active
                    ? "ring-2 ring-blue-500 border-transparent"
                    : "border-gray-200 hover:border-blue-400"
                }`}
              >
                <img
                  src={img.src}
                  alt={img.alt || ""}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
