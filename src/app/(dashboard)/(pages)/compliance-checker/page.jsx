"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Upload, Loader2, X,
  CheckCircle, XCircle, AlertTriangle, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // ← adjust path if needed

const PLATFORMS = [
  { id: "facebook",  label: "Meta"       },
  { id: "google",    label: "Google"     },
  { id: "linkedin",  label: "LinkedIn"   },
  { id: "tiktok",    label: "TikTok"     },
  { id: "twitter",   label: "Twitter/X"  },
];

// ── status badge ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  Passed:  { icon: CheckCircle,    text: "text-green-600",  bg: "bg-green-50  border-green-100"  },
  Failed:  { icon: XCircle,        text: "text-red-600",    bg: "bg-red-50    border-red-100"    },
  Warning: { icon: AlertTriangle,  text: "text-orange-500", bg: "bg-orange-50 border-orange-100" },
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

// ── issue row ─────────────────────────────────────────────────────────────────
function IssueRow({ title, detail, titleColor = "text-gray-800" }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
      <p className={`text-sm font-semibold mb-0.5 ${titleColor}`}>{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{detail}</p>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function ComplianceChecker() {
  const { checkCompliance } = useAuth();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["facebook", "google", "linkedin"]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const acceptFile = (f) => {
    if (!f) return;
    setFile(f);
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

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setData(null);
    setError("");
  };

  const togglePlatform = (id) =>
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const analyze = async () => {
    if (!file || selectedPlatforms.length === 0) return;
    setLoading(true);
    setError("");
    setData(null);

    const response = await checkCompliance({
      image: file,
      platforms: selectedPlatforms,
    });

    if (!response.ok) {
      setError(response.message || "Check failed. Please try again.");
    } else {
      setData(response.data);
    }
    setLoading(false);
  };

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
            <p className="font-semibold text-sm text-gray-800 mb-4">Upload Ad Creative</p>

            {!preview ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors"
                style={{ borderColor: dragging ? "#2563eb" : "#e5e7eb", background: dragging ? "#eff6ff" : "#f9fafb" }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700">Click or drop to upload</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP supported</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={preview}
                  alt="Ad creative"
                  className="w-full object-contain max-h-72 bg-gray-100"
                />
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <div className="px-1 pt-2">
                  <p className="text-xs font-semibold text-gray-700 truncate">{file?.name}</p>
                  <p className="text-[10px] text-gray-400">{(file?.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
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
                      ? { borderColor: "#2563eb", background: "#eff6ff", color: "#2563eb" }
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
          {file && (
            <button
              onClick={analyze}
              disabled={loading || selectedPlatforms.length === 0}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
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

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">AI is checking compliance…</p>
              </div>
            </div>
          )}

          {/* Results */}
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

          {/* Empty state */}
          {!data && !loading && (
            <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
              <div className="text-center">
                <ShieldCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Upload an ad to check compliance</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}