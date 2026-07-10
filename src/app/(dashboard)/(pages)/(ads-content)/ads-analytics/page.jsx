"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
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
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import {
  getPublishedPosts,
  savePublishedPost,
  getFacebookPostStats,
  getInstagramPostStats,
  fetchLivePostsFromConnectedAccounts,
  getMetaAdsCampaignStats,
} from "../../../../../(lib)/integration";
import { useAuth } from "@/context/AuthContext";

const PLATFORM_META = {
  facebook: { label: "Facebook", color: "#3b82f6", emoji: "🔵" },
  instagram: { label: "Instagram", color: "#ec4899", emoji: "📸" },
  meta_ads: { label: "Meta Ads", color: "#6366f1", emoji: "📢" },
  google_ads: { label: "Google Ads", color: "#22c55e", emoji: "🔍" },
  tiktok: { label: "TikTok", color: "#94a3b8", emoji: "🎵" },
  tiktok_ads: { label: "TT Ads", color: "#0891b2", emoji: "🎯" },
  linkedin: { label: "LinkedIn", color: "#2563eb", emoji: "💼" },
  twitter: { label: "X/Twitter", color: "#475569", emoji: "🐦" },
};

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

const CUSTOM_TOOLTIP_STYLE = {
  contentStyle: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  labelStyle: { color: "#111827", fontWeight: 600 },
  itemStyle: { color: "#374151" },
};

