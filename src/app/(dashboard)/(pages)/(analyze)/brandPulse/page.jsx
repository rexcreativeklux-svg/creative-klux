"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    RefreshCw,
    Download,
    TrendingUp,
    TrendingDown,
    Zap,
    Eye,
    Activity,
    BarChart2,
    AlertTriangle,
} from "lucide-react";

// ── fake database ─────────────────────────────────────────────────────────────
const DB = {
    meta: { title: "Brand Pulse", period: "Last 7 days" },

    kpis: [
        { id: "pulse", label: "Pulse Score", value: 45, unit: "", sub: "Normal tier", trend: null },
        { id: "ctr", label: "Average CTR", value: "754K", unit: "", sub: "+12.4%", trend: "up" },
        { id: "active", label: "Active Creatives", value: 668, unit: "", sub: "+3.1%", trend: "up" },
        { id: "fatigued", label: "Fatigued", value: 754, unit: "", sub: "High", trend: "down" },
    ],

    pulseScore: {
        value: 45,
        tier: "NORMAL",
        description: "You're at Normal — based on CTR, diversity, fatigue ratio & active creatives vs your category.",
        scale: ["Very Poor", "Poor", "Normal", "Good", "Excellent"],
        position: 40, // percentage on scale bar
    },

    creativeHealth: [
        { label: "Click-Through Rate", value: 78, color: "#e11d48" },
        { label: "Creative Diversity", value: 52, color: "#f59e0b" },
        { label: "Active/Fatigue Ratio", value: 47, color: "#f59e0b" },
        { label: "Brand Consistency", value: 85, color: "#10b981" },
        { label: "Audience Resonance", value: 60, color: "#3b82f6" },
    ],

    chartData: {
        CTR: [
            { day: "Mon", value: 85 },
            { day: "Tue", value: 91 },
            { day: "Wed", value: 88 },
            { day: "Thu", value: 102 },
            { day: "Fri", value: 97 },
            { day: "Sat", value: 109 },
            { day: "Sun", value: 104 },
        ],
        Impressions: [
            { day: "Mon", value: 42 },
            { day: "Tue", value: 58 },
            { day: "Wed", value: 51 },
            { day: "Thu", value: 74 },
            { day: "Fri", value: 68 },
            { day: "Sat", value: 89 },
            { day: "Sun", value: 83 },
        ],
        Conversions: [
            { day: "Mon", value: 12 },
            { day: "Tue", value: 19 },
            { day: "Wed", value: 15 },
            { day: "Thu", value: 28 },
            { day: "Fri", value: 22 },
            { day: "Sat", value: 35 },
            { day: "Sun", value: 30 },
        ],
    },

    topCreatives: [
        { name: "Summer Sale Banner v3", platform: "Meta", ctr: "4.8%", impressions: "128K", status: "ACTIVE" },
        { name: "Product Showcase Reel", platform: "TikTok", ctr: "3.9%", impressions: "94K", status: "ACTIVE" },
        { name: "Brand Story Ad v1", platform: "Google", ctr: "2.1%", impressions: "55K", status: "FATIGUED" },
        { name: "Holiday Promo Square", platform: "Instagram", ctr: "0.9%", impressions: "31K", status: "RETIRED" },
    ],
};

// ── helpers ───────────────────────────────────────────────────────────────────
const PRIMARY = "#2563eb";

const statusStyle = (s) => {
    if (s === "ACTIVE") return { bg: "#dcfce7", color: "#15803d" };
    if (s === "FATIGUED") return { bg: "#fef9c3", color: "#a16207" };
    return { bg: "#fee2e2", color: "#b91c1c" };
};

