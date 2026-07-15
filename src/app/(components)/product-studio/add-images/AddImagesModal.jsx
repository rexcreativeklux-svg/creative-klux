"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ADD_IMAGES_TABS } from "./tabs";
import AllTab from "./AllTab";
import UploadsTab from "./UploadsTab";
import PlaceholderTab from "./PlaceholderTab";

/**
 * AddImagesModal — Photoroom-style "Add images" picker.
 *
 * Opens when the user starts the "Edit a photo" flow. The All tab lets them
 * upload/drop images and pick from their recent Uploads; on confirm it hands
 * the selected item(s) back via onAdd so the parent can open the editor.
 *
 * Props
 * ─────
 * onClose       () => void
 * onAdd         (items: {id,url,name,file?,source}[]) => void
 * maxSelectable number  — selection cap (default 1 = single-select; the editor
 *                          opens one image. Raise it for multi-select.)
 */
export default function AddImagesModal({ onClose, onAdd, maxSelectable = 1 }) {
  const {
    myImages = [],
    myImagesLoading,
    fetchMyImages,
    uploadMedia,
    token,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState([]); // selected items
  const [localUploads, setLocalUploads] = useState([]); // this-session uploads

  // Refresh the library so the Uploads gallery reflects the latest images.
  useEffect(() => {
    if (token) fetchMyImages();
  }, [token, fetchMyImages]);

  // Normalize saved library images to the shared item shape.
  const libraryItems = useMemo(
    () =>
      (myImages || [])
        .filter((img) => img && (img.src || img.image_url || img.url))
        .map((img) => ({
          id: `lib-${img.id ?? img.src}`,
          url: img.src || img.image_url || img.url,
          name: img.filename || img.alt || "image",
          source: "library",
        })),
    [myImages],
  );

  // Uploads gallery = this-session uploads first, then saved library, deduped.
  const uploads = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const it of [...localUploads, ...libraryItems]) {
      if (seen.has(it.url)) continue;
      seen.add(it.url);
      out.push(it);
    }
    return out;
  }, [localUploads, libraryItems]);

  const isSelected = useCallback(
    (id) => selected.some((s) => s.id === id),
    [selected],
  );

  // Single-select swaps; multi-select respects the cap.
  const toggle = useCallback(
    (item) => {
      setSelected((prev) => {
        if (prev.some((s) => s.id === item.id))
          return prev.filter((s) => s.id !== item.id);
        if (maxSelectable === 1) return [item];
        if (prev.length >= maxSelectable) {
          toast(`You can select up to ${maxSelectable} images.`);
          return prev;
        }
        return [...prev, item];
      });
    },
    [maxSelectable],
  );

  // Uploaded/dropped files show instantly (object-URL preview) and are
  // auto-selected, then upload to the gallery in the background. On success the
  // blob URL is swapped for the saved gallery URL everywhere the item appears
  // (grid + selection), so the editor and future sessions get a persisted image
  // instead of a dead blob. On failure the optimistic item is dropped.
  const handleFiles = useCallback(
    (files) => {
      const items = files.map((file, i) => ({
        id: `upload-${file.name}-${file.size}-${file.lastModified}-${i}`,
        url: URL.createObjectURL(file),
        name: file.name,
        file,
        source: "upload",
        uploading: true,
      }));
      setLocalUploads((prev) => [...items, ...prev]);
      setSelected((prev) =>
        maxSelectable === 1
          ? [items[0]]
          : [...items, ...prev].slice(0, maxSelectable),
      );

      items.forEach(async (item) => {
        try {
          const res = await uploadMedia(item.file);
          const savedUrl =
            res?.file?.image_url ||
            res?.file?.url ||
            res?.image_url ||
            res?.url ||
            res?.data?.image_url ||
            res?.data?.url;
          if (!savedUrl) throw new Error("Upload succeeded but no URL returned");
          const persist = (arr) =>
            arr.map((it) =>
              it.id === item.id
                ? { ...it, url: savedUrl, file: undefined, uploading: false }
                : it,
            );
          setLocalUploads(persist);
          setSelected(persist);
          URL.revokeObjectURL(item.url);
        } catch (err) {
          toast.error(err?.message || "Upload failed");
          const drop = (arr) => arr.filter((it) => it.id !== item.id);
          setLocalUploads(drop);
          setSelected(drop);
          URL.revokeObjectURL(item.url);
        }
      });
    },
    [maxSelectable, uploadMedia],
  );

  const handleAdd = () => {
    if (!selected.length) return;
    onAdd(selected);
  };

  const renderTab = () => {
    // Shared data/handlers for the upload-driven grids (All + Uploads).
    const gridProps = {
      uploads,
      loading: myImagesLoading && uploads.length === 0,
      isSelected,
      onToggle: toggle,
      onFiles: handleFiles,
    };

    if (activeTab === "all") {
      return (
        <AllTab {...gridProps} onSeeAllUploads={() => setActiveTab("uploads")} />
      );
    }
    if (activeTab === "uploads") {
      return <UploadsTab {...gridProps} />;
    }
    const label = ADD_IMAGES_TABS.find((t) => t.id === activeTab)?.label || "";
    return <PlaceholderTab label={label} />;
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-2 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Add images</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center text-gray-50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-7 border-b border-gray-100 shrink-0">
          {ADD_IMAGES_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute left-0 -bottom-px h-0.5 w-full bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 py-5 min-h-0">
          {renderTab()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 shrink-0">
          {selected.length > 0 ? (
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={selected[selected.length - 1].url}
                alt=""
                className="w-9 h-9 rounded-md object-cover border border-gray-200 -rotate-6 shrink-0"
              />
              <span className="text-sm font-medium text-gray-700">
                {selected.length} selected
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Select images</span>
          )}

          <div className="flex items-center gap-4">
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
            <button
              onClick={handleAdd}
              disabled={
                selected.length === 0 || selected.some((s) => s.uploading)
              }
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-50 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {selected.some((s) => s.uploading)
                ? "Uploading…"
                : selected.length > 1
                  ? `Add ${selected.length} images`
                  : "Add image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
