"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Wand2, ArrowRight, Loader2 } from "lucide-react";
// Shared, read-only renderer — same one the editor (/design/[id]) uses to paint,
// so these thumbnails match exactly what opens in the editor.
import { renderDesignToCanvas } from "@/(lib)/design/renderDesign";

/* ─── Card preview ─────────────────────────────────────────────────
   Prefers the design's stored thumbnail — the editor writes one at full canvas
   size on every save, so it IS the design, and showing it costs one cached
   image instead of loading every font and proxying every photo to repaint the
   whole thing off-screen. Four cards repainting at once was the slowest part of
   this section. Repainting stays as the fallback for designs saved before
   previews were stored, and for a stored URL that won't load. */
function CardPreview({ design }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const canRepaint = design.canvasData && design.elements?.length > 0;

  if (design.thumbnail && !thumbFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={design.thumbnail}
        alt={design.name}
        loading="lazy"
        decoding="async"
        onError={() => setThumbFailed(true)}
        // Contained, not cover: the tile is 16:10 but designs are saved in every
        // ratio, and cropping a 1080×1350 portrait to 16:10 cuts away most of
        // it. The letterbox is filled by the design's own background colour,
        // already set on the parent. (Full-bleed `object-cover` was tried across
        // all three card surfaces and reverted on every one.)
        className="h-full w-full object-contain"
      />
    );
  }

  if (canRepaint) {
    return <MiniCanvas canvasData={design.canvasData} elements={design.elements} />;
  }

  return <Wand2 className="w-6 h-6 text-gray-300" />;
}

/* ─── Mini DesignCanvas (shared renderer) ──────────────────────── */
function MiniCanvas({ canvasData, elements }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canvasData) return;

    let cancelled = false;
    (async () => {
      try {
        const off = await renderDesignToCanvas({
          canvas: canvasData,
          elements: elements || [],
        });
        if (cancelled || !ref.current) return;
        const target = ref.current;
        target.width = off.width;
        target.height = off.height;
        const ctx = target.getContext("2d");
        ctx.clearRect(0, 0, off.width, off.height);
        ctx.drawImage(off, 0, 0);
      } catch {
        /* leave blank if rendering fails */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canvasData, elements]);

  if (!canvasData) return null;
  return (
    <canvas
      ref={ref}
      style={{ width: "100%", height: "auto", borderRadius: 6, display: "block" }}
    />
  );
}

/* ─── Normalize raw design from API ──────────────────────────── */
function normalizeDesign(raw) {
  let parsed = raw.canvas;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch { parsed = null; }
  }
  let canvasData = null, elements = [];
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
    try { copy = JSON.parse(copy); } catch { copy = { body: copy }; }
  }
  return {
    id: raw.id,
    name: raw.name || "Untitled",
    type: raw.sub_type || raw.type || "ads",
    date: raw.created_at
      ? new Date(raw.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "—",
    score: raw.score || 0,
    copy,
    canvasData,
    elements,
    // The preview the editor stored on this design's last save — a picture of
    // the whole design, so the card can show it instead of repainting.
    thumbnail: raw.thumbnail || null,
  };
}

const TYPE_COLORS = {
  ads:    { text: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100"   },
  social: { text: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
  design: { text: "text-cyan-600",   bg: "bg-cyan-50",   border: "border-cyan-100"   },
};
const DEFAULT_TYPE = { text: "text-gray-600", bg: "bg-gray-50", border: "border-gray-100" };

/* ─── Skeleton card ───────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-surface border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
    <div className="bg-gray-100 h-32 w-full" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
    </div>
  </div>
);

/* ─── Main component ──────────────────────────────────────────── */
export default function DashboardRecentProjects({ designs = [], isLoading = false }) {
  const normalized = designs.map(normalizeDesign);

  return (
    <div className=" py-4 ">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-md font-bold text-gray-900">Recent Designs</h3>
        </div>
        <Link
          href="/creatives"
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
        >
          View all <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : normalized.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">No designs yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Create your first creative to see it here</p>
          </div>
          <Link
            href="/studio/select"
            className="text-xs font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Start Creating
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {normalized.map((design) => {
            const tc = TYPE_COLORS[design.type?.toLowerCase()] || DEFAULT_TYPE;

            return (
              <Link
                key={design.id}
                href="/creatives"
                className="group bg-surface border border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 cursor-pointer"
              >
                {/* Preview */}
                <div
                  className="relative flex items-center justify-center overflow-hidden bg-gray-50"
                  style={{
                    minHeight: 96,
                    background: design.canvasData?.background || "#f8fafc",
                    aspectRatio: "16/10",
                  }}
                >
                  <CardPreview design={design} />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />

                  {/* Score badge */}
                  {design.score > 0 && (
                    <div className="absolute bottom-1.5 right-1.5 bg-surface/90 backdrop-blur-sm text-[10px] font-bold text-green-600 px-1.5 py-0.5 rounded-full border border-green-100">
                      ★ {design.score}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{design.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span
                      className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${tc.text} ${tc.bg} ${tc.border}`}
                    >
                      {design.type}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <Clock className="w-2.5 h-2.5" />
                      {design.date}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}