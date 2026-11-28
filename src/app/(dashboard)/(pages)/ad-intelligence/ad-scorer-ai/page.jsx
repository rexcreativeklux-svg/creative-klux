"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Loader2, CheckCircle, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CreativeSourcePicker } from "../CreativePicker";
import { hostedImageToFile } from "../hostedImageFile";
import { RadialBarChart, RadialBar } from "recharts";

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

// ═════════════════════════════════════════════════════════════════════════════
export default function CreativeScoring() {
  const { creativeScoring } = useAuth();

  // ── the creative to score — one pick from CreativeSourcePicker:
  // { kind: "design", design } | { kind: "magic", item } |
  // { kind: "file", file, preview } | null
  const [pick, setPick] = useState(null);

  // ── scoring state ──
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const handlePick = (next) => {
    setPick(next);
    setData(null);
    setError("");
  };

  // ── score ─────────────────────────────────────────────────────────────────
  const handleScore = async () => {
    setLoading(true);
    setError("");
    setData(null);

    let response;
    if (pick?.kind === "file") {
      response = await creativeScoring({ image: pick.file });
    } else if (pick?.kind === "magic") {
      // A Magic Studio result is a hosted image — scored as a file like an upload.
      let magicFile;
      try {
        magicFile = await hostedImageToFile(pick.item.url, pick.item.label);
      } catch (err) {
        setError(err?.message || "Couldn't load that Magic Studio image.");
        setLoading(false);
        return;
      }
      response = await creativeScoring({ image: magicFile });
    } else if (pick?.kind === "design") {
      const rawCanvas = pick.design.raw.canvas;
      response = await creativeScoring({
        canvas: typeof rawCanvas === "string" ? rawCanvas : JSON.stringify(rawCanvas),
      });
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

  const hasInput = !!pick;

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

              {/* Creative source — From Creatives · Magic Studio · Upload */}
              <div className="p-5">
                <CreativeSourcePicker
                  value={pick}
                  onChange={handlePick}
                  accent="amber"
                />

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
                    {/* Each gauge draws a fixed 90px chart, so three across
                        (≈366px + padding) cannot fit a phone — two until sm. */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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