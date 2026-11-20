// app/(components)/insights/networkInsights.js
// ─────────────────────────────────────────────────────────────────────────────
// Everything the network insights page shows, worked out from ONE network's
// posts and the numbers the backend returned for them (postMetrics.js). No
// figure here is invented: a section with nothing real behind it returns
// null / [] and the page shows it as not available.
//
// What the backend gives (checked 2026-11-20): per-post totals — Facebook's
// post-metrics (shares, likes, comments, reach, views, clicks, ctr,
// video_views), TikTok's listing counts (view_count, like_count,
// comment_count). No account-level numbers (followers, page views), no
// audience, no history — so "vs previous period" compares the posts published
// in the previous period, and trends are drawn by publish day.

import { firstLine } from "@/app/(components)/composer/composerPlatforms";
import { metricLabel, numeric, postMetrics } from "@/(lib)/postMetrics";

const DAY = 86_400_000;

/** A metric's role, by the names networks use for it — first one present wins. */
export const ROLES = {
  views: { label: "Views", keys: ["views", "view_count", "viewCount", "impressions", "video_views", "plays"] },
  reach: { label: "Reach", keys: ["reach"] },
  likes: { label: "Likes", keys: ["likes", "like_count", "likeCount", "reactions"] },
  comments: { label: "Comments", keys: ["comments", "comment_count", "commentCount"] },
  shares: { label: "Shares", keys: ["shares", "share_count", "repost_count", "retweet_count"] },
  saves: { label: "Saves", keys: ["saves", "save_count", "saved"] },
  clicks: { label: "Link clicks", keys: ["clicks", "link_clicks"] },
};

/** Backend names that are people acting on a post — added up as Interactions. */
export const INTERACTION_KEY = /like|comment|share|save|reaction|repost|retweet|repl|favorite/i;

const dateOf = (p) => new Date(p.published_at || p.scheduled_at || 0).getTime() || 0;

/** A post's number for a role, or undefined. */
export function roleValue(post, role) {
  const m = postMetrics(post) || {};
  for (const k of ROLES[role].keys) {
    const v = numeric(m[k]);
    if (v !== undefined) return v;
  }
  return undefined;
}

/** Which backend key a role maps to for these posts (the first one any post sent). */
export function roleKey(posts, role) {
  for (const k of ROLES[role].keys)
    if (posts.some((p) => numeric(postMetrics(p)?.[k]) !== undefined)) return k;
  return null;
}

/** Sum of a post's interaction metrics; undefined when it sent none. */
export function interactionsOf(post) {
  const m = postMetrics(post) || {};
  return Object.keys(m)
    .filter((k) => INTERACTION_KEY.test(k))
    .reduce((t, k) => {
      const v = numeric(m[k]);
      return v === undefined ? t : (t ?? 0) + v;
    }, undefined);
}

/** Interactions ÷ reach (or ÷ views when there's no reach), as a %. */
export function engagementOf(post) {
  const i = interactionsOf(post);
  const base = roleValue(post, "reach") ?? roleValue(post, "views");
  return i !== undefined && base ? (i / base) * 100 : undefined;
}

const sum = (posts, fn) =>
  posts.reduce((t, p) => {
    const v = fn(p);
    return v === undefined ? t : (t ?? 0) + v;
  }, undefined);

const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : undefined);

/** What a post is, for the format groupings. */
export function formatOf(post) {
  if (["tiktok", "youtube"].includes(post.platform)) return "Video";
  const mt = String(post.media_type || "").toLowerCase();
  if (/video|reel/.test(mt) || numeric(postMetrics(post)?.video_views) !== undefined) return "Video";
  if (/carousel/.test(mt)) return "Carousel";
  if (post.image_url) return "Image";
  return "Text";
}

/** Posts published in [from, to). */
export const within = (posts, from, to) =>
  posts.filter((p) => p.status !== "scheduled" && dateOf(p) >= from && dateOf(p) < to);

// ── Period ──────────────────────────────────────────────────────────────────

/**
 * The period on screen and the one before it.
 * @param {number} days
 * @param {number} [now]
 */
export function periods(days, now = Date.now()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const to = end.getTime() + 1;
  const from = to - days * DAY;
  return { from, to, prevFrom: from - days * DAY, prevTo: from, days };
}

/**
 * How many days a period covers: the number picked, or for "all" — from the
 * oldest post to today.
 */
export function periodDays(posts, days, now = Date.now()) {
  if (days !== "all") return days;
  const oldest = posts.reduce((m, p) => Math.min(m, dateOf(p) || m), now);
  return Math.max(1, Math.ceil((now - oldest) / DAY) + 1);
}

// ── KPI cards ───────────────────────────────────────────────────────────────

