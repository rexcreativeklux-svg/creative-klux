// postMetrics.js
// ─────────────────────────────────────────────────────────────────────────────
// Social post metrics, exactly as the backend names them.
//
// creatives/post-metrics answers `{ metrics: { <name>: <value>, … } }` and the
// names differ per network (checked 2026-11-19: Facebook sends shares, likes,
// comments, reach, views, clicks, video_views, ctr — no impressions; Pinterest
// and TikTok send `metrics: null` with an `unavailable` reason). Nothing here
// renames, maps or invents a metric: a page shows the keys that came back, under
// the name the backend gave, and a network that didn't send one shows a dash.

/** `video_views` → "Video views". Only the spelling is tidied, never the name. */
export function metricLabel(key) {
  if (key === "ctr") return "CTR";
  const words = String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Keep the scalar entries of a backend `metrics` object; null when none. */
export function readMetrics(metrics) {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics))
    return null;
  const out = {};
  for (const [key, value] of Object.entries(metrics)) {
    if (typeof value === "number" || (typeof value === "string" && value !== ""))
      out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

/** A number the backend sent, or undefined (numeric strings count). */
export const numeric = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value)))
    return Number(value);
  return undefined;
};

/** How a value is shown. `ctr` is a percentage; the rest are counts. */
export function formatMetric(key, value) {
  if (value === undefined || value === null) return undefined;
  if (key === "ctr") return `${value}%`;
  const n = numeric(value);
  return n === undefined ? String(value) : n.toLocaleString();
}

/**
 * The metrics to show for a post: the post-metrics answer when it carried
 * numbers, else whatever the post's own listing carried (`listMetrics` — e.g.
 * TikTok's view_count / like_count / comment_count). null when neither did.
 */
export function postMetrics(post) {
  return post?.stats?.metrics ?? post?.listMetrics ?? null;
}

/** Why the backend has no numbers for this post, if it said so. */
export function unavailableReason(post) {
  return postMetrics(post) ? undefined : post?.stats?.unavailable_reason;
}

/** Every metric name any of these posts carries, in the order first seen. */
export function metricKeysOf(posts) {
  const keys = [];
  for (const post of posts) {
    for (const key of Object.keys(postMetrics(post) || {})) {
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys;
}

/** A metric that makes sense to add up across posts (a rate does not). */
export const isSummable = (key) => key !== "ctr";

/**
 * Sum one metric over posts, counting only the numbers the backend sent.
 * undefined when no post sent it — a total of 0 would claim the posts got none.
 */
export function sumMetric(posts, key) {
  return posts.reduce((total, post) => {
    const v = numeric(postMetrics(post)?.[key]);
    return v === undefined ? total : (total ?? 0) + v;
  }, undefined);
}
