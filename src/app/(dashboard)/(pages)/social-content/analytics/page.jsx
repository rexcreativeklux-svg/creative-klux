"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
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
  RefreshCw,
  CheckCircle2,
  Clock,
  BarChart3,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import {
  getPostStats,
  loadStatsForRows,
  fetchLivePostsFromConnectedAccounts,
} from "../../../../../(lib)/integration";
import {
  groupByNetwork,
  metricKeysOf,
  metricLabel,
  formatMetric,
  isSummable,
  numeric,
  postMetrics,
  sumMetric,
} from "../../../../../(lib)/postMetrics";
import { useAuth } from "@/context/AuthContext";
import {
  SOCIAL_NETWORKS,
  useSocialPlatform,
} from "@/app/(components)/content/socialPlatformScope";

// The order networks appear in on All accounts — the sidebar's.
const NETWORK_ORDER = SOCIAL_NETWORKS.map((n) => n.id);
import { ChartFrame, useChartDensity } from "@/app/(components)/ui/ResponsiveChart";
import SocialPageActions from "@/app/(components)/content/SocialPageActions";
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

// Chart line / bar colours, handed to metrics in the order the backend sent them.
const SERIES_COLORS = ["#003dda", "#22c55e", "#ec4899", "#f59e0b", "#8b5cf6"];

// Metrics that read as engagement, by the names the backend uses — the pie only
// compares these, never audience size (reach, views) against them.
const ENGAGEMENT_KEYS = [
  "likes", "comments", "shares", "clicks", "saves",
  "like_count", "comment_count", "share_count",
];

