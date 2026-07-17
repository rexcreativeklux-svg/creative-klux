// components/gallery/downloadMedia.js
// ─────────────────────────────────────────────────────────────────────────────
// One place that downloads a gallery item as a real file with a correct name +
// MIME. Shared by the gallery page and the MediaPickerModal library so audio
// always saves as .mp3 (audio/mpeg), video as .mp4, and images/docs keep a
// sensible extension — instead of the old "image-<timestamp>.mpeg" bug.
//
// The bytes are fetched into a Blob first (a plain <a download> pointing at a
// cross-origin CDN URL is ignored by browsers). Direct fetch is tried first,
// then the same-origin /api/proxy-image proxy for hosts without CORS headers.

import { classifyMediaType } from "./mediaTypes";

// Force the correct download MIME for audio/video so the saved file isn't
// mislabeled (e.g. audio arriving as a video type). Images/docs keep their blob.
function normalizedBlob(blob, type) {
  if (type === "audio") return new Blob([blob], { type: "audio/mpeg" });
  if (type === "video") return new Blob([blob], { type: "video/mp4" });
  return blob;
}

// Build a correct filename: audio → .mp3, video → .mp4; images/docs derive the
// extension from the blob MIME, then the original name, with a type fallback.
function fileNameFor(item, type, blob) {
  const raw = String(item?.filename || item?.alt || `${type}-${item?.id || Date.now()}`);
  const base = raw.replace(/\.[a-z0-9]{1,5}$/i, "").trim() || `${type}-${Date.now()}`;

  let ext;
  if (type === "audio") {
    ext = "mp3";
  } else if (type === "video") {
    ext = "mp4";
  } else {
    const fromMime = (blob?.type?.split("/")[1] || "").toLowerCase();
    const fromName = raw.match(/\.([a-z0-9]{1,5})$/i)?.[1]?.toLowerCase();
    ext =
      (fromMime === "jpeg" ? "jpg" : fromMime) ||
      fromName ||
      (type === "image" ? "jpg" : "bin");
  }
  return `${base}.${ext}`;
}

/**
 * Fetch a media URL into a Blob: direct first (same-origin / CORS-enabled
 * hosts), then the same-origin /api/proxy-image proxy for CDN hosts without
 * CORS headers. Exported — also used to turn a picked gallery item into a
 * real File (e.g. Magic Studio's Audio to Text input).
 * @param {string} url
 * @returns {Promise<Blob>}
 */
export async function fetchMediaBlob(url) {
  // Direct first (works for same-origin / CORS-enabled hosts)…
  try {
    const res = await fetch(url);
    if (res.ok) return await res.blob();
  } catch {
    /* fall through to the proxy */
  }
  // …then the same-origin proxy for CDN hosts without CORS headers.
  const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Couldn't fetch media (HTTP ${res.status}).`);
  return await res.blob();
}

/**
 * Download a gallery item as a correctly-named, correctly-typed file.
 *
 * @param {{id?: any, type?: string, src?: string, large?: string, downloadUrl?: string, filename?: string, alt?: string}} item
 * @returns {Promise<void>}
 */
export async function downloadGalleryItem(item) {
  const url = item?.downloadUrl || item?.large || item?.src;
  if (!url) throw new Error("Nothing to download.");

  const type = classifyMediaType(item);
  const blob = normalizedBlob(await fetchMediaBlob(url), type);
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileNameFor(item, type, blob);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
