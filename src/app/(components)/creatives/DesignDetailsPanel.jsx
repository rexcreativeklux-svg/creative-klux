"use client";

// app/(components)/creatives/DesignDetailsPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The details panel for ONE saved design — the contents of the right-hand
// drawer on /creatives (Creative Studio).
//
// It used to live inside (pages)/creatives/page.jsx as a local `Sidebar`. It is
// out here now because the home page's template rail opens the SAME panel for a
// card on its "Recent Saved Designs" tab, and a second copy would drift from
// this one the first time either was touched. Same reasoning as TemplateCard
// being lifted out of TemplatesSection.
//
// PURELY PRESENTATIONAL — it renders a design and calls back. It never talks to
// the API itself, so both hosts stay in charge of what an action means:
//   · /creatives            wires it to its own list state (a delete drops a
//                           card from the grid, a favourite flips in place)
//   · DesignDetailsDrawer   wires it to AuthContext for every other host
//
// This module also owns the small pieces the panel is built from —
// normalizeDesign(), DesignCanvas, the type colourway and the PNG export
// helpers — because every one of them was shared between the panel and its host
// already. They are exported rather than hidden so /creatives' grid, table and
// download button keep using the exact same ones.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Check,
  Clock,
  Copy,
  Download,
  Edit2,
  FileText,
  Loader2,
  Pencil,
  Send,
  Star,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
// Shared, read-only renderer — the exact one the editor (/design/[id]) uses to
// paint and export, so a preview here matches what opens there.
import {
  renderDesignToCanvas,
  renderDesignToBlob,
} from "@/(lib)/design/renderDesign";

// ── DesignCanvas ──────────────────────────────────────────────────────────────
// Read-only preview. Paints via the SAME renderer the editor uses
// (renderDesignToCanvas) so a creative's thumbnail matches exactly what opens in
// /design/[id] — including web-font loading, library shapes, background images,
// and text layout. No editing behavior is pulled in; this is pure paint.
//
// `fit` is for the fixed-size frames (the card's 16:9 tile, the table's 56×40
// thumb): the canvas is sized to fit INSIDE the box on both axes instead of
// being stretched to its width, so a portrait design is scaled down rather than
// having its top and bottom cropped away. Off by default, because the detail
// panel deliberately renders at full width with no height limit — and there a
// percentage max-height would resolve against an auto-height parent anyway.
export function DesignCanvas({ variation, fit = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !variation?.canvas) return;

    let cancelled = false;
    (async () => {
      try {
        const off = await renderDesignToCanvas({
          canvas: variation.canvas,
          elements: variation.elements || [],
        });
        if (cancelled || !canvasRef.current) return;
        const target = canvasRef.current;
        target.width = off.width;
        target.height = off.height;
        const ctx = target.getContext("2d");
        ctx.clearRect(0, 0, off.width, off.height);
        ctx.drawImage(off, 0, 0);
      } catch {
        /* leave the canvas blank if rendering fails */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [variation]);

  if (!variation?.canvas) return null;

  return (
    <canvas
      ref={canvasRef}
      style={
        fit
          ? {
              // Both caps + auto sizing is the replaced-element equivalent of
              // `object-contain`: the browser shrinks the canvas until it fits
              // the box on both axes, keeping the design's own aspect ratio.
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              display: "block",
            }
          : {
              width: "100%",
              height: "auto",
              display: "block",
            }
      }
    />
  );
}

// ── Normalize a raw design from the API ──────────────────────────────────────
export function normalizeDesign(raw) {
  let parsed = raw.canvas;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }

  let canvasData = null;
  let elements = [];

  if (parsed && typeof parsed === "object") {
    if (parsed.canvas && Array.isArray(parsed.elements)) {
      canvasData = parsed.canvas;
      elements = parsed.elements;
    } else if (parsed.width && parsed.height) {
      canvasData = parsed;
    }
  }

  let copy = raw.copy || {};
  if (typeof copy === "string") {
    try {
      copy = JSON.parse(copy);
    } catch {
      copy = { body: copy };
    }
  }

  return {
    // Preserve every field the endpoint returned (s3_key, status, thumbnail,
    // sub_type, created_at, updated_at, user_id, fav, …) so nothing is dropped;
    // the transformed fields below override the raw ones where shapes differ.
    ...raw,
    id: raw.id,
    name: raw.name || "Untitled Design",
    type: raw.sub_type || raw.type || "image",
    category: raw.type || "ads",
    date: raw.created_at
      ? new Date(raw.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "—",
    // Backend returns `fav` as 1/0 — map it to the boolean the UI uses.
    favorite: Number(raw.fav ?? raw.favorite) === 1,
    score: raw.score || 0,
    copy,
    canvas: canvasData || { width: 800, height: 450, background: "#ffffff" },
    elements,
    brand_id: raw.brand_id,
    // Endpoint returns `thumbnail`, not `image_url` — fall back so previews work.
    image: raw.image_url || raw.thumbnail || null,
  };
}

// ── Type colourway ────────────────────────────────────────────────────────────
export const TYPE_COLOR = {
  ads: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    dot: "bg-blue-500",
  },
  social: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100",
    dot: "bg-indigo-500",
  },
  card: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-100",
    dot: "bg-violet-500",
  },
  banner: {
    bg: "bg-teal-50",
    text: "text-teal-600",
    border: "border-teal-100",
    dot: "bg-teal-500",
  },
  image: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    dot: "bg-blue-400",
  },
  video: {
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    border: "border-cyan-100",
    dot: "bg-cyan-500",
  },
  poster: {
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-700",
    border: "border-fuchsia-100",
    dot: "bg-fuchsia-600",
  },
  flyer: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-100",
    dot: "bg-violet-600",
  },
};