/**
 * The six headline cards, each: { id, label, value, format, delta, deltaKind,
 * series, hint, available }. A card the backend can't fill is
 * { available: false, reason }.
 */
export function kpis(all, period) {
  const cur = within(all, period.from, period.to);
  const prev = within(all, period.prevFrom, period.prevTo);
  const dayIndex = (p) => Math.floor((dateOf(p) - period.from) / DAY);
  const series = (fn) => {
    const days = Array.from({ length: period.days }, () => 0);
    for (const p of cur) {
      const v = fn(p);
      const d = dayIndex(p);
      if (v !== undefined && d >= 0 && d < days.length) days[d] += v;
    }
    return days;
  };
  const pct = (a, b) => (a !== undefined && b ? ((a - b) / b) * 100 : undefined);

  const make = (id, label, fn, { rate = false, hint } = {}) => {
    const value = rate ? avg(cur.map(fn).filter((v) => v !== undefined)) : sum(cur, fn);
    const before = rate ? avg(prev.map(fn).filter((v) => v !== undefined)) : sum(prev, fn);
    if (value === undefined && !all.some((p) => fn(p) !== undefined)) return null;
    return {
      id,
      label,
      value,
      rate,
      hint,
      delta: rate ? (value !== undefined && before !== undefined ? value - before : undefined) : pct(value, before),
      deltaKind: rate ? "pts" : "%",
      series: series(fn),
      available: true,
    };
  };

  const reachKey = roleKey(all, "reach");
  const cards = [
    make("views", "Views", (p) => roleValue(p, "views"), { hint: roleKey(all, "views") }),
    make("reach", "Reach", (p) => roleValue(p, "reach"), { hint: reachKey }),
    make("likes", "Likes", (p) => roleValue(p, "likes"), { hint: roleKey(all, "likes") }),
    make("interactions", "Interactions", interactionsOf, { hint: "Likes, comments, shares and saves added up" }),
    make("comments", "Comments", (p) => roleValue(p, "comments"), { hint: roleKey(all, "comments") }),
    make("shares", "Shares", (p) => roleValue(p, "shares"), { hint: roleKey(all, "shares") }),
    make("engagement", "Engagement rate", engagementOf, {
      rate: true,
      hint: `Interactions ÷ ${reachKey ? "reach" : "views"}, averaged over posts`,
    }),
    make("clicks", "Link clicks", (p) => roleValue(p, "clicks"), { hint: roleKey(all, "clicks") }),
  ].filter(Boolean);

  // Reach and likes double up with Interactions when both are there — keep
  // the design's set: views, reach, interactions, engagement, clicks.
  const preferred = ["views", "reach", "interactions", "engagement", "clicks", "likes", "comments", "shares"];
  const chosen = preferred.map((id) => cards.find((c) => c.id === id)).filter(Boolean).slice(0, 5);
  return [
    ...chosen,
    {
      id: "followers",
      label: "Followers",
      available: false,
      reason: "The backend doesn't send account numbers yet",
    },
  ];
}

// ── Growth chart ────────────────────────────────────────────────────────────

/**
 * Per day in the period: posts published, and their views. Past two months
 * it's per month instead, so a long period stays readable.
 */
export function activity(all, period) {
  const cur = within(all, period.from, period.to);
  if (period.days > 62) {
    const months = [];
    const d = new Date(period.from);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    while (d.getTime() < period.to) {
      const start = d.getTime();
      d.setMonth(d.getMonth() + 1);
      const inMonth = cur.filter((p) => dateOf(p) >= start && dateOf(p) < d.getTime());
      const label = new Date(start).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      months.push({
        date: label,
        day: label,
        posts: inMonth.length,
        views: sum(inMonth, (p) => roleValue(p, "views")) ?? 0,
      });
    }
    return months;
  }
  return Array.from({ length: period.days }, (_, i) => {
    const start = period.from + i * DAY;
    const day = cur.filter((p) => dateOf(p) >= start && dateOf(p) < start + DAY);
    return {
      date: new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      day: new Date(start).getDate(),
      posts: day.length,
      views: sum(day, (p) => roleValue(p, "views")) ?? 0,
    };
  });
}

// ── Averages ────────────────────────────────────────────────────────────────

export function averages(all, period) {
  const cur = within(all, period.from, period.to);
  if (!cur.length) return [];
  const rows = [];
  const add = (label, total, per) => total !== undefined && rows.push({ label, value: per(total) });
  const inter = sum(cur, interactionsOf);
  const shares = sum(cur, (p) => roleValue(p, "shares"));
  add("Interactions per post", inter, (t) => t / cur.length);
  add("Daily interactions", inter, (t) => t / period.days);
  add("Shares per post", shares, (t) => t / cur.length);
  add("Shares per day", shares, (t) => t / period.days);
  add("Avg. reach per post", sum(cur, (p) => roleValue(p, "reach")), (t) => t / cur.length);
  add("Avg. views per post", sum(cur, (p) => roleValue(p, "views")), (t) => t / cur.length);
  return rows;
}

