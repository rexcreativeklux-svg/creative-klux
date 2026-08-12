"use client";

// app/(components)/studio/TemplateDetailsModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The details view for one card on the home rail. A card no longer jumps
// straight into the studio — it opens this, and only the primary button in here
// acts on the item.
//
// It serves BOTH of the rail's tabs, told apart by `item.kind`:
//   "template" → a public Klux template. "Save to Designs" copies it into the
//                brand's own designs and stays put — it deliberately does NOT
//                open an editor. The share links point at a `?template=<slug>`
//                deep link, built by buildTemplateShareQuery() so the recipient
//                can resolve the design exactly (see templatesApi.js).
//   "design"   → one of the user's own saved designs. "Open in editor" goes to
//                /design/<id>; only copy-link and email are offered, because a
//                private design has nothing to say to Facebook or LinkedIn.
//
// Both actions run through the single `onUse` prop — this component stays
// presentational and never touches the API itself; TemplatesSection owns that
// and reports back through `busy`.
//
// Layout (desktop first; the two columns of the top band stack into a
// full-height sheet on small screens):
//
//   ┌──────────────────────────────┬───────────────────────┐
//   │                              │ Title, badges         │
//   │        big preview           │ [ Use this template ] │  ← band scrolls
//   │   (repainted at high res)    │ summary + tags        │    on its own
//   │                              │ Specs …               │
//   │                              │ ■ Share  🔗 ✉ f in    │
//   ├──────────────────────────────┴───────────────────────┤
//   │ ■ More like this                                     │
//   ├──────────────┬──────────────┬────────────────────────┤
//   │     card     │     card     │        card            │  ← peeks on open
//   └──────────────┴──────────────┴────────────────────────┘
//
// "More like this" is a FULL-WIDTH band across the bottom, and it renders the
// very same <TemplateCard> the home rail does — same artwork, same badge, same
// "View details" chip — in the same divided grid. That is deliberate: the card
// lives in TemplateCard.jsx precisely so these two places cannot drift apart.
// There is no author, rating or install count on any of them because no source
// sends those fields (see the note below, and the one in TemplateCard.jsx).
//
// Its three siblings are chosen by pickRelatedItems() from rows the parent
// already holds — the public pool for a template, the brand's own designs for a
// design. Clicking one swaps the modal over to it (`item` changes, everything
// re-derives) and scrolls back to the top, so the band is a browse loop rather
// than a dead end. See the RELATED_WEIGHTS note in templatesApi.js for what
// counts as related, and why a template with no real match still gets cards.
//
// ⚠️ NEITHER SOURCE SENDS PROSE. A row carries only structured fields (format,
// size, orientation, category, design type, pricing, dates) plus the layout
// itself — no description, author, rating or install count. So the summary
// paragraph is WRITTEN HERE from those fields and from the layer mix inside
// `elements`; nothing on this screen is invented. If the backend ever adds a
// real `description`, surface it in place of describeItem()'s output.
//
// The preview is repainted with the shared renderDesignToThumbnail() at a much
// larger `maxDim` than the card uses, because a card-sized data URL blown up to
// half the screen looks soft. The card's own painted preview is passed in as
// `previewSrc` and shown immediately while the crisp one renders, so the modal
// never opens empty.

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Link2, Loader2, Mail, PenLine, Save, X } from "lucide-react";
import { toast } from "sonner";
import { renderDesignToThumbnail } from "@/(lib)/design/renderDesign";
import TemplateCard, { GUTTER, TemplateCardGrid } from "./TemplateCard";
import { buildTemplateShareQuery } from "./templatesApi";

/** Longest edge of the modal's own preview paint. Card previews are 480. */
const PREVIEW_MAX_DIM = 1400;

// ⚠️ THE TOP BAND IS HEIGHT-BOUNDED ON DESKTOP — `lg:h-[min(62vh,540px)]` —
// AND THAT IS LORE-BEARING. The panel is min(88vh,780px), so capping the band
// well under it leaves the "More like this" heading plus the top of the cards
// showing the moment the dialog opens: the band announces itself instead of
// hiding below a fold nobody scrolls to.
//
// The cost is that the details column gets its own `lg:overflow-y-auto` — a
// long spec list can't be allowed to push the band down past the panel edge.
// So on desktop there are two scrollers: the column, and the dialog itself for
// the card band. Below `lg` the columns stack and the whole sheet is one
// scroller, which is why every class involved is `lg:`-prefixed.
//
// Change the cap and the peek changes with it; drop it and the peek is gone.

