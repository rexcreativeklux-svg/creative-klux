// requestCache.js
// ─────────────────────────────────────────────────────────────────────────────
// A tiny in-memory cache for GET requests the app makes over and over.
//
// Every backend round trip here costs 1–2.5 s, and the Social / Ads sections
// asked for the same things repeatedly: the sidebar, the Connections badge and
// the page each read the integrations catalogue, and moving between
// Publishing, Calendar and Analytics fetched every post and every post's stats
// again from scratch. This keeps each answer for a short while:
//
//   · requests for the same key while one is in flight share it (no duplicates);
//   · a settled answer is reused until it is `ttlMs` old;
//   · a failure is never kept — the next caller tries again;
//   · `fresh: true` (a Refresh button) skips the cache and stores the new answer;
//   · invalidate(prefix) drops entries after something changed them (a connect,
//     a disconnect, a delete).
//
// Memory only, per tab: a reload always goes back to the backend.

const entries = new Map(); // key → { promise, at }

/**
 * @template T
 * @param {string} key
 * @param {number} ttlMs
 * @param {() => Promise<T>} load
 * @param {{ fresh?: boolean }} [options]
 * @returns {Promise<T>}
 */
export function cached(key, ttlMs, load, { fresh = false } = {}) {
  const hit = entries.get(key);
  if (!fresh && hit && Date.now() - hit.at < ttlMs) return hit.promise;

  const promise = load();
  entries.set(key, { promise, at: Date.now() });
  // Don't keep a failure, and don't let a stale request evict a newer one.
  promise.catch(() => {
    if (entries.get(key)?.promise === promise) entries.delete(key);
  });
  return promise;
}

/** Drop every entry whose key starts with `prefix` (all of them with none). */
export function invalidate(prefix = "") {
  for (const key of entries.keys()) if (key.startsWith(prefix)) entries.delete(key);
}
