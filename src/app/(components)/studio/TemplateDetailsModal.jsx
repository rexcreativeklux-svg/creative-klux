"use client";

// app/(components)/studio/TemplateDetailsModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The details view for one template card on the home rail. A card no longer
// jumps straight into the studio — it opens this, and only the primary button
// in here actually uses the template.
//
// Layout (desktop first, two columns; stacks into a full-height sheet on small
// screens):
//
//   ┌──────────────────────────────┬───────────────────────┐
//   │                              │ Title, badges         │  ← scrolls
//   │        big preview           │ [ Use this template ] │
//   │   (repainted at high res)    │ summary + tags        │
//   │                              │ Specs …               │
//   │                              ├───────────────────────┤
//   │                              │ ■ Share  🔗 ✉ f in    │  ← pinned
//   └──────────────────────────────┴───────────────────────┘
//
// ⚠️ THE ENDPOINT SENDS NO PROSE. A row carries only structured fields (format,
// size, orientation, category, design type, pricing, dates) plus the layout
// itself — no description, author, rating or install count. So the summary
// paragraph is WRITTEN HERE from those fields and from the layer mix inside
// `elements`; nothing on this screen is invented. If the backend ever adds a
// real `description`, surface it in place of describeTemplate()'s output.
//
// The preview is repainted with the shared renderDesignToThumbnail() at a much
// larger `maxDim` than the card uses, because a card-sized data URL blown up to
// half the screen looks soft. The card's own painted preview is passed in as
// `previewSrc` and shown immediately while the crisp one renders, so the modal
// never opens empty.

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Link2, Loader2, Mail, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { renderDesignToThumbnail } from "@/(lib)/design/renderDesign";
import { TEMPLATE_PARAM } from "./templatesApi";

/** Longest edge of the modal's own preview paint. Card previews are 480. */
const PREVIEW_MAX_DIM = 1400;

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
 * on why this is generated rather than fetched.
 *
 * @param {object} item Normalized template.
 * @returns {string}
 */
function describeTemplate(item) {
  const tier = item.premium ? "premium" : "free";
  // "Instagram portrait" reads better than "Social"; fall back down the chain.
  const kind = (item.format || item.designType || item.category || "design").toLowerCase();
  const size = formatSize(item);
  const orientation = (item.orientation || "").toLowerCase();

  let opening = `A ${tier} ${kind} template`;
  if (size) opening += `, sized ${size}`;
  // Only add the orientation when the format hasn't already said it
  // ("Instagram portrait" + "in portrait" reads twice).
  if (orientation && !kind.includes(orientation)) opening += ` in ${orientation}`;
  opening += ".";

  const layers = describeLayers(item.elements);
  const build = layers
    ? ` It's built from ${item.elements.length} editable layers — ${layers}.`
    : "";

  return `${opening}${build} Open it in the studio to swap the copy, colours and images for your own.`;
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
    { label: "Media", value: item.mediaType },
    {
      label: "Layers",
      value: Array.isArray(item.elements) ? String(item.elements.length) : null,
    },
    { label: "Access", value: item.premium ? "Premium" : "Free" },
    { label: "Added", value: created },
    // Only worth a row of its own once it differs from the added date.
    { label: "Updated", value: updated && updated !== created ? updated : null },
  ].filter((row) => row.value);
}

