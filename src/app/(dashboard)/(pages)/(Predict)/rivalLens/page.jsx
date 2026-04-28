"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Download, Telescope, TrendingUp, TrendingDown,
  ChevronDown, Loader2,
} from "lucide-react";

// ── design token ──────────────────────────────────────────────────────────────
const PRIMARY = "#2563eb";

// ── fake database ─────────────────────────────────────────────────────────────
const FAKE_DATA = {
  url: "https://app.weviy.com/",
  label: "app.weviy.com/",
  dataTag: "DATA UP TO DATE",

  kpis: [
    { label: "Monthly Visits",   value: "1.2M",  sub: "+29.4%", trend: "up" },
    { label: "Unique Visitors",  value: "852K",  sub: "+29.4%", trend: "up" },
    { label: "Pages / Visit",    value: "2.13",  sub: "+11.2%", trend: "up" },
    { label: "Avg Duration",     value: "5:34s", sub: "+0.6%",  trend: "up" },
    { label: "Bounce Rate",      value: "59.2%", sub: "High",   trend: "down" },
    { label: "Desktop Share",    value: "72%",   sub: "vs 28% mobile", trend: null },
  ],

  gender: { male: 33.3, female: 66.7 },

  age: [
    { range: "18–24", pct: 12 },
    { range: "25–34", pct: 34 },
    { range: "35–44", pct: 24 },
    { range: "45–54", pct: 16 },
    { range: "55–64", pct: 8  },
    { range: "65+",   pct: 2  },
  ],

  traffic: [
    { label: "Organic Search", pct: 41, color: "#ef4444" },
    { label: "Direct",         pct: 28, color: "#3b82f6" },
    { label: "Social",         pct: 19, color: "#f59e0b" },
    { label: "Referral",       pct: 12, color: "#10b981" },
  ],

  socioeconomic: [
    { label: "Household Size", value: "3–4 persons" },
    { label: "Income Level",   value: "Low–Middle" },
    { label: "Education",      value: "High School / Diploma" },
    { label: "Primary Device", value: "Desktop (72%)" },
    { label: "Top Channel",    value: "Organic Search" },
    { label: "Geo Focus",      value: "US, UK, IN" },
  ],

  keywords: [
    { kw: "ai ad creative generator",  vol: "40.5K", pos: 2,  traffic: "18.4%", cpc: "$3.20" },
    { kw: "free ad design tool",        vol: "27.2K", pos: 4,  traffic: "12.1%", cpc: "$2.80" },
    { kw: "social media ad maker",      vol: "18.6K", pos: 7,  traffic: "8.9%",  cpc: "$4.10" },
    { kw: "competitor analysis tool",   vol: "14.1K", pos: 9,  traffic: "6.3%",  cpc: "$5.50" },
    { kw: "banner ad generator ai",     vol: "11.3K", pos: 12, traffic: "4.7%",  cpc: "$2.10" },
  ],
};

const DATE_RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "Last 12 Months"];

