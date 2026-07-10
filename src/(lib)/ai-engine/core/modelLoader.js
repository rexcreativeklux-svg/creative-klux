// Model file loader with a browser-side cache. First use downloads the .onnx
// file (with byte-level progress so the UI can show a real bar); after that it
// comes straight out of CacheStorage — instant and offline. Works in workers
// and the main thread alike.

import { MODEL_CACHE_NAME } from "../models";

/**
 * Load a model file's bytes, caching it in CacheStorage after first download.
 *
 * @param {string} url Same-origin (or CORS-enabled) model URL.
 * @param {object} [opts]
 * @param {(info: {loaded:number, total:number, cached:boolean}) => void} [opts.onProgress]
 *   Called with download progress. `cached: true` fires once when the model was
 *   already local (so the UI can skip the "downloading" message entirely).
 * @returns {Promise<ArrayBuffer>}
 */
export async function loadModelBytes(url, { onProgress } = {}) {
  const cache = await openCache();

  if (cache) {
    const hit = await cache.match(url);
    if (hit) {
      console.log(`📦 AI engine: model served from cache — ${url}`);
      const bytes = await hit.arrayBuffer();
      onProgress?.({ loaded: bytes.byteLength, total: bytes.byteLength, cached: true });
      return bytes;
    }
  }

  console.log(`📡 AI engine: downloading model (one-time) — ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Couldn't download the AI model (HTTP ${res.status}). ` +
        "If you're developing locally, run `npm run models` first.",
    );
  }

  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body?.getReader();

  // No readable stream (very old browser) — buffer it in one go.
  if (!reader) {
    const bytes = await res.arrayBuffer();
    await putInCache(cache, url, bytes);
    onProgress?.({ loaded: bytes.byteLength, total: bytes.byteLength, cached: false });
    return bytes;
  }

  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress?.({ loaded, total, cached: false });
  }

  // Stitch the chunks into one buffer for both the cache and the caller.
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  await putInCache(cache, url, bytes.buffer);
  console.log(`✅ AI engine: model downloaded and cached (${(loaded / 1e6).toFixed(1)} MB)`);
  return bytes.buffer;
}

/** CacheStorage is unavailable in insecure contexts — degrade to no caching. */
async function openCache() {
  try {
    if (typeof caches !== "undefined") return await caches.open(MODEL_CACHE_NAME);
  } catch (err) {
    console.warn("⚠️ AI engine: CacheStorage unavailable, model won't persist:", err?.message);
  }
  return null;
}

async function putInCache(cache, url, buffer) {
  if (!cache) return;
  try {
    await cache.put(url, new Response(buffer, { headers: { "Content-Type": "application/octet-stream" } }));
  } catch (err) {
    // Quota exceeded etc. — not fatal, the model just re-downloads next visit.
    console.warn("⚠️ AI engine: couldn't cache the model:", err?.message);
  }
}
