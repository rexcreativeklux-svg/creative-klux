// postInsights.js
// ─────────────────────────────────────────────────────────────────────────────
// What the post-insights panel shows for one social post, laid out the way a
// network's own insights page is: an Overview row, a Views card compared with
// the account's recent posts, and an Interactions card.
//
// Every figure comes from numbers the backend sent (postMetrics.js) — the
// metric names stay the backend's. The only things worked out here are:
//   · Interactions — the sum of the interaction metrics the post DID send
//     (likes, comments, shares, saves…); undefined if it sent none of them.
//   · "Typical" — the median of the same figure on the account's most recent
//     other posts on that network that reported it; undefined with none.

import {
  formatMetric,
  metricLabel,
  numeric,
  postMetrics,
} from "@/(lib)/postMetrics";

/** Backend metric names that are people acting on the post. */
export const INTERACTION_KEY =
  /like|comment|share|save|reaction|repost|retweet|repl|favorite/i;

/** The names a network uses for "views", most specific first. */
const VIEW_KEYS = [
  "views",
  "impressions",
  "impression_count",
  "view_count",
  "viewCount",
  "video_views",
  "plays",
];

/** How many earlier posts count as "recent" for the comparison. */
const RECENT = 10;

const median = (nums) => {
  if (!nums.length) return undefined;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const dateOf = (p) =>
  new Date(p.published_at || p.scheduled_at || 0).getTime() || 0;

/** Sum of the interaction metrics a post sent; undefined when it sent none. */
function interactionTotal(post) {
  const m = postMetrics(post) || {};
  return Object.keys(m)
    .filter((k) => INTERACTION_KEY.test(k))
    .reduce((t, k) => {
      const v = numeric(m[k]);
      return v === undefined ? t : (t ?? 0) + v;
    }, undefined);
}

/**
 * "more" | "fewer" | "about the same" — within 10% reads as the same.
 * undefined when either side is missing.
 */
function compare(value, typical) {
  if (value === undefined || typical === undefined) return undefined;
  if (typical === 0) return value === 0 ? "about the same" : "more";
  const ratio = value / typical;
  if (ratio > 1.1) return "more";
  if (ratio < 0.9) return "fewer";
  return "about the same";
}

/**
 * @param {object}   post     The row being shown.
 * @param {object[]} allPosts Every row on the page — the peers come from here.
 * @returns {{
 *   overview: Array<{label: string, value: any, hint?: string}>,
 *   views: null | {label: string, value?: number, typical?: number, verdict?: string},
 *   interactions: null | {total?: number, typical?: number, verdict?: string,
 *                         items: Array<{label: string, value: any, hint?: string}>},
 *   counts: {likes?: string, comments?: string, shares?: string},
 * }}
 */
export function buildPostInsights(post, allPosts = []) {
  const m = postMetrics(post) || {};
  const keys = Object.keys(m);
  const interactionKeys = keys.filter((k) => INTERACTION_KEY.test(k));
  const viewKey = VIEW_KEYS.find((k) => k in m);

  // The account's most recent other posts on this network published before
  // this one (or simply the most recent, for a post with no date).
  const mine = dateOf(post);
  const peers = allPosts
    .filter(
      (p) =>
        p.id !== post.id &&
        p.platform === post.platform &&
        postMetrics(p) &&
        (!mine || dateOf(p) <= mine),
    )
    .sort((a, b) => dateOf(b) - dateOf(a))
    .slice(0, RECENT);

  const total = interactionTotal(post);
  const typicalTotal = median(
    peers.map(interactionTotal).filter((v) => v !== undefined),
  );

  const views = viewKey
    ? (() => {
        const value = numeric(m[viewKey]);
        const typical = median(
          peers
            .map((p) => numeric(postMetrics(p)?.[viewKey]))
            .filter((v) => v !== undefined),
        );
        return {
          label: metricLabel(viewKey),
          value,
          typical,
          verdict: compare(value, typical),
        };
      })()
    : null;

  const entry = (k) => ({
    label: metricLabel(k),
    value: formatMetric(k, m[k]),
    hint: k,
  });

  // Overview: views first, then reach, the interactions total, then the rest.
  const rest = keys.filter((k) => k !== viewKey && !INTERACTION_KEY.test(k));
  const reachFirst = [
    ...rest.filter((k) => k === "reach"),
    ...rest.filter((k) => k !== "reach"),
  ];
  const overview = [
    ...(viewKey ? [entry(viewKey)] : []),
    ...reachFirst.slice(0, 1).map(entry),
    ...(interactionKeys.length
      ? [
          {
            label: "Interactions",
            value: total === undefined ? undefined : total.toLocaleString(),
            hint: `Sum of ${interactionKeys.map(metricLabel).join(", ").toLowerCase()}`,
          },
        ]
      : []),
    ...reachFirst.slice(1).map(entry),
  ];

  const pick = (...names) => {
    const k = names.find((n) => n in m);
    return k ? formatMetric(k, m[k]) : undefined;
  };

  return {
    overview,
    views,
    interactions: interactionKeys.length
      ? {
          total,
          typical: typicalTotal,
          verdict: compare(total, typicalTotal),
          items: interactionKeys.map(entry),
        }
      : null,
    counts: {
      likes: pick("likes", "reactions", "like_count", "likeCount"),
      comments: pick("comments", "comment_count", "commentCount"),
      shares: pick("shares", "share_count"),
    },
  };
}