/** The chips under the summary — the same facts, scannable at a glance. */
function buildTags(item) {
  return [
    item.designType,
    item.format,
    item.orientation,
    item.mediaType,
    item.premium ? "Premium" : "Free",
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
 * @param {object|null} props.item        The template to show; null closes.
 * @param {string|null} [props.previewSrc] The card's already-painted preview,
 *   shown instantly while the high-res one renders.
 * @param {(item: object) => void} props.onUse   Use the template (parent routes).
 * @param {() => void} props.onClose             Dismiss the modal.
 */
export default function TemplateDetailsModal({ item, previewSrc, onUse, onClose }) {
  const panelRef = useRef(null);
  const [hiResSrc, setHiResSrc] = useState(null);
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

  // Repaint the design large. The card's low-res preview holds the space until
  // this lands, so there's no flash of empty panel.
  useEffect(() => {
    if (!item) return;
    let alive = true;
    setHiResSrc(null);

    (async () => {
      try {
        const dataUrl = await renderDesignToThumbnail(
          { canvas: item.canvas, elements: item.elements },
          { maxDim: PREVIEW_MAX_DIM, quality: 0.92 },
        );
        if (!alive) return;
        if (dataUrl) setHiResSrc(dataUrl);
        else console.warn(`⚠️ [template-details] couldn't paint "${item.title}" large`);
      } catch (err) {
        if (alive) console.error("❌ [template-details] preview failed:", err);
      }
    })();

    return () => {
      alive = false;
    };
  }, [item]);

  // The shareable deep link — the home page reads ?template= and reopens this.
  const shareUrl = useMemo(() => {
    if (!item || typeof window === "undefined") return "";
    const key = item.slug || item.id;
    return `${window.location.origin}${window.location.pathname}?${TEMPLATE_PARAM}=${encodeURIComponent(key)}`;
  }, [item]);

  const specs = useMemo(() => (item ? buildSpecs(item) : []), [item]);
  const tags = useMemo(() => (item ? buildTags(item) : []), [item]);
  const summary = useMemo(() => (item ? describeTemplate(item) : ""), [item]);

  if (!item) return null;

  const src = hiResSrc || previewSrc || item.thumbnail || null;

  /** Copy the deep link, with a short confirmation on the button itself. */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Template link copied");
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
    const subject = encodeURIComponent(`Template: ${item.title}`);
    const body = encodeURIComponent(
      `Thought you'd like this template on Creative Klux:\n\n${item.title}\n${shareUrl}`,
    );
    console.log(`🔗 [template-details] sharing "${item.title}" → email`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleUse = () => {
    console.log(`✅ [template-details] using template "${item.title}"`);
    onUse?.(item);
  };

  const shareActions = [
    { key: "link", label: "Copy link", icon: copied ? Check : Link2, onClick: handleCopyLink },
    { key: "email", label: "Share by email", icon: Mail, onClick: handleEmail },
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
        className="animate-hero-in relative flex h-full w-full flex-col overflow-hidden bg-surface shadow-2xl outline-none sm:h-[min(88vh,780px)] sm:max-w-6xl sm:rounded-2xl lg:flex-row"
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

        {/* ── Preview ─────────────────────────────────────────────────────
            Capped on mobile so the details below always have room; free to
            fill the column on desktop. */}
        <div className="relative flex h-[38vh] shrink-0 items-center justify-center bg-page p-4 sm:h-[42vh] lg:h-auto lg:min-h-0 lg:flex-1 lg:p-8">
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

        {/* ── Details column ──────────────────────────────────────────────
            A flex column: the middle scrolls, the Share block below it is
            pinned to the bottom edge. */}
        <div className="flex min-h-0 flex-1 flex-col border-t border-gray-200 lg:w-[400px] lg:flex-none lg:border-l lg:border-t-0">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            {/* Title + badges */}
            <h2
              id="template-details-title"
              className="pr-8 text-xl font-bold leading-snug tracking-tight text-gray-900"
            >
              {item.title}
            </h2>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  item.premium
                    ? "bg-gray-900 text-surface"
                    : "bg-blue-500/10 text-blue-600"
                }`}
              >
                {item.premium ? "Premium" : "Free"}
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

            {/* Primary action */}
            <button
              type="button"
              onClick={handleUse}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-surface transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Use this template
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
          </div>

          {/* ── Share — pinned to the bottom of the details column ──────── */}
          <div className="shrink-0 border-t border-gray-200 bg-surface px-5 py-4 sm:px-6">
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
    </div>
  );
}
