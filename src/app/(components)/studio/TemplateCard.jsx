"use client";

// app/(components)/studio/TemplateCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// THE card for a template or a saved design, plus the grid chrome that goes
// around it. Lifted out of TemplatesSection so the details modal's "More like
// this" band renders the exact same card as the home rail does — one component,
// one look, one place to change it.
//
// Two consumers today:
//   · TemplatesSection   → the full-bleed rail under the home composer
//                          (1 / 2 / 3 / 4 columns, plus the "…" item menu)
//   · TemplateDetailsModal → the full-width "More like this" band at the
//                          bottom of the dialog (3 columns, no item menu)
//
// Both feed it the SAME normalized row shape that templatesApi.js produces, so
// the card never branches on where a row came from.
//
// ⚠️ WHAT THE CARD CAN SHOW IS CAPPED BY THE DATA. Neither source sends an
// author, a rating, an install count or a price — only structured fields
// (format, size, orientation, category, design type, the Free/Premium tier and
// dates). So the card shows the tier badge, the title, its subtitle and a
// date + "View details" affordance; there is no author line or star rating to
// render, and nothing here is invented. If the backend ever starts sending
// those, this is the single file that has to grow.
//
// A card does NOT open the item. Clicking one calls `onOpenDetails(item, src)`
// — the parent opens TemplateDetailsModal, and the card's already-painted
// preview rides along so the modal shows artwork instead of a spinner.

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ImageIcon, MoreHorizontal } from "lucide-react";
import { renderDesignToThumbnail } from "@/(lib)/design/renderDesign";

/**
 * Horizontal padding shared by a card's inset and by whatever heading row sits
 * above the grid — it is what lines the first card's artwork up with the row
 * above it. Exported so both consumers pad their headings identically.
 */
export const GUTTER = "px-4 sm:px-6";

/** Longest edge, in px, of a painted card preview. Keeps the data URLs small. */
const PREVIEW_MAX_DIM = 480;

/** The rail's column ramp. The modal's band passes its own three-up ramp. */
const DEFAULT_COLUMNS = "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

