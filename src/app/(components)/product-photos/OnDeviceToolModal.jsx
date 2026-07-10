"use client";

/**
 * Shared shell for the on-device Product Photos tools (Beautifier, Ghost
 * Mannequin, Flat Lay). It keeps the exact look of the other product modals
 * (ProductToolModal header switcher + quality/size dropdowns, BackgroundRemover
 * bottom toolbar + zoom) and drives an on-device engine hook underneath.
 *
 * Flow: pick image → auto-process at the current size/quality → lively
 * processing state with live % → result. Changing quality/size re-processes
 * (results cached per size+quality so switching back is instant). The sidebar is
 * locked while processing; a Cancel button appears there during a run. Download /
 * Save to gallery / Clear live in the bottom toolbar with a zoom control; a prompt
 * + "Generate photorealistic" refine the result on the backend.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Upload,
  Download,
  Bookmark,
  RotateCcw,
  Loader2,
  Sparkles,
  ImageOff,
  ChevronDown,
  Minus,
  Plus,
  User,
  Package,
  Image as ImageIcon,
  Scissors,
  Layers,
  Shirt,
  LayoutGrid,
  Video,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { QUALITY_RES } from "@/(lib)/ai-engine/hooks/toolParams";
import { generateImage } from "@/(lib)/ai-helpers";
import { buildPayload } from "./buildPayload";

// Pexels CDN helper for the quality-tier card thumbnails (matches ProductToolModal).
const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=600`;

// ── Header tool-switcher list (mirrors the product-photos page tools) ──
const TOOL_LIST = [
  {
    id: "virtual",
    name: "Virtual Model",
    Icon: User,
    color: "bg-pink-100 text-pink-600",
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=240&q=80",
  },
  {
    id: "staging",
    name: "Product Staging",
    Icon: Package,
    color: "bg-amber-100 text-amber-600",
    img: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=240&q=80",
  },
  {
    id: "bgremove",
    name: "Background Remover",
    Icon: Scissors,
    color: "bg-red-100 text-red-600",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=240&q=80",
  },
  {
    id: "beautifier",
    name: "Product Beautifier",
    Icon: Sparkles,
    color: "bg-yellow-100 text-yellow-600",
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=240&q=80",
  },
  {
    id: "start",
    name: "Edit with AI",
    Icon: ImageIcon,
    color: "bg-violet-100 text-violet-600",
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=240&q=80",
  },
  {
    id: "flatlay",
    name: "Flat Lay",
    Icon: LayoutGrid,
    color: "bg-cyan-100 text-cyan-600",
    img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=240&q=80",
  },
  {
    id: "mannequin",
    name: "Ghost Mannequin",
    Icon: Shirt,
    color: "bg-emerald-100 text-emerald-600",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=240&q=80",
  },
  {
    id: "batch",
    name: "Batch",
    Icon: Layers,
    color: "bg-purple-100 text-purple-600",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=240&q=80",
  },
  {
    id: "video",
    name: "Video Generator",
    Icon: Video,
    color: "bg-indigo-100 text-indigo-600",
    img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=240&q=80",
  },
];
const RECENT_TOOL_IDS = ["virtual", "staging"];

const SIZES = [
  { id: "original", name: "Original", w: 1, h: 1 },
  { id: "portrait_9_16", name: "Portrait (9:16)", w: 9, h: 16 },
  { id: "portrait_3_4", name: "Portrait (3:4)", w: 3, h: 4 },
  { id: "portrait_2_3", name: "Portrait (2:3)", w: 2, h: 3 },
  { id: "square", name: "Square", w: 1, h: 1 },
  { id: "landscape_3_2", name: "Landscape (3:2)", w: 3, h: 2 },
  { id: "landscape_4_3", name: "Landscape (4:3)", w: 4, h: 3 },
  { id: "landscape_16_9", name: "Landscape (16:9)", w: 16, h: 9 },
];

// Rich quality tiers shown as cards (restored from ProductToolModal).
const QUALITY_TIERS = [
  {
    id: "Ultra",
    name: "Premium",
    tag: "Ultra",
    tagColor: "bg-violet-100 text-violet-700",
    img: px(6780091),
    features: [
      "4k+ resolution",
      "Best product accuracy",
      "Most realistic results",
      "Highest quality",
      "Consumes most credits",
    ],
  },
  {
    id: "High",
    name: "Advanced",
    tag: "Max",
    tagColor: "bg-indigo-100 text-indigo-700",
    img: px(6780038),
    features: [
      "2k resolution",
      "Better product accuracy",
      "Realistic results",
      "High quality",
      "Consumes more credits",
    ],
  },
  {
    id: "Standard",
    name: "Standard",
    tag: "Pro",
    tagColor: "bg-emerald-100 text-emerald-700",
    img: px(6780036),
    features: [
      "1k resolution",
      "Good product accuracy",
      "Fast generations",
      "Consumes less credits",
    ],
  },
];

// ── Header tool-switcher card ──
function ToolCard({ tool, active, onClick }) {
  const [imgOk, setImgOk] = useState(true);
  const { Icon } = tool;
  return (
    <button
      onClick={() => onClick(tool.id)}
      className={`flex items-stretch justify-between gap-2 rounded-xl overflow-hidden h-16 text-left transition-colors ${active ? "ring-2 ring-violet-500 bg-violet-50" : "bg-gray-100 hover:bg-gray-100"}`}
    >
      <span className="text-sm font-semibold text-gray-900 leading-tight self-center pl-3.5 flex-1">
        {tool.name}
      </span>
      <div
        className={`w-20 shrink-0 flex items-center justify-center ${tool.color}`}
      >
        {imgOk ? (
          <img
            src={tool.img}
            alt={tool.name}
            className="w-full h-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <Icon className="w-6 h-6" />
        )}
      </div>
    </button>
  );
}

// Floating panel anchored BELOW its anchor (header dropdown).
function DropdownBelow({ anchorRef, children, width = 460 }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (anchorRef?.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
  }, [anchorRef]);
  return (
    <div
      className="fixed z-[210] bg-surface rounded-2xl shadow-2xl border border-gray-200 p-3 max-h-[80vh] overflow-y-auto"
      style={{ top: pos.top, left: pos.left, width }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

// Floating panel anchored to the RIGHT of the trigger, clamped to the viewport.
function FloatingPanel({ anchorRef, children, width = 320 }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  useEffect(() => {
    const a = anchorRef?.current;
    const p = panelRef.current;
    if (!a || !p) return;
    const r = a.getBoundingClientRect();
    const pw = p.offsetWidth || width;
    const ph = p.offsetHeight;
    const margin = 12;
    let left = r.right + 4;
    if (left + pw > window.innerWidth - margin) left = r.left - pw - 4;
    if (left < margin) left = window.innerWidth - pw - margin;
    left = Math.max(margin, left);
    let top = r.top;
    if (top + ph > window.innerHeight - margin)
      top = window.innerHeight - ph - margin;
    top = Math.max(margin, top);
    setPos({ top, left });
  }, [anchorRef, width]);
  return (
    <div
      ref={panelRef}
      className="fixed z-[200] bg-surface rounded-xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto"
      style={{ top: pos.top, left: pos.left, width }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.config Per-tool config (see onDeviceToolConfigs.jsx).
 * @param {() => void} props.onClose
 * @param {(id: string) => void} [props.onSwitchTool] Switch to another tool.
 */
