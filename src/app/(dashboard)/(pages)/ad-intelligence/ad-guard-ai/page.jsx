"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CreativeSourcePicker } from "../CreativePicker";
import { hostedImageToFile } from "../hostedImageFile";

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

/* ─── Main ────────────────────────────────────────────────────── */
export default function ComplianceChecker() {
  const { checkCompliance } = useAuth();

  // ── the creative to check — one pick from CreativeSourcePicker:
  // { kind: "design", design } | { kind: "magic", item } |
  // { kind: "file", file, preview } | null
  const [pick, setPick] = useState(null);

  // ── platform + check state ──
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    "Meta",
    "Google",
    "LinkedIn",
  ]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const handlePick = (next) => {
    setPick(next);
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
    if (pick?.kind === "file") {
      response = await checkCompliance({
        image: pick.file,
        platforms: selectedPlatforms,
      });
    } else if (pick?.kind === "magic") {
      // A Magic Studio result is a hosted image — sent as a file like an upload.
      let magicFile;
      try {
        magicFile = await hostedImageToFile(pick.item.url, pick.item.label);
      } catch (err) {
        setError(err?.message || "Couldn't load that Magic Studio image.");
        setLoading(false);
        return;
      }
      response = await checkCompliance({
        image: magicFile,
        platforms: selectedPlatforms,
      });
    } else if (pick?.kind === "design") {
      const rawCanvas = pick.design.raw.canvas;
      response = await checkCompliance({
        canvas:
          typeof rawCanvas === "string" ? rawCanvas : JSON.stringify(rawCanvas),
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

  const hasInput = !!pick;

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

              {/* Creative source — From Creatives · Magic Studio · Upload */}
              <div className="px-5 pb-5">
                <CreativeSourcePicker
                  value={pick}
                  onChange={handlePick}
                  accent="emerald"
                />
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
