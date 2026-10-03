"use client";

/**
 * TemplateGallery — the Templates canvas, and the viewer a card opens into.
 * ─────────────────────────────────────────────────────────────────────────────
 *   ┌──────┬──────┬──────┬──────┐
 *   │      │ ▒▒▒▒ │      │      │   a masonry of example pictures
 *   │      │[Use] │      │      │   ← hover shows Use: prompt → composer
 *   ├──────┤      ├──────┤      │   ← click the picture itself: the viewer
 *   └──────┴──────┴──────┴──────┘
 *
 * ⚠️ TWO TARGETS PER CARD, AND THEY ARE SIBLINGS. The picture is one button
 * (open the viewer) and Use is another laid over it — not nested, because a
 * <button> inside a <button> is invalid HTML and the browser hoists it out,
 * which is how you end up with a Use that also opens the viewer.
 *
 * ⚠️ MASONRY, NOT THE HISTORY LATTICE. The lattice crops every cell to one wide
 * shape so a grid of mixed results reads as one surface. Templates are there to
 * be LOOKED AT before you pick one, and a portrait cropped to 3:2 loses the face
 * — so each card keeps its photo's own shape, reserved up front from the
 * catalog's width/height so the columns don't jump as images arrive.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Download, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { downloadImageUrl } from "@/app/(components)/product-studio/saveToGallery";
import TemplateDesign from "./TemplateDesign";

/**
 * @param {object} props
 * @param {Array} props.templates  See textToImageTemplates.js for the shape —
 *   an entry with a `design` (Social / Ads) is drawn by TemplateDesign.
 * @param {(template: object) => void} props.onUse  Put its prompt in the composer.
 */