/** Plural-aware label for one element type, e.g. 3 → "3 text blocks". */
const ELEMENT_LABELS = {
  text: ["text block", "text blocks"],
  image: ["image", "images"],
  shape: ["shape", "shapes"],
  icon: ["icon", "icons"],
  line: ["line", "lines"],
  group: ["group", "groups"],
  table: ["table", "tables"],
  chart: ["chart", "charts"],
};

/** "1080x1350" → "1080 × 1350 px". Falls back to the canvas when absent. */
function formatSize(item) {
  const raw = item.typeSize && String(item.typeSize).trim();
  const match = raw && raw.match(/^(\d+)\s*[x×]\s*(\d+)$/i);
  if (match) return `${match[1]} × ${match[2]} px`;

  const { width, height } = item.canvas || {};
  if (width && height) return `${Math.round(width)} × ${Math.round(height)} px`;
  return raw || null;
}

/** "2026-07-22T14:44:03Z" → "22 Jul 2026". Returns null when unparseable. */
function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Count the layer types in a design and phrase them as a list:
 * "8 text blocks, 4 shapes and 1 image". Unknown types fall back to their own
 * name so a new element type still reads sensibly.
 *
 * @param {object[]} elements
 * @returns {string|null}
 */
function describeLayers(elements) {
  if (!Array.isArray(elements) || elements.length === 0) return null;

  const counts = new Map();
  for (const element of elements) {
    const type = String(element?.type || "layer").toLowerCase();
    counts.set(type, (counts.get(type) || 0) + 1);
  }

  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1]) // biggest group first — it defines the design
    .map(([type, count]) => {
      const [one, many] = ELEMENT_LABELS[type] || [type, `${type}s`];
      return `${count} ${count === 1 ? one : many}`;
    });

  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Write the summary paragraph from the row's real fields — see the header note
 * on why this is generated rather than fetched. Phrasing follows `kind`: a saved
 * design is the user's own work, a template is something to start from.
 *
 * @param {object} item Normalized template or design.
 * @returns {string}
 */
function describeItem(item) {
  const isDesign = item.kind === "design";
  // "Instagram portrait" reads better than "Social"; fall back down the chain.
  const shape = (item.format || item.designType || item.category || "design").toLowerCase();
  const size = formatSize(item);
  const orientation = (item.orientation || "").toLowerCase();

  let opening = isDesign
    ? `Your own ${shape} design`
    : `A ${item.premium ? "premium" : "free"} ${shape} template`;
  if (size) opening += `, sized ${size}`;
  // Only add the orientation when the format hasn't already said it
  // ("Instagram portrait" + "in portrait" reads twice).
  if (orientation && !shape.includes(orientation)) opening += ` in ${orientation}`;
  opening += ".";

  const layers = describeLayers(item.elements);
  const build = layers
    ? ` It's built from ${item.elements.length} editable layers — ${layers}.`
    : "";

  const closing = isDesign
    ? " Open it in the editor to pick up where you left off."
    : " Save it to your designs and every layer is yours to edit — copy, colours and images.";

  return `${opening}${build}${closing}`;
}

/**
 * The labelled spec rows under the summary. Rows with no value are dropped, so
 * a sparser row from the backend simply shows a shorter list.
 *
 * @param {object} item
 * @returns {{label: string, value: string}[]}
 */
function buildSpecs(item) {
  const created = formatDate(item.createdAt);
  const updated = formatDate(item.updatedAt);

  return [
    { label: "Format", value: item.format },
    { label: "Dimensions", value: formatSize(item) },
    { label: "Orientation", value: item.orientation },
    { label: "Category", value: item.category },
    { label: "Design type", value: item.designType },
    // { label: "Media", value: item.mediaType },
    // {
    //   label: "Layers",
    //   value: Array.isArray(item.elements) ? String(item.elements.length) : null,
    // },
    // Only the pool prices its rows; a saved design has no tier, so the row is
    // dropped rather than claiming "Free".
    // { label: "Access", value: item.pricing ? (item.premium ? "Premium" : "Free") : null },
    // { label: "Added", value: created },
    // Only worth a row of its own once it differs from the added date.
    // { label: "Updated", value: updated && updated !== created ? updated : null },
  ].filter((row) => row.value);
}