export const DEFAULT_COLOR = {
  bg: "bg-gray-50",
  text: "text-gray-600",
  border: "border-gray-200",
  dot: "bg-gray-400",
};

/* ─── Design → PNG export helpers ─────────────────────────────── */
// Route external images through the proxy (which sends CORS headers) so the
// export canvas isn't "tainted" and can be read back as a PNG.
export const toProxiedSrc = (src) =>
  typeof src === "string" && /^https?:\/\//i.test(src)
    ? `/api/proxy-image?url=${encodeURIComponent(src)}`
    : src;

// Renders a canvas-based design to a full-resolution PNG Blob, using the same
// shared renderer as the editor so the exported PNG matches the on-screen design.
export async function renderDesignToPngBlob(c) {
  const canvasData = c.canvas;
  if (!canvasData?.width || !canvasData?.height) {
    throw new Error("This design has no canvas to export.");
  }
  try {
    return await renderDesignToBlob({
      canvas: canvasData,
      elements: c.elements || [],
    });
  } catch {
    throw new Error("Could not export this design.");
  }
}

// ── The panel ─────────────────────────────────────────────────────────────────
/**
 * @param {object} props
 * @param {object} props.creative              A normalizeDesign() result.
 * @param {() => void} props.onClose           Dismiss the host drawer.
 * @param {(id: number|string, e?: Event) => void} props.onToggleFavorite
 * @param {() => void} props.onCopy            Copy the generated copy block.
 * @param {boolean} props.copied               Show the copied confirmation.
 * @param {(id: number|string) => void} props.onDeleteRequest
 * @param {(creative: object) => void} props.onEdit      Open the copy editor.
 * @param {() => void} props.onPublish
 * @param {() => void} props.onSchedule
 * @param {(creative: object) => Promise<void>} props.onDownload
 */
