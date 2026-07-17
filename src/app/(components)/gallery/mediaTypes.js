// components/gallery/mediaTypes.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the gallery's media-type taxonomy. Shared by the
// gallery page, the MediaPickerModal library, and any future gallery surface so
// tabs, icons, labels, and type classification stay identical everywhere.
//
// The backend `GET /gallery` returns each file with a `type` of "image",
// "video", "audio", "document" (or "" for legacy images). classifyMediaType()
// trusts that value first, then falls back to sniffing the file extension so
// unknown/empty types still land in the right bucket.

import { Image as ImageIcon, Film, AudioLines, FileText } from "lucide-react";

/** Ordered media types → the tab order used everywhere. */
export const MEDIA_TYPES = [
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "video", label: "Videos", icon: Film },
  { id: "audio", label: "Audio", icon: AudioLines },
  { id: "document", label: "Docs", icon: FileText },
];

/** Just the ids, in order — handy as a default `allowedTypes`. */
export const MEDIA_TYPE_IDS = MEDIA_TYPES.map((t) => t.id);

/**
 * The `accept` attribute for any gallery upload input. Kept here so every upload
 * surface offers the same file types the gallery can actually classify.
 */
export const MEDIA_ACCEPT =
  "image/*, audio/*, video/*, .pdf, .doc, .docx, .xls, .xlsx, .txt";

/** Look up a type's presentation meta (label/icon). Falls back to Images. */
export const getMediaTypeMeta = (id) =>
  MEDIA_TYPES.find((t) => t.id === id) || MEDIA_TYPES[0];

// Extension → type maps for the sniffing fallback (legacy "" / unknown types).
const VIDEO_EXTS = ["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv"];
const AUDIO_EXTS = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus", "weba"];
const DOC_EXTS = [
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
  "txt", "csv", "rtf", "md", "json",
];

/**
 * Classify a gallery item into one of the four canonical media types.
 * Trusts the backend `type` first; otherwise sniffs the filename/src extension.
 *
 * @param {{type?: string, filename?: string, alt?: string, src?: string}} item
 * @returns {"image"|"video"|"audio"|"document"}
 */
export function classifyMediaType(item) {
  const raw = (item?.type || "").toLowerCase().trim();
  if (raw === "image" || raw === "video" || raw === "audio" || raw === "document") {
    return raw;
  }
  // Legacy "" or an unexpected value → sniff the extension.
  const name = (item?.filename || item?.alt || item?.src || "").toLowerCase();
  const ext = name.split("?")[0].split("#")[0].split(".").pop();
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  if (DOC_EXTS.includes(ext)) return "document";
  return "image";
}

/** Filter a list of gallery items down to a single media type. */
export function filterMediaByType(items, typeId) {
  return (items || []).filter((it) => classifyMediaType(it) === typeId);
}

/**
 * Resolve a caller's `allowedTypes` (array of ids) into the ordered MEDIA_TYPES
 * entries it maps to. Empty/absent → all types.
 *
 * @param {string[]} [allowedTypes]
 * @returns {typeof MEDIA_TYPES}
 */
export function resolveAllowedTypes(allowedTypes) {
  if (!allowedTypes || allowedTypes.length === 0) return MEDIA_TYPES;
  const set = new Set(allowedTypes);
  return MEDIA_TYPES.filter((t) => set.has(t.id));
}

/**
 * Shared grid density for a media type — audio players are wide, so they get
 * fewer columns than image/video/doc tiles. Keeps every gallery grid consistent.
 *
 * @param {string} typeId
 * @returns {string} Tailwind grid classes.
 */
export const galleryGridClass = (typeId) => {
  // console.log(typeId)
  if(typeId === "image") {
    return "columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3";
  }
  if (typeId === "audio") {
    return "grid grid-cols-1 md:grid-cols-2 gap-4";
  }
  return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";
}
