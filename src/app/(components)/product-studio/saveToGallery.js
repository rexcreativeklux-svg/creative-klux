// Shared result-image helpers for the AI modals (Virtual Model / Product
// Staging) and Magic Studio: save a hosted result to the user's gallery, and
// download a hosted result as a real file.
//
// Both fetch the image into a Blob first (direct fetch, then the same-origin
// /api/proxy-image fallback for CDN hosts that don't send CORS headers). The
// download path MUST go through a Blob: a plain <a download> pointing at a
// cross-origin CDN URL is ignored by browsers and just opens a new tab, so we
// download the fetched Blob via an object URL instead.

import { FILE_LIMITS } from "@/utils/helpers";

/** What a URL that carries no extension of its own is saved as, per media type. */
const DEFAULT_EXT = { image: "png", video: "mp4", audio: "mp3" };

/**
 * Extensions whose MIME type isn't just `<category>/<ext>`.
 *
 * ⚠️ THE REST OF THEM GENUINELY ARE. `video/mp4`, `video/webm`, `image/png` and
 * `audio/wav` all follow the pattern; these four are the ones that would be
 * wrong if derived — and a wrong MIME is not cosmetic, it is what the gallery
 * endpoint validates against.
 */
const MIME_OVERRIDES = {
  jpg: "image/jpeg",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  mov: "video/quicktime",
};

/**
 * The file name extension and MIME type to save a hosted result under.
 *
 * ⚠️ IT TAKES THE ITEM'S TYPE, NOT JUST ITS URL, and that is what stopped a clip
 * being uploaded as a picture. The grids used to hard-code `image/<ext>` for
 * everything they saved, so an .mp4 went up as `image/mp4` — a MIME type that
 * does not exist — which is why Save to gallery was only ever offered on images.
 *
 * @param {string} url The hosted result URL.
 * @param {"image"|"video"|"audio"} [type="image"] What the result actually is.
 * @returns {{ ext: string, mime: string, category: string }}
 */
export function galleryFileMeta(url, type = "image") {
  const category = DEFAULT_EXT[type] ? type : "image";
  const clean = String(url || "")
    .split("?")[0]
    .split("#")[0];
  const match = clean.match(/\.([a-z0-9]{2,5})$/i);
  const ext = (match ? match[1] : DEFAULT_EXT[category]).toLowerCase();
  return {
    ext,
    mime: MIME_OVERRIDES[ext] || `${category}/${ext}`,
    category,
  };
}

/**
 * Fetch a remote image as a Blob, tolerating hosts without CORS headers.
 * @param {string} url
 * @returns {Promise<Blob>}
 */
async function fetchHostedBlob(url) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) return await res.blob();
    console.warn(
      `↩️ [save-to-gallery] direct fetch HTTP ${res.status}, trying proxy:`,
      url,
    );
  } catch (err) {
    console.warn(
      "↩️ [save-to-gallery] direct fetch blocked (CORS?), trying proxy:",
      err?.message || err,
    );
  }
  const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Couldn't load the image (HTTP ${res.status}).`);
  return await res.blob();
}

/**
 * Fetch a hosted result image and upload it into the user's gallery.
 *
 * @param {string} url The hosted result URL.
 * @param {(file: File) => Promise<unknown>} uploadMedia The auth context uploader.
 * @param {object} [opts]
 * @param {string} [opts.filePrefix] File name prefix (e.g. "virtual-model").
 * @param {string} [opts.ext] File extension (defaults to "png" — images).
 * @param {string} [opts.mime] MIME type override (defaults to the blob's / image/png).
 * @returns {Promise<unknown>} The uploadMedia response.
 */
export async function saveUrlToGallery(
  url,
  uploadMedia,
  { filePrefix = "klux", ext = "png", mime, category = "image" } = {},
) {
  if (!url) throw new Error("Nothing to save.");
  if (typeof uploadMedia !== "function")
    throw new Error("Log in to save to your gallery.");
  const blob = await fetchHostedBlob(url);

  // ⚠️ CHECKED HERE, WHERE THE SIZE IS FIRST KNOWN. The gallery caps video at
  // 50 MB and audio at 10 MB (FILE_LIMITS — it mirrors the backend's rule), and
  // a long render clears that easily. Without this the upload runs its whole
  // course and comes back with a rejection that names neither the limit nor the
  // file, on a video the user just waited minutes for.
  const cap = FILE_LIMITS[category];
  if (cap && blob.size > cap) {
    const mb = (n) => `${Math.round(n / (1024 * 1024))} MB`;
    throw new Error(
      `That ${category} is ${mb(blob.size)} — the gallery's limit is ${mb(cap)}.`,
    );
  }

  const file = new File([blob], `${filePrefix}-${Date.now()}.${ext}`, {
    // The blob's own type is trusted LAST: a CDN that answers
    // application/octet-stream would otherwise decide the upload's MIME, and
    // that is exactly the case `mime` is derived for. See galleryFileMeta.
    type: mime || blob.type || "image/png",
  });
  console.log(`💾 [save-to-gallery] uploading ${filePrefix} result to gallery`);
  return uploadMedia(file);
}

/**
 * Download a hosted result image as a real file (not a new tab). Fetches the
 * bytes into a Blob first so the browser honors the download instead of
 * navigating to the cross-origin URL. The timestamped file name is built here
 * (a plain module) so callers don't compute it inside a React render.
 *
 * @param {string} url The hosted result URL.
 * @param {object} [opts]
 * @param {string} [opts.filePrefix] File name prefix (e.g. "virtual-model").
 * @param {string} [opts.ext] File extension (defaults to "png" — images).
 */
export async function downloadImageUrl(url, { filePrefix = "klux", ext = "png" } = {}) {
  if (!url) throw new Error("Nothing to download.");
  const blob = await fetchHostedBlob(url);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${filePrefix}-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