export default function DesignDetailsPanel({
  creative: c,
  onClose,
  onToggleFavorite,
  onCopy,
  copied,
  onDeleteRequest,
  onEdit,
  onPublish,
  onSchedule,
  onDownload,
}) {
  const [downloading, setDownloading] = useState(false);
  const tc = TYPE_COLOR[c.type?.toLowerCase()] || DEFAULT_COLOR;
  const [expandedCopy, setExpandedCopy] = useState(false);

  const copy = c.copy || {};
  const copyEntries =
    typeof copy === "string"
      ? [["content", copy]]
      : Object.entries(copy).filter(([, v]) => v && typeof v === "string");

  const hasCanvas = c.canvas && c.elements?.length > 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${tc.bg} ${tc.text} ${tc.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
          {c.type}
        </span>
        {/* Favourite / delete / close. `ck-tap-pad` GROWS these to 44px on a
            touchscreen rather than expanding an invisible halo (`ck-tap`) —
            they sit 4px apart, so overlapping halos would hand taps aimed at
            the star to the delete button beside it. Mouse widths are unchanged. */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(c.id, e);
            }}
            aria-label={c.favorite ? "Remove from favorites" : "Add to favorites"}
            className={`ck-tap-pad w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer transition-all ${c.favorite ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-400"}`}
          >
            <Star
              className={`w-3.5 h-3.5 ${c.favorite ? "fill-amber-400" : ""}`}
            />
          </button>
          <button
            onClick={() => onDeleteRequest(c.id)}
            aria-label="Delete design"
            className="ck-tap-pad w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="ck-tap-pad w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Canvas Preview with hovering Edit button.
            Renders the whole design at full width with no height restriction —
            nothing is clipped; the panel grows to fit the design. */}
        <div
          className="relative bg-gray-50 border-b border-gray-100 flex items-center justify-center group/preview"
          style={{ minHeight: 200 }}
        >
          {/* Prefer the backend thumbnail for the preview; fall back to
              rendering the canvas only when there isn't one. */}
          {c.thumbnail ? (
            <img
              src={c.thumbnail}
              alt={c.name}
              className="w-full h-auto block"
            />
          ) : hasCanvas ? (
            <DesignCanvas
              variation={{ canvas: c.canvas, elements: c.elements }}
            />
          ) : c.image ? (
            <img
              src={c.image}
              alt={c.name}
              className="max-w-full max-h-56 rounded-lg object-contain shadow"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-300 py-8">
              <Wand2 className="w-10 h-10" />
              <span className="text-xs">No preview available</span>
            </div>
          )}
          {/* ── Edit buttons ──
              Revealed on hover on a mouse, ALWAYS shown on a touchscreen: a
              finger cannot hover, so on a phone these two — the only way into
              the editor from here — were invisible and unreachable. The
              `pointer: coarse` gate is the same one `ck-tap` uses, so JS and
              CSS agree on who counts as touch, and a mouse user's view is
              byte-for-byte unchanged.

              The scrim comes with them on touch, since permanently-visible
              buttons have to stay legible over a bright design. */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 px-3 opacity-0 transition-opacity duration-200 cursor-pointer group-hover/preview:opacity-100 pointer-coarse:bg-black/15 pointer-coarse:opacity-100 sm:gap-4">
            {/* Opens the full design editor at /design/[id] */}
            <Link
              href={`/design/${c.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 whitespace-nowrap bg-surface/90 backdrop-blur-sm border border-gray-200 shadow-lg px-3 py-2 hover:scale-105 rounded-lg text-xs font-semibold text-gray-700 hover:bg-surface transition sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Edit2 className="w-3.5 h-3.5 shrink-0" />
              Edit with editor
            </Link>

            {/* Opens the editor with the Klux AI panel already open via the
                `?panel=klux` deep link. */}
            <Link
              href={`/design/${c.id}?panel=klux`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 whitespace-nowrap bg-surface/90 backdrop-blur-sm border border-gray-200 shadow-lg px-3 py-2 hover:scale-105 rounded-lg text-xs font-semibold text-gray-700 hover:bg-surface transition sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Edit2 className="w-3.5 h-3.5 shrink-0" />
              Edit with Ai
            </Link>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Name + edit button */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 leading-snug flex-1 truncate">
                {c.name}
              </h2>
              <button
                onClick={() => onEdit(c)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition shrink-0"
                title="Edit copy"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-gray-300" />
              <span className="text-[11px] text-gray-400">{c.date}</span>
            </div>
          </div>

          {/* Tagline if available */}
          {c.copy?.tagline && (
            <p className="text-xs text-gray-500 italic -mt-2">
              {c.copy.tagline}
            </p>
          )}

          {/* Meta grid — three short label/value pairs. Kept at 3 columns:
              they are already inside a card whose width the parent grid
              controls, and the values ("Poster", "★ 8") are short enough to
              hold at a card's narrowest. */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ["Type", c.type],
              ["Category", c.category],
              ["Score", c.score > 0 ? `★ ${c.score}` : "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-gray-50 rounded-xl px-2 py-2 text-center border border-gray-100"
              >
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-[10px] font-semibold text-gray-700 mt-0.5 truncate capitalize">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Canvas dimensions */}
          {c.canvas && (
            <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Canvas
              </span>
              <span className="text-[11px] font-mono font-semibold text-gray-600">
                {c.canvas.width} × {c.canvas.height}px
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {/* Three equal buttons across a panel that is only ~300px wide on a
                phone. `whitespace-nowrap` + `min-w-0` keep "Downloading…" on one
                line there instead of wrapping and growing the row's height. */}
            <div className="flex gap-2">
              <button
                onClick={onPublish}
                className="flex-1 min-w-0 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-all shadow-sm sm:gap-2"
              >
                <Send className="w-3 h-3 shrink-0" /> Publish
              </button>
              <button
                onClick={onSchedule}
                className="flex-1 min-w-0 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold py-2 rounded-lg transition-all sm:gap-2"
              >
                <CalendarClock className="w-3 h-3 shrink-0" /> Schedule
              </button>
              <button
                onClick={async () => {
                  if (downloading) return;
                  setDownloading(true);
                  await onDownload?.(c);
                  setDownloading(false);
                }}
                disabled={downloading}
                className="flex-1 min-w-0 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border border-gray-200 hover:bg-gray-100 text-gray-800 text-xs font-semibold py-2 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed sm:gap-2"
              >
                {downloading ? (
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                ) : (
                  <Download className="w-3 h-3 shrink-0" />
                )}
                {downloading ? "Downloading…" : "Download"}
              </button>
            </div>
          </div>

          {/* Generated Copy */}
          {copyEntries.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">
                Generated Copy
              </p>
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed border border-gray-100 space-y-2">
                {(expandedCopy ? copyEntries : copyEntries.slice(0, 3)).map(
                  ([key, val]) => (
                    <div key={key}>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                        {key.replace(/_/g, " ")}
                      </span>
                      <p className="mt-0.5 text-gray-700">{val}</p>
                    </div>
                  ),
                )}
                {copyEntries.length > 3 && (
                  <button
                    onClick={() => setExpandedCopy((v) => !v)}
                    className="text-blue-500 hover:text-blue-700 font-semibold text-xs cursor-pointer transition"
                  >
                    {expandedCopy ? "Show less" : "See more"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer.
          The bottom padding folds in the iOS home-indicator inset, or the
          "Copy Text" button sits under it on a notched phone. */}
      <div className="shrink-0 px-4 pt-3 pb-[calc(0.75rem+var(--ck-safe-b))] border-t border-gray-100 flex items-center gap-2 bg-surface">
        <button
          onClick={onCopy}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${copied ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"}`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied!" : "Copy Text"}
        </button>
      </div>
    </>
  );
}

