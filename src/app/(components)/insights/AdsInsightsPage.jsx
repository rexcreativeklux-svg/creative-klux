"use client";

// app/(components)/insights/AdsInsightsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Ads Content's page: one ad network at a time (picked in the sidebar), laid
// out after the "Creative Klux Analytics" design's ad pages —
//
//   Header        network · account · campaigns · live · Export · Create
//   Tabs          that network's own (Campaigns, Ad sets / Ad groups / Ad
//                 squads, Ads, Keywords or Audience)
//   Toolbar       period (7 / 30 / 90 days — the API's range) · vs previous ·
//                 Synced (click to refresh)
//   Overview      KPI cards → growth & activity + audience → averages → what
//                 works → best performer + best time → share of spend ·
//                 prospecting vs retargeting · reading the period →
//                 everything the API returns → campaigns table
//
// REAL DATA ONLY, the same rules as the social page (see adsInsights.js):
// what the backend can't send yet keeps its place, saying what it needs.

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
  Info,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/context/AuthContext";
import {
  deleteAdCampaign,
  fetchLivePostsFromConnectedAccounts,
  getAdCampaignMetrics,
  loadStatsForRows,
  setAdCampaignStatus,
} from "@/(lib)/integration";
import { metricLabel } from "@/(lib)/postMetrics";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import ContentDetailsModal from "@/app/(components)/content/ContentDetailsModal";
import CreateAdComposer from "@/app/(components)/composer/CreateAdComposer";
import { AD_NETWORKS } from "@/app/(components)/content/socialPlatformScope";
import { PublishingSkeleton } from "@/app/(components)/skeletons/ContentSectionSkeletons";
import {
  adAverages,
  adFields,
  adKpis,
  adReadings,
  adWhatWorks,
  bestCampaign,
  isAdditive,
  objectiveLabel,
  spendShare,
} from "./adsInsights";
import { BRAND, BarRows, Card, KpiCard, KpiPlaceholder, NotAvailable, SERIES, ago, longDate, money, num, shortDate } from "./parts";

const DAY = 86_400_000;
const PERIODS = [7, 30, 90];

// Each network's tabs, as the design gives them.
const TABS = {
  meta_ads: ["overview", "campaigns", "adsets", "ads", "audience"],
  google_ads: ["overview", "campaigns", "adgroups", "ads", "keywords"],
  tiktok_ads: ["overview", "campaigns", "adgroups", "ads", "audience"],
  snapchat_ads: ["overview", "campaigns", "adsquads", "ads", "audience"],
  pinterest_ads: ["overview", "campaigns", "adgroups", "ads", "audience"],
};
const TAB_LABEL = {
  overview: "Overview",
  campaigns: "Campaigns",
  adsets: "Ad sets",
  adgroups: "Ad groups",
  adsquads: "Ad squads",
  ads: "Ads",
  keywords: "Keywords",
  audience: "Audience",
};
const MISSING = {
  adsets: "The backend lists campaigns only — not the ad sets inside them.",
  adgroups: "The backend lists campaigns only — not the ad groups inside them.",
  adsquads: "The backend lists campaigns only — not the ad squads inside them.",
  ads: "The backend lists campaigns only — not the individual ads and their creatives.",
  keywords: "Keyword performance needs the network's keyword report added to the backend.",
};

const isLive = (c) => /active|enabled|running|live/i.test(c.status || "");
const statusLabel = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ") : "Unknown");
const budgetOf = (c) =>
  c.daily_budget != null && c.daily_budget !== ""
    ? `${money(c.daily_budget)}/day`
    : c.lifetime_budget != null && c.lifetime_budget !== ""
      ? `${money(c.lifetime_budget)} total`
      : "—";
// A number as the backend sent it. `ctr` is shown raw: Google sends a
// fraction (0.19), so adding "%" would mislabel it — the CTR card works the
// rate out from clicks ÷ impressions instead.
const showMetric = (key, v) =>
  v === undefined
    ? undefined
    : ["spend", "cpc", "cpm", "cost_per_conversion"].includes(key)
      ? money(v)
      : key === "ctr"
        ? Number(v).toFixed(3)
        : num(v);

