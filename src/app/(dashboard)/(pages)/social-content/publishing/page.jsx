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
  AlertCircle,
  Send,
  Edit2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPublishedPosts,
  savePublishedPost,
  getFacebookPostStats,
  getInstagramPostStats,
  publishToFacebook,
  publishToInstagram,
  publishToMetaAds,
  fetchLivePostsFromConnectedAccounts,
  deletePostFromPlatform,
} from "../../../../../(lib)/integration";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import EditPostModal from "./_components/EditPostModal";

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
function isAfterNow(iso) {
  return iso && new Date() > new Date(iso);
}

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

const TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "scheduled", label: "Scheduled" },
  { key: "failed", label: "Failed" },
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
  if (post.status === "scheduled") {
    // Future publish time → still scheduled (matches the calendar's wording).
    if (isAfterNow(post.scheduled_at)) {
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
    // Time has passed but we still have it as scheduled → it's going live now.
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-2.5 h-2.5" />
        Publishing…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
      <AlertCircle className="w-2.5 h-2.5" />
      Failed
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
  const [editingPost, setEditingPost] = useState(null);
  const [publishingNow, setPublishingNow] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { fetchIntegrations, updateIntegration } = useAuth();
  const [integrations, setIntegrations] = useState([]);
  const [integrationsReady, setIntegrationsReady] = useState(false);

  // Show saved posts immediately — even before integrations resolve, or if there are none.
  useEffect(() => {
    setAllPosts(getPublishedPosts());
  }, []);

  // 1. Load integrations first
  useEffect(() => {
    const loadIntegrations = async () => {
      const data = await fetchIntegrations();
      setIntegrations(data || []);
      setIntegrationsReady(true);
    };
    loadIntegrations();
  }, [fetchIntegrations]);

  // 2. Fix the stale closure by adding integrations to deps
  const mergeLiveIntoLocal = useCallback(
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

        // Facebook is authoritative for status. Keep a local post ONLY when FB no longer
        // reports it, and never trust a local 'scheduled' — otherwise a stale local
        // scheduled entry shadows the now-published post and the status never flips.
        const liveIds = new Set(livePosts.map((p) => p.id));
        const local = getPublishedPosts();
        const prevIds = new Set(local.map((p) => p.id));
        const localOnly = local.filter(
          (p) => !liveIds.has(p.id) && p.status !== "scheduled",
        );

        // livePosts lists published before scheduled, so dedupe-by-id prefers the published copy.
        const byId = new Map();
        [...livePosts, ...localOnly].forEach((p) => {
          if (!byId.has(p.id)) byId.set(p.id, p);
        });
        const all = [...byId.values()];

        // Persist published only — scheduled stays live-only.
        localStorage.setItem(
          "creativeklux_published_posts",
          JSON.stringify(all.filter((p) => p.status !== "scheduled")),
        );
        setAllPosts(all);

        const newCount = livePosts.filter(
          (p) => p.status !== "scheduled" && !prevIds.has(p.id),
        ).length;
        if (!silent && newCount > 0)
          toast.success(`Fetched ${newCount} live post(s)`);
        else if (!silent)
          toast.info("No new posts found from connected accounts");
      } catch {
        if (!silent) toast.error("Failed to fetch live posts");
        setAllPosts(getPublishedPosts());
      } finally {
        setFetchingLive(false);
      }
    },
    [integrations],
  );

  // 3. Auto-fetch once integrations have resolved — even if there are none,
  //    so saved localStorage posts still load (was previously a dead path).
  useEffect(() => {
    if (!integrationsReady) return;
    mergeLiveIntoLocal(true);
  }, [integrationsReady, integrations, mergeLiveIntoLocal]);

  const reload = useCallback(() => setAllPosts(getPublishedPosts()), []);
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

  const handleDelete = async (post) => {
    await deletePostFromPlatform(post);
    reload();
    toast.success("Post removed");
  };

  const handlePublishNow = async (post) => {
    setPublishingNow(post.id);
    const account = integrationsMap[post.platform];

    if (!account) {
      toast.error(`No connected account for ${post.platform}`);
      setPublishingNow(null);
      return;
    }
    try {
      let postId = null;
      if (post.platform === "facebook") {
        const r = await publishToFacebook({
          access_token: account.access_token,
          page_id: account.page_id,
          image_url: post.image_url,
          caption: post.caption,
        });
        postId = r.post_id;
      } else if (post.platform === "instagram") {
        const r = await publishToInstagram({
          access_token: account.access_token,
          ig_user_id: account.ig_user_id,
          image_url: post.image_url,
          caption: post.caption,
        });
        postId = r.post_id;
      } else if (post.platform === "meta_ads") {
        const r = await publishToMetaAds({
          access_token: account.access_token,
          ad_account_id: account.ad_account_id,
          image_url: post.image_url,
          caption: post.caption,
          campaign_name: post.project_title,
        });
        postId = r.post_id;
      } else {
        toast.info(
          `For ${post.platform}, complete the final publish step in the platform dashboard.`,
        );
      }
      savePublishedPost({
        ...post,
        status: "published",
        published_at: new Date().toISOString(),
        scheduled_at: null,
        post_id: postId || null,
      });
      reload();
      toast.success(`Published to ${post.platform}!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPublishingNow(null);
    }
  };

  const handleRefreshStats = async (post) => {
    setRefreshing(post.id);
    try {
      let newStats = null;
      if (
        post.platform === "facebook" &&
        integrationsMap.facebook &&
        post.post_id
      ) {
        newStats = await getFacebookPostStats({
          access_token: integrationsMap.facebook.access_token,
          post_id: post.post_id,
        });
      } else if (
        post.platform === "instagram" &&
        integrationsMap.instagram &&
        post.post_id
      ) {
        newStats = await getInstagramPostStats({
          access_token: integrationsMap.instagram.access_token,
          post_id: post.post_id,
        });
      }

      if (newStats) {
        const all = getPublishedPosts();
        const idx = all.findIndex((p) => p.id === post.id);
        if (idx >= 0) {
          all[idx].stats = {
            ...all[idx].stats,
            ...newStats,
            last_updated: new Date().toISOString(),
          };
          localStorage.setItem(
            "creativeklux_published_posts",
            JSON.stringify(all),
          );
          reload();
          toast.success("Stats refreshed from platform");
        }
      } else {
        toast.info(
          "Real-time stats are only available for connected Facebook/Instagram posts.",
        );
      }
    } catch (err) {
      toast.error(`Failed to refresh stats: ${err.message}`);
    } finally {
      setRefreshing(null);
    }
  };

  const hasConnections = Object.keys(integrationsMap).length > 0;

  const TAB_COUNTS = {
    all: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };

  return (
    <div className="pb-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
            {typeLabel} Publishing
          </h1>
          <p className="text-gray-500 text-sm">
            Track your {typeLabel.toLowerCase()} published and scheduled
            creatives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasConnections && (
            <button
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-surface text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
              onClick={() => mergeLiveIntoLocal(false)}
              disabled={fetchingLive}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-2 text-gray-500 ${fetchingLive ? "animate-spin" : ""}`}
              />
              {fetchingLive ? "Fetching…" : "Fetch Live Posts"}
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
            label="Total Impressions"
            value={posts
              .reduce((s, p) => s + (p.stats?.impressions || 0), 0)
              .toLocaleString()}
            Icon={Eye}
          />
        </div>
      )}

      {/* ── Status Tabs ── */}
      {posts.length > 0 && (
        <div className="flex items-center border-b border-gray-200 bg-surface rounded-t-xl px-2 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
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
                    : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                }
              >
                {TAB_COUNTS[tab.key]}
              </span>
            </button>
          ))}
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
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.cls}`}
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
                          {post.status === "scheduled" && (
                            <button
                              className="h-7 w-7 rounded-md flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-40"
                              onClick={() => handlePublishNow(post)}
                              disabled={publishingNow === post.id}
                              title="Publish now"
                            >
                              {publishingNow === post.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setEditingPost(post)}
                            title="Edit post"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {post.post_id && (
                            <button
                              className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
                              onClick={() => handleRefreshStats(post)}
                              disabled={refreshing === post.id}
                              title="Refresh stats"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${refreshing === post.id ? "animate-spin" : ""}`}
                              />
                            </button>
                          )}
                          <button
                            className="h-7 w-7 rounded-md flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => handleDelete(post)}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
              <div className="flex items-center gap-1">
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

      {editingPost && (
        <EditPostModal
          post={editingPost}
          integrations={integrations}
          integrationsMap={integrationsMap}
          onClose={() => setEditingPost(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
