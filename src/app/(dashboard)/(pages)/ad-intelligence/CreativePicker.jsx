"use client";

/**
 * Shared creative picking for Ad Intelligence.
 *
 * - CreativePickerCard — the /creatives-style card (16:9 preview, type badge,
 *   score, name, tagline, date) used by Creative Comparison and the picker below.
 * - CreativeSourcePicker — Creative Comparison's pattern as one block:
 *   From Creatives · Magic Studio · Upload image. Used by Ad Guard AI and Ad
 *   Scorer AI, which each pick ONE creative to check.
 *
 * The picker reports a single selection through `onChange`:
 *   { kind: "design", design }        a saved Creative Studio design
 *   { kind: "magic", item }           a Magic Studio picture (hosted URL)
 *   { kind: "file", file, preview }   an uploaded image
 *   null                              nothing picked
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clock,
  LayoutGrid,
  Loader2,
  Search,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { renderDesignToCanvas } from "@/(lib)/design/renderDesign";
import useMagicImageResults from "./creative-comparison/useMagicImageResults";

/* ─── accents ─────────────────────────────────────────────────── */
// Full class names (not built from strings) so Tailwind keeps them.
const ACCENTS = {
  indigo: {
    tab: "text-indigo-600",
    selected: "border-indigo-500 shadow-lg shadow-indigo-100/60",
    hover: "hover:border-indigo-200",
    check: "bg-indigo-600",
    spinner: "text-indigo-400",
    strip: "bg-indigo-50 border-indigo-100",
    stripText: "text-indigo-700",
    stripIcon: "text-indigo-500",
    stripX: "text-indigo-400 hover:text-indigo-600",
    focus: "focus:border-indigo-400",
    dropHover: "group-hover:bg-indigo-100",
    dropIcon: "group-hover:text-indigo-500",
    dragBorder: "#6366f1",
    dragBg: "#eef2ff",
  },
  emerald: {
    tab: "text-emerald-600",
    selected: "border-emerald-500 shadow-lg shadow-emerald-100/60",
    hover: "hover:border-emerald-200",
    check: "bg-emerald-500",
    spinner: "text-emerald-500",
    strip: "bg-emerald-50 border-emerald-100",
    stripText: "text-emerald-700",
    stripIcon: "text-emerald-500",
    stripX: "text-emerald-400 hover:text-emerald-600",
    focus: "focus:border-emerald-400",
    dropHover: "group-hover:bg-emerald-100",
    dropIcon: "group-hover:text-emerald-500",
    dragBorder: "#10b981",
    dragBg: "#f0fdf4",
  },
  amber: {
    tab: "text-amber-600",
    selected: "border-amber-400 shadow-lg shadow-amber-100/60",
    hover: "hover:border-amber-200",
    check: "bg-amber-500",
    spinner: "text-amber-400",
    strip: "bg-amber-50 border-amber-100",
    stripText: "text-amber-700",
    stripIcon: "text-amber-500",
    stripX: "text-amber-400 hover:text-amber-600",
    focus: "focus:border-amber-400",
    dropHover: "group-hover:bg-amber-100",
    dropIcon: "group-hover:text-amber-500",
    dragBorder: "#f59e0b",
    dragBg: "#fffbeb",
  },
};

// Type → badge colours, mirroring the Creatives library so the picker cards read
// identically to /creatives.
const TYPE_COLOR = {
  ads: { text: "text-blue-600", border: "border-blue-100", dot: "bg-blue-500" },
  social: {
    text: "text-indigo-600",
    border: "border-indigo-100",
    dot: "bg-indigo-500",
  },
  card: {
    text: "text-violet-600",
    border: "border-violet-100",
    dot: "bg-violet-500",
  },
  banner: {
    text: "text-teal-600",
    border: "border-teal-100",
    dot: "bg-teal-500",
  },
  image: { text: "text-blue-600", border: "border-blue-100", dot: "bg-blue-400" },
  video: { text: "text-cyan-600", border: "border-cyan-100", dot: "bg-cyan-500" },
};
const DEFAULT_COLOR = {
  text: "text-gray-600",
  border: "border-gray-200",
  dot: "bg-gray-400",
};

/* ─── PreviewCanvas ───────────────────────────────────────────── */
// Full-width read-only preview painted with the SAME renderer the editor uses,
// so a picker card's thumbnail matches /creatives and /design/[id] exactly.
export function PreviewCanvas({ canvas, elements }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const node = canvasRef.current;
    if (!node || !canvas) return;

    let cancelled = false;
    (async () => {
      try {
        const off = await renderDesignToCanvas({
          canvas,
          elements: elements || [],
        });
        if (cancelled || !canvasRef.current) return;
        const target = canvasRef.current;
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
  }, [canvas, elements]);

  if (!canvas) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", maxWidth: "100%", height: "auto", display: "block" }}
    />
  );
}