export default function AdsAnalytics() {
  const [allPosts, setAllPosts] = useState([]);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const { fetchIntegrations, updateIntegration } = useAuth();

  const [integrations, setIntegrations] = useState([]);

  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const data = await fetchIntegrations();
        setIntegrations(data || []);
      } catch (err) {
        console.error("Failed to load integrations", err);
        setIntegrations([]);
      }
    };

    loadIntegrations();
  }, [fetchIntegrations]);

  const reload = useCallback(() => setAllPosts(getPublishedPosts()), []);

  const fetchLive = useCallback(
    async (silent = false) => {
      setFetchingLive(true);
      try {
        const livePosts = await fetchLivePostsFromConnectedAccounts(
          integrations,
          {
            onTokenRotated: (id, rt) =>
              updateIntegration(id, { refresh_token: rt }),
          },
        );
        const local = getPublishedPosts();
        const localIds = new Set(local.map((p) => p.id));
        const newPosts = livePosts.filter((lp) => !localIds.has(lp.id));
        const merged = [...newPosts, ...local];
        localStorage.setItem(
          "creativeklux_published_posts",
          JSON.stringify(merged),
        );
        setAllPosts(merged);
        if (!silent) {
          toast.success(
            newPosts.length > 0
              ? `Synced ${newPosts.length} live post(s)`
              : "Already up to date",
          );
        }
      } catch {
        if (!silent) toast.error("Failed to fetch live posts");
        else reload();
      } finally {
        setFetchingLive(false);
      }
    },
    [reload, integrations],
  );

  const accountsMap = useCallback(() => {
    const map = {};
    integrations.forEach((i) => {
      map[i.platform] = {
        access_token: i.int_token,
        page_id: i.int_id,
        ig_user_id: i.int_id,
        ad_account_id: i.int_id,
      };
    });
    return map;
  }, [integrations]);

  useEffect(() => {
    if (!integrations.length) return;

    const initializeAnalytics = async () => {
      await fetchLive(true);

      setRefreshingAll(true);
      try {
        const accounts = accountsMap();
        const localPosts = getPublishedPosts();
        const adPosts = localPosts.filter(
          (p) => p.type === "ad" && p.status === "published",
        );

        let updated = 0;
        for (const post of adPosts) {
          if (!post.post_id) continue;
          try {
            let newStats = null;
            if (post.platform === "facebook" && accounts.facebook) {
              newStats = await getFacebookPostStats({
                access_token: accounts.facebook.access_token,
                post_id: post.post_id,
              });
            }
            if (post.platform === "instagram" && accounts.instagram) {
              newStats = await getInstagramPostStats({
                access_token: accounts.instagram.access_token,
                post_id: post.post_id,
              });
            }

            if (post.platform === "meta_ads" && accounts.meta_ads) {
              newStats = await getMetaAdsCampaignStats({
                access_token: accounts.meta_ads.access_token,
                campaign_id: post.post_id,
              });
            }

            if (newStats) {
              savePublishedPost({
                ...post,
                stats: {
                  ...post.stats,
                  ...newStats,
                  last_updated: new Date().toISOString(),
                },
              });
              updated++;
            }
          } catch (err) {
            console.warn(`Failed stats refresh for ${post.id}`, err);
          }
        }

        reload();
        if (updated > 0) {
          toast.success(`Loaded analytics for ${updated} ad(s)`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setRefreshingAll(false);
      }
    };

    initializeAnalytics();
  }, [integrations, fetchLive, accountsMap, reload]);

  const posts = allPosts.filter((p) => p.type === "ad");
  const connectedPlatforms = new Set(integrations.map((i) => i.platform));

  const publishedPosts =
    integrations.length === 0
      ? []
      : posts.filter(
          (p) =>
            p.status === "published" &&
            (!p.live || connectedPlatforms.has(p.platform)),
        );

  const totals = publishedPosts.reduce(
    (acc, p) => {
      const s = p.stats || {};
      acc.impressions += s.impressions || 0;
      acc.reach += s.reach || 0;
      acc.clicks += s.clicks || 0;
      acc.likes += s.likes || 0;
      acc.shares += s.shares || 0;
      acc.comments += s.comments || 0;
      return acc;
    },
    { impressions: 0, reach: 0, clicks: 0, likes: 0, shares: 0, comments: 0 },
  );

  const avgCTR = publishedPosts.length
    ? (
        publishedPosts.reduce((a, p) => a + (p.stats?.ctr || 0), 0) /
        publishedPosts.length
      ).toFixed(2)
    : "0.00";

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
  const platformData = Object.values(platformMap);

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

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    const accounts = accountsMap();
    let updated = 0;

    for (const post of publishedPosts) {
      if (!post.post_id) continue;
      try {
        let newStats = null;
        if (post.platform === "facebook" && accounts.facebook) {
          newStats = await getFacebookPostStats({
            access_token: accounts.facebook.access_token,
            post_id: post.post_id,
          });
        }
        if (post.platform === "instagram" && accounts.instagram) {
          newStats = await getInstagramPostStats({
            access_token: accounts.instagram.access_token,
            post_id: post.post_id,
          });
        }

        if (post.platform === "meta_ads" && accounts.meta_ads) {
          newStats = await getMetaAdsCampaignStats({
            access_token: accounts.meta_ads.access_token,
            campaign_id: post.post_id,
          });
        }

        if (newStats) {
          savePublishedPost({
            ...post,
            stats: {
              ...post.stats,
              ...newStats,
              last_updated: new Date().toISOString(),
            },
          });
          updated++;
        }
      } catch (e) {
        console.warn(e);
      }
    }

    reload();
    setRefreshingAll(false);
    toast.success(
      updated > 0
        ? `Refreshed stats for ${updated} ad(s)`
        : "No live stats available — connect Facebook or Instagram first",
    );
  };

  const hasAnyStats = publishedPosts.some(
    (p) => p.stats && Object.keys(p.stats).length > 0,
  );
  const xAxisProps = {
    tick: { fontSize: 10, fill: "#9ca3af" },
    tickLine: false,
    axisLine: false,
  };
  const yAxisProps = {
    tick: { fontSize: 10, fill: "#9ca3af" },
    tickLine: false,
    axisLine: false,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Ads Analytics
          </h1>
          <p className="text-gray-500 text-sm">
            Aggregated ads performance across platforms
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center cursor-pointer hover:scale-95 gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-surface text-sm text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
            onClick={() => fetchLive(false)}
            disabled={fetchingLive}
          >
            <RefreshCw
              className={"w-3.5 h-3.5 " + (fetchingLive ? "animate-spin" : "")}
            />
            {fetchingLive ? "Syncing..." : "Sync Live Posts"}
          </button>
          <button
            className="inline-flex items-center cursor-pointer hover:scale-95 gap-2 px-3 py-2 rounded-lg border text-sm font-medium  disabled:opacity-50 transition-all duration-200 text-white"
            style={{ background: "#003dda", borderColor: "#003dda" }}
            onClick={handleRefreshAll}
            disabled={refreshingAll}
          >
            <RefreshCw
              className={"w-3.5 h-3.5 " + (refreshingAll ? "animate-spin" : "")}
            />
            {refreshingAll ? "Fetching stats..." : "Refresh Stats"}
          </button>
        </div>
      </div>

      {publishedPosts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-surface p-16 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold mb-1">
            No published ads yet
          </p>
          <p className="text-gray-400 text-sm">
            Publish content from Creatives to start seeing analytics.
          </p>
        </div>
      ) : (
        <div className="space-y-6 pb-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Eye}
              label="Total Impressions"
              value={totals.impressions.toLocaleString()}
              accent
            />
            <StatCard
              icon={Users}
              label="Total Reach"
              value={totals.reach.toLocaleString()}
            />
            <StatCard
              icon={MousePointer}
              label="Total Clicks"
              value={totals.clicks.toLocaleString()}
            />
            <StatCard
              icon={TrendingUp}
              label="Avg. CTR"
              value={`${avgCTR}%`}
              accent
            />
            <StatCard
              icon={Heart}
              label="Total Likes"
              value={totals.likes.toLocaleString()}
            />
            <StatCard
              icon={Share2}
              label="Total Shares"
              value={totals.shares.toLocaleString()}
            />
            <StatCard
              icon={CheckCircle2}
              label="Published Ads"
              value={publishedPosts.length}
              accent
            />
            <StatCard
              icon={Clock}
              label="Scheduled"
              value={posts.filter((p) => p.status === "scheduled").length}
            />
          </div>

          {!hasAnyStats && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              No stats fetched yet. Click{" "}
              <strong className="mx-1">Refresh Stats</strong> to pull live
              metrics from connected Facebook / Instagram accounts.
            </div>
          )}

          {/* Timeline chart */}
          <div className="rounded-xl bg-surface border border-gray-200 p-5 ">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">
              Performance — Last 14 Days
            </h3>
            <ResponsiveContainer width="100%" height={220}>
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
            </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={200}>
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
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={200}>
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
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Post-level table */}
          <div className="rounded-xl bg-surface border border-gray-200 overflow-hidden ">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">
                Ad Performance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-semibold">
                      Ad
                    </th>
                    <th className="text-left px-3 py-2.5 text-xs text-gray-400 font-semibold">
                      Platform
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs text-gray-400 font-semibold">
                      Impressions
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs text-gray-400 font-semibold">
                      Reach
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs text-gray-400 font-semibold">
                      Clicks
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs text-gray-400 font-semibold">
                      Likes
                    </th>
                    <th className="text-center px-3 py-2.5 text-xs text-gray-400 font-semibold">
                      CTR
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-semibold">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {publishedPosts.map((post, i) => {
                    const meta = PLATFORM_META[post.platform] || {
                      emoji: "🌐",
                      label: post.platform,
                    };
                    const s = post.stats || {};
                    return (
                      <tr
                        key={post.id}
                        className={
                          "border-b border-gray-100 hover:bg-blue-50 transition-colors " +
                          (i % 2 !== 0 ? "bg-gray-50/60" : "bg-surface")
                        }
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {post.image_url && (
                              <img
                                src={post.image_url}
                                alt=""
                                className="w-8 h-8 rounded object-cover shrink-0"
                              />
                            )}
                            <p className="text-xs text-gray-800 truncate max-w-[160px]">
                              {post.project_title}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">
                          {meta.emoji} {meta.label}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-800">
                          {s.impressions?.toLocaleString() || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-800">
                          {s.reach?.toLocaleString() || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-800">
                          {s.clicks?.toLocaleString() || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-800">
                          {s.likes?.toLocaleString() || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-800">
                          {s.ctr ? `${Number(s.ctr).toFixed(2)}%` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[10px] text-gray-400">
                          {s.last_updated
                            ? format(new Date(s.last_updated), "MMM d HH:mm")
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
