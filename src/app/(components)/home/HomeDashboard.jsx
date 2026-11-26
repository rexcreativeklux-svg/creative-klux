"use client";

// HomeDashboard — the "/" home page.
//
// NOTHING ON THIS PAGE IS HARDCODED. Every number comes from the backend
// (useHomeData); a section the backend can't fill yet is left off the page
// rather than shown with placeholder figures.
//
//   Live, from the brand's own data:
//     number cards        posts' interactions / views / engagement (the picked
//                         range vs the one before), ad conversions and cost
//                         per conversion
//     engagement chart    likes / comments / shares / views per day (per week
//                         past a month), by when each post went out, against
//                         the period before
//
//   The tab strip shows "All" and the connected social networks — five, the
//   rest under "More". The date picker sets the range (7 / 14 / 30 / 90 days).
//     ad campaigns table  creatives/campaigns + campaign-metrics (picked range)
//     best time to post   the brand's own posts over 90 days (bestTimes)
//     top posts           creatives/posts + post-metrics
//     Smart Inbox         smart-inbox/summary + conversations
//     follower growth     dashboard/followers (Facebook Pages + Instagram),
//     + by platform       saved once a day; growth needs 7 recorded days
//     waiting for         autopilot/posts (drafting + pending), approve one,
//     approval            approve all, or reject
//     Monday report       built from all of the above, downloadable as PDF
//
//   Left off until the backend has it: the AI action (scale / test / pause)
//   on each ad.
//
// The metric maths reuses insights/networkInsights.js — the same helpers the
// Social insights pages use, so Home and those pages agree.
// Styles live in homeDashboard.css, scoped under .ck-home.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  ChevronDown,
  Clock,
  Download,
  Eye,
  Flame,
  Heart,
  Inbox,
  MessageCircle,
  Repeat2,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import KluxLoader from "@/app/(components)/KluxLoader";
import { Menu } from "@/app/(components)/smart/shared";
import { useAuth } from "@/context/AuthContext";
import {
  HOUR_ROWS,
  bestTimes,
  engagementOf,
  interactionsOf,
  periods,
  roleValue,
  within,
} from "@/app/(components)/insights/networkInsights";
import useHomeData from "./useHomeData";
import { buildReport, downloadReportPdf } from "./mondayReport";
import "./homeDashboard.css";

const DAY = 86_400_000;

const fmtK = (n) =>
  n >= 1000
    ? (n / 1000).toFixed(n >= 10000 ? 1 : 2).replace(/\.?0+$/, "") + "k"
    : String(Math.round(n));
const count = (n) => (n === undefined || n === null ? "–" : fmtK(n));
/**
 * An amount EXACTLY as the backend sent it — no currency sign (the backend
 * returns no currency) and no conversion; only thousands separators added.
 * Missing (null / undefined) shows as "–".
 */
const amount = (n) =>
  n === undefined || n === null || Number.isNaN(Number(n))
    ? "–"
    : Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
/** A backend value shown as sent; null / undefined → "–". */
const raw = (v) => (v === undefined || v === null || v === "" ? "–" : typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: 4 }) : String(v));
const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
const sumBy = (rows, fn) =>
  rows.reduce((t, r) => {
    const v = fn(r);
    return typeof v === "number" && !Number.isNaN(v) ? (t ?? 0) + v : t;
  }, undefined);
const avgOf = (vals) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined);
const pctChange = (a, b) => (a !== undefined && b ? ((a - b) / b) * 100 : undefined);

// ── Networks ────────────────────────────────────────────────────────────────
const NETWORK = {
  instagram: ["Instagram", "#c13584"],
  facebook: ["Facebook", "#1877f2"],
  tiktok: ["TikTok", "#e5274f"],
  linkedin: ["LinkedIn", "#0a66c2"],
  whatsapp: ["WhatsApp", "#25d366"],
  x: ["X", "#0d0f14"],
  twitter: ["X", "#0d0f14"],
  youtube: ["YouTube", "#e62117"],
  pinterest: ["Pinterest", "#e60023"],
  meta_ads: ["Meta", "#1877f2"],
  google_ads: ["Google", "#4285f4"],
  tiktok_ads: ["TikTok", "#e5274f"],
  snapchat_ads: ["Snapchat", "#f7c600"],
  pinterest_ads: ["Pinterest", "#e60023"],
};
const networkName = (p) => NETWORK[p]?.[0] || p;

/** The ad network that goes with each social network's tab. */
const ADS_FOR = { facebook: "meta_ads", instagram: "meta_ads", tiktok: "tiktok_ads", pinterest: "pinterest_ads" };
/** Network tabs shown beside "All"; any further connected networks go under "More". */
const VISIBLE_TABS = 5;
/** The tab strip: "All", then one tab per connected social network. */
const platformTabs = (networks) => [
  { id: "All" },
  ...networks.map((social) => ({ id: networkName(social), social, ads: ADS_FOR[social] })),
];

/** The date picker's choices. Every number on the page covers the picked range. */
const RANGES = [7, 14, 30, 90].map((days) => ({ days, name: `Last ${days} days`, prev: `Previous ${days} days` }));

/**
 * The chart's points across a period: one per day up to a month, one per week
 * beyond (the last week may be short). `offset` shifts them back, for the
 * period before.
 */
function bucketsOf(period, offset = 0) {
  const size = period.days > 31 ? 7 : 1;
  return Array.from({ length: Math.ceil(period.days / size) }, (_, i) => {
    const start = period.from - offset + i * size * DAY;
    return { start, end: Math.min(period.to - offset, start + size * DAY), size };
  });
}
const inBucket = (list, b) => list.filter((p) => +new Date(p.published_at) >= b.start && +new Date(p.published_at) < b.end);

const AVATAR_TINTS = [
  ["#fde3cf", "#8a4b00"], ["#dbe4ff", "#1447e6"], ["#e6f6ee", "#0a7a48"],
  ["#f1e8fe", "#6d28d9"], ["#e0f2fe", "#075985"], ["#fde8ec", "#a3123a"],
];
const tintFor = (id) => AVATAR_TINTS[Math.abs(Number(id) || String(id).length) % AVATAR_TINTS.length];
const CAMPAIGN_PILL = { ACTIVE: ["pill-green", "Running"], ENABLED: ["pill-green", "Running"], PAUSED: ["pill-orange", "Paused"] };
const campaignPill = (status) =>
  CAMPAIGN_PILL[status] || ["", status ? status.toLowerCase().replace(/^\w/, (s) => s.toUpperCase()) : "Unknown"];
