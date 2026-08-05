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
import { ChartFrame } from "@/app/(components)/ui/ResponsiveChart";

// ── helpers ───────────────────────────────────────────────────────────────────
const COLORS = {
  primary:   "#1e3a8a",
  accent:    "#2563eb",
  green:     "#16a34a",
  red:       "#ef4444",
  orange:    "#f97316",
  yellow:    "#eab308",
};

function isPositiveChange(change) {
  if (!change) return null;
  return !change.startsWith("-");
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, change, Icon, delay = 0 }) {
  const pos = isPositiveChange(change);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-surface border border-gray-200 rounded-2xl p-5 "
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-blue-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value ?? "—"}</p>
      {change && (
        <p className={`text-xs mt-1.5 font-semibold ${pos ? "text-green-500" : "text-red-400"}`}>
          {pos ? "▲" : "▼"} {change}
        </p>
      )}
    </motion.div>
  );
}

// ── section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="font-bold text-sm text-gray-800 mb-4">{children}</p>
  );
}

// ── card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-surface border border-gray-200 rounded-2xl p-6  ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ── threat badge ──────────────────────────────────────────────────────────────
function ThreatBadge({ level }) {
  const map = {
    Critical: "bg-red-50 text-red-600 border-red-200",
    High:     "bg-orange-50 text-orange-600 border-orange-200",
    Medium:   "bg-yellow-50 text-yellow-700 border-yellow-200",
    Low:      "bg-green-50 text-green-600 border-green-200",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${map[level] || map.Low}`}>
      Threat: {level}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function CompetitorInsights() {
  const { getCompetitorInsights } = useAuth();

  const [url, setUrl]       = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData]     = useState(null);
  const [error, setError]   = useState("");

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

  // chart data
  const trafficData = data
    ? [
        { name: "Desktop", value: data.desktopShare,       color: COLORS.primary },
        { name: "Mobile",  value: data.mobileShare,        color: COLORS.accent  },
        { name: "Tablet",  value: data.tabletShare || 0,   color: COLORS.green   },
      ].filter(d => d.value > 0)
    : [];

  const sourceData = data?.trafficSources
    ? [
        { name: "Direct",   value: data.trafficSources.direct   },
        { name: "Organic",  value: data.trafficSources.organic  },
        { name: "Paid",     value: data.trafficSources.paid     },
        { name: "Social",   value: data.trafficSources.social   },
        { name: "Referral", value: data.trafficSources.referral },
        { name: "Email",    value: data.trafficSources.email    },
      ]
    : [];

  return (
    <div className="">
      <div className="pb-5">
        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #ec4899, #f43f5e)" }}>
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Market Spy</h1>
              <p className="text-sm text-gray-400">See insights from your competitors' websites.</p>
            </div>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex items-center gap-3 bg-surface border border-gray-200 rounded-xl px-4 py-3  focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <Globe className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()}
              placeholder="Enter competitor website URL, e.g. https://competitor.com"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
          </div>
          <button
            onClick={analyze}
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer "
            style={{ background: "linear-gradient(135deg, #ec4899, #f43f5e)" }}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Search className="w-4 h-4" /> Analyze</>
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
          <div className="flex items-center justify-center py-24 bg-surface border border-gray-200 rounded-2xl ">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-pink-300" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Enter a competitor URL to get started</p>
              <p className="text-xs text-gray-400 mt-1">We'll analyze traffic, audience, ad spend, and more.</p>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24 bg-surface border border-gray-200 rounded-2xl ">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Analyzing competitor data…</p>
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
              {/* Domain + summary */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <p className="text-sm text-gray-400">
                  Insights for:{" "}
                  <span className="text-gray-800 font-bold">{data.domain || url}</span>
                </p>
                {data.marketPositionSummary && (
                  <p className="text-xs text-gray-400 max-w-md text-right italic leading-relaxed">
                    {data.marketPositionSummary}
                  </p>
                )}
              </div>

              {/* ── Core metrics ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                  { label: "Visit Count",        value: data.visitCount,       change: data.visitCountChange,       Icon: TrendingUp,   delay: 0     },
                  { label: "Unique Visitors",     value: data.uniqueVisitors,   change: data.uniqueVisitorsChange,   Icon: Users,        delay: 0.04  },
                  { label: "Pages / Visit",       value: data.pagesPerVisit,    change: data.pagesPerVisitChange,    Icon: Globe,        delay: 0.08  },
                  { label: "Avg. Duration",       value: data.avgVisitDuration, change: data.avgVisitDurationChange, Icon: Clock,        delay: 0.12  },
                  { label: "Bounce Rate",         value: data.bounceRate,       change: data.bounceRateChange,       Icon: ArrowUpRight, delay: 0.16  },
                ].map((m) => <StatCard key={m.label} {...m} />)}
              </div>

              {/* ── Ad spend / SEO row ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Est. Monthly Ad Spend", value: data.estimatedAdSpend },
                  { label: "Est. Revenue Range",    value: data.estimatedRevenue },
                  { label: "SEO Score",             value: data.seoScore != null ? `${data.seoScore}/100` : "—" },
                  { label: "Domain Authority",      value: data.domainAuthority != null ? `${data.domainAuthority}/100` : "—" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    className="bg-surface border border-gray-200 rounded-2xl p-4 text-center "
                  >
                    <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                    <p className="font-bold text-lg text-gray-900">{s.value ?? "—"}</p>
                  </motion.div>
                ))}
              </div>

              {/* ── Device traffic + Traffic sources ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <Card delay={0.24}>
                  <SectionLabel>Device Traffic Share</SectionLabel>
                  <div className="flex items-center gap-8">
                    <PieChart width={140} height={140}>
                      <Pie data={trafficData} cx={65} cy={65} innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                        {trafficData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="space-y-3">
                      {trafficData.map((d) => (
                        <div key={d.name} className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-sm text-gray-500 w-14">{d.name}</span>
                          <span className="text-sm font-bold text-gray-800 ml-auto">{d.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card delay={0.27}>
                  <SectionLabel>Traffic Sources</SectionLabel>
                  <ChartFrame size="sm"><ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "#374151",
                        }}
                      />
                      <Bar dataKey="value" fill={COLORS.accent} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer></ChartFrame>
                </Card>
              </div>

              {/* ── Gender + Age ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <Card delay={0.3}>
                  <SectionLabel>Gender</SectionLabel>
                  <p className="text-xs text-gray-400 -mt-2 mb-4">Gender distribution of their audience.</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">{data.malePercent}% Male</span>
                    <span className="text-sm font-bold text-gray-700">{data.femalePercent}% Female</span>
                  </div>
                  <div className="flex rounded-full overflow-hidden h-9">
                    <div
                      className="flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ width: `${data.malePercent}%`, background: COLORS.primary }}
                    >
                      ♂ MALE
                    </div>
                    <div
                      className="flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ width: `${data.femalePercent}%`, background: COLORS.accent }}
                    >
                      FEMALE ♀
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.primary }} />
                      <span className="text-xs text-gray-400">Male</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.accent }} />
                      <span className="text-xs text-gray-400">Female</span>
                    </div>
                  </div>
                </Card>

                <Card delay={0.33}>
                  <SectionLabel>Age Distribution</SectionLabel>
                  <ChartFrame size="sm"><ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.ageGroups || []}>
                      <XAxis dataKey="age" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
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
                      <Bar dataKey="percent" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer></ChartFrame>
                </Card>
              </div>

              {/* ── Countries + Social + Keywords ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <Card delay={0.36}>
                  <SectionLabel>Top Countries</SectionLabel>
                  <div className="space-y-3">
                    {(data.topCountries || []).map((c, i) => (
                      <motion.div
                        key={c.country}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.38 + i * 0.04 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-xs text-gray-700 w-20 shrink-0 truncate">{c.country}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${c.share}%`, background: COLORS.accent }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8 text-right shrink-0">{c.share}%</span>
                      </motion.div>
                    ))}
                  </div>
                </Card>

                <Card delay={0.4}>
                  <SectionLabel>Social Following</SectionLabel>
                  <div className="space-y-2">
                    {data.socialFollowing && Object.entries(data.socialFollowing).map(([platform, count]) => (
                      <div key={platform} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-xs capitalize text-gray-500">{platform}</span>
                        <span className="text-xs font-bold text-gray-800">{count}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card delay={0.43}>
                  <SectionLabel>Top Keywords</SectionLabel>
                  <div className="space-y-2 mb-4">
                    {(data.topKeywords || []).map((kw, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-[10px] font-black text-blue-600">#{i + 1}</span>
                        <span className="text-xs text-gray-700">{kw}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-gray-200 pt-3">
                    {[
                      ["Backlinks",  data.backlinksCount],
                      ["Household",  data.householdSize],
                      ["Income",     data.incomeLevel],
                      ["Education",  data.educationLevel],
                    ].map(([k, v]) => v ? (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-gray-400">{k}</span>
                        <span className="font-semibold text-gray-700">{v}</span>
                      </div>
                    ) : null)}
                  </div>
                </Card>
              </div>

              {/* ── Strengths + Weaknesses ── */}
              {(data.strengths?.length > 0 || data.weaknesses?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card delay={0.46}>
                    <p className="font-bold text-sm text-green-600 mb-4">✦ Strengths</p>
                    <div className="space-y-2.5">
                      {data.strengths?.map((s, i) => (
                        <p key={i} className="text-xs text-gray-500 flex gap-2.5 leading-relaxed">
                          <span className="text-green-500 shrink-0 mt-0.5">•</span>{s}
                        </p>
                      ))}
                    </div>
                  </Card>
                  <Card delay={0.49}>
                    <p className="font-bold text-sm text-red-500 mb-4">✦ Weaknesses</p>
                    <div className="space-y-2.5">
                      {data.weaknesses?.map((w, i) => (
                        <p key={i} className="text-xs text-gray-500 flex gap-2.5 leading-relaxed">
                          <span className="text-red-400 shrink-0 mt-0.5">•</span>{w}
                        </p>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* ── Opportunity Gaps + Psychographics ── */}
              {(data.opportunityGaps?.length > 0 || data.purchaseBehavior || data.contentAffinities?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {data.opportunityGaps?.length > 0 && (
                    <Card delay={0.52}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-bold text-sm text-blue-700">✦ Opportunity Gaps</p>
                        {data.threatLevel && <ThreatBadge level={data.threatLevel.split(" ")[0]} />}
                      </div>
                      <div className="space-y-2.5">
                        {data.opportunityGaps.map((g, i) => (
                          <p key={i} className="text-xs text-gray-500 flex gap-2.5 leading-relaxed">
                            <span className="text-blue-500 shrink-0 mt-0.5">→</span>{g}
                          </p>
                        ))}
                      </div>
                    </Card>
                  )}

                  {(data.purchaseBehavior || data.contentAffinities?.length > 0 || data.interests?.length > 0) && (
                    <Card delay={0.55}>
                      <p className="font-bold text-sm text-gray-800 mb-4">✦ Audience Psychographics</p>
                      {data.purchaseBehavior && (
                        <div className="mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Purchase Behavior</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{data.purchaseBehavior}</p>
                        </div>
                      )}
                      {data.interests?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Interests</p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.interests.map((interest, i) => (
                              <span key={i} className="text-[10px] px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full font-medium">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {data.contentAffinities?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Content Affinities</p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.contentAffinities.map((c, i) => (
                              <span key={i} className="text-[10px] px-2.5 py-1 bg-pink-50 text-pink-700 border border-pink-100 rounded-full font-medium">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}