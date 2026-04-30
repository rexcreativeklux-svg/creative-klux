// components/MediaPickerModal.jsx
// Unified media picker — Search | Library | Magic Studio | Upload
// Drop-in replacement: replaces SearchMediaModal, LibraryMediaModal, MagicMediaModal + upload button

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileSearch, FolderOpen, Sparkles, FileUp,
  Loader2, X, CheckCircle2, Download, Trash2,
  MoreVertical, PlusCircleIcon, Film,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Toast from "./Toast";

// ── Magic sub-tabs (same as MagicMediaModal) ─────────────────────────────────
import TextToImageTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/text-to-image/page";
import TextToAudioTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/text-to-audio/page";
import TextToVideoTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/text-to-video/page";
import ImageToVariationsTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/image-to-variations/page";
import ScriptToVoiceoverToVideoTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/script-to-voiceover/page";
import AudioToTextTab from "../(dashboard)/(pages)/old-studio/ai-studio/create/audio-to-text/page";
import PersonaBasedGeneratorTab from "../(dashboard)/(pages)/old-studio/designer-creatives/create/tabs/persona-based-generator/page";

// ─────────────────────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id: "search",  label: "Search Media",  icon: FileSearch },
  { id: "library", label: "Your Library",  icon: FolderOpen },
  { id: "magic",   label: "Magic Studio",  icon: Sparkles   },
  { id: "upload",  label: "Upload File",   icon: FileUp     },
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
}) {
  // ── tab state ──────────────────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState(initialTab);
  const [activeMagicTab, setActiveMagicTab] = useState(MAGIC_SUBTABS[0]);

  // ── selection ──────────────────────────────────────────────────────────────
  const [selectedImages, setSelectedImages] = useState([]); // search / library
  const [selectedMedia,  setSelectedMedia]  = useState([]); // magic

  // ── search tab ─────────────────────────────────────────────────────────────
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchResults,    setSearchResults]    = useState([]);
  const [searchLoading,    setSearchLoading]    = useState(false);
  const [searchMenuOpen,   setSearchMenuOpen]   = useState(null);

  // ── library tab ───────────────────────────────────────────────────────────
  const [libMenuOpen, setLibMenuOpen] = useState(null);
  const libFileRef   = useRef(null);

  // ── upload tab ────────────────────────────────────────────────────────────
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadDragging, setUploadDragging] = useState(false);
  const uploadFileRef = useRef(null);

  // ── toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const notify = useCallback(
    (msg) => externalToast ? externalToast(msg) : setToast({ isOpen: true, message: msg }),
    [externalToast],
  );

  // ── auth context (library) ─────────────────────────────────────────────────
  const {
    token,
    uploadImage,
    fetchMyImages,
    deleteImage,
    myImages: ctxMyImages = [],
    myImagesLoading,
  } = useAuth();

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

  // ── library: fetch when tab opens ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen && activeTab === "library" && token) fetchMyImages();
  }, [isOpen, activeTab, token, fetchMyImages]);

  // ── search: auto-fetch ────────────────────────────────────────────────────
  const brandFallback = postData?.brandName?.trim() || activeBrand?.name?.trim() || "premium marketing lifestyle";

  const doSearch = useCallback(async (query) => {
    if (!query) return;
    setSearchLoading(true);
    try {
      const res  = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=60`);
      const data = await res.json();
      setSearchResults(
        (data.photos || []).map((p) => ({
          id: p.id, src: p.src.medium,
          large: p.src.large2x || p.src.large,
          alt: p.alt || query,
        }))
      );
    } catch { notify("Failed to load images."); setSearchResults([]); }
    finally  { setSearchLoading(false); }
  }, [notify]);

  useEffect(() => {
    if (!isOpen || activeTab !== "search") return;
    const t = setTimeout(
      () => doSearch(searchQuery.trim() || `${brandFallback} marketing ad`),
      600,
    );
    return () => clearTimeout(t);
  }, [isOpen, activeTab, searchQuery, brandFallback, doSearch]);

  if (!isOpen) return null;

  // ── selection helpers ─────────────────────────────────────────────────────
  const toggleImage = (src) => {
    setSelectedImages((prev) =>
      prev.includes(src)
        ? prev.filter((s) => s !== src)
        : prev.length >= MAX_SELECT ? (notify(`Max ${MAX_SELECT} images`), prev) : [...prev, src],
    );
  };

  const toggleMedia = (src) =>
    setSelectedMedia((prev) =>
      prev.includes(src)
        ? prev.filter((s) => s !== src)
        : prev.length >= MAX_SELECT ? (notify(`Max ${MAX_SELECT} items`), prev) : [...prev, src],
    );

  // ── apply ─────────────────────────────────────────────────────────────────
  const handleApply = () => {
    // merge everything the parent needs
    const combined = [
      ...selectedImages.map((src) => {
        const found = searchResults.find((r) => r.src === src);
        return found || { src };
      }),
      ...uploadedFiles,
    ];
    onApply(combined, selectedMedia);
  };

  const totalSelected = selectedImages.length + selectedMedia.length + uploadedFiles.length;

  // ── upload helpers ────────────────────────────────────────────────────────
  const handleUploadFiles = (files) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return notify("Image files only.");
    const next = imgs.map((f) => {
      const url = URL.createObjectURL(f);
      return { src: url, large: url, file: f, id: `upload-${Date.now()}-${Math.random()}` };
    });
    setUploadedFiles((prev) => [...prev, ...next]);
    notify(`${imgs.length} file(s) ready`);
  };

  // ── library upload ────────────────────────────────────────────────────────
  const handleLibUpload = async (e) => {
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    notify(`Uploading ${files.length} image(s)…`);
    for (const f of files) { try { await uploadImage(f); } catch {} }
    await fetchMyImages();
    notify("Uploaded!");
    e.target.value = "";
  };

  // ── download helper ───────────────────────────────────────────────────────
  const handleDownload = async (img) => {
    notify("Downloading…");
    try {
      const url = img.large || img.src;
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      const blob = await res.blob();
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `image-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`,
      });
      a.click(); URL.revokeObjectURL(a.href);
      notify("Downloaded!");
    } catch { notify("Download failed"); }
  };

  // ── magic tab renderer ────────────────────────────────────────────────────
  const renderMagicTab = () => {
    const shared = { selectedMedia, handleSelectMedia: toggleMedia };
    const map = {
      "Text to Image":               <TextToImageTab       {...shared} postData={postData} activeBrand={activeBrand} />,
      "Text to Audio":               <TextToAudioTab       {...shared} />,
      "Text to Video":               <TextToVideoTab       {...shared} />,
      "Image to Variations":         <ImageToVariationsTab {...shared} brandName={postData?.brandName} postData={postData} activeBrand={activeBrand}
                                        onClose={onClose} />,
      "Script to Voiceover to Video":<ScriptToVoiceoverToVideoTab {...shared} />,
      "Audio to Text":               <AudioToTextTab       {...shared} />,
      "Persona-based Generator":     <PersonaBasedGeneratorTab  {...shared} />,
    };
    return map[activeMagicTab] ?? <p className="text-sm text-gray-400 p-4">Select a tab above.</p>;
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
        <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">

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
            {MAIN_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  activeTab === id
                    ? "border-blue-600 text-blue-600 bg-blue-50/60"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ──────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">

            {/* ══ SEARCH TAB ════════════════════════════════════════════════ */}
            {activeTab === "search" && (
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
                    onClick={() => doSearch(searchQuery.trim() || brandFallback)}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition cursor-pointer"
                  >
                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pb-2">
                  {searchLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="text-center text-gray-400 py-16 text-sm">No results yet. Try a search above.</p>
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
                                src={img.src} alt={img.alt}
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
                                onClick={(e) => { e.stopPropagation(); setSearchMenuOpen(searchMenuOpen === img.id ? null : img.id); }}
                                className="absolute top-2 left-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              {searchMenuOpen === img.id && (
                                <div className="absolute top-9 left-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-20 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                                  <MenuBtn icon={Download} label="Download" onClick={() => { handleDownload(img); setSearchMenuOpen(null); }} />
                                  <MenuBtn icon={PlusCircleIcon} label="Add to Brand" blue onClick={() => { onAddToBrand?.(img); notify("Added to brand!"); setSearchMenuOpen(null); }} />
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
            {activeTab === "library" && (
              <div className="flex flex-col flex-1 min-h-0 px-6 pt-4 gap-4">
                {/* Upload button */}
                <div className="shrink-0 flex items-center gap-3 pb-3 border-b border-gray-100">
                  <button
                    onClick={() => libFileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition cursor-pointer"
                  >
                    <FileUp className="w-4 h-4" /> Upload to Library
                  </button>
                  <input ref={libFileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleLibUpload} />
                  <span className="text-xs text-gray-400">{ctxMyImages.length} images in your library</span>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pb-2">
                  {myImagesLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : ctxMyImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                      <FolderOpen className="w-12 h-12 text-gray-200" />
                      <p className="text-sm">Your library is empty. Upload some images to get started.</p>
                    </div>
                  ) : (
                    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
                      {ctxMyImages.map((img, i) => {
                        const url    = typeof img === "string" ? img : (img.src || img.image_url || img.url);
                        const hasId  = typeof img === "object" && img.id;
                        const menuId = `lib-${hasId ? img.id : i}`;
                        const isSel  = selectedImages.includes(url);
                        return (
                          <div
                            key={menuId}
                            className="relative group break-inside-avoid mb-3 cursor-pointer"
                            onClick={() => toggleImage(url)}
                          >
                            <div className="relative overflow-hidden rounded-xl shadow-sm border border-gray-100">
                              <img src={url} alt={`Library ${i + 1}`} className="w-full h-auto block rounded-xl" onError={(e) => (e.currentTarget.style.display = "none")} />
                              {isSel && (
                                <>
                                  <div className="absolute inset-0 ring-4 ring-blue-600 ring-inset rounded-xl pointer-events-none" />
                                  <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow z-10">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                </>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setLibMenuOpen(libMenuOpen === menuId ? null : menuId); }}
                                className="absolute top-2 left-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              {libMenuOpen === menuId && (
                                <div className="absolute top-9 left-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-20 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                                  <MenuBtn icon={Download} label="Download" onClick={() => { handleDownload({ src: url, large: url }); setLibMenuOpen(null); }} />
                                  {hasId && (
                                    <MenuBtn icon={Trash2} label="Delete" red onClick={async () => {
                                      if (!confirm("Delete permanently?")) return setLibMenuOpen(null);
                                      notify("Deleting…");
                                      try { await deleteImage(img.id); await fetchMyImages(); notify("Deleted!"); }
                                      catch (e) { notify(e.message || "Delete failed"); }
                                      setLibMenuOpen(null);
                                    }} />
                                  )}
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

            {/* ══ MAGIC TAB ═════════════════════════════════════════════════ */}
            {activeTab === "magic" && (
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

            {/* ══ UPLOAD TAB ════════════════════════════════════════════════ */}
            {activeTab === "upload" && (
              <div className="flex flex-col flex-1 min-h-0 px-6 pt-6 gap-4">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setUploadDragging(true); }}
                  onDragLeave={() => setUploadDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setUploadDragging(false); handleUploadFiles(e.dataTransfer.files); }}
                  onClick={() => uploadFileRef.current?.click()}
                  className={`shrink-0 flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    uploadDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40"
                  }`}
                >
                  <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
                    <FileUp className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Drop images here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, GIF — up to 5 files</p>
                  </div>
                  <input
                    ref={uploadFileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { handleUploadFiles(e.target.files); e.target.value = ""; }}
                  />
                </div>

                {/* Preview uploaded */}
                {uploadedFiles.length > 0 && (
                  <div className="flex-1 overflow-y-auto pb-2">
                    <p className="text-xs font-medium text-gray-500 mb-3">{uploadedFiles.length} file(s) ready to apply</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {uploadedFiles.map((f, i) => (
                        <div key={f.id} className="relative group">
                          <img src={f.src} alt={`upload-${i}`} className="w-full h-24 object-cover rounded-xl border border-gray-100 shadow-sm" />
                          <button
                            onClick={() => setUploadedFiles((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/60 shrink-0">
            <span className="text-xs text-gray-400">
              {totalSelected > 0 ? `${totalSelected} item(s) selected` : "Nothing selected yet"}
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
      red  ? "text-red-600 hover:bg-red-50"  :
      blue ? "text-blue-600 hover:bg-blue-50" :
             "text-gray-700 hover:bg-gray-100"
    }`}
  >
    <Icon className="w-4 h-4 shrink-0" /> {label}
  </button>
);