// ── sparkline chart (pure SVG, no lib) ───────────────────────────────────────
function SparkChart({ data, color = PRIMARY }) {
    const H = 200;
    const PAD = 24;

    const vals = data.map((d) => d.value);
    const min = Math.min(...vals) - 5;
    const max = Math.max(...vals) + 5;

    const W = 1000; // virtual width (scales to container)
    const xStep = (W - PAD * 2) / (vals.length - 1);

    const yOf = (v) =>
        H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);

    const points = vals.map((v, i) => ({
        x: PAD + i * xStep,
        y: yOf(v),
    }));

    const line = points
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
        .join(" ");

    const area = `${line} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`;

    return (
        <div className="w-full">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-55"
                preserveAspectRatio="none" // ✅ KEY LINE
            >
                <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                    </linearGradient>
                </defs>

                {/* grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const y = PAD + t * (H - PAD * 2);
                    const val = Math.round(max - t * (max - min));
                    return (
                        <g key={t}>
                            <line
                                x1={PAD}
                                y1={y}
                                x2={W - PAD}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeWidth="1"
                            />
                            <text
                                x={PAD - 6}
                                y={y + 4}
                                textAnchor="end"
                                fontSize="11"
                                fill="#9ca3af"
                            >
                                {val}
                            </text>
                        </g>
                    );
                })}

                {/* area */}
                <path d={area} fill="url(#areaGrad)" />

                {/* line */}
                <path
                    d={line}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* points */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill={color}
                        stroke="#fff"
                        strokeWidth="2"
                    />
                ))}

                {/* x labels */}
                {points.map((p, i) => (
                    <text
                        key={i}
                        x={p.x}
                        y={H - 4}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#9ca3af"
                    >
                        {data[i].day}
                    </text>
                ))}
            </svg>
        </div>
    );
}


