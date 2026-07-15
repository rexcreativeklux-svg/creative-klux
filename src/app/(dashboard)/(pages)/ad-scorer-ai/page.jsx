"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Upload, Loader2, CheckCircle, AlertCircle,
  LayoutGrid, X, Search, Image as ImageIcon, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RadialBarChart, RadialBar } from "recharts";
// Shared, read-only renderer — same one the editor (/design/[id]) uses to paint,
// so these thumbnails match exactly what opens in the editor.
import { renderDesignToCanvas } from "@/(lib)/design/renderDesign";

// ── helpers ───────────────────────────────────────────────────────────────────
const scoreColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#2563eb";
  if (score >= 40) return "#f97316";
  return "#ef4444";
};

const priorityClass = (p) => ({
  High: "bg-red-50 text-red-600 border border-red-200",
  Medium: "bg-orange-50 text-orange-600 border border-orange-200",
  Low: "bg-green-50 text-green-600 border border-green-200",
}[p] || "bg-gray-100 text-gray-500");

// ── ScoreGauge ────────────────────────────────────────────────────────────────
const ScoreGauge = ({ label, value }) => (
  <div className="flex flex-col items-center p-3 bg-gray-50 border border-gray-100 rounded-xl">
    <div className="relative">
      <RadialBarChart
        width={90} height={90} cx={45} cy={45}
        innerRadius={30} outerRadius={42}
        data={[{ value, fill: scoreColor(value) }]}
        startAngle={90} endAngle={-270}
      >
        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#e5e7eb" }} />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold" style={{ color: scoreColor(value) }}>{value}</span>
      </div>
    </div>
    <p className="text-[10px] text-gray-400 mt-1.5 text-center font-medium">{label}</p>
  </div>
);