/** The chips under the summary — the same facts, scannable at a glance. */
function buildTags(item) {
  return [
    item.designType,
    item.format,
    item.orientation,
    item.mediaType,
    item.pricing ? (item.premium ? "Premium" : "Free") : null,
  ].filter((tag, index, all) => tag && all.indexOf(tag) === index);
}

/** Brand marks — lucide dropped its social icons, so these are inline. */
function FacebookIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

function LinkedInIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {object|null} props.item        The template or design to show, in the
 *   normalized card shape (`kind` decides the wording); null closes the modal.
 * @param {string|null} [props.previewSrc] The card's already-painted preview,
 *   shown instantly while the high-res one renders.
 * @param {boolean} [props.busy] The parent is mid-save; the primary button
 *   shows a spinner and stops accepting clicks.
 * @param {object[]} [props.related] Sibling rows for the "More like this"
 *   strip, already picked by the parent (pickRelatedItems). Empty hides it.
 * @param {(item: object, previewSrc: string|null) => void} [props.onSelectRelated]
 *   A sibling card was clicked — the parent re-points `item` at it. The tile's
 *   own painted preview rides along so the swap shows artwork immediately.
 * @param {(item: object) => void} props.onUse   Act on the item (parent decides
 *   whether that means saving a copy or routing somewhere).
 * @param {() => void} props.onClose             Dismiss the modal.
 */
