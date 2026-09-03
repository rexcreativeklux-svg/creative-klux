"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontal template shelf with hover arrows that hide at the ends.
 *
 * Shared by the Video Generator (clips) and Product Staging (scene photos) so
 * both shelves scroll, size and reveal their arrows identically — the tools
 * differ in what they put in the row, never in how the row behaves.
 *
 * The arrows only appear on hover and only on the side there is more to see, so
 * a shelf that fits entirely on screen shows no chrome at all.
 */
export default function TemplateRow({ children }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Children arrive asynchronously (a Pexels fetch, or just more tiles), and
  // the arrows are derived from scrollWidth — so re-measure when the content
  // changes, not only on mount, or a filled shelf keeps a stale "no arrows".
  useEffect(update, [children]);

  const scroll = (dir) =>
    ref.current?.scrollBy({ left: dir * 200, behavior: "smooth" });

  return (
    <div className="relative group/row">
      <div ref={ref} className="flex gap-2 overflow-x-auto hide-scrollbar">
        {children}
      </div>
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