/** Relative-ish date label for a card's footer. */
function formatMeta(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

/** Only paint a colour onto the tile when it really is a CSS colour string. */
const asColor = (value) =>
  typeof value === "string" && /^(#|rgb|hsl)/i.test(value.trim())
    ? value
    : null;

/**
 * The grid the cards sit in — columns divided by rules, exactly like the rail.
 *
 * `-mr-px` swallows the right-most column's divider so the rule doesn't hang
 * off the edge of the container. Pass `className="-mb-px"` to do the same to
 * the last row's bottom rule when the grid ends flush against a panel edge
 * (which is what the details modal does).
 *
 * ⚠️ A NEGATIVE MARGIN MAKES THIS BOX WIDER THAN ITS PARENT — used width is the
 * containing block MINUS the margins, so -1px on the right puts the grid 1px
 * past the right edge. THE CALLER MUST CLIP IT. Every scroller above an
 * unclipped one of these answers that hairline with a horizontal scrollbar,
 * and it does not have to be an obvious scroller: a box that only asks for
 * `overflow-y-auto` still scrolls in x, because CSS resolves the other axis
 * from `visible` to `auto`. That is exactly how the home page came to slide
 * sideways. Both hosts clip today — TemplatesSection with `overflow-x-clip`,
 * TemplateDetailsModal's band with `overflow-hidden`.
 *
 * @param {object} props
 * @param {string} [props.columns]   Responsive column classes. Defaults to the
 *   rail's 1 → 2 → 3 → 4 ramp.
 * @param {string} [props.className] Extra classes for the grid itself.
 */
export function TemplateCardGrid({
  columns = DEFAULT_COLUMNS,
  className = "",
  children,
}) {
  return (
    <div
      className={`-mr-px grid grid-cols-1 border-t border-gray-200 ${columns} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * One placeholder card, laid out with the same rhythm as the real one so
 * nothing shifts when the data lands. Drop it inside a TemplateCardGrid.
 */
export function TemplateCardSkeleton() {
  return (
    <div className={`border-b border-r border-gray-200 py-5 ${GUTTER}`}>
      <div className="aspect-16/10 animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-3.5 space-y-2">
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}

/**
 * Get a preview for a row, but only once the element is within 300px of the
 * viewport. Returns the ref to attach plus the preview state, so a card below
 * the fold stays free until it's scrolled to.
 *
 * TWO SOURCES, AND WHICH ONE IS RIGHT DEPENDS ON `kind`:
 *
 *   · A SAVED DESIGN's `thumbnail` is a true preview of the whole design — the
 *     editor writes one at full canvas size on every save. Use it directly and
 *     skip the repaint: no font loading, no per-image proxy round trip, and the
 *     card fills from cache on a second visit.
 *   · A TEMPLATE's `thumbnail` is NOT that. It is the URL of one photo used
 *     INSIDE the layout (see templatesApi.js's header), so trusting it here
 *     would put a bare stock photo on the card where the design should be.
 *     Templates therefore still paint `canvas`/`elements` themselves.
 *
 * A stored preview that 404s or is CORS-blocked falls through to painting, so a
 * dead CDN link costs a repaint rather than showing a broken tile.
 *
 * This works just as well inside the details modal's own scroller: an
 * IntersectionObserver clips against every scrolling ancestor, so a card in the
 * band below the dialog's fold paints when the reader scrolls down to it.
 *
 * @param {{kind: string, canvas: object, elements: object[], thumbnail: string|null, title: string}} item
 * @returns {{ref: React.RefObject<HTMLDivElement>, src: string|null, failed: boolean, onSrcError: () => void}}
 */
function useDesignPreview(item) {
  const ref = useRef(null);
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  // Whether `src` is the row's stored URL rather than something painted here —
  // it decides what an <img> load error means (repaint vs give up).
  const storedRef = useRef(false);
  // Lets the error handler re-run the effect's painter without re-running the
  // whole effect (which would re-observe and re-decide the source).
  const paintRef = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let alive = true;

    const paint = async () => {
      try {
        const dataUrl = await renderDesignToThumbnail(
          { canvas: item.canvas, elements: item.elements },
          { maxDim: PREVIEW_MAX_DIM },
        );
        if (!alive) return;

        if (dataUrl) {
          storedRef.current = false;
          setSrc(dataUrl);
          return;
        }
        // renderDesignToThumbnail swallows its own errors and returns null.
        console.warn(
          `⚠️ [templates] couldn't paint "${item.title}" — falling back`,
        );
        // Last resort, so mark it NOT stored: painting has already failed once,
        // and treating a failure here as "repaint" would loop forever.
        storedRef.current = false;
        if (item.thumbnail) setSrc(item.thumbnail);
        else setFailed(true);
      } catch (err) {
        if (!alive) return;
        console.error(
          `❌ [templates] preview failed for "${item.title}":`,
          err,
        );
        setFailed(true);
      }
    };
    paintRef.current = paint;

    const show = () => {
      if (item.kind === "design" && item.thumbnail) {
        storedRef.current = true;
        setSrc(item.thumbnail);
        return;
      }
      paint();
    };

    // No IntersectionObserver (very old browser / SSR-ish edge): just show.
    if (typeof IntersectionObserver === "undefined") {
      show();
      return () => {
        alive = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect(); // one resolve per card, ever
        show();
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);

    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [item]);

  /** The <img> wouldn't load: repaint if that was a stored URL, else give up. */
  const onSrcError = () => {
    if (!storedRef.current) {
      setFailed(true);
      return;
    }
    console.warn(`⚠️ [templates] stored preview failed for "${item.title}" — repainting`);
    storedRef.current = false;
    setSrc(null);
    paintRef.current?.();
  };

  return { ref, src, failed, onSrcError };
}

/**
 * One template card — artwork, title, format, then date + "View details".
 *
 * @param {object} props
 * @param {object} props.item  A normalized template or design row.
 * @param {(item: object, previewSrc: string|null) => void} [props.onOpenDetails]
 *   Clicked (or Enter/Space). The painted preview rides along.
 * @param {(item: object) => void} [props.onItemMenu] The "…" menu. OMIT IT and
 *   the button isn't rendered at all — which is what the details modal does,
 *   since there is nothing to manage from inside a dialog.
 */
export default function TemplateCard({ item, onOpenDetails, onItemMenu }) {
  const meta = formatMeta(item.meta);
  const { ref, src, failed, onSrcError } = useDesignPreview(item);
  // The design's own background fills the letterbox around the contained
  // preview, so a portrait template reads as artwork rather than a crop.
  const tileColor = asColor(item.canvas?.background);

  // The card's painted preview rides along so the modal opens showing artwork
  // while it repaints the same design at full size.
  const open = () => onOpenDetails?.(item, src);

  return (
    // A div rather than a button: the "…" menu is itself a button, and nesting
    // buttons is invalid HTML. Keyboard support is wired up by hand instead.
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      aria-label={`View details for ${item.title}`}
      className={`group flex cursor-pointer flex-col border-b border-r border-gray-200 py-5 transition-colors hover:bg-gray-100/60 focus:outline-none focus-visible:bg-gray-100/60 ${GUTTER}`}
    >
      {/* Artwork */}
      <div
        ref={ref}
        className="relative aspect-16/10 overflow-hidden rounded-lg border border-gray-200 bg-[#eff6ff8f]"
        // style={tileColor ? { backgroundColor: tileColor } : undefined}
      >
        {src ? (
          <>
            {/* Backdrop: the SAME painted data URL, zoomed and blurred, so the
                letterbox around a portrait template is filled with the design's
                own colours instead of a flat plate. `src` is a data URL (or a
                cached thumbnail), so painting it twice costs no extra fetch.
                `scale-125` overshoots the frame by more than the blur radius at
                every card width — that overshoot is what stops a soft rim from
                showing along the edges. aria-hidden: it is the picture below.

                Full-bleed `object-cover` was tried here and reverted: cropping a
                1080×1350 portrait to the 16:10 tile cut away too much of the
                design to be worth losing the letterbox. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute inset-0 h-full w-full scale-125 select-none object-cover opacity-60 blur-lg"
            />
            {/* The design itself — `relative` so it paints ABOVE the absolutely
                positioned backdrop, which would otherwise cover a static
                sibling. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={item.title}
              loading="lazy"
              onError={onSrcError}
              className="relative h-full w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </>
        ) : failed ? (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-5 w-5 text-gray-400" />
          </div>
        ) : (
          // Still painting — a calm shimmer in the tile's own colour.
          <div className="h-full w-full animate-pulse bg-gray-200/60" />
        )}

        {/* text-surface, NOT text-white: gray-900 flips to near-white in dark
            mode, so white-on-white made this badge disappear. surface inverts
            with it, so the chip stays legible in both themes. */}
        {item.premium && (
          <span className="absolute left-2 top-2 rounded-md bg-gray-900/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface backdrop-blur-sm">
            Premium
          </span>
        )}
      </div>

      {/* Title + format */}
      <div className="mt-3.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-gray-900">
            {item.title}
          </p>
          {item.subtitle && (
            <p className="mt-0.5 truncate text-[13px] text-gray-500">
              {item.subtitle}
            </p>
          )}
        </div>

        {onItemMenu && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation(); // don't also open the card
              onItemMenu(item);
            }}
            aria-label={`More options for ${item.title}`}
            className="-mr-1 shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Footer: date + "View details" affordance ─────────────────────────
          One pill, two states. At rest it's the 32px arrow chip; on hover (or
          keyboard focus) the label unrolls to its left and the chip grows into
          a button, so the card says what a click does before you click it.
          It is NOT a <button>: the whole card already opens the details modal,
          and a real button in here would nest an interactive element inside a
          role="button" div for no extra behaviour.
          Below `md` there is no hover to give, so the label is simply always
          out — a single-column card has room for it.
          gray-900 / surface invert together, so this reads as a dark chip in
          light mode and a light one in dark mode without a second rule. */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="truncate text-[13px] text-gray-500">{meta}</span>
        <span
          aria-hidden="true"
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 pl-3 text-surface transition-all duration-300 ease-out md:gap-0 md:pl-0 md:group-hover:gap-1.5 md:group-hover:pl-3 md:group-focus-visible:gap-1.5 md:group-focus-visible:pl-3"
        >
          <span className="max-w-28 overflow-hidden whitespace-nowrap text-[13px] font-medium opacity-100 transition-all duration-300 ease-out md:max-w-0 md:opacity-0 md:group-hover:max-w-28 md:group-hover:opacity-100 md:group-focus-visible:max-w-28 md:group-focus-visible:opacity-100">
            View details
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            <ArrowRight className="h-4 w-4" />
          </span>
        </span>
      </div>
    </div>
  );
}
