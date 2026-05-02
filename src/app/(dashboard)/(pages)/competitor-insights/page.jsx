"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, Users, Globe, Clock, ArrowUpRight,
    Loader2, AlertCircle, Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, change, Icon }) {
    const isPositive = change && !change.startsWith("-");
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400">{label}</p>
                <Icon className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
                <p className={`text-xs mt-1 font-medium ${isPositive ? "text-green-500" : "text-red-400"}`}>
                    {change}
                </p>
            )}
        </div>
    );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function CompetitorInsights() {
    const { getCompetitorInsights } = useAuth();

    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    const analyze = async () => {
        if (!url.trim()) return;
        setLoading(true);
        setError("");
        setData(null);

        const response = await getCompetitorInsights({ url });

        if (!response.ok) {
            setError(response.message || "Analysis failed. Please try again.");
        } else {
            setData(response.data);
        }
        setLoading(false);
    };

    const trafficData = data
        ? [
            { name: "Desktop", value: data.desktopShare, color: "#1e3a8a" },
            { name: "Mobile", value: data.mobileShare, color: "#2563eb" },
        ]
        : [];

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div
                title="Competitor Insights"
                subtitle="See insights from your competitors' websites."
                icon={Search}
                gradient="from-pink-500 to-rose-600"
                breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Competitor Insights' }]}
            />

            {/* ── Search bar ── */}
            <div className="flex gap-3 mb-6">
                <div className="flex-1 flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && analyze()}
                        placeholder="Enter competitor URL (e.g. apple.com)"
                        className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                    />
                </div>
                <button
                    onClick={analyze}
                    disabled={loading || !url.trim()}
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
                        <p className="text-gray-400 text-sm">Analyzing competitor data…</p>
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
                        <p className="text-sm text-gray-400">
                            Competitor insights for:{" "}
                            <span className="text-gray-800 font-semibold">{data.domain || url}</span>
                        </p>

                        {/* ── Metric cards ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {[
                                { label: "Visit Count", value: data.visitCount, change: data.visitCountChange, Icon: TrendingUp },
                                { label: "Unique Visitors", value: data.uniqueVisitors, change: data.uniqueVisitorsChange, Icon: Users },
                                { label: "Pages / Visit", value: data.pagesPerVisit, change: data.pagesPerVisitChange, Icon: Globe },
                                { label: "Avg. Visit Duration", value: data.avgVisitDuration, change: data.avgVisitDurationChange, Icon: Clock },
                                { label: "Bounce Rate", value: data.bounceRate, change: data.bounceRateChange, Icon: ArrowUpRight },
                            ].map((m) => (
                                <StatCard key={m.label} {...m} />
                            ))}
                        </div>

                        {/* ── Traffic share + Gender ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* Traffic share donut */}
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="bg-white border border-gray-200 rounded-2xl p-6"
                            >
                                <p className="font-semibold text-sm text-gray-800 mb-4">Traffic Share</p>
                                <div className="flex items-center gap-6">
                                    <PieChart width={140} height={140}>
                                        <Pie
                                            data={trafficData}
                                            cx={65} cy={65}
                                            innerRadius={45} outerRadius={65}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {trafficData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                    <div className="space-y-3">
                                        {trafficData.map((d) => (
                                            <div key={d.name} className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                                                <span className="text-sm text-gray-500">{d.name}</span>
                                                <span className="text-sm font-bold text-gray-800 ml-auto">{d.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Gender split */}
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 }}
                                className="bg-white border border-gray-200 rounded-2xl p-6"
                            >
                                <p className="font-semibold text-sm text-gray-800 mb-1">Gender</p>
                                <p className="text-xs text-gray-400 mb-4">Gender distribution of their audience.</p>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-gray-700">{data.malePercent}%</span>
                                    <span className="text-sm font-bold text-gray-700">{data.femalePercent}%</span>
                                </div>
                                <div className="flex rounded-full overflow-hidden h-10">
                                    <div
                                        className="flex items-center justify-center text-xs font-bold text-white transition-all"
                                        style={{ width: `${data.malePercent}%`, background: "#1e3a8a" }}
                                    >
                                        ♂ MALE
                                    </div>
                                    <div
                                        className="flex items-center justify-center text-xs font-bold text-white transition-all"
                                        style={{ width: `${data.femalePercent}%`, background: "#2563eb" }}
                                    >
                                        FEMALE ♀
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-blue-900" />
                                        <span className="text-xs text-gray-400">Male</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                                        <span className="text-xs text-gray-400">Female</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* ── Age distribution + Top countries ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* Age bar chart */}
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white border border-gray-200 rounded-2xl p-6"
                            >
                                <p className="font-semibold text-sm text-gray-800 mb-4">Age Distribution</p>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={data.ageGroups || []}>
                                        <XAxis
                                            dataKey="age"
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
                                        <Bar dataKey="percent" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </motion.div>

                            {/* Top countries */}
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.12 }}
                                className="bg-white border border-gray-200 rounded-2xl p-6"
                            >
                                <p className="font-semibold text-sm text-gray-800 mb-4">Top Countries</p>
                                <div className="space-y-3">
                                    {(data.topCountries || []).map((c, i) => (
                                        <motion.div
                                            key={c.country}
                                            initial={{ opacity: 0, x: 8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.14 + i * 0.04 }}
                                            className="flex items-center gap-3"
                                        >
                                            <span className="text-sm text-gray-700 w-24 shrink-0 truncate">{c.country}</span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-blue-600 transition-all"
                                                    style={{ width: `${c.share}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 w-9 text-right shrink-0">
                                                {c.share}%
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* ── Socioeconomics ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-5"
                        >
                            {[
                                { label: "Household Size", value: data.householdSize },
                                { label: "Income Level", value: data.incomeLevel },
                                { label: "Education Level", value: data.educationLevel },
                            ].map((s) => (
                                <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5">
                                    <p className="text-xs text-gray-400 mb-2">{s.label}</p>
                                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                                </div>
                            ))}
                        </motion.div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Empty state ── */}
            {!data && !loading && (
                <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
                    <div className="text-center">
                        <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">Enter a competitor URL to get insights</p>
                    </div>
                </div>
            )}

        </div>
    );
}