// ── What works ──────────────────────────────────────────────────────────────

const HEADLINE = [
  ["Under 24", (n) => n < 24],
  ["24 to 34", (n) => n >= 24 && n <= 34],
  ["35 to 48", (n) => n >= 35 && n <= 48],
  ["Over 48", (n) => n > 48],
];
const TIME_OF_DAY = [
  ["Morning", (h) => h >= 5 && h < 12],
  ["Afternoon", (h) => h >= 12 && h < 17],
  ["Evening", (h) => h >= 17 && h < 21],
  ["Night", (h) => h >= 21 || h < 5],
];

/**
 * Performance grouped by things the posts themselves tell us. Each group:
 * { title, sub, metric, rows: [{label, value, count}], lift } — or
 * { title, sub, available: false, reason } when it needs data we don't have.
 */
export function whatWorks(all, period) {
  const cur = within(all, period.from, period.to);
  const usesEngagement = cur.some((p) => engagementOf(p) !== undefined);
  const score = usesEngagement ? engagementOf : (p) => roleValue(p, "views");
  const metric = usesEngagement ? "engagement" : "views";

  const group = (title, sub, keyOf) => {
    const buckets = new Map();
    for (const p of cur) {
      const k = keyOf(p);
      const v = score(p);
      if (!k || v === undefined) continue;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(v);
    }
    // Best group first, as the design ranks them.
    const rows = [...buckets.entries()]
      .map(([label, vals]) => ({ label, value: avg(vals), count: vals.length }))
      .sort((a, b) => b.value - a.value);
    if (rows.length < 2) return { title, sub, available: false, reason: "Needs posts in at least two groups this period" };
    const best = rows[0].value;
    const worst = rows[rows.length - 1].value;
    return { title, sub, metric, rows, lift: worst ? ((best - worst) / worst) * 100 : undefined, available: true };
  };

  return [
    group("Format", "what was published", formatOf),
    group(
      "Headline length",
      "characters in the first line",
      (p) => {
        const n = firstLine(p.caption || p.project_title || "").length;
        return n ? HEADLINE.find(([, t]) => t(n))?.[0] : null;
      },
    ),
    group("Time of day", "when it went out", (p) => {
      const h = new Date(dateOf(p)).getHours();
      return TIME_OF_DAY.find(([, t]) => t(h))?.[0];
    }),
    { title: "Layout", sub: "which archetype the generator used", available: false, reason: "Needs each post linked to the design it came from" },
    { title: "Accent colour", sub: "the one non-ground colour", available: false, reason: "Needs each post linked to the design it came from" },
    { title: "Call to action", sub: "wording on the button", available: false, reason: "Needs each post linked to the design it came from" },
  ];
}

// ── Best performer, best time, format split ─────────────────────────────────

export function bestPerformer(all, period) {
  const cur = within(all, period.from, period.to);
  const ranked = cur
    .map((p) => ({ p, s: engagementOf(p) ?? roleValue(p, "views") }))
    .filter((x) => x.s !== undefined)
    .sort((a, b) => b.s - a.s);
  return ranked[0]?.p || null;
}

export const HOUR_ROWS = [6, 8, 10, 13, 17, 20];
const hourRow = (h) => (h >= 5 && h < 7 ? 6 : h < 9 && h >= 7 ? 8 : h >= 9 && h < 12 ? 10 : h >= 12 && h < 15 ? 13 : h >= 15 && h < 19 ? 17 : 20);

/**
 * Average interactions (or views) of the posts published in each weekday ×
 * time slot — the brand's own results. Cells with no post are null.
 * @returns {{ grid: (number|null)[][], max: number, metric: string, posts: number }}
 */
export function bestTimes(all, period) {
  const cur = within(all, period.from, period.to);
  const usesInter = cur.some((p) => interactionsOf(p) !== undefined);
  const val = usesInter ? interactionsOf : (p) => roleValue(p, "views");
  const cells = HOUR_ROWS.map(() => Array.from({ length: 7 }, () => []));
  let counted = 0;
  for (const p of cur) {
    const v = val(p);
    if (v === undefined) continue;
    const d = new Date(dateOf(p));
    const col = (d.getDay() + 6) % 7; // Monday first
    cells[HOUR_ROWS.indexOf(hourRow(d.getHours()))][col].push(v);
    counted++;
  }
  const grid = cells.map((row) => row.map((vals) => (vals.length ? Math.round(avg(vals)) : null)));
  const max = Math.max(0, ...grid.flat().filter((v) => v !== null));
  return { grid, max, metric: usesInter ? "interactions" : "views", posts: counted };
}

