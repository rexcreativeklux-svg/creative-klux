"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Upload,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  LayoutGrid,
  Image as ImageIcon,
  Search,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
// Shared, read-only renderer — same one the editor (/design/[id]) uses to paint,
// so these thumbnails match exactly what opens in the editor.
import { renderDesignToCanvas } from "@/(lib)/design/renderDesign";

const PLATFORMS = [
  { id: "Meta", label: "Meta" },
  { id: "Google", label: "Google" },
  { id: "LinkedIn", label: "LinkedIn" },
  { id: "TikTok", label: "TikTok" },
  { id: "Twitter/X", label: "Twitter/X" },
];

/* ─── helpers ─────────────────────────────────────────────────── */
const STATUS_CFG = {
  Passed: {
    icon: CheckCircle,
    text: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-100",
  },
  Failed: {
    icon: XCircle,
    text: "text-red-600",
    bg: "bg-red-50 border-red-100",
  },
  Warning: {
    icon: AlertTriangle,
    text: "text-amber-500",
    bg: "bg-amber-50 border-amber-100",
  },
};

const SEVERITY_COLOR = {
  Critical: "text-red-500",
  Major: "text-orange-500",
  Minor: "text-amber-500",
};

const GRADE_COLOR = {
  A: "#10b981",
  B: "#2563eb",
  C: "#f97316",
  D: "#ef4444",
  F: "#7f1d1d",
};

const scoreColor = (s) =>
  s >= 80 ? "#10b981" : s >= 60 ? "#2563eb" : s >= 40 ? "#f97316" : "#ef4444";

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Warning;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.text} ${cfg.bg}`}
    >
      <Icon className="w-3 h-3" /> {status ?? "Warning"}
    </span>
  );
}

function SectionCard({ title, status, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-surface border border-gray-200 rounded-2xl p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-sm text-gray-900">{title}</p>
        {status && <StatusBadge status={status} />}
      </div>
      {children}
    </motion.div>
  );
}

function IssueRow({
  title,
  detail,
  severity,
  fix,
  titleColor = "text-gray-800",
}) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
      <div className="flex items-center gap-2">
        <p className={`text-xs font-semibold ${titleColor}`}>{title}</p>
        {severity && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wide ${SEVERITY_COLOR[severity] ?? ""}`}
          >
            {severity}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{detail}</p>
      {fix && <p className="text-xs text-teal-600 font-medium">↳ Fix: {fix}</p>}
    </div>
  );
}

/* ─── MiniDesignCanvas ────────────────────────────────────────── */
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
      style={{
        width: canvasData.width * scale,
        height: canvasData.height * scale,
        display: "block",
      }}
    />
  );
}