export default function TemplateDetailsModal({
  item,
  previewSrc,
  busy = false,
  related = [],
  onSelectRelated,
  onUse,
  onClose,
}) {
  const panelRef = useRef(null);
  // The dialog's own scroller — the one the card band lives in.
  const scrollRef = useRef(null);
  // The details column's scroller, which is a SEPARATE one on desktop (see the
  // top-band note at the head of this file). Both get reset on a sibling swap.
  const detailsScrollRef = useRef(null);
  // The high-res paint, tagged with the template it belongs to: { key, src }.
  // Tagging (rather than clearing on every open) is what keeps the effect below
  // free of a synchronous setState — a stale paint is filtered out on read.
  const [hiRes, setHiRes] = useState(null);
  const [copied, setCopied] = useState(false);

  // ESC closes, matching every other overlay in the app.
  useEffect(() => {
    if (!item) return;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  // Move focus into the dialog so keyboard users aren't left behind on the card.
  useEffect(() => {
    if (item) panelRef.current?.focus();
  }, [item]);

  // A "More like this" click swaps `item` without unmounting the panel, and the
  // band lives at the BOTTOM of the dialog — so without this the reader would
  // stay parked on the cards, never seeing the item they just opened. BOTH
  // scrollers are reset: the dialog's, and the details column's, which would
  // otherwise open the new item halfway down its specs. Jumping (not
  // smooth-scrolling) matches the instant content swap — an animated scroll
  // would just chase it.
  useEffect(() => {
    if (!item) return;
    scrollRef.current?.scrollTo({ top: 0 });
    detailsScrollRef.current?.scrollTo({ top: 0 });
  }, [item]);

  // Repaint the design large. The card's low-res preview holds the space until
  // this lands, so there's no flash of empty panel.
  useEffect(() => {
    if (!item) return;
    let alive = true;

    (async () => {
      try {
        const dataUrl = await renderDesignToThumbnail(
          { canvas: item.canvas, elements: item.elements },
          { maxDim: PREVIEW_MAX_DIM, quality: 0.92 },
        );
        if (!alive) return;
        if (dataUrl) setHiRes({ key: item.id, src: dataUrl });
        else console.warn(`⚠️ [template-details] couldn't paint "${item.title}" large`);
      } catch (err) {
        if (alive) console.error("❌ [template-details] preview failed:", err);
      }
    })();

    return () => {
      alive = false;
    };
  }, [item]);

  // What a share link points at. A template gets the home-page deep link that
  // reopens this modal; a saved design gets its editor URL, which is the only
  // address it actually has (and only opens for the brand's own members).
  //
  // The template link carries more than the slug — see SHARE_PARAM_* in
  // templatesApi.js. The recipient resolves the design itself from the CDN by
  // slug (always exact), and those extra params supply the few things that
  // object doesn't hold: the title, and the taxonomy that decides where their
  // saved copy is filed.
  const shareUrl = useMemo(() => {
    if (!item || typeof window === "undefined") return "";
    if (item.kind === "design") {
      return `${window.location.origin}${item.href || `/design/${item.id}`}`;
    }
    return `${window.location.origin}${window.location.pathname}?${buildTemplateShareQuery(item)}`;
  }, [item]);

  const specs = useMemo(() => (item ? buildSpecs(item) : []), [item]);
  const tags = useMemo(() => (item ? buildTags(item) : []), [item]);
  const summary = useMemo(() => (item ? describeItem(item) : ""), [item]);

  if (!item) return null;

  const isDesign = item.kind === "design";
  const noun = isDesign ? "design" : "template";

  // Ignore a paint left over from the previously opened template.
  const hiResSrc = hiRes?.key === item.id ? hiRes.src : null;
  const src = hiResSrc || previewSrc || item.thumbnail || null;

  /** Copy the link, with a short confirmation on the button itself. */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(isDesign ? "Design link copied" : "Template link copied");
      console.log("🔗 [template-details] copied link:", shareUrl);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("❌ [template-details] clipboard write failed:", err);
      toast.error("Couldn't copy the link — copy it from the address bar instead.");
    }
  };

  /** Open a network's share dialog in a new tab. */
  const openShare = (network, url) => {
    console.log(`🔗 [template-details] sharing "${item.title}" → ${network}`);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(
      `${isDesign ? "Design" : "Template"}: ${item.title}`,
    );
    const body = encodeURIComponent(
      `${isDesign ? "Here's my design on Creative Klux" : "Thought you'd like this template on Creative Klux"}:\n\n${item.title}\n${shareUrl}`,
    );
    console.log(`🔗 [template-details] sharing "${item.title}" → email`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleUse = () => {
    if (busy) return;
    console.log(
      `${isDesign ? "🖼️" : "💾"} [template-details] ${isDesign ? "opening" : "saving"} ${noun} "${item.title}"`,
    );
    onUse?.(item);
  };

  const shareActions = [
    {
      key: "link",
      // The icon doubles as the confirmation — it flips to a tick for 2s after
      // a successful copy, so the action needs no extra chrome to acknowledge.
      label: copied ? "Link copied" : "Copy link",
      icon: copied ? Check : Link2,
      onClick: handleCopyLink,
    },
    { key: "email", label: "Share by email", icon: Mail, onClick: handleEmail },
    // Social sharing is for the public pool only — a saved design's link opens
    // for nobody outside the brand, so posting it would be a dead end.
    ...(isDesign
      ? []
      : [
          {
            key: "facebook",
            label: "Share on Facebook",
            icon: FacebookIcon,
            onClick: () =>
              openShare(
                "facebook",
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
              ),
          },
          {
            key: "linkedin",
            label: "Share on LinkedIn",
            icon: LinkedInIcon,
            onClick: () =>
              openShare(
                "linkedin",
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
              ),
          },
        ]),
  ];

  return (
    // Backdrop. Full-bleed sheet below sm; a centred dialog from sm up.
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-details-title"
        onClick={(event) => event.stopPropagation()}
        // The home hero's entrance utility, sped up: 0.7s is right for a page
        // settling in, far too slow for a dialog answering a click. Its
        // reduced-motion override in globals.css still applies.
        style={{ animationDuration: "0.28s" }}
        className="animate-hero-in relative flex h-full w-full flex-col overflow-hidden bg-surface shadow-2xl outline-none sm:h-[min(88vh,780px)] sm:max-w-6xl sm:rounded-lg"
      >
        {/* Close — sits over the panel's top-right corner on every breakpoint */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close template details"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface/80 text-gray-500 backdrop-blur-sm transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* The dialog's scroller — it carries the top band and the card band
            below it, and on mobile it is the only scroller there is. */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          {/* ── Top band: preview + details ───────────────────────────────
              Height-bounded on desktop so the card band always peeks — see the
              note at the top of this file. Below `lg` it just stacks and
              flows. */}
          <div className="flex flex-col lg:h-[min(62vh,540px)] lg:flex-row">
            {/* ── Preview ───────────────────────────────────────────────
                Capped on mobile so the details below always have room; fills
                the band's full height on desktop. */}
            <div className="relative flex h-[38vh] shrink-0 items-center justify-center bg-page p-4 sm:h-[42vh] lg:h-full lg:min-h-0 lg:flex-1 lg:p-8">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={item.title}
                  className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Painting preview…</span>
                </div>
              )}
            </div>

            {/* ── Details column ────────────────────────────────────────
                Scrolls WITHIN the band on desktop: however long the specs
                run, they can't push the card band below the panel's edge and
                cost it its peek. On mobile it simply flows into the sheet. */}
            <div
              ref={detailsScrollRef}
              className="w-full border-t border-gray-200 px-5 py-6 sm:px-6 lg:h-full lg:w-100 lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-t-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* Title + badges */}
              <h2
                id="template-details-title"
                className="pr-8 text-xl font-bold leading-snug tracking-tight text-gray-900"
              >
                {item.title}
              </h2>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {/* Templates carry a tier; a saved design is simply the user's. */}
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    item.premium
                      ? "bg-gray-900 text-surface"
                      : "bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {isDesign ? "Your design" : item.premium ? "Premium" : "Free"}
                </span>
                {item.format && (
                  <span className="text-[13px] text-gray-500">{item.format}</span>
                )}
                {formatSize(item) && (
                  <>
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gray-300" />
                    <span className="text-[13px] text-gray-500">{formatSize(item)}</span>
                  </>
                )}
              </div>

              {/* Primary action. A design opens; a template is copied into the
                  user's designs and the modal reports back with a toast. */}
              <button
                type="button"
                onClick={handleUse}
                disabled={busy}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : isDesign ? (
                  <>
                    <PenLine className="h-4 w-4" />
                    Open in editor
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save to Designs
                  </>
                )}
              </button>

              {/* Summary — generated from the row's fields (see header note) */}
              <p className="mt-5 text-[13.5px] leading-relaxed text-gray-600">{summary}</p>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-gray-200 px-2 py-1 text-[11.5px] font-medium text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Specs */}
              {specs.length > 0 && (
                <div className="mt-6">
                  <h3 className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
                    <span aria-hidden="true" className="h-2 w-2 bg-blue-600" />
                    Specs
                  </h3>
                  <dl className="mt-3 divide-y divide-gray-200 border-t border-gray-200">
                    {specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="flex items-baseline justify-between gap-4 py-2.5"
                      >
                        <dt className="text-[13px] text-gray-500">{spec.label}</dt>
                        <dd className="text-right text-[13px] font-medium text-gray-900">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* ── Share ───────────────────────────────────────────────
                  In the column's flow now rather than pinned to its bottom
                  edge: the dialog scrolls as one page, so there is no fixed
                  edge left to pin anything to. */}
              <div className="mt-7 border-t border-gray-200 pt-5">
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
                  <span aria-hidden="true" className="h-2 w-2 bg-blue-600" />
                  Share
                </h3>
                <div className="mt-3 flex items-center gap-2">
                  {shareActions.map(({ key, label, icon: Icon, onClick }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={onClick}
                      aria-label={label}
                      title={label}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── More like this ─────────────────────────────────────────────
              A full-width band under both columns, rendering the SAME
              <TemplateCard> as the home rail in the SAME divided grid — see
              the diagram at the top of this file. Three siblings, so the grid
              tops out at three columns instead of the rail's four.

              The grid pulls itself a hairline past its own box on two edges —
              `-mr-px` to swallow the right-most column's divider, `-mb-px` to
              swallow the last row's, which would otherwise land just above the
              panel's rounded bottom edge. ANY scroller above such a grid
              answers that 1px with a horizontal scrollbar, so whoever hosts one
              has to clip it — this band with `overflow-hidden`, the home rail
              with `overflow-x-clip`. (The rail went without for a while on the
              theory that the overhang spilled onto the page harmlessly. It does
              not: the dashboard's scroll frame is `overflow-y-auto`, and CSS
              resolves the other axis from `visible` to `auto`, so the whole
              home page scrolled sideways by a hairline.)

              A card here paints itself lazily, exactly as it does in the rail:
              the band opens below the fold, and its previews render as the
              reader scrolls down to them. */}
          {related.length > 0 && (
            <div className="overflow-hidden border-t border-gray-200">
              <div className={`flex items-center py-4 ${GUTTER}`}>
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
                  <span aria-hidden="true" className="h-2 w-2 bg-blue-600" />
                  More like this
                </h3>
              </div>

              <TemplateCardGrid
                columns="sm:grid-cols-2 lg:grid-cols-3"
                className="-mb-px"
              >
                {related.map((relatedItem) => (
                  // No `onItemMenu`: there is nothing to manage from inside a
                  // dialog, and omitting it drops the "…" button entirely.
                  // onSelectRelated takes (item, previewSrc) — the same shape
                  // the rail's own card click uses, so the painted preview
                  // rides across into the modal it re-points.
                  <TemplateCard
                    key={relatedItem.id}
                    item={relatedItem}
                    onOpenDetails={onSelectRelated}
                  />
                ))}
              </TemplateCardGrid>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