/* ─── normalizeDesign ─────────────────────────────────────────── */
// Same shape as the Creatives page. `raw` is kept for callers that send the
// design's canvas JSON to an endpoint.
export function normalizeDesign(raw) {
  let parsed = raw.canvas;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }
  let canvasData = null,
    elements = [];
  if (parsed && typeof parsed === "object") {
    if (parsed.canvas && Array.isArray(parsed.elements)) {
      canvasData = parsed.canvas;
      elements = parsed.elements;
    } else if (parsed.width && parsed.height) canvasData = parsed;
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
    score: raw.score || 0,
    copy,
    canvas: canvasData || { width: 800, height: 450, background: "#ffffff" },
    elements,
    image: raw.image_url || null,
    raw,
  };
}

/* ─── CreativePickerCard ──────────────────────────────────────── */
// A selectable card that mirrors the /creatives library card style. It's a
// picker, so it swaps the favourite/delete actions for a selected ring + check.
export function CreativePickerCard({
  design: c,
  selected,
  onSelect,
  accent = "indigo",
}) {
  const a = ACCENTS[accent] || ACCENTS.indigo;
  const tc = TYPE_COLOR[c.type?.toLowerCase()] || DEFAULT_COLOR;
  const hasCanvas = c.canvas && c.elements?.length > 0;
  const tagline = c.copy?.tagline || "";

  return (
    <button
      onClick={() => onSelect(c)}
      className={`group text-left bg-surface rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col relative ${
        selected ? a.selected : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Preview */}
      <div
        className="relative overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ aspectRatio: "16/9", minHeight: 96 }}
      >
        {hasCanvas ? (
          <div className="w-full flex items-center justify-center p-2 bg-gray-50">
            <PreviewCanvas canvas={c.canvas} elements={c.elements} />
          </div>
        ) : c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image}
            alt={c.name}
            className="w-full h-auto block"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-300">
            <Wand2 className="w-6 h-6" />
            <span className="text-[10px]">No preview</span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border backdrop-blur-sm bg-surface/90 ${tc.text} ${tc.border} capitalize`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
            {c.category}
          </span>
        </div>

        {/* Selected check */}
        {selected && (
          <div
            className={`absolute top-2 right-2 w-6 h-6 ${a.check} rounded-full flex items-center justify-center shadow-sm`}
          >
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Score */}
        {c.score > 0 && (
          <div className="absolute bottom-2 right-2 bg-surface/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-100">
            ★ {c.score}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-3 pt-2 pb-2.5">
        <p className="text-xs font-semibold text-gray-900 truncate">{c.name}</p>
        {tagline ? (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate italic">
            {tagline}
          </p>
        ) : (
          <p className="text-[10px] text-gray-300 mt-0.5 truncate capitalize">
            {c.category}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
          <Clock className="w-3 h-3 text-gray-300" />
          <span className="text-[10px] text-gray-400">{c.date}</span>
        </div>
      </div>
    </button>
  );
}

/* ─── SelectedStrip ───────────────────────────────────────────── */
function SelectedStrip({ label, onClear, a }) {
  return (
    <div
      className={`mt-3 flex items-center gap-2 px-3 py-2 border rounded-xl ${a.strip}`}
    >
      <Check className={`w-3.5 h-3.5 shrink-0 ${a.stripIcon}`} />
      <p className={`text-xs font-semibold flex-1 truncate ${a.stripText}`}>
        {label}
      </p>
      <button onClick={onClear} className={`cursor-pointer transition ${a.stripX}`}>
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const TABS = [
  { id: "projects", label: "From Creatives", icon: LayoutGrid },
  { id: "magic", label: "Magic Studio", icon: Wand2 },
  { id: "upload", label: "Upload image", icon: Upload },
];

/* ─── CreativeSourcePicker ────────────────────────────────────── */
export function CreativeSourcePicker({
  value,
  onChange,
  accent = "indigo",
  designLimit = 50,
}) {
  const a = ACCENTS[accent] || ACCENTS.indigo;
  const { fetchDesigns, token, activeBrandId } = useAuth();
  const fileRef = useRef();
  const [activeTab, setActiveTab] = useState("projects");
  const [dragging, setDragging] = useState(false);
  const [search, setSearch] = useState("");

  // ── Your creatives — loaded on open, since "From Creatives" is the tab the
  // picker opens on. Waits for the active brand: it arrives asynchronously
  // after a refresh, and fetching before it only earns a null.
  const [designs, setDesigns] = useState([]);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [designsError, setDesignsError] = useState("");
  useEffect(() => {
    if (!token || !activeBrandId) return undefined;
    let alive = true;
    (async () => {
      const data = await fetchDesigns(designLimit);
      if (!alive) return;
      if (!data) {
        setDesignsError(
          "Failed to load designs. Make sure you have an active brand selected.",
        );
      } else {
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setDesigns(arr.map(normalizeDesign));
        setDesignsError("");
      }
      setLoadingDesigns(false);
    })();
    return () => {
      alive = false;
    };
  }, [fetchDesigns, token, activeBrandId, designLimit]);

  // ── Magic Studio pictures — only fetched once that tab is first opened.
  const [magicRequested, setMagicRequested] = useState(false);
  const { items: magicItems, loading: loadingMagic } = useMagicImageResults({
    enabled: magicRequested && !!token,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return designs;
    return designs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.copy?.tagline || "").toLowerCase().includes(q),
    );
  }, [designs, search]);

  const switchTab = (id) => {
    setActiveTab(id);
    if (id === "magic") setMagicRequested(true);
    // Opening Upload with nothing uploaded goes straight to the file picker.
    if (id === "upload" && value?.kind !== "file") {
      setTimeout(() => fileRef.current?.click(), 50);
    }
  };

  const acceptFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) =>
      onChange({ kind: "file", file: f, preview: e.target.result });
    reader.readAsDataURL(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const clear = () => onChange(null);

  return (
    <div className="flex flex-col min-w-0">
      {/* Tab switcher — From Creatives leads and is the default: your own work
          is the expected input, an upload is the alternative. */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === id
                ? `bg-surface shadow-sm ${a.tab}`
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>

      {/* ── From Creatives ── */}
      {activeTab === "projects" && (
        <div className="flex flex-col min-h-0">
          {loadingDesigns ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className={`w-5 h-5 animate-spin ${a.spinner}`} />
            </div>
          ) : designsError ? (
            <p className="text-xs text-red-600 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
              {designsError}
            </p>
          ) : designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <LayoutGrid className="w-8 h-8 text-gray-200" />
              <p className="text-xs text-gray-400">No designs found</p>
            </div>
          ) : (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search designs…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:bg-surface transition ${a.focus}`}
                />
              </div>
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No designs match &ldquo;{search}&rdquo;
                </p>
              ) : (
                <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                  <div className="grid grid-cols-2 gap-3 p-0.5">
                    {filtered.map((d) => (
                      <CreativePickerCard
                        key={d.id}
                        design={d}
                        accent={accent}
                        selected={
                          value?.kind === "design" && value.design.id === d.id
                        }
                        onSelect={(design) => onChange({ kind: "design", design })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {value?.kind === "design" && (
            <SelectedStrip label={value.design.name} onClear={clear} a={a} />
          )}
        </div>
      )}

      {/* ── Magic Studio ── recent pictures, newest first */}
      {activeTab === "magic" && (
        <div className="flex flex-col min-h-0">
          {loadingMagic || !magicRequested ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className={`w-5 h-5 animate-spin ${a.spinner}`} />
            </div>
          ) : magicItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Wand2 className="w-8 h-8 text-gray-200" />
              <p className="text-xs text-gray-400">No Magic Studio images yet</p>
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
              <div className="grid grid-cols-3 gap-2 p-0.5">
                {magicItems.map((item) => {
                  const selected =
                    value?.kind === "magic" && value.item.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChange({ kind: "magic", item })}
                      title={item.label}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-gray-100 transition-colors cursor-pointer ${
                        selected ? a.selected : `border-transparent ${a.hover}`
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.label}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 px-1.5 pb-1 pt-3 bg-linear-to-t from-black/60 to-transparent text-[9px] font-medium text-white truncate text-left">
                        {item.label}
                      </span>
                      {selected && (
                        <span
                          className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center ${a.check}`}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {value?.kind === "magic" && (
            <SelectedStrip label={value.item.label} onClear={clear} a={a} />
          )}
        </div>
      )}

      {/* ── Upload image ── */}
      {activeTab === "upload" && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              acceptFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {value?.kind !== "file" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all py-12 group"
              style={{
                borderColor: dragging ? a.dragBorder : "#e5e7eb",
                background: dragging ? a.dragBg : "#f9fafb",
              }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3 transition-colors ${a.dropHover}`}
              >
                <Upload
                  className={`w-5 h-5 text-gray-400 transition-colors ${a.dropIcon}`}
                />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP supported</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value.preview}
                  alt="Creative"
                  className="w-full object-contain max-h-72 bg-gray-100"
                />
                <button
                  onClick={clear}
                  className="absolute top-2 right-2 w-7 h-7 bg-surface rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition cursor-pointer shadow-sm"
                >
                  <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                </button>
                <div className="absolute bottom-2 left-2 bg-surface/90 rounded-lg px-2 py-0.5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-700 truncate max-w-[180px]">
                    {value.file?.name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {(value.file?.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition cursor-pointer"
              >
                Replace image
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