export default function OnDeviceToolModal({ config, onClose, onSwitchTool }) {
  const {
    title,
    sample,
    defaultSize = "square",
    defaultQuality = "High",
    useTool,
    renderResult,
    renderExtra,
    hasZoom = true,
  } = config;

  const { token, uploadImage } = useAuth();
  const isLoggedIn = !!token;

  const fileInputRef = useRef(null);
  const qualityRef = useRef(null);
  const sizeRef = useRef(null);
  const headerRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null); // object URL of source
  const [uploadedFile, setUploadedFile] = useState(null);
  const [size, setSize] = useState(defaultSize);
  const [quality, setQuality] = useState(defaultQuality);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Cache of already-computed results, keyed by `${size}|${quality}`, so switching
  // back to a setting we've already processed is instant (no fresh run).
  const cacheRef = useRef(new Map());

  const handleSave = async (blob) => {
    if (!isLoggedIn) return false;
    const file = new File([blob], `${config.filePrefix}-${Date.now()}.png`, {
      type: "image/png",
    });
    await uploadImage(file);
    return true;
  };

  const tool = useTool(handleSave);
  const {
    resultImage,
    processing,
    failed,
    uploadProgress,
    run,
    download,
    cancel,
    reset,
  } = tool;

  const sizeObj = SIZES.find((s) => s.id === size);
  const busy = processing;

  const closeMenus = () => {
    setOpenDropdown(null);
    setToolMenuOpen(false);
  };

  // Process (or restore from cache) at a given size/quality. Tools with an
  // interactive result (Flat Lay) opt out of the blob cache — they must re-run so
  // their live layer state is rebuilt, not a stale flattened image.
  const process = (file, nextSize, nextQuality) => {
    const key = `${nextSize}|${nextQuality}`;
    if (!config.noResultCache) {
      const cached = cacheRef.current.get(key);
      if (cached) {
        tool.setResultBlob?.(cached);
        return;
      }
    }
    toast.info(`Processing your ${title.toLowerCase()}…`);
    run(file, {
      sizeId: nextSize,
      quality: nextQuality,
      onCache: config.noResultCache ? undefined : (blob) => cacheRef.current.set(key, blob),
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || busy) return;
    cacheRef.current.clear();
    setZoom(100);
    setUploadedFile(file);
    setUploadedImage((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    process(file, size, quality);
  };

  // Quality/size change → re-process ASAP (or restore from cache). Blocked while
  // busy (the controls are disabled then anyway).
  const changeQuality = (q) => {
    setQuality(q);
    setOpenDropdown(null);
    if (uploadedFile && !busy) process(uploadedFile, size, q);
  };
  const changeSize = (s) => {
    setSize(s);
    setOpenDropdown(null);
    if (uploadedFile && !busy) process(uploadedFile, s, quality);
  };

  const handleToolClick = (id) => {
    setToolMenuOpen(false);
    if (id === config.toolId) return;
    onSwitchTool?.(id);
  };

  const handleCancel = () => {
    cancel();
    setUploadedFile(null);
    setUploadedImage((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    cacheRef.current.clear();
    toast("Canceled — pick another image.");
  };

  const handleClear = () => {
    reset();
    setUploadedFile(null);
    setUploadedImage((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    cacheRef.current.clear();
    setZoom(100);
  };

  const handleDownload = () => download("hd", "png", "transparent");

  const doSave = async () => {
    if (!isLoggedIn) {
      toast.error("Log in to save to your gallery.");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const saved = await tool.saveToGallery("transparent");
      if (saved !== false) toast.success("Saved to gallery");
    } catch (err) {
      console.error("❌ save failed:", err);
      toast.error(err?.message || "Couldn't save to gallery");
    } finally {
      setSaving(false);
    }
  };

  // Generate (photoreal refinement): upload the current result, build the payload,
  // call the endpoint. No image-gen service is wired yet, so it fails gracefully.
  const doGenerate = async () => {
    if (!resultImage || generating) return;
    if (!isLoggedIn) {
      toast.error("Log in to generate a photorealistic render.");
      return;
    }
    setGenerating(true);
    try {
      const blob = await fetch(resultImage).then((r) => r.blob());
      const file = new File(
        [blob],
        `${config.filePrefix}-src-${Date.now()}.png`,
        { type: "image/png" },
      );
      const uploaded = await uploadImage(file);
      const imageUrl =
        uploaded?.url || uploaded?.image_url || uploaded?.file_url;
      if (!imageUrl)
        throw new Error("Couldn't get an image URL for generation.");
      const payload = buildPayload(config.toolId, {
        imageUrls: [imageUrl],
        quality,
        sizeId: size,
        prompt,
      });
      const result = await generateImage(payload);
      if (result?.url) {
        tool.setResultBlob?.(await fetch(result.url).then((r) => r.blob()));
        toast.success("Photorealistic render ready!");
      }
    } catch (err) {
      console.error("❌ generate failed:", err);
      toast.error("Photorealistic generation isn't available yet.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(
    () => () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage);
    },
    [],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const hasResult = !!resultImage;
  const showEmpty = !uploadedImage && !busy && !failed;
  const zoomActive = hasZoom;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3"
      onClick={closeMenus}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl flex overflow-hidden w-full h-full"
        style={{ maxWidth: "1500px", maxHeight: "940px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left sidebar ── */}
        <div className="w-84 border-r border-gray-200 flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Header — click the title to open the tool switcher */}
            <div className="px-5 pt-5 pb-1">
              <button
                ref={headerRef}
                onClick={() => setToolMenuOpen((o) => !o)}
                className="flex items-center gap-2 font-bold text-2xl text-gray-900 hover:opacity-70 transition-opacity"
              >
                {title}
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${toolMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Upload */}
            <div className="px-4 pt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="w-full border border-dashed border-gray-200 rounded-2xl py-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Drop a file or{" "}
                <span className="text-violet-600 font-semibold">
                  select an image
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={busy}
              />
            </div>

            {uploadedImage && (
              <div className="px-4 pt-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-violet-500">
                  <img
                    src={uploadedImage}
                    alt="product"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Option rows */}
            <div className="px-4 pt-4 pb-3 space-y-2.5">
              <button
                ref={qualityRef}
                onClick={() =>
                  !busy &&
                  setOpenDropdown((d) => (d === "quality" ? null : "quality"))
                }
                disabled={busy}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-gray-900 font-medium">Quality</span>
                <span className="text-gray-500 flex items-center gap-2">
                  {QUALITY_TIERS.find((t) => t.id === quality)?.name || quality}
                  <span className="text-[11px] font-bold text-gray-900 bg-surface border border-gray-200 shadow-sm rounded-md px-1.5 py-0.5">
                    {QUALITY_RES[quality]}
                  </span>
                </span>
              </button>

              <button
                ref={sizeRef}
                onClick={() =>
                  !busy &&
                  setOpenDropdown((d) => (d === "size" ? null : "size"))
                }
                disabled={busy}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-gray-900 font-medium">Size</span>
                <span className="text-gray-500">{sizeObj?.name}</span>
              </button>

              {renderExtra?.({ tool, busy, quality, size })}

              {/* Prompt — always available (used by Generate). */}
              <div className="rounded-2xl bg-gray-100 px-4 py-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want (optional)"
                  disabled={busy}
                  className="w-full text-sm text-gray-500 placeholder:text-gray-500 bg-transparent outline-none resize-none leading-relaxed disabled:opacity-50"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Pinned footer — Generate (always) / Cancel (while processing) */}
          <div className="px-4 pb-5 pt-3 border-t border-gray-200 bg-surface">
            <AnimatePresence mode="wait" initial={false}>
              {busy ? (
                <motion.button
                  key="cancel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  onClick={handleCancel}
                  className="w-full py-3.5 rounded-2xl text-sm cursor-pointer font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </motion.button>
              ) : (
                <motion.button
                  key="generate"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  onClick={doGenerate}
                  disabled={generating || !hasResult}
                  className="w-full py-3.5 rounded-2xl text-sm cursor-pointer font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 bg-linear-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate photorealistic
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right content ── */}
        <div className="flex-1 flex flex-col relative bg-[#f8f8f8] dark:bg-canvas min-w-0">
          {/* Close — large + clearly visible */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-surface rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-500 shadow-md cursor-pointer transition-all"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Canvas / interacting space */}
          <div className="flex-1 min-h-0 flex items-center justify-center p-8 overflow-auto">
            <AnimatePresence mode="wait" initial={false}>
              {showEmpty ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center px-6"
                >
                  <div className="flex items-center gap-3 mb-9">
                    <div className="w-44 h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-lg -rotate-3">
                      <img
                        src={sample.before}
                        alt="before"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <svg
                      width="72"
                      height="60"
                      viewBox="0 0 72 60"
                      fill="none"
                      className="text-violet-500 shrink-0 -mt-6"
                    >
                      <path
                        d="M6 44 C 24 8, 50 8, 62 32"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M62 32 L51 28 M62 32 L55 42"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="w-44 h-56 bg-surface rounded-2xl shadow-lg overflow-hidden border border-gray-200 rotate-3">
                      <img
                        src={sample.after}
                        alt="after"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <h3 className="text-gray-900 text-center text-lg font-semibold max-w-sm leading-snug">
                    {sample.headline}
                  </h3>
                  <p className="text-gray-500 text-center text-sm mt-2 max-w-xs leading-relaxed">
                    {sample.subtext}
                  </p>
                </motion.div>
              ) : failed ? (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center gap-3 text-center max-w-xs"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500">
                    <ImageOff className="h-7 w-7" />
                  </span>
                  <p className="text-sm font-medium text-gray-800">
                    Couldn&apos;t process that image
                  </p>
                  <p className="text-xs text-gray-500">
                    Something went wrong. Please try another image.
                  </p>
                  <button
                    onClick={handleClear}
                    className="mt-1 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                  >
                    <RotateCcw className="h-4 w-4" /> Try another image
                  </button>
                </motion.div>
              ) : busy ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-linear-to-br from-violet-50 to-indigo-50 dark:from-canvas dark:to-canvas shadow-inner">
                    {uploadedImage && (
                      <img
                        src={uploadedImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md scale-110"
                      />
                    )}
                    <motion.div
                      className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/50 to-transparent"
                      animate={{ x: ["-120%", "320%"] }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="relative flex items-center justify-center">
                        <motion.span
                          className="absolute h-20 w-20 rounded-full border-2 border-violet-400/40"
                          animate={{
                            scale: [1, 1.35, 1],
                            opacity: [0.6, 0, 0.6],
                          }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur">
                          <Sparkles className="h-6 w-6 text-violet-600 animate-pulse" />
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium text-gray-700">
                          Working on your image…
                        </span>
                        <span className="text-xs font-bold text-violet-600">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-40 h-1.5 rounded-full bg-white/50 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-500"
                          animate={{ width: `${Math.max(6, uploadProgress)}%` }}
                          transition={{ ease: "easeOut", duration: 0.4 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-center"
                  style={
                    zoomActive
                      ? {
                          transform: `scale(${zoom / 100})`,
                          transformOrigin: "center",
                        }
                      : undefined
                  }
                >
                  {renderResult ? (
                    renderResult({ tool, resultImage })
                  ) : (
                    <img
                      src={resultImage}
                      alt={title}
                      className="max-h-[70vh] max-w-full object-contain rounded-2xl"
                      style={{
                        background:
                          "repeating-conic-gradient(#e4e4e7 0% 25%, #fff 0% 50%) 50% / 20px 20px",
                      }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom toolbar — Download/Save/Clear (left) + zoom (right) */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-surface/90 backdrop-blur-sm border-t border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!hasResult || busy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                onClick={doSave}
                disabled={!hasResult || saving || busy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-100 hover:border-violet-400 hover:text-violet-600 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                {isLoggedIn ? "Save to gallery" : "Log in to save"}
              </button>
              <button
                onClick={handleClear}
                disabled={(!uploadedImage && !hasResult) || busy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-100 hover:border-violet-400 hover:text-violet-600 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            {zoomActive && (
              <div className="flex items-center gap-1 bg-surface rounded-full border border-gray-200 shadow-sm px-2 py-1">
                <button
                  onClick={() => setZoom((z) => Math.max(25, z - 25))}
                  className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                >
                  <Minus className="w-3 h-3 text-gray-500" />
                </button>
                <span className="text-xs text-gray-500 w-10 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                  className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tool switcher (header dropdown) ── */}
      {toolMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[205]"
            onClick={() => setToolMenuOpen(false)}
          />
          <DropdownBelow anchorRef={headerRef} width={460}>
            <p className="text-xs font-semibold text-gray-500 px-1 mb-2">
              Recently used
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {RECENT_TOOL_IDS.map((id) => {
                const t = TOOL_LIST.find((x) => x.id === id);
                if (!t) return null;
                return (
                  <ToolCard
                    key={`recent-${t.id}`}
                    tool={t}
                    active={t.id === config.toolId}
                    onClick={handleToolClick}
                  />
                );
              })}
            </div>
            <p className="text-xs font-semibold text-gray-500 px-1 mb-2">
              All tools
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TOOL_LIST.map((t) => (
                <ToolCard
                  key={t.id}
                  tool={t}
                  active={t.id === config.toolId}
                  onClick={handleToolClick}
                />
              ))}
            </div>
          </DropdownBelow>
        </>
      )}

      {/* ── Floating dropdowns ── */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-[195]"
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {openDropdown === "quality" && (
        <FloatingPanel anchorRef={qualityRef} width={380}>
          <div className="p-2 space-y-2">
            {QUALITY_TIERS.map((t) => {
              const active = quality === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => changeQuality(t.id)}
                  className={`w-full flex items-stretch gap-3 p-2.5 rounded-2xl border-2 text-left transition-colors ${active ? "border-violet-500 bg-violet-50/40" : "border-gray-200 hover:border-gray-200 bg-surface"}`}
                >
                  <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={t.img}
                      alt={t.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900">
                          {t.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${t.tagColor}`}
                        >
                          {t.tag}
                        </span>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-violet-600" : "border-2 border-gray-200"}`}
                      >
                        {active && (
                          <span className="text-white text-[10px]">✓</span>
                        )}
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {t.features.map((f) => (
                        <li
                          key={f}
                          className="text-[11px] text-gray-500 leading-snug"
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              );
            })}
          </div>
        </FloatingPanel>
      )}

      {openDropdown === "size" && (
        <FloatingPanel anchorRef={sizeRef} width={380}>
          <div className="grid grid-cols-3 gap-2.5 p-3">
            {SIZES.map((s) => {
              const active = size === s.id;
              const maxDim = 64;
              const bw = s.w >= s.h ? maxDim : Math.round((maxDim * s.w) / s.h);
              const bh = s.h >= s.w ? maxDim : Math.round((maxDim * s.h) / s.w);
              return (
                <button
                  key={s.id}
                  onClick={() => changeSize(s.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-colors ${active ? "border-violet-500 bg-violet-50/40" : "border-gray-200 hover:border-gray-200"}`}
                >
                  <div className="flex items-center justify-center h-20 relative w-full">
                    <div
                      className={`rounded-md ${active ? "bg-violet-300" : "bg-gray-100"}`}
                      style={{ width: bw, height: bh }}
                    />
                    {active && (
                      <div className="absolute top-0 right-0 w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px]">✓</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 text-center leading-tight">
                    {s.name}
                  </span>
                </button>
              );
            })}
          </div>
        </FloatingPanel>
      )}
    </div>
  );
}
