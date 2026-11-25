"use client";

// HomeDashboard — the "/" home page.
//
// NOTHING ON THIS PAGE IS HARDCODED. Every number comes from the backend
// (useHomeData), and a section the backend can't fill yet is shown as a
// "Waiting on backend" card that says exactly what it needs — never with
// placeholder figures.
//
//   Live, from the brand's own data:
//     number cards        posts' interactions / views / engagement (this week
//                         vs last), ad conversions and cost per conversion
//     engagement chart    likes / comments / shares / saves per day, by the day
//                         each post went out, this week against last
//     campaigns snapshot  creatives/campaigns + campaign-metrics (7 days)
//     ad campaigns table  same, every campaign loaded
//     best time to post   the brand's own posts over 90 days (bestTimes)
//     top posts           creatives/posts + post-metrics
//     Smart Inbox         smart-inbox/summary + conversations; the "Inbox AI"
//                         switch is smart-inbox/settings (ai_on)
//     Monday report       built from all of the above, downloadable as PDF
//
//   Waiting on backend:
//     follower growth, followers by platform, posts waiting for approval, and
//     the AI action on each ad.
//
// The metric maths reuses insights/networkInsights.js — the same helpers the
// Social insights pages use, so Home and those pages agree.
// Styles live in homeDashboard.css, scoped under .ck-home.

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
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

/** The tab strip: which social network each tab shows, and which ad network goes with it. */
const PLATFORM_TABS = [
  { id: "All" },
  { id: "Facebook", social: "facebook", ads: "meta_ads" },
  { id: "Instagram", social: "instagram", ads: "meta_ads" },
  { id: "X", social: "twitter" },
  { id: "TikTok", social: "tiktok", ads: "tiktok_ads" },
  { id: "LinkedIn", social: "linkedin" },
  { id: "YouTube", social: "youtube" },
];

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

const CHART_METRICS = ["Likes", "Comments", "Shares", "Saves"];
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

