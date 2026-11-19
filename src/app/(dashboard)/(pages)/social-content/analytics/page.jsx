"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Eye,
  MousePointer,
  Users,
  Heart,
  Share2,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import {
  getPostStats,
  loadStatsForRows,
  fetchLivePostsFromConnectedAccounts,
} from "../../../../../(lib)/integration";
import { useAuth } from "@/context/AuthContext";
import ResponsiveTable from "@/app/(components)/ui/ResponsiveTable";
import { ChartFrame, useChartDensity } from "@/app/(components)/ui/ResponsiveChart";
import { AnalyticsSkeleton } from "@/app/(components)/skeletons/ContentSectionSkeletons";

const PLATFORM_META = {
  facebook: { label: "Facebook", color: "#3b82f6", emoji: "🔵" },
  instagram: { label: "Instagram", color: "#ec4899", emoji: "📸" },
  meta_ads: { label: "Meta Ads", color: "#6366f1", emoji: "📢" },
  google_ads: { label: "Google Ads", color: "#22c55e", emoji: "🔍" },
  tiktok: { label: "TikTok", color: "#94a3b8", emoji: "🎵" },
  tiktok_ads: { label: "TT Ads", color: "#0891b2", emoji: "🎯" },
  linkedin: { label: "LinkedIn", color: "#2563eb", emoji: "💼" },
  twitter: { label: "X/Twitter", color: "#475569", emoji: "🐦" },
  youtube: { label: "YouTube", color: "#ef4444", emoji: "▶️" },
  pinterest: { label: "Pinterest", color: "#e60023", emoji: "📌" },
};

/** Format a metric, falling back to an em dash so empty cells still read as cells. */
const num = (v) => v?.toLocaleString?.() ?? "—";

const METRIC_KEYS = ["impressions", "reach", "clicks", "likes", "shares", "comments"];

/** A post's stats carry at least one real number from the backend. */
const hasNumbers = (stats) =>
  !!stats && METRIC_KEYS.some((k) => typeof stats[k] === "number");

/**
 * Sum one metric over posts — but only the numbers the backend actually sent.
 * When no post has it, the total is `undefined` (shown as "—"), NOT 0: the
 * backend answering "no numbers for this post" is not the same as the post
 * getting zero engagement, and a 0 would claim the latter.
 */
const sumMetric = (posts, key) =>
  posts.reduce((total, p) => {
    const v = p.stats?.[key];
    return typeof v === "number" ? (total ?? 0) + v : total;
  }, undefined);

/** Clicks over impressions as a percentage, or undefined when either is missing. */
const ctrOf = (clicks, impressions) =>
  typeof clicks === "number" && impressions ? (clicks / impressions) * 100 : undefined;

/**
 * The Post Performance table, as data.
 *
 * One definition drives BOTH renderings in <ResponsiveTable> — the eight-column
 * table from `md` up, and the stacked label:value card below it. Writing the
 * cells once is the point: a metric added here appears in both, and the two
 * cannot drift apart the way a hand-maintained mobile variant would.
 *
 * `primary` marks the card's title (the post itself); the rest become labelled
 * rows inside it.
 */
const POST_COLUMNS = [
  {
    key: "post",
    header: "Post",
    primary: true,
    thClassName: "px-4",
    tdClassName: "px-4",
    cell: (post) => (
      <div className="flex items-center gap-2.5">
        {post.image_url && (
          <img
            src={post.image_url}
            alt=""
            className="w-8 h-8 rounded object-cover shrink-0"
          />
        )}
        {/* The cap only applies in the table, where eight columns share the
            width. On a card the title gets the full row. */}
        <p className="truncate text-xs text-gray-800 md:max-w-[160px]">
          {post.project_title}
        </p>
      </div>
    ),
  },
  {
    key: "platform",
    header: "Platform",
    cell: (post) => {
      const meta = PLATFORM_META[post.platform] || {
        emoji: "🌐",
        label: post.platform,
      };
      return (
        // whitespace-nowrap keeps the emoji and the platform name on one line when
        // the eight columns squeeze this cell.
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {meta.emoji} {meta.label}
        </span>
      );
    },
  },
  { key: "impressions", header: "Impressions", align: "center", cell: (p) => num(p.stats?.impressions) },
  { key: "reach", header: "Reach", align: "center", cell: (p) => num(p.stats?.reach) },
  { key: "clicks", header: "Clicks", align: "center", cell: (p) => num(p.stats?.clicks) },
  { key: "likes", header: "Likes", align: "center", cell: (p) => num(p.stats?.likes) },
  {
    key: "ctr",
    header: "CTR",
    align: "center",
    cell: (p) => {
      const ctr = ctrOf(p.stats?.clicks, p.stats?.impressions);
      return ctr == null ? "—" : `${ctr.toFixed(2)}%`;
    },
  },
  {
    key: "updated",
    header: "Updated",
    align: "right",
    thClassName: "px-4",
    tdClassName: "px-4",
    cell: (p) =>
      p.stats?.last_updated
        ? format(new Date(p.stats.last_updated), "MMM d HH:mm")
        : "—",
  },
];

function StatCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div className="rounded-xl bg-surface border border-gray-200 p-5 ">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: accent ? "#003dda1a" : "#f3f4f6" }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: accent ? "#003dda" : "#6b7280" }}
          />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/**
 * Recharts renders its tooltip through inline styles, so it can carry no
 * `dark:` class — the palette variables from globals.css are the only way it
 * follows the theme. Each var resolves to the hex it replaced in light mode,
 * and flips with the rest of the app in dark. */
const CUSTOM_TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-gray-200)",
    borderRadius: 8,
    fontSize: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  labelStyle: { color: "var(--color-gray-900)", fontWeight: 600 },
  itemStyle: { color: "var(--color-gray-700)" },
};

export default function SocialAnalytics() {
  const [allPosts, setAllPosts] = useState([]);
  const [fetchingLive, setFetchingLive] = useState(false);
  const { fetchIntegrations, activeBrandId } = useAuth();

  const [integrations, setIntegrations] = useState([]);
  // This page loads in two hops — integrations, then live posts and per-post
  // stats — and only the second one produces numbers. Both are tracked so the
  // KPI tiles never render a page of zeroes on the way there.
  const [integrationsReady, setIntegrationsReady] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const data = await fetchIntegrations();
        setIntegrations(data || []);
      } catch (err) {
        toast.error(err.message);
        setIntegrations([]);
      } finally {
        setIntegrationsReady(true);
      }
    };

    loadIntegrations();
  }, [fetchIntegrations, activeBrandId]);

  // A brand switch means a different set of posts. Clear them and put the KPI
  // tiles back into their loading state until the backend answers.
  useEffect(() => {
    setAllPosts([]);
    setStatsLoaded(false);
  }, [activeBrandId]);

  // Every post the backend lists, and — for the platforms the backend serves
  // per-post metrics for — those metrics from the backend. Nothing is kept
  // beyond this page's memory.
  const loadPosts = useCallback(
    async (silent = false) => {
      setFetchingLive(true);
      try {
        const rows = await fetchLivePostsFromConnectedAccounts(integrations);
        if (rows.errors?.length) toast.error(rows.errors.join(" · "));

        // Every published post on every platform is asked — the backend's
        // post-metrics answers for all of them, and says itself when it has no
        // numbers. A few requests at a time; a platform that refuses twice is
        // not asked again for its remaining posts (see loadStatsForRows).
        const socialRows = rows.filter((p) => p.type === "social");
        const { stats, errors } = await loadStatsForRows(
          socialRows.filter((p) => p.status === "published" && p.post_id),
          (p) =>
            getPostStats({
              platform: p.platform,
              brand_id: activeBrandId,
              post_id: p.post_id,
            }),
        );
        const social = socialRows.map((p) =>
          stats[p.id] ? { ...p, stats: stats[p.id] } : p,
        );
        setAllPosts(social);

        // A platform whose metrics request was refused: say so, in its words.
        const failed = Object.entries(errors);
        if (failed.length) {
          console.warn("Post metrics failed:", errors);
          toast.error(
            `Couldn't load stats — ${failed.map(([p, m]) => `${p}: ${m}`).join(" · ")}`,
          );
        }
        if (!silent)
          toast.success(
            `Loaded ${social.length} post${social.length === 1 ? "" : "s"}`,
          );
      } catch (err) {
        toast.error(err.message || "Couldn't load posts");
      } finally {
        setFetchingLive(false);
        setStatsLoaded(true);
      }
    },
    [integrations, activeBrandId],
  );

  useEffect(() => {
    if (!integrationsReady || !integrations.length) return;
    loadPosts(true);
  }, [integrationsReady, integrations, loadPosts]);

  // Derived rather than a third state flag, so the "no connected accounts" case
  // needs no effect to resolve it: with nothing to fetch, the page is already in
  // its final state the moment the integrations lookup returns empty.
  const initializing =
    !integrationsReady || (integrations.length > 0 && !statsLoaded);

  const posts = allPosts.filter((p) => p.type === "social");
  const publishedPosts = posts.filter((p) => p.status === "published");

  // Each total is undefined when no post reported that metric — see sumMetric.
  const totals = Object.fromEntries(
    METRIC_KEYS.map((k) => [k, sumMetric(publishedPosts, k)]),
  );

  // Clicks over impressions across every post, not an average of averages.
  const totalCTR = ctrOf(totals.clicks, totals.impressions);

  const platformMap = {};
  publishedPosts.forEach((p) => {
    const pm = PLATFORM_META[p.platform] || {
      label: p.platform,
      color: "#888",
    };
    if (!platformMap[p.platform]) {
      platformMap[p.platform] = {
        platform: pm.label,
        color: pm.color,
        impressions: 0,
        clicks: 0,
        likes: 0,
        posts: 0,
      };
    }
    platformMap[p.platform].impressions += p.stats?.impressions || 0;
    platformMap[p.platform].clicks += p.stats?.clicks || 0;
    platformMap[p.platform].likes += p.stats?.likes || 0;
    platformMap[p.platform].posts += 1;
  });
  // Only platforms whose posts reported impressions — a bar at 0 would claim
  // the posts were never seen, when the backend simply sent no number.
  const platformData = Object.entries(platformMap)
    .filter(([platform]) =>
      publishedPosts.some(
        (p) => p.platform === platform && typeof p.stats?.impressions === "number",
      ),
    )
    .map(([, row]) => row);

  function isSameDay(a, b) {
    return format(a, "yyyy-MM-dd") === format(b, "yyyy-MM-dd");
  }

  const timelineData = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(new Date(), 13 - i);
    const label = format(day, "MMM d");
    const dayPosts = publishedPosts.filter(
      (p) => p.published_at && isSameDay(new Date(p.published_at), day),
    );
    return {
      date: label,
      impressions: dayPosts.reduce(
        (a, p) => a + (p.stats?.impressions || 0),
        0,
      ),
      clicks: dayPosts.reduce((a, p) => a + (p.stats?.clicks || 0), 0),
      likes: dayPosts.reduce((a, p) => a + (p.stats?.likes || 0), 0),
    };
  });

  const engagementPie = [
    { name: "Likes", value: totals.likes, color: "#ec4899" },
    { name: "Shares", value: totals.shares, color: "#8b5cf6" },
    { name: "Comments", value: totals.comments, color: "#f59e0b" },
    { name: "Clicks", value: totals.clicks, color: "#22c55e" },
  ].filter((e) => e.value > 0);

  // A real number from the backend, not just a stats object: posts the backend
  // answered "unavailable" for still get one, holding only undefineds.
  const hasAnyStats = publishedPosts.some((p) => hasNumbers(p.stats));
  // Every chart on this page shares these, so making them density-aware here
  // adapts all of them at once. What actually breaks on a narrow screen is the
  // X axis: fourteen date labels at desktop density overlap into a grey smear.
  // `interval: "preserveStartEnd"` lets recharts drop as many intermediate
  // labels as it needs while still anchoring both ends — the first and last
  // dates are what make a 14-day series readable.
  const chart = useChartDensity();
  const xAxisProps = {
    tick: { fontSize: chart.tickFontSize, fill: "#9ca3af" },
    tickLine: false,
    axisLine: false,
    interval: chart.tickInterval,
    minTickGap: chart.minTickGap,
  };
  const yAxisProps = {
    tick: { fontSize: chart.tickFontSize, fill: "#9ca3af" },
    tickLine: false,
    axisLine: false,
    width: chart.yAxisWidth,
  };

  // Held until the stats pass finishes, not just the post sync: with posts but
  // no stats yet the page is real charts full of zeroes, which is a worse lie
  // than a placeholder.
  if (initializing) return <AnalyticsSkeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Social Analytics
          </h1>
          <p className="text-gray-500 text-sm">
            Aggregated social performance across platforms
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center cursor-pointer hover:scale-95 gap-2 px-3 py-2 rounded-lg border text-sm font-medium  disabled:opacity-50 transition-all duration-200 text-white"
            style={{ background: "#003dda", borderColor: "#003dda" }}
            onClick={() => loadPosts(false)}
            disabled={fetchingLive}
          >
            <RefreshCw
              className={"w-3.5 h-3.5 " + (fetchingLive ? "animate-spin" : "")}
            />
            {fetchingLive ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {publishedPosts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-surface p-16 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold mb-1">
            No published posts yet
          </p>
          <p className="text-gray-400 text-sm">
            Publish content from Creatives to start seeing analytics.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Eye}
              label="Total Impressions"
              value={num(totals.impressions)}
              accent
            />
            <StatCard
              icon={Users}
              label="Total Reach"
              value={num(totals.reach)}
            />
            <StatCard
              icon={MousePointer}
              label="Total Clicks"
              value={num(totals.clicks)}
            />
            <StatCard
              icon={TrendingUp}
              label="CTR"
              value={totalCTR == null ? "—" : `${totalCTR.toFixed(2)}%`}
              accent
            />
            <StatCard
              icon={Heart}
              label="Total Likes"
              value={num(totals.likes)}
            />
            <StatCard
              icon={Share2}
              label="Total Shares"
              value={num(totals.shares)}
            />
            <StatCard
              icon={CheckCircle2}
              label="Published Posts"
              value={publishedPosts.length}
              accent
            />
            <StatCard
              icon={Clock}
              label="Scheduled"
              value={posts.filter((p) => p.status === "scheduled").length}
            />
          </div>

          {/* Timeline chart — each post's totals on the day it was published */}
          <div className="rounded-xl bg-surface border border-gray-200 p-5 ">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">
              Posts published in the last 14 days — their totals, by publish day
            </h3>
            {/* With no numbers at all the chart is a flat line at 0, which reads
                as "no engagement" — say there's no data instead. */}
            {!hasAnyStats ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No metrics reported yet
              </p>
            ) : (
            <ChartFrame size="md"><ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" {...xAxisProps} />
                <YAxis {...yAxisProps} />
                <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="#003dda"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="likes"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer></ChartFrame>
            )}
          </div>

          {/* Platform breakdown + Engagement pie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-surface border border-gray-200 p-5 ">
              <h3 className="font-semibold text-gray-800 text-sm mb-4">
                Impressions by Platform
              </h3>
              {platformData.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No data
                </p>
              ) : (
                <ChartFrame size="sm"><ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={platformData}
                    margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="platform" {...xAxisProps} />
                    <YAxis {...yAxisProps} />
                    <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                    <Bar dataKey="impressions" radius={[4, 4, 0, 0]}>
                      {platformData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer></ChartFrame>
              )}
            </div>

            <div className="rounded-xl bg-surface border border-gray-200 p-5 ">
              <h3 className="font-semibold text-gray-800 text-sm mb-4">
                Engagement Breakdown
              </h3>
              {engagementPie.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No engagement data yet
                </p>
              ) : (
                <ChartFrame size="sm"><ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={engagementPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {engagementPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
                  </PieChart>
                </ResponsiveContainer></ChartFrame>
              )}
            </div>
          </div>

          {/* Post-level table */}
          <div className="rounded-xl bg-surface border border-gray-200 overflow-hidden ">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">
                Post Performance
              </h3>
            </div>
            {/* Eight metric columns cannot be read on a phone by scrolling
                sideways — the post you are looking at slides out from under its
                own headers. <ResponsiveTable> keeps the table from `md` up and
                stacks each row into a labelled card below it, from this single
                column definition. */}
            <ResponsiveTable
              rows={publishedPosts}
              rowKey={(post) => post.id}
              columns={POST_COLUMNS}
              className="border-0 rounded-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
