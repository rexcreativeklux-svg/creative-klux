"use client";

// app/(components)/insights/NetworkInsightsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Social Content's page: one network at a time (picked in the sidebar), laid
// out after the "Creative Klux Analytics" design —
//
//   Header        network · account · posts in the period · Export · Create
//   Tabs          that network's own (Overview, Posts, Reels…; Videos for TikTok)
//   Toolbar       period · "vs previous period" · Synced (click to refresh)
//   Overview      KPI cards with sparklines → growth & activity + audience →
//                 per-post averages → what works → best performer + best time →
//                 format · organic vs promoted · reading the period →
//                 everything the API returns → posts table
//
// REAL DATA ONLY. Every figure comes from the backend's posts and their
// metrics (see networkInsights.js). A section the backend can't fill yet —
// followers, audience, organic vs promoted, design attributes, stories,
// competitors — keeps its place with a "not available yet" state saying what
// it needs, rather than a sample number.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Columns3,
  Download,
  ExternalLink,
  Info,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import {
  POST_STATS_PLATFORMS,
  carryStats,
  deletePostFromPlatform,
  fetchLivePostsFromConnectedAccounts,
  getPostStats,
  loadStatsForRows,
  platformSupportsDelete,
} from "@/(lib)/integration";
import { formatMetric, metricKeysOf, metricLabel, numeric, postMetrics } from "@/(lib)/postMetrics";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import CreatePostComposer from "@/app/(components)/composer/CreatePostComposer";
import PostInsightsPanel from "@/app/(components)/content/PostInsightsPanel";
import { SOCIAL_NETWORKS } from "@/app/(components)/content/socialPlatformScope";
import { PublishingSkeleton } from "@/app/(components)/skeletons/ContentSectionSkeletons";
import {
  HOUR_ROWS,
  activity,
  averages,
  bestPerformer,
  bestTimes,
  engagementOf,
  formatOf,
  formatShare,
  interactionsOf,
  kpis,
  periodDays,
  periods,
  readings,
  returnedFields,
  roleValue,
  whatWorks,
  within,
} from "./networkInsights";
import { BRAND, Card, KpiCard, KpiPlaceholder, NotAvailable, SERIES, ago, longDate, num, shortDate } from "./parts";


// Each network's tabs, as the design gives them.
const TABS = {
  facebook: ["overview", "posts", "reels", "stories", "audience", "competitors"],
  instagram: ["overview", "posts", "reels", "stories", "audience", "competitors"],
  tiktok: ["overview", "videos", "audience"],
  youtube: ["overview", "videos", "audience"],
  pinterest: ["overview", "pins", "audience"],
  twitter: ["overview", "posts", "audience"],
  linkedin: ["overview", "posts", "audience"],
};
const TAB_LABEL = {
  overview: "Overview",
  posts: "Posts",
  reels: "Reels",
  videos: "Videos",
  pins: "Pins",
  stories: "Stories",
  audience: "Audience",
  competitors: "Competitors",
};
const PERIODS = [7, 30, 90, 365, "all"];

// ── Formatting ───────────────────────────────────────────────────────────────

const postDate = (p) =>
  new Date(p.published_at || p.scheduled_at || 0).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
// ── Posts table ──────────────────────────────────────────────────────────────

