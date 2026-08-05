"use client";

// components/gallery/UploadMediaModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The gallery page's Upload modal. Lets a user stage one or more media items
// before committing them, from four sources:
//   • Drag & drop onto the preview area
//   • Paste from the clipboard (Ctrl/Cmd+V — screenshots, copied files)
//   • Browse from the device (hidden <input type="file">)
//   • Paste a remote media URL and load it (image / video / audio)
//
// Staged items show a live preview — <img> / <video> / <audio> / doc icon — in a
// large main preview, with a thumbnail strip for switching between and removing
// items or adding more. On "Upload" it hands the collected File objects to the
// parent's `onUpload` (the gallery's existing validate-upload-refresh pipeline),
// so this component only owns staging + preview, never the network upload itself.
//
// Every staged item is backed by a blob: object URL (device files directly,
// URL-loaded files after fetch → Blob), so previews and the eventual upload share
// one File per item and the URLs are revoked on remove / close to avoid leaks.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudUpload,
  Link2,
  Loader2,
  X,
  Upload,
  Film,
  AudioLines,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { MEDIA_ACCEPT } from "./mediaTypes";
import { FILE_LIMITS, getFileCategory, describeSupportedTypes } from "@/utils/helpers";

// Subtype → friendly extension for names built from a content-type.
const EXT_BY_SUBTYPE = { jpeg: "jpg", "svg+xml": "svg", mpeg: "mp3", quicktime: "mov" };

// Extension → MIME, used to recover a type when a host serves a generic
// content-type (application/octet-stream) so the file still classifies.
const MIME_BY_EXT = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", svg: "image/svg+xml", bmp: "image/bmp",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mkv: "video/x-matroska",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4",
  aac: "audio/aac", flac: "audio/flac",
  pdf: "application/pdf", txt: "text/plain",
};

/** Best-effort file extension from a URL path (no query/hash). */
function extFromUrl(url) {
  const path = url.split("?")[0].split("#")[0];
  const base = path.substring(path.lastIndexOf("/") + 1);
  return base.includes(".") ? base.split(".").pop().toLowerCase() : "";
}

/** Derive a sensible download name for a URL-loaded file. */
function fileNameFromUrl(url, mime) {
  const path = url.split("?")[0].split("#")[0];
  const base = decodeURIComponent(path.substring(path.lastIndexOf("/") + 1));
  if (base && base.includes(".")) return base;
  const subtype = (mime || "").split("/")[1] || "bin";
  const ext = EXT_BY_SUBTYPE[subtype] || subtype;
  return `pasted-${Date.now()}.${ext}`;
}

/**
 * Fetch a remote media URL into a File, tolerating hosts without CORS headers by
 * falling back to the same-origin /api/proxy-media relay. The response's
 * content-type drives the File's MIME (with an extension-based guess when the
 * host serves a generic type), so getFileCategory() can classify it downstream.
 *
 * @param {string} url
 * @returns {Promise<File>}
 */
async function fetchUrlAsFile(url) {
  let blob = null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) blob = await res.blob();
    else console.warn(`↩️ [upload-modal] direct fetch HTTP ${res.status}, trying proxy:`, url);
  } catch (err) {
    console.warn("↩️ [upload-modal] direct fetch blocked (CORS?), trying proxy:", err?.message || err);
  }

  if (!blob) {
    const res = await fetch(`/api/proxy-media?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Couldn't load the media (HTTP ${res.status}).`);
    blob = await res.blob();
  }

  // Prefer the served type; recover a real one from the extension when generic.
  let mime = blob.type;
  if (!mime || mime === "application/octet-stream") {
    mime = MIME_BY_EXT[extFromUrl(url)] || mime || "application/octet-stream";
  }
  return new File([blob], fileNameFromUrl(url, mime), { type: mime });
}

