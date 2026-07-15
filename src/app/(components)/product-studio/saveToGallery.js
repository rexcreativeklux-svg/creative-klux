// Shared result-image helpers for the AI modals (Virtual Model / Product
// Staging) and Magic Studio: save a hosted result to the user's gallery, and
// download a hosted result as a real file.
//
// Both fetch the image into a Blob first (direct fetch, then the same-origin
// /api/proxy-image fallback for CDN hosts that don't send CORS headers). The
// download path MUST go through a Blob: a plain <a download> pointing at a
// cross-origin CDN URL is ignored by browsers and just opens a new tab, so we
// download the fetched Blob via an object URL instead.

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
  { filePrefix = "klux", ext = "png", mime } = {},
) {
  if (!url) throw new Error("Nothing to save.");
  if (typeof uploadMedia !== "function")
    throw new Error("Log in to save to your gallery.");
  const blob = await fetchHostedBlob(url);
  const file = new File([blob], `${filePrefix}-${Date.now()}.${ext}`, {
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
