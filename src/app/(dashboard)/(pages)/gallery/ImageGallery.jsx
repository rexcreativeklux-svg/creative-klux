"use client";

// app/(dashboard)/(pages)/gallery/ImageGallery.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The user's media gallery. Media-type tabs (Images · Videos · Audio · Docs) are
// the primary navigation; Search (Pexels stock) and Upload are toolbar actions.
// The library, and Pexels results, both render through the shared <MediaCard> so
// every gallery surface in the app looks and behaves the same.

import { useState, useCallback } from "react";
import {
  Search,
  Image as ImageIcon,
  Upload,
  CloudUpload,
  Loader2,
  FolderPlus,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import NotificationModal from "@/app/(components)/NotificationModal";
import useGalleryMedia from "@/app/(components)/gallery/useGalleryMedia";
import useInfiniteScroll from "@/app/(components)/gallery/useInfiniteScroll";
import MediaTypeTabs from "@/app/(components)/gallery/MediaTypeTabs";
import MediaCard from "@/app/(components)/gallery/MediaCard";
import MasonryGrid from "@/app/(components)/gallery/MasonryGrid";
import GallerySkeleton from "@/app/(components)/gallery/GallerySkeleton";
import UploadMediaModal from "@/app/(components)/gallery/UploadMediaModal";
import { galleryGridClass } from "@/app/(components)/gallery/mediaTypes";
import { downloadGalleryItem } from "@/app/(components)/gallery/downloadMedia";
import { saveUrlToGallery } from "@/app/(components)/product-studio/saveToGallery";
import { FILE_LIMITS, getFileCategory, describeSupportedTypes } from "@/utils/helpers";

export default function ImageGallery() {
  const { uploadMedia, deleteImage } = useAuth();
  const {
    tabs,
    activeType,
    setActiveType,
    items,
    counts,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useGalleryMedia();

  // Infinite scroll — fetch the next page as the sentinel (below the grid)
  // scrolls into view. Runs against the window, which is the page's scroller.
  const sentinelRef = useInfiniteScroll({ onLoadMore: loadMore, hasMore, loading });

  // ── Toolbar / modes ──────────────────────────────────────────────────────
  const [searchMode, setSearchMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // ── Pexels search state ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [pexelsType, setPexelsType] = useState("Images");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const notify = (title, message, type = "info") =>
    setNotification({ title, message, type });

  // ── Shared item actions (library) ────────────────────────────────────────
  const copyLink = (item) => {
    navigator.clipboard.writeText(item.src);
    toast.success("Link copied to clipboard");
  };

  const downloadItem = async (item) => {
    try {
      await downloadGalleryItem(item);
    } catch (err) {
      // Cross-origin CDNs may block a fetch → fall back to opening the file.
      console.warn("↩️ [gallery] download failed, opening in tab:", err);
      toast.error("Couldn't download that file — opening it instead.");
      window.open(
        item.downloadUrl || item.src,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  const deleteItem = async (item) => {
    if (!confirm("Delete this permanently? This cannot be undone.")) return;
    notify("Deleting…", "Please wait", "info");
    try {
      await deleteImage(item.id);
      await refresh?.();
      notify("Deleted!", "Item permanently removed", "success");
    } catch (err) {
      notify(
        "Delete failed",
        err.message || "Could not delete the item",
        "error",
      );
    }
  };

  // ── Upload (images) ──────────────────────────────────────────────────────
  const handleFileUpload = useCallback(
    async (files) => {
      if (!files?.length) return;

      // 1. Validate type + size per file (plain toasts for rejections).
      const valid = Array.from(files).filter((file) => {
        const category = getFileCategory(file);
        if (!category) {
          toast.error(
            `${file.name} isn't a supported file type. Supported: ${describeSupportedTypes()}.`,
          );
          return false;
        }
        const maxSize = FILE_LIMITS[category];
        if (file.size > maxSize) {
          const maxMB = maxSize / (1024 * 1024);
          toast.error(
            `${file.name} is too large — max ${maxMB}MB for ${category}s.`,
          );
          return false;
        }
        return true;
      });

      if (!valid.length) return;

      // 2. Upload each survivor (one loading toast, resolved at the end).
      const toastId = toast.loading(`Uploading ${valid.length} file(s)…`);
      setIsUploading(true);
      let ok = 0;
      let lastError = null;
      const uploadedCategories = new Set(); // Track what types were uploaded

      for (const file of valid) {
        try {
          // console.log(file)
          await uploadMedia(file);
          uploadedCategories.add(getFileCategory(file));
          ok++;
        } catch (err) {
          console.error(`❌ [gallery] upload failed for ${file.name}:`, err);
          lastError = err;
        }
      }

      // 3. Refresh + report the outcome on the same toast.
      await refresh?.();
      setIsUploading(false);

      if (ok > 0) {
        // Jump to the tab of what we just uploaded.
        const firstCategory = Array.from(uploadedCategories)[0];
        if (firstCategory) setActiveType(firstCategory);
        toast.success(`${ok} file(s) uploaded successfully`, { id: toastId });
      } else {
        toast.error(lastError?.message || "Nothing was uploaded", {
          id: toastId,
        });
      }
    },
    [uploadMedia, refresh, setActiveType],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  // ── Pexels search ────────────────────────────────────────────────────────
  const getVideoUrl = (videoFiles) => {
    if (!videoFiles?.length) return null;
    const hd = videoFiles.find((f) => f.quality === "hd");
    return (hd || videoFiles[0]).link;
  };

  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const type = pexelsType === "Images" ? "photos" : "videos";
      const res = await fetch(
        `/api/pexels?query=${encodeURIComponent(searchQuery)}&type=${type}`,
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const raw =
        pexelsType === "Images" ? data.photos || [] : data.videos || [];
      // Normalize into the shared MediaCard item shape.
      setSearchResults(
        pexelsType === "Images"
          ? raw.map((p) => ({
              id: `px-${p.id}`,
              type: "image",
              src: p.src?.medium || p.src?.original,
              alt: p.alt || "Pexels photo",
              filename: `pexels-${p.id}.jpg`,
              downloadUrl: p.src?.original || p.src?.large,
            }))
          : raw.map((p) => {
              const link = getVideoUrl(p.video_files);
              return {
                id: `px-${p.id}`,
                type: "video",
                src: link,
                alt: "Pexels video",
                filename: `pexels-${p.id}.mp4`,
                downloadUrl: link,
              };
            }),
      );
    } catch (err) {
      notify("Search failed", err.message || "Try again later", "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const saveSearchPhoto = async (item) => {
    notify("Saving…", "Adding to your gallery", "info");
    try {
      await saveUrlToGallery(item.downloadUrl || item.src, uploadMedia, {
        filePrefix: "pexels",
      });
      await refresh?.();
      notify("Saved!", "Added to your gallery", "success");
    } catch (err) {
      notify(
        "Save failed",
        err.message || "Could not save to gallery",
        "error",
      );
    }
  };

  const closeSearch = () => {
    setSearchMode(false);
    setSearchResults([]);
    setSearchQuery("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const activeLabel = tabs.find((t) => t.id === activeType)?.label || "media";

  return (
    <>
      {/* min-h-screen → min-h-full: the dashboard layout already owns the
          viewport height and its own scroll area, so a 100vh minimum here
          stacked on top of the layout's padding and forced a second scrollbar
          on short screens. */}
      <div className="min-h-full px-gutter py-page-y">
        {/* Header */}
        <header className="bg-blue-600 text-white px-card py-5 sm:px-8 sm:py-6 rounded-xl shadow-lg mb-6">
          <div className="flex items-center gap-3">
            <ImageIcon size={30} className="shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-none">My Gallery</h1>
              <p className="text-sm text-white/80 mt-1">
                All your media in one place — images, videos, audio &amp; docs.
              </p>
            </div>
          </div>
        </header>

        {searchMode ? (
          /* ══ SEARCH MODE (Pexels stock) ══════════════════════════════════ */
          <div>
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={closeSearch}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} /> Back to gallery
              </button>
            </div>
            <div className="bg-surface rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-wrap gap-3 items-center">
                <input
                  type="text"
                  placeholder="Search millions of free stock images & videos…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  // `min-w-60` (240px) plus the type select and search button
                  // could not share a 360px row, so the group overflowed. The
                  // minimum only applies once there is room for it.
                  className="flex-1 w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:w-auto sm:min-w-60"
                  autoFocus
                />
                <select
                  value={pexelsType}
                  onChange={(e) => setPexelsType(e.target.value)}
                  className="px-3 py-2.5 border cursor-pointer border-gray-200 rounded-lg"
                >
                  <option value="Images">Images</option>
                  <option value="Videos">Videos</option>
                </select>
                <button
                  onClick={runSearch}
                  disabled={searchLoading}
                  className="px-6 py-2.5 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-60"
                >
                  {searchLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Search size={20} />
                  )}
                  Search
                </button>
              </div>
            </div>

            {searchLoading ? (
              <div className="text-center py-24">
                <Loader2
                  className="mx-auto animate-spin text-blue-500"
                  size={44}
                />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                Search for images or videos to see results.
              </div>
            ) : (
              <div
                className={galleryGridClass(
                  pexelsType === "Videos" ? "video" : "image",
                )}
              >
                {searchResults.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onDownload={downloadItem}
                    onCopyLink={copyLink}
                    extraActions={
                      item.type === "image"
                        ? [
                            {
                              icon: FolderPlus,
                              label: "Save to gallery",
                              onClick: saveSearchPhoto,
                            },
                          ]
                        : []
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ══ LIBRARY MODE ════════════════════════════════════════════════ */
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            {/* Toolbar: media-type tabs (primary) + Search / Upload actions */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
              <MediaTypeTabs
                tabs={tabs}
                active={activeType}
                onChange={setActiveType}
                counts={counts}
                variant="primary"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSearchMode(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                  disabled={isUploading}
                >
                  <Search size={18} /> Search stock
                </button>
                <button
                  onClick={() => setUploadOpen(true)}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isUploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                  Upload
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              /* The grid the tab is ABOUT to show, not a spinner — the layout
                 is known before the media is, and reusing the very components
                 that render the "loading more" state means the first page and
                 every page after it fill in identically. */
              activeType === "image" ? (
                <MasonryGrid
                  items={[]}
                  renderItem={() => null}
                  loadingMore
                  skeletonPerColumn={3}
                />
              ) : (
                <div className={galleryGridClass(activeType)}>
                  <GallerySkeleton type={activeType} count={8} />
                </div>
              )
            ) : items.length === 0 ? (
              <div
                className={`text-center py-24 rounded-2xl border-2 border-dashed transition-colors ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <CloudUpload size={56} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-gray-600">
                  No {activeLabel.toLowerCase()} yet
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {activeType === "image"
                    ? "Drop images here or use Upload to get started."
                    : `Your ${activeLabel.toLowerCase()} will appear here once you create or save some.`}
                </p>
              </div>
            ) : (
              <>
                {activeType === "image" ? (
                  /* Images → JS column masonry with per-column load-more skeletons. */
                  <MasonryGrid
                    items={items}
                    getKey={(item) => item.id}
                    loadingMore={loadingMore}
                    renderItem={(item, i) => (
                      <MediaCard
                        item={item}
                        index={i}
                        onDownload={downloadItem}
                        onCopyLink={copyLink}
                        onDelete={deleteItem}
                      />
                    )}
                  />
                ) : (
                  /* Video / audio / doc → CSS grid; skeletons append at the bottom. */
                  <div className={galleryGridClass(activeType)}>
                    {items.map((item, i) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        index={i}
                        onDownload={downloadItem}
                        onCopyLink={copyLink}
                        onDelete={deleteItem}
                      />
                    ))}
                    {loadingMore && (
                      <GallerySkeleton type={activeType} count={4} />
                    )}
                  </div>
                )}
                {/* Sentinel — scrolling this into view fetches the next page. */}
                {hasMore && <div ref={sentinelRef} className="h-px w-full" />}
              </>
            )}
          </div>
        )}
      </div>

      <UploadMediaModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleFileUpload}
      />

      <NotificationModal
        isOpen={!!notification}
        onClose={() => setNotification(null)}
        title={notification?.title}
        message={notification?.message}
        type={notification?.type || "info"}
        duration={3000}
      />
    </>
  );
}
