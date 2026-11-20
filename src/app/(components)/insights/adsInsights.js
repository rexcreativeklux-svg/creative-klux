// app/(components)/insights/adsInsights.js
// ─────────────────────────────────────────────────────────────────────────────
// Everything the ads insights page shows, worked out from ONE ad network's
// campaigns and the numbers creatives/campaign-metrics returned for them over
// the period — under the backend's own names. Nothing is invented: a section
// with nothing real behind it comes back null / [] / { available: false }.
//
// What the backend gives (checked 2026-11-20): campaigns (name, status,
// objective, created_time, thumbnail, daily_budget) and, per campaign, totals
// over the last N days (1–90): Meta — spend, impressions, reach, clicks, ctr,
// cpc, likes, shares, comments, conversions; Google — spend, impressions,
// clicks, ctr, cpc, conversions. No day-by-day rows, no ad sets / ads /
// keywords, no audience.
//
// "vs previous period" is real: the page also asks for 2N days, and the
// previous period is (2N days) − (N days) for every additive number.
//
// Each campaign row carries `cur` and `prev` (metric maps) and `returned`
// (every name the backend sent, null ones included).

const ADDITIVE = new Set(["spend", "impressions", "reach", "clicks", "conversions", "likes", "shares", "comments", "swipes", "video_views"]);
export const isAdditive = (key) => ADDITIVE.has(key);

/** Totals over campaigns; a key no campaign sent stays undefined. */
export function totals(campaigns, which = "cur") {
  const t = {};
  for (const c of campaigns) {
    for (const [k, v] of Object.entries(c[which] || {})) {
      if (!isAdditive(k) || typeof v !== "number") continue;
      t[k] = (t[k] ?? 0) + v;
    }
  }
  return t;
}

/** The ratios worked out from totals — only where both sides were sent. */
export function derived(t) {
  const has = (k) => t[k] !== undefined;
  return {
    ctr: has("clicks") && t.impressions ? (t.clicks / t.impressions) * 100 : undefined,
    cpc: has("spend") && t.clicks ? t.spend / t.clicks : undefined,
    cpm: has("spend") && t.impressions ? (t.spend / t.impressions) * 1000 : undefined,
    costPerResult: has("spend") && t.conversions ? t.spend / t.conversions : undefined,
    convRate: has("conversions") && t.clicks ? (t.conversions / t.clicks) * 100 : undefined,
    frequency: has("impressions") && t.reach ? t.impressions / t.reach : undefined,
  };
}

const pct = (a, b) => (a !== undefined && b ? ((a - b) / b) * 100 : undefined);

/**
 * The six headline cards, in the design's set for each network.
 * @param {object[]} campaigns
 * @param {string} platform
 * @param {boolean} hasPrev  Whether the previous period was fetched.
 */