// ── MiniDesignCanvas ──────────────────────────────────────────────────────────
function MiniDesignCanvas({ canvasData, elements, maxW = 180, maxH = 110 }) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasData) return;

    let cancelled = false;
    (async () => {
      try {
        const off = await renderDesignToCanvas({
          canvas: canvasData,
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
  }, [canvasData, elements]);

  if (!canvasData) return null;
  const scale = Math.min(maxW / canvasData.width, maxH / canvasData.height, 1);
  return (
    <canvas
      ref={canvasRef}
      style={{ width: canvasData.width * scale, height: canvasData.height * scale, display: "block" }}
    />
  );
}

// ── normalizeDesign ───────────────────────────────────────────────────────────
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
  if (typeof copy === "string") { try { copy = JSON.parse(copy); } catch { copy = { body: copy }; } }

  return {
    id: raw.id,
    name: raw.name || "Untitled Design",
    score: raw.score || 0,
    copy,
    canvas: canvasData || { width: 800, height: 450, background: "#ffffff" },
    elements,
    raw,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function CreativeScoring() {
  const { creativeScoring, fetchDesigns } = useAuth();
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);

  // ── tab state ──
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "designs"

  // ── input state ──
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);

  // ── designs list ──
  const [designs, setDesigns] = useState([]);
  const [designsLoading, setDesignsLoading] = useState(false);
  const [designsError, setDesignsError] = useState("");
  const [designsLoaded, setDesignsLoaded] = useState(false);
  const [search, setSearch] = useState("");

  // ── scoring state ──
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // ── load designs when tab switches ───────────────────────────────────────
  const loadDesigns = useCallback(async () => {
    setDesignsLoading(true);
    setDesignsError("");
    const result = await fetchDesigns(50);
    if (!result) {
      setDesignsError("Failed to load designs. Make sure you have an active brand selected.");
    } else {
      const arr = Array.isArray(result) ? result : Array.isArray(result.data) ? result.data : [];
      setDesigns(arr.map(normalizeDesign));
      setDesignsLoaded(true);
    }
    setDesignsLoading(false);
  }, [fetchDesigns]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === "designs" && !designsLoaded) {
      loadDesigns();
    }
    // clicking Upload tab immediately triggers file picker if nothing uploaded yet
    if (tab === "upload" && !file) {
      setTimeout(() => fileRef.current?.click(), 50);
    }
  };

  const filtered = useMemo(() =>
    designs.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.copy?.tagline || "").toLowerCase().includes(search.toLowerCase())
    ), [designs, search]);

  // ── file handlers ─────────────────────────────────────────────────────────
  const acceptFile = (f) => {
    if (!f) return;
    setFile(f);
    setSelectedDesign(null);
    setData(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }, []);

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setSelectedDesign(null);
    setData(null);
    setError("");
  };

  // ── design select ─────────────────────────────────────────────────────────
  const handleSelectDesign = (design) => {
    setSelectedDesign(design);
    setFile(null);
    setPreview(null);
    setData(null);
    setError("");
  };

  // ── score ─────────────────────────────────────────────────────────────────
  const handleScore = async () => {
    setLoading(true);
    setError("");
    setData(null);

    let response;
    if (file) {
      response = await creativeScoring({ image: file });
    } else if (selectedDesign) {
      const canvasPayload = typeof selectedDesign.raw.canvas === "string"
        ? selectedDesign.raw.canvas
        : JSON.stringify(selectedDesign.raw.canvas);
      response = await creativeScoring({ canvas: canvasPayload });
    } else {
      setError("Please upload an image or select a design first.");
      setLoading(false);
      return;
    }

    if (!response.ok) {
      setError(response.message || "Scoring failed. Please try again.");
    } else {
      setData(response.data);
    }
    setLoading(false);
  };

  const hasInput = !!file || !!selectedDesign;

  // ── selected design canvas meta ───────────────────────────────────────────
  const selectedDesignCanvas = selectedDesign?.canvas || null;
  const selectedDesignElements = selectedDesign?.elements || [];

  return (
    <div className="">
      <div className="pb-5">

        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}>
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ad Scorer AI</h1>
              <p className="text-sm text-gray-400">Score your creatives for performance, brand awareness, or engagement.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT: Input panel ── */}
          <div className="space-y-4">
            <div className="bg-surface border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

              {/* Tab switcher */}
              <div className="flex border-b border-gray-100 px-4">
                <button
                  onClick={() => handleTabSwitch("upload")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all rounded-xl cursor-pointer border-2 ${activeTab === "upload"
                      ? "border-amber-400 text-amber-600 bg-amber-50/40"
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <Upload className="w-4 h-4" /> Upload Image
                </button>
                <button
                  onClick={() => handleTabSwitch("designs")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold rounded-xl transition-all cursor-pointer border-2 ${activeTab === "designs"
                      ? "border-amber-400 text-amber-600 bg-amber-50/40"
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <LayoutGrid className="w-4 h-4" /> Choose Design
                </button>
              </div>

              <div className="p-5">

                {/* ── Upload tab ── */}
                {activeTab === "upload" && (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => acceptFile(e.target.files?.[0])}
                    />

                    {!preview ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        onClick={() => fileRef.current?.click()}
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all py-12 group"
                        style={{
                          borderColor: dragging ? "#f59e0b" : "#e5e7eb",
                          background: dragging ? "#fffbeb" : "#f9fafb",
                        }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-amber-100 flex items-center justify-center mb-3 transition-colors">
                          <Upload className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Click to upload or drag & drop</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP supported</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden">
                          <img src={preview} alt="Creative" className="w-full object-contain max-h-64 bg-gray-100" />
                          <button
                            onClick={clearAll}
                            className="absolute top-2 right-2 w-7 h-7 bg-surface rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition cursor-pointer shadow-sm"
                          >
                            <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                          </button>
                        </div>
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="w-full py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:border-amber-300 hover:text-amber-600 transition cursor-pointer"
                        >
                          Replace image
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── Designs tab ── */}
                {activeTab === "designs" && (
                  <div className="space-y-3">

                    {/* Search + refresh row */}
                    {!designsLoading && designs.length > 0 && (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search designs…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                          />
                        </div>
                        <button
                          onClick={loadDesigns}
                          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-200 transition cursor-pointer shrink-0"
                          title="Refresh"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Loading */}
                    {designsLoading && (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                        <p className="text-sm text-gray-400">Loading designs…</p>
                      </div>
                    )}

                    {/* Error */}
                    {!designsLoading && designsError && (
                      <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600">{designsError}</p>
                      </div>
                    )}

                    {/* Empty */}
                    {!designsLoading && !designsError && designs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-14 gap-2">
                        <LayoutGrid className="w-9 h-9 text-gray-200" />
                        <p className="text-sm text-gray-400">No saved designs found.</p>
                        <p className="text-xs text-gray-300">Create a design first from the Studio.</p>
                      </div>
                    )}

                    {/* No search match */}
                    {!designsLoading && !designsError && filtered.length === 0 && designs.length > 0 && (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <p className="text-sm text-gray-400">No designs match "{search}"</p>
                        <button onClick={() => setSearch("")} className="text-xs text-amber-500 hover:text-amber-600 cursor-pointer transition">Clear search</button>
                      </div>
                    )}

                    {/* Design grid */}
                    {!designsLoading && filtered.length > 0 && (
                      <div
                        className="grid grid-cols-2 gap-2.5 overflow-y-auto pr-0.5"
                        style={{ maxHeight: 340 }}
                      >
                        {filtered.map((design) => {
                          const isSel = selectedDesign?.id === design.id;
                          return (
                            <button
                              key={design.id}
                              onClick={() => handleSelectDesign(design)}
                              className={`text-left rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:border-amber-300 hover:shadow-md group ${isSel
                                  ? "border-amber-400 shadow-lg shadow-amber-100/60"
                                  : "border-gray-100"
                                }`}
                            >
                              {/* Canvas preview */}
                              <div
                                className="w-full flex items-center justify-center overflow-hidden relative"
                                style={{ background: design.canvas?.background || "#f3f4f6", height: 100 }}
                              >
                                {design.elements?.length > 0 ? (
                                  <MiniDesignCanvas
                                    canvasData={design.canvas}
                                    elements={design.elements}
                                    maxW={170}
                                    maxH={100}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-1 text-gray-300">
                                    <ImageIcon className="w-6 h-6" />
                                    <span className="text-[10px]">No preview</span>
                                  </div>
                                )}
                                {design.score > 0 && (
                                  <div className="absolute bottom-1.5 right-1.5 bg-surface/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[10px] font-bold text-green-600 border border-green-100">
                                    ★ {design.score}
                                  </div>
                                )}
                                {isSel && (
                                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-colors duration-200" />
                              </div>

                              {/* Card body */}
                              <div className={`px-2.5 py-2 transition-colors ${isSel ? "bg-amber-50" : "bg-surface"}`}>
                                <p className="text-xs font-semibold text-gray-800 truncate">{design.name}</p>
                                {design.copy?.tagline ? (
                                  <p className="text-[10px] text-gray-400 truncate italic mt-0.5">{design.copy.tagline}</p>
                                ) : design.copy?.headline ? (
                                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{design.copy.headline}</p>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Selected design confirmation strip */}
                    {selectedDesign && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <p className="text-xs font-semibold text-amber-700 flex-1 truncate">{selectedDesign.name}</p>
                        <button onClick={clearAll} className="text-amber-400 hover:text-amber-600 cursor-pointer transition shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Score button — always visible at bottom when something is selected */}
                {hasInput && (
                  <button
                    onClick={handleScore}
                    disabled={loading}
                    className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
                  >
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Scoring…</span>
                      : "✦ Score This Creative"
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Detected elements */}
            <AnimatePresence>
              {data?.elements?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-surface border border-gray-100 rounded-2xl p-5 shadow-sm"
                >
                  <p className="font-semibold text-sm text-gray-800 mb-3">Detected Elements</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {data.elements.map((el, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                        {el.detected
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          : <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        }
                        <span className="text-xs font-medium text-gray-700 truncate">{el.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-24 bg-surface border border-gray-100 rounded-2xl shadow-sm">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">AI is scoring your creative…</p>
                </div>
              </div>
            )}

            <AnimatePresence>
              {data && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Headline card */}
                  {data.headline && (
                    <div className="bg-surface border border-gray-100 rounded-2xl p-5 shadow-sm">
                      <p className="font-bold text-sm text-gray-900 mb-2">{data.headline}</p>
                      <div className="flex items-center gap-4 mb-3">
                        {data.estimatedCTR && (
                          <span className="text-xs text-gray-400">
                            Est. CTR: <strong className="text-gray-800">{data.estimatedCTR}</strong>
                          </span>
                        )}
                        {data.estimatedConversionLift && (
                          <span className="text-xs font-semibold text-green-600">{data.estimatedConversionLift}</span>
                        )}
                      </div>
                      {(data.bestPlatforms?.length > 0 || data.worstPlatforms?.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {data.bestPlatforms?.map((p) => (
                            <span key={p} className="text-[10px] px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-semibold">{p}</span>
                          ))}
                          {data.worstPlatforms?.map((p) => (
                            <span key={p} className="text-[10px] px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full font-semibold">✗ {p}</span>
                          ))}
                        </div>
                      )}
                      {(data.creativeStrength || data.creativeWeakness || data.audienceSignal) && (
                        <div className="space-y-2.5 border-t border-gray-100 pt-3">
                          {data.creativeStrength && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1">Strength</p>
                              <p className="text-xs text-gray-500 leading-relaxed">{data.creativeStrength}</p>
                            </div>
                          )}
                          {data.creativeWeakness && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1">Key Weakness</p>
                              <p className="text-xs text-gray-500 leading-relaxed">{data.creativeWeakness}</p>
                            </div>
                          )}
                          {data.audienceSignal && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">Audience Signal</p>
                              <p className="text-xs text-gray-500 leading-relaxed">{data.audienceSignal}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Score gauges */}
                  <div className="bg-surface border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <p className="font-semibold text-sm text-gray-800 mb-4">Scores</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Conversion", value: data.conversionScore },
                        { label: "Brand", value: data.brandScore },
                        { label: "Engagement", value: data.engagementScore },
                        { label: "Clarity", value: data.clarityScore },
                        { label: "Targeting", value: data.targetingScore },
                        { label: "Overall", value: data.overallScore },
                      ].map((s) => (
                        <ScoreGauge key={s.label} label={s.label} value={s.value} />
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {data.recommendations?.length > 0 && (
                    <div className="bg-surface border border-gray-100 rounded-2xl p-6 shadow-sm">
                      <p className="font-semibold text-sm text-gray-800 mb-4">AI Recommendations</p>
                      <div className="space-y-3">
                        {data.recommendations.map((r, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 rounded-xl border border-gray-100 bg-gray-50"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800">{r.title}</p>
                                {r.category && <span className="text-[10px] text-gray-400 font-medium">{r.category}</span>}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {r.priority && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityClass(r.priority)}`}>
                                    {r.priority}
                                  </span>
                                )}
                                {r.scoreImpact && <span className="text-xs font-bold text-green-600">{r.scoreImpact}</span>}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{r.detail}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!data && !loading && (
              <div className="flex items-center justify-center h-64 bg-surface border border-gray-100 rounded-2xl shadow-sm">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-7 h-7 text-amber-300" />
                  </div>
                  <p className="text-sm text-gray-400">Score results will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}