/** A section the backend can't fill yet: what it will show, and what it needs. */
function WaitingOnBackend({ what, needs }) {
  return (
    <div className="backend-wait">
      <span className="pill pill-orange">Waiting on backend</span>
      <p>{what}</p>
      <span className="tiny" style={{ fontWeight: 600, color: "var(--text-3)" }}>What&apos;s needed</span>
      <ul>
        {needs.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

/** How many each list shows before its "See more". */
const SNAPSHOT_COUNT = 4;
const TABLE_COUNT = 5;
const POSTS_COUNT = 6;

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

const deltaText = (d, unit = "%", suffix = " vs last week") =>
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

/** Save the chart's two weeks as a CSV the user can open in a spreadsheet. */
function exportChartCsv(chart, metric) {
  const rows = [["Day", `${metric} (this week)`, `${metric} (last week)`, "Posts published"]];
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
  const [platform, setPlatform] = useState("All");
  const [metric, setMetric] = useState("Likes");
  const [downloading, setDownloading] = useState(false);
  const [togglingAi, setTogglingAi] = useState(false);
  const { inbox, campaigns, posts, setInboxAi, loadMoreInbox } = useHomeData();
  const { activeBrand } = useAuth();
  // Which lists are expanded by their "See more".
  const [showAll, setShowAll] = useState({ camps: false, ads: false, posts: false });
  const toggleAll = (key) => setShowAll((s) => ({ ...s, [key]: !s[key] }));

  const tab = PLATFORM_TABS.find((t) => t.id === platform) || PLATFORM_TABS[0];
  // One clock read per mount, so every section agrees on what "this week" is.
  const [now] = useState(() => Date.now());
  const period = useMemo(() => periods(7, now), [now]);
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
    if (platform === "All") return all;
    return tab.ads ? all.filter((c) => c.platform === tab.ads) : [];
  }, [campaigns.all, platform, tab.ads]);

  // ── Number cards ──
  const kpis = useMemo(() => {
    const cur = within(rawPosts, period.from, period.to);
    const prev = within(rawPosts, period.prevFrom, period.prevTo);
    const daily = (fn) =>
      Array.from({ length: 7 }, (_, i) => {
        const start = period.from + i * DAY;
        return sumBy(cur.filter((p) => +new Date(p.published_at) >= start && +new Date(p.published_at) < start + DAY), fn) ?? 0;
      });
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
    const postsNote = !cur.length ? "No posts published this week" : undefined;

    return [
      {
        label: "Total engagement",
        color: "#e8590c", tint: "#fff4ed", ring: "#fde2cf", glyph: "♥",
        loading: loadingPosts,
        value: inter === undefined ? "–" : fmtK(inter),
        delta: deltaText(pctChange(inter, interPrev)),
        deltaBad: inter !== undefined && interPrev !== undefined && inter < interPrev,
        note: inter === undefined ? postsNote : undefined,
        series: daily(interactionsOf),
      },
      {
        label: "Follower growth",
        color: "#1c64d6", tint: "#eef4fe", ring: "#d1e0fb", glyph: "+",
        waiting: "Needs follower counts per account",
      },
      {
        label: "Views",
        color: "#0a7a48", tint: "#edf8f2", ring: "#cdeedc", glyph: "◉",
        loading: loadingPosts,
        value: seen === undefined ? "–" : fmtK(seen),
        delta: deltaText(pctChange(seen, seenPrev)),
        deltaBad: seen !== undefined && seenPrev !== undefined && seen < seenPrev,
        note: seen === undefined ? postsNote : undefined,
        series: daily(views),
      },
      {
        label: "Engagement rate",
        color: "#7c3aed", tint: "#f4effe", ring: "#e2d6fb", glyph: "%",
        loading: loadingPosts,
        value: rate === undefined ? "–" : `${rate.toFixed(1)}%`,
        delta: rate !== undefined && ratePrev !== undefined ? deltaText(rate - ratePrev, "pts") : null,
        deltaBad: rate !== undefined && ratePrev !== undefined && rate < ratePrev,
        note: rate === undefined ? postsNote : undefined,
        series: daily(engagementOf),
      },
      {
        label: "Conversions (ads)",
        color: "#1447e6", tint: "#eef2fd", ring: "#c9d6fb", glyph: "★",
        loading: loadingAds,
        value: noAds ? "–" : count(conv ?? 0),
        note: noAds ? "No ad campaigns" : "last 7 days",
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
            : "spend ÷ conversions, last 7 days · currency not sent by backend",
      },
    ];
  }, [rawPosts, period, ads, posts.loading, campaigns.loading]);

  // ── Engagement chart: per day, this week vs last ──
  const chart = useMemo(() => {
    const role = metric.toLowerCase();
    const cur = within(rawPosts, period.from, period.to);
    const prev = within(rawPosts, period.prevFrom, period.prevTo);
    const reported = rawPosts.some((p) => roleValue(p, role) !== undefined);
    const bucket = (list, from) =>
      Array.from({ length: 7 }, (_, i) => {
        const start = from + i * DAY;
        const inDay = list.filter((p) => +new Date(p.published_at) >= start && +new Date(p.published_at) < start + DAY);
        return { posts: inDay, value: sumBy(inDay, (p) => roleValue(p, role)) };
      });
    const curDays = bucket(cur, period.from);
    const prevDays = bucket(prev, period.prevFrom);
    const days = curDays.map((d, i) => {
      const date = new Date(period.from + i * DAY);
      return {
        short: date.toLocaleDateString("en-US", { weekday: "short" }),
        label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
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
        : buildReport({ posts, campaigns, inbox, brandName: activeBrand?.name, now: new Date(now) }),
    [inbox, campaigns, posts, activeBrand?.name, now],
  );

  const aiOn = inbox.summary?.ai_on;
  const X = (i) => (i / 6) * 700;
  const Y = (v) => 240 - (v / chart.max) * 234;
  const path = (vals) => smoothPath(vals.map((v, i) => [X(i), Y(v)]));

  return (
    <div className="ck-home">
      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="row wrap">
        <div className="seg" role="tablist" aria-label="Platform">
          {PLATFORM_TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={platform === t.id}
              className={platform === t.id ? "on" : ""}
              onClick={() => setPlatform(t.id)}
            >
              {t.id}
            </button>
          ))}
        </div>
        <div className="row" style={{ marginLeft: "auto" }}>
          <button
            className={`btn ${aiOn ? "btn-autopilot" : ""}`}
            disabled={inbox.loading || !inbox.summary || togglingAi}
            title={aiOn ? "The AI answers new DMs and comments on its own. Click to pause." : "Every new DM and comment waits for a person. Click to let the AI answer."}
            onClick={async () => {
              setTogglingAi(true);
              try {
                const saved = await setInboxAi(!aiOn);
                toast.success(saved ? "Inbox AI is on — it will answer new messages." : "Inbox AI paused — new messages will wait for you.");
              } catch (err) {
                toast.error(err.message);
              } finally {
                setTogglingAi(false);
              }
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: aiOn ? "#12a05c" : "#9aa0ad" }} />
            {inbox.loading ? "Inbox AI…" : !inbox.summary ? "Inbox AI unavailable" : aiOn ? "Inbox AI on" : "Inbox AI paused"}
          </button>
          <span className="btn" style={{ cursor: "default" }} title="Every number on this page covers the last 7 days">
            <Calendar size={14} />
            {rangeLabel}
          </span>
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
            sub={`${platform === "All" ? "All connected networks" : platform} · totals of the posts published each day`}
          >
            <button className="btn" disabled={posts.loading || !chart.hasData} onClick={() => exportChartCsv(chart, metric)}>
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
              <span className="legend-i"><i style={{ background: "#1447e6" }} />This week</span>
              <span className="legend-i"><i style={{ background: "#b9c1d3" }} />Last week</span>
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
                    <svg viewBox="0 0 700 240" preserveAspectRatio="none" role="img" aria-label={`${metric} per day this week`}>
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
                        <rect x={Math.max(0, Math.min(640, X(chart.pk) - 30)).toFixed(0)} y="0" width="60" height="240" fill="#1447e6" fillOpacity=".05" stroke="#c9d6fb" />
                      )}
                      <path d={path(chart.prev)} fill="none" stroke="#b9c1d3" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                      <path d={`${path(chart.cur)} L700 240 L0 240 Z`} fill="url(#ckHomeFill)" />
                      <path d={path(chart.cur)} fill="none" stroke="#1447e6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </svg>
                    {chart.cur[chart.pk] > 0 && (
                      <div
                        className="chart-tip"
                        style={{
                          left: `${Math.min(85, Math.max(15, (chart.pk / 6) * 100)).toFixed(1)}%`,
                          // The tip sits above its point; held 70px down so a peak at
                          // the top of the chart can't push it over the metric tabs.
                          top: `${Math.max(70, Y(chart.cur[chart.pk]) - 6).toFixed(0)}px`,
                        }}
                      >
                        <span className="tiny" style={{ fontWeight: 600, color: "var(--text-3)" }}>Best day · {chart.days[chart.pk].label}</span>
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
                  <div className="xlabels">
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
                  <b>{count((chart.total ?? 0) / 7)}</b>
                </div>
                <div>
                  <span className="muted">vs last week</span>
                  <b style={{ color: chart.change === undefined ? undefined : chart.change >= 0 ? "var(--green)" : "var(--red)" }}>
                    {chart.change === undefined ? "–" : `${chart.change >= 0 ? "+" : ""}${chart.change.toFixed(1)}%`}
                  </b>
                </div>
                <div>
                  <span className="muted">Posts this week</span>
                  <b>{chart.days.reduce((t, d) => t + d.posts, 0)}</b>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="card card-pad stack" style={{ flex: "1 1 340px" }}>
          <CardHead icon={Calendar} color="var(--brand)" title="Campaigns snapshot" sub="Your ad campaigns · spend and results over the last 7 days">
            <Link href="/ads-content" style={{ fontSize: 12, fontWeight: 600 }}>View all</Link>
          </CardHead>
          {campaigns.loading ? (
            <KluxLoader label="Fetching your campaigns" />
          ) : campaigns.error ? (
            <SectionNote>{campaigns.error}</SectionNote>
          ) : !ads.length ? (
            <SectionNote action={<Link href="/integrations" className="btn btn-sm">Connect ads</Link>}>
              {platform !== "All" && campaigns.all?.length
                ? `No ${platform} ad campaigns.`
                : campaigns.connected
                  ? "No campaigns on your connected ad accounts yet."
                  : "Connect an ad account to see your campaigns here."}
            </SectionNote>
          ) : (
            <>
              <div className={`stack ${showAll.camps ? "camp-list-open" : ""}`}>
              {(showAll.camps ? ads : ads.slice(0, SNAPSHOT_COUNT)).map((c) => {
                const [pc, label] = campaignPill(c.status);
                const cell = (name, value) => (
                  <div className="row between">
                    <span className="tiny">{name}</span>
                    <span className="tiny" style={{ fontWeight: 600, color: "var(--text)" }}>{value}</span>
                  </div>
                );
                return (
                  <div key={c.id} className="card camp">
                    <div className="row between">
                      <span className="ellipsis" style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                      <span className={`pill ${pc}`}>{label}</span>
                    </div>
                    <div className="two">
                      <div className="stack" style={{ gap: 4 }}>
                        {cell(`Spend · ${networkName(c.platform)}`, amount(c.spend))}
                        {cell("Daily budget", amount(c.dailyBudget))}
                      </div>
                      <div className="stack" style={{ gap: 4 }}>
                        {cell("Clicks", raw(c.clicks))}
                        {cell("Conversions", raw(c.conversions))}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
              <SeeMore
                shown={showAll.camps ? ads.length : Math.min(SNAPSHOT_COUNT, ads.length)}
                total={ads.length}
                open={showAll.camps}
                onToggle={() => toggleAll("camps")}
              />
            </>
          )}
        </section>
      </div>

      {/* ── Approvals, ad campaigns, best time ──────────────────────── */}
      <div className="flex-row">
        <section className="card card-pad stack" style={{ flex: "1 1 360px" }}>
          <CardHead icon={Sparkles} color="#7c3aed" title="Waiting for approval" sub="Posts the autopilot drafted for you to approve" />
          <WaitingOnBackend
            what="This will list the posts the autopilot has drafted and scheduled, so you can approve them before they go out."
            needs={[
              "An autopilot that drafts posts and stores them as drafts",
              "GET a list of drafts: image, text, network and planned time",
              "POST to approve one draft, and to approve all",
              "PUT to edit or reschedule a draft before it posts",
            ]}
          />
        </section>

        <section className="card stack" style={{ flex: "2 1 540px", minWidth: 0, padding: "14px 0 4px", gap: 8 }}>
          <CardHead
            icon={Target}
            color="var(--green)"
            title="Ad campaigns"
            sub={
              campaigns.loading
                ? "Last 7 days"
                : `Last 7 days · ${amount(sumBy(ads, (c) => c.spend) ?? 0)} spent across ${ads.length} campaign${ads.length === 1 ? "" : "s"} · amounts as the backend sends them (no currency given)`
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
                    return (
                      <tr key={c.id}>
                        <td style={{ paddingLeft: 14, fontWeight: 600, maxWidth: 260 }}>
                          <span className="row">
                            {c.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
                            ) : (
                              <span className="pf" style={{ width: 28, height: 28, borderRadius: 6, background: NETWORK[c.platform]?.[1] || "#6b7080" }}>
                                {networkName(c.platform).slice(0, 1)}
                              </span>
                            )}
                            <span className="ellipsis">{c.name}</span>
                          </span>
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
          <div className="tiny" style={{ padding: "6px 14px 8px", borderTop: "1px solid var(--line-2)" }}>
            <span className="pill pill-orange" style={{ marginRight: 6 }}>Waiting on backend</span>
            AI budget actions (scale, test, pause) need an ads autopilot that decides them and an endpoint that returns each campaign&apos;s latest action.
          </div>
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
              <article key={p.id} className="card post">
                <div className="stack" style={{ padding: "10px 12px" }}>
                  <span className="tiny">{[shortDate(p.date), networkName(p.platform)].filter(Boolean).join(" · ")}</span>
                  <span className="ellipsis" style={{ fontSize: 13, fontWeight: 600, marginTop: -6 }}>
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>{p.title}</a>
                    ) : (
                      p.title
                    )}
                  </span>
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
              </article>
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

      {/* ── Inbox, followers, report ────────────────────────────────── */}
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

        <section className="card card-pad stack" style={{ flex: "1 1 300px", gap: 12 }}>
          <CardHead icon={Users} color="#7c3aed" title="Followers by platform" sub="Followers on each connected account, and this week's change" />
          <WaitingOnBackend
            what="This will show how many followers each connected account has, and how many it gained this week."
            needs={[
              "The follower count of each connected account (Facebook Page, Instagram, TikTok, YouTube, LinkedIn, X), read from each network",
              "A daily saved snapshot of those counts, so this week's growth can be worked out",
              "An endpoint returning, per account: followers now and followers 7 days ago",
            ]}
          />
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