export default function TemplateGallery({ templates: catalog, onUse }) {
  const [openIndex, setOpenIndex] = useState(null);
  const templates = useShuffled(catalog);

  // Only during the server render and hydration — drawing the catalog order
  // there would flash every card into a new spot a moment later.
  if (!templates) return null;

  return (
    <>
      <div className="columns-2 gap-3 p-3 sm:columns-3 lg:columns-4">
        {templates.map((template, index) => (
          <div
            key={template.id}
            className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl bg-gray-100"
            style={{ aspectRatio: template.aspect }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label="View template"
              className="block h-full w-full cursor-pointer"
            >
              {template.design ? (
                <TemplateDesign
                  template={template}
                  className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={template.thumb}
                  alt={template.prompt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              )}
            </button>

            {/* The prompt and Use, over a scrim. `pointer-events-none` on the
                scrim so the picture underneath still takes the click everywhere
                except Use itself.
                Below `lg` it is always on — there is no hover on a phone, and
                hiding Use there would leave the viewer as the only way in.
                ⚠️ EXCEPT ON A DESIGN. Its copy is the point of the card, and a
                permanent scrim would sit right on the headline and CTA — so a
                phone gets a bare Use in the corner instead (below). */}
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 items-end gap-2 bg-linear-to-t from-black/75 via-black/35 to-transparent p-3 pt-10 opacity-100 transition-opacity lg:flex lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 ${
                template.design ? "hidden" : "flex"
              }`}
            >
              <div className="min-w-0 flex-1">
                {template.formatLabel && (
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {template.formatLabel}
                  </p>
                )}
                <p className="line-clamp-2 text-[11px] leading-snug text-white/90">
                  {template.prompt}
                </p>
              </div>
              <UseButton onClick={() => onUse(template)} />
            </div>

            {template.design && (
              <div className="absolute right-2 bottom-2 lg:hidden">
                <UseButton onClick={() => onUse(template)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {openIndex != null && templates[openIndex] && (
        <TemplateViewer
          templates={templates}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
          onUse={(template) => {
            setOpenIndex(null);
            onUse(template);
          }}
        />
      )}
    </>
  );
}

/**
 * The catalog in a fresh random order each time the canvas mounts, so coming
 * back to a tool shows a different first screen rather than the same dozen
 * cards every visit.
 *
 * ⚠️ NOT SHUFFLED ON THE SERVER. The page is server-rendered first, and a
 * Math.random() order there would never match the client's — a hydration
 * mismatch. The server snapshot is null; the client one is shuffled once per
 * mount (held in the ref, because getSnapshot must return the same array on
 * every call or React re-renders forever).
 */
const noSubscription = () => () => {};

function useShuffled(items) {
  const cache = useRef(null);

  return useSyncExternalStore(
    noSubscription,
    () => {
      if (cache.current?.items !== items) {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        cache.current = { items, shuffled: copy };
      }
      return cache.current.shuffled;
    },
    () => null,
  );
}

function UseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition-colors hover:bg-blue-700"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Use
    </button>
  );
}

/**
 * One template, full screen: the picture on the left, and on the right the
 * whole prompt with Use this and Download under it. Arrows (and ← →) step
 * through the rest; Esc or ✕ closes.
 */
function TemplateViewer({ templates, index, onIndexChange, onClose, onUse }) {
  const template = templates[index];
  const count = templates.length;

  // Wraps at both ends — the arrows are always there, so neither should ever
  // be a dead click.
  const step = useCallback(
    (delta) => onIndexChange((index + delta + count) % count),
    [index, count, onIndexChange],
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
    };
    document.addEventListener("keydown", onKeyDown);
    // Same reason as the lattice's text reader: the canvas behind scrolls, and
    // letting it move under an overlay makes both feel broken.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, step]);

  const handleDownload = async () => {
    const id = toast.loading("Downloading…");
    try {
      await downloadImageUrl(template.image, {
        filePrefix: `template-${template.id}`,
        ext: "jpeg",
      });
      toast.success("Downloaded", { id });
    } catch (err) {
      console.error("❌ [magic-studio] template download failed:", err);
      toast.error(err?.message || "Couldn't download that image", { id });
    }
  };

  return (
    <div
      className="fixed inset-0 z-9999 overflow-y-auto bg-surface"
      role="dialog"
      aria-modal="true"
      aria-label="Template"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed right-4 top-4 z-10 cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center gap-8 px-4 py-16 md:flex-row md:gap-14">
        {/* The picture, contained rather than cropped — this is the one place
            the whole frame is shown. The grey panel is a fixed box so the
            arrows don't move as photos of different shapes come and go. */}
        <div className="relative flex h-[60vh] w-full max-w-md shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 shadow-sm @container-[size] md:h-[78vh]">
          {template.design ? (
            <TemplateDesign
              key={template.id}
              template={template}
              src={template.image}
              // As large as the panel allows at the design's own shape: the
              // full width, unless that would make it taller than the panel.
              style={{
                width: `min(100cqw, calc(100cqh * ${template.aspect}))`,
              }}
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              // Keyed so a slow load of the next photo never shows the previous
              // one stretched into the new one's box.
              key={template.id}
              src={template.image}
              alt={template.prompt}
              className="max-h-full max-w-full object-contain"
            />
          )}

          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous template"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-gray-700 shadow transition-colors hover:text-blue-600"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next template"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-gray-700 shadow transition-colors hover:text-blue-600"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="w-full max-w-sm">
          {template.formatLabel && (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
              {template.formatLabel}
            </p>
          )}
          <p className="text-sm leading-relaxed text-gray-800">
            {template.prompt}
          </p>

          <p className="mt-3 text-[11px] tabular-nums text-gray-400">
            {index + 1} of {count}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onUse(template)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Use this
            </button>
            {/* Not on a design: its copy is HTML laid over the photo, so the
                file would be the bare photo — not what the card shows. */}
            {!template.design && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            )}
          </div>

          {/* Pexels asks for the photographer to be credited. Quiet, but there. */}
          {template.credit && (
            <a
              href={template.source}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-[11px] text-gray-400 transition-colors hover:text-gray-600"
            >
              Photo by {template.credit} on Pexels
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
