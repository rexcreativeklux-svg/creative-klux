"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Upload, Loader2, X,
  CheckCircle, XCircle, AlertTriangle, AlertCircle,
  LayoutGrid, Image as ImageIcon, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const PLATFORMS = [
  { id: "Meta",       label: "Meta"      },
  { id: "Google",     label: "Google"    },
  { id: "LinkedIn",   label: "LinkedIn"  },
  { id: "TikTok",     label: "TikTok"    },
  { id: "Twitter/X",  label: "Twitter/X" },
];

/* ─── status badge ────────────────────────────────────────────── */
const STATUS_CFG = {
  Passed:  { icon: CheckCircle,   text: "text-green-600",  bg: "bg-green-50  border-green-100"  },
  Failed:  { icon: XCircle,       text: "text-red-600",    bg: "bg-red-50    border-red-100"    },
  Warning: { icon: AlertTriangle, text: "text-orange-500", bg: "bg-orange-50 border-orange-100" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Warning;
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.text} ${cfg.bg}`}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
}

function IssueRow({ title, detail, titleColor = "text-gray-800" }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
      <p className={`text-sm font-semibold mb-0.5 ${titleColor}`}>{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{detail}</p>
    </div>
  );
}

/* ─── scoreColor helper (for design score badges) ────────────── */
const scoreColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#2563eb";
  if (score >= 40) return "#f97316";
  return "#ef4444";
};

/* ─── DesignModal ─────────────────────────────────────────────── */
function DesignModal({ onClose, onSelect }) {
  const { fetchDesigns } = useAuth();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await fetchDesigns(50);
      if (!result) {
        setError("Failed to load designs. Make sure you have an active brand selected.");
      } else {
        const arr = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
            ? result.data
            : [];
        setDesigns(arr);
      }
      setLoading(false);
    })();
  }, []);

  const handleConfirm = () => {
    if (!selected) return;
    onSelect(selected);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
            >
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Choose a Design</p>
              <p className="text-xs text-gray-400">Select a saved creative to check compliance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              <p className="text-sm text-gray-400">Loading your designs…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && designs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <LayoutGrid className="w-10 h-10 text-gray-200" />
              <p className="text-sm text-gray-400">No saved designs found for this brand.</p>
            </div>
          )}

          {/* Masonry grid */}
          {!loading && designs.length > 0 && (
            <div className="columns-2 md:columns-3 gap-3 space-y-3">
              {designs.map((design) => {
                const canvasData = (() => {
                  try {
                    return typeof design.canvas === "string"
                      ? JSON.parse(design.canvas)
                      : design.canvas;
                  } catch { return null; }
                })();
                const copyData = (() => {
                  try {
                    return typeof design.copy === "string"
                      ? JSON.parse(design.copy)
                      : design.copy;
                  } catch { return {}; }
                })();

                const bgColor = canvasData?.canvas?.background || "#f4f4f4";
                const isSelected = selected?.id === design.id;
                const imgEl = canvasData?.elements?.find((el) => el.type === "image");

                return (
                  <div
                    key={design.id}
                    onClick={() => setSelected(design)}
                    className="break-inside-avoid mb-3 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: isSelected ? "#10b981" : "transparent",
                      boxShadow: isSelected
                        ? "0 0 0 3px rgba(16,185,129,0.18)"
                        : "0 1px 4px rgba(0,0,0,0.07)",
                    }}
                  >
                    <div
                      className="w-full relative flex items-center justify-center overflow-hidden"
                      style={{ background: bgColor, minHeight: 100, aspectRatio: "4/3" }}
                    >
                      {imgEl ? (
                        <img
                          src={imgEl.url}
                          alt={design.name}
                          className="w-full h-full object-cover"
                          style={{ opacity: imgEl.opacity ?? 1 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {design.score && (
                        <div
                          className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ background: scoreColor(design.score) }}
                        >
                          {design.score}
                        </div>
                      )}
                    </div>

                    <div className="bg-white px-3 py-2">
                      <p className="text-xs font-semibold text-gray-800 truncate">{design.name}</p>
                      {copyData?.headline && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{copyData.headline}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {selected ? `Selected: ${selected.name}` : "No design selected"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
            >
              Use This Design <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function ComplianceChecker() {
  const { checkCompliance } = useAuth();

  // Source: "image" | "design" | null
  const [source, setSource] = useState(null);

  // Image upload state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  // Design state
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Shared state
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Meta", "Google", "LinkedIn"]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  /* ── file handlers ── */
  const acceptFile = (f) => {
    if (!f) return;
    setFile(f);
    setSource("image");
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
    setSource(null);
    setData(null);
    setError("");
  };

  const handleDesignSelect = (design) => {
    setSelectedDesign(design);
    setSource("design");
    setFile(null);
    setPreview(null);
    setData(null);
    setError("");
  };

  const togglePlatform = (id) =>
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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

    if (source === "image" && file) {
      response = await checkCompliance({ image: file, platforms: selectedPlatforms });
    } else if (source === "design" && selectedDesign) {
      const canvasPayload = typeof selectedDesign.canvas === "string"
        ? selectedDesign.canvas
        : JSON.stringify(selectedDesign.canvas);
      response = await checkCompliance({ canvas: canvasPayload, platforms: selectedPlatforms });
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

  const hasInput = source !== null;

  // Design preview helpers
  const designCanvasData = (() => {
    if (!selectedDesign) return null;
    try {
      return typeof selectedDesign.canvas === "string"
        ? JSON.parse(selectedDesign.canvas)
        : selectedDesign.canvas;
    } catch { return null; }
  })();
  const designBg = designCanvasData?.canvas?.background || "#f4f4f4";
  const designImg = designCanvasData?.elements?.find((el) => el.type === "image");

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Compliance Checker AI</h1>
            <p className="text-sm text-gray-400">Verify ad compliance for platform, brand, and legal standards.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: Upload + Platform selection ── */}
        <div className="flex flex-col gap-4">

          {/* Upload card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <p className="font-semibold text-sm text-gray-800 mb-4">Choose Creative Source</p>

            {/* Both pickers — shown when nothing selected */}
            {!hasInput && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Upload image */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all group"
                  style={{
                    borderColor: dragging ? "#10b981" : "#e5e7eb",
                    background: dragging ? "#f0fdf4" : "#f9fafb",
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => acceptFile(e.target.files?.[0])}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-green-100 flex items-center justify-center mb-3 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 text-center">Upload Image</p>
                  <p className="text-xs text-gray-400 mt-1 text-center">PNG, JPG, WEBP</p>
                </div>

                {/* Choose from designs */}
                <button
                  onClick={() => setShowModal(true)}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-teal-400 hover:bg-teal-50/40 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center mb-3 transition-colors">
                    <LayoutGrid className="w-5 h-5 text-gray-400 group-hover:text-teal-500 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 text-center">Choose a Design</p>
                  <p className="text-xs text-gray-400 mt-1 text-center">From saved creatives</p>
                </button>
              </div>
            )}

            {/* Image preview */}
            {source === "image" && preview && (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={preview}
                    alt="Ad creative"
                    className="w-full object-contain max-h-72 bg-gray-100"
                  />
                  <button
                    onClick={clearAll}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer shadow-sm"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-0.5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-700 truncate max-w-[180px]">{file?.name}</p>
                    <p className="text-[10px] text-gray-400">{(file?.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:border-teal-300 hover:text-teal-600 transition cursor-pointer"
                >
                  Or choose from saved designs instead
                </button>
              </div>
            )}

            {/* Design preview */}
            {source === "design" && selectedDesign && (
              <div className="space-y-3">
                <div
                  className="relative rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: designBg, minHeight: 180, maxHeight: 280 }}
                >
                  {designImg ? (
                    <img
                      src={designImg.url}
                      alt={selectedDesign.name}
                      className="w-full h-full object-cover"
                      style={{ opacity: designImg.opacity ?? 1, maxHeight: 280 }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-10">
                      <LayoutGrid className="w-8 h-8 text-gray-300" />
                      <p className="text-xs text-gray-400">Canvas design</p>
                    </div>
                  )}
                  <button
                    onClick={clearAll}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer shadow-sm"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-white/90 rounded-lg text-xs font-semibold text-gray-700 shadow-sm">
                    {selectedDesign.name}
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:border-teal-300 hover:text-teal-600 transition cursor-pointer"
                >
                  Choose a different design
                </button>
              </div>
            )}
          </div>

          {/* Platform toggles */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="font-semibold text-sm text-gray-800 mb-3">Check Against Platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                    style={active
                      ? { borderColor: "#10b981", background: "#f0fdf4", color: "#10b981" }
                      : { borderColor: "#e5e7eb", background: "white", color: "#9ca3af" }
                    }
                  >
                    {p.label}
                  </button>
                );
              })}
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
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking compliance…</span>
                : "✦ Check Compliance"
              }
            </button>
          )}
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="flex flex-col gap-4">

          {loading && (
            <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-green-500 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">AI is checking compliance…</p>
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
                {/* Overall status */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Overall Compliance</p>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{data.summary}</p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={data.overallStatus} />
                  </div>
                </div>

                {/* Platform compliance */}
                {data.platformCompliance?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white border border-gray-200 rounded-2xl p-5"
                  >
                    <p className="font-semibold text-sm text-gray-800 mb-4">Platform Compliance</p>
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
                            <p className="text-sm font-semibold text-gray-800">{p.platform}</p>
                            <StatusBadge status={p.status} />
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{p.reason}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Brand compliance */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="bg-white border border-gray-200 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-sm text-gray-800">Brand Compliance</p>
                    <StatusBadge status={data.brandCompliance?.status} />
                  </div>
                  {data.brandCompliance?.issues?.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {data.brandCompliance.issues.map((issue, i) => (
                        <IssueRow
                          key={i}
                          title={issue.issue}
                          detail={issue.detail}
                          titleColor="text-orange-500"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No brand compliance issues detected.</p>
                  )}
                </motion.div>

                {/* Legal compliance */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 }}
                  className="bg-white border border-gray-200 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-sm text-gray-800">Legal Compliance</p>
                    <StatusBadge status={data.legalCompliance?.status} />
                  </div>
                  {data.legalCompliance?.issues?.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {data.legalCompliance.issues.map((issue, i) => (
                        <IssueRow
                          key={i}
                          title={issue.check}
                          detail={issue.detail}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No legal compliance issues detected.</p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {!data && !loading && (
            <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
              <div className="text-center">
                <ShieldCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Upload an image or pick a saved design to check compliance</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {showModal && (
          <DesignModal
            onClose={() => setShowModal(false)}
            onSelect={handleDesignSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}