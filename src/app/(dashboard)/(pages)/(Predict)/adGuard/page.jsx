"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Download, ShieldCheck, Upload,
  X, Loader2, Share2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ── design token ──────────────────────────────────────────────────────────────
const PRIMARY = "#2563eb";

const PLATFORMS = [
  { id: "meta", label: "Meta / Facebook / Instagram" },
  { id: "google", label: "Google Ads" },
  { id: "linkedin", label: "LinkedIn Ads" },
  { id: "tiktok", label: "TikTok Ads" },
  { id: "twitter", label: "X / Twitter Ads" },
];

// ── status config ─────────────────────────────────────────────────────────────
const statusCfg = {
  FAILED: { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
  WARNING: { bg: "#fef9c3", color: "#a16207", dot: "#f59e0b" },
  PASSED: { bg: "#dcfce7", color: "#15803d", dot: "#10b981" },
};

function StatusPill({ status }) {
  const cfg = statusCfg[status] || statusCfg.PASSED;
  return (
    <span
      className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-md uppercase"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {status}
    </span>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function AdGuardPage() {
  // Pull both functions from the auth context
  const { checkCompliance, uploadImage } = useAuth();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null); // cached after first upload
  const [dragging, setDragging] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["meta", "google"]);
  const [guidelinesUrl, setGuidelinesUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const acceptFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setUploadedUrl(null); // reset so the new file gets uploaded fresh
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }, []);

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setUploadedUrl(null);
    setError(null);
  };

  const togglePlatform = (id) =>
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  // ── Main handler ───────────────────────────────────────────────────────────
  const handleCheck = async () => {
    if (!file) return;
    setChecking(true);
    setError(null);

    try {
      const response = await checkCompliance({
        image: file,           // ← raw File object, not a URL
        platforms: selectedPlatforms,
      });

      if (!response.ok) {
        setError(response.message || "Compliance check failed");
        return;
      }

      setResult(response.data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const hasResult = !!result;

  // ── shared platform checklist ─────────────────────────────────────────────
  const PlatformChecks = () => (
    <div className="flex flex-col gap-2">
      {PLATFORMS.map((p) => {
        const checked = selectedPlatforms.includes(p.id);
        return (
          <label key={p.id} className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => togglePlatform(p.id)}
              className="w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 cursor-pointer"
              style={{
                background: checked ? PRIMARY : "white",
                borderColor: checked ? PRIMARY : "#d1d5db",
              }}
            >
              {checked && (
                <svg className="w-2.5 h-2.5" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              className="text-sm transition-colors"
              style={{ color: checked ? "#111827" : "#6b7280" }}
              onClick={() => togglePlatform(p.id)}
            >
              {p.label}
            </span>
          </label>
        );
      })}
    </div>
  );

  // ── reusable error banner ─────────────────────────────────────────────────
  const ErrorBanner = ({ compact = false }) =>
    error ? (
      <div className={`flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl ${compact ? "px-3 py-2" : "px-3 py-2.5"}`}>
        <AlertCircle className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} text-red-500 shrink-0 mt-0.5`} />
        <p className={`${compact ? "text-[11px]" : "text-xs"} text-red-600`}>{error}</p>
      </div>
    ) : null;

  return (
    <div className="" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── top bar ── */}
      <div className="flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" style={{ color: PRIMARY }} />
          <span className="font-semibold text-gray-900 text-sm">AdGuard</span>
          <span className="text-xs text-gray-400 ml-1">— Compliance checker</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setResult(null); setError(null); }}
            className="flex items-center hover:scale-105 gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button
            className="flex items-center gap-1.5 hover:scale-105 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition cursor-pointer"
            style={{ background: PRIMARY }}
          >
            <Download className="w-3 h-3" /> Export PDF
          </button>
        </div>
      </div>

      {/* ── body ── */}
      <div className="py-6 mx-auto">
        <AnimatePresence mode="wait">

          {/* ══ CENTERED — no result ════════════════════════════════════════ */}
          {!hasResult && (
            <motion.div
              key="centered"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col items-center justify-center"
              style={{ minHeight: "calc(100vh - 300px)" }}
            >
              <div className="w-full max-w-xl bg-surface rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
                <p className="text-sm font-semibold text-gray-800">Upload Ad Creative</p>

                {/* drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => !file && fileRef.current?.click()}
                  className="relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden"
                  style={{
                    borderColor: dragging ? PRIMARY : "#d1d5db",
                    background: dragging ? "#eff6ff" : "#f9fafb",
                    cursor: file ? "default" : "pointer",
                    minHeight: 180,
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/mp4"
                    className="hidden"
                    onChange={(e) => acceptFile(e.target.files?.[0])}
                  />
                  {file && preview ? (
                    <div className="relative">
                      <img src={preview} alt="preview" className="w-full h-auto object-cover rounded-xl" />
                      <button
                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-surface rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-200 hover:scale-105 cursor-pointer transition"
                      >
                        <X className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-gray-700 truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-12">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: `${PRIMARY}12` }}>
                        <ShieldCheck className="w-5 h-5" style={{ color: PRIMARY }} />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Drop your ad creative</p>
                      <p className="text-xs text-gray-400">PNG, JPG, MP4 supported</p>
                    </div>
                  )}
                </div>

                {/* platforms */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Check against platforms</p>
                  <PlatformChecks />
                </div>

                {/* guidelines URL */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Brand Guidelines URL (optional)</p>
                  <input
                    type="url"
                    value={guidelinesUrl}
                    onChange={(e) => setGuidelinesUrl(e.target.value)}
                    placeholder="https://yourbrand.com/guidelines"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ "--tw-ring-color": PRIMARY }}
                  />
                </div>

                <ErrorBanner />

                <button
                  onClick={handleCheck}
                  disabled={!file || checking || selectedPlatforms.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3.5 hover:scale-105 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1d4ed8)` }}
                >
                  {checking
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Running check…</>
                    : <><ShieldCheck className="w-4 h-4" /> Run Compliance Check</>
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* ══ SPLIT — result visible ══════════════════════════════════════ */}
          {hasResult && (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="grid gap-5"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
              {/* ── LEFT: upload panel ── */}
              <div className="flex flex-col gap-4">
                <div className="bg-surface rounded-2xl border border-gray-200 overflow-hidden">
                  <p className="text-xs font-semibold text-gray-500 px-5 pt-4 pb-3 border-b border-gray-100">Upload Ad Creative</p>

                  {/* mini drop hint */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className="mx-4 mt-3 border border-dashed border-gray-200 rounded-xl py-2 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
                    style={{ borderColor: dragging ? PRIMARY : "#d1d5db" }}
                  >
                    <p className="text-[11px] text-gray-400">PNG, JPG, MP4 supported</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/mp4"
                    className="hidden"
                    onChange={(e) => acceptFile(e.target.files?.[0])}
                  />

                  {/* file card */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
                          <Upload className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                          {file?.name?.replace(/\.[^.]+$/, "") || "Creative"}
                        </span>
                      </div>
                    </div>

                    {preview && (
                      <div className="overflow-hidden mb-3">
                        <img src={preview} alt="creative" className="w-full object-contain max-h-72" />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{file?.name?.replace(/\.[^.]+$/, "") || "Untitled"}</p>
                        <p className="text-xs text-gray-400">{(file?.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer transition">
                          <Share2 className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#dcfce7" }}>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* platform checkboxes (compact) */}
                <div className="bg-surface rounded-2xl border border-gray-200 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Check against platforms</p>
                  <PlatformChecks />

                  <input
                    type="url"
                    value={guidelinesUrl}
                    onChange={(e) => setGuidelinesUrl(e.target.value)}
                    placeholder="https://yourbrand.com/guidelines"
                    className="mt-3 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none transition"
                  />

                  <div className="mt-3">
                    <ErrorBanner compact />
                  </div>

                  <button
                    onClick={handleCheck}
                    disabled={checking || selectedPlatforms.length === 0}
                    className="mt-3 w-full hover:scale-95 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1d4ed8)` }}
                  >
                    {checking
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{uploadedUrl ? " Running…" : " Uploading…"}</>
                      : <><ShieldCheck className="w-3.5 h-3.5" /> Re-run Check</>
                    }
                  </button>
                </div>
              </div>

              {/* ── RIGHT: results ── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex flex-col gap-4 pb-5"
                style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}
              >
                {/* summary tabs */}
                <div className="grid grid-cols-3 gap-3">
                  {result.summary.map((s) => {
                    const cfg = statusCfg[s.status];
                    return (
                      <div key={s.label} className="bg-surface rounded-xl border border-gray-200 px-4 py-3 text-center">
                        <p className="text-[10px] text-gray-400 font-medium mb-1">{s.label}</p>
                        <span className="text-xs font-bold" style={{ color: cfg.color }}>{s.status}</span>
                      </div>
                    );
                  })}
                </div>

                {/* compliance sections */}
                {result.sections.map((section, si) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: 0.15 + si * 0.08 }}
                    className="bg-surface rounded-2xl border border-gray-200 p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-gray-900">{section.title}</p>
                      <span
                        className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-md uppercase"
                        style={{ background: `${section.badgeColor}18`, color: section.badgeColor }}
                      >
                        {section.badge}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {section.items.map((item, ii) => {
                        const cfg = statusCfg[item.status];
                        return (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.18, delay: 0.2 + si * 0.08 + ii * 0.05 }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: cfg.dot }} />
                                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                              </div>
                              <StatusPill status={item.status} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 ml-3.5 leading-relaxed">{item.desc}</p>
                            {ii < section.items.length - 1 && (
                              <div className="border-b border-gray-50 mt-3" />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}