export function adKpis(campaigns, platform, hasPrev) {
  const T = totals(campaigns, "cur");
  const P = hasPrev ? totals(campaigns, "prev") : {};
  const D = derived(T);
  const DP = hasPrev ? derived(P) : {};
  const sent = (k) => campaigns.some((c) => c.returned?.includes(k));

  const card = (id, label, value, prev, extra = {}) => ({
    id,
    label,
    value,
    delta: hasPrev ? (extra.deltaKind === "pts" ? (value !== undefined && prev !== undefined ? value - prev : undefined) : pct(value, prev)) : undefined,
    deltaKind: "%",
    noDelta: hasPrev ? "nothing to compare" : "no comparison over 90 days",
    available: true,
    ...extra,
  });
  const na = (id, label, reason) => ({ id, label, available: false, reason });

  const cards = {
    spend: sent("spend") ? card("spend", "Spend", T.spend, P.spend, { format: "money", hint: "spend — in the ad account's currency" }) : na("spend", "Spend", "Not returned by the backend"),
    impressions: sent("impressions") ? card("impressions", "Impressions", T.impressions, P.impressions, { hint: "impressions" }) : na("impressions", "Impressions", "Not returned by the backend"),
    reach: sent("reach") ? card("reach", "Reach", T.reach, P.reach, { hint: "reach" }) : na("reach", "Reach", "Not returned by the backend"),
    clicks: sent("clicks") ? card("clicks", "Clicks", T.clicks, P.clicks, { hint: "clicks" }) : na("clicks", "Clicks", "Not returned by the backend"),
    ctr: sent("clicks") && sent("impressions")
      ? card("ctr", "CTR", D.ctr, DP.ctr, { format: "pct", deltaKind: "pts", hint: "Clicks ÷ impressions" })
      : na("ctr", "CTR", "Needs clicks and impressions"),
    conversions: sent("conversions") ? card("conversions", "Conversions", T.conversions, P.conversions, { hint: "conversions" }) : na("conversions", "Conversions", "Not returned by the backend"),
    costPerResult: sent("conversions")
      ? card(
          "costPerResult",
          platform === "meta_ads" ? "Cost per result" : "Cost per conv.",
          D.costPerResult,
          DP.costPerResult,
          { format: "money", lowerIsBetter: true, hint: "Spend ÷ conversions", noDelta: T.conversions ? undefined : "no conversions reported" },
        )
      : na("costPerResult", "Cost per result", "The backend doesn't return conversions for this network"),
  };
  // A cost-per card whose value is missing because there were no conversions.
  if (cards.costPerResult.available && cards.costPerResult.value === undefined)
    cards.costPerResult.noDelta = "no conversions reported";

  const order =
    platform === "meta_ads"
      ? ["spend", "impressions", "reach", "clicks", "ctr", "costPerResult"]
      : ["spend", "impressions", "clicks", "ctr", "conversions", "costPerResult"];
  return order.map((id) => cards[id]);
}

/** The averages row under the charts. */
export function adAverages(campaigns, days) {
  const T = totals(campaigns, "cur");
  const D = derived(T);
  const rows = [];
  const add = (label, value, format) => value !== undefined && rows.push({ label, value, format });
  add("Cost per click", D.cpc, "money");
  add("Cost per conversion", D.costPerResult, "money");
  add("CPM", D.cpm, "money");
  add("Conversion rate", D.convRate, "pct");
  add("Daily spend", T.spend !== undefined ? T.spend / days : undefined, "money");
  add("Frequency", D.frequency, "ratio");
  return rows;
}

const BUDGET = [
  ["Under 1,000/day", (b) => b < 1000],
  ["1,000–2,499/day", (b) => b >= 1000 && b < 2500],
  ["2,500+/day", (b) => b >= 2500],
];

