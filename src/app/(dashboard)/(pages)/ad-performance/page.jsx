"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, Loader2, TrendingUp, RefreshCw, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from "recharts";

// ── helpers ───────────────────────────────────────────────────────────────────
const LEVELS       = ["VERY POOR", "POOR", "NORMAL", "GOOD", "EXCELLENT"];
const LEVEL_COLORS = ["#ef4444",   "#f97316", "#2563eb", "#22c55e", "#10b981"];

const scoreColor = (level) => {
  const i = LEVELS.indexOf(level);
  return i >= 0 ? LEVEL_COLORS[i] : "#2563eb";
};

const priorityClass = (p) => ({
  High:   "bg-red-50 text-red-600 border border-red-200",
  Medium: "bg-orange-50 text-orange-600 border border-orange-200",
  Low:    "bg-green-50 text-green-600 border border-green-200",
}[p] || "bg-gray-100 text-gray-500");

// ── card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white border border-gray-100 rounded-2xl p-6  ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ── section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <p className="font-bold text-sm text-gray-800 mb-4">{children}</p>
);

// ── kpi pill ──────────────────────────────────────────────────────────────────
const KpiPill = ({ label, value }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-3 text-center ">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
    <p className="font-bold text-sm text-gray-900">{value ?? "—"}</p>
  </div>
);