const STATUS_PILL = {
  needs: ["pill-red", "Needs you"],
  ai: ["pill-blue", "AI replied"],
  replied: ["", "You replied"],
  done: ["pill-green", "Done"],
};

const CHART_METRICS = ["Likes", "Comments", "Shares", "Views"];
const HEAT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOT_LABEL = { 6: "6a", 8: "8a", 10: "10a", 13: "1p", 17: "5p", 20: "8p" };

// ── Small pieces ────────────────────────────────────────────────────────────

function CardHead({ icon: Icon, color, title, sub, children, style }) {
  return (
    <div className="card-head" style={style}>
      <span className="ic" style={{ color }}>
        <Icon size={16} />
      </span>
      <div className="grow">
        <h2 className="h2">{title}</h2>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/** Loading / error / empty placeholder for a live section. */
function SectionNote({ children, action }) {
  return (
    <div className="note">
      <span>{children}</span>
      {action}
    </div>
  );
}

/** How many each list shows before its "See more". */
const TABLE_COUNT = 5;
const POSTS_COUNT = 6;
const APPROVALS_COUNT = 3;

// ── Followers ───────────────────────────────────────────────────────────────

/** Tabs the backend counts followers for → its platform filter. */
const FOLLOWER_TABS = { Facebook: "facebook", Instagram: "instagram" };

/**
 * Follower change over the picked range, from the saved daily counts when
 * they reach back that far; otherwise the backend's 7-day change (null until
 * 7 days are recorded). → {change, pct, days} — change undefined when unknown.
 */
function followerGrowth(data, days) {
  const daily = data?.daily || [];
  const first = daily[0];
  const latest = daily[daily.length - 1];
  if (days > 7 && first && latest && new Date(first.day) <= new Date(Date.now() - (days - 1) * DAY)) {
    const change = latest.followers - first.followers;
    return { change, pct: first.followers ? (change / first.followers) * 100 : undefined, days };
  }
  if (data?.change_7d == null) return { days: 7 };
  return { change: data.change_7d, pct: data.change_7d_pct ?? undefined, days: 7 };
}

/** The "Follower growth" number card. */
function followerKpi(followers, tab, rangeDays) {
  const k = { label: "Follower growth", color: "#1c64d6", tint: "#eef4fe", ring: "#d1e0fb", glyph: "+", loading: followers.loading };
  if (tab.social && !FOLLOWER_TABS[tab.id]) return { ...k, loading: false, value: "–", note: "Counted for Facebook and Instagram only" };
  if (followers.error) return { ...k, value: "–", note: followers.error };
  const f = followers.data;
  if (!f?.accounts?.length) return { ...k, value: "–", note: "Connect a Facebook Page or Instagram account" };
  const g = followerGrowth(f, rangeDays);
  const series = (f.daily || []).map((d) => d.followers);
  if (g.change === undefined) {
    return {
      ...k,
      value: fmtK(f.total ?? 0),
      note: `followers · growth shows after 7 days of tracking${f.tracking_since ? ` (since ${shortDate(f.tracking_since)})` : ""}`,
      series,
    };
  }
  return {
    ...k,
    value: `${g.change >= 0 ? "+" : "−"}${fmtK(Math.abs(g.change))}`,
    delta: g.pct === undefined ? null : `${g.pct >= 0 ? "+" : ""}${g.pct.toFixed(1)}% in ${g.days} days`,
    deltaBad: g.change < 0,
    note: `${fmtK(f.total ?? 0)} followers${g.days !== rangeDays ? " · only 7 days tracked so far" : ""}`,
    series,
  };
}

// ── Waiting for approval ────────────────────────────────────────────────────

const whenText = (iso) =>
  iso ? new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

/** "See more (6 of 23)" / "Show less" — only when there's more than is shown. */
function SeeMore({ shown, total, open, onToggle }) {
  if (!open && total <= shown) return null;
  return (
    <button className="btn btn-sm see-more" onClick={onToggle}>
      {open ? "Show less" : `See more (${shown} of ${total})`}
    </button>
  );
}

function Sparkline({ values, color }) {
  if (!values?.length || values.every((v) => !v)) return <span style={{ width: 56, height: 20 }} />;
  const max = Math.max(...values) || 1;
  const d = smoothPath(values.map((v, i) => [(i * 56) / Math.max(1, values.length - 1), 18 - (v / max) * 16]));
  return (
    <svg width="56" height="20" viewBox="0 0 56 20" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function KpiCard({ k }) {
  return (
    <div className={`card kpi ${k.waiting ? "kpi-wait" : ""}`}>
      <div className="kpi-top">
        <span className="ic ic-sm" style={{ background: k.tint, borderColor: k.ring, color: k.color }}>
          {k.glyph}
        </span>
        {!k.waiting && !k.loading && <Sparkline values={k.series} color={k.color} />}
      </div>
      <span className="kpi-label">{k.label}</span>
      {k.loading ? (
        <span className="kpi-skel" aria-label="Loading" />
      ) : k.waiting ? (
        <div className="stack" style={{ gap: 4 }}>
          <span className="pill pill-orange" style={{ alignSelf: "flex-start" }}>Waiting on backend</span>
          <span className="tiny">{k.waiting}</span>
        </div>
      ) : (
        <div className="kpi-val">
          <span className="kpi-num">{k.value}</span>
          {k.delta && <span className={k.deltaBad ? "down" : "up"}>{k.delta}</span>}
          {k.note && <span className="tiny">{k.note}</span>}
        </div>
      )}
    </div>
  );
}

const deltaText = (d, unit, suffix) =>
  d === undefined ? null : `${d >= 0 ? "+" : ""}${unit === "%" ? Math.round(d) : d.toFixed(1)}${unit === "%" ? "%" : " pts"}${suffix}`;

/**
 * A smooth SVG path through the points — monotone cubic (Fritsch–Carlson), the
 * curve d3 calls curveMonotoneX. It bends like the prototype's line but never
 * overshoots the real values: no bump above a peak, no dip below zero, and a
 * flat run stays flat. Only the drawing is smoothed; every point is still a
 * real day's total.
 * @param {Array<[number, number]>} pts  [x, y] in SVG units, x increasing.
 */
function smoothPath(pts) {
  const n = pts.length;
  if (n < 2) return n ? `M${pts[0][0]} ${pts[0][1]}` : "";
  const dx = [], slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    slope.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const t = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(slope[i - 1] * slope[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]));
  }
  t.push(slope[n - 2]);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = dx[i] / 3;
    d += ` C${(x0 + h).toFixed(1)} ${(y0 + h * t[i]).toFixed(1)} ${(x1 - h).toFixed(1)} ${(y1 - h * t[i + 1]).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

/** Save the chart's two periods as a CSV the user can open in a spreadsheet. */
function exportChartCsv(chart, metric, range) {
  const rows = [[chart.unit === "week" ? "Week" : "Day", `${metric} (${range.name})`, `${metric} (${range.prev})`, "Posts published"]];
  chart.days.forEach((d, i) => rows.push([d.label, chart.cur[i] ?? "", chart.prev[i] ?? "", d.posts]));
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `engagement-${metric.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function HomeDashboard() {
  const [picked, setPlatform] = useState("All");
  const [metric, setMetric] = useState("Likes");
  const [range, setRange] = useState(RANGES[0]);
  const [downloading, setDownloading] = useState(false);
  const { inbox, campaigns, posts, networks, followers, approvals, loadMoreInbox, refreshFollowerCounts, decideApproval } =
    useHomeData(range.days, FOLLOWER_TABS[picked]);
  const { activeBrand } = useAuth();
  const router = useRouter();
  // Which lists are expanded by their "See more".
  const [showAll, setShowAll] = useState({ ads: false, posts: false, approvals: false });
  const toggleAll = (key) => setShowAll((s) => ({ ...s, [key]: !s[key] }));

  // Waiting for approval: approve one / all, or turn one down.
  const pending = approvals.list.filter((p) => p.status === "pending");
  const decide = async (action, id, post) => {
    try {
      const approved = await decideApproval(action, id);
      if (action === "reject") toast.success("Post turned down — it won't go out.");
      else if (action === "approve-all") toast.success(`${approved} post${approved === 1 ? "" : "s"} approved.`);
      else
        toast.success(
          post?.scheduled_at && new Date(post.scheduled_at) > new Date()
            ? `Approved — it goes out ${whenText(post.scheduled_at)}.`
            : "Approved — it goes out within a couple of minutes.",
        );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const tabs = useMemo(() => platformTabs(networks), [networks]);
  const shownTabs = tabs.slice(0, VISIBLE_TABS + 1);
  const moreTabs = tabs.slice(VISIBLE_TABS + 1);
  // A network that's no longer connected (brand switch) falls back to "All".
  const tab = tabs.find((t) => t.id === picked) || tabs[0];
  const platform = tab.id;
  // One clock read per mount, so every section agrees on what "now" is.
  const [now] = useState(() => Date.now());
  const period = useMemo(() => periods(range.days, now), [range.days, now]);
  const vs = ` vs previous ${range.days} days`;
  const rangeLabel = `${shortDate(new Date(period.from).toISOString())} – ${shortDate(new Date(period.to - 1).toISOString())}, ${new Date(period.to - 1).getFullYear()}`;

  // ── Filtered by the platform tab ──
  const rawPosts = useMemo(
    () => (posts.raw || []).filter((p) => !tab.social || p.platform === tab.social),
    [posts.raw, tab.social],
  );
  const topPosts = useMemo(
    () =>
      (posts.recent || [])
        .filter((p) => !tab.social || p.platform === tab.social)
        .sort((a, b) => b.score - a.score),
    [posts.recent, tab.social],
  );
  const ads = useMemo(() => {
    const all = campaigns.all || [];
    if (!tab.social) return all;
    return tab.ads ? all.filter((c) => c.platform === tab.ads) : [];
  }, [campaigns.all, tab.social, tab.ads]);

  // ── Number cards ──
  const kpis = useMemo(() => {
    const cur = within(rawPosts, period.from, period.to);
    const prev = within(rawPosts, period.prevFrom, period.prevTo);
    const daily = (fn) => bucketsOf(period).map((b) => sumBy(inBucket(cur, b), fn) ?? 0);
    const views = (p) => roleValue(p, "views") ?? roleValue(p, "reach");

    const inter = sumBy(cur, interactionsOf);
    const interPrev = sumBy(prev, interactionsOf);
    const seen = sumBy(cur, views);
    const seenPrev = sumBy(prev, views);
    const rate = avgOf(cur.map(engagementOf).filter((v) => v !== undefined));
    const ratePrev = avgOf(prev.map(engagementOf).filter((v) => v !== undefined));

    const spend = sumBy(ads, (c) => c.spend);
    const conv = sumBy(ads, (c) => c.conversions);
    const noAds = !ads.length;

    const loadingPosts = posts.loading;
    const loadingAds = campaigns.loading;
    const postsNote = !cur.length ? `No posts published in the last ${range.days} days` : undefined;
    const span = range.name.toLowerCase();

    return [
      {
        label: "Total engagement",
        color: "#e8590c", tint: "#fff4ed", ring: "#fde2cf", glyph: "♥",
        loading: loadingPosts,
        value: inter === undefined ? "–" : fmtK(inter),
        delta: deltaText(pctChange(inter, interPrev), "%", vs),
        deltaBad: inter !== undefined && interPrev !== undefined && inter < interPrev,
        note: inter === undefined ? postsNote : undefined,
        series: daily(interactionsOf),
      },
      followerKpi(followers, tab, range.days),
      {
        label: "Views",
        color: "#0a7a48", tint: "#edf8f2", ring: "#cdeedc", glyph: "◉",
        loading: loadingPosts,
        value: seen === undefined ? "–" : fmtK(seen),
        delta: deltaText(pctChange(seen, seenPrev), "%", vs),
        deltaBad: seen !== undefined && seenPrev !== undefined && seen < seenPrev,
        note: seen === undefined ? postsNote : undefined,
        series: daily(views),
      },
      {
        label: "Engagement rate",
        color: "#7c3aed", tint: "#f4effe", ring: "#e2d6fb", glyph: "%",
        loading: loadingPosts,
        value: rate === undefined ? "–" : `${rate.toFixed(1)}%`,
        delta: rate !== undefined && ratePrev !== undefined ? deltaText(rate - ratePrev, "pts", vs) : null,
        deltaBad: rate !== undefined && ratePrev !== undefined && rate < ratePrev,
        note: rate === undefined ? postsNote : undefined,
        series: daily(engagementOf),
      },
      {
        label: "Conversions (ads)",
        color: "#1447e6", tint: "#eef2fd", ring: "#c9d6fb", glyph: "★",
        loading: loadingAds,
        value: noAds ? "–" : count(conv ?? 0),
        note: noAds ? "No ad campaigns" : span,
      },
      {
        label: "Cost per conversion",
        color: "#c2410c", tint: "#fff5eb", ring: "#fde2c4", glyph: "÷", // not "$" — the backend sends no currency
        loading: loadingAds,
        value: noAds || !conv ? "–" : amount(spend / conv),
        note: noAds
          ? "No ad campaigns"
          : !conv
            ? `${amount(spend ?? 0)} spent, no conversions yet`
            : `spend ÷ conversions, ${span} · currency not sent by backend`,
      },
    ];
  }, [rawPosts, period, range, vs, ads, posts.loading, campaigns.loading, followers, tab]);

  // ── Engagement chart: per day (per week past a month), this period vs the one before ──
  const chart = useMemo(() => {
    const role = metric.toLowerCase();
    const cur = within(rawPosts, period.from, period.to);
    const prev = within(rawPosts, period.prevFrom, period.prevTo);
    const reported = rawPosts.some((p) => roleValue(p, role) !== undefined);
    const bucket = (list, offset) =>
      bucketsOf(period, offset).map((b) => {
        const inDay = inBucket(list, b);
        return { posts: inDay, value: sumBy(inDay, (p) => roleValue(p, role)) };
      });
    const curDays = bucket(cur, 0);
    const prevDays = bucket(prev, period.days * DAY);
    const weekly = bucketsOf(period)[0].size > 1;
    // At most ~8 labels under the chart, so a month's days don't crowd.
    const step = Math.ceil(curDays.length / 8);
    const days = bucketsOf(period).map((b, i) => {
      const date = new Date(b.start);
      const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const d = curDays[i];
      return {
        short: i % step ? "" : curDays.length <= 7 ? date.toLocaleDateString("en-US", { weekday: "short" }) : monthDay,
        label: weekly ? `Week of ${monthDay}` : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        posts: d.posts.length,
        top: [...d.posts].sort((a, b) => (roleValue(b, role) ?? 0) - (roleValue(a, role) ?? 0))[0],
      };
    });
    const curVals = curDays.map((d) => d.value ?? 0);
    const prevVals = prevDays.map((d) => d.value ?? 0);
    const total = sumBy(curDays, (d) => d.value);
    const totalPrev = sumBy(prevDays, (d) => d.value);
    let pk = 0;
    curVals.forEach((v, i) => {
      if (v > curVals[pk]) pk = i;
    });
    return {
      reported,
      unit: weekly ? "week" : "day",
      days,
      cur: curVals,
      prev: prevVals,
      total,
      change: pctChange(total, totalPrev),
      pk,
      hasData: curVals.some((v) => v > 0) || prevVals.some((v) => v > 0),
      max: Math.max(1, ...curVals, ...prevVals) * 1.15,
    };
  }, [rawPosts, period, metric]);

  // ── Best time: the brand's own posts over 90 days ──
  const heat = useMemo(() => bestTimes(rawPosts, periods(90, now)), [rawPosts, now]);

  // ── Monday report (whole brand, not the tab) ──
  const report = useMemo(
    () =>
      inbox.loading || campaigns.loading || posts.loading
        ? null
        : buildReport({ posts, campaigns: { ...campaigns, all: campaigns.week }, inbox, brandName: activeBrand?.name, now: new Date(now) }),
    [inbox, campaigns, posts, activeBrand?.name, now],
  );

  const last = Math.max(1, chart.cur.length - 1);
  const X = (i) => (i / last) * 700;
  // The best-day band: as wide as one point's share of the chart, at most 60.
  const bandW = Math.min(60, 700 / last);
  const Y = (v) => 240 - (v / chart.max) * 234;
  const path = (vals) => smoothPath(vals.map((v, i) => [X(i), Y(v)]));

  return (
    <div className="ck-home">
      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="row wrap">
        <div className="row" style={{ gap: 6 }}>
          <div className="seg" role="tablist" aria-label="Platform">
            {shownTabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab.id === t.id}
                className={tab.id === t.id ? "on" : ""}
                onClick={() => setPlatform(t.id)}
              >
                {t.id}
              </button>
            ))}
          </div>
          {moreTabs.length > 0 && (
            <Menu
              align="left"
              style={{ minWidth: 160 }}
              button={({ open, toggle }) => {
                const inMore = moreTabs.some((t) => t.id === tab.id);
                return (
                  <button className={`btn ${inMore ? "btn-on" : ""}`} onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
                    {inMore ? tab.id : "More"}
                    <ChevronDown size={14} />
                  </button>
                );
              }}
            >
              {moreTabs.map((t) => (
                <button key={t.id} role="menuitemradio" aria-checked={tab.id === t.id} className={tab.id === t.id ? "on" : ""} onClick={() => setPlatform(t.id)}>
                  {t.id}
                </button>
              ))}
            </Menu>
          )}
        </div>
        <div className="row" style={{ marginLeft: "auto" }}>
          <Menu
            style={{ minWidth: 180 }}
            button={({ open, toggle }) => (
              <button className="btn" onClick={toggle} aria-haspopup="menu" aria-expanded={open} title={`Every number on this page covers the ${range.name.toLowerCase()}`}>
                <Calendar size={14} />
                {rangeLabel}
                <ChevronDown size={14} />
              </button>
            )}
          >
            {RANGES.map((r) => (
              <button key={r.days} role="menuitemradio" aria-checked={range.days === r.days} className={range.days === r.days ? "on" : ""} onClick={() => setRange(r)}>
                {r.name}
              </button>
            ))}
          </Menu>
        </div>
      </div>

      {/* ── Number cards ────────────────────────────────────────────── */}
      <section className="grid-auto" aria-label="Key numbers">
        {kpis.map((k) => (
          <KpiCard key={k.label} k={k} />
        ))}
      </section>

      {/* ── Engagement + campaigns ──────────────────────────────────── */}
      <div className="flex-row">
        <section className="card card-pad stack" style={{ flex: "999 1 560px", minWidth: 0, gap: 12 }}>
          <CardHead
            icon={Flame}
            color="#e8590c"
            title="Engagement performance"
            sub={`${platform === "All" ? "All connected networks" : platform} · totals of the posts published each ${chart.unit}`}
          >
            <button className="btn" disabled={posts.loading || !chart.hasData} onClick={() => exportChartCsv(chart, metric, range)}>
              <Download size={14} />
              Export
            </button>
          </CardHead>
          <div className="row wrap between">
            <div className="seg" role="tablist" aria-label="Metric">
              {CHART_METRICS.map((m) => (
                <button key={m} role="tab" aria-selected={metric === m} className={metric === m ? "on" : ""} onClick={() => setMetric(m)}>
                  {m}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 14 }}>
              <span className="legend-i"><i style={{ background: "#1447e6" }} />{range.name}</span>
              <span className="legend-i"><i style={{ background: "#b9c1d3" }} />{range.prev}</span>
            </div>
          </div>
          {posts.loading ? (
            <KluxLoader label="Adding up your engagement" />
          ) : posts.error ? (
            <SectionNote>{posts.error}</SectionNote>
          ) : !rawPosts.length ? (
            <SectionNote action={<Link href="/integrations" className="btn btn-sm">Connect socials</Link>}>
              {platform === "All" ? "Connect a social account to see your engagement." : `No ${platform} posts found on your connected accounts.`}
            </SectionNote>
          ) : !chart.reported ? (
            <SectionNote>
              {platform === "All" ? "Your" : platform} networks don&apos;t report {metric.toLowerCase()} for your posts.
            </SectionNote>
          ) : (
            <>
              <div className="chart-wrap">
                <div className="yticks">
                  {[4, 3, 2, 1, 0].map((k) => (
                    <span key={k}>{fmtK((chart.max / 4) * k)}</span>
                  ))}
                </div>
                <div className="chart-area">
                  <div className="chart-box">
                    <svg viewBox="0 0 700 240" preserveAspectRatio="none" role="img" aria-label={`${metric} per ${chart.unit}, ${range.name.toLowerCase()}`}>
                      <defs>
                        <linearGradient id="ckHomeFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#1447e6" stopOpacity=".22" />
                          <stop offset="1" stopColor="#1447e6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[1, 60, 120, 180].map((y) => (
                        <line key={y} x1="0" x2="700" y1={y} y2={y} stroke="var(--line-2)" />
                      ))}
                      <line x1="0" x2="700" y1="239" y2="239" stroke="var(--input)" />
                      {chart.cur[chart.pk] > 0 && (
                        <rect x={Math.max(0, Math.min(700 - bandW, X(chart.pk) - bandW / 2)).toFixed(0)} y="0" width={bandW.toFixed(0)} height="240" fill="#1447e6" fillOpacity=".05" stroke="#c9d6fb" />
                      )}
                      <path d={path(chart.prev)} fill="none" stroke="#b9c1d3" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                      <path d={`${path(chart.cur)} L700 240 L0 240 Z`} fill="url(#ckHomeFill)" />
                      <path d={path(chart.cur)} fill="none" stroke="#1447e6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </svg>
                    {chart.cur[chart.pk] > 0 && (
                      <div
                        className="chart-tip"
                        style={{
                          left: `${Math.min(85, Math.max(15, (chart.pk / last) * 100)).toFixed(1)}%`,
                          // The tip sits above its point; held 70px down so a peak at
                          // the top of the chart can't push it over the metric tabs.
                          top: `${Math.max(70, Y(chart.cur[chart.pk]) - 6).toFixed(0)}px`,
                        }}
                      >
                        <span className="tiny" style={{ fontWeight: 600, color: "var(--text-3)" }}>Best {chart.unit} · {chart.days[chart.pk].label}</span>
                        <strong style={{ color: "var(--brand)", fontSize: 13 }}>
                          {fmtK(chart.cur[chart.pk])} {metric.toLowerCase()}
                        </strong>
                        {chart.days[chart.pk].top && (
                          <span className="tiny ellipsis" style={{ maxWidth: 220 }}>
                            Post: &quot;{chart.days[chart.pk].top.project_title}&quot;
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="xlabels" style={{ "--n": chart.days.length }}>
                    {chart.days.map((d) => (
                      <span key={d.label}>{d.short}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="stat-strip">
                <div>
                  <span className="muted">Total {metric.toLowerCase()}</span>
                  <b>{count(chart.total ?? 0)}</b>
                </div>
                <div>
                  <span className="muted">Daily average</span>
                  <b>{count((chart.total ?? 0) / range.days)}</b>
                </div>
                <div>
                  <span className="muted">vs previous {range.days} days</span>
                  <b style={{ color: chart.change === undefined ? undefined : chart.change >= 0 ? "var(--green)" : "var(--red)" }}>
                    {chart.change === undefined ? "–" : `${chart.change >= 0 ? "+" : ""}${chart.change.toFixed(1)}%`}
                  </b>
                </div>
                <div>
                  <span className="muted">Posts in {range.days} days</span>
                  <b>{chart.days.reduce((t, d) => t + d.posts, 0)}</b>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="card card-pad stack" style={{ flex: "1 1 340px", gap: 12 }}>
          <CardHead
            icon={Users}
            color="#7c3aed"
            title="Followers by platform"
            sub={
              followers.data?.accounts?.length
                ? `${fmtK(followers.data.total ?? 0)} followers · change over the last 7 days`
                : "Facebook Pages and Instagram accounts"
            }
          >
            {!followers.loading && !followers.error && followers.data?.accounts?.length > 0 && (
              <button
                className="btn btn-sm"
                disabled={followers.refreshing}
                title="Read the counts from Facebook and Instagram now"
                onClick={() => refreshFollowerCounts().then(() => toast.success("Followers updated"), (err) => toast.error(err.message))}
              >
                {followers.refreshing ? "Refreshing…" : "Refresh"}
              </button>
            )}
          </CardHead>
          {tab.social && !FOLLOWER_TABS[tab.id] ? (
            <SectionNote>Followers are counted for Facebook Pages and Instagram accounts only — not {platform} yet.</SectionNote>
          ) : followers.loading ? (
            <KluxLoader label="Counting your followers" />
          ) : followers.error ? (
            <SectionNote>{followers.error}</SectionNote>
          ) : !followers.data?.accounts?.length ? (
            <SectionNote action={<Link href="/integrations" className="btn btn-sm">Connect accounts</Link>}>
              Connect a Facebook Page or Instagram account to track your followers.
            </SectionNote>
          ) : (
            <>
              {followers.data.accounts.map((a) => (
                <div key={a.integration_id ?? `${a.platform}-${a.name}`} className="mini-row">
                  <span className="pf" style={{ width: 28, height: 28, borderRadius: 6, background: NETWORK[a.platform]?.[1] || "#6b7080" }}>
                    {networkName(a.platform).slice(0, 2)}
                  </span>
                  <span className="grow stack" style={{ gap: 2, minWidth: 0 }}>
                    <span className="ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>{a.name || networkName(a.platform)}</span>
                    <span className="tiny">{networkName(a.platform)}</span>
                  </span>
                  <span className="stack" style={{ gap: 2, alignItems: "flex-end" }}>
                    <b style={{ fontSize: 13 }}>{count(a.followers)}</b>
                    {a.change_7d == null ? (
                      <span className="tiny">–</span>
                    ) : (
                      <span className={a.change_7d < 0 ? "down" : "up"}>
                        {a.change_7d >= 0 ? "+" : "−"}
                        {fmtK(Math.abs(a.change_7d))}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              {followers.data.errors?.length > 0 && (
                <span className="tiny" style={{ color: "var(--orange)" }}>
                  Couldn&apos;t read{" "}
                  {followers.data.errors.map((e) => (typeof e === "string" ? e : e?.name || e?.platform || e?.error || "an account")).join(", ")}{" "}
                  — showing the last saved count. Reconnecting the account usually fixes it.
                </span>
              )}
              {followers.data.change_7d == null && followers.data.tracking_since && (
                <span className="tiny">Growth shows once 7 days are recorded — tracking since {shortDate(followers.data.tracking_since)}.</span>
              )}
            </>
          )}
        </section>
      </div>

      {/* ── Approvals, ad campaigns, best time ──────────────────────── */}
      <div className="flex-row">
        <section className="card card-pad stack" style={{ flex: "1 1 360px" }}>
          <CardHead icon={Sparkles} color="#7c3aed" title="Waiting for approval" sub="Posts your copilots planned, waiting for your OK">
            {pending.length > 1 && (
              <button className="btn btn-sm btn-primary" disabled={!!approvals.busy} onClick={() => decide("approve-all", pending.map((p) => p.id))}>
                {approvals.busy === "approve-all" ? "Approving…" : `Approve all (${pending.length})`}
              </button>
            )}
          </CardHead>
          {approvals.loading ? (
            <KluxLoader label="Checking for posts to approve" />
          ) : approvals.error ? (
            <SectionNote>{approvals.error}</SectionNote>
          ) : !approvals.list.length ? (
            <SectionNote action={<Link href="/copilot" className="btn btn-sm">Set up Autopilot</Link>}>
              Nothing waiting. Turn on Autopilot for a copilot and it plans and designs your week&apos;s posts, then asks you here before they go out.
            </SectionNote>
          ) : (
            <>
              {(showAll.approvals ? approvals.list : approvals.list.slice(0, APPROVALS_COUNT)).map((p) => {
                const drafting = p.status === "drafting";
                const nets = [...new Set((p.targets || []).map((t) => networkName(t.platform)))].join(", ");
                return (
                  <div key={p.id} className="mini-row" style={{ alignItems: "flex-start" }}>
                    {p.image_url ? (
                      <a href={p.image_url} target="_blank" rel="noreferrer" title="Open the design">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", display: "block" }} />
                      </a>
                    ) : (
                      <span className="avatar" style={{ width: 44, height: 44, borderRadius: 8, background: "var(--brand-tint)", color: "var(--brand)" }}>
                        <Sparkles size={16} />
                      </span>
                    )}
                    <span className="grow stack" style={{ gap: 2, minWidth: 0 }}>
                      <span className="ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>{p.headline || p.idea || "Untitled post"}</span>
                      {p.caption && <span className="ellipsis" style={{ fontSize: 12, color: "var(--text-3)" }}>{p.caption}</span>}
                      <span className="tiny">
                        {[p.copilot?.name, nets, whenText(p.scheduled_at)].filter(Boolean).join(" · ")}
                      </span>
                      {drafting ? (
                        <span className="pill pill-blue" style={{ alignSelf: "flex-start", marginTop: 4 }}>Designing…</span>
                      ) : (
                        <span className="row" style={{ gap: 6, marginTop: 4 }}>
                          <button className="btn btn-sm btn-primary" disabled={!!approvals.busy} onClick={() => decide("approve", p.id, p)}>
                            {approvals.busy === p.id ? "…" : "Approve"}
                          </button>
                          <button className="btn btn-sm" disabled={!!approvals.busy} onClick={() => decide("reject", p.id)}>
                            Reject
                          </button>
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
              <SeeMore
                shown={showAll.approvals ? approvals.list.length : Math.min(APPROVALS_COUNT, approvals.list.length)}
                total={approvals.list.length}
                open={showAll.approvals}
                onToggle={() => toggleAll("approvals")}
              />
            </>
          )}
        </section>

        <section className="card stack" style={{ flex: "2 1 540px", minWidth: 0, padding: "14px 0 4px", gap: 8 }}>
          <CardHead
            icon={Target}
            color="var(--green)"
            title="Ad campaigns"
            sub={
              campaigns.loading
                ? range.name
                : `${range.name} · ${amount(sumBy(ads, (c) => c.spend) ?? 0)} spent across ${ads.length} campaign${ads.length === 1 ? "" : "s"} · amounts as the backend sends them (no currency given)`
            }
            style={{ padding: "0 14px" }}
          >
            <Link href="/ads-content" style={{ fontSize: 12, fontWeight: 600 }}>All ads</Link>
          </CardHead>
          {campaigns.loading ? (
            <KluxLoader label="Fetching your ads" />
          ) : campaigns.error ? (
            <div style={{ padding: "0 14px 10px" }}><SectionNote>{campaigns.error}</SectionNote></div>
          ) : !ads.length ? (
            <div style={{ padding: "0 14px 10px" }}>
              <SectionNote action={<Link href="/integrations" className="btn btn-sm">Connect ads</Link>}>
                {platform !== "All" && campaigns.all?.length ? `No ${platform} ad campaigns.` : "No ad campaigns yet."}
              </SectionNote>
            </div>
          ) : (
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 14 }}>Campaign</th>
                    <th>Network</th>
                    <th>Status</th>
                    <th className="num">Daily budget</th>
                    <th className="num">Spend</th>
                    <th className="num">Impressions</th>
                    <th className="num">Clicks</th>
                    <th className="num" title="As the network sends it — Meta as a percent, Google as a fraction">CTR</th>
                    <th className="num">CPC</th>
                    <th className="num" style={{ paddingRight: 14 }}>Conversions</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAll.ads ? ads : ads.slice(0, TABLE_COUNT)).map((c) => {
                    const [pc, label] = campaignPill(c.status);
                    const href = `/ads-content?platform=${encodeURIComponent(c.platform)}&campaign=${encodeURIComponent(c.id)}`;
                    return (
                      <tr key={c.id} className="open-row" title={`Open in Ads · ${networkName(c.platform)}`} onClick={() => router.push(href)}>
                        <td style={{ paddingLeft: 14, fontWeight: 600, maxWidth: 260 }}>
                          {/* The row opens on click; this link is the keyboard way in. */}
                          <Link href={href} className="row" style={{ color: "inherit" }} onClick={(e) => e.stopPropagation()}>
                            {c.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
                            ) : (
                              <span className="pf" style={{ width: 28, height: 28, borderRadius: 6, background: NETWORK[c.platform]?.[1] || "#6b7080" }}>
                                {networkName(c.platform).slice(0, 1)}
                              </span>
                            )}
                            <span className="ellipsis">{c.name}</span>
                          </Link>
                        </td>
                        <td>{networkName(c.platform)}</td>
                        <td><span className={`pill ${pc}`}>{label}</span></td>
                        <td className="num">{amount(c.dailyBudget)}</td>
                        <td className="num">{amount(c.spend)}</td>
                        <td className="num">{raw(c.impressions)}</td>
                        <td className="num">{raw(c.clicks)}</td>
                        <td className="num">{raw(c.ctr)}</td>
                        <td className="num">{raw(c.cpc)}</td>
                        <td className="num" style={{ paddingRight: 14, fontWeight: 600 }}>{raw(c.conversions)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!campaigns.loading && !campaigns.error && ads.length > 0 && (
            <div style={{ padding: "0 14px" }}>
              <SeeMore
                shown={showAll.ads ? ads.length : Math.min(TABLE_COUNT, ads.length)}
                total={ads.length}
                open={showAll.ads}
                onToggle={() => toggleAll("ads")}
              />
            </div>
          )}
        </section>

        <section className="card card-pad stack" style={{ flex: "1 1 300px" }}>
          <CardHead
            icon={Clock}
            color="#c2410c"
            title="Best time to post"
            sub={
              heat.posts
                ? `From your ${heat.posts} post${heat.posts === 1 ? "" : "s"} in the last 90 days · average ${heat.metric}`
                : "From your own posts' results"
            }
          />
          {posts.loading ? (
            <KluxLoader label="Reading your posting times" />
          ) : heat.posts < 3 ? (
            <SectionNote>
              {heat.posts
                ? `Only ${heat.posts} post${heat.posts === 1 ? "" : "s"} with numbers in the last 90 days — post a few more to see a pattern.`
                : "No posts with numbers in the last 90 days yet."}
            </SectionNote>
          ) : (
            <>
              <div className="heat">
                <span />
                {HOUR_ROWS.map((h) => (
                  <span key={h} className="tiny" style={{ textAlign: "center" }}>{SLOT_LABEL[h]}</span>
                ))}
                {HEAT_DAYS.map((d, col) => [
                  <span key={d} className="tiny">{d}</span>,
                  ...HOUR_ROWS.map((h, row) => {
                    const v = heat.grid[row][col];
                    return (
                      <span
                        key={`${d}-${h}`}
                        className="c"
                        style={{ background: v === null ? "var(--line-2)" : `rgba(20,71,230,${(0.12 + 0.88 * (v / (heat.max || 1))).toFixed(2)})` }}
                        title={v === null ? `${d} ${SLOT_LABEL[h]}: no posts` : `${d} ${SLOT_LABEL[h]}: ${fmtK(v)} ${heat.metric} on average`}
                      />
                    );
                  }),
                ])}
              </div>
              <div className="row tiny">
                <span style={{ width: 14, height: 8, borderRadius: 2, background: "var(--line-2)" }} />
                <span>No posts</span>
                <span style={{ marginLeft: 8 }}>Low</span>
                {[0.25, 0.5, 0.75, 1].map((a) => (
                  <span key={a} style={{ width: 14, height: 8, borderRadius: 2, background: `rgba(20,71,230,${a})` }} />
                ))}
                <span>High</span>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Top posts ───────────────────────────────────────────────── */}
      <section className="card card-pad stack" style={{ gap: 12 }}>
        <CardHead icon={Star} color="var(--green)" title="Top performing posts" sub="Your recent published posts · ranked by likes, comments and shares">
          <Link href="/social-content" style={{ fontSize: 12, fontWeight: 600 }}>See all</Link>
        </CardHead>
        {posts.loading ? (
          <KluxLoader label="Fetching your best posts" />
        ) : posts.error ? (
          <SectionNote>{posts.error}</SectionNote>
        ) : !topPosts.length ? (
          <SectionNote action={<Link href="/integrations" className="btn btn-sm">Connect socials</Link>}>
            {platform !== "All" && posts.recent?.length
              ? `No published ${platform} posts.`
              : posts.connected
                ? "No published posts on your connected accounts yet."
                : "Connect a social account to see your best posts here."}
          </SectionNote>
        ) : (
          <>
          <div className={`posts ${showAll.posts ? "posts-all" : ""}`}>
            {(showAll.posts ? topPosts : topPosts.slice(0, POSTS_COUNT)).map((p) => (
              <Link
                key={p.id}
                href={`/social-content?platform=${encodeURIComponent(p.platform)}&post=${encodeURIComponent(p.id)}`}
                className="card post open-link"
                title={`Open in Social · ${networkName(p.platform)}`}
              >
                <div className="stack" style={{ padding: "10px 12px" }}>
                  <span className="tiny">{[shortDate(p.date), networkName(p.platform)].filter(Boolean).join(" · ")}</span>
                  <span className="ellipsis" style={{ fontSize: 13, fontWeight: 600, marginTop: -6 }}>{p.title}</span>
                </div>
                <div className="post-stats">
                  <div>
                    <span className="ic" style={{ background: "#fdf0f5", borderColor: "#f8d4e3", color: "#d6336c" }}><Heart size={12} strokeWidth={2.4} /></span>
                    <span className="tiny">Likes</span>
                    <b>{raw(p.likes)}</b>
                  </div>
                  <div>
                    <span className="ic" style={{ background: "#eef4fe", borderColor: "#d1e0fb", color: "#1c64d6" }}><MessageCircle size={12} strokeWidth={2.4} /></span>
                    <span className="tiny">Comments</span>
                    <b>{raw(p.comments)}</b>
                  </div>
                  <div>
                    <span className="ic" style={{ background: "#edf8f2", borderColor: "#cdeedc", color: "#0a7a48" }}><Repeat2 size={12} strokeWidth={2.4} /></span>
                    <span className="tiny">Shares</span>
                    <b>{raw(p.shares)}</b>
                  </div>
                  <div>
                    <span className="ic" style={{ background: "#fff5eb", borderColor: "#fde2c4", color: "#c2410c" }}><Eye size={12} strokeWidth={2.4} /></span>
                    <span className="tiny">Views</span>
                    <b>{raw(p.views)}</b>
                  </div>
                </div>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title} />
                ) : (
                  <div className="post-noimg">No image</div>
                )}
              </Link>
            ))}
          </div>
          <SeeMore
            shown={showAll.posts ? topPosts.length : Math.min(POSTS_COUNT, topPosts.length)}
            total={topPosts.length}
            open={showAll.posts}
            onToggle={() => toggleAll("posts")}
          />
          </>
        )}
      </section>

      {/* ── Inbox, report ───────────────────────────────────────────── */}
      <div className="flex-row">
        <section className="card card-pad stack" style={{ flex: "1 1 340px" }}>
          <CardHead
            icon={Inbox}
            color="#1c64d6"
            title="Smart Inbox"
            sub={
              inbox.summary
                ? `${inbox.summary.conversations_7d ?? 0} conversations this week` +
                  // null until the AI has had something to answer — not 0%.
                  (inbox.summary.answered_by_ai == null ? "" : ` · AI answered ${inbox.summary.answered_by_ai}%`)
                : "DMs and comments from your connected accounts"
            }
          >
            {!inbox.loading && !inbox.error &&
              (inbox.needs ? (
                <Link href="/smart-inbox" className="pill pill-red">{inbox.needs} need you</Link>
              ) : (
                <span className="pill pill-green">All clear</span>
              ))}
            <Link href="/smart-inbox" style={{ fontSize: 12, fontWeight: 600 }}>Open inbox</Link>
          </CardHead>
          {inbox.loading ? (
            <KluxLoader label="Checking your inbox" />
          ) : inbox.error ? (
            <SectionNote>{inbox.error}</SectionNote>
          ) : !inbox.list.length ? (
            <SectionNote action={<Link href="/integrations" className="btn btn-sm">Connect accounts</Link>}>
              No conversations yet. New DMs and comments land here once a Facebook, Instagram or WhatsApp account is connected.
            </SectionNote>
          ) : (
            inbox.list.map((c) => {
              const [cls, label] = STATUS_PILL[c.status] || ["", c.status];
              const [bg, fg] = tintFor(c.id);
              return (
                <Link key={c.id} href={`/smart-inbox?c=${c.id}`} className="mini-row" style={{ color: "var(--text)" }}>
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar_url} alt="" className="avatar" style={{ width: 32, height: 32, objectFit: "cover" }} />
                  ) : (
                    <span className="avatar" style={{ background: bg, color: fg }}>{c.initials || c.name?.slice(0, 2)}</span>
                  )}
                  <span className="grow stack" style={{ gap: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {c.name}{" "}
                      <span style={{ fontWeight: 500, color: "var(--muted)" }}>
                        · {networkName(c.platform)} {c.type === "dm" ? "DM" : "comment"}
                      </span>
                    </span>
                    <span className="ellipsis" style={{ fontSize: 12, color: "var(--text-3)" }}>{c.last?.text || ""}</span>
                  </span>
                  <span className={`pill ${cls}`}>{label}</span>
                </Link>
              );
            })
          )}
          {!inbox.loading && !inbox.error && inbox.list?.length > 0 && (inbox.page || 1) < (inbox.lastPage || 1) && (
            <button
              className="btn btn-sm see-more"
              disabled={inbox.loadingMore}
              onClick={() => loadMoreInbox().catch((err) => toast.error(err.message))}
            >
              {inbox.loadingMore ? "Loading…" : `See more (${inbox.list.length} of ${inbox.total})`}
            </button>
          )}
        </section>

        <section className="card card-pad stack report" style={{ flex: "1 1 300px" }}>
          <div className="row between">
            <h2 className="h2" style={{ color: "#fff" }}>Monday report</h2>
            {report && (
              <span className="pill" style={{ borderColor: "#2a3d78", background: "#13235a", color: "#c7d4ff" }}>{report.range}</span>
            )}
          </div>
          {!report ? (
            <KluxLoader label="Putting your week together" className="report-loader" />
          ) : (
            <p>{report.empty ? "There's no data for this week yet. Connect your social and ad accounts to fill this report." : report.summary}</p>
          )}
          <div className="row wrap" style={{ marginTop: "auto" }}>
            <button
              className="btn"
              style={{ background: "#fff", color: "#0b1533", borderColor: "#fff" }}
              disabled={!report || downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  await downloadReportPdf(report);
                  toast.success("Report downloaded.");
                } catch (err) {
                  console.error("❌ [home] report PDF:", err);
                  toast.error("Couldn't create the PDF. Please try again.");
                } finally {
                  setDownloading(false);
                }
              }}
            >
              <Download size={14} />
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