function PostsTable({ title = "Posts", posts, statsLoading, onOpen, onDelete, platform }) {
  const keys = useMemo(() => metricKeysOf(posts), [posts]);
  const [hidden, setHidden] = useState([]);
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [colsOpen, setColsOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const canDelete = platformSupportsDelete(platform);

  const columns = [
    ...keys.map((k) => ({ key: k, label: metricLabel(k), get: (p) => numeric(postMetrics(p)?.[k]), show: (p) => formatMetric(k, postMetrics(p)?.[k]) })),
    { key: "engagement", label: "Engagement", get: engagementOf, show: (p) => (engagementOf(p) === undefined ? undefined : `${engagementOf(p).toFixed(1)}%`) },
  ].filter((c) => !hidden.includes(c.key));

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = posts.filter((p) => !q || `${p.project_title} ${p.caption}`.toLowerCase().includes(q));
    const get =
      sort.key === "date"
        ? (p) => new Date(p.published_at || p.scheduled_at || 0).getTime()
        : sort.key === "engagement"
          ? engagementOf
          : (p) => numeric(postMetrics(p)?.[sort.key]);
    return [...list].sort((a, b) => {
      const x = get(a) ?? -Infinity;
      const y = get(b) ?? -Infinity;
      return sort.dir === "desc" ? y - x : x - y;
    });
  }, [posts, query, sort]);

  const toggleSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  const csv = () => {
    const head = ["Post", "Date", "Format", ...columns.map((c) => c.label), "Link"];
    const lines = rows.map((p) =>
      [p.project_title || p.caption || "", postDate(p), formatOf(p), ...columns.map((c) => c.show(p) ?? ""), p.permalink_url || ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${platform}-posts.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const sortIcon = (k) =>
    sort.key === k ? (sort.dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : null;

  return (
    <Card
      title={title}
      sub="Click a column to sort · click a post to open it"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts"
              aria-label="Search posts"
              className="h-8 w-44 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-2 text-xs text-gray-800 outline-none focus:border-[#003dda]"
            />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setColsOpen((o) => !o)}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Columns3 className="h-3.5 w-3.5" /> Columns
            </button>
            {colsOpen && (
              <div className="absolute right-0 top-full z-20 mt-1.5 w-52 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-xl">
                {[...keys, "engagement"].map((k) => {
                  const on = !hidden.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setHidden((h) => (on ? [...h, k] : h.filter((x) => x !== k)))}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${on ? "border-[#003dda] bg-[#003dda] text-white" : "border-gray-300"}`}>
                        {on && <Check className="h-3 w-3" />}
                      </span>
                      {k === "engagement" ? "Engagement" : metricLabel(k)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={csv}
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" /> Download CSV
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setBulkOpen((o) => !o)}
              disabled={!selected.length}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Bulk actions{selected.length ? ` (${selected.length})` : ""} <ChevronDown className="h-3 w-3" />
            </button>
            {bulkOpen && selected.length > 0 && (
              <div className="absolute right-0 top-full z-20 mt-1.5 w-52 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-xl">
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      setBulkOpen(false);
                      onDelete(posts.filter((p) => selected.includes(p.id)), () => setSelected([]));
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete {selected.length} post{selected.length === 1 ? "" : "s"}
                  </button>
                ) : (
                  <p className="px-2.5 py-1.5 text-xs text-gray-500">This network&apos;s posts can&apos;t be deleted from here.</p>
                )}
              </div>
            )}
          </div>
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-gray-500">No posts in this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all posts"
                    checked={selected.length > 0 && selected.length === rows.length}
                    onChange={(e) => setSelected(e.target.checked ? rows.map((p) => p.id) : [])}
                    className="h-3.5 w-3.5 cursor-pointer accent-[#003dda]"
                  />
                </th>
                <th className="px-2 py-2.5 text-left">
                  <button type="button" onClick={() => toggleSort("date")} className="flex cursor-pointer items-center gap-1 uppercase">
                    Post {sortIcon("date")}
                  </button>
                </th>
                {columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-3 py-2.5 text-right">
                    <button type="button" onClick={() => toggleSort(c.key)} className="ml-auto flex cursor-pointer items-center gap-1 uppercase">
                      {c.label} {sortIcon(c.key)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const loadingRow = statsLoading && !p.stats?.last_updated && POST_STATS_PLATFORMS.includes(p.platform);
                return (
                  <tr key={p.id} onClick={() => onOpen(p)} className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-blue-50/40">
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Select post"
                        checked={selected.includes(p.id)}
                        onChange={(e) =>
                          setSelected((s) => (e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id)))
                        }
                        className="h-3.5 w-3.5 cursor-pointer accent-[#003dda]"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex min-w-60 items-center gap-3">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-gray-200 object-cover" />
                        ) : (
                          <span className="h-11 w-11 shrink-0 rounded-lg bg-gray-100" />
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-2 max-w-64 text-[13px] font-semibold leading-snug text-gray-900">
                            {p.project_title || p.caption || "Untitled"}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                            <span className="rounded-md border border-gray-200 px-1.5 py-0.5 font-medium text-gray-600">{formatOf(p)}</span>
                            {postDate(p)}
                          </p>
                        </div>
                      </div>
                    </td>
                    {columns.map((c) => {
                      const v = c.show(p);
                      return (
                        <td key={c.key} className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-gray-800">
                          {v !== undefined ? v : loadingRow ? <Loader2 className="ml-auto h-3 w-3 animate-spin text-gray-300" /> : <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
        Showing {rows.length} of {posts.length} posts
      </p>
    </Card>
  );
}

// ── The page ─────────────────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {string} props.platform  The network picked in the sidebar.
 */
export default function NetworkInsightsPage({ platform }) {
  const network = SOCIAL_NETWORKS.find((n) => n.id === platform);
  const { fetchIntegrations, activeBrandId } = useAuth();

  const [integrations, setIntegrations] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadedKey, setLoadedKey] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [syncedAt, setSyncedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, tick] = useState(0); // re-renders "Synced x min ago"

  const tabs = TABS[platform] || ["overview", "posts", "audience"];
  const [tab, setTab] = useState("overview");
  const activeTab = tabs.includes(tab) ? tab : "overview";
  const [days, setDays] = useState(30);
  const [periodOpen, setPeriodOpen] = useState(false);

  const [openPost, setOpenPost] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [composer, setComposer] = useState(null); // null | { media?, aiTopic? }
  const [pendingDelete, setPendingDelete] = useState(null); // { posts, done }
  const [deleting, setDeleting] = useState(false);

  const key = `${activeBrandId ?? ""}|${platform}`;
  const latest = useRef(key);
  useEffect(() => {
    latest.current = key;
  }, [key]);

  const load = useCallback(
    async ({ fresh = false } = {}) => {
      const k = key;
      setRefreshing(true);
      try {
        const ints = (await fetchIntegrations({ fresh })) || [];
        if (latest.current !== k) return;
        setIntegrations(ints);
        const mine = ints.filter((i) => i.platform === platform);
        if (!mine.length) {
          setPosts([]);
          return;
        }
        const rows = await fetchLivePostsFromConnectedAccounts(mine, { fresh });
        if (latest.current !== k) return;
        const social = rows.filter((p) => p.type === "social" && p.platform === platform);
        setPosts((prev) => carryStats(prev, social));
        setListError(rows.errorsByPlatform?.[platform] || null);
        setSyncedAt(Date.now());
        setLoadedKey(k);

        const targets = social.filter((p) => p.post_id && p.status === "published" && POST_STATS_PLATFORMS.includes(p.platform));
        if (!targets.length) return;
        setStatsLoading(true);
        const { stats, errors } = await loadStatsForRows(targets, (p) =>
          getPostStats({ platform: p.platform, post_id: p.post_id, brand_id: activeBrandId, fresh }),
        );
        if (latest.current !== k) return;
        setPosts((current) => current.map((p) => (stats[p.id] ? { ...p, stats: stats[p.id] } : p)));
        Object.values(errors).forEach((m) => toast.error(`${network?.label || platform} stats: ${m}`));
      } catch (err) {
        toast.error(err.message || "Couldn't load posts");
      } finally {
        setStatsLoading(false);
        setRefreshing(false);
        setLoadedKey(k);
      }
    },
    [key, platform, fetchIntegrations, activeBrandId, network],
  );

  // Load on arrival (and when the network or brand changes). Started on the
  // next tick, so the effect itself sets no state.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => !cancelled && load());
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // "All time" runs from the oldest post to today.
  const spanDays = useMemo(() => periodDays(posts, days), [posts, days]);
  const periodLabel = days === "all" ? "all time" : `the last ${days} days`;
  const period = useMemo(() => periods(spanDays), [spanDays]);
  const latestPost = posts.reduce((m, p) => Math.max(m, new Date(p.published_at || 0).getTime() || 0), 0);
  const inPeriod = useMemo(() => within(posts, period.from, period.to), [posts, period]);
  const data = useMemo(
    () => ({
      kpis: kpis(posts, period),
      activity: activity(posts, period),
      averages: averages(posts, period),
      works: whatWorks(posts, period),
      best: bestPerformer(posts, period),
      times: bestTimes(posts, period),
      share: formatShare(posts, period),
      readings: readings(posts, period),
      fields: returnedFields(posts, period),
    }),
    [posts, period],
  );

  const account = integrations?.find((i) => i.platform === platform);
  const accountName = account?.int_name || account?.account_label;
  const videos = inPeriod.filter((p) => formatOf(p) === "Video").length;

  const removePosts = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    let done = 0;
    for (const p of pendingDelete.posts) {
      try {
        await deletePostFromPlatform(p, activeBrandId);
        done++;
      } catch (err) {
        toast.error(`Couldn't delete “${p.project_title || "post"}”: ${err.message}`);
      }
    }
    if (done) toast.success(`${done} post${done === 1 ? "" : "s"} deleted`);
    pendingDelete.done?.();
    setPendingDelete(null);
    setDeleting(false);
    load({ fresh: true });
  };

  const openPostPanel = (p) => {
    setOpenPost(p);
    setPanelOpen(true);
  };

  if (!network) return null;
  if (loadedKey !== key && !posts.length) return <PublishingSkeleton />;

  const connected = integrations?.some((i) => i.platform === platform);
  const tableTitle = TAB_LABEL[activeTab === "overview" ? (tabs.includes("videos") ? "videos" : tabs.includes("pins") ? "pins" : "posts") : activeTab];

  return (
    <div className="pb-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-[26px] font-bold tracking-tight text-gray-900">
            <network.Icon className="h-6 w-6" style={{ color: network.color }} />
            {network.label}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {[
              accountName,
              `${inPeriod.length} post${inPeriod.length === 1 ? "" : "s"}`,
              videos && platform !== "tiktok" && platform !== "youtube" ? `${videos} video${videos === 1 ? "" : "s"}` : null,
              `in ${periodLabel}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => document.getElementById("ck-export-csv")?.click()}
            disabled={!inPeriod.length}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-surface px-4 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setComposer({})}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: BRAND }}
          >
            <Plus className="h-4 w-4" /> Create
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-gray-200 hide-scrollbar" aria-label={`${network.label} sections`}>
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-current={activeTab === t ? "page" : undefined}
            className={`-mb-px shrink-0 cursor-pointer border-b-2 px-3.5 py-2.5 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
              activeTab === t ? "border-[#003dda] text-[#003dda]" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>

      {!connected ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-surface p-14 text-center">
          <network.Icon className="mx-auto mb-3 h-10 w-10" style={{ color: network.color }} />
          <p className="font-semibold text-gray-900">{network.label} isn&apos;t connected</p>
          <p className="mt-1 text-sm text-gray-500">Connect it from “More connections” in the sidebar to see its posts here.</p>
        </div>
      ) : (
        <>
          {/* ── Toolbar ── */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setPeriodOpen((o) => !o)}
                className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-surface px-3 text-[13px] font-semibold text-gray-800 hover:bg-gray-50"
              >
                <CalendarDays className="h-4 w-4 text-gray-500" />
                {new Date(period.from).getFullYear() === new Date(period.to - 1).getFullYear()
                  ? shortDate(period.from)
                  : longDate(period.from)}{" "}
                – {longDate(period.to - 1)}
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {periodOpen && (
                <div className="absolute left-0 top-full z-20 mt-1.5 w-44 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-xl">
                  {PERIODS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDays(d);
                        setPeriodOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-gray-100 ${d === days ? "font-semibold text-[#003dda]" : "text-gray-700"}`}
                    >
                      {d === "all" ? "All time" : `Last ${d} days`} {d === days && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {days !== "all" && (
            <span
              className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-50 px-3 text-[13px] font-semibold text-[#003dda]"
              title="Changes compare this period's posts with the posts published in the period before it"
            >
              <TrendingUp className="h-4 w-4" /> vs previous {days} days
            </span>
            )}
            <button
              type="button"
              onClick={() => load({ fresh: true })}
              disabled={refreshing}
              title="Fetch the latest from the network"
              className="ml-auto flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-surface px-3 text-[13px] text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Syncing…" : syncedAt ? `Synced ${ago(syncedAt)}` : "Sync"}
            </button>
          </div>

          {listError && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="min-w-0 [overflow-wrap:anywhere]">
                <span className="font-semibold">{`${network.label} couldn't be read: `}</span>
                {listError}
              </p>
            </div>
          )}

          {/* Nothing in this period, but older posts exist — say where they are. */}
          {posts.length > 0 && inPeriod.length === 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <Info className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="flex-1">
                No posts in {periodLabel}. Your latest {network.label} post is from {longDate(latestPost)}.
              </span>
              <button
                type="button"
                onClick={() => setDays("all")}
                className="cursor-pointer rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-[#003dda] shadow-sm hover:bg-blue-100"
              >
                Show all time
              </button>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {activeTab === "overview" && (
              <Overview
                platform={platform}
                data={data}
                period={period}
                statsLoading={statsLoading}
                onOpen={openPostPanel}
                onCreateLike={(p) =>
                  setComposer({
                    media: p.image_url ? { url: p.image_url, type: "image" } : null,
                    aiTopic: `A post like this one: ${p.caption || p.project_title || ""}`.slice(0, 400),
                  })
                }
              />
            )}

            {["overview", "posts", "videos", "pins", "reels"].includes(activeTab) && (
              <PostsTable
                key={activeTab}
                title={tableTitle}
                platform={platform}
                posts={activeTab === "reels" ? inPeriod.filter((p) => formatOf(p) === "Video") : inPeriod}
                statsLoading={statsLoading}
                onOpen={openPostPanel}
                onDelete={(list, done) => setPendingDelete({ posts: list, done })}
              />
            )}

            {activeTab === "stories" && (
              <Card title="Stories" sub="What your stories reached">
                <div className="p-4">
                  <NotAvailable>The backend doesn&apos;t list stories yet — only published posts come back from {network.label}.</NotAvailable>
                </div>
              </Card>
            )}
            {activeTab === "audience" && <AudienceCard network={network} big />}
            {activeTab === "competitors" && (
              <Card title="Competitors" sub="How similar accounts are doing">
                <div className="p-4">
                  <NotAvailable>Needs a way to follow other public accounts — the backend only reads your own connected account.</NotAvailable>
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Hidden CSV trigger for the header's Export: the overview table's button. */}
      <button
        id="ck-export-csv"
        type="button"
        className="hidden"
        onClick={() => {
          const head = ["Post", "Date", "Format", "Link", ...metricKeysOf(inPeriod).map(metricLabel)];
          const keys = metricKeysOf(inPeriod);
          const lines = inPeriod.map((p) =>
            [p.project_title || p.caption || "", postDate(p), formatOf(p), p.permalink_url || "", ...keys.map((k) => formatMetric(k, postMetrics(p)?.[k]) ?? "")]
              .map((v) => `"${String(v).replace(/"/g, '""')}"`)
              .join(","),
          );
          const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${platform}-${days === "all" ? "all-time" : `${days}-days`}.csv`;
          a.click();
          URL.revokeObjectURL(a.href);
        }}
      />

      <PostInsightsPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        post={openPost && (posts.find((p) => p.id === openPost.id) || openPost)}
        allPosts={posts}
        statsLoading={statsLoading && !openPost?.stats?.last_updated}
        accountName={accountName}
      />

      <CreatePostComposer
        isOpen={!!composer}
        onClose={() => setComposer(null)}
        onPublished={() => load({ fresh: true })}
        initialPlatforms={[platform]}
        initialMedia={composer?.media || null}
        aiTopic={composer?.aiTopic || ""}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete ${pendingDelete?.posts.length === 1 ? "this post" : `${pendingDelete?.posts.length} posts`}?`}
        message={`They'll be deleted from ${network.label}. This can't be undone.`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        variant="danger"
        busy={deleting}
        onConfirm={removePosts}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────

function AudienceCard({ network, big = false }) {
  return (
    <Card title={big ? "Who follows this account" : "Audience"} sub={big ? "Country, age, gender and device" : "Where your followers are"} className="h-full">
      <div className="p-4">
        <NotAvailable>
          The backend doesn&apos;t send {network.label} audience data yet (countries, cities, age, gender). It needs the
          network&apos;s audience insights endpoint added to the backend.
        </NotAvailable>
      </div>
    </Card>
  );
}

function Overview({ platform, data, period, statsLoading, onOpen, onCreateLike }) {
  const network = SOCIAL_NETWORKS.find((n) => n.id === platform);
  const { kpis: cards, activity: days, averages: avgs, works, best, times, share, readings: notes, fields } = data;
  const hasViews = days.some((d) => d.views);

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {/* Until the numbers land, the cards they'll fill hold their places. */}
        {statsLoading &&
          cards.length === 1 &&
          Array.from({ length: 5 }, (_, i) => <KpiPlaceholder key={`wait-${i}`} />)}
        {cards.map((c) => (
          <KpiCard key={c.id} card={c} loading={statsLoading} />
        ))}
      </div>

      {/* Growth and activity + Audience */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card title="Growth and activity" sub={`What you published, and the views those posts got — by publish ${period.days > 62 ? "month" : "day"}`}>
          <div className="h-64 px-2 pb-2 pt-4">
            {days.some((d) => d.posts) ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={days} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#737f91" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis yAxisId="views" tick={{ fontSize: 11, fill: "#737f91" }} tickLine={false} axisLine={false} width={44} />
                  <YAxis yAxisId="posts" orientation="right" hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e3e7ef", fontSize: 12 }}
                    labelFormatter={(_, p) => p?.[0]?.payload?.date}
                  />
                  <Bar yAxisId="posts" dataKey="posts" name="Posts published" fill="#e0b25a" radius={[3, 3, 0, 0]} barSize={14} />
                  {hasViews && <Line yAxisId="views" dataKey="views" name="Views" stroke={BRAND} strokeWidth={2} dot={{ r: 2.5, fill: BRAND, strokeWidth: 0 }} type="linear" />}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-gray-500">No posts in this period.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 px-4 py-2.5 text-xs text-gray-600">
            <span className="flex items-center gap-1.5 text-gray-400" title="The backend doesn't send follower history yet">
              <span className="h-2 w-2 rounded-full bg-gray-300" /> Followers — not available yet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#e0b25a]" /> Posts published
            </span>
            {hasViews && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: BRAND }} /> Views
              </span>
            )}
          </div>
        </Card>
        <AudienceCard network={network} />
      </div>

      {/* Averages */}
      {avgs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {avgs.map((a) => (
            <div key={a.label} className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xl font-bold text-gray-900">{num(a.value, a.value < 100 ? 1 : 0)}</p>
              <p className="text-xs text-gray-500">{a.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* What works */}
      <Card
        title="What works for this brand"
        sub="Your posts grouped by what they were — and how each group performed"
        action={
          <span className="hidden rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#003dda] sm:block">
            From your own posts
          </span>
        }
      >
        <div className="divide-y divide-gray-100">
          {works.map((g) => (
            <div key={g.title} className="grid gap-3 px-4 py-4 md:grid-cols-[11rem_minmax(0,1fr)_6rem] md:items-center">
              <div>
                <p className="text-sm font-semibold text-gray-900">{g.title}</p>
                <p className="text-xs text-gray-500">{g.sub}</p>
              </div>
              {g.available ? (
                <>
                  <div className="space-y-1.5">
                    {g.rows.map((r, i) => {
                      const max = g.rows[0].value || 1;
                      return (
                        <div key={r.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-xs">
                          <span className="truncate text-gray-700" title={`${r.count} post${r.count === 1 ? "" : "s"}`}>
                            {r.label}
                          </span>
                          <span className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <span className="block h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: SERIES[i % SERIES.length] }} />
                          </span>
                          <span className="text-right font-semibold tabular-nums text-gray-900">
                            {g.metric === "engagement" ? `${r.value.toFixed(1)}%` : num(r.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-right text-lg font-bold text-emerald-700">
                    {g.lift !== undefined ? `+${Math.round(g.lift)}%` : ""}
                  </p>
                </>
              ) : (
                <div className="md:col-span-2">
                  <NotAvailable compact>{g.reason}</NotAvailable>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Best performer + best time */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card title="Best performer" sub={`By ${best && engagementOf(best) !== undefined ? "engagement rate" : "views"} this period`}>
          {best ? (
            <div className="flex flex-col gap-4 p-4 sm:flex-row">
              <button type="button" onClick={() => onOpen(best)} className="shrink-0 cursor-pointer">
                {best.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={best.image_url} alt="" className="h-32 w-32 rounded-xl border border-gray-200 object-cover" />
                ) : (
                  <span className="block h-32 w-32 rounded-xl bg-gray-100" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-base font-semibold text-gray-900">{best.project_title || best.caption}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {postDate(best)} · {formatOf(best)}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    ["Views", roleValue(best, "views")],
                    ["Reach", roleValue(best, "reach")],
                    ["Engagement", engagementOf(best) !== undefined ? `${engagementOf(best).toFixed(1)}%` : undefined],
                    ["Clicks", roleValue(best, "clicks")],
                    ["Interactions", interactionsOf(best)],
                  ]
                    .filter(([, v]) => v !== undefined)
                    .slice(0, 4)
                    .map(([l, v]) => (
                      <div key={l}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{l}</p>
                        <p className="text-lg font-bold text-gray-900">{typeof v === "number" ? num(v) : v}</p>
                      </div>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onCreateLike(best)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
                    style={{ background: BRAND }}
                  >
                    <Sparkles className="h-4 w-4" /> Create one like it
                  </button>
                  {best.permalink_url && (
                    <a
                      href={best.permalink_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-4 w-4" /> View on {network.label}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <NotAvailable>{statsLoading ? "Waiting for the numbers…" : "No post in this period has numbers to rank."}</NotAvailable>
            </div>
          )}
        </Card>

        <Card title="Best time to post" sub={`Your own results — average ${times.metric} per post`}>
          {times.posts ? (
            <div className="p-4">
              <div className="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] gap-1 text-center text-[11px]">
                <span />
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className="pb-1 font-semibold text-gray-500">{d}</span>
                ))}
                {times.grid.map((row, r) => (
                  <FragmentRow key={r} hour={HOUR_ROWS[r]} row={row} max={times.max} />
                ))}
              </div>
              <p className="mt-2.5 text-[11px] text-gray-500">From {times.posts} post{times.posts === 1 ? "" : "s"} this period · empty slots had no post.</p>
            </div>
          ) : (
            <div className="p-4">
              <NotAvailable>{statsLoading ? "Waiting for the numbers…" : "No post in this period has numbers yet."}</NotAvailable>
            </div>
          )}
        </Card>
      </div>

      {/* Format · Organic vs promoted · Reading the period */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Format" sub="Share of views">
          {share.length ? (
            <div className="p-4">
              <div className="relative mx-auto h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={share} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="100%" strokeWidth={0}>
                      {share.map((s, i) => (
                        <Cell key={s.name} fill={SERIES[i % SERIES.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{Math.round(share[0].share)}%</span>
                  <span className="text-xs text-gray-500">{share[0].name}</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-600">
                {share.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
                    {s.name} {Math.round(s.share)}%
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <NotAvailable>No views reported for this period.</NotAvailable>
            </div>
          )}
        </Card>
        <Card title="Organic vs promoted" sub="Share of views">
          <div className="p-4">
            <NotAvailable>Needs the network&apos;s paid / organic split — the backend sends one total per post.</NotAvailable>
          </div>
        </Card>
        <Card title="Reading the period" sub="Worked out from the posts below">
          {notes.length ? (
            <ol className="divide-y divide-gray-100">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-3 px-4 py-3 text-[13px] leading-relaxed text-gray-700">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                    style={{ background: SERIES[i % SERIES.length] }}
                  >
                    {i + 1}
                  </span>
                  {n}
                </li>
              ))}
            </ol>
          ) : (
            <div className="p-4">
              <NotAvailable>Not enough posts with numbers in this period to say anything yet.</NotAvailable>
            </div>
          )}
        </Card>
      </div>

      {/* What the API returned */}
      <Card
        title="Everything this API returns"
        sub={`${fields.length} metric${fields.length === 1 ? "" : "s"} for ${network.label}, as the backend names them`}
        action={
          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Live from your account</span>
        }
      >
        <div className="grid gap-x-8 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Per post</p>
            {fields.length ? (
              fields.map((f) => (
                <div key={f.key} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span>
                    <span className="block text-[13px] font-medium text-gray-900">{f.label}</span>
                    <code className="text-[11px] text-gray-400">{f.key}</code>
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums text-gray-900">{f.value}</span>
                </div>
              ))
            ) : (
              <NotAvailable compact>{statsLoading ? "Loading…" : `${network.label} sent no numbers for these posts.`}</NotAvailable>
            )}
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Account</p>
            <NotAvailable compact>Followers, page views and daily follows aren&apos;t sent by the backend yet.</NotAvailable>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Audience</p>
            <NotAvailable compact>Country, city and online-hours breakdowns aren&apos;t sent by the backend yet.</NotAvailable>
          </div>
        </div>
        <p className="flex items-center gap-1.5 border-t border-gray-100 px-4 py-2.5 text-[11px] text-gray-500">
          <Info className="h-3.5 w-3.5" /> Totals cover the posts published in this period; CTR is averaged.
        </p>
      </Card>
    </>
  );
}

/** One hour row of the best-time grid. */
function FragmentRow({ hour, row, max }) {
  return (
    <>
      <span className="flex items-center text-[11px] font-medium text-gray-500">{String(hour).padStart(2, "0")}</span>
      {row.map((v, c) => {
        const t = v === null || !max ? 0 : v / max;
        return (
          <span
            key={c}
            title={v === null ? "No post" : `${v.toLocaleString()} per post`}
            className={`flex h-9 items-center justify-center rounded-md text-[11px] font-semibold ${t > 0.55 ? "text-white" : "text-gray-700"}`}
            style={{ background: v === null ? "var(--color-gray-100)" : `rgba(0, 61, 218, ${0.12 + t * 0.78})` }}
          >
            {v === null ? "" : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
          </span>
        );
      })}
    </>
  );
}
