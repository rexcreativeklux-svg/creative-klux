"use client";

// app/(components)/studio/TemplatesSection.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The template rail below the Studio composer.
//
// Deliberately FULL-BLEED: the page's hero is capped and centred, but this
// section runs edge to edge, so it renders outside the page's max-width wrapper
// and owns its own horizontal padding. The card grid itself is flush to the
// edges and each card carries its own inset padding, which is what lines the
// first card's artwork up with the tab row above it.
//
// Structure:
//   ── full-width rule ─────────────────────────────────────────────
//   Recent designs • Community templates • Klux templates   Browse all ↗
//   ── full-width rule ─────────────────────────────────────────────
//   │  card  │  card  │  card  │  card  │      ← columns divided by rules
//
// ⚠️ THE TAB ROW IS PRESENTATIONAL. There is exactly one templates endpoint
// (see templatesApi.js) and it takes no filters, so every tab shows the same
// fetched pool — switching tabs only moves the active underline. The row is kept
// because the per-tab endpoints are still coming; when they land, give each tab
// its own fetch and this component barely changes.
//
// The data arrives as full { canvas, elements } layouts, so each card PAINTS the
// design with the shared renderDesignToCanvas() — the same renderer the editor
// and the chat page use — instead of showing the row's `thumbnail`, which is
// only a photo used inside the design and not a preview of it. Painting is
// deferred until a card is near the viewport (see useDesignPreview), so the rail
// sitting below the fold costs nothing until the user scrolls to it.
//
// A card does NOT open its template. Clicking anywhere on one opens
// TemplateDetailsModal (its footer chip grows into "View details" on hover to
// say so); only the modal's "Use this template" button calls `onSelect`. That
// same modal is what a `?template=<slug>` deep link reopens on load.

import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ImageIcon,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { renderDesignToThumbnail } from "@/(lib)/design/renderDesign";
import TemplateDetailsModal from "./TemplateDetailsModal";
import {
  TEMPLATE_DISPLAY_LIMIT,
  TEMPLATE_PARAM,
  TEMPLATE_TABS,
  fetchPublicTemplates,
  findTemplateByKey,
} from "./templatesApi";

/** Horizontal padding shared by the tab row and each card's inset. */
const GUTTER = "px-4 sm:px-6";

/** Longest edge, in px, of a painted card preview. Keeps the data URLs small. */
const PREVIEW_MAX_DIM = 480;

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

/**
 * The `?template=<slug>` value on the current URL, or null. Client-only — used
 * as a lazy useState initializer, so it runs once and returns null during SSR.
 * @returns {string|null}
 */
function readDeepLinkKey() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(TEMPLATE_PARAM);
}

