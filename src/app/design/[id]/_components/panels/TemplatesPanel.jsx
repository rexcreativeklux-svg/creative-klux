"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { LayoutTemplate, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { renderDesignToCanvas } from "@/(lib)/design/renderDesign";
import ConfirmDialog from "../ConfirmDialog";

// Scraive's canvas-templates/public-fetch currently 500s. Keep it OFF so we
// don't spam failed requests (the browser logs every 500 to the console).
// Flip to true once their endpoint is confirmed working.
const TEMPLATE_LIBRARY_ENABLED = false;

/**
 * Templates panel.
 *
 * Primary source = the brand's own saved designs (fetchDesigns) — real
 * { canvas, elements } we can apply today. Clicking one replaces the current
 * canvas (undoable).
 *
 * Secondary source = Scraive's template library (fetchDesignTemplates). Its
 * backend currently 500s, so it's best-effort: if it returns templates we show
 * them, otherwise the section is silently omitted. It lights up automatically
 * once their endpoint recovers.
 */
export default function TemplatesPanel({ editor, designId }) {
  const { fetchDesigns, fetchDesignTemplates } = useAuth();
  const { canvas } = editor;

  const [mine, setMine] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(null); // template awaiting confirmation

  const typeSize = `${Math.round(canvas.width)}x${Math.round(canvas.height)}`;

  const load = useCallback(async () => {
    setLoading(true);

    // ── Your designs (authoritative, works now) ──
    const raw = await fetchDesigns(30);
    const normalized = (Array.isArray(raw) ? raw : [])
      .map(normalizeTemplate)
      .filter(Boolean)
      .filter((d) => String(d.id) !== String(designId)); // exclude the one we're editing
    setMine(normalized);

    // ── Scraive library (best-effort; disabled while the endpoint 500s) ──
    if (TEMPLATE_LIBRARY_ENABLED) {
      try {
        const res = await fetchDesignTemplates({
          type: "image",
          category: categoryByRatio(canvas.width, canvas.height),
          type_size: typeSize,
          num_template: 6,
        });
        setLibrary(
          res?.ok && Array.isArray(res.data)
            ? res.data.map(adaptScraive).filter(Boolean)
            : [],
        );
      } catch {
        setLibrary([]);
      }
    }

    setLoading(false);
  }, [fetchDesigns, fetchDesignTemplates, canvas.width, canvas.height, typeSize, designId]);

  useEffect(() => {
    load();
    // one-shot on mount; refresh button re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clicking a template: apply immediately if there's nothing to lose,
  // otherwise ask via the modal.
  const pick = (tpl) => {
    if (!tpl?.canvas || !Array.isArray(tpl.elements)) {
      toast.error("This template can't be opened.");
      return;
    }
    if (editor.dirty) setPending(tpl);
    else applyTemplate(tpl);
  };

  const applyTemplate = (tpl) => {
    editor.replaceDesign({ canvas: tpl.canvas, elements: tpl.elements });
    setPending(null);
    toast.success("Template applied");
  };

  return (
    <div className="p-3 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Your designs
        </p>
        <button
          onClick={load}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !mine.length ? (
        <TemplateGridSkeleton />
      ) : mine.length ? (
        <TemplateGrid items={mine} onPick={pick} />
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400">
          <LayoutTemplate className="w-8 h-8 text-gray-300" />
          <p className="text-xs max-w-[220px]">
            No saved designs yet. Anything you create shows up here as a reusable template.
          </p>
        </div>
      )}

      {library.length > 0 && (
        <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-2">
            Template library
          </p>
          <TemplateGrid items={library} onPick={pick} />
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        title="Replace current design?"
        message="This swaps the whole canvas for the selected template. You can undo it with Ctrl+Z."
        confirmLabel="Replace"
        variant="danger"
        onConfirm={() => pending && applyTemplate(pending)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

// Shimmer placeholder shown while templates are being fetched. Matches the
// TemplateGrid's 2-up layout so tiles fill in place.
function TemplateGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-4/3 rounded-lg bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}

function TemplateGrid({ items, onPick }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => onPick(tpl)}
          className="rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 cursor-pointer transition bg-gray-50"
          title={tpl.name || "Apply template"}
          style={{ aspectRatio: `${tpl.canvas?.width || 4} / ${tpl.canvas?.height || 3}` }}
        >
          <TemplateThumb tpl={tpl} />
        </button>
      ))}
    </div>
  );
}

/** Renders a saved design to a thumbnail (uses image_url if present, else paints the canvas). */
function TemplateThumb({ tpl }) {
  const [src, setSrc] = useState(tpl.image || null);
  const ref = useRef(null);

  useEffect(() => {
    if (tpl.image) return; // already have a raster preview
    let alive = true;
    (async () => {
      try {
        const cnv = await renderDesignToCanvas({ canvas: tpl.canvas, elements: tpl.elements });
        if (alive) setSrc(cnv.toDataURL("image/png"));
      } catch {
        /* leave placeholder */
      }
    })();
    return () => {
      alive = false;
    };
  }, [tpl]);

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={tpl.name || ""} className="w-full h-full object-cover" />;
  }
  return (
    <div ref={ref} className="w-full h-full flex items-center justify-center">
      <LayoutTemplate className="w-6 h-6 text-gray-300" />
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

function categoryByRatio(w, h) {
  const r = w / h;
  if (Math.abs(r - 1) < 0.05) return "Meta Square";
  if (r < 1) return "Instagram Story";
  return "Meta Landscape";
}

/** Raw saved-design record → { id, name, canvas, elements, image } | null. */
function normalizeTemplate(raw) {
  let parsed = raw.canvas;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }
  let canvas = null;
  let elements = [];
  if (parsed && typeof parsed === "object") {
    if (parsed.canvas && Array.isArray(parsed.elements)) {
      canvas = parsed.canvas;
      elements = parsed.elements;
    } else if (parsed.width && parsed.height) {
      canvas = parsed;
    }
  }
  // Only structured designs make useful templates.
  if (!canvas || !elements.length) return null;
  return {
    id: raw.id,
    name: raw.name || "Untitled",
    canvas,
    elements,
    image: raw.image_url || null,
  };
}

/** Scraive template item → our shape (kept defensive; refine when endpoint is live). */
function adaptScraive(tpl) {
  let layout = tpl?.canvas ?? tpl?.design ?? tpl?.data ?? tpl;
  if (typeof layout === "string") {
    try {
      layout = JSON.parse(layout);
    } catch {
      layout = null;
    }
  }
  if (layout?.canvas && Array.isArray(layout.elements)) {
    return {
      id: tpl.id ?? `scraive_${Math.round(layout.canvas.width)}x${Math.round(layout.canvas.height)}`,
      name: tpl?.name || "Template",
      canvas: layout.canvas,
      elements: layout.elements,
      image: tpl?.thumbnail || tpl?.preview || tpl?.image_url || null,
    };
  }
  return null;
}
