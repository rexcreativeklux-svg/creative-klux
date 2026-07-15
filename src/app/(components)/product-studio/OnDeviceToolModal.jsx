"use client";

/**
 * Shared shell for the on-device Product Studio tools (Beautifier, Ghost
 * Mannequin, Flat Lay). It keeps the exact look of the other product modals
 * (ProductToolModal header switcher + quality/size dropdowns, BackgroundRemover
 * bottom toolbar + zoom) and drives an on-device engine hook underneath.
 *
 * The whole modal revolves around ONE rule — the ACTIVE image:
 *   AI render (when open) → on-device result → source photo.
 * Whatever is on the canvas is what Download/Save export AND what the next
 * operation (either engine) takes as input, so the view is always truthful.
 *
 * Flow: pick an image from the gallery picker (My Library / Search / Upload,
 * single-select) → auto-process at the current size/quality → result. The two
 * engines chain freely off the active image:
 *   • "Generate photorealistic" sends the active image to the backend (the
 *     on-device result when one exists, the raw source right after a Cancel,
 *     or the previous AI render's hosted URL — no re-upload — for AI-on-AI
 *     refinement with a new prompt). Charging is server-side; the client only
 *     surfaces the 402/credits toast.
 *   • While the AI render is open, changing size/quality (or "Continue
 *     on-device") ADOPTS it: the render becomes the working source — a new
 *     source generation — and the on-device pipeline re-processes it.
 *   • "Back to preview" / "View AI render" flip between the AI render and the
 *     on-device result instantly (nothing is recomputed or re-fetched).
 *
 * Caching accuracy: on-device results are cached inside each tool hook keyed by
 * (source generation, quality) — see sourceCache.js. Switching back to an
 * already-processed quality is instant, but ONLY while the underlying image is
 * unchanged: after adopting an AI render the same quality correctly re-runs,
 * because the pixels changed. Cached re-runs go "soft" (no skeleton flash).
 *
 * Cancel never discards the user's image: canceling a run restores the last
 * completed result (reverting size/quality to match it), or falls back to the
 * source photo in a ready state; canceling a Generate just drops the response.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
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
  Maximize2,
  Wand2,
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useAuth } from "@/context/AuthContext";
import { QUALITY_RES } from "@/(lib)/ai-engine/hooks/toolParams";
import {
  generateProductPhoto,
  TOOL_ENUM,
  QUALITY_ENUM,
} from "@/(lib)/product-studio-api";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import { stashPendingSave, takePendingSave } from "./pendingSave";
import { SIZES, QUALITY_TIERS } from "./constants";
import ToolSwitcherDropdown from "./ToolSwitcherDropdown";
import QualityDropdown from "./QualityDropdown";
import SizeDropdown from "./SizeDropdown";

/**
 * Fetch a hosted image into a Blob the on-device engine can read pixels from.
 * Tries the URL directly first; if that fails (usually missing CORS headers on
 * the CDN), retries through our /api/proxy-image route.
 */