const nice = (code = "") =>
  String(code)
    .replace(/^OUTCOME_/, "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

/**
 * Campaigns grouped by what they are, with the CTR each group earned
 * (clicks ÷ impressions over the group). Design-attribute groups need each
 * ad linked back to the creative it came from.
 */
export function adWhatWorks(campaigns) {
  const group = (title, sub, keyOf) => {
    const buckets = new Map();
    for (const c of campaigns) {
      const k = keyOf(c);
      const im = c.cur?.impressions;
      if (!k || !im) continue;
      const b = buckets.get(k) || { clicks: 0, impressions: 0, count: 0 };
      b.clicks += c.cur?.clicks || 0;
      b.impressions += im;
      b.count += 1;
      buckets.set(k, b);
    }
    const rows = [...buckets.entries()]
      .map(([label, b]) => ({ label, value: (b.clicks / b.impressions) * 100, count: b.count }))
      .sort((a, b) => b.value - a.value);
    if (rows.length < 2)
      return { title, sub, available: false, reason: "Needs campaigns with impressions in at least two groups this period" };
    const worst = rows[rows.length - 1].value;
    return { title, sub, rows, lift: worst ? ((rows[0].value - worst) / worst) * 100 : undefined, available: true };
  };
  const linked = "Needs each ad linked to the design it came from";
  return [
    group("Objective", "what the campaign optimises for", (c) => (c.objective ? nice(c.objective) : null)),
    group("Daily budget", "what it was allowed to spend", (c) => {
      const b = Number(c.daily_budget);
      return Number.isFinite(b) && b > 0 ? BUDGET.find(([, t]) => t(b))?.[0] : null;
    }),
    { title: "Layout", sub: "which archetype the generator used", available: false, reason: linked },
    { title: "Accent colour", sub: "the one non-ground colour", available: false, reason: linked },
    { title: "Headline length", sub: "characters in the main line", available: false, reason: linked },
    { title: "Format", sub: "what was uploaded", available: false, reason: "The backend lists campaigns, not their ads or formats" },
  ];
}

/** The campaign with the best CTR (among ones that were shown), else the most clicks. */
export function bestCampaign(campaigns) {
  const shown = campaigns.filter((c) => c.cur?.impressions > 0);
  if (!shown.length) return null;
  return [...shown].sort(
    (a, b) => (b.cur.clicks || 0) / b.cur.impressions - (a.cur.clicks || 0) / a.cur.impressions || (b.cur.clicks || 0) - (a.cur.clicks || 0),
  )[0];
}

/** Share of spend by objective. */
export function spendShare(campaigns) {
  const m = new Map();
  for (const c of campaigns) {
    const s = c.cur?.spend;
    if (!s) continue;
    const k = c.objective ? nice(c.objective) : "Other";
    m.set(k, (m.get(k) || 0) + s);
  }
  const total = [...m.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];
  return [...m.entries()].map(([name, value]) => ({ name, value, share: (value / total) * 100 })).sort((a, b) => b.value - a.value);
}

const fmt = (n) => Math.round(n).toLocaleString();

/** Plain-language findings — each only when the numbers support it. */
export function adReadings(campaigns, days, hasPrev) {
  const out = [];
  const active = campaigns.filter((c) => /active|enabled|running/i.test(c.status || ""));
  const dark = active.filter((c) => !c.cur?.impressions);
  if (active.length && dark.length)
    out.push(
      `${dark.length} of your ${active.length} active campaign${active.length === 1 ? "" : "s"} had no impressions in the last ${days} days — they're switched on but not being shown. Check their budget, schedule and review status.`,
    );

  const best = bestCampaign(campaigns);
  const T = totals(campaigns, "cur");
  const D = derived(T);
  if (best && D.ctr) {
    const bestCtr = ((best.cur.clicks || 0) / best.cur.impressions) * 100;
    if (bestCtr >= D.ctr * 1.2)
      out.push(`“${best.project_title}” has the best click-through at ${bestCtr.toFixed(2)}% — ${(bestCtr / D.ctr).toFixed(1)}× the account's ${D.ctr.toFixed(2)}%.`);
  }

  if (hasPrev) {
    const P = totals(campaigns, "prev");
    const DP = derived(P);
    const spendChange = pct(T.spend, P.spend);
    const cprChange = pct(D.costPerResult, DP.costPerResult);
    if (spendChange !== undefined && cprChange !== undefined)
      out.push(
        `Spend ${spendChange >= 0 ? "rose" : "fell"} ${Math.abs(Math.round(spendChange))}% while cost per result ${cprChange <= 0 ? "fell" : "rose"} ${Math.abs(Math.round(cprChange))}% — ${cprChange <= 0 ? "the money is buying results more cheaply" : "results are getting more expensive"}.`,
      );
    else if (spendChange !== undefined)
      out.push(`Spend ${spendChange >= 0 ? "rose" : "fell"} ${Math.abs(Math.round(spendChange))}% against the previous ${days} days.`);
  }

  if (T.spend && !T.conversions && campaigns.some((c) => c.returned?.includes("conversions")))
    out.push(`${fmt(T.spend)} was spent with no conversions reported. If you expect sales or sign-ups, check that conversion tracking is set up for this account.`);

  return out;
}

/** Every metric name the backend returned for these campaigns, with the period's figure. */
export function adFields(campaigns) {
  const names = [];
  for (const c of campaigns) for (const k of c.returned || []) if (!names.includes(k)) names.push(k);
  return names.map((key) => {
    const vals = campaigns.map((c) => c.cur?.[key]).filter((v) => typeof v === "number");
    if (!vals.length) return { key, value: "returned empty", empty: true };
    const value = isAdditive(key) ? vals.reduce((a, b) => a + b, 0) : vals.reduce((a, b) => a + b, 0) / vals.length;
    return { key, value, additive: isAdditive(key), count: vals.length };
  });
}

export const objectiveLabel = nice;
