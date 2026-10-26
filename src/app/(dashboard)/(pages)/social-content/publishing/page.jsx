"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  Eye,
  MousePointer,
  Users,
  Heart,
  Share2,
  TrendingUp,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPostStats,
  POST_STATS_PLATFORMS,
  loadStatsForRows,
  fetchLivePostsFromConnectedAccounts,
  deletePostFromPlatform,
  platformSupportsDelete,
  carryStats,
} from "../../../../../(lib)/integration";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import { PublishingSkeleton } from "@/app/(components)/skeletons/ContentSectionSkeletons";

const BRAND = "#003dda";
const BRAND_LIGHT = "#003dda14";

/* ─── Helpers ─── */
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );
}
// Delete is only offered where the backend can really delete the post.
function deleteMessage(post) {
  const title = post.project_title || "Untitled";
  const label = PLATFORM_META[post.platform]?.label || post.platform;
  return `“${title}” will be deleted from ${label}. This can't be undone.`;
}

// Per-post metrics the backend serves today.
const STATS_PLATFORMS = POST_STATS_PLATFORMS;

const PLATFORM_LABEL = (platform) => PLATFORM_META[platform]?.label || platform;

/* ─── Platform config ─── */
const PLATFORM_META = {
  facebook: {
    label: "Facebook",
    icon: "🔵",
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
    group: "social",
  },
  instagram: {
    label: "Instagram",
    icon: "📸",
    cls: "bg-pink-50 text-pink-700 border border-pink-200",
    group: "social",
  },
  twitter: {
    label: "X / Twitter",
    icon: "🐦",
    cls: "bg-slate-50 text-slate-700 border border-slate-200",
    group: "social",
  },
  linkedin: {
    label: "LinkedIn",
    icon: "💼",
    cls: "bg-blue-50 text-blue-800 border border-blue-200",
    group: "social",
  },
  tiktok: {
    label: "TikTok",
    icon: "🎵",
    cls: "bg-gray-50 text-gray-700 border border-gray-200",
    group: "social",
  },
  youtube: {
    label: "YouTube",
    icon: "▶️",
    cls: "bg-red-50 text-red-700 border border-red-200",
    group: "social",
  },
  pinterest: {
    label: "Pinterest",
    icon: "📌",
    cls: "bg-rose-50 text-rose-700 border border-rose-200",
    group: "social",
  },
  meta_ads: {
    label: "Meta Ads",
    icon: "📢",
    cls: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    group: "ads",
  },
  google_ads: {
    label: "Google Ads",
    icon: "🔍",
    cls: "bg-green-50 text-green-700 border border-green-200",
    group: "ads",
  },
  tiktok_ads: {
    label: "TikTok Ads",
    icon: "🎯",
    cls: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    group: "ads",
  },
  linkedin_ads: {
    label: "LinkedIn Ads",
    icon: "📊",
    cls: "bg-blue-50 text-blue-800 border border-blue-200",
    group: "ads",
  },
  snapchat_ads: {
    label: "Snapchat Ads",
    icon: "💥",
    cls: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    group: "ads",
  },
  pinterest_ads: {
    label: "Pinterest Ads",
    icon: "🎯",
    cls: "bg-rose-50 text-rose-700 border border-rose-200",
    group: "ads",
  },
};

const SOCIAL_PLATFORMS = Object.entries(PLATFORM_META)
  .filter(([, v]) => v.group === "social")
  .map(([k, v]) => ({ id: k, ...v }));
const ADS_PLATFORMS = Object.entries(PLATFORM_META)
  .filter(([, v]) => v.group === "ads")
  .map(([k, v]) => ({ id: k, ...v }));

const TABLE_COLS = [
  { label: "Creative", align: "left" },
  { label: "Platform", align: "left" },
  { label: "Status", align: "left" },
  { label: "Date", align: "left" },
  { label: "Impr.", align: "center", Icon: Eye },
  { label: "Reach", align: "center", Icon: Users },
  { label: "Clicks", align: "center", Icon: MousePointer },
  { label: "Likes", align: "center", Icon: Heart },
  { label: "Shares", align: "center", Icon: Share2 },
  { label: "CTR", align: "center", Icon: TrendingUp },
  { label: "Actions", align: "right" },
];

// "Scheduled" is a post the platform itself reports as scheduled.
const TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "scheduled", label: "Scheduled" },
];

