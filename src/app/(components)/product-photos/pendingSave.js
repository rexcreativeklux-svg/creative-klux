// Pending "save to gallery" persistence for logged-out users.
//
// Flow: a guest hits Save → the result blob + meta are stashed here (in
// CacheStorage — blob-friendly, survives the login page-reload, unlike
// sessionStorage's ~5 MB string limit) → redirect to
// /login?returnTo=/product-photos?resume=<toolId> → after login the page
// re-opens the tool, the modal takes the stash (one-shot) and completes the
// save automatically.

const CACHE_NAME = "klux-pending-save";
const ENTRY_URL = "/__klux-pending-save__"; // synthetic request key
const META_HEADER = "x-klux-pending-meta";
const MAX_AGE_MS = 15 * 60 * 1000; // stale stashes are discarded

/**
 * Stash a result blob + meta before redirecting a guest to log in.
 *
 * @param {Blob} blob The full-res result to save after login.
 * @param {{toolId: string, size?: string, quality?: string}} meta
 */
export async function stashPendingSave(blob, meta) {
  const cache = await caches.open(CACHE_NAME);
  const payload = { ...meta, ts: Date.now() };
  await cache.put(
    ENTRY_URL,
    new Response(blob, {
      headers: {
        "Content-Type": blob.type || "image/png",
        [META_HEADER]: JSON.stringify(payload),
      },
    }),
  );
  console.log("🔖 [pending-save] stashed for", payload.toolId);
}

/**
 * Take (read + delete — one-shot) the pending save for a tool, if it exists
 * and is fresh. Returns null when there's nothing to resume.
 *
 * @param {string} toolId Only a stash created by this tool is returned.
 * @returns {Promise<{blob: Blob, meta: object}|null>}
 */
export async function takePendingSave(toolId) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(ENTRY_URL);
    if (!response) return null;

    let meta = null;
    try {
      meta = JSON.parse(response.headers.get(META_HEADER) || "null");
    } catch {
      meta = null;
    }
    const fresh = meta && Date.now() - (meta.ts || 0) < MAX_AGE_MS;
    if (!fresh || meta.toolId !== toolId) {
      // Wrong tool or stale — a stale stash is dead weight either way.
      if (!fresh) await cache.delete(ENTRY_URL);
      return null;
    }

    const blob = await response.blob();
    await cache.delete(ENTRY_URL); // one-shot
    return { blob, meta };
  } catch (err) {
    console.warn("⚠️ [pending-save] couldn't read the stash:", err?.message);
    return null;
  }
}