// ── metric row ────────────────────────────────────────────────────────────────
const MetricRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-sm font-bold" style={{ color: color || "#111827" }}>{value ?? "—"}</span>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
export default function CreativeInsights() {
  const { creativeInsights } = useAuth();

  const [brand, setBrand]     = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState("");

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
    <div className="">
      <div className="">

        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #9333ea)" }}
            >
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ad Performance</h1>
              <p className="text-sm text-gray-400">The ultimate ad performance dashboard, built for performance-driven brands.</p>
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
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all "
          />
          <button
            onClick={analyze}
            disabled={loading || !brand.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer "
            style={{ background: "linear-gradient(135deg, #8b5cf6, #9333ea)" }}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><RefreshCw className="w-4 h-4" /> Generate Insights</>
            }
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!data && !loading && !error && (
          <div className="flex items-center justify-center py-24 bg-white border border-gray-100 rounded-2xl ">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-violet-300" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No insight data yet</p>
              <p className="text-xs text-gray-400 mt-1">Click Generate Insights to create your Ad Performance report.</p>
              <button
                onClick={analyze}
                disabled={!brand.trim()}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mx-auto disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #9333ea)" }}
              >
                <RefreshCw className="w-4 h-4" /> Generate Insights
              </button>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24 bg-white border border-gray-100 rounded-2xl ">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Generating ad performance insights…</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {data && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <p className="text-sm text-gray-400">
                {data.brand} —{" "}
                <span className="text-gray-700 font-semibold">Account Performance Report</span>
              </p>

              {/* ── Top KPIs ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {[
                  { label: "CI Score",          value: data.ciScore != null ? `${data.ciScore}%` : "—" },
                  { label: "Avg CTR",            value: data.avgCTR },
                  { label: "Avg CPC",            value: data.avgCPC },
                  { label: "Avg ROAS",           value: data.avgROAS },
                  { label: "Impressions",        value: data.impressions },
                  { label: "Conversions",        value: data.conversions },
                  { label: "Active Creatives",   value: data.activeCreatives },
                  { label: "Fatigued",           value: data.fatiguedCreatives },
                ].map((k) => <KpiPill key={k.label} {...k} />)}
              </div>

              {/* ── CI Score + Fatigue ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <Card delay={0.05}>
                  <SectionLabel>CI Score</SectionLabel>
                  <p className="text-xs text-gray-400 -mt-2 mb-4">Compared to others in your market.</p>

                  <div className="flex items-center gap-6">
                    {/* Radial gauge */}
                    <div className="relative shrink-0">
                      <RadialBarChart
                        width={140} height={140} cx={70} cy={70}
                        innerRadius={45} outerRadius={65}
                        data={[{ value: data.ciScore, fill: color }]}
                        startAngle={90} endAngle={-270}
                      >
                        <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#f3f4f6" }} />
                      </RadialBarChart>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold" style={{ color }}>{data.ciScore}%</p>
                        <p className="text-[10px] text-gray-400">{data.ciLevel}</p>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-2"
                        style={{ background: color + "1a", color }}
                      >
                        {data.ciLevel}
                      </span>
                      <p className="text-xs text-gray-500 leading-relaxed">{data.ciSummary}</p>
                    </div>
                  </div>

                  {/* Scale bar */}
                  <div className="mt-4 flex items-center gap-1">
                    {LEVELS.map((l, i) => (
                      <div
                        key={l}
                        className="flex-1 h-1.5 rounded-full transition-opacity"
                        style={{ background: LEVEL_COLORS[i], opacity: data.ciLevel === l ? 1 : 0.2 }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {LEVELS.map((l) => (
                      <span
                        key={l}
                        className="text-[9px]"
                        style={{ color: data.ciLevel === l ? "#111827" : "#9ca3af", fontWeight: data.ciLevel === l ? 700 : 400 }}
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </Card>

                <Card delay={0.08}>
                  <SectionLabel>Creative Fatigue Analysis</SectionLabel>
                  <div className="space-y-2.5">
                    {[
                      {
                        label: "Fatigue Level",
                        value: data.fatigueLevel,
                        color: data.fatigueLevel === "High" ? "#ef4444" : data.fatigueLevel === "Medium" ? "#f97316" : "#22c55e",
                      },
                      { label: "Avg Frequency",      value: data.avgFrequency      },
                      { label: "Suggested Refresh",  value: data.suggestedRefreshIn },
                      { label: "Active Creatives",   value: data.activeCreatives,   color: "#22c55e" },
                      { label: "Fatigued Creatives", value: data.fatiguedCreatives, color: "#f97316" },
                    ].map((m) => (
                      <MetricRow key={m.label} label={m.label} value={m.value} color={m.color} />
                    ))}
                  </div>
                </Card>
              </div>

              {/* ── Trend chart ── */}
              {data.trendData?.length > 0 && (
                <Card delay={0.12}>
                  <SectionLabel>Performance Trend (8 Weeks)</SectionLabel>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data.trendData}>
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
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
                      <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={false} name="CI Score" />
                      <Line type="monotone" dataKey="roas"  stroke="#2563eb" strokeWidth={2} dot={false} strokeDasharray="4 2" name="ROAS" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-5 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-0.5 rounded-full bg-violet-500" />
                      <span className="text-[11px] text-gray-400">CI Score</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-0.5 rounded-full bg-blue-500" style={{ backgroundImage: "repeating-linear-gradient(90deg,#2563eb 0,#2563eb 4px,transparent 4px,transparent 6px)" }} />
                      <span className="text-[11px] text-gray-400">ROAS</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* ── Creative Types + Channel Breakdown ── */}
              {(data.topCreativeTypes?.length > 0 || data.channelBreakdown?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {data.topCreativeTypes?.length > 0 && (
                    <Card delay={0.15}>
                      <SectionLabel>Top Creative Types</SectionLabel>
                      <div className="space-y-2">
                        {data.topCreativeTypes.map((t, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-xs font-semibold text-gray-700">{t.type}</span>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span>CTR: <strong className="text-gray-700">{t.ctr}</strong></span>
                              <span>Spend: <strong className="text-gray-700">{t.spend}</strong></span>
                              <span className="font-bold text-violet-600">{t.score}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {data.channelBreakdown?.length > 0 && (
                    <Card delay={0.18}>
                      <SectionLabel>Channel Breakdown</SectionLabel>
                      <div className="space-y-2">
                        {data.channelBreakdown.map((c, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-xs font-semibold text-gray-700">{c.channel}</span>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span>{c.impressions}</span>
                              <span>CTR: <strong className="text-gray-700">{c.ctr}</strong></span>
                              <span>ROAS: <strong className="text-green-600">{c.roas}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* ── Audience Insights ── */}
              {(data.topAgeGroup || data.topGender || data.topDevice || data.topCountry) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Top Age Group", value: data.topAgeGroup },
                    { label: "Top Gender",    value: data.topGender   },
                    { label: "Top Device",    value: data.topDevice   },
                    { label: "Top Country",   value: data.topCountry  },
                  ].map((a) => (
                    <motion.div
                      key={a.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white border border-gray-100 rounded-2xl p-4 text-center "
                    >
                      <p className="text-xs text-gray-400 mb-1">{a.label}</p>
                      <p className="font-bold text-gray-900">{a.value ?? "—"}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ── Recommendations ── */}
              {data.recommendations?.length > 0 && (
                <Card delay={0.22}>
                  <p className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                    AI Recommendations
                  </p>
                  <div className="space-y-3">
                    {data.recommendations.map((r, i) => {
                      // support both string[] (old page) and object[] (base44 shape)
                      const title  = typeof r === "string" ? `Recommendation ${i + 1}` : r.title;
                      const detail = typeof r === "string" ? r : r.detail;
                      const priority    = typeof r === "object" ? r.priority    : null;
                      const scoreImpact = typeof r === "object" ? r.scoreImpact : null;

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.24 + i * 0.05 }}
                          className="p-4 rounded-xl bg-gray-50 border border-gray-100"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 text-white"
                                style={{ background: "#8b5cf6" }}
                              >
                                {i + 1}
                              </div>
                              <p className="text-sm font-semibold text-gray-800">{title}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {priority && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityClass(priority)}`}>
                                  {priority}
                                </span>
                              )}
                              {scoreImpact && (
                                <span className="text-xs font-bold text-green-600">{scoreImpact}</span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed pl-7">{detail}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}