/* ─── normalizeDesign ─────────────────────────────────────────── */
function normalizeDesign(raw) {
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
    id: raw.id,
    name: raw.name || "Untitled Design",
    score: raw.score || 0,
    copy,
    canvas: canvasData || { width: 800, height: 450, background: "#ffffff" },
    elements,
    raw,
  };
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function ComplianceChecker() {
  const { checkCompliance, fetchDesigns } = useAuth();
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

  // ── platform + check state ──
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    "Meta",
    "Google",
    "LinkedIn",
  ]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  /* ── load designs ── */
  const loadDesigns = useCallback(async () => {
    setDesignsLoading(true);
    setDesignsError("");
    const result = await fetchDesigns(50);
    if (!result) {
      setDesignsError(
        "Failed to load designs. Make sure you have an active brand selected.",
      );
    } else {
      const arr = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : [];
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
    if (tab === "upload" && !file) {
      setTimeout(() => fileRef.current?.click(), 50);
    }
  };

  const filtered = useMemo(
    () =>
      designs.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          (d.copy?.tagline || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [designs, search],
  );

  /* ── file handlers ── */
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

  const handleSelectDesign = (design) => {
    setSelectedDesign(design);
    setFile(null);
    setPreview(null);
    setData(null);
    setError("");
  };

  const togglePlatform = (id) =>
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  /* ── analyze ── */
  const analyze = async () => {
    if (selectedPlatforms.length === 0) {
      setError("Please select at least one platform.");
      return;
    }
    setLoading(true);
    setError("");
    setData(null);

    let response;
    if (file) {
      response = await checkCompliance({
        image: file,
        platforms: selectedPlatforms,
      });
    } else if (selectedDesign) {
      const canvasPayload =
        typeof selectedDesign.raw.canvas === "string"
          ? selectedDesign.raw.canvas
          : JSON.stringify(selectedDesign.raw.canvas);
      response = await checkCompliance({
        canvas: canvasPayload,
        platforms: selectedPlatforms,
      });
    } else {
      setError("Please upload an image or select a design first.");
      setLoading(false);
      return;
    }

    if (!response.ok) {
      setError(response.message || "Check failed. Please try again.");
    } else {
      setData(response.data);
    }
    setLoading(false);
  };

  const hasInput = !!file || !!selectedDesign;

  return (
    <div className="" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="pb-5">
        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-linear-to-br from-emerald-500 to-teal-600 shadow-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ad Guard AI</h1>
              <p className="text-sm text-gray-400">
                Verify ad compliance for platform, brand, and legal standards.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT ── */}
          <div className="flex flex-col gap-4">
            {/* Source card with tabs */}
            <div className="bg-surface border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Platform toggles */}
              <div className=" p-5 ">
                <p className="font-semibold text-sm text-gray-900 mb-3">
                  Check Against Platforms
                </p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => {
                    const active = selectedPlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                        style={
                          active
                            ? {
                                borderColor: "#10b981",
                                background: "#ecfdf5",
                                color: "#059669",
                              }
                            : {
                                borderColor: "#e5e7eb",
                                background: "white",
                                color: "#9ca3af",
                              }
                        }
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab switcher */}
              <div className="flex border-b border-gray-100 px-4">
                <button
                  onClick={() => handleTabSwitch("upload")}
                  className={`flex-1 flex items-center justify-center rounded-xl gap-2 py-3.5 text-sm font-semibold transition-all cursor-pointer border-2 ${
                    activeTab === "upload"
                      ? "border-emerald-500 text-emerald-600 bg-emerald-50/40"
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Upload className="w-4 h-4" /> Upload Image
                </button>
                <button
                  onClick={() => handleTabSwitch("designs")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold rounded-xl transition-all cursor-pointer border-2 ${
                    activeTab === "designs"
                      ? "border-emerald-500 text-emerald-600 bg-emerald-50/40"
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
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        onClick={() => fileRef.current?.click()}
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all py-12 group"
                        style={{
                          borderColor: dragging ? "#10b981" : "#e5e7eb",
                          background: dragging ? "#f0fdf4" : "#f9fafb",
                        }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center mb-3 transition-colors">
                          <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, WEBP supported
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden">
                          <img
                            src={preview}
                            alt="Ad creative"
                            className="w-full object-contain max-h-72 bg-gray-100"
                          />
                          <button
                            onClick={clearAll}
                            className="absolute top-2 right-2 w-7 h-7 bg-surface rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition cursor-pointer shadow-sm"
                          >
                            <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-surface/90 rounded-lg px-2 py-0.5 shadow-sm">
                            <p className="text-xs font-semibold text-gray-700 truncate max-w-[180px]">
                              {file?.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {(file?.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="w-full py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 transition cursor-pointer"
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
                    {/* Search + refresh */}
                    {!designsLoading && designs.length > 0 && (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search designs…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                          />
                        </div>
                        <button
                          onClick={loadDesigns}
                          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-emerald-500 hover:border-emerald-200 transition cursor-pointer shrink-0"
                          title="Refresh"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Loading */}
                    {designsLoading && (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
                        <p className="text-sm text-gray-400">
                          Loading designs…
                        </p>
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
                    {!designsLoading &&
                      !designsError &&
                      designs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-14 gap-2">
                          <LayoutGrid className="w-9 h-9 text-gray-200" />
                          <p className="text-sm text-gray-400">
                            No saved designs found.
                          </p>
                          <p className="text-xs text-gray-300">
                            Create a design first from the Studio.
                          </p>
                        </div>
                      )}

                    {/* No search match */}
                    {!designsLoading &&
                      !designsError &&
                      filtered.length === 0 &&
                      designs.length > 0 && (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <p className="text-sm text-gray-400">
                            No designs match "{search}"
                          </p>
                          <button
                            onClick={() => setSearch("")}
                            className="text-xs text-emerald-500 hover:text-emerald-600 cursor-pointer transition"
                          >
                            Clear search
                          </button>
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
                              className={`text-left rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:border-emerald-300 hover:shadow-md group ${
                                isSel
                                  ? "border-emerald-400 shadow-lg shadow-emerald-100/60"
                                  : "border-gray-100"
                              }`}
                            >
                              {/* Canvas preview */}
                              <div
                                className="w-full flex items-center justify-center overflow-hidden relative"
                                style={{
                                  background:
                                    design.canvas?.background || "#f3f4f6",
                                  height: 100,
                                }}
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
                                    <span className="text-[10px]">
                                      No preview
                                    </span>
                                  </div>
                                )}

                                {design.score > 0 && (
                                  <div
                                    className="absolute bottom-1.5 right-1.5 bg-surface/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[10px] font-bold border border-green-100"
                                    style={{ color: scoreColor(design.score) }}
                                  >
                                    ★ {design.score}
                                  </div>
                                )}
                                {isSel && (
                                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors duration-200" />
                              </div>

                              {/* Card body */}
                              <div
                                className={`px-2.5 py-2 transition-colors ${isSel ? "bg-emerald-50" : "bg-surface"}`}
                              >
                                <p className="text-xs font-semibold text-gray-800 truncate">
                                  {design.name}
                                </p>
                                {design.copy?.tagline ? (
                                  <p className="text-[10px] text-gray-400 truncate italic mt-0.5">
                                    {design.copy.tagline}
                                  </p>
                                ) : design.copy?.headline ? (
                                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                    {design.copy.headline}
                                  </p>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Selection confirmation strip */}
                    {selectedDesign && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <p className="text-xs font-semibold text-emerald-700 flex-1 truncate">
                          {selectedDesign.name}
                        </p>
                        <button
                          onClick={clearAll}
                          className="text-emerald-400 hover:text-emerald-600 cursor-pointer transition shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* CTA */}
            {hasInput && (
              <button
                onClick={analyze}
                disabled={loading || selectedPlatforms.length === 0}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md bg-linear-to-r from-emerald-500 to-teal-600"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Checking
                    compliance…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Run Compliance Check
                  </span>
                )}
              </button>
            )}
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="flex flex-col gap-4">
            {loading && (
              <div className="flex items-center justify-center h-64 bg-surface border border-gray-200 rounded-2xl shadow-sm">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">
                    AI is checking compliance…
                  </p>
                </div>
              </div>
            )}

            <AnimatePresence>
              {data && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4"
                >
                  {/* Overall */}
                  <div className="bg-surface border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 mb-0.5">
                          Overall Compliance
                        </p>
                        <p className="text-sm font-semibold text-gray-800 leading-snug">
                          {data.summary}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={data.overallStatus} />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Grade:</span>
                          <span
                            className="font-bold text-xl"
                            style={{
                              color:
                                GRADE_COLOR[data.complianceGrade] ?? "#6b7280",
                            }}
                          >
                            {data.complianceGrade}
                          </span>
                          <span className="text-xs text-gray-400">
                            Risk:{" "}
                            <strong className="text-gray-700">
                              {data.overallRiskScore}/100
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Platform Compliance */}
                  {data.platformCompliance?.length > 0 && (
                    <SectionCard title="Platform Compliance" delay={0.05}>
                      <div className="flex flex-col gap-3">
                        {data.platformCompliance.map((p, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.08 + i * 0.05 }}
                            className="p-3 rounded-xl bg-gray-50 border border-gray-100"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-gray-800">
                                {p.platform}
                              </p>
                              <StatusBadge status={p.status} />
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {p.reason}
                            </p>
                            {p.fix && (
                              <p className="text-xs text-teal-600 font-medium mt-1">
                                ↳ Fix: {p.fix}
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Brand Compliance */}
                  <SectionCard
                    title="Brand Compliance"
                    status={data.brandCompliance?.status}
                    delay={0.1}
                  >
                    {data.brandCompliance?.issues?.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {data.brandCompliance.issues.map((issue, i) => (
                          <IssueRow
                            key={i}
                            title={issue.issue}
                            detail={issue.detail}
                            severity={issue.severity}
                            fix={issue.fix}
                            titleColor="text-orange-500"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">
                        No brand compliance issues detected.
                      </p>
                    )}
                  </SectionCard>

                  {/* Legal Compliance */}
                  <SectionCard
                    title="Legal Compliance"
                    status={data.legalCompliance?.status}
                    delay={0.15}
                  >
                    {data.legalCompliance?.issues?.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {data.legalCompliance.issues.map((issue, i) => (
                          <IssueRow
                            key={i}
                            title={issue.check}
                            detail={issue.detail}
                            severity={issue.severity}
                            fix={issue.fix}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">
                        No legal compliance issues detected.
                      </p>
                    )}
                  </SectionCard>

                  {/* Content Safety + Accessibility */}
                  {(data.contentSafety || data.accessibility) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.contentSafety && (
                        <SectionCard
                          title="Content Safety"
                          status={data.contentSafety?.status}
                          delay={0.2}
                        >
                          {data.contentSafety.issues?.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {data.contentSafety.issues.map((issue, i) => (
                                <p key={i} className="text-xs text-gray-500">
                                  • {issue.detail}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">
                              No content safety issues detected.
                            </p>
                          )}
                        </SectionCard>
                      )}
                      {data.accessibility && (
                        <SectionCard
                          title="Accessibility"
                          status={data.accessibility?.status}
                          delay={0.22}
                        >
                          <p className="text-xs text-gray-500 mb-1">
                            Contrast: {data.accessibility.contrastEstimate}
                          </p>
                          <p className="text-xs text-gray-500">
                            {data.accessibility.readabilityNote}
                          </p>
                        </SectionCard>
                      )}
                    </div>
                  )}

                  {/* Action Plan */}
                  {data.actionPlan?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-linear-to-br from-emerald-50 via-white to-teal-50 border border-emerald-100 rounded-2xl p-5 shadow-sm"
                    >
                      <p className="font-semibold text-sm text-gray-900 mb-4">
                        Action Plan
                      </p>
                      <div className="flex flex-col gap-3">
                        {data.actionPlan.map((step, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!data && !loading && (
              <div className="flex items-center justify-center h-64 bg-surface border border-gray-200 rounded-2xl shadow-sm">
                <div className="text-center">
                  <ShieldCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    Upload an image or pick a saved design to check compliance
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