// ── donut chart (pure SVG) ────────────────────────────────────────────────────
function DonutChart({ slices, size = 160 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.35, inner = size * 0.22;
  let cumulative = 0;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const arcs = slices.map((s) => {
    const startDeg = cumulative * 3.6 - 90;
    const endDeg = (cumulative + s.pct) * 3.6 - 90;
    const large = s.pct > 50 ? 1 : 0;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const xi1 = cx + inner * Math.cos(toRad(startDeg));
    const yi1 = cy + inner * Math.sin(toRad(startDeg));
    const xi2 = cx + inner * Math.cos(toRad(endDeg));
    const yi2 = cy + inner * Math.sin(toRad(endDeg));
    cumulative += s.pct;
    return { ...s, d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z` };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => (
        <path key={i} d={a.d} fill={a.color} className="transition-all duration-500" />
      ))}
    </svg>
  );
}

// ── age bar ───────────────────────────────────────────────────────────────────
function AgeBar({ data, animated }) {
  const max = Math.max(...data.map((d) => d.pct));
  return (
    <div className="flex items-end gap-3 h-24 px-2">
      {data.map((d) => {
        const highlight = d.pct === max;
        return (
          <div key={d.range} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs font-semibold" style={{ color: highlight ? PRIMARY : "#6b7280" }}>
              {d.pct}%
            </span>
            <div className="w-full rounded-t-md transition-all duration-700" style={{
              height: animated ? `${(d.pct / max) * 64}px` : "0px",
              background: highlight ? PRIMARY : "#e5e7eb",
            }} />
            <span className="text-[10px] text-gray-400">{d.range}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── position badge ────────────────────────────────────────────────────────────
function PosBadge({ pos }) {
  const color = pos <= 3 ? "#10b981" : pos <= 6 ? "#f59e0b" : "#6b7280";
  return <span className="text-xs font-bold" style={{ color }}>#{pos}</span>;
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function RivalLensPage() {
  const [url, setUrl] = useState("");
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [animBars, setAnimBars] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setAnimBars(false);
    await new Promise((r) => setTimeout(r, 2200));
    setResult(FAKE_DATA);
    setAnalyzing(false);
    setTimeout(() => setAnimBars(true), 300);
  };

  return (
    <div className="" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── top bar ── */}
      <div className=" flex items-center mb-8 justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Telescope className="w-4 h-4" style={{ color: PRIMARY }} />
          <span className="font-semibold text-gray-900 text-sm">Rival Lens</span>
          <span className="text-xs text-gray-400 ml-1">— Competitor intelligence</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition cursor-pointer"
            style={{ background: PRIMARY }}
          >
            <Download className="w-3 h-3" /> Export PDF
          </button>
        </div>
      </div>

      {/* ── search bar — always visible ── */}
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-3 sticky top-[49px] z-10">
        <div className="max-w-7xl mx-auto">
          {!result && (
            <p className="text-xs font-semibold text-gray-500 mb-2">Analyze a Competitor</p>
          )}
          <div className="flex items-center gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Enter competitor website (e.g. competitor.com)"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ "--tw-ring-color": PRIMARY }}
            />
            {/* date range */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none cursor-pointer"
              >
                {DATE_RANGES.map((d) => <option key={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!url.trim() || analyzing}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition cursor-pointer disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1d4ed8)` }}
            >
              {analyzing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                : <><Telescope className="w-4 h-4" /> Analyze</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── content ── */}
      <div className=" py-6">
        <AnimatePresence>
          {/* empty state */}
          {!result && !analyzing && (
            <div
              className="flex flex-col items-center justify-center pt-[20%] gap-3"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${PRIMARY}12` }}>
                <Telescope className="w-7 h-7" style={{ color: PRIMARY }} />
              </div>
              <p className="text-sm font-semibold text-gray-600">Enter a competitor URL to get started</p>
              <p className="text-xs text-gray-400">We'll pull traffic, audience & keyword data instantly.</p>
            </div>
          )}

          {/* loading skeleton */}
          {analyzing && (
            <div
              className="flex flex-col items-center pt-[20%] justify-center gap-4"
            >
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-transparent animate-spin"
                  style={{ borderTopColor: PRIMARY }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Telescope className="w-6 h-6" style={{ color: PRIMARY }} />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700">Scanning competitor intelligence…</p>
              <p className="text-xs text-gray-400">Pulling traffic, audience & keyword data</p>
            </div>
          )}

          {/* results */}
          {result && !analyzing && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              {/* insights header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Insights for</p>
                  <p className="text-base font-bold" style={{ color: PRIMARY }}>{result.label}</p>
                </div>
                <span
                  className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-lg uppercase"
                  style={{ background: "#dcfce7", color: "#15803d" }}
                >
                  {result.dataTag}
                </span>
              </div>

              {/* KPI grid */}
              <div className="grid grid-cols-3 gap-4">
                {result.kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: i * 0.05 }}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4"
                  >
                    <p className="text-xs text-gray-400 font-medium mb-1">{k.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {k.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                      {k.trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
                      <span className="text-xs font-medium" style={{
                        color: k.trend === "up" ? "#10b981" : k.trend === "down" ? "#ef4444" : "#6b7280"
                      }}>
                        {k.sub}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* audience row */}
              <div className="grid grid-cols-2 gap-4">

                {/* gender */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.3 }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                >
                  <p className="text-sm font-semibold text-gray-900 mb-4">Audience Gender</p>
                  <div className="flex rounded-full overflow-hidden h-8 mb-3">
                    <div
                      className="flex items-center justify-center text-xs font-bold text-white transition-all duration-700"
                      style={{ width: animBars ? `${result.gender.male}%` : "0%", background: "#3b82f6" }}
                    >
                      ♂ {result.gender.male}%
                    </div>
                    <div
                      className="flex items-center justify-center text-xs font-bold text-white transition-all duration-700"
                      style={{ width: animBars ? `${result.gender.female}%` : "0%", background: "#ec4899" }}
                    >
                      ♀ {result.gender.female}%
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-400">Male audience</span>
                    <span className="text-[11px] text-gray-400">Female audience</span>
                  </div>
                </motion.div>

                {/* age */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.35 }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                >
                  <p className="text-sm font-semibold text-gray-900 mb-2">Age Distribution</p>
                  <AgeBar data={result.age} animated={animBars} />
                </motion.div>
              </div>

              {/* traffic + socioeconomic */}
              <div className="grid grid-cols-2 gap-4">

                {/* traffic sources */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.4 }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                >
                  <p className="text-sm font-semibold text-gray-900 mb-4">Traffic Sources</p>
                  <div className="flex items-center gap-6">
                    <DonutChart
                      slices={result.traffic.map((t) => ({ pct: t.pct, color: t.color }))}
                      size={140}
                    />
                    <div className="flex flex-col gap-2.5 flex-1">
                      {result.traffic.map((t) => (
                        <div key={t.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                            <span className="text-xs text-gray-600">{t.label}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-800">{t.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* socioeconomic */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.45 }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                >
                  <p className="text-sm font-semibold text-gray-900 mb-4">Socioeconomic Profile</p>
                  <div className="flex flex-col gap-3">
                    {result.socioeconomic.map((row) => (
                      <div key={row.label} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                        <span className="text-xs text-gray-400">{row.label}</span>
                        <span className="text-xs font-semibold text-gray-800">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* keywords table */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.5 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
              >
                <p className="text-sm font-semibold text-gray-900 mb-4">Top Keywords Driving Traffic</p>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Keyword", "Volume", "Position", "Traffic %", "CPC"].map((h) => (
                        <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.keywords.map((row, i) => (
                      <motion.tr
                        key={row.kw}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: 0.55 + i * 0.05 }}
                        className="border-b border-gray-50 hover:bg-gray-50 transition"
                      >
                        <td className="py-3 pr-4 text-sm text-gray-800 font-medium">{row.kw}</td>
                        <td className="py-3 pr-4 text-sm text-gray-500">{row.vol}</td>
                        <td className="py-3 pr-4"><PosBadge pos={row.pos} /></td>
                        <td className="py-3 pr-4 text-sm text-gray-600">{row.traffic}</td>
                        <td className="py-3 text-sm font-semibold" style={{ color: PRIMARY }}>{row.cpc}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}