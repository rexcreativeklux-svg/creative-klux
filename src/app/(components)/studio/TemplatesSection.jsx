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
//   Templates • Recent Saved Designs • Chat History        Browse all ↗
//   ── full-width rule ─────────────────────────────────────────────
//   │  card  │  card  │  card  │  card  │      ← columns divided by rules
//
// THREE TABS, TWO REAL SOURCES behind them (see templatesApi.js):
//   "Templates"           → the public Scraive template pool, newest first
//                           (default tab)
//   "Recent Saved Designs"→ the active brand's saved designs (token + brand)
//   "Chat History"        → NOTHING YET. The backend has no endpoint for past
//                           chat sessions, so the tab is wired up around
//                           CHAT_HISTORY_STATE (permanently empty) and shows an
//                           empty panel. Nothing is fetched and "Browse all" is
//                           hidden on it, since it has no destination either.
// The two live sources each have their own state slice and their own effect,
// and BOTH load on mount — the pool is one small public request, and
// pre-loading it makes switching tabs instant instead of dropping the user onto
// a skeleton. Rows from either arrive in the same normalized shape, so
// everything below this point is source-agnostic apart from `item.kind`.
//
// The data arrives as full { canvas, elements } layouts, so each card PAINTS the
// design with the shared renderDesignToCanvas() — the same renderer the editor
// and the chat page use — instead of showing the row's `thumbnail`, which is
// only a photo used inside the design and not a preview of it. Painting is
// deferred until a card is near the viewport (see useDesignPreview), so the rail
// sitting below the fold costs nothing until the user scrolls to it.
//
// A card does NOT open anything. Clicking one opens TemplateDetailsModal (its
// footer chip grows into "View details" on hover to say so), and the modal's
// primary button is the only action: a TEMPLATE is copied into the brand's
// designs here in this component (saveTemplate → toast, then `onSaved` so the
// page can move the user on), while a saved DESIGN is handed to the page through
// `onSelect` to open in the editor.
// That same modal is what a `?template=<slug>` share link reopens on load, over
// whichever tab happens to be showing. It does NOT depend on the tab's random
// draw containing that slug — see the "Share links" block below.
//
// The modal's "More like this" strip is fed from these SAME two slices through
// pickRelatedItems(), so browsing sideways from one item to the next costs no
// extra request — a sibling click just re-points `details` at another row.

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ImageIcon,
  LayoutTemplate,
  MessagesSquare,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { renderDesignToThumbnail } from "@/(lib)/design/renderDesign";
import TemplateDetailsModal from "./TemplateDetailsModal";
import {
  CHAT_HISTORY_STATE,
  TAB_CHATS,
  TAB_KLUX,
  TAB_RECENT,
  TEMPLATE_DISPLAY_LIMIT,
  TEMPLATE_TABS,
  fetchPublicTemplates,
  fetchRecentDesigns,
  fetchTemplateBySlug,
  pickRelatedItems,
  readTemplateShareLink,
} from "./templatesApi";

/** The state every source starts in, before its fetch resolves. */
const LOADING_STATE = { status: "loading", items: [] };

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
 * The share link on the current URL — `{ key, hints }` or null. Client-only —
 * used as a lazy useState initializer, so it runs once and returns null during
 * SSR. See readTemplateShareLink() for what the hints carry.
 *
 * @returns {{key: string, hints: object}|null}
 */
function readShareLink() {
  if (typeof window === "undefined") return null;
  return readTemplateShareLink(window.location.search);
}

/** Only paint a colour onto the tile when it really is a CSS colour string. */
const asColor = (value) =>
  typeof value === "string" && /^(#|rgb|hsl)/i.test(value.trim())
    ? value
    : null;

/**
 * @param {object} props
 * @param {(item: object) => void} [props.onSelect]     Open a saved DESIGN —
 *   fired by the details modal's primary button on the Recent tab only.
 *   Templates never reach it; they are saved in place (see saveTemplate).
 * @param {(item: object) => void} [props.onItemMenu]   The card's "…" menu.
 * @param {(tabId: string) => void} [props.onBrowseAll] "Browse all", told which
 *   tab is open so the page can send designs and templates to different routes.
 * @param {(item: object) => void} [props.onSaved]      A TEMPLATE was just
 *   copied into the brand's designs. The home page uses this to send the user to
 *   /creatives, where the new copy is waiting. Optional — see saveTemplate() for
 *   what happens without it.
 */
export default function TemplatesSection({
  onSelect,
  onItemMenu,
  onBrowseAll,
  onSaved,
}) {
  // The brand's designs are per-brand and token-gated; the pool is neither.
  // saveDesign is what "Save to Designs" writes a copied template through.
  const { fetchDesigns, saveDesign, activeBrandId, brandsLoading } = useAuth();

  const [activeTab, setActiveTab] = useState(TEMPLATE_TABS[0].id);
  // One slice per source — see the header note on why both load up front.
  const [templates, setTemplates] = useState(LOADING_STATE);
  const [recent, setRecent] = useState(LOADING_STATE);
  // Bumped per source by "Try again" so a retry re-runs only that one fetch.
  const [kluxReload, setKluxReload] = useState(0);
  const [recentReload, setRecentReload] = useState(0);
  // The open details modal: { item, previewSrc } — previewSrc is the card's own
  // painted preview, handed over so the modal opens with artwork already there.
  const [details, setDetails] = useState(null);
  // `/?template=<slug>&name=…` — read ONCE, lazily, at mount. Straight off
  // window.location rather than useSearchParams() so this client-only nicety
  // can't drag the page into a Suspense boundary; the lazy initializer keeps it
  // out of an effect (no setState-in-effect) and SSR simply reads null.
  const [share, setShare] = useState(readShareLink);
  // The template that link resolved to — see the "Share links" effect below.
  const [sharedItem, setSharedItem] = useState(null);
  // True while a template is being copied into the brand's designs.
  const [saving, setSaving] = useState(false);

  // ── Klux templates ───────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      // No token: the endpoint is public, and staying out of the auth lifecycle
      // means the pool fetches exactly once instead of again when a token lands.
      const next = await fetchPublicTemplates({ signal: controller.signal });
      if (controller.signal.aborted) return;
      setTemplates(next);
    })();

    return () => controller.abort();
  }, [kluxReload]);

  // ── Recent designs ───────────────────────────────────────────────────────
  // Waits for the active brand: it arrives asynchronously (localStorage hydrate
  // → fetchBrands), and calling fetchDesigns() without one only earns a null.
  // While it's still resolving the slice stays in its loading state, which is
  // why the rail shows skeletons rather than flashing "No designs yet".
  useEffect(() => {
    if (!activeBrandId) return;
    let alive = true;

    (async () => {
      const next = await fetchRecentDesigns({ fetchDesigns });
      if (alive) setRecent(next);
    })();

    return () => {
      alive = false;
    };
  }, [activeBrandId, fetchDesigns, recentReload]);

  // ── Share links ──────────────────────────────────────────────────────────
  // A shared link always points at a public template, so it opens over
  // whichever tab the user is on — and it is resolved on its OWN, deliberately
  // NOT by looking the slug up in whatever the Klux tab happened to fetch.
  //
  // That distinction is the whole reliability story. The pool endpoint answers
  // a RANDOM 20 rows out of ~200 and accepts no filters, so a given slug is in
  // any one draw about 1 time in 10 — searching it would leave sharing a coin
  // flip. fetchTemplateBySlug() instead reads the template's own ~2 KB object
  // off the CDN by slug: one request, always the right design, and the rail's
  // random draw stays exactly as random as it was.
  //
  // It runs in parallel with the pool fetch (there's nothing to wait for) and
  // produces the same card contract, so nothing downstream can tell a shared
  // template from a clicked one.
  useEffect(() => {
    if (!share?.key) return;
    const controller = new AbortController();

    (async () => {
      const result = await fetchTemplateBySlug({
        slug: share.key,
        hints: share.hints,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      if (result.status === "ok" && result.item) {
        setSharedItem(result.item);
        return;
      }

      // A deterministic lookup, so a failure here really is a dead link (or a
      // dead network) — worth saying out loud, since the alternative is the
      // recipient landing on the home page with no idea their link did anything.
      console.warn(
        `⚠️ [templates] share link "${share.key}" didn't resolve:`,
        result.messageForDevs,
      );
      toast.error(result.message || "We couldn't open that template.");
    })();

    return () => controller.abort();
  }, [share]);

  // ── What the grid renders ────────────────────────────────────────────────
  // Signed in with no brand at all: there is nothing to fetch, so show the empty
  // state rather than an error the user can't act on.
  const recentState =
    !activeBrandId && !brandsLoading ? { status: "ok", items: [] } : recent;
  // Chat history has no endpoint yet, so its slice is a constant "ok, nothing
  // here" (templatesApi.CHAT_HISTORY_STATE). Reading it as a normal slice means
  // the loading and error paths below need no special case — the empty panel is
  // the only thing that knows this tab is a placeholder.
  const state =
    activeTab === TAB_KLUX
      ? templates
      : activeTab === TAB_CHATS
        ? CHAT_HISTORY_STATE
        : recentState;
  const items = state.items.slice(0, TEMPLATE_DISPLAY_LIMIT);

  /**
   * Reset the ACTIVE tab's slice and re-run only that fetch. Only ever called
   * from the error panel, which the chats tab can't reach — its slice is a
   * constant "ok".
   */
  const retryActiveTab = () => {
    console.log(`🔄 [templates] retrying "${activeTab}"`);
    if (activeTab === TAB_KLUX) {
      setTemplates(LOADING_STATE);
      setKluxReload((key) => key + 1);
    } else {
      setRecent(LOADING_STATE);
      setRecentReload((key) => key + 1);
    }
  };

  // What the modal shows: an explicitly opened card wins over the share link.
  const activeDetails =
    details ?? (sharedItem ? { item: sharedItem, previewSrc: null } : null);

  // ── The modal's "More like this" strip ───────────────────────────────────
  // Picked from rows that are already in hand — nothing extra is fetched, and
  // the pool takes no filters to ask for siblings with anyway (templatesApi
  // header). The source follows the OPEN ITEM, not the active tab: a template
  // pulls from the public pool and a saved design from the brand's own
  // designs, so the strip never offers to open something of a different kind
  // than the button above it acts on. A shared template resolved from a link
  // gets one too, since the pool loads on mount either way.
  //
  // `recent.items` rather than `recentState.items`: the no-brand fallback is a
  // fresh object literal each render, which would re-run this every time.
  const openItem = activeDetails?.item ?? null;
  const relatedItems = useMemo(() => {
    if (!openItem) return [];
    return pickRelatedItems(
      openItem,
      openItem.kind === "design" ? recent.items : templates.items,
    );
  }, [openItem, recent.items, templates.items]);

  /** Forget the URL's template — and cancel its lookup if it's still running. */
  const clearShareLink = () => {
    setShare(null);
    setSharedItem(null);
  };

  /** A card was clicked — show its details, never the template itself. */
  const openDetails = (item, previewSrc) => {
    console.log(`🖼️ [templates] opening details for "${item.title}"`);
    clearShareLink(); // a manual open supersedes the URL's template
    setDetails({ item, previewSrc });
  };

  /** Dismiss the modal — clears BOTH sources or the share link would reopen it. */
  const closeDetails = () => {
    setDetails(null);
    clearShareLink();
  };

  /**
   * Copy a Klux template into the brand's own designs.
   *
   * This does NOT open the editor: saveDesign() writes a new design row (and
   * renders its own stored thumbnail), the user is told with a toast, and then
   * the page is handed the saved item through `onSaved` — which the home page
   * answers by routing to /creatives, so the copy is on screen rather than only
   * described by a toast. Without that prop the rail simply stays put and
   * refreshes its own Recent tab instead, so the copy is still visible.
   *
   * `type` / `sub_type` are sent from the template's own taxonomy so the saved
   * copy lands in the right filter tab on /creatives instead of defaulting to
   * "ads". Both are lowercased raw keys, not the humanized display strings.
   *
   * @param {object} item A normalized template.
   */
  const saveTemplate = async (item) => {
    if (!activeBrandId) {
      console.error("❌ [templates] save blocked — no active brand");
      toast.error("Select a brand before saving a template.");
      return;
    }

    setSaving(true);
    console.log(`💾 [templates] saving "${item.title}" to designs (brand ${activeBrandId})`);

    try {
      const creativeType = (item.designType || "design").toLowerCase();
      const result = await saveDesign(
        activeBrandId,
        [
          {
            name: item.title,
            canvas: item.canvas,
            elements: item.elements,
            category: item.formatKey || "image", // → sub_type
          },
        ],
        creativeType,
      );

      if (!result?.ok) {
        console.error("❌ [templates] save failed:", result?.message);
        toast.error(result?.message || "Couldn't save this template. Please try again.");
        return;
      }

      console.log(`✅ [templates] saved "${item.title}" to designs`);
      toast.success(`"${item.title}" saved to your designs`);
      closeDetails();

      // Hand the page the saved copy. The home page navigates to /creatives on
      // this, so refreshing the rail underneath would only fire a request for a
      // list that is about to unmount — the tab reloads by itself when the user
      // comes back, since leaving remounts this component.
      // The toast survives the route change: sonner's <Toaster> is mounted once
      // in the root layout (app/layout.js), not per page.
      if (onSaved) {
        onSaved(item);
        return;
      }

      // No handler — we're staying here, so pull the fresh list ourselves and
      // the Recent designs tab already has the copy.
      setRecentReload((key) => key + 1);
    } catch (err) {
      console.error("❌ [templates] save threw:", err);
      toast.error("Couldn't save this template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * The modal's primary button. A template is SAVED into the user's designs; a
   * saved design is handed to the page, which opens it in the editor.
   */
  const handleUse = (item) => {
    if (item.kind === "design") {
      closeDetails();
      onSelect?.(item);
      return;
    }
    saveTemplate(item);
  };

  /** Switch source. Both are already loaded, so this is instant. */
  const selectTab = (tabId) => {
    if (tabId === activeTab) return;
    console.log(`🗂️ [templates] switching to "${tabId}"`);
    setActiveTab(tabId);
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
          Below `lg` there's no sidebar to line up with, so it just flows.
          ⚠️ `lg`, not `md` — one of the five places that must agree on where
          the sidebar appears. See the --ck-rail-* note in globals.css. */}
      <div
        className={`flex items-center justify-between gap-4 py-3.5 lg:h-(--ck-rail-row) lg:py-0 ${GUTTER}`}
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
                  onClick={() => selectTab(tab.id)}
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

        {/* Told which tab is open: the brand's designs and the public pool live
            on different routes, so one destination would be wrong half the time.
            Hidden on Chat History — there is no chats route to send anyone to
            yet, and a button that lands on the wrong page is worse than none. */}
        {activeTab !== TAB_CHATS && (
          <button
            type="button"
            onClick={() => onBrowseAll?.(activeTab)}
            className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-gray-600 transition-colors hover:text-gray-900 cursor-pointer"
          >
            Browse all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {state.status === "loading" && <SkeletonGrid />}

      {state.status === "error" && (
        <StatePanel icon={RefreshCw} title={state.message}>
          <button
            type="button"
            onClick={retryActiveTab}
            className="mx-auto mt-3 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </StatePanel>
      )}

      {state.status === "ok" &&
        (items.length === 0 ? (
          <EmptyPanel
            activeTab={activeTab}
            onBrowseTemplates={() => setActiveTab(TAB_KLUX)}
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

      {/* Details modal — the only route from a card into the item itself */}
      <TemplateDetailsModal
        item={openItem}
        previewSrc={activeDetails?.previewSrc ?? null}
        busy={saving}
        related={relatedItems}
        // Same handler a card click uses — a sibling tile simply re-points the
        // open modal at another row, carrying its painted preview across.
        onSelectRelated={openDetails}
        onUse={handleUse}
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
        className="relative aspect-16/10 overflow-hidden rounded-lg border border-gray-200 bg-[#eff6ff8f]"
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

/**
 * "Nothing to show" for whichever tab is open. One per source, because an empty
 * rail means something different on each: the pool is empty only if nothing is
 * published, the user's designs are empty until they save one, and chat history
 * is empty because the feature isn't wired to a backend yet.
 *
 * @param {object} props
 * @param {string} props.activeTab              The open tab's id.
 * @param {() => void} props.onBrowseTemplates  Send the user to the Klux tab.
 */
function EmptyPanel({ activeTab, onBrowseTemplates }) {
  // No endpoint yet — say so plainly rather than implying the user has no
  // chats. Swap this panel for the real grid when the source lands (see the
  // CHAT_HISTORY_STATE note in templatesApi.js).
  if (activeTab === TAB_CHATS) {
    return (
      <StatePanel
        icon={MessagesSquare}
        title="Chat history is on the way"
        body="Your past conversations with the assistant will show up here, ready to pick back up where you left off."
      />
    );
  }

  // Nothing saved yet — point at the pool rather than dead-ending.
  if (activeTab === TAB_RECENT) {
    return (
      <StatePanel
        icon={LayoutTemplate}
        title="No designs yet"
        body="Anything you create and save shows up here. Start from a Klux template if you'd like a head start."
      >
        <button
          type="button"
          onClick={onBrowseTemplates}
          className="mx-auto mt-3 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Browse templates
        </button>
      </StatePanel>
    );
  }

  return (
    <StatePanel
      icon={Sparkles}
      title="No templates to show yet"
      body="Fresh templates land here as soon as they're published — check back shortly."
    />
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