function StatusBadge({ status }) {
  const live = /active|enabled|running/i.test(status || "");
  const paused = /paused/i.test(status || "");
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
        live ? "border-emerald-200 bg-emerald-50 text-emerald-700" : paused ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600"
      }`}
    >
      {live ? "Running" : statusLabel(status)}
    </span>
  );
}

// ── Campaigns table ──────────────────────────────────────────────────────────

function CampaignsTable({ campaigns, loading, keys, onOpen, onToggle, onDelete, busyId }) {
  const [hidden, setHidden] = useState([]);
  const [sort, setSort] = useState({ key: "spend", dir: "desc" });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [colsOpen, setColsOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const columns = keys
    .filter((k) => !hidden.includes(k))
    .map((k) => ({ key: k, label: metricLabel(k) }));

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = campaigns.filter((c) => !q || `${c.project_title} ${c.objective}`.toLowerCase().includes(q));
    const get =
      sort.key === "created"
        ? (c) => new Date(c.created_at || 0).getTime()
        : (c) => c.cur?.[sort.key];
    return [...list].sort((a, b) => {
      const x = get(a) ?? -Infinity;
      const y = get(b) ?? -Infinity;
      return sort.dir === "desc" ? y - x : x - y;
    });
  }, [campaigns, query, sort]);

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));
  const sortIcon = (k) =>
    sort.key === k ? (sort.dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : null;

  const csv = () => {
    const head = ["Campaign", "Status", "Objective", "Created", "Budget", ...columns.map((c) => c.label)];
    const lines = rows.map((c) =>
      [c.project_title, statusLabel(c.status), c.objective || "", c.created_at ? longDate(new Date(c.created_at)) : "", budgetOf(c), ...columns.map((col) => c.cur?.[col.key] ?? "")]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "campaigns.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const picked = campaigns.filter((c) => selected.includes(c.id));

  return (
    <Card
      title="Campaigns"
      sub="Click a column to sort · click a campaign to open it"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns"
              aria-label="Search campaigns"
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
                {keys.map((k) => {
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
                      {metricLabel(k)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            id="ck-ads-export"
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
              <div className="absolute right-0 top-full z-20 mt-1.5 w-56 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setBulkOpen(false);
                    onToggle(picked.filter(isLive), "PAUSED", () => setSelected([]));
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
                >
                  <Pause className="h-3.5 w-3.5" /> Pause {picked.filter(isLive).length} running
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkOpen(false);
                    onDelete(picked, () => setSelected([]));
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete {picked.length} campaign{picked.length === 1 ? "" : "s"}
                </button>
              </div>
            )}
          </div>
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-gray-500">No campaigns.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all campaigns"
                    checked={selected.length > 0 && selected.length === rows.length}
                    onChange={(e) => setSelected(e.target.checked ? rows.map((c) => c.id) : [])}
                    className="h-3.5 w-3.5 cursor-pointer accent-[#003dda]"
                  />
                </th>
                <th className="px-2 py-2.5 text-left">
                  <button type="button" onClick={() => toggleSort("created")} className="flex cursor-pointer items-center gap-1 uppercase">
                    Campaign {sortIcon("created")}
                  </button>
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right">Budget</th>
                {columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-3 py-2.5 text-right">
                    <button type="button" onClick={() => toggleSort(c.key)} className="ml-auto flex cursor-pointer items-center gap-1 uppercase">
                      {c.label} {sortIcon(c.key)}
                    </button>
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} onClick={() => onOpen(c)} className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-blue-50/40">
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label="Select campaign"
                      checked={selected.includes(c.id)}
                      onChange={(e) => setSelected((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))}
                      className="h-3.5 w-3.5 cursor-pointer accent-[#003dda]"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex min-w-60 items-center gap-3">
                      {c.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image_url} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-gray-200 object-cover" />
                      ) : (
                        <span className="h-11 w-11 shrink-0 rounded-lg bg-gray-100" />
                      )}
                      <div className="min-w-0">
                        <p className="line-clamp-2 max-w-64 text-[13px] font-semibold leading-snug text-gray-900">{c.project_title}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                          {c.objective && (
                            <span className="rounded-md border border-gray-200 px-1.5 py-0.5 font-medium text-gray-600">{objectiveLabel(c.objective)}</span>
                          )}
                          <StatusBadge status={c.status} />
                          {c.created_at && shortDate(new Date(c.created_at).getTime())}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-gray-700">{budgetOf(c)}</td>
                  {columns.map((col) => {
                    const v = showMetric(col.key, c.cur?.[col.key]);
                    return (
                      <td key={col.key} className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-gray-800">
                        {v !== undefined ? v : loading && !c.stats ? <Loader2 className="ml-auto h-3 w-3 animate-spin text-gray-300" /> : <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onToggle([c], isLive(c) ? "PAUSED" : "ACTIVE")}
                        disabled={busyId === c.id}
                        title={isLive(c) ? "Pause" : "Resume — starts spending"}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
                      >
                        {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isLive(c) ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete([c])}
                        title="Delete"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
        Showing {rows.length} of {campaigns.length} campaigns · figures cover the selected period
      </p>
    </Card>
  );
}

// ── The page ─────────────────────────────────────────────────────────────────

export default function AdsInsightsPage({ platform }) {
  const network = AD_NETWORKS.find((n) => n.id === platform);
  const { fetchIntegrations, activeBrandId } = useAuth();

  const [integrations, setIntegrations] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loadedKey, setLoadedKey] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [syncedAt, setSyncedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, tick] = useState(0);

  const tabs = TABS[platform] || ["overview", "campaigns", "audience"];
  const [tab, setTab] = useState("overview");
  const activeTab = tabs.includes(tab) ? tab : "overview";
  const [days, setDays] = useState(30);
  const [periodOpen, setPeriodOpen] = useState(false);
  // The previous period comes from asking for 2N days — the API goes to 90.
  const hasPrev = days * 2 <= 90;

  const [openCampaign, setOpenCampaign] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [pendingResume, setPendingResume] = useState(null); // { list, done }
  const [pendingDelete, setPendingDelete] = useState(null); // { list, done }
  const [working, setWorking] = useState(false);
  // The Create campaign flow (Metricool's).
  const [creating, setCreating] = useState(false);

  const key = `${activeBrandId ?? ""}|${platform}|${days}`;
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
          setCampaigns([]);
          return;
        }
        const rows = await fetchLivePostsFromConnectedAccounts(mine, { fresh });
        if (latest.current !== k) return;
        const list = rows.filter((r) => r.type === "ad" && r.platform === platform);
        setCampaigns(list);
        setListError(rows.errorsByPlatform?.[platform] || null);
        setSyncedAt(Date.now());
        setLoadedKey(k);
        if (!list.length) return;

        setStatsLoading(true);
        const { stats, errors } = await loadStatsForRows(list, async (c) => {
          const cur = await getAdCampaignMetrics({ platform, campaign_id: c.post_id, days, fresh });
          let prev;
          if (hasPrev) {
            const both = await getAdCampaignMetrics({ platform, campaign_id: c.post_id, days: days * 2, fresh });
            prev = {};
            for (const [m, v] of Object.entries(both.metrics))
              if (isAdditive(m) && typeof cur.metrics[m] === "number") prev[m] = Math.max(0, v - cur.metrics[m]);
          }
          return { cur: cur.metrics, prev, returned: cur.returned };
        });
        if (latest.current !== k) return;
        setCampaigns((current) =>
          current.map((c) => (stats[c.id] ? { ...c, ...stats[c.id], stats: stats[c.id] } : c)),
        );
        Object.values(errors).forEach((m) => toast.error(`${network?.label || platform}: ${m}`));
      } catch (err) {
        toast.error(err.message || "Couldn't load campaigns");
      } finally {
        setStatsLoading(false);
        setRefreshing(false);
        setLoadedKey(k);
      }
    },
    [key, platform, days, hasPrev, fetchIntegrations, network],
  );

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

  const withStats = campaigns.filter((c) => c.cur);
  const data = useMemo(
    () => ({
      kpis: adKpis(withStats, platform, hasPrev),
      averages: adAverages(withStats, days),
      works: adWhatWorks(withStats),
      best: bestCampaign(withStats),
      share: spendShare(withStats),
      readings: adReadings(withStats, days, hasPrev),
      fields: adFields(withStats),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaigns, platform, hasPrev, days],
  );
  const metricKeys = useMemo(() => {
    const keys = [];
    for (const c of withStats) for (const k of c.returned || []) if (!keys.includes(k) && withStats.some((x) => typeof x.cur?.[k] === "number")) keys.push(k);
    return keys;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns]);

  const account = integrations?.find((i) => i.platform === platform);
  const accountName = account?.int_name || account?.account_label;
  const live = campaigns.filter(isLive).length;

  // Pause goes straight through; resume spends money, so it asks first.
  const toggle = async (list, status, done) => {
    if (!list.length) return;
    if (status === "ACTIVE" && !pendingResume) {
      setPendingResume({ list, done });
      return;
    }
    setWorking(true);
    for (const c of list) {
      setBusyId(c.id);
      try {
        await setAdCampaignStatus({ platform: c.platform, campaign_id: c.post_id, status });
      } catch (err) {
        toast.error(`“${c.project_title}”: ${err.message}`);
      }
    }
    setBusyId(null);
    setWorking(false);
    setPendingResume(null);
    done?.();
    toast.success(status === "ACTIVE" ? "Resumed" : "Paused");
    load({ fresh: true });
  };

  const removeCampaigns = async () => {
    if (!pendingDelete) return;
    setWorking(true);
    let ok = 0;
    for (const c of pendingDelete.list) {
      try {
        await deleteAdCampaign({ platform: c.platform, campaign_id: c.post_id });
        ok++;
      } catch (err) {
        toast.error(`“${c.project_title}”: ${err.message}`);
      }
    }
    if (ok) toast.success(`${ok} campaign${ok === 1 ? "" : "s"} deleted`);
    pendingDelete.done?.();
    setPendingDelete(null);
    setWorking(false);
    load({ fresh: true });
  };

  if (!network) return null;
  if (loadedKey !== key && !campaigns.length) return <PublishingSkeleton />;

  const connected = integrations?.some((i) => i.platform === platform);
  // The period ends at the last sync (the numbers on screen are as of then).
  const periodLabel = syncedAt
    ? `${shortDate(syncedAt - (days - 1) * DAY)} – ${longDate(syncedAt)}`
    : `Last ${days} days`;

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
            {[accountName, `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`, `${live} running`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => document.getElementById("ck-ads-export")?.click()}
            disabled={!campaigns.length}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-surface px-4 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
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
          <p className="mt-1 text-sm text-gray-500">Connect it from “More connections” in the sidebar to see its campaigns here.</p>
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
                {periodLabel}
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
                      Last {d} days {d === days && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                  <p className="px-2.5 pb-1 pt-1.5 text-[11px] text-gray-400">The ads API reports up to 90 days.</p>
                </div>
              )}
            </div>
            {hasPrev && (
              <span
                className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-50 px-3 text-[13px] font-semibold text-[#003dda]"
                title="The same campaigns over the period before this one"
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

          <div className="mt-4 space-y-4">
            {activeTab === "overview" && (
              <AdsOverview
                network={network}
                data={data}
                days={days}
                campaigns={withStats}
                statsLoading={statsLoading}
                onOpen={(c) => {
                  setOpenCampaign(c);
                  setPanelOpen(true);
                }}
              />
            )}
            {["overview", "campaigns"].includes(activeTab) && (
              <CampaignsTable
                campaigns={campaigns}
                loading={statsLoading}
                keys={metricKeys}
                busyId={busyId}
                onOpen={(c) => {
                  setOpenCampaign(c);
                  setPanelOpen(true);
                }}
                onToggle={toggle}
                onDelete={(list, done) => setPendingDelete({ list, done })}
              />
            )}
            {MISSING[activeTab] && (
              <Card title={TAB_LABEL[activeTab]} sub={`Your ${network.label} ${TAB_LABEL[activeTab].toLowerCase()}`}>
                <div className="p-4">
                  <NotAvailable>{MISSING[activeTab]}</NotAvailable>
                </div>
              </Card>
            )}
            {activeTab === "audience" && <AdsAudience network={network} big />}
          </div>
        </>
      )}

      {/* One campaign, its numbers under the backend's names. */}
      {(() => {
        const c = openCampaign && (campaigns.find((x) => x.id === openCampaign.id) || openCampaign);
        if (!c) return null;
        return (
          <ContentDetailsModal
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
            item={c}
            title="Campaign details"
            platformLabel={network.label}
            badge={<StatusBadge status={c.status} />}
            dateLabel={c.created_at ? `Created ${longDate(new Date(c.created_at))} · last ${days} days` : `Last ${days} days`}
            statsLoading={statsLoading && !c.cur}
            metrics={[
              { label: "Budget", value: budgetOf(c) },
              ...metricKeys.map((k) => ({ label: metricLabel(k), value: showMetric(k, c.cur?.[k]) })),
            ]}
          />
        );
      })()}

      <CreateAdComposer
        isOpen={creating}
        onClose={() => setCreating(false)}
        onCreated={() => load({ fresh: true })}
        initialPlatform={platform}
        connected={(integrations || []).map((i) => i.platform).filter((p) => AD_NETWORKS.some((n) => n.id === p))}
      />

      <ConfirmDialog
        open={!!pendingResume}
        title={`Resume ${pendingResume?.list.length === 1 ? "this campaign" : `${pendingResume?.list.length} campaigns`}?`}
        message={`${pendingResume?.list.map((c) => `“${c.project_title}”`).join(", ")} will go live on ${network.label} and start spending its budget.`}
        confirmLabel={working ? "Resuming…" : "Resume"}
        busy={working}
        onConfirm={() => toggle(pendingResume.list, "ACTIVE", pendingResume.done)}
        onCancel={() => setPendingResume(null)}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete ${pendingDelete?.list.length === 1 ? "this campaign" : `${pendingDelete?.list.length} campaigns`}?`}
        message={`They'll be deleted from ${network.label}. This can't be undone.`}
        confirmLabel={working ? "Deleting…" : "Delete"}
        variant="danger"
        busy={working}
        onConfirm={removeCampaigns}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function AdsAudience({ network, big = false }) {
  return (
    <Card title={big ? "Who sees these ads" : "Audience"} sub={big ? "Age, gender, country, placement and device" : "Where your ads are seen"} className="h-full">
      <div className="p-4">
        <NotAvailable>
          The backend doesn&apos;t send {network.label} breakdowns yet (age, gender, country, placement). It needs the
          network&apos;s breakdown report added to the backend.
        </NotAvailable>
      </div>
    </Card>
  );
}