/** Only paint a colour onto the tile when it really is a CSS colour string. */
const asColor = (value) =>
  typeof value === "string" && /^(#|rgb|hsl)/i.test(value.trim())
    ? value
    : null;

/**
 * @param {object} props
 * @param {(item: object) => void} [props.onSelect]     Use a template — fired by
 *   the details modal's primary button, never by a card click.
 * @param {(item: object) => void} [props.onItemMenu]   The card's "…" menu.
 * @param {() => void} [props.onBrowseAll]              The "Browse all" link.
 */
export default function TemplatesSection({
  onSelect,
  onItemMenu,
  onBrowseAll,
}) {
  // Presentational only — see the header note. Kept in state so the row still
  // responds to a click the way the finished, per-tab version will.
  const [activeTab, setActiveTab] = useState(TEMPLATE_TABS[0].id);
  const [state, setState] = useState({ status: "loading", items: [] });
  // Bumped by "Try again" to re-run the fetch.
  const [reloadKey, setReloadKey] = useState(0);
  // The open details modal: { item, previewSrc } — previewSrc is the card's own
  // painted preview, handed over so the modal opens with artwork already there.
  const [details, setDetails] = useState(null);
  // `/?template=<slug>` — read ONCE, lazily, at mount. Straight off
  // window.location rather than useSearchParams() so this client-only nicety
  // can't drag the page into a Suspense boundary; the lazy initializer keeps it
  // out of an effect (no setState-in-effect) and SSR simply reads null.
  const [deepLinkKey, setDeepLinkKey] = useState(readDeepLinkKey);
  // Logging guard — the resolution log should fire once, not on every render.
  const deepLinkLogged = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      // No token: the endpoint is public, and staying out of the auth lifecycle
      // means the rail fetches exactly once instead of again when a token lands.
      const next = await fetchPublicTemplates({ signal: controller.signal });
      if (controller.signal.aborted) return;
      setState(next);
    })();

    return () => controller.abort();
  }, [reloadKey]);

  // ── Deep link ────────────────────────────────────────────────────────────
  // A shared link resolves against the WHOLE fetched pool, not just the cards
  // that made the visible cut, so it still opens when its template isn't one of
  // the rendered twelve. Derived rather than stored: the modal below opens on
  // whichever of the two sources is live, and both are cleared on close.
  const deepLinkItem =
    deepLinkKey && state.status === "ok"
      ? findTemplateByKey(state.items, deepLinkKey)
      : null;

  // Report once whether the link resolved — this is the first thing you want in
  // the console when a shared link opens nothing.
  useEffect(() => {
    if (!deepLinkKey || deepLinkLogged.current) return;
    if (state.status !== "ok" || state.items.length === 0) return;

    deepLinkLogged.current = true;
    if (deepLinkItem) {
      console.log(
        `🔗 [templates] deep link "${deepLinkKey}" → opening "${deepLinkItem.title}"`,
      );
    } else {
      console.warn(
        `⚠️ [templates] deep link "${deepLinkKey}" matched no template in the pool`,
      );
    }
  }, [deepLinkKey, deepLinkItem, state]);

  const items = state.items.slice(0, TEMPLATE_DISPLAY_LIMIT);

  // What the modal shows: an explicitly opened card wins over the deep link.
  const activeDetails =
    details ?? (deepLinkItem ? { item: deepLinkItem, previewSrc: null } : null);

  /** A card was clicked — show its details, never the template itself. */
  const openDetails = (item, previewSrc) => {
    console.log(`🖼️ [templates] opening details for "${item.title}"`);
    setDeepLinkKey(null); // a manual open supersedes the URL's template
    setDetails({ item, previewSrc });
  };

  /** Dismiss the modal — clears BOTH sources or the deep link would reopen it. */
  const closeDetails = () => {
    setDetails(null);
    setDeepLinkKey(null);
  };

  /** The modal's primary button — hand the template to the page and close. */
  const useTemplate = (item) => {
    closeDetails();
    onSelect?.(item);
  };

  return (
    <section className="w-full border-t border-gray-200">
      {/* ── Tab row ───────────────────────────────────────────────────────
          On desktop this strip is pinned to --ck-rail-row (see globals.css) —
          the same height as the sidebar's THEME row. Together with the hero
          above being sized to --ck-rail-top, that makes this row's two rules
          (the section's border-t above, the CardGrid's border-t below) land on
          exactly the same screen lines as the two rules bracketing the THEME
          row, so the hairlines run unbroken across the whole window.
          Below `md` there's no sidebar to line up with, so it just flows. */}
      <div
        className={`flex items-center justify-between gap-4 py-3.5 md:h-(--ck-rail-row) md:py-0 ${GUTTER}`}
      >
        <div className="hide-scrollbar flex items-center gap-2.5 overflow-x-auto">
          {TEMPLATE_TABS.map((tab, index) => {
            const active = tab.id === activeTab;
            return (
              <Fragment key={tab.id}>
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 shrink-0 rounded-full bg-blue-600"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={active}
                  className={`shrink-0 whitespace-nowrap text-[13px] transition-colors cursor-pointer ${
                    active
                      ? "font-semibold text-gray-900"
                      : "font-medium text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              </Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onBrowseAll}
          className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-gray-600 transition-colors hover:text-gray-900 cursor-pointer"
        >
          Browse all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {state.status === "loading" && <SkeletonGrid />}

      {state.status === "error" && (
        <StatePanel icon={RefreshCw} title={state.message}>
          <button
            type="button"
            onClick={() => {
              // Drop the stale error first so the grid shows its loading state
              // immediately, then re-run the fetch.
              setState({ status: "loading", items: [] });
              setReloadKey((key) => key + 1);
            }}
            className="mx-auto mt-3 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </StatePanel>
      )}

      {state.status === "ok" &&
        (items.length === 0 ? (
          <StatePanel
            icon={Sparkles}
            title="No templates to show yet"
            body="Fresh templates land here as soon as they're published — check back shortly."
          />
        ) : (
          <CardGrid>
            {items.map((item) => (
              <TemplateCard
                key={item.id}
                item={item}
                onOpenDetails={openDetails}
                onItemMenu={onItemMenu}
              />
            ))}
          </CardGrid>
        ))}

      {/* Details modal — the only route from a card into the template itself */}
      <TemplateDetailsModal
        item={activeDetails?.item ?? null}
        previewSrc={activeDetails?.previewSrc ?? null}
        onUse={useTemplate}
        onClose={closeDetails}
      />
    </section>
  );
}

/**
 * The full-bleed grid. `-mr-px` swallows the right-most column's divider so the
 * rule doesn't hang off the edge of the viewport.
 */
function CardGrid({ children }) {
  return (
    <div className="-mr-px grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}

/**
 * Paint a { canvas, elements } design into a small JPEG data URL, but only once
 * the element is within 300px of the viewport. Returns the ref to attach plus
 * the preview state, so a card below the fold stays free until it's scrolled to.
 *
 * @param {{canvas: object, elements: object[], thumbnail: string|null, title: string}} item
 * @returns {{ref: React.RefObject<HTMLDivElement>, src: string|null, failed: boolean}}
 */
function useDesignPreview(item) {
  const ref = useRef(null);
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

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
          setSrc(dataUrl);
          return;
        }
        // renderDesignToThumbnail swallows its own errors and returns null.
        console.warn(
          `⚠️ [templates] couldn't paint "${item.title}" — falling back`,
        );
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

    // No IntersectionObserver (very old browser / SSR-ish edge): just paint.
    if (typeof IntersectionObserver === "undefined") {
      paint();
      return () => {
        alive = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect(); // one paint per card, ever
        paint();
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);

    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [item]);

  return { ref, src, failed };
}

/** One template card — artwork, title, format, then date + "View details". */
function TemplateCard({ item, onOpenDetails, onItemMenu }) {
  const meta = formatMeta(item.meta);
  const { ref, src, failed } = useDesignPreview(item);
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
        className="relative aspect-16/10 overflow-hidden rounded-lg border border-gray-200 bg-[#c1d5f7]"
        // style={tileColor ? { backgroundColor: tileColor } : undefined}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
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

/** Skeleton cards, laid out in the same grid so nothing shifts on load. */
function SkeletonGrid() {
  return (
    <CardGrid>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={`border-b border-r border-gray-200 py-5 ${GUTTER}`}
        >
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
      ))}
    </CardGrid>
  );
}

/** Shared empty / error panel, centred across the full width. */
function StatePanel({ icon: Icon, title, body, children }) {
  return (
    <div className="border-t border-gray-200 px-5 py-14 text-center">
      <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
        <Icon className="h-4.5 w-4.5 text-blue-600" />
      </span>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {body && (
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">
          {body}
        </p>
      )}
      {children}
    </div>
  );
}