// ── Edit Copy Modal ───────────────────────────────────────────────────────────
const COPY_FIELDS = [
  {
    key: "name",
    label: "Design Name",
    type: "input",
    placeholder: "e.g. Summer Campaign Card",
  },
  {
    key: "headline",
    label: "Headline",
    type: "input",
    placeholder: "e.g. Adventure Awaits",
  },
  {
    key: "tagline",
    label: "Tagline",
    type: "input",
    placeholder: "e.g. Discover your next thrill",
  },
  {
    key: "body",
    label: "Body Copy",
    type: "textarea",
    placeholder: "e.g. Join us for an unforgettable journey…",
  },
  {
    key: "cta",
    label: "Call to Action",
    type: "input",
    placeholder: "e.g. Get Started",
  },
];

export function EditCopyModal({ creative, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({
    name: creative.name || "",
    headline: creative.copy?.headline || "",
    tagline: creative.copy?.tagline || "",
    body: creative.copy?.body || "",
    cta: creative.copy?.cta || "",
  });

  const handleChange = (key, value) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(creative.id, {
      name: fields.name,
      copy: {
        ...creative.copy, // preserve any extra keys like performance_score
        headline: fields.headline,
        tagline: fields.tagline,
        body: fields.body,
        cta: fields.cta,
      },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-70 px-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Edit Copy</h3>
              <p className="text-[10px] text-gray-400">
                Update text content for this design
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {COPY_FIELDS.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {label}
              </label>
              {type === "textarea" ? (
                <textarea
                  rows={4}
                  value={fields[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition placeholder-gray-300"
                />
              ) : (
                <input
                  type="text"
                  value={fields[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder-gray-300"
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition flex items-center gap-2 font-semibold"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
