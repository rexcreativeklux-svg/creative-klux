"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { Clock, Wand2, ArrowRight, Loader2 } from "lucide-react";

/* ─── Mini DesignCanvas (same renderer as CreativesPage) ──────── */
function MiniCanvas({ canvasData, elements, maxW = 160, maxH = 100 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canvasData) return;
    const ctx = canvas.getContext("2d");
    const { width, height, background } = canvasData;

    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = background || "#ffffff";
    ctx.fillRect(0, 0, width, height);

    (elements || []).forEach((el) => {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;

      if (el.rotation) {
        const cx = el.x + (el.width || 0) / 2;
        const cy = el.y + (el.height || 0) / 2;
        ctx.translate(cx, cy);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      if (el.type === "shape") {
        ctx.fillStyle = el.fill || "transparent";
        ctx.strokeStyle = el.stroke || "transparent";
        ctx.lineWidth = el.strokeWidth || 0;
        if (el.shape === "circle") {
          const r = (el.width || 0) / 2;
          ctx.beginPath();
          ctx.arc(el.x + r, el.y + r, r, 0, Math.PI * 2);
          ctx.fill();
          if (el.strokeWidth) ctx.stroke();
        } else {
          const r = el.borderRadius || 0;
          if (r) {
            ctx.beginPath();
            ctx.roundRect(el.x, el.y, el.width, el.height, r);
            ctx.fill();
            if (el.strokeWidth) ctx.stroke();
          } else {
            ctx.fillRect(el.x, el.y, el.width, el.height);
            if (el.strokeWidth) ctx.strokeRect(el.x, el.y, el.width, el.height);
          }
        }
      }

      if (el.type === "text") {
        const size = el.fontSize || 14;
        const weight = el.fontWeight || "normal";
        const align = el.textAlign || "left";
        ctx.font = `${weight} ${size}px 'DM Sans', sans-serif`;
        ctx.fillStyle = el.fill || el.color || "#000";
        ctx.textAlign = align;
        const x = align === "center" ? el.x + (el.width || 0) / 2 : align === "right" ? el.x + (el.width || 0) : el.x;
        const textContent = typeof el.content === "string" ? el.content : typeof el.text === "string" ? el.text : "";
        const words = textContent.trim().split(/\s+/);
        const lineMaxW = el.width || 9999;
        let line = "", lineY = el.y + size;
        words.forEach((word) => {
          const test = line ? line + " " + word : word;
          if (ctx.measureText(test).width > lineMaxW && line) {
            ctx.fillText(line, x, lineY);
            line = word;
            lineY += size * 1.35;
          } else { line = test; }
        });
        if (line) ctx.fillText(line, x, lineY);
      }

      if (el.type === "image" && (el.url || el.src)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => { if (ref.current) ref.current.getContext("2d").drawImage(img, el.x, el.y, el.width, el.height); };
        img.src = el.url || el.src;
      }

      ctx.restore();
    });
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
            const hasCanvas = design.canvasData && design.elements?.length > 0;

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
                  {hasCanvas ? (
                    <MiniCanvas
                      canvasData={design.canvasData}
                      elements={design.elements}
                      maxW={160}
                      maxH={100}
                    />
                  ) : (
                    <Wand2 className="w-6 h-6 text-gray-300" />
                  )}

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