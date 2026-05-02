"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // ← adjust path if needed
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from "recharts";

// ── helpers ───────────────────────────────────────────────────────────────────
const LEVELS = ["VERY POOR", "POOR", "NORMAL", "GOOD", "EXCELLENT"];
const LEVEL_COLORS = ["#ef4444", "#f97316", "#2563eb", "#22c55e", "#10b981"];

const scoreColor = (level) => {
  const i = LEVELS.indexOf(level);
  return i >= 0 ? LEVEL_COLORS[i] : "#2563eb";
};

// ── sub-components ────────────────────────────────────────────────────────────
const MetricRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-sm font-bold" style={{ color }}>{value}</span>
  </div>
);

const RecommendationItem = ({ index, text }) => (
  <motion.div
    initial={{ opacity: 0, x: 8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50"
  >
    <div
      className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 text-white"
      style={{ background: "#2563eb" }}
    >
      {index + 1}
    </div>
    <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
  </motion.div>
);

// ── main page ─────────────────────────────────────────────────────────────────
export default function CreativeInsights() {
  const { creativeInsights } = useAuth();

  const [brand, setBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!brand.trim()) return;
    setLoading(true);
    setError("");
    setData(null);

    const response = await creativeInsights({ brand });

    if (!response.ok) {
      setError(response.message || "Analysis failed. Please try again.");
    } else {
      setData(response.data);
    }
    setLoading(false);
  };

  const color = data ? scoreColor(data.ciLevel) : "#2563eb";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Page header ── */}
      <div className="mb-6">
     
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #9333ea)" }}
          >
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Creative Insight</h1>
            <p className="text-sm text-gray-400">The ultimate Creative Insight dashboard, built for performance-driven brands.</p>
          </div>
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="flex gap-3 mb-6">
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="Enter your brand or account name (e.g. Nike, Shopify)"
          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-400 transition-colors"
        />
        <button
          onClick={analyze}
          disabled={loading || !brand.trim()}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : "Analyze"
          }
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl mb-6">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24 bg-white border border-gray-200 rounded-2xl">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Generating creative insights…</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      <AnimatePresence>
        {data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <p className="text-sm text-gray-400">{data.brand} — Account Insights</p>

            {/* CI Score + Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* CI Score gauge */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <p className="font-semibold text-sm text-gray-800 mb-0.5">Your CI Score</p>
                <p className="text-xs text-gray-400 mb-4">Compared to others in your market.</p>

                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <RadialBarChart
                      width={140} height={140} cx={70} cy={70}
                      innerRadius={45} outerRadius={65}
                      data={[{ value: data.ciScore, fill: color }]}
                      startAngle={90} endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={6}
                        background={{ fill: "#f3f4f6" }}
                      />
                    </RadialBarChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold" style={{ color }}>{data.ciScore}%</p>
                      <p className="text-[10px] text-gray-400">{data.ciLevel}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2"
                      style={{ background: color + "22", color }}
                    >
                      {data.ciLevel}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">{data.ciSummary}</p>
                  </div>
                </div>

                {/* Score scale */}
                <div className="mt-4 flex items-center gap-1">
                  {LEVELS.map((l, i) => (
                    <div
                      key={l}
                      className="flex-1 h-1.5 rounded-full transition-opacity"
                      style={{
                        background: LEVEL_COLORS[i],
                        opacity: data.ciLevel === l ? 1 : 0.25,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {LEVELS.map((l) => (
                    <span
                      key={l}
                      className="text-[9px]"
                      style={{
                        color: data.ciLevel === l ? "#111827" : "#9ca3af",
                        fontWeight: data.ciLevel === l ? 700 : 400,
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metric overview */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <p className="font-semibold text-sm text-gray-800 mb-4">Metric Overview</p>
                <div className="space-y-2.5">
                  <MetricRow label="Creative Insights Score" value={data.ciScore + "%"}   color="#2563eb" />
                  <MetricRow label="Average CTR"             value={data.avgCTR}           color="#7c3aed" />
                  <MetricRow label="Active Creatives"        value={data.activeCreatives}  color="#22c55e" />
                  <MetricRow label="Fatigued Creatives"      value={data.fatiguedCreatives} color="#f97316" />
                </div>
              </div>
            </div>

            {/* Trend chart */}
            {data.trendData?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6"
              >
                <p className="font-semibold text-sm text-gray-800 mb-4">Performance Trend</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.trendData}>
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#374151",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ctr"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="4 2"
                    />
                  </LineChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0.5 rounded-full bg-blue-600" />
                    <span className="text-[11px] text-gray-400">Score</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0.5 rounded-full bg-violet-600" style={{ backgroundImage: "repeating-linear-gradient(90deg,#7c3aed 0,#7c3aed 4px,transparent 4px,transparent 6px)" }} />
                    <span className="text-[11px] text-gray-400">CTR</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recommendations */}
            {data.recommendations?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white border border-gray-200 rounded-2xl p-6"
              >
                <p className="font-semibold text-sm text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  AI Recommendations
                </p>
                <div className="space-y-2">
                  {data.recommendations.map((r, i) => (
                    <RecommendationItem key={i} index={i} text={r} />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {!data && !loading && (
        <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
          <div className="text-center">
            <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Enter a brand name to generate insights</p>
          </div>
        </div>
      )}

    </div>
  );
}