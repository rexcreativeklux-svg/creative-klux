"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// The preset rows on the Product Studio landing page: a horizontally scrolling
// strip of tiles, plus the Photo Editing Classics treatment tile. The other
// tiles are drawn from their presets by StudioPresetTile.

/**
 * A horizontal strip with chevrons.
 *
 * Scrolling sideways is right HERE (unlike a table) — these are short,
 * homogeneous rows of thumbnails where "there is more to the side" reads
 * instantly. -mx/px keeps the strip bleeding to the screen edge so the last
 * tile is visibly cut rather than looking like the end of the list.
 */
/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {(overflowing: boolean) => void} [props.onOverflowChange] Told whether
 *   the row is wider than its box — i.e. whether there is anything to scroll to
 *   at all. The history shelves use it to drop their "See all" on a row that is
 *   already showing everything, where the link would point at nothing new.
 *
 *   ⚠️ FIRED ONLY WHEN THE ANSWER CHANGES. `measure` runs on every scroll event,
 *   and a callback on each of those would re-render the parent through a drag.
 */
export function PresetStrip({ children, className = "", onOverflowChange }) {
  const ref = useRef(null);
  // Which directions have anything left to scroll to. A chevron pointing at
  // nothing is worse than no chevron: it reads as "there is more" on a row
  // like Classics, where four tiles fit and there is not.
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  // The latest callback, without it becoming a dependency of `measure` — an
  // inline arrow from the parent would otherwise rebuild the measurer (and tear
  // down its listeners) on every render. Same pattern as useMicRecorder's.
  const overflowCbRef = useRef(onOverflowChange);
  useEffect(() => {
    overflowCbRef.current = onOverflowChange;
  }, [onOverflowChange]);
  const wasOverflowingRef = useRef(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // 4px slack: sub-pixel layout leaves scrollLeft a hair off either end.
    setCanScroll({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });

    const overflowing = max > 4;
    if (wasOverflowingRef.current !== overflowing) {
      wasOverflowingRef.current = overflowing;
      overflowCbRef.current?.(overflowing);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    // Tiles are lazy-loaded, so scrollWidth grows AFTER mount — a ResizeObserver
    // on the scroller never sees that (its own box does not change). Capturing
    // `load` does, since load fires on each <img> but does not bubble.
    el.addEventListener("load", measure, true);
    const ro = new ResizeObserver(measure); // viewport / sidebar changes
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      el.removeEventListener("load", measure, true);
      ro.disconnect();
    };
  }, [measure]);

  const scrollBy = (dir) =>
    ref.current?.scrollBy({ left: dir * 420, behavior: "smooth" });

  return (
    <div className={`group relative ${className}`}>
      <div
        ref={ref}
        // -my/py and lg:-mx/px: room for a hovered tile to scale up without
        // the scroller (which clips on both axes) shaving its edges.
        className="flex gap-3 overflow-x-auto hide-scrollbar -mx-gutter px-gutter -my-2 py-2 lg:-mx-2 lg:px-2"
      >
        {children}
      </div>

      {/* Pointer affordance only — tabbing through the tiles already scrolls
          the strip, so the chevrons are noise for keyboard and screen readers.
          Hidden below `sm`, where there is no hover and the row is swiped. */}
      {[-1, 1]
        // Dropped from the tree entirely when there is nothing that way, rather
        // than hidden with a class — `hidden sm:flex` plus a conditional
        // `sm:hidden` would come down to which utility Tailwind emitted last.
        .filter((dir) => (dir < 0 ? canScroll.left : canScroll.right))
        .map((dir) => (
          <button
            key={dir}
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => scrollBy(dir)}
            className={`hidden sm:flex absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface border border-gray-200 shadow-sm items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-300 transition cursor-pointer opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto ${
              dir < 0 ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
            }`}
          >
            {dir < 0 ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ))}
    </div>
  );
}

/**
 * One Photo Editing Classics tile. Most treatments are a single CSS filter;
 * two are not, and are composited here instead:
 *  • motion — three copies offset along x, which is the only way to get a
 *    DIRECTIONAL smear (filter: blur() is radial and reads as out-of-focus).
 *  • splash — a grey base with the full-colour frame masked back in over the
 *    subject, since "desaturate everything except the subject" has no filter.
 */
export function FilterTile({ img, filter, kind, className = "" }) {
  if (kind === "motion") {
    return (
      <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
        {[-4, 0, 4].map((dx) => (
          <img
            key={dx}
            src={img}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: `translateX(${dx}px)`,
              opacity: dx === 0 ? 1 : 0.45,
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>
    );
  }

  if (kind === "splash") {
    const mask = "radial-gradient(circle at 62% 45%, #000 0 32%, transparent 62%)";
    return (
      <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
        <img
          src={img}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "grayscale(1) contrast(1.05)" }}
        />
        <img
          src={img}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "saturate(1.6)",
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-gray-100 ${className}`}>
      <img
        src={img}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover"
        style={{ filter }}
      />
    </div>
  );
}