// ── donut gauge ───────────────────────────────────────────────────────────────
function PulseGauge({ value }) {
    const r = 52, cx = 70, cy = 70;
    const circ = 2 * Math.PI * r;
    const pct = value / 100;

    // arc from 135deg to 405deg (270deg sweep)
    const sweepDeg = 270;
    const startAngle = 135;
    const endAngle = startAngle + sweepDeg * pct;
    const toRad = (d) => (d * Math.PI) / 180;
    const arcX = (a) => cx + r * Math.cos(toRad(a));
    const arcY = (a) => cy + r * Math.sin(toRad(a));

    const trackEnd = startAngle + sweepDeg;
    const trackPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 1 1 ${arcX(trackEnd)} ${arcY(trackEnd)}`;
    const fillPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${sweepDeg * pct > 180 ? 1 : 0} 1 ${arcX(endAngle)} ${arcY(endAngle)}`;

    // color stops along the gauge
    const gaugeColor = value < 40 ? "#ef4444" : value < 60 ? "#f59e0b" : value < 80 ? PRIMARY : "#10b981";

    return (
        <svg width="140" height="140" viewBox="0 0 140 140">
            <path d={trackPath} fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
            <path d={fillPath} fill="none" stroke={gaugeColor} strokeWidth="12" strokeLinecap="round" />
            <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="700" fill="#111827">{value}%</text>
            <text x="70" y="84" textAnchor="middle" fontSize="11" fill="#6b7280" letterSpacing="1">NORMAL</text>
        </svg>
    );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function BrandPulsePage() {
    const [activeMetric, setActiveMetric] = useState("CTR");
    const [animatedBars, setAnimatedBars] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setAnimatedBars(true), 200);
        return () => clearTimeout(t);
    }, []);

    const chartData = DB.chartData[activeMetric];

    return (
        <div
            className="min-h-screen "
            style={{ fontFamily: "'DM Sans', 'Geist', sans-serif" }}
        >
            {/* ── top bar ── */}
            <div className="flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" style={{ color: PRIMARY }} />
                    <span className="font-semibold text-gray-900 text-sm">{DB.meta.title}</span>
                    <span className="text-xs text-gray-400 ml-1">— {DB.meta.period}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center hover:scale-105 gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">
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

            <div className="py-5 flex flex-col gap-5 ">

                {/* ── KPI row ── */}
                <div className="grid grid-cols-4 gap-4">
                    {DB.kpis.map((k) => (
                        <div key={k.id} className="bg-surface rounded-xl border border-gray-200 px-5 py-4 ">
                            <p className="text-xs text-gray-400 font-medium mb-1">{k.label}</p>
                            <p className="text-3xl font-bold text-gray-900 leading-none">{k.value}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                                {k.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                                {k.trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
                                <span
                                    className="text-xs font-medium"
                                    style={{
                                        color: k.trend === "up" ? "#10b981" : k.trend === "down" ? "#ef4444" : "#6b7280",
                                    }}
                                >
                                    {k.sub}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── pulse score + creative health ── */}
                <div className="grid grid-cols-2 gap-4">

                    {/* Pulse score */}
                    <div className="bg-surface rounded-xl border border-gray-200  p-5">
                        <p className="text-sm font-semibold text-gray-900 mb-4">Your Pulse Score</p>
                        <div className="flex items-center gap-6">
                            <PulseGauge value={DB.pulseScore.value} />
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                    You're at{" "}
                                    <span className="font-semibold" style={{ color: "#f59e0b" }}>Normal</span>
                                    {" "}— based on CTR, diversity, fatigue ratio &amp; active creatives vs your category.
                                </p>
                                {/* scale bar */}
                                <div className="relative">
                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                        {DB.pulseScore.scale.map((s) => <span key={s}>{s}</span>)}
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{
                                        background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #10b981)"
                                    }}>
                                    </div>
                                    <div
                                        className="absolute top-[18px] w-3 h-3 rounded-full bg-surface border-2 shadow-md -translate-x-1/2"
                                        style={{ left: `${DB.pulseScore.position}%`, borderColor: "#f59e0b" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Creative health */}
                    <div className="bg-surface rounded-xl border border-gray-200  p-5">
                        <p className="text-sm font-semibold text-gray-900 mb-4">Creative Health</p>
                        <div className="flex flex-col gap-3">
                            {DB.creativeHealth.map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 w-40 shrink-0">{item.label}</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: animatedBars ? `${item.value}%` : "0%",
                                                background: item.color,
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 w-8 text-right">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── metric overview chart ── */}
                <div className="bg-surface rounded-xl border border-gray-200  p-3">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-gray-900">Metric Overview</p>
                        <div className="flex items-center gap-1">
                            {["CTR", "Impressions", "Conversions"].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setActiveMetric(m)}
                                    className="px-3 py-1.5 rounded-lg hover:scale-105 text-xs font-medium transition-all duration-200 cursor-pointer"
                                    style={{
                                        background: activeMetric === m ? PRIMARY : "transparent",
                                        color: activeMetric === m ? "#fff" : "#6b7280",
                                        border: activeMetric === m ? "none" : "1px solid #e5e7eb",
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <SparkChart data={chartData} color={PRIMARY} />
                </div>

                {/* ── top performing creatives ── */}
                <div className="bg-surface rounded-xl border border-gray-200  p-5">
                    <p className="text-sm font-semibold text-gray-900 mb-4">Top Performing Creatives</p>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                {["Creative", "Platform", "CTR", "Impressions", "Status"].map((h) => (
                                    <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-2 pr-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DB.topCreatives.map((row, i) => {
                                const s = statusStyle(row.status);
                                return (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                        <td className="py-3 pr-4 text-sm text-gray-800 font-medium">{row.name}</td>
                                        <td className="py-3 pr-4 text-sm text-gray-500">{row.platform}</td>
                                        <td className="py-3 pr-4 text-sm font-semibold" style={{ color: PRIMARY }}>{row.ctr}</td>
                                        <td className="py-3 pr-4 text-sm text-gray-600">{row.impressions}</td>
                                        <td className="py-3">
                                            <span
                                                className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide"
                                                style={{ background: s.bg, color: s.color }}
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}