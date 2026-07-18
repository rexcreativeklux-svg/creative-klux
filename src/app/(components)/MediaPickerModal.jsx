// components/MediaPickerModal.jsx
// Unified media picker — Search | Library | Magic Studio | Upload
// Drop-in replacement: replaces SearchMediaModal, LibraryMediaModal, MagicMediaModal + upload button

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileSearch,
  FolderOpen,
  Sparkles,
  FileUp,
  Loader2,
  X,
  CheckCircle2,
  Download,
  MoreVertical,
  PlusCircleIcon,
  Film,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Toast from "./Toast";
import useGalleryMedia from "./gallery/useGalleryMedia";
import useInfiniteScroll from "./gallery/useInfiniteScroll";
import MediaTypeTabs from "./gallery/MediaTypeTabs";
import MediaCard from "./gallery/MediaCard";
import MasonryGrid from "./gallery/MasonryGrid";
import GallerySkeleton from "./gallery/GallerySkeleton";
import { galleryGridClass } from "./gallery/mediaTypes";
import { downloadGalleryItem } from "./gallery/downloadMedia";

// ── Magic sub-tabs (same as MagicMediaModal) ─────────────────────────────────
import TextToImageTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/text-to-image/page";
import TextToAudioTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/text-to-audio/page";
import TextToVideoTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/text-to-video/page";
import ImageToVariationsTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/image-to-variations/page";
import ScriptToVoiceoverToVideoTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/script-to-voiceover/page";
import AudioToTextTab from "../(dashboard)/(pages)/old-studio/ai-studio/create/audio-to-text/page";
import PersonaBasedGeneratorTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/persona-based-generator/page";
import { FILE_LIMITS, getFileCategory } from "@/utils/helpers";

// ─────────────────────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id: "search", label: "Search Media", icon: FileSearch },
  { id: "library", label: "My Library", icon: FolderOpen },
  { id: "magic", label: "Magic Studio", icon: Sparkles },
];

const MAGIC_SUBTABS = [
  "Text to Image",
  "Text to Audio",
  "Text to Video",
  "Image to Variations",
  "Script to Voiceover to Video",
  "Audio to Text",
  "Persona-based Generator",
];

const MAX_SELECT = 5;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * MediaPickerModal
 *
 * Props
 * ─────
 * isOpen          boolean
 * onClose         () => void
 * onApply         (selectedImages: any[], selectedMedia: any[]) => void
 *   Called with whatever the user confirmed. The parent (ImageAdsForm)
 *   already has handleApplySelected — just pass selected state up.
 * onCancel        () => void
 *
 * postData        object    — forwarded to Magic tabs
 * activeBrand     object    — forwarded to Magic tabs
 * myImages        array     — already-in-library images (for "Add to Brand" dedup)
 * onAddToBrand    (img) => void
 * showToast       (msg) => void   — optional; falls back to internal toast
 *
 * initialTab      "search" | "library" | "magic" | "upload"
 * allowedTypes    string[]  — which gallery media types the caller can SELECT in
 *   the Library tab: subset of ["image","video","audio","document"]. Defaults to
 *   ["image"] so existing callers behave exactly as before (image-only, single
 *   list, no type tabs). Pass more to let a form pick other media types too — the
 *   consuming form should still validate what it receives.
 * tabs            string[]  — which MAIN tabs to show: subset of
 *   ["search","library","magic"]. null/absent → all three (unchanged callers).
 *   Non-image pickers pass ["library"] — Search is Pexels images and Magic is
 *   the legacy generator, neither makes sense for audio/video/docs.
 */
export default function MediaPickerModal({
  isOpen,
  onClose,
  onApply,
  onCancel,
  postData,
  activeBrand,
  myImages = [],
  onAddToBrand,
  showToast: externalToast,
  initialTab = "search",
  maxSelectable = MAX_SELECT,
  allowedTypes = ["image",],
  tabs = null,
  // Extra tabs rendered as disabled "Coming soon" placeholders. Opt-in — absent
  // for existing callers. Shape: [{ id, label, icon }]. Clicking one shows a
  // placeholder instead of any picker; nothing is selectable in these tabs.
  comingSoonTabs = [],
}) {
  // Effective cap — never exceed the modal's own hard ceiling, and never go below 0.
  const effectiveCap = Math.max(0, Math.min(maxSelectable, MAX_SELECT));
  // ── tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeMagicTab, setActiveMagicTab] = useState(MAGIC_SUBTABS[0]);

  // Main tabs this caller shows; the active tab is clamped into the visible set
  // during render (same pattern as useGalleryMedia's type clamp) so a stale or
  // hidden tab can never render.
  const visibleTabs = tabs?.length
    ? MAIN_TABS.filter((t) => tabs.includes(t.id))
    : MAIN_TABS;
  // Coming-soon tabs are selectable (so the placeholder shows) but hold no
  // picker. Treat their ids as valid active tabs alongside the real ones.
  const allTabIds = [
    ...visibleTabs.map((t) => t.id),
    ...comingSoonTabs.map((t) => t.id),
  ];
  const activeTabSafe = allTabIds.includes(activeTab)
    ? activeTab
    : visibleTabs[0]?.id || "search";
  const isComingSoon = comingSoonTabs.some((t) => t.id === activeTabSafe);

  // ── selection ──────────────────────────────────────────────────────────────
  const [selectedImages, setSelectedImages] = useState([]); // search / library
  const [selectedMedia, setSelectedMedia] = useState([]); // magic

  // ── search tab ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMenuOpen, setSearchMenuOpen] = useState(null);

  // ── library tab ───────────────────────────────────────────────────────────
  const libFileRef = useRef(null);
  const [libUploading, setLibUploading] = useState(false);

  // ── upload tab ────────────────────────────────────────────────────────────
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadDragging, setUploadDragging] = useState(false);
  const uploadFileRef = useRef(null);

  // ── toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const notify = useCallback(
    (msg) =>
      externalToast
        ? externalToast(msg)
        : setToast({ isOpen: true, message: msg }),
    [externalToast],
  );

  // ── auth context (library) ─────────────────────────────────────────────────
  const { uploadMedia, deleteImage } = useAuth();

  // Gallery media for the Library tab. Restricted to the caller's allowedTypes
  // and only fetched while the Library tab is open. Default allowedTypes is
  // ["image"], so existing callers get the exact same single image list.
  const {
    tabs: galleryTabs,
    activeType: galleryType,
    setActiveType: setGalleryType,
    items: galleryItems,
    allItems: allGalleryItems,
    counts: galleryCounts,
    loading: galleryLoading,
    loadingMore: galleryLoadingMore,
    hasMore: galleryHasMore,
    loadMore: loadMoreGallery,
    refresh: refreshGallery,
  } = useGalleryMedia({
    allowedTypes,
    enabled: isOpen && activeTabSafe === "library",
  });

  // Infinite scroll for the Library grid — resolves to the modal's own inner
  // scroll container automatically (see useInfiniteScroll's scroll-parent walk).
  const librarySentinelRef = useInfiniteScroll({
    onLoadMore: loadMoreGallery,
    hasMore: galleryHasMore,
    loading: galleryLoadingMore,
  });

  // Shared library-card actions — used by both the image masonry and the
  // grid (video/audio/doc) layouts so their behavior can't drift.
  const handleLibraryDownload = async (it) => {
    try {
      await downloadGalleryItem(it);
    } catch (err) {
      console.error("❌ [media-picker] download failed:", err);
      sonnerToast.error("Couldn't download that file.");
    }
  };

  const handleLibraryDelete = async (it) => {
    if (!confirm("Delete permanently?")) return;
    notify("Deleting…");
    try {
      await deleteImage(it.id);
      await refreshGallery?.();
      notify("Deleted!");
    } catch (err) {
      notify(err.message || "Delete failed");
    }
  };

  // ── reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSelectedImages([]);
      setSelectedMedia([]);
      setSearchQuery("");
      setUploadedFiles([]);
    }
  }, [isOpen, initialTab]);

  // Library media is fetched by useGalleryMedia (gated to the Library tab).

  // ── search: auto-fetch ────────────────────────────────────────────────────
  const brandFallback =
    postData?.brandName?.trim() ||
    activeBrand?.name?.trim() ||
    "premium marketing lifestyle";

  const doSearch = useCallback(
    async (query) => {
      if (!query) return;
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/pexels?query=${encodeURIComponent(query)}&per_page=60`,
        );
        const data = await res.json();
        setSearchResults(
          (data.photos || []).map((p) => ({
            id: p.id,
            src: p.src.medium,
            large: p.src.large2x || p.src.large,
            alt: p.alt || query,
          })),
        );
      } catch {
        notify("Failed to load images.");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    if (!isOpen || activeTabSafe !== "search") return;
    const t = setTimeout(
      () => doSearch(searchQuery.trim() || `${brandFallback} marketing ad`),
      600,
    );
    return () => clearTimeout(t);
  }, [isOpen, activeTabSafe, searchQuery, brandFallback, doSearch]);

  if (!isOpen) return null;

  // ── selection helpers ─────────────────────────────────────────────────────
  // Single-select mode (maxSelectable=1): picking another item just swaps the
  // selection — no "you can only select 1" error dead-end.
  const toggleImage = (src) => {
    if (selectedImages.includes(src)) {
      setSelectedImages((prev) => prev.filter((s) => s !== src));
      return;
    }
    if (effectiveCap === 1) {
      setSelectedMedia([]);
      setSelectedImages([src]);
      return;
    }
    if (selectedImages.length + selectedMedia.length >= effectiveCap) {
      notify(
        `You can only select ${effectiveCap} more item${effectiveCap === 1 ? "" : "s"}.`,
      );
      return;
    }
    setSelectedImages((prev) => [...prev, src]);
  };

  const toggleMedia = (src) => {
    if (selectedMedia.includes(src)) {
      setSelectedMedia((prev) => prev.filter((s) => s !== src));
      return;
    }
    if (effectiveCap === 1) {
      setSelectedImages([]);
      setSelectedMedia([src]);
      return;
    }
    if (selectedImages.length + selectedMedia.length >= effectiveCap) {
      notify(
        `You can only select ${effectiveCap} more item${effectiveCap === 1 ? "" : "s"}.`,
      );
      return;
    }
    setSelectedMedia((prev) => [...prev, src]);
  };

  // ── apply ─────────────────────────────────────────────────────────────────
  const handleApply = () => {
    // Merge everything the parent needs. Library selections resolve back to the
    // FULL gallery item (id, type, filename, …) — not just the bare src — so
    // callers keep the file's identity (e.g. "movie.mp3" naming a "movie.srt").
    const combined = [
      ...selectedImages.map((src) => {
        const found =
          searchResults.find((r) => r.src === src) ||
          allGalleryItems.find((g) => g.src === src);
        return found || { src };
      }),
      ...uploadedFiles,
    ];
    onApply(combined, selectedMedia);
  };

  const totalSelected =
    selectedImages.length + selectedMedia.length + uploadedFiles.length;

  // ── upload helpers ────────────────────────────────────────────────────────
  const handleUploadFiles = (files) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return notify("Image files only.");
    const next = imgs.map((f) => {
      const url = URL.createObjectURL(f);
      return {
        src: url,
        large: url,
        file: f,
        id: `upload-${Date.now()}-${Math.random()}`,
      };
    });
    setUploadedFiles((prev) => [...prev, ...next]);
    notify(`${imgs.length} file(s) ready`);
  };

  // ── library upload ────────────────────────────────────────────────────────
  // Validates each file by category (image/audio/video/document) against its
  // size limit, uploads the survivors to the gallery, then refreshes the grid.
  // Upload state + errors use plain sonner toasts (not the in-modal notify).
  const handleLibUpload = async (files) => {
    if (!files?.length) return;

    // 1. Validate type + size per file.
    const valid = Array.from(files).filter((file) => {
      const category = getFileCategory(file);
      if (!category) {
        sonnerToast.error(`${file.name} isn't a supported file type.`);
        return false;
      }
      const maxSize = FILE_LIMITS[category];
      if (file.size > maxSize) {
        sonnerToast.error(
          `${file.name} is too large — max ${maxSize / (1024 * 1024)}MB for ${category}s.`,
        );
        return false;
      }
      return true;
    });
    if (!valid.length) return;

    // 2. Upload each survivor (one loading toast, resolved at the end).
    const toastId = sonnerToast.loading(`Uploading ${valid.length} file(s)…`);
    setLibUploading(true);
    let ok = 0;
    let lastError = null;
    let firstCategory = null;
    for (const file of valid) {
      try {
        await uploadMedia(file);
        ok++;
        if (!firstCategory) firstCategory = getFileCategory(file);
      } catch (err) {
        console.error(`❌ [media-picker] upload failed for ${file.name}:`, err);
        lastError = err;
      }
    }

    // 3. Refresh the gallery + report the outcome on the same toast.
    await refreshGallery?.();
    setLibUploading(false);

    if (ok > 0) {
      // Jump to the tab of what we just uploaded (if that type is shown here).
      if (firstCategory && galleryTabs.some((t) => t.id === firstCategory)) {
        setGalleryType(firstCategory);
      }
      sonnerToast.success(`${ok} file(s) uploaded to your library.`, {
        id: toastId,
      });
    } else {
      sonnerToast.error(lastError?.message || "Upload failed. Please try again.", {
        id: toastId,
      });
    }
  };

  // ── download helper ───────────────────────────────────────────────────────
  const handleDownload = async (img) => {
    notify("Downloading…");
    try {
      const url = img.large || img.src;
      const res = await fetch(
        `/api/proxy-image?url=${encodeURIComponent(url)}`,
      );
      const blob = await res.blob();
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `image-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`,
      });
      a.click();
      URL.revokeObjectURL(a.href);
      notify("Downloaded!");
    } catch {
      notify("Download failed");
    }
  };

  // ── magic tab renderer ────────────────────────────────────────────────────
  const renderMagicTab = () => {
    const shared = { selectedMedia, handleSelectMedia: toggleMedia };
    const map = {
      "Text to Image": (
        <TextToImageTab
          {...shared}
          postData={postData}
          activeBrand={activeBrand}
        />
      ),
      "Text to Audio": <TextToAudioTab {...shared} />,
      "Text to Video": <TextToVideoTab {...shared} />,
      "Image to Variations": (
        <ImageToVariationsTab
          {...shared}
          brandName={postData?.brandName}
          postData={postData}
          activeBrand={activeBrand}
          onClose={onClose}
        />
      ),
      "Script to Voiceover to Video": (
        <ScriptToVoiceoverToVideoTab {...shared} />
      ),
      "Audio to Text": <AudioToTextTab {...shared} />,
      "Persona-based Generator": <PersonaBasedGeneratorTab {...shared} />,
    };
    return (
      map[activeMagicTab] ?? (
        <p className="text-sm text-gray-400 p-4">Select a tab above.</p>
      )
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        onClose={() => setToast({ isOpen: false, message: "" })}
        duration={2500}
      />

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">Add Media</h2>
            <button
              onClick={onCancel || onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Main Tab Bar ─────────────────────────────────────────────── */}
          <div className="flex gap-1 px-6 pt-4 border-b border-gray-100 shrink-0">
            {visibleTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  activeTabSafe === id
                    ? "border-blue-600 text-blue-600 bg-blue-50/60"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
            {comingSoonTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  activeTabSafe === id
                    ? "border-blue-600 text-blue-600 bg-blue-50/60"
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {label}
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
                  Soon
                </span>
              </button>
            ))}
          </div>

          {/* ── Tab Content ──────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* ══ SEARCH TAB ════════════════════════════════════════════════ */}
            {activeTabSafe === "search" && (
              <div className="flex flex-col flex-1 min-h-0 px-6 pt-4 gap-4">
                {/* Search bar */}
                <div className="flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search images… (e.g. office, lifestyle, food)"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() =>
                      doSearch(searchQuery.trim() || brandFallback)
                    }
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition cursor-pointer"
                  >
                    {searchLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pb-2">
                  {searchLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="text-center text-gray-400 py-16 text-sm">
                      No results yet. Try a search above.
                    </p>
                  ) : (
                    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
                      {searchResults.map((img) => {
                        const isSel = selectedImages.includes(img.src);
                        return (
                          <div
                            key={img.id}
                            className="relative group break-inside-avoid mb-3 cursor-pointer"
                            onClick={() => toggleImage(img.src)}
                          >
                            <div className="relative overflow-hidden rounded-xl shadow-sm border border-gray-100">
                              <img
                                src={img.src}
                                alt={img.alt}
                                className="w-full h-auto block rounded-xl group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              {isSel && (
                                <>
                                  <div className="absolute inset-0 ring-4 ring-blue-600 ring-inset rounded-xl pointer-events-none" />
                                  <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow z-10">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                </>
                              )}
                              {/* 3-dot menu */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchMenuOpen(
                                    searchMenuOpen === img.id ? null : img.id,
                                  );
                                }}
                                className="absolute top-2 left-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              {searchMenuOpen === img.id && (
                                <div
                                  className="absolute top-9 left-2 bg-surface rounded-xl shadow-2xl border border-gray-100 py-1.5 z-20 min-w-40"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MenuBtn
                                    icon={Download}
                                    label="Download"
                                    onClick={() => {
                                      handleDownload(img);
                                      setSearchMenuOpen(null);
                                    }}
                                  />
                                  <MenuBtn
                                    icon={PlusCircleIcon}
                                    label="Add to Brand"
                                    blue
                                    onClick={() => {
                                      onAddToBrand?.(img);
                                      notify("Added to brand!");
                                      setSearchMenuOpen(null);
                                    }}
                                  />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all pointer-events-none flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium">
                                  {isSel ? "Selected ✓" : "Click to select"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ LIBRARY TAB ═══════════════════════════════════════════════ */}
            {activeTabSafe === "library" && (
              <div className="flex flex-col flex-1 min-h-0 px-6 pt-4 gap-4">
                {/* Upload + media-type tabs */}
                <div className="shrink-0 flex flex-wrap items-center gap-3 pb-3 border-b border-gray-100">
                  <button
                    onClick={() => libFileRef.current?.click()}
                    disabled={libUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {libUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileUp className="w-4 h-4" />
                    )}
                    {libUploading ? "Uploading…" : "Upload"}
                  </button>
                  <input
                    ref={libFileRef}
                    type="file"
                    multiple
                    accept="image/*, audio/*, video/*, .pdf, .doc, .docx, .xls, .xlsx, .txt"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      e.target.value = ""; // allow re-selecting the same file
                      handleLibUpload(files);
                    }}
                  />
                  <div className="flex-1 min-w-0" />
                  <MediaTypeTabs
                    tabs={galleryTabs}
                    active={galleryType}
                    onChange={setGalleryType}
                    counts={galleryCounts}
                    variant="pill"
                  />
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-2">
                  {galleryLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : galleryItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                      <FolderOpen className="w-12 h-12 text-gray-200" />
                      <p className="text-sm">
                        No{" "}
                        {galleryType === "image"
                          ? "images"
                          : `${galleryType} files`}{" "}
                        in your library yet.
                      </p>
                    </div>
                  ) : galleryType === "image" ? (
                    /* Images → JS column masonry with per-column skeletons. */
                    <>
                      <MasonryGrid
                        items={galleryItems}
                        getKey={(item) => item.id}
                        loadingMore={galleryLoadingMore}
                        renderItem={(item, i) => (
                          <MediaCard
                            item={item}
                            index={i}
                            selectable
                            selected={selectedImages.includes(item.src)}
                            onToggleSelect={(it) => toggleImage(it.src)}
                            onDownload={handleLibraryDownload}
                            onDelete={handleLibraryDelete}
                          />
                        )}
                      />
                      {/* Sentinel — scrolling into view fetches the next page. */}
                      {galleryHasMore && (
                        <div ref={librarySentinelRef} className="h-px w-full" />
                      )}
                    </>
                  ) : (
                    /* Video / audio / doc → CSS grid; skeletons append at bottom. */
                    <>
                      <div className={galleryGridClass(galleryType)}>
                        {galleryItems.map((item, i) => (
                          <MediaCard
                            key={item.id}
                            item={item}
                            index={i}
                            selectable
                            selected={selectedImages.includes(item.src)}
                            onToggleSelect={(it) => toggleImage(it.src)}
                            onDownload={handleLibraryDownload}
                            onDelete={handleLibraryDelete}
                          />
                        ))}
                        {galleryLoadingMore && (
                          <GallerySkeleton type={galleryType} count={4} />
                        )}
                      </div>
                      {/* Sentinel — scrolling into view fetches the next page. */}
                      {galleryHasMore && (
                        <div ref={librarySentinelRef} className="h-px w-full" />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ══ MAGIC TAB ═════════════════════════════════════════════════ */}
            {activeTabSafe === "magic" && (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Magic sub-tabs */}
                <div className="flex px-6 overflow-x-auto border-b border-gray-100 shrink-0 gap-0.5">
                  {MAGIC_SUBTABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveMagicTab(tab)}
                      className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition cursor-pointer border-b-2 ${
                        activeMagicTab === tab
                          ? "text-blue-600 border-blue-600"
                          : "text-gray-500 border-transparent hover:text-gray-800"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {/* Magic content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {renderMagicTab()}
                </div>
              </div>
            )}

            {/* ══ COMING SOON TAB ═══════════════════════════════════════════ */}
            {isComingSoon && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 text-gray-400 px-6">
                <p className="text-sm font-medium text-gray-500">
                  {comingSoonTabs.find((t) => t.id === activeTabSafe)?.label}
                </p>
                <p className="text-xs">Coming soon.</p>
              </div>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/60 shrink-0">
            <span className="text-xs text-gray-400">
              {totalSelected > 0
                ? `${totalSelected} item(s) selected`
                : "Nothing selected yet"}
            </span>
            <div className="flex gap-3">
              <button
                onClick={onCancel || onClose}
                className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={totalSelected === 0}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply {totalSelected > 0 ? `(${totalSelected})` : ""}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── tiny shared menu button ───────────────────────────────────────────────────
const MenuBtn = ({ icon: Icon, label, onClick, blue, red }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition cursor-pointer ${
      red
        ? "text-red-600 hover:bg-red-50"
        : blue
          ? "text-blue-600 hover:bg-blue-50"
          : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    <Icon className="w-4 h-4 shrink-0" /> {label}
  </button>
);