/** A small spinner standing in for a chart whose numbers are still loading. */
function ChartSpinner() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 aria-label="Loading" className="h-4 w-4 animate-spin text-gray-300" />
    </div>
  );
}

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
  // Readiness is tied to the exact brand + network, so switching either goes
  // back to the skeleton instead of showing the previous answer as an empty page.
  const [integrationsBrand, setIntegrationsBrand] = useState(undefined);
  const integrationsReady = integrationsBrand === (activeBrandId ?? null);
  // The post list (posts + status counts) lands first; their metrics follow.
  const [postsKey, setPostsKey] = useState(null);
  const [statsKey, setStatsKey] = useState(null);
  const [chartKey, setChartKey] = useState(null);
  // platform → why the backend couldn't list that network's posts.
  const [listErrors, setListErrors] = useState({});

  // The network picked in the section sidebar (?platform=), or every network.
  // Only its connection is fetched.
  const { platform: scope, network, scoped, inScope } = useSocialPlatform();
  const loadKey = `${activeBrandId ?? ""}|${scope}`;
  const latestKey = useRef(loadKey);
  useEffect(() => {
    latestKey.current = loadKey;
  }, [loadKey]);
  const scopedIntegrations = useMemo(
    () => (scoped ? integrations.filter((i) => i.platform === scope) : integrations),
    [integrations, scoped, scope],
  );

  useEffect(() => {
    const brand = activeBrandId ?? null;
    const loadIntegrations = async () => {
      try {
        const data = await fetchIntegrations();
        setIntegrations(data || []);
      } catch (err) {
        toast.error(err.message);
        setIntegrations([]);
      } finally {
        setIntegrationsBrand(brand);
      }
    };

    loadIntegrations();
  }, [fetchIntegrations, activeBrandId]);

  // A brand switch means a different set of posts. Clear them and put the KPI
  // tiles back into their loading state until the backend answers.
  useEffect(() => {
    setAllPosts([]);
  }, [activeBrandId]);

  // Every post the backend lists, and — for the platforms the backend serves
  // per-post metrics for — those metrics from the backend. Nothing is kept
  // beyond this page's memory.
  const loadPosts = useCallback(
    async (silent = false, fresh = false) => {
      const key = loadKey;
      setFetchingLive(true);
      try {
        // Shared for a couple of minutes across the section's pages (see
        // requestCache); `fresh` (Refresh, a new post) asks the backend again.
        const rows = await fetchLivePostsFromConnectedAccounts(scopedIntegrations, {
          fresh,
        });
        if (latestKey.current !== key) return; // reader moved on
        // A network the backend couldn't read: its words, shown on the page.
        setListErrors(rows.errorsByPlatform || {});

        // The list is on screen now — counts and dates are real. Metrics follow.
        const socialRows = rows.filter((p) => p.type === "social");
        setAllPosts(socialRows);
        setPostsKey(key);

        // Every published post is asked — the backend's post-metrics says
        // itself when it has no numbers. A few requests at a time; a platform
        // that refuses twice is not asked again (see loadStatsForRows).
        const { stats, errors } = await loadStatsForRows(
          socialRows.filter((p) => p.status === "published" && p.post_id),
          (p) =>
            getPostStats({
              platform: p.platform,
              brand_id: activeBrandId,
              post_id: p.post_id,
              fresh,
            }),
        );
        if (latestKey.current !== key) return;
        setAllPosts((current) =>
          current.map((p) => (stats[p.id] ? { ...p, stats: stats[p.id] } : p)),
        );

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
            `Loaded ${socialRows.length} post${socialRows.length === 1 ? "" : "s"}`,
          );
      } catch (err) {
        toast.error(err.message || "Couldn't load posts");
      } finally {
        setFetchingLive(false);
        setPostsKey(key);
        setStatsKey(key);
      }
    },
    [scopedIntegrations, activeBrandId, loadKey],
  );

  useEffect(() => {
    if (!integrationsReady || !scopedIntegrations.length) return;
    loadPosts(true);
  }, [integrationsReady, scopedIntegrations, loadPosts]);

  // Derived rather than a third state flag, so the "no connected accounts" case
  // needs no effect to resolve it: with nothing to fetch, the page is already in
  // its final state the moment the integrations lookup returns empty.
  const initializing =
    !integrationsReady || (scopedIntegrations.length > 0 && postsKey !== loadKey);
  // The list is up but its metrics are not: spinners where the numbers go.
  const statsPending = scopedIntegrations.length > 0 && statsKey !== loadKey;

  // Only the picked network's rows, even before its refetch lands.
  const posts = allPosts.filter((p) => p.type === "social" && inScope(p.platform));
  const publishedPosts = posts.filter((p) => p.status === "published");

  // Every metric name the backend sent for these posts, as it named them. A
  // total is undefined (shown "—") when no post sent that metric.
  const metricKeys = metricKeysOf(publishedPosts);
  const summableKeys = metricKeys.filter(isSummable);
  const totals = Object.fromEntries(
    summableKeys.map((k) => [k, sumMetric(publishedPosts, k)]),
  );
  const reporting = (k) =>
    publishedPosts.filter((p) => numeric(postMetrics(p)?.[k]) !== undefined).length;
  // The metrics drawn over time: the ones most posts reported.
  const timelineKeys = [...summableKeys]
    .sort((a, b) => reporting(b) - reporting(a))
    .slice(0, 3);

  // The metric the platform chart compares — the reader's pick, else the first.
  const chartMetric = summableKeys.includes(chartKey) ? chartKey : summableKeys[0];
  // This network's five best posts on the picked metric — only posts the
  // backend sent that number for.
  const barColor = network?.color || "#003dda";
  const platformData = publishedPosts
    .map((p) => ({ p, v: numeric(postMetrics(p)?.[chartMetric]) }))
    .filter(({ v }) => v !== undefined)
    .sort((a, b) => b.v - a.v)
    .slice(0, 5)
    .map(({ p, v }) => {
      const title = p.project_title || p.caption || "Untitled";
      return {
        platform: title.length > 18 ? `${title.slice(0, 17)}…` : title,
        color: barColor,
        value: v,
      };
    });

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
      ...Object.fromEntries(
        timelineKeys.map((k) => [k, sumMetric(dayPosts, k) ?? 0]),
      ),
    };
  });

  const engagementPie = summableKeys
    .filter((k) => ENGAGEMENT_KEYS.includes(k) && totals[k] > 0)
    .map((k, i) => ({
      name: metricLabel(k),
      value: totals[k],
      color: SERIES_COLORS[i % SERIES_COLORS.length],
    }));

  // All accounts: one summary per network, each in that network's own metric
  // names — Facebook's totals are never added to TikTok's, whose backend
  // fields are different ones.
  const networkGroups = groupByNetwork(publishedPosts, NETWORK_ORDER);
  const accountOf = (platform) => {
    const i = integrations.find((x) => x.platform === platform);
    return i?.int_name || i?.account_label;
  };
  const errorEntries = Object.entries(listErrors).filter(([p]) => inScope(p));

  // Whether the backend sent any metric at all; posts it answered
  // "unavailable" for carry none.
  const hasAnyStats = metricKeys.length > 0;
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
            {network?.label ?? "Social"} Analytics
          </h1>
          <p className="text-gray-500 text-sm">
            {scoped
              ? `${network.label} performance`
              : "Aggregated social performance across platforms"}
          </p>
        </div>
        <SocialPageActions
          onRefresh={({ fresh, silent }) => loadPosts(!!silent, fresh)}
          refreshing={fetchingLive}
        />
      </div>

      {/* Networks the backend couldn't read — its reason, in its words. */}
      {errorEntries.length > 0 && (
        <div className="mb-6 space-y-2">
          {errorEntries.map(([platform, message]) => (
            <div
              key={platform}
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-semibold">
                  {`${PLATFORM_META[platform]?.label || platform} couldn't be read:`}
                </span>{" "}
                {message}
              </p>
            </div>
          ))}
        </div>
      )}

      {scoped && scopedIntegrations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-surface p-16 text-center">
          <network.Icon className="mx-auto mb-4 h-10 w-10" style={{ color: network.color }} />
          <p className="text-gray-800 font-semibold mb-1">
            {network.label} isn&apos;t connected
          </p>
          <p className="text-gray-400 text-sm mb-5">
            Connect it to see its analytics here.
          </p>
          <Link
            href="/integrations"
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#003dda" }}
          >
            Connect {network.label}
          </Link>
        </div>
      ) : publishedPosts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-surface p-16 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold mb-1">
            No published posts yet
          </p>
          <p className="text-gray-400 text-sm">
            Publish content from Creatives to start seeing analytics.
          </p>
        </div>
      ) : !scoped ? (
        /* All accounts — each network on its own, with its own metrics. Pick
           an account in the sidebar for its charts. */
        <div className="space-y-8">
          {networkGroups.map((group) => {
            const net = SOCIAL_NETWORKS.find((n) => n.id === group.platform);
            const keys = group.metricKeys.filter(isSummable);
            const reported = (k) =>
              group.posts.filter((p) => numeric(postMetrics(p)?.[k]) !== undefined).length;
            const pending = statsPending && !group.metricKeys.length;
            return (
              <section key={group.platform}>
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {net && <net.Icon className="h-5 w-5" style={{ color: net.color }} />}
                  <h2 className="text-base font-semibold text-gray-900">
                    {net?.label || PLATFORM_META[group.platform]?.label || group.platform}
                  </h2>
                  {accountOf(group.platform) && (
                    <span className="text-sm text-gray-500">{accountOf(group.platform)}</span>
                  )}
                  {net && (
                    <Link
                      href={`/social-content/analytics?platform=${net.id}`}
                      className="ml-auto text-xs font-semibold text-[#003dda] hover:underline"
                    >
                      Open {net.label} analytics →
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard
                    icon={CheckCircle2}
                    label="Published Posts"
                    value={group.posts.length}
                    accent
                  />
                  {pending ? (
                    <StatCard
                      icon={BarChart3}
                      label="Metrics"
                      value={<Loader2 className="h-5 w-5 animate-spin text-gray-300" />}
                    />
                  ) : (
                    keys.map((key) => (
                      <StatCard
                        key={key}
                        icon={BarChart3}
                        label={`Total ${metricLabel(key)}`}
                        value={formatMetric(key, sumMetric(group.posts, key)) ?? "—"}
                        sub={`${reported(key)} of ${group.posts.length} posts reported`}
                      />
                    ))
                  )}
                </div>
                {/* No numbers for this network: the backend's own reason. */}
                {!pending && !group.metricKeys.length && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    {group.note || `${net?.label || group.platform} sent no metrics for these posts.`}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsPending && (
              <StatCard
                icon={BarChart3}
                label="Metrics"
                value={<Loader2 className="h-5 w-5 animate-spin text-gray-300" />}
                accent
              />
            )}
            {summableKeys.map((key, i) => (
              <StatCard
                key={key}
                icon={BarChart3}
                label={`Total ${metricLabel(key)}`}
                value={formatMetric(key, totals[key]) ?? "—"}
                sub={`${reporting(key)} of ${publishedPosts.length} posts reported`}
                accent={i === 0}
              />
            ))}
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
            {statsPending ? (
              <ChartSpinner />
            ) : !hasAnyStats ? (
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
                {timelineKeys.map((k, i) => (
                  <Line
                    key={k}
                    type="monotone"
                    dataKey={k}
                    name={metricLabel(k)}
                    stroke={SERIES_COLORS[i]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer></ChartFrame>
            )}
          </div>

          {/* Platform breakdown + Engagement pie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-surface border border-gray-200 p-5 ">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-800 text-sm">
                  Top posts by {chartMetric ? metricLabel(chartMetric) : "metric"}
                </h3>
                {summableKeys.length > 1 && (
                  <select
                    value={chartMetric}
                    onChange={(e) => setChartKey(e.target.value)}
                    className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 outline-none"
                  >
                    {summableKeys.map((k) => (
                      <option key={k} value={k}>
                        {metricLabel(k)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {statsPending ? (
                <ChartSpinner />
              ) : platformData.length === 0 ? (
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
                    <Bar dataKey="value" name={metricLabel(chartMetric)} radius={[4, 4, 0, 0]}>
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
              {statsPending ? (
                <ChartSpinner />
              ) : engagementPie.length === 0 ? (
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
        </div>
      )}
    </div>
  );
}