/* ─── Sub-components ─── */
function StatCell({ value }) {
  if (value === undefined || value === null)
    return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className="text-xs font-semibold text-gray-800">
      {typeof value === "number" ? value.toLocaleString() : value}
    </span>
  );
}

function StatusBadge({ post }) {
  if (post.status === "published") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-2.5 h-2.5" />
        Published
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 border border-blue-200"
      style={{ color: BRAND }}
    >
      <Clock className="w-2.5 h-2.5" />
      Scheduled
    </span>
  );
}

function SummaryCard({ label, value, Icon }) {
  return (
    <div className="rounded-xl bg-surface border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: BRAND_LIGHT }}
      >
        <Icon className="w-4 h-4" style={{ color: BRAND }} />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function SocialPublishing() {
  // Hardcoded for social
  const typeLabel = "Social";
  const matchType = "social";

  const [allPosts, setAllPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(null);
  const [fetchingLive, setFetchingLive] = useState(false);
  // The post the trash icon armed — deleting is irreversible, so it waits on a confirm.
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { fetchIntegrations, activeBrandId } = useAuth();
  const [integrations, setIntegrations] = useState([]);
  const [integrationsReady, setIntegrationsReady] = useState(false);
  // First load only — see the skeleton guard below the hooks.
  const [loading, setLoading] = useState(true);

  // A brand switch clears the previous brand's posts and holds the skeleton
  // until the backend answers for the new one.
  useEffect(() => {
    setAllPosts([]);
    setLoading(true);
  }, [activeBrandId]);

  // 1. Load integrations first. Keyed on the active brand too: the endpoint scopes
  //    integrations to the brand the backend has active, so a switch must refetch.
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const data = await fetchIntegrations();
        setIntegrations(data || []);
      } catch (err) {
        // The backend's own words. A failed lookup still has to unblock step 3 —
        // otherwise the page waits on a flag that will never flip and the
        // skeleton never resolves.
        toast.error(err.message);
        setIntegrations([]);
      } finally {
        setIntegrationsReady(true);
      }
    };
    loadIntegrations();
  }, [fetchIntegrations, activeBrandId]);

  // Every row's metrics, fetched after the list so the table can render first.
  // Each platform's refusal is reported once, in the server's words.
  const loadAllStats = useCallback(
    async (rows) => {
      const targets = rows.filter(
        (p) =>
          p.type === matchType && p.post_id && STATS_PLATFORMS.includes(p.platform),
      );
      if (!targets.length) return;
      const { stats, errors } = await loadStatsForRows(targets, (row) =>
        getPostStats({
          platform: row.platform,
          post_id: row.post_id,
          brand_id: activeBrandId,
        }),
      );
      setAllPosts((current) =>
        current.map((p) => (stats[p.id] ? { ...p, stats: stats[p.id] } : p)),
      );
      Object.entries(errors).forEach(([platform, message]) =>
        toast.error(`${PLATFORM_LABEL(platform)} stats: ${message}`),
      );
    },
    [activeBrandId],
  );

  // 2. The posts, exactly as the backend lists them. Nothing is kept in the
  //    browser, so what's on screen is always the backend's answer.
  const loadPosts = useCallback(
    async (silent = false) => {
      setFetchingLive(true);
      let rows = [];
      try {
        rows = await fetchLivePostsFromConnectedAccounts(integrations);
        setAllPosts((prev) => carryStats(prev, rows));
        // A platform the backend couldn't read: show its own error, always.
        if (rows.errors?.length) toast.error(rows.errors.join(" · "));
        if (!silent) {
          const count = rows.filter((p) => p.type === matchType).length;
          toast.success(`Loaded ${count} post${count === 1 ? "" : "s"}`);
        }
      } catch (err) {
        toast.error(err.message || "Couldn't load posts");
      } finally {
        setFetchingLive(false);
        setLoading(false);
      }
      // After the table is up — the numbers fill in as they arrive.
      if (rows.length) loadAllStats(rows);
    },
    [integrations, loadAllStats],
  );

  // 3. Load once integrations have resolved.
  useEffect(() => {
    if (!integrationsReady) return;
    loadPosts(true);
  }, [integrationsReady, integrations, loadPosts]);

  const posts = allPosts.filter((p) => p.type === matchType);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (statusFilter !== "all")
      result = result.filter((p) => p.status === statusFilter);
    if (platformFilter !== "all")
      result = result.filter((p) => p.platform === platformFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.project_title || "").toLowerCase().includes(q) ||
          (p.caption || "").toLowerCase().includes(q),
      );
    }
    // Newest → oldest by the relevant date (scheduled uses scheduled_at, else published_at).
    const dateOf = (p) =>
      new Date(
        p.status === "scheduled"
          ? p.scheduled_at
          : p.published_at || p.scheduled_at,
      ).getTime() || 0;
    return [...result].sort((a, b) => dateOf(b) - dateOf(a));
  }, [posts, statusFilter, platformFilter, search]);

  const integrationsMap = useMemo(() => {
    if (!Array.isArray(integrations)) return {};

    return integrations.reduce((acc, item) => {
      acc[item.platform] = item;
      return acc;
    }, {});
  }, [integrations]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const pagedPosts = filteredPosts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter, platformFilter, search]);

  const handleDelete = async () => {
    const post = pendingDelete;
    if (!post) return;
    setDeleting(true);
    try {
      await deletePostFromPlatform(post, activeBrandId);
      await loadPosts(true);
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err.message || "Couldn't delete the post");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  // The post's metrics from the backend, held only for this page's lifetime.
  const handleRefreshStats = async (post) => {
    setRefreshing(post.id);
    try {
      const newStats = await getPostStats({
        platform: post.platform,
        brand_id: activeBrandId,
        post_id: post.post_id,
      });
      const stats = { ...newStats, last_updated: new Date().toISOString() };
      setAllPosts((rows) =>
        rows.map((p) => (p.id === post.id ? { ...p, stats } : p)),
      );
      toast.success("Stats loaded");
    } catch (err) {
      toast.error(`Couldn't load stats: ${err.message}`);
    } finally {
      setRefreshing(null);
    }
  };

  const hasConnections = Object.keys(integrationsMap).length > 0;

  const TAB_COUNTS = {
    all: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
  };

  // Held until the backend's first answer, so the "no posts yet" empty state
  // never flashes at someone who does have posts.
  if (loading) return <PublishingSkeleton />;

  return (
    <div className="pb-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
            {typeLabel} Publishing
          </h1>
          <p className="text-gray-500 text-sm">
            Your posts on each connected account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasConnections && (
            <button
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-surface text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
              onClick={() => loadPosts(false)}
              disabled={fetchingLive}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-2 text-gray-500 ${fetchingLive ? "animate-spin" : ""}`}
              />
              {fetchingLive ? "Refreshing…" : "Refresh"}
            </button>
          )}
          {!hasConnections && (
            <Link
              href="/integrations"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: BRAND }}
            >
              Connect Platforms →
            </Link>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {posts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <SummaryCard
            label="Total Posts"
            value={posts.length}
            Icon={BarChart3}
          />
          <SummaryCard
            label="Published"
            value={TAB_COUNTS.published}
            Icon={CheckCircle2}
          />
          <SummaryCard
            label="Scheduled"
            value={TAB_COUNTS.scheduled}
            Icon={Calendar}
          />
          <SummaryCard
            label="Impressions (loaded rows)"
            // A dash until some row's stats are loaded — a 0 would claim no
            // impressions when they simply haven't been asked for.
            value={
              posts.some((p) => p.stats?.impressions != null)
                ? posts
                    .reduce((s, p) => s + (p.stats?.impressions || 0), 0)
                    .toLocaleString()
                : "—"
            }
            Icon={Eye}
          />
        </div>
      )}

      {/* ── Status Tabs ── */}
      {posts.length > 0 && (
        <div className="border-b border-gray-200 bg-surface rounded-t-xl shadow-sm">
          {/* The tab row scrolls sideways on narrow screens instead of squeezing or
              spilling out of the card. The -1px pull lives on the scroller (not on
              each button) so the active tab's underline still covers the wrapper's
              hairline without overflowing — and being clipped by — the scroll box. */}
          <div className="-mb-px flex items-center overflow-x-auto hide-scrollbar px-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                    ? "border-[#003dda] text-[#003dda]"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {tab.label}
                <span
                  className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={
                    statusFilter === tab.key
                      ? { backgroundColor: BRAND, color: "#fff" }
                      : { backgroundColor: "var(--color-gray-100)", color: "var(--color-gray-500)" }
                  }
                >
                  {TAB_COUNTS[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      {posts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-surface border-x border-b border-gray-200 rounded-b-xl mb-6 shadow-sm">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 h-9">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-700 outline-none pr-1 cursor-pointer"
            >
              <option value="all">All Platforms</option>
              <optgroup label="── Social Media">
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or caption…"
              className="w-full pl-8 pr-8 h-9 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#003dda] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs text-gray-400 ml-auto">
            {filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── Empty: filters active but no results ── */}
      {filteredPosts.length === 0 && posts.length > 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-surface p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-gray-800 font-medium mb-1">
            No posts match your filters
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Try adjusting the platform, status, or search query.
          </p>
          <button
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => {
              setStatusFilter("all");
              setPlatformFilter("all");
              setSearch("");
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* ── Empty: no posts at all ── */}
      {posts.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-surface p-16 text-center shadow-sm">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: BRAND_LIGHT }}
          >
            <Calendar className="w-7 h-7" style={{ color: BRAND }} />
          </div>
          <p className="text-gray-900 font-semibold mb-1">
            No published or scheduled social posts yet
          </p>
          <p className="text-gray-400 text-sm mb-5">
            Go to your Creatives, hover a card, and click{" "}
            <strong className="text-gray-600">Publish</strong> to get started.
          </p>
          <Link
            href="/creatives"
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: BRAND }}
          >
            Go to Creatives
          </Link>
        </div>
      )}

      {/* ── Table ── */}
      {pagedPosts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden ">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {TABLE_COLS.map((col) => (
                    <th
                      key={col.label}
                      className={`px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                            ? "text-right"
                            : "text-left"
                      }`}
                    >
                      {col.Icon ? (
                        <span className="inline-flex items-center gap-1">
                          <col.Icon className="w-3 h-3" />
                          {col.label}
                        </span>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedPosts.map((post, i) => {
                  const meta = PLATFORM_META[post.platform] || {
                    label: post.platform,
                    icon: "🌐",
                    cls: "bg-gray-50 text-gray-700 border border-gray-200",
                  };
                  const stats = post.stats || {};
                  return (
                    <tr
                      key={post.id}
                      className={`border-b border-gray-100 transition-colors hover:bg-blue-50/40 ${i % 2 === 0 ? "bg-surface" : "bg-gray-50/50"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {post.image_url ? (
                            <img
                              src={post.image_url}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 border border-gray-200" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate max-w-[180px]">
                              {post.project_title}
                            </p>
                            {post.caption && (
                              <p className="text-[10px] text-gray-400 truncate max-w-[180px] mt-0.5">
                                {post.caption}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {/* whitespace-nowrap: when the table is squeezed the emoji
                            and the platform name must stay on one line — wrapping
                            them stacks the two inside the pill's fixed height. */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${meta.cls}`}
                        >
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge post={post} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {post.status === "scheduled" && post.scheduled_at
                          ? formatDate(post.scheduled_at)
                          : formatDate(post.published_at)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatCell value={stats.impressions} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatCell value={stats.reach} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatCell value={stats.clicks} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatCell value={stats.likes} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatCell value={stats.shares} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatCell
                          value={
                            stats.ctr
                              ? `${Number(stats.ctr).toFixed(2)}%`
                              : undefined
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {post.post_id &&
                            STATS_PLATFORMS.includes(post.platform) && (
                            <button
                              className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
                              onClick={() => handleRefreshStats(post)}
                              disabled={refreshing === post.id}
                              title="Load stats"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${refreshing === post.id ? "animate-spin" : ""}`}
                              />
                            </button>
                          )}
                          {post.post_id &&
                            platformSupportsDelete(post.platform) && (
                            <button
                              className="h-7 w-7 rounded-md flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              onClick={() => setPendingDelete(post)}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-xs text-gray-400">
              Showing{" "}
              {filteredPosts.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filteredPosts.length)} of{" "}
              {filteredPosts.length} posts
            </span>
            {totalPages > 1 && (
              // flex-wrap: every page gets its own number button, so a long list
              // must wrap onto a second line rather than run off the card.
              <div className="flex flex-wrap items-center justify-end gap-1">
                <button
                  className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className="h-7 w-7 rounded-md text-xs font-semibold transition-colors"
                      style={
                        n === page
                          ? { backgroundColor: BRAND, color: "#fff" }
                          : { color: "#6b7280" }
                      }
                      onMouseEnter={(e) => {
                        if (n !== page)
                          e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }}
                      onMouseLeave={(e) => {
                        if (n !== page)
                          e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this post?"
        message={pendingDelete ? deleteMessage(pendingDelete) : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        variant="danger"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