/** Share of views by format. */
export function formatShare(all, period) {
  const cur = within(all, period.from, period.to);
  const totals = new Map();
  for (const p of cur) {
    const v = roleValue(p, "views");
    if (v === undefined) continue;
    totals.set(formatOf(p), (totals.get(formatOf(p)) || 0) + v);
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];
  return [...totals.entries()]
    .map(([name, v]) => ({ name, value: v, share: (v / total) * 100 }))
    .sort((a, b) => b.value - a.value);
}

// ── Reading the period ──────────────────────────────────────────────────────

const fmt = (n) => Math.round(n).toLocaleString();

/** Plain-language findings — each one only when the numbers support it. */
export function readings(all, period) {
  const cur = within(all, period.from, period.to);
  const out = [];
  const share = formatShare(all, period);
  const byFormat = (f) => cur.filter((p) => formatOf(p) === f);
  const avgViews = (ps) => avg(ps.map((p) => roleValue(p, "views")).filter((v) => v !== undefined));
  const v = avgViews(byFormat("Video"));
  const i = avgViews(byFormat("Image"));
  if (v && i && Math.abs(v / i - 1) > 0.2) {
    const [hi, lo, ratio] = v > i ? ["Videos", "images", v / i] : ["Images", "videos", i / v];
    out.push(
      `${hi} out-perform ${lo} ${ratio.toFixed(1)} to 1 on views per post. You published ${byFormat("Video").length} video${byFormat("Video").length === 1 ? "" : "s"} and ${byFormat("Image").length} image${byFormat("Image").length === 1 ? "" : "s"}.`,
    );
  } else if (share[0] && share.length > 1) {
    out.push(`${share[0].name} posts brought ${Math.round(share[0].share)}% of your views this period.`);
  }

  const head = whatWorks(all, period).find((g) => g.title === "Headline length" && g.available);
  if (head)
    out.push(
      `Posts with a first line ${head.rows[0].label.toLowerCase()} characters did best — ${head.metric === "engagement" ? `${head.rows[0].value.toFixed(1)}% engagement` : `${fmt(head.rows[0].value)} views`} on average, against ${head.metric === "engagement" ? `${head.rows.at(-1).value.toFixed(1)}%` : fmt(head.rows.at(-1).value)} for ${head.rows.at(-1).label.toLowerCase()}.`,
    );

  const times = bestTimes(all, period);
  if (times.posts >= 3 && times.max) {
    const r = times.grid.findIndex((row) => row.includes(times.max));
    const c = times.grid[r].indexOf(times.max);
    const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][c];
    out.push(
      `${day} around ${String(HOUR_ROWS[r]).padStart(2, "0")}:00 is your strongest slot so far — ${fmt(times.max)} ${times.metric} per post. Based on ${times.posts} posts, so treat it as a lead, not a rule.`,
    );
  }

  // The best post, against the average — on the same measure it was ranked by.
  const best = bestPerformer(all, period);
  if (best && cur.length > 2) {
    const byEngagement = engagementOf(best) !== undefined;
    const measure = byEngagement ? engagementOf : (p) => roleValue(p, "views");
    const mine = measure(best);
    const typical = avg(cur.map(measure).filter((x) => x !== undefined));
    if (mine && typical && mine / typical >= 1.2)
      out.push(
        byEngagement
          ? `Your best post's engagement (${mine.toFixed(1)}%) was ${(mine / typical).toFixed(1)}× your average of ${typical.toFixed(1)}% this period.`
          : `Your best post got ${(mine / typical).toFixed(1)}× the views of your average post this period.`,
      );
  }

  return out;
}

// ── What the API returned ───────────────────────────────────────────────────

/**
 * Every metric name the backend returned for this network's posts, with the
 * period total (or average for a rate) — the page's "Everything this API
 * returns", built from what actually came back.
 */
export function returnedFields(all, period) {
  const cur = within(all, period.from, period.to);
  const keys = [];
  for (const p of all) for (const k of Object.keys(postMetrics(p) || {})) if (!keys.includes(k)) keys.push(k);
  return keys.map((key) => {
    const vals = cur.map((p) => numeric(postMetrics(p)?.[key])).filter((v) => v !== undefined);
    const rate = key === "ctr";
    const value = vals.length ? (rate ? avg(vals) : vals.reduce((a, b) => a + b, 0)) : undefined;
    return {
      key,
      label: metricLabel(key),
      value: value === undefined ? "—" : rate ? `${value.toFixed(2)}%` : fmt(value),
      reporting: vals.length,
    };
  });
}
