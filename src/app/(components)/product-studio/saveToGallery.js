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

/**
 * How long one file gets, each way, before it counts as failed. Generous, because
 * a 50 MB video on a slow connection is meant to take a while; it only has to be
 * finite, since nothing else ever ends a request that gets no answer — the shared
 * axios instance has no timeout, and a stuck upload used to hold a bulk action,
 * and its locked bar, open until the page was reloaded.
 */
const FILE_TIMEOUT_MS = 3 * 60 * 1000;

/**
 * Give up on a file's work after {@link FILE_TIMEOUT_MS}.
 *
 * ⚠️ THIS STOPS THE WAIT, NOT THE WORK. `uploadMedia` can't be cancelled from
 * here, so an upload that was merely slow can still land after being reported as
 * failed — the message says so, because retrying blind would make a duplicate.
 *
 * @template T
 * @param {Promise<T>} work
 * @returns {Promise<T>}
 */
export function withFileTimeout(work) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error("Timed out after 3 minutes. It may still finish in the background."),
        ),
      FILE_TIMEOUT_MS,
    );
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/** `fetch` whose body has to arrive within {@link FILE_TIMEOUT_MS}, or it aborts. */
async function fetchBlobWithTimeout(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FILE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return { ok: res.ok, status: res.status, blob: res.ok ? await res.blob() : null };
  } catch (err) {
    // A bare "Aborted" means nothing to whoever ends up reading it in a toast.
    if (!controller.signal.aborted) throw err;
    const timedOut = new Error("Timed out after 3 minutes.");
    timedOut.timedOut = true;
    throw timedOut;
  } finally {
    clearTimeout(timer);
  }
}

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
 * Also used by Creative Comparison, whose endpoint only accepts uploaded files.
 * @param {string} url
 * @returns {Promise<Blob>}
 */
export async function fetchHostedBlob(url) {
  try {
    const res = await fetchBlobWithTimeout(url, { mode: "cors" });
    if (res.ok) return res.blob;
    console.warn(
      `↩️ [save-to-gallery] direct fetch HTTP ${res.status}, trying proxy:`,
      url,
    );
  } catch (err) {
    // The proxy gets round a missing CORS header, not a host that isn't answering
    // — trying it after a timeout would only double the wait.
    if (err?.timedOut) throw err;
    console.warn(
      "↩️ [save-to-gallery] direct fetch blocked (CORS?), trying proxy:",
      err?.message || err,
    );
  }
  const res = await fetchBlobWithTimeout(
    `/api/proxy-image?url=${encodeURIComponent(url)}`,
  );
  if (!res.ok) throw new Error(`Couldn't load the image (HTTP ${res.status}).`);
  return res.blob;
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
  return withFileTimeout(uploadMedia(file));
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
  saveBlob(blob, `${filePrefix}-${Date.now()}.${ext}`);
}

/**
 * Download several hosted results as one zip, because a dozen separate save
 * prompts is not a feature. A file that won't load is left out rather than
 * sinking the rest — the caller is told how many, so it can say so.
 *
 * JSZip is loaded here, on first use, so it isn't in the bundle of every page
 * that can save a single image. STORE rather than compress: these are already
 * compressed media, and deflating them again costs time and saves nothing.
 *
 * @param {Array<{name: string|((blob: Blob) => string), url?: string, load?: () => Promise<Blob>}>} files
 *   A hosted `url` to fetch, or `load` for a file that has to be made first —
 *   which may only know its extension once it has been, hence `name` as a function.
 * @param {string} zipName
 * @returns {Promise<{failed: number}>}
 */
export async function downloadUrlsAsZip(files, zipName) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  let failed = 0;
  // One at a time: a selection can be a dozen videos, and holding them all in
  // flight at once is how a tab runs out of memory.
  for (const { url, name, load } of files) {
    try {
      const blob = await (load ? withFileTimeout(load()) : fetchHostedBlob(url));
      zip.file(typeof name === "function" ? name(blob) : name, blob);
    } catch (err) {
      console.warn("⚠️ [download-zip] left out of the zip:", url, err?.message);
      failed += 1;
    }
  }
  if (failed === files.length) throw new Error("Couldn't load those files.");
  saveBlob(await zip.generateAsync({ type: "blob", compression: "STORE" }), zipName);
  return { failed };
}

/** Hand a Blob to the browser as a download. */
function saveBlob(blob, name) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
