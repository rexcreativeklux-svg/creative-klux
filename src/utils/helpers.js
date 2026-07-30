// utils/helpers.js
// ─────────────────────────────────────────────────────────────────────────────
// Upload rules, shared by every surface that puts a file in the user's gallery
// (the gallery page, UploadMediaModal, MediaPickerModal, the Studio composers).
//
// THE EXTENSION LISTS BELOW MIRROR THE BACKEND EXACTLY. The API validates with:
//
//   The file field must be a file of type: jpg, jpeg, png, webp, gif, bmp, mp4,
//   mov, avi, webm, mkv, m4v, mp3, wav, m4a, ogg, aac, flac, pdf, doc, docx,
//   ppt, pptx, xls, xlsx, txt, csv.
//
// If the backend's list changes, change it HERE and every picker, drag-drop and
// validation path follows — they all read from this file.
//
// Classification is EXTENSION-first, deliberately. Laravel's `mimes:` rule keys
// off the extension, and a browser MIME prefix is too loose: "image/*" would
// wave through .svg, .heic and .tiff, all of which the backend rejects — the
// user would only find out after the upload round trip.

// Max file size per category.
export const FILE_LIMITS = {
  image: 5 * 1024 * 1024, // 5 MB
  video: 50 * 1024 * 1024, // 50 MB
  audio: 10 * 1024 * 1024, // 10 MB
  document: 5 * 1024 * 1024, // 5 MB
};

/** Backend-supported extensions, grouped into the app's four categories. */
export const SUPPORTED_EXTENSIONS = {
  image: ["jpg", "jpeg", "png", "webp", "gif", "bmp"],
  video: ["mp4", "mov", "avi", "webm", "mkv", "m4v"],
  audio: ["mp3", "wav", "m4a", "ogg", "aac", "flac"],
  document: ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv"],
};

/** Every supported extension, flat. */
export const ALL_SUPPORTED_EXTENSIONS = Object.values(SUPPORTED_EXTENSIONS).flat();

/**
 * Build an `accept` attribute from a set of categories.
 * Extensions only — no "image/*" wildcards, so the OS dialog offers exactly
 * what the backend will actually take.
 *
 * @param {string[]} [categories] Defaults to every category.
 * @returns {string} e.g. ".jpg,.jpeg,.png,…"
 */
export const buildAcceptList = (categories = Object.keys(SUPPORTED_EXTENSIONS)) =>
  categories
    .flatMap((category) => SUPPORTED_EXTENSIONS[category] || [])
    .map((extension) => `.${extension}`)
    .join(",");

/** `accept` for a general gallery upload — every supported type. */
export const UPLOAD_ACCEPT = buildAcceptList();

/** Lowercase extension of a filename, without the dot ("a.PNG" → "png"). */
const extensionOf = (name) =>
  (name || "").toLowerCase().split("?")[0].split("#")[0].split(".").pop();

/**
 * Categorise a file the way the backend will.
 *
 * Extension decides. A file whose extension isn't on the backend's list returns
 * null — callers treat that as "unsupported" and say so before uploading.
 *
 * @param {File|{name?: string, type?: string}} file
 * @returns {"image"|"video"|"audio"|"document"|null}
 */
export const getFileCategory = (file) => {
  const extension = extensionOf(file?.name);

  for (const [category, extensions] of Object.entries(SUPPORTED_EXTENSIONS)) {
    if (extensions.includes(extension)) return category;
  }

  // No usable extension (some drag-drop sources, clipboard pastes) — fall back
  // to the MIME type, but only for types that map onto a supported extension.
  const mime = (file?.type || "").toLowerCase();
  if (mime) {
    const fromMime = mime.split("/")[1];
    for (const [category, extensions] of Object.entries(SUPPORTED_EXTENSIONS)) {
      if (extensions.includes(fromMime)) return category;
    }
    if (mime === "image/jpg") return "image";
  }

  return null; // Unsupported — the backend would reject it.
};

/**
 * A human list of what can be uploaded, for error copy.
 * @param {string[]} [categories]
 * @returns {string} e.g. "jpg, jpeg, png…"
 */
export const describeSupportedTypes = (
  categories = Object.keys(SUPPORTED_EXTENSIONS),
) => categories.flatMap((category) => SUPPORTED_EXTENSIONS[category] || []).join(", ");