function AdsOverview({ network, data, days, campaigns, statsLoading, onOpen }) {
  const { kpis: cards, averages: avgs, works, best, share, readings: notes, fields } = data;
  const spendBars = campaigns
    .filter((c) => c.cur?.spend)
    .sort((a, b) => b.cur.spend - a.cur.spend)
    .slice(0, 8)
    .map((c) => ({ name: c.project_title.length > 16 ? `${c.project_title.slice(0, 15)}…` : c.project_title, spend: c.cur.spend }));

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statsLoading && !campaigns.length
          ? Array.from({ length: 6 }, (_, i) => <KpiPlaceholder key={i} />)
          : cards.map((c) => <KpiCard key={c.id} card={c} loading={statsLoading} />)}
      </div>

      {/* Growth and activity + Audience */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card title="Growth and activity" sub={`Spend by campaign over the last ${days} days`}>
          <div className="h-64 px-2 pb-2 pt-4">
            {spendBars.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendBars} margin={{ top: 6, right: 12, left: -4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#737f91" }} tickLine={false} axisLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: "#737f91" }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e3e7ef", fontSize: 12 }} formatter={(v) => money(v)} />
                  <Bar dataKey="spend" name="Spend" fill={BRAND} radius={[4, 4, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
                {statsLoading ? "Loading…" : `No campaign spent anything in the last ${days} days.`}
              </p>
            )}
          </div>
          <div className="border-t border-gray-100 px-4 py-2.5">
            <NotAvailable compact>Day-by-day spend and results need the backend to return a daily breakdown.</NotAvailable>
          </div>
        </Card>
        <AdsAudience network={network} />
      </div>

      {avgs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {avgs.map((a) => (
            <div key={a.label} className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xl font-bold text-gray-900">
                {a.format === "money" ? money(a.value) : a.format === "pct" ? `${a.value.toFixed(2)}%` : a.value.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">{a.label}</p>
            </div>
          ))}
        </div>
      )}

      <Card
        title="What works for this brand"
        sub="Your campaigns grouped by what they were — click-through rate for each group"
        action={<span className="hidden rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#003dda] sm:block">From your own campaigns</span>}
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
                  <BarRows rows={g.rows} format={(v) => `${v.toFixed(2)}%`} />
                  <p className="text-right text-lg font-bold text-emerald-700">{g.lift !== undefined ? `+${Math.round(g.lift)}%` : ""}</p>
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card title="Best performer" sub="By click-through rate this period">
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
                <p className="line-clamp-2 text-base font-semibold text-gray-900">{best.project_title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {[statusLabel(best.status), best.objective && objectiveLabel(best.objective), budgetOf(best)].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    ["Spend", best.cur.spend !== undefined ? money(best.cur.spend) : undefined],
                    ["Clicks", best.cur.clicks !== undefined ? num(best.cur.clicks) : undefined],
                    ["CTR", best.cur.impressions ? `${(((best.cur.clicks || 0) / best.cur.impressions) * 100).toFixed(2)}%` : undefined],
                    ["Cost/result", best.cur.conversions ? money(best.cur.spend / best.cur.conversions) : undefined],
                  ]
                    .filter(([, v]) => v !== undefined)
                    .map(([l, v]) => (
                      <div key={l}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{l}</p>
                        <p className="text-lg font-bold text-gray-900">{v}</p>
                      </div>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => onOpen(best)}
                  className="mt-4 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  View campaign
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <NotAvailable>{statsLoading ? "Waiting for the numbers…" : `No campaign was shown in the last ${days} days.`}</NotAvailable>
            </div>
          )}
        </Card>
        <Card title="Best time to post" sub="Your own results, not a generic chart">
          <div className="p-4">
            <NotAvailable>Needs an hour-by-day breakdown from the {network.label} report — the backend returns one total per campaign.</NotAvailable>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Objective" sub="Share of spend">
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
              <NotAvailable>No spend in this period.</NotAvailable>
            </div>
          )}
        </Card>
        <Card title="Prospecting vs retargeting" sub="Share of spend">
          <div className="p-4">
            <NotAvailable>Needs each campaign&apos;s audience type — the backend doesn&apos;t return targeting.</NotAvailable>
          </div>
        </Card>
        <Card title="Reading the period" sub="Worked out from the campaigns below">
          {notes.length ? (
            <ol className="divide-y divide-gray-100">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-3 px-4 py-3 text-[13px] leading-relaxed text-gray-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: SERIES[i % SERIES.length] }}>
                    {i + 1}
                  </span>
                  {n}
                </li>
              ))}
            </ol>
          ) : (
            <div className="p-4">
              <NotAvailable>{statsLoading ? "Waiting for the numbers…" : "Nothing stands out in this period yet."}</NotAvailable>
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Everything this API returns"
        sub={`${fields.length} field${fields.length === 1 ? "" : "s"} for ${network.label}, as the backend names them`}
        action={<span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Live from your account</span>}
      >
        <div className="grid gap-x-8 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Per campaign</p>
            {fields.length ? (
              fields.map((f) => (
                <div key={f.key} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span>
                    <span className="block text-[13px] font-medium text-gray-900">{metricLabel(f.key)}</span>
                    <code className="text-[11px] text-gray-400">{f.key}</code>
                  </span>
                  <span className={`text-[13px] tabular-nums ${f.empty ? "text-gray-400" : "font-semibold text-gray-900"}`}>
                    {f.empty
                      ? "returned empty"
                      : ["spend", "cpc"].includes(f.key)
                        ? money(f.value)
                        : f.additive
                          ? num(f.value)
                          : Number(f.value).toFixed(3)}
                  </span>
                </div>
              ))
            ) : (
              <NotAvailable compact>{statsLoading ? "Loading…" : "No numbers came back for these campaigns."}</NotAvailable>
            )}
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Campaign list</p>
            {["name", "status", "objective", "created_time", "thumbnail", "daily_budget"].map((k) => (
              <div key={k} className="py-1.5">
                <code className="text-[12px] text-gray-600">{k}</code>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Not returned yet</p>
            <NotAvailable compact>Ad sets and ads, daily rows, breakdowns (age, gender, country, placement), quality rankings and pixel actions.</NotAvailable>
          </div>
        </div>
        <p className="flex items-center gap-1.5 border-t border-gray-100 px-4 py-2.5 text-[11px] text-gray-500">
          <Info className="h-3.5 w-3.5" /> Totals over the last {days} days; rates (ctr, cpc) are averaged across campaigns. Money is in the ad account&apos;s currency.
        </p>
      </Card>
    </>
  );
}
