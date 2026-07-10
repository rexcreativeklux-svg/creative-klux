// Turn any tool image source (an uploaded File, a Blob, or a remote image URL)
// into an ImageBitmap ready to transfer into a worker.

// Hosts we KNOW don't send `Access-Control-Allow-Origin`, so a direct browser
// fetch would always be blocked by CORS. We skip the doomed attempt for these
// (avoiding a red console error on every run) and go straight to the proxy.
// Add the app's own CDN host here if it turns out to serve images without CORS
// (e.g. "images.weviy.com") — the try-direct-then-proxy path below already
// handles unknown hosts safely, this list is only to avoid a noisy console error.
const NO_CORS_HOSTS = [];

// True for our same-origin proxy route (used to read cross-origin image bytes
// server-side, where CORS doesn't apply).
function proxiedUrl(url) {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

/**
 * Fetch a remote image as a Blob, tolerating hosts that don't send CORS headers.
 *
 * Sample/result images can live on hosts that DO send permissive CORS headers
 * (Unsplash, Pexels) or ones that DON'T (a CDN fronted with no
 * `Access-Control-Allow-Origin`). For a known no-CORS host we go straight to our
 * same-origin `/api/proxy-image` route (which reads the bytes server-side, where
 * CORS doesn't apply); for everything else we try the fast direct fetch first and
 * only fall back to the proxy if it's blocked. This keeps every on-device AI tool
 * working no matter which host an image comes from — without spamming a CORS error
 * on hosts we already know need the proxy.
 *
 * @param {string} url
 * @returns {Promise<Blob>}
 */
async function fetchImageBlob(url) {
  let host = "";
  try {
    host = new URL(url, window.location.origin).hostname;
  } catch {
    // Not an absolute URL (e.g. a same-origin path) — the direct fetch handles it.
  }

  // Known no-CORS host: skip the doomed direct fetch, use the proxy directly.
  if (NO_CORS_HOSTS.includes(host)) {
    const res = await fetch(proxiedUrl(url));
    if (!res.ok) {
      throw new Error("Couldn't load that image — please upload it instead.");
    }
    return await res.blob();
  }

  // Everything else: fast path first (hosts that send CORS headers).
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) return await res.blob();
    console.warn(`↩️ Direct image fetch returned HTTP ${res.status}, trying proxy:`, url);
  } catch (err) {
    // A CORS block surfaces as a TypeError ("Failed to fetch") — not res.ok.
    console.warn("↩️ Direct image fetch blocked (CORS?), trying proxy:", err?.message || err);
  }

  // Fallback: same-origin proxy fetches the bytes server-side (no CORS needed).
  const res = await fetch(proxiedUrl(url));
  if (!res.ok) {
    throw new Error("Couldn't load that image — please upload it instead.");
  }
  return await res.blob();
}

/**
 * @param {File|Blob|string} source
 * @returns {Promise<ImageBitmap>}
 */
export async function sourceToBitmap(source) {
  const blob = typeof source === "string" ? await fetchImageBlob(source) : source;
  return createImageBitmap(blob);
}