/** Icon + tint for the non-image categories (used in preview + thumbnails). */
const CATEGORY_ICON = { video: Film, audio: AudioLines, document: FileText };

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(files: File[]) => Promise<unknown>} props.onUpload  Parent uploader
 *   (the gallery's handleFileUpload) — validates, uploads, refreshes, toasts.
 */
export default function UploadMediaModal({ isOpen, onClose, onUpload }) {
  // Staged items: { id, file, category, name, url } — url is a blob: object URL.
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  // Live mirror of items so cleanup effects revoke URLs without a stale closure.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const activeItem = items.find((it) => it.id === activeId) || items[0] || null;

  // ── Add device / dropped / pasted / URL-loaded files ───────────────────────
  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const accepted = [];
    for (const file of incoming) {
      const category = getFileCategory(file);
      if (!category) {
        toast.error(
          `${file.name} isn't a supported file type. Supported: ${describeSupportedTypes()}.`,
        );
        continue;
      }
      if (file.size > FILE_LIMITS[category]) {
        const maxMB = FILE_LIMITS[category] / (1024 * 1024);
        toast.error(`${file.name} is too large — max ${maxMB}MB for ${category}s.`);
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        category,
        name: file.name,
        url: URL.createObjectURL(file),
      });
    }

    if (!accepted.length) return;
    setItems((prev) => [...prev, ...accepted]);
    setActiveId(accepted[accepted.length - 1].id);
  }, []);

  // ── Load a remote URL into the staging list ────────────────────────────────
  const loadUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Enter a valid http(s) URL.");
      return;
    }
    setUrlLoading(true);
    try {
      console.log("📡 [upload-modal] loading URL:", url);
      const file = await fetchUrlAsFile(url);
      addFiles([file]);
      setUrlInput("");
    } catch (err) {
      console.error("❌ [upload-modal] URL load failed:", err);
      toast.error(err.message || "Couldn't load that URL.");
    } finally {
      setUrlLoading(false);
    }
  }, [urlInput, addFiles]);

  // ── Remove a single staged item (and free its object URL) ──────────────────
  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.url);
      const next = prev.filter((it) => it.id !== id);
      setActiveId((cur) => (cur === id ? next[next.length - 1]?.id ?? null : cur));
      return next;
    });
  }, []);

  // ── Close: revoke every object URL and reset local state ───────────────────
  const handleClose = useCallback(() => {
    if (uploading) return;
    itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url));
    setItems([]);
    setActiveId(null);
    setUrlInput("");
    setIsDragging(false);
    onClose();
  }, [uploading, onClose]);

  // ── Commit: hand the collected files to the parent uploader ────────────────
  const handleUpload = useCallback(async () => {
    if (!items.length || uploading) return;
    setUploading(true);
    try {
      await onUpload(items.map((it) => it.file));
      // Parent reports success/failure via toast; clear + close on completion.
      itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url));
      setItems([]);
      setActiveId(null);
      setUrlInput("");
      onClose();
    } catch (err) {
      // Parent's handler swallows its own errors, but guard against an unexpected
      // throw so the modal never gets stuck in an uploading state.
      console.error("❌ [upload-modal] upload failed:", err);
      toast.error(err?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [items, uploading, onUpload, onClose]);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  // Clipboard paste → stage any pasted files/images. When the paste carries no
  // files (e.g. a URL string dropped into the input) we let it fall through.
  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e) => {
      const files = [];
      for (const item of e.clipboardData?.items || []) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [isOpen, addFiles]);

  // Escape closes (unless mid-upload).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // Free any lingering object URLs if the modal unmounts while staged.
  useEffect(
    () => () => itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url)),
    [],
  );

  if (!isOpen) return null;

  const hasItems = items.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      // Backdrop-to-close relies on the click landing on THIS node and not a
      // child — do not wrap the panel below in another element without moving
      // this check with it.
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-surface w-full max-h-[92dvh] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <CloudUpload className="text-blue-600" size={22} />
            <h2 className="text-lg font-semibold">Upload media</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Close upload modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Main preview / dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => !hasItems && fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            } ${hasItems ? "" : "cursor-pointer"}`}
          >
            {activeItem ? (
              <MainPreview item={activeItem} />
            ) : (
              <div className="flex flex-col items-center justify-center text-center px-6 py-14">
                <CloudUpload size={48} className="text-gray-300 mb-3" />
                <p className="text-base font-semibold text-gray-600">
                  Drag &amp; drop, paste, or click to browse
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Images, videos, audio &amp; documents · paste a screenshot with
                  Ctrl/Cmd&nbsp;+&nbsp;V
                </p>
              </div>
            )}
          </div>

          {/* Thumbnail strip (only once something is staged) */}
          {hasItems && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {items.map((it) => (
                <Thumbnail
                  key={it.id}
                  item={it}
                  active={it.id === activeItem?.id}
                  onSelect={() => setActiveId(it.id)}
                  onRemove={() => removeItem(it.id)}
                />
              ))}
              {/* Add more */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Add more files"
              >
                <Plus size={22} />
              </button>
            </div>
          )}

          {/* URL loader */}
          <div>
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1.5">
              <Link2 size={14} /> Or load from a URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !urlLoading && loadUrl()}
                placeholder="https://example.com/image.jpg"
                className="flex-1 min-w-0 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                onClick={loadUrl}
                disabled={!urlInput.trim() || urlLoading}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {urlLoading ? <Loader2 size={16} className="animate-spin" /> : "Load"}
              </button>
            </div>
          </div>

          {/* Hidden device file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={MEDIA_ACCEPT}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = ""; // allow re-picking the same file
            }}
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!hasItems || uploading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            {uploading ? "Uploading…" : `Upload${hasItems ? ` (${items.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The large preview for the active item, rendered per media category. */
function MainPreview({ item }) {
  if (item.category === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={item.url}
        alt={item.name}
        className="w-full max-h-[46vh] object-contain bg-gray-50"
      />
    );
  }
  if (item.category === "video") {
    return (
      <video
        src={item.url}
        controls
        className="w-full max-h-[46vh] bg-black"
      />
    );
  }
  if (item.category === "audio") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 bg-gray-50">
        <AudioLines size={44} className="text-blue-500" />
        <p className="text-sm font-medium text-gray-600 truncate max-w-full">
          {item.name}
        </p>
        <audio src={item.url} controls className="w-full max-w-md" />
      </div>
    );
  }
  // Document — no inline preview, show file identity.
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 bg-gray-50">
      <FileText size={44} className="text-gray-400" />
      <p className="text-sm font-medium text-gray-600 truncate max-w-full">
        {item.name}
      </p>
      <p className="text-xs text-gray-400">Preview isn&apos;t available for documents</p>
    </div>
  );
}

/** A single thumbnail in the strip: image thumb or category icon, with remove. */
function Thumbnail({ item, active, onSelect, onRemove }) {
  const Icon = CATEGORY_ICON[item.category];
  return (
    <div className="relative shrink-0">
      <button
        onClick={onSelect}
        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer flex items-center justify-center bg-gray-50 ${
          active ? "border-blue-500" : "border-transparent hover:border-gray-300"
        }`}
      >
        {item.category === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          Icon && <Icon size={22} className="text-gray-400" />
        )}
      </button>
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white shadow border border-gray-200 text-gray-500 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Remove item"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