async function fetchImageBlob(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.blob();
  } catch {
    console.warn(
      "⚠️ [on-device] direct image fetch failed — retrying via proxy:",
      url,
    );
    const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Proxy fetch failed: HTTP ${res.status}`);
    return await res.blob();
  }
}

/**
 * Revoke an object URL — no-op for hosted (http/data) URLs. Object URLs live in
 * exactly ONE place at a time here (the working source preview), so the only
 * release sites are: replacing the source (new pick / AI adoption), Clear, and
 * unmount.
 */
function releaseUrl(url) {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

/**
 * Decode an image URL before swapping it on-screen so the reveal is instant and
 * complete (no half-loaded paint). Resolves regardless after a timeout — worst
 * case the <img> finishes loading in place.
 */
function preloadImage(url) {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, 8000);
    const img = new Image();
    img.onload = done;
    img.onerror = done;
    img.src = url;
  });
}

// ── Zoomable canvas surface (react-zoom-pan-pinch) ──
// Wheel/pinch zoom, drag pan, double-click to reset. The parent owns the ref so
// the bottom-toolbar controls (− / % / + / fit) drive whichever surface is
// currently mounted (on-device result or AI-generated view).
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;

// Exclusion lists must ALWAYS be arrays — react-zoom-pan-pinch crashes on
// undefined (isExcludedNode calls .some on it).
function ZoomCanvas({
  zoomRef,
  onScale,
  excluded = [],
  wheelExcluded = [],
  children,
}) {
  return (
    <TransformWrapper
      ref={zoomRef}
      minScale={ZOOM_MIN}
      maxScale={ZOOM_MAX}
      centerOnInit
      centerZoomedOut
      doubleClick={{ mode: "reset", excluded: wheelExcluded }}
      wheel={{ step: 0.15, excluded: wheelExcluded }}
      panning={{ excluded, velocityDisabled: true }}
      onTransform={(_, state) => onScale?.(state.scale)}
    >
      <TransformComponent
        wrapperStyle={{ width: "100%", height: "100%" }}
        contentStyle={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </TransformComponent>
    </TransformWrapper>
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
    // API-only tools (e.g. Ghost Mannequin, for now): skip ALL on-device
    // processing — the user picks an image (nothing runs), then hits the footer
    // "Generate photorealistic" to produce a render via the backend. The
    // on-device engine hook is still mounted but never invoked, so it can be
    // re-enabled later by flipping this flag off.
    apiOnly = false,
  } = config;

  const router = useRouter();
  const { token, uploadMedia, activeBrand, loading: authLoading } = useAuth();
  const isLoggedIn = !!token;

  const qualityRef = useRef(null);
  const sizeRef = useRef(null);
  const headerRef = useRef(null);

  // ── The working source: what the on-device pipeline consumes ──
  const [uploadedImage, setUploadedImage] = useState(null); // preview URL — object URL for fresh uploads, hosted URL for gallery picks / adopted AI renders
  const [uploadedFile, setUploadedFile] = useState(null);
  const [sourceKind, setSourceKind] = useState("upload"); // "upload" | "ai" — is the working source an adopted AI render?
  const [pickerOpen, setPickerOpen] = useState(false); // gallery media picker
  const [size, setSize] = useState(defaultSize);
  const [quality, setQuality] = useState(defaultQuality);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [applyBrandStyle, setApplyBrandStyle] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null); // hosted URL from Generate — the AI render view when set
  const [parkedAiUrl, setParkedAiUrl] = useState(null); // "Back to preview" parks the render here so "View AI render" can flip back instantly
  const [adopting, setAdopting] = useState(false); // fetching the AI render so on-device editing can continue from it
  const [zoomPct, setZoomPct] = useState(100); // readout only — RZPP owns the transform
  const zoomRef = useRef(null); // react-zoom-pan-pinch instance

  // Source GENERATION id — bumps whenever the working image's pixels change (new
  // pick, adopted AI render, clear). Every on-device cache is keyed by it (see
  // sourceCache.js), which is what makes cached switches accurate: a cached
  // quality is instant only while it's truly the same picture.
  const sourceIdRef = useRef(0);
  // The last COMPLETED on-device run — Cancel restores it (blob + the settings
  // that produced it) instead of throwing the user's work away.
  const lastGoodRef = useRef(null); // { blob, sourceId, size, quality }
  // Stale-guards: bumping a token makes any in-flight response a no-op.
  const generateTokenRef = useRef(0);
  const adoptTokenRef = useRef(0);
  const adoptPrevRef = useRef(null); // { size, quality } to revert if adoption is canceled/fails
  // Mirror for unmount cleanup (the cleanup closure would otherwise see the
  // first render's value and leak the final object URL).
  const uploadedImageRef = useRef(null);

  const handleSave = async (blob) => {
    if (!isLoggedIn) return false;
    const file = new File([blob], `${config.filePrefix}-${Date.now()}.png`, {
      type: "image/png",
    });
    await uploadMedia(file);
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
  const busy = processing || adopting; // the on-device pipeline is (re)building
  const locked = busy || generating; // either engine is working — options locked

  // The ACTIVE image — what the canvas shows, what Download/Save export, and
  // what the next operation (either engine) takes as input.
  const activeKind = generatedImage
    ? "ai"
    : resultImage
      ? "local"
      : uploadedImage
        ? "source"
        : null;

  const closeMenus = () => {
    setOpenDropdown(null);
    setToolMenuOpen(false);
  };

  // Process the working source at a given size/quality. Caching lives INSIDE
  // each tool hook, keyed by (source generation, quality): when the tool says
  // this combo is already cached (peekCached), the run goes "soft" — the
  // current result stays on screen and just swaps when ready (no skeleton
  // flash); a fresh combo shows the full processing state. Flat Lay never
  // caches (its interactive layers must be rebuilt), so it always runs hard.
  const process = (file, nextSize, nextQuality) => {
    const sourceKey = sourceIdRef.current;
    const soft = !!tool.peekCached?.({ sourceKey, quality: nextQuality });
    if (!soft) toast.info(`Processing your ${title.toLowerCase()}…`);
    run(file, {
      sizeId: nextSize,
      quality: nextQuality,
      sourceKey,
      soft,
      // Every completed run reports its blob — it's what Cancel restores.
      onCache: (blob) => {
        lastGoodRef.current = {
          blob,
          sourceId: sourceKey,
          size: nextSize,
          quality: nextQuality,
        };
      },
    });
  };

  // Kick off processing for a freshly picked File (from either picker path).
  // A brand-new source = a new source generation: caches keyed to the old image
  // can never be served for it, and any AI render belongs to the previous chain.
  const startWithFile = (file, previewUrl) => {
    sourceIdRef.current += 1;
    generateTokenRef.current += 1; // a pending Generate targets the old image — drop it
    setGenerating(false);
    lastGoodRef.current = null;
    setSourceKind("upload");
    setGeneratedImage(null);
    setParkedAiUrl(null);
    setUploadedFile(file);
    setUploadedImage((prev) => {
      releaseUrl(prev);
      return previewUrl || URL.createObjectURL(file);
    });
    // API-only tools don't auto-run on-device: the source just sits ready for
    // the user to hit "Generate photorealistic" (backend).
    if (!apiOnly) process(file, size, quality);
  };

  // Image comes from the gallery picker (My Library / Search / Upload) — ONE
  // image only (maxSelectable={1}). A fresh desktop upload carries a File the
  // engine can read directly; a library/search pick only has a hosted URL, so we
  // fetch it into a File (proxy fallback for CORS) — either way the downstream
  // process/cache/re-run flow works on a File exactly as before.
  const handleApplyFromPicker = async (images = []) => {
    setPickerOpen(false);
    const item = images[0];
    if (!item || busy) return;
    if (item.file instanceof File) {
      startWithFile(item.file, item.src || undefined);
      return;
    }
    const url = item.large || item.src || null;
    if (!url) return;
    try {
      const blob = await fetchImageBlob(url);
      // Name is engine-local only — upload paths re-wrap blobs with fresh names.
      const file = new File([blob], "gallery-pick.png", {
        type: blob.type || "image/png",
      });
      startWithFile(file, url);
    } catch (err) {
      console.error("❌ [on-device] couldn't load the gallery image:", err);
      toast.error("Couldn't load that image. Please try another one.");
    }
  };

  // Continue editing the AI render on-device: it becomes the working source —
  // a NEW source generation, so nothing cached for the previous image can ever
  // be served for it — then the pipeline re-processes it at the requested
  // settings. The fetch is cancellable; on failure nothing is lost (the AI
  // view stays exactly as it was, settings reverted).
  const adoptGenerated = async (nextSize, nextQuality) => {
    const url = generatedImage;
    if (!url || adopting) return;
    const token = (adoptTokenRef.current += 1);
    adoptPrevRef.current = { size, quality };
    setSize(nextSize);
    setQuality(nextQuality);
    setAdopting(true);
    toast.info("Continuing from the AI render — bringing it on-device…");
    try {
      const blob = await fetchImageBlob(url);
      if (token !== adoptTokenRef.current) return; // canceled — AI view untouched
      const file = new File(
        [blob],
        `${config.filePrefix}-ai-${Date.now()}.png`,
        {
          type: blob.type || "image/png",
        },
      );
      sourceIdRef.current += 1;
      lastGoodRef.current = null; // the previous result belongs to the old source
      setSourceKind("ai");
      setUploadedFile(file);
      setUploadedImage((prev) => {
        releaseUrl(prev);
        return url; // hosted URL — doubles as the source thumb
      });
      setGeneratedImage(null);
      setParkedAiUrl(null); // the render IS the source now — nothing to flip back to
      setAdopting(false);
      process(file, nextSize, nextQuality);
    } catch (err) {
      if (token !== adoptTokenRef.current) return;
      console.error(
        `❌ [${config.toolId}] couldn't fetch the AI render for on-device editing:`,
        err,
      );
      toast.error(
        "Couldn't load the AI render for on-device editing — please try again.",
      );
      const prev = adoptPrevRef.current;
      if (prev) {
        setSize(prev.size);
        setQuality(prev.quality);
      }
      setAdopting(false);
    }
  };

  // Quality/size change → re-process ASAP (soft-restored from cache when this
  // source+quality already ran). While the AI render is open, changing a
  // setting means "keep going from THIS image" — it adopts the render first.
  const changeQuality = (q) => {
    setOpenDropdown(null);
    if (locked) return; // controls are disabled then anyway
    // API-only: just record the setting for the next backend Generate — never
    // adopt the render on-device or re-run the local pipeline.
    if (apiOnly) {
      setQuality(q);
      return;
    }
    if (generatedImage) {
      adoptGenerated(size, q);
      return;
    }
    setQuality(q);
    if (uploadedFile) process(uploadedFile, size, q);
  };
  const changeSize = (s) => {
    setOpenDropdown(null);
    if (locked) return;
    if (apiOnly) {
      setSize(s);
      return;
    }
    if (generatedImage) {
      adoptGenerated(s, quality);
      return;
    }
    setSize(s);
    if (uploadedFile) process(uploadedFile, s, quality);
  };

  // Park the AI render and show the on-device result (or source) again —
  // instant, nothing is recomputed, and the render stays one click away.
  const backToPreview = () => {
    if (!generatedImage || locked) return;
    setParkedAiUrl(generatedImage);
    setGeneratedImage(null);
  };

  // Bring the parked AI render back on top — instant (the image is cached).
  const viewAiRender = () => {
    if (!parkedAiUrl || locked) return;
    setGeneratedImage(parkedAiUrl);
    setParkedAiUrl(null);
  };

  const handleToolClick = (id) => {
    setToolMenuOpen(false);
    if (id === config.toolId) return;
    onSwitchTool?.(id);
  };

  // Cancel whatever is in flight — the user's image is NEVER discarded:
  //  • adopting: abort the fetch; the AI view never left, settings revert.
  //  • generating: drop the pending response; the current view is untouched.
  //  • processing: restore the last completed result for THIS source (and the
  //    settings that produced it, re-processed soft so tool state like swatches
  //    stays truthful), or fall back to the source photo in a ready state.
  const handleCancel = () => {
    if (adopting) {
      adoptTokenRef.current += 1;
      setAdopting(false);
      const prev = adoptPrevRef.current;
      if (prev) {
        setSize(prev.size);
        setQuality(prev.quality);
      }
      toast("Canceled — still on the AI render.");
      return;
    }
    if (generating) {
      generateTokenRef.current += 1; // the late response will be ignored
      setGenerating(false);
      toast("Generation canceled — your current image is untouched.");
      return;
    }
    const good = lastGoodRef.current;
    const restorable = good && good.sourceId === sourceIdRef.current;
    cancel(restorable ? good.blob : null);
    if (restorable && uploadedFile) {
      setSize(good.size);
      setQuality(good.quality);
      process(uploadedFile, good.size, good.quality);
      toast("Canceled — back to your previous result.");
    } else {
      zoomRef.current?.resetTransform(0);
      setZoomPct(100);
      toast(
        "Canceled — your image is still here. Re-run on-device or generate with AI.",
      );
    }
  };

  const handleClear = () => {
    generateTokenRef.current += 1; // drop any in-flight generate/adoption
    adoptTokenRef.current += 1;
    setGenerating(false);
    setAdopting(false);
    reset();
    setUploadedFile(null);
    setUploadedImage((prev) => {
      releaseUrl(prev);
      return null;
    });
    setGeneratedImage(null);
    setParkedAiUrl(null);
    setSourceKind("upload");
    lastGoodRef.current = null;
    sourceIdRef.current += 1; // caches keyed to the cleared image are dead
  };

  // Download the ACTIVE image: AI render → on-device result (full-res PNG) →
  // the source photo itself (e.g. right after a Cancel). What you see is
  // exactly what you get.
  const handleDownload = async () => {
    if (generatedImage) {
      try {
        const blob = await fetchImageBlob(generatedImage);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${config.filePrefix}-generated-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (err) {
        console.error(`❌ [${config.toolId}] generated download failed:`, err);
        toast.error("Couldn't download the generated image.");
      }
      return;
    }
    if (resultImage) {
      download("hd", "png", "transparent");
      return;
    }
    if (uploadedFile || uploadedImage) {
      try {
        const blob = uploadedFile || (await fetchImageBlob(uploadedImage));
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${config.filePrefix}-source-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (err) {
        console.error(`❌ [${config.toolId}] source download failed:`, err);
        toast.error("Couldn't download the image.");
      }
    }
  };

  // Save the ACTIVE image: the AI render when shown (fetched + re-uploaded into
  // the user's gallery), the on-device result, or the source photo itself.
  // Guests aren't dead-ended: the image is stashed (CacheStorage) and they're
  // sent to log in with a returnTo that resumes + completes the save.
  const doSave = async () => {
    if (!isLoggedIn) {
      if (!activeKind) {
        toast.error("Log in to save to your gallery.");
        return;
      }
      try {
        const blob = generatedImage
          ? await fetchImageBlob(generatedImage)
          : tool.getResultBlob?.() || uploadedFile;
        if (!blob) throw new Error("nothing to stash");
        await stashPendingSave(blob, { toolId: config.toolId, size, quality });
        toast.info("Log in to finish saving — we'll bring you right back.");
        router.push(
          `/login?returnTo=${encodeURIComponent(`/product-studio?resume=${config.toolId}`)}`,
        );
      } catch (err) {
        console.error("❌ pending save stash failed:", err);
        toast.error("Log in to save to your gallery.");
      }
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      if (generatedImage) {
        const blob = await fetchImageBlob(generatedImage);
        await handleSave(blob);
        toast.success("Saved to gallery");
      } else if (resultImage) {
        const saved = await tool.saveToGallery("transparent");
        if (saved !== false) toast.success("Saved to gallery");
      } else if (uploadedFile) {
        await handleSave(uploadedFile);
        toast.success("Saved to gallery");
      }
    } catch (err) {
      console.error("❌ save failed:", err);
      toast.error(err?.message || "Couldn't save to gallery");
    } finally {
      setSaving(false);
    }
  };

  // Generate (photoreal refinement) — the ACTIVE image is the input:
  //  • AI render open   → its hosted URL is sent directly (no re-upload round-
  //    trip) — AI-on-AI refinement, e.g. with a new prompt.
  //  • on-device result → uploaded to get a hosted URL, then generated from
  //    (same contract as VirtualModelModal).
  //  • source only (e.g. right after Cancel) → the picked photo itself is
  //    uploaded and generated from — canceling on-device never blocks the API.
  // Cancellable: a bumped token makes the late response a no-op. Charging is
  // server-side; generateProductPhoto surfaces 402/credits errors as toasts.
  const doGenerate = async () => {
    if (generating || busy) return;
    // Mirror the other modals' "no image" toast so a click with nothing to
    // work on gives clear feedback instead of doing nothing.
    if (!activeKind) {
      toast.error("Please select a product image first");
      return;
    }
    if (!isLoggedIn) {
      toast.error("Log in to generate a photorealistic render.");
      return;
    }
    const token = (generateTokenRef.current += 1);
    setGenerating(true);
    setOpenDropdown(null);
    try {
      let imageUrl;
      if (activeKind === "ai") {
        imageUrl = generatedImage; // already hosted by the backend — reuse as-is
      } else {
        const blob =
          activeKind === "local" ? tool.getResultBlob?.() : uploadedFile;
        if (!blob) throw new Error("Couldn't read the current image.");
        const file = new File(
          [blob],
          `${config.filePrefix}-src-${Date.now()}.png`,
          { type: blob.type || "image/png" },
        );
        const uploaded = await uploadMedia(file);
        console.log(`🖼️ [${config.toolId}] upload response ←`, uploaded);
        imageUrl =
          uploaded?.url ||
          uploaded?.image_url ||
          uploaded?.file_url ||
          uploaded?.data?.url;
        if (!imageUrl)
          throw new Error("Couldn't get an image URL for generation.");
      }

      const payload = {
        tool: TOOL_ENUM[config.toolId],
        image_url: imageUrl,
        quality: QUALITY_ENUM[quality] || "standard",
        size,
        apply_brand_style: applyBrandStyle,
        prompt: prompt || "",
      };
      const result = await generateProductPhoto(payload);
      console.log(`🎨 [${config.toolId}] generate result ←`, result);
      if (token !== generateTokenRef.current) return; // canceled/superseded — drop it

      const resultUrl = result?.url || result?.image_url || result?.data?.url;
      if (resultUrl) {
        await preloadImage(resultUrl); // decode first — the reveal is instant
        if (token !== generateTokenRef.current) return;
        setParkedAiUrl(null); // a fresh render supersedes any parked one
        setGeneratedImage(resultUrl);
        toast.success("Image generated!");
      } else {
        toast("Generated — check the console for the response shape.");
      }
    } catch (err) {
      // generateProductPhoto already toasts a friendly error; log for debugging.
      console.error(`❌ [${config.toolId}] generate failed:`, err);
    } finally {
      if (token === generateTokenRef.current) setGenerating(false);
    }
  };

  // Unmount cleanup via a ref mirror — a [] cleanup closure would only ever see
  // the first render's (null) URL and leak the final object URL.
  useEffect(() => {
    uploadedImageRef.current = uploadedImage;
  }, [uploadedImage]);
  useEffect(() => () => releaseUrl(uploadedImageRef.current), []);

  const hasResult = !!resultImage;
  const showEmpty = !uploadedImage && !hasResult && !busy && !failed;
  const zoomActive = hasZoom;
  // Download/Save act on a produced RESULT (on-device output or AI render) — NOT
  // a bare uploaded source. So after an upload that's canceled before it finishes
  // processing, those actions stay disabled (there's nothing to export yet).
  const hasExportable = !!(generatedImage || resultImage);

  // Live % readout for the zoom control; bails out when the rounded % is
  // unchanged so pan events don't re-render the modal every frame.
  const handleZoomScale = (scale) =>
    setZoomPct((prev) => {
      const next = Math.round(scale * 100);
      return next === prev ? prev : next;
    });

  // Fit-to-view whenever the visible content changes surface (result lands, AI
  // render opens/closes, source-ready view mounts) so everything is visible at
  // once (e.g. all flat-lay items right after they separate).
  useEffect(() => {
    if (!resultImage && !generatedImage && !uploadedImage) return;
    const id = requestAnimationFrame(() => {
      zoomRef.current?.resetTransform(0);
      setZoomPct(100);
    });
    return () => cancelAnimationFrame(id);
  }, [resultImage, generatedImage, uploadedImage]);

  // Resume a guest save-after-login: if this tool stashed a pending save
  // before redirecting to /login (see doSave), restore the result and — now
  // that the user is authenticated — complete the save automatically. One-shot
  // (the stash deletes on read), and gated on auth finishing its initial load
  // so a just-logged-in user isn't misread as a guest.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (authLoading || resumedRef.current) return;
    resumedRef.current = true;
    let cancelled = false;
    (async () => {
      const pending = await takePendingSave(config.toolId);
      if (!pending || cancelled) return;
      console.log(
        `🔖 [${config.toolId}] restoring the pending save from before login`,
      );
      if (pending.meta.size) setSize(pending.meta.size);
      if (pending.meta.quality) setQuality(pending.meta.quality);
      tool.setResultBlob?.(pending.blob);
      if (!isLoggedIn) {
        toast.info("Your result is restored — log in to save it.");
        return;
      }
      try {
        await handleSave(pending.blob);
        tool.markSaved?.();
        toast.success("Saved to gallery");
      } catch (err) {
        console.error("❌ resume save failed:", err);
        toast.error("Couldn't finish saving — hit Save to try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally not re-run on auth/tool identity churn — the stash is one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  return (
    // reducedMotion="user": every transform animation inside collapses to a
    // plain fade for users with prefers-reduced-motion.
    <MotionConfig reducedMotion="user">
      <div
        className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-3"
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

              {/* Upload — opens the gallery picker (My Library / Search / Upload) */}
              <div className="px-4 pt-4">
                <button
                  onClick={() => setPickerOpen(true)}
                  disabled={busy}
                  className="w-full border border-dashed border-gray-200 rounded-2xl py-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-blue-600 font-semibold">
                    Select from gallery
                  </span>
                </button>
              </div>

              {/* Working-image thumb — always the ACTIVE image (the AI render when
                it's open, else the source), badged when it came from the AI. */}
              {(generatedImage || uploadedImage) && (
                <div className="px-4 pt-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500">
                    <img
                      src={generatedImage || uploadedImage}
                      alt="product"
                      className="w-full h-full object-cover"
                    />
                    {(generatedImage || sourceKind === "ai") && (
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-blue-600/90 px-1 text-[9px] font-bold text-white leading-tight pointer-events-none">
                        AI
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Option rows */}
              <div className="px-4 pt-4 pb-3 space-y-2.5">
                <button
                  ref={qualityRef}
                  onClick={() =>
                    !locked &&
                    setOpenDropdown((d) => (d === "quality" ? null : "quality"))
                  }
                  disabled={locked}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-gray-900 font-medium">Quality</span>
                  <span className="text-gray-500 flex items-center gap-2">
                    {QUALITY_TIERS.find((t) => t.id === quality)?.name ||
                      quality}
                    <span className="text-[11px] font-bold text-gray-900 bg-surface border border-gray-200 shadow-sm rounded-md px-1.5 py-0.5">
                      {QUALITY_RES[quality]}
                    </span>
                  </span>
                </button>

                <button
                  ref={sizeRef}
                  onClick={() =>
                    !locked &&
                    setOpenDropdown((d) => (d === "size" ? null : "size"))
                  }
                  disabled={locked}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-gray-900 font-medium">Size</span>
                  <span className="text-gray-500">{sizeObj?.name}</span>
                </button>

                {renderExtra?.({ tool, busy: locked, quality, size })}

                {/* Brand style — required payload field for Generate. */}
                <button
                  onClick={() => !locked && setApplyBrandStyle((p) => !p)}
                  disabled={locked}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-gray-900 font-medium">
                    Apply brand style
                  </span>
                  <span
                    className={
                      applyBrandStyle
                        ? "text-blue-600 font-semibold"
                        : "text-gray-500"
                    }
                  >
                    {applyBrandStyle ? "On" : "Off"}
                  </span>
                </button>

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

            {/* Pinned footer — Generate (when the tool supports it), or Cancel
              while ANY engine is working (on-device run, AI-render adoption,
              or backend generate — the label shows which). */}
            <div className="px-4 pb-5 pt-3 border-t border-gray-200 bg-surface">
              <AnimatePresence mode="wait" initial={false}>
                {busy || generating ? (
                  <motion.button
                    key="cancel"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    onClick={handleCancel}
                    className="w-full py-3.5 rounded-2xl text-sm cursor-pointer font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    {generating && !busy ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                        — Cancel
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" /> Cancel
                      </>
                    )}
                  </motion.button>
                ) : config.hasGenerate === false ? null : (
                  <motion.button
                    key="generate"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    onClick={doGenerate}
                    className="w-full py-3.5 rounded-2xl text-sm cursor-pointer font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                  >
                    <Sparkles className="w-4 h-4" /> Generate photorealistic
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

            {/* Canvas / interacting space — pan/zoom lives inside, so no scrollbars */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-8 overflow-hidden">
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
                        className="text-blue-500 shrink-0 -mt-6"
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
                      className="mt-1 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      <RotateCcw className="h-4 w-4" /> Try another image
                    </button>
                  </motion.div>
                ) : processing ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-canvas dark:to-canvas shadow-inner">
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
                            className="absolute h-20 w-20 rounded-full border-2 border-blue-400/40"
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
                            <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-medium text-gray-700">
                            Working on your image…
                          </span>
                          <span className="text-xs font-bold text-blue-600">
                            {uploadProgress}%
                          </span>
                        </div>
                        <div className="w-40 h-1.5 rounded-full bg-white/50 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-500"
                            animate={{
                              width: `${Math.max(6, uploadProgress)}%`,
                            }}
                            transition={{ ease: "easeOut", duration: 0.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : generatedImage ? (
                  <motion.div
                    key="generated"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="relative w-full h-full"
                  >
                    {zoomActive ? (
                      <ZoomCanvas
                        zoomRef={zoomRef}
                        onScale={handleZoomScale}
                        excluded={config.zoomExcluded}
                        wheelExcluded={config.wheelExcluded}
                      >
                        <img
                          src={generatedImage}
                          alt={`${title} — AI generated`}
                          className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-lg"
                        />
                      </ZoomCanvas>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={generatedImage}
                          alt={`${title} — AI generated`}
                          className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-lg"
                        />
                      </div>
                    )}
                    {/* Fixed overlays — badge + action chips stay put while the image zooms */}
                    <span className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-blue-600/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow backdrop-blur pointer-events-none">
                      <Sparkles className="w-3 h-3" /> AI Generated
                    </span>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
                      {/* Park the render and flip back to the on-device view — instant. */}
                      <button
                        onClick={backToPreview}
                        disabled={adopting}
                        className="rounded-full bg-surface/90 border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 shadow hover:bg-gray-100 transition-colors backdrop-blur cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Back to preview
                      </button>
                      {/* Adopt the render as the working source and keep editing it
                        on-device (same as changing size/quality while it's open).
                        Hidden for API-only tools — there's no on-device pipeline. */}
                      {!apiOnly && (
                        <button
                          onClick={() => adoptGenerated(size, quality)}
                          disabled={adopting || generating}
                          className="flex items-center gap-1.5 rounded-full bg-blue-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 transition-colors backdrop-blur cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {adopting ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />{" "}
                              Preparing…
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3 h-3" /> Continue on-device
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : resultImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={
                      zoomActive
                        ? "relative w-full h-full"
                        : "relative flex items-center justify-center"
                    }
                  >
                    {zoomActive ? (
                      <ZoomCanvas
                        zoomRef={zoomRef}
                        onScale={handleZoomScale}
                        excluded={config.zoomExcluded}
                        wheelExcluded={config.wheelExcluded}
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
                      </ZoomCanvas>
                    ) : renderResult ? (
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
                    {/* A parked AI render is one click away — flip back instantly. */}
                    {parkedAiUrl && (
                      <button
                        onClick={viewAiRender}
                        className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-blue-600/90 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow hover:bg-blue-700 transition-colors backdrop-blur cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" /> View AI render
                      </button>
                    )}
                    {/* Fixed overlay (e.g. background swatches) — stays put while the result zooms */}
                    {config.renderOverlay && hasResult && (
                      <div
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {config.renderOverlay({ tool, busy })}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  // Source-ready: the picked photo is the active image (a run was
                  // canceled or undone) — nothing is lost. Re-run on-device from
                  // here, or Generate straight from the source via the footer.
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="relative w-full h-full"
                  >
                    {zoomActive ? (
                      <ZoomCanvas
                        zoomRef={zoomRef}
                        onScale={handleZoomScale}
                        excluded={config.zoomExcluded}
                        wheelExcluded={config.wheelExcluded}
                      >
                        <img
                          src={uploadedImage}
                          alt={`${title} — source`}
                          className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-lg"
                        />
                      </ZoomCanvas>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={uploadedImage}
                          alt={`${title} — source`}
                          className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-lg"
                        />
                      </div>
                    )}
                    {parkedAiUrl && (
                      <button
                        onClick={viewAiRender}
                        className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-blue-600/90 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow hover:bg-blue-700 transition-colors backdrop-blur cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" /> View AI render
                      </button>
                    )}
                    {/* On-device processing entry point — hidden for API-only
                      tools, which generate exclusively via the backend footer. */}
                    {!apiOnly && (
                      <button
                        onClick={() =>
                          uploadedFile &&
                          !locked &&
                          process(uploadedFile, size, quality)
                        }
                        disabled={!uploadedFile || locked}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-blue-600/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 transition-colors backdrop-blur cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Wand2 className="w-3.5 h-3.5" /> Process on-device
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom toolbar — Download/Save/Clear (left) + zoom (right). All
              three act on the ACTIVE image, so they're available whenever one
              exists (even mid-Generate — the current view is still exportable). */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-surface/90 backdrop-blur-sm border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!hasExportable || busy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={doSave}
                  disabled={!hasExportable || saving || busy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-100 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  disabled={!activeKind || busy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-100 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
              {zoomActive && (
                <div className="flex items-center gap-1 bg-surface rounded-full border border-gray-200 shadow-sm px-2 py-1">
                  <button
                    onClick={() => zoomRef.current?.zoomOut(0.3)}
                    title="Zoom out"
                    className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-all active:scale-90"
                  >
                    <Minus className="w-3 h-3 text-gray-500" />
                  </button>
                  <span className="text-xs text-gray-500 w-10 text-center">
                    {zoomPct}%
                  </span>
                  <button
                    onClick={() => zoomRef.current?.zoomIn(0.3)}
                    title="Zoom in"
                    className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-all active:scale-90"
                  >
                    <Plus className="w-3 h-3 text-gray-500" />
                  </button>
                  <button
                    onClick={() => zoomRef.current?.resetTransform()}
                    title="Fit to view"
                    className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-all active:scale-90"
                  >
                    <Maximize2 className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tool switcher (header dropdown) ── */}
        {toolMenuOpen && (
          <div
            className="fixed inset-0 z-205"
            onClick={() => setToolMenuOpen(false)}
          />
        )}
        <AnimatePresence>
          {toolMenuOpen && (
            <ToolSwitcherDropdown
              key="tool-menu"
              anchorRef={headerRef}
              activeToolId={config.toolId}
              onSelect={handleToolClick}
              animated
            />
          )}
        </AnimatePresence>

        {/* ── Floating dropdowns ── */}
        {openDropdown && (
          <div
            className="fixed inset-0 z-195"
            onClick={() => setOpenDropdown(null)}
          />
        )}

        <AnimatePresence>
          {openDropdown === "quality" && (
            <QualityDropdown
              key="quality-panel"
              anchorRef={qualityRef}
              value={quality}
              onSelect={changeQuality}
              animated
            />
          )}

          {openDropdown === "size" && (
            <SizeDropdown
              key="size-panel"
              anchorRef={sizeRef}
              value={size}
              onSelect={changeSize}
              animated
            />
          )}
        </AnimatePresence>

        {/* ── Gallery media picker — pick ONE image (My Library / Search / Upload) ── */}
        <MediaPickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onCancel={() => setPickerOpen(false)}
          onApply={handleApplyFromPicker}
          activeBrand={activeBrand}
          maxSelectable={1}
        />
      </div>
    </MotionConfig>
  );
}
