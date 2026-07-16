// utils/downloadName.js
// ─────────────────────────────────────────────────────────────────────────────
// One place that builds branded download filenames and triggers downloads.
// Every file we save should be named:  creativeklux-<5letterword>-<time>.<ext>
// e.g.  creativeklux-frpost-14-32-05.png
//
// Use `brandedFileName(ext)` when you only need the name, or `downloadBlob` /
// `downloadUrl` when you also want to trigger the browser download.

// A random 5-letter lowercase word (a-z). Purely for a unique, readable tag.
function random5Letters() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let word = "";
  for (let i = 0; i < 5; i++) {
    word += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return word;
}

// Current time as HH-MM-SS (safe for filenames — no colons).
function timeStamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

/**
 * Build a branded filename: creativeklux-<5letterword>-<HH-MM-SS>.<ext>
 *
 * @param {string} [ext] - Extension without the dot (e.g. "png", "mp4"). Optional.
 * @returns {string} The filename.
 */
export function brandedFileName(ext) {
  const base = `creativeklux-${random5Letters()}-${timeStamp()}`;
  const clean = String(ext || "").replace(/^\./, "").toLowerCase();
  return clean ? `${base}.${clean}` : base;
}

// Fire the actual browser download for an already-created object/blob URL.
function triggerDownload(href, filename) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Download a Blob with a branded filename.
 *
 * @param {Blob} blob - The data to save.
 * @param {string} [ext] - Extension without the dot. Falls back to the blob's
 *                         MIME subtype (jpeg → jpg), then "bin".
 */
export function downloadBlob(blob, ext) {
  const fromMime = (blob?.type?.split("/")[1] || "").toLowerCase();
  const finalExt = ext || (fromMime === "jpeg" ? "jpg" : fromMime) || "bin";

  const objectUrl = URL.createObjectURL(blob);
  triggerDownload(objectUrl, brandedFileName(finalExt));
  URL.revokeObjectURL(objectUrl);
}

/**
 * Download from a URL with a branded filename. Fetches the bytes into a Blob
 * first so cross-origin URLs actually save (a plain <a download> to a CDN is
 * ignored by browsers). Pass `ext` to force the extension.
 *
 * @param {string} url
 * @param {string} [ext] - Extension without the dot. Inferred from the blob if omitted.
 */
export async function downloadUrl(url, ext) {
  if (!url) throw new Error("Nothing to download.");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't fetch file (HTTP ${res.status}).`);
  const blob = await res.blob();
  downloadBlob(blob, ext);
}
