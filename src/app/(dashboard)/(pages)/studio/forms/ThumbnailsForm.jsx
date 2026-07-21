"use client";
// forms/ThumbnailsForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe,
  Loader2,
  FileUp,
  X,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Images,
  Type,
  Hash,
  PlayCircle,
  TrendingUp,
  Video,
} from "lucide-react";
import {
  FloatingAnimation,
  FloatingElements,
} from "@/app/(components)/FloatingAnimation";

import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";
import { useAuth } from "@/context/AuthContext";
import { CREATIVE_ENGINE } from "@/(lib)/design/creativeEngine";
import {
  MAX_IMAGES,
  withinImageBounds,
  imageBoundsMessage,
} from "@/(lib)/creative/imageGate";

// ── Social Creative theme color ───────────────────────────────────────────────
const THEME = "#059669"; // emerald

// ── constants ─────────────────────────────────────────────────────────────────
const THUMBNAIL_PLATFORMS = [
  { value: "youtube", label: "YouTube", desc: "1280 × 720 px" },
  { value: "twitch", label: "Twitch", desc: "1280 × 720 px" },
  { value: "tiktok", label: "TikTok", desc: "1080 × 1920 px" },
  { value: "instagram", label: "Instagram", desc: "1080 × 1080 px" },
  { value: "linkedin", label: "LinkedIn", desc: "1200 × 627 px" },
  { value: "twitter", label: "X / Twitter", desc: "1600 × 900 px" },
];

const PLATFORM_SIZES = {
  // `category` is the Scraive sub_category used to fetch design templates.
  youtube: { value: "1280x720", label: "1280 × 720 px", ratio: 16 / 9, category: "YouTube Thumbnail" },
  twitch: { value: "1280x720", label: "1280 × 720 px", ratio: 16 / 9, category: "Twitch Thumbnail" },
  tiktok: { value: "1080x1920", label: "1080 × 1920 px", ratio: 9 / 16, category: "TikTok Thumbnail" },
  instagram: { value: "1080x1080", label: "1080 × 1080 px", ratio: 1, category: "Instagram Square" },
  linkedin: { value: "1200x627", label: "1200 × 627 px", ratio: 1200 / 627, category: "LinkedIn Horizontal" },
  twitter: { value: "1600x900", label: "1600 × 900 px", ratio: 16 / 9, category: "Twitter / X Post" },
};

const CONTENT_CATEGORIES = [
  { value: "tutorial", label: "Tutorial / How-to" },
  { value: "vlog", label: "Vlog / Lifestyle" },
  { value: "review", label: "Product Review" },
  { value: "gaming", label: "Gaming" },
  { value: "news", label: "News / Commentary" },
  { value: "podcast", label: "Podcast / Interview" },
  { value: "fitness", label: "Fitness / Health" },
  { value: "cooking", label: "Cooking / Food" },
  { value: "finance", label: "Finance / Business" },
  { value: "education", label: "Education" },
  { value: "music", label: "Music / Entertainment" },
  { value: "travel", label: "Travel / Adventure" },
];

const VISUAL_STYLES = [
  { value: "bold", label: "Bold & High Contrast" },
  { value: "clean", label: "Clean & Minimal" },
  { value: "dramatic", label: "Dramatic / Cinematic" },
  { value: "playful", label: "Playful / Colorful" },
  { value: "professional", label: "Professional" },
  { value: "retro", label: "Retro / Vintage" },
];

const EMOTION_HOOKS = [
  { value: "curiosity", label: "Curiosity" },
  { value: "shock", label: "Shock / Surprise" },
  { value: "excitement", label: "Excitement" },
  { value: "urgency", label: "Urgency" },
  { value: "humor", label: "Humor" },
  { value: "inspiration", label: "Inspiration" },
];

const CAMPAIGN_GOALS = [
  "Views / Reach",
  "Subscriber Growth",
  "Engagement",
  "Website Traffic",
  "Sales / Conversions",
];

const FILE_FORMATS = ["PNG", "JPEG", "WEBP"];

const FONT_OPTIONS = [
  "Montserrat",
  "Bebas Neue",
  "Anton",
  "Oswald",
  "Poppins",
  "Raleway",
  "Roboto Condensed",
  "Impact",
  "Lato",
  "Nunito",
];

const BRAND_COLORS = [
  "#059669",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ef4444",
  "#f59e0b",
];

const STEPS = [
  { id: 1, label: "Brand & Content", icon: Video },
  { id: 2, label: "Platform & Style", icon: TrendingUp },
  { id: 3, label: "Reference Images", icon: Images },
];

// ─────────────────────────────────────────────────────────────────────────────

const ThumbnailsForm = ({
  formData,
  setFormData,
  activeBrand,
  sendUrl,
  showToast,
  onResult,
  generateCustomCreative,
  creative,
  categoryId,
  fetchDesignTemplates,
}) => {
  const { uploadMedia, activeBrandId } = useAuth();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [brandUrl, setBrandUrl] = useState(
    activeBrand?.url || activeBrand?.source_url || "",
  );
  const [importingBrand, setImportingBrand] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ── image / crop state ────────────────────────────────────────────────────
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  // index in croppedImages where the current cropping batch begins — lets fresh
  // picker/brand selections APPEND to prior ones instead of replacing them.
  const [cropBatchStart, setCropBatchStart] = useState(0);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageSrcMeta, setImageSrcMeta] = useState([]);

  const cropperRef = useRef(null);
  const logoInputRef = useRef(null);

  // ── modal state ───────────────────────────────────────────────────────────
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // derive aspect ratio from selected platform
  const platform = formData.thumbnailPlatform || "youtube";
  const aspectRatio = PLATFORM_SIZES[platform]?.ratio || 16 / 9;

  useEffect(() => {
    setCompletedCrop(null);
  }, [currentCropIndex]);

  // Sync first cropped image → live preview
  useEffect(() => {
    const first = croppedImages.find(Boolean);
    if (first?.previewUrl)
      setFormData((p) => ({ ...p, backgroundImage: first.previewUrl }));
  }, [croppedImages]);

  // Auto-set size when platform changes
  useEffect(() => {
    const size = PLATFORM_SIZES[platform]?.value;
    if (size) setFormData((p) => ({ ...p, size }));
  }, [platform]);

  // ── field helper ──────────────────────────────────────────────────────────
  const field = (key, value) => {
    if (key === "brandColor") {
      value = value.startsWith("#") ? value : `#${value}`;
      // keep legacy primaryColor in sync
      setFormData((p) => ({ ...p, brandColor: value, primaryColor: value }));
      setError("");
      return;
    }
    setFormData((p) => ({ ...p, [key]: value }));
    setError("");
  };

  // ── URL import ────────────────────────────────────────────────────────────
  const handleImportBrand = async () => {
    if (!brandUrl.trim()) return fail("Please enter a valid brand URL.");
    setImportingBrand(true);
    try {
      const r = await sendUrl(brandUrl);
      if (!r?.ok) throw new Error(r?.message || "Import failed");
      const d = r.data?.data || r.data || {};
      setFormData((p) => ({
        ...p,
        brandName: d.name || "",
        description: d.description || "",
        brandColor: d.primary_color || THEME,
        primaryColor: d.primary_color || THEME,
        font: d.font || "Montserrat",
        logo: d.logo || "",
        importedImages: d.images?.map((i) => i.url).filter(Boolean) || [],
      }));
      showToast("Brand imported!");
    } catch {
      fail("Failed to import brand. Check the URL.");
    } finally {
      setImportingBrand(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => field("logo", reader.result);
    reader.readAsDataURL(file);
  };

  // ── Apply from MediaPickerModal ───────────────────────────────────────────
  const handleApplyFromPicker = async (rawImages, rawMedia) => {
    // Cap combined selection at MAX_IMAGES across images + media.
    const remaining = Math.max(
      0,
      MAX_IMAGES - croppedImages.filter(Boolean).length,
    );
    const images = rawImages.slice(0, remaining);
    const media = rawMedia.slice(0, Math.max(0, remaining - images.length));
    const overflow =
      rawImages.length - images.length + (rawMedia.length - media.length);

    if (images.length > 0) {
      try {
        const processedFiles = await Promise.all(
          images.map(async (item, idx) => {
            if (item.file instanceof File) {
              item.file.previewUrl = item.src;
              item.file.sourceUrl = null;
              return item.file;
            }
            const url = item.large || item.src;
            const fetchUrl = url.startsWith("http")
              ? `/api/proxy-image?url=${encodeURIComponent(url)}`
              : url;
            const res = await fetch(fetchUrl);
            const blob = await res.blob();
            const file = new File([blob], `selected-${Date.now()}-${idx}`, {
              type: blob.type || "image/png",
            });
            file.previewUrl = URL.createObjectURL(blob);
            file.sourceUrl = item.large || item.src || null;
            return file;
          }),
        );

        const previewUrls = processedFiles.map((f) => f.previewUrl);
        const sourceUrls = processedFiles.map((f) => f.sourceUrl || null);

        // Start a new cropping batch APPENDED to any prior selections.
        setCropBatchStart(croppedImages.length);
        setImageSrc(previewUrls);
        setImageSrcMeta(sourceUrls);
        setCroppedImages((prev) => [
          ...prev,
          ...Array(previewUrls.length).fill(null),
        ]);
        setCurrentCropIndex(0);

        setShowCropper(true);
        showToast(`Added ${images.length} image(s) — crop them`);
      } catch (err) {
        console.error("Image loading failed:", err);
        showToast("Some images couldn't be loaded.");
      }
    }

    if (media.length > 0) {
      const videoObjects = media.map((src, i) => ({
        id: `video-${Date.now()}-${i}`,
        previewUrl: src,
        thumbnail: src,
        type: "video",
      }));
      setCroppedImages((prev) => [...prev, ...videoObjects]);
      showToast(`Added ${media.length} media item(s)`);
    }

    if (overflow > 0) showToast(`Max ${MAX_IMAGES} items reached — some skipped.`);
    setMediaPickerOpen(false);
  };

  // ── Brand image strip handlers ────────────────────────────────────────────
  const handleBrandImageUse = (imageObjs) => {
    const remaining = Math.max(
      0,
      MAX_IMAGES - croppedImages.filter(Boolean).length,
    );
    const toAdd = imageObjs.slice(0, remaining);
    if (toAdd.length === 0) {
      showToast(`Max ${MAX_IMAGES} items reached.`);
      return;
    }
    const pseudos = toAdd.map((imageObj) => ({
      previewUrl: imageObj.src,
      sourceUrl: imageObj.src,
      name: imageObj.alt || "brand-image",
      type: "image/jpeg",
    }));
    setCroppedImages((prev) => [...prev, ...pseudos]);
    if (toAdd.length < imageObjs.length)
      showToast(`Only ${toAdd.length} added — max ${MAX_IMAGES} reached.`);
    else
      showToast(
        `${pseudos.length} image${pseudos.length > 1 ? "s" : ""} added ✓`,
      );
  };

  const handleBrandImageCrop = async (imageObjs) => {
    const remaining = Math.max(
      0,
      MAX_IMAGES - croppedImages.filter(Boolean).length,
    );
    const toAdd = imageObjs.slice(0, remaining);
    if (toAdd.length === 0) {
      showToast(`Max ${MAX_IMAGES} items reached.`);
      return;
    }
    const newUrls = [];
    const newMetas = [];
    for (const imageObj of toAdd) {
      const originalUrl = imageObj.src;
      let cropperUrl = originalUrl;
      try {
        const res = await fetch(
          `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`,
        );
        const blob = await res.blob();
        cropperUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.warn("Proxy failed, falling back to original URL", err);
      }
      newUrls.push(cropperUrl);
      newMetas.push(originalUrl);
    }
    // Start a new cropping batch APPENDED to any prior selections.
    setCropBatchStart(croppedImages.length);
    setImageSrc(newUrls);
    setImageSrcMeta(newMetas);
    setCroppedImages((prev) => [...prev, ...Array(newUrls.length).fill(null)]);
    setCurrentCropIndex(0);
    setShowCropper(true);
    if (toAdd.length < imageObjs.length)
      showToast(`Only ${toAdd.length} queued — max ${MAX_IMAGES} reached.`);
  };

  // ── Save crop ─────────────────────────────────────────────────────────────
  const saveCroppedImage = useCallback(async () => {
    if (!completedCrop || !cropperRef.current) return;
    const image = cropperRef.current.cropper?.getImage?.();
    if (!image) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const file = new File([blob], `cropped-${currentCropIndex}.png`, {
      type: "image/png",
    });
    file.previewUrl = URL.createObjectURL(blob);
    file.sourceUrl = imageSrcMeta[currentCropIndex] || null;

    setCroppedImages((prev) => {
      const u = [...prev];
      u[cropBatchStart + currentCropIndex] = file;
      return u;
    });

    if (currentCropIndex < imageSrc.length - 1) {
      setCurrentCropIndex((prev) => prev + 1);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);
    } else {
      setShowCropper(false);
    }
  }, [completedCrop, currentCropIndex, imageSrc.length, imageSrcMeta, cropBatchStart]);

  // ── Skip crop ─────────────────────────────────────────────────────────────
  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `original-${currentCropIndex}.png`, {
          type: blob.type,
        });
        file.previewUrl = url;
        file.sourceUrl = imageSrcMeta[currentCropIndex] || null;
        setCroppedImages((prev) => {
          const u = [...prev];
          u[cropBatchStart + currentCropIndex] = file;
          return u;
        });
        if (currentCropIndex < imageSrc.length - 1) {
          setCurrentCropIndex((prev) => prev + 1);
          setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
        } else {
          setShowCropper(false);
        }
      });
  };

  // ── Remove a cropped image ────────────────────────────────────────────────
  const removeCroppedImage = (idx) => {
    const next = croppedImages.filter((_, i) => i !== idx);
    const first = next.find(Boolean);
    setCroppedImages(next);
    setFormData((p) => ({ ...p, backgroundImage: first?.previewUrl || null }));
    if (idx <= currentCropIndex && currentCropIndex > 0)
      setCurrentCropIndex((prev) => prev - 1);
  };

  // ── Previous crop ─────────────────────────────────────────────────────────
  const handlePreviousCrop = () => {
    if (currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
      setCompletedCrop(null);
    }
  };

  // ── Step navigation ───────────────────────────────────────────────────────
  const fail = (msg) => {
    setError(msg);
    showToast(msg);
  };

  const handleContinue = () => {
    if (step === 1 && !formData.brandName)
      return fail("Channel / brand name is required.");
    if (step === 2 && !formData.thumbnailPlatform)
      return fail("Please select a platform.");
    if (step === 3 && croppedImages.filter(Boolean).length === 0)
      return fail("Add at least one reference image.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate — mirrors PostForm.handleGenerate ───────────────────────────
  // 1) fetch Scraive templates  2) upload File images → real URLs
  // 3) send templates + brand_id  4) stream batches into onResult
  const handleGenerate = async () => {
    const sizeInfo = PLATFORM_SIZES[platform] || {};

    const validImages = croppedImages.filter(Boolean);

    // Gate: generation needs between MIN_IMAGES and MAX_IMAGES reference images.
    if (!withinImageBounds(validImages.length)) {
      return fail(imageBoundsMessage(validImages.length));
    }

    setGenerating(true);
    setError("");

    try {
      // 1. FETCH DESIGN TEMPLATES FIRST (redesign engine only)
      // Scraive templates are only needed by the "redesign" engine. Involk
      // generates from scratch, so skip the fetch + gate entirely.
      let selectedTemplates = [];
      if (CREATIVE_ENGINE === "redesign") {
        const templateRes = await fetchDesignTemplates({
          type: "image",
          category: sizeInfo.category || formData.thumbnailPlatform || platform,
          type_size: formData.size || sizeInfo.value,
          design_type: "social",
        });

        if (!templateRes.ok) {
          setGenerating(false);
          const msg = templateRes.message || "Failed to fetch templates.";
          setError(msg);
          showToast(msg);
          return;
        }

        const templates = templateRes.data || [];
        if (!templates.length) {
          setGenerating(false);
          const msg = "No templates found for this platform.";
          setError(msg);
          showToast(msg);
          return;
        }
        selectedTemplates = templates;
      }

      // 2. RESOLVE IMAGE URLs — upload File items to /gallery
      const resolvedUrls = await Promise.all(
        validImages.map(async (item) => {
          if (
            typeof item?.sourceUrl === "string" &&
            item.sourceUrl.startsWith("http")
          ) {
            return item.sourceUrl;
          }
          if (item instanceof File) {
            try {
              const result = await uploadMedia(item);
              const url =
                result?.image_url ||
                result?.url ||
                result?.data?.image_url ||
                null;
              return typeof url === "string" && url.startsWith("http")
                ? url
                : null;
            } catch (err) {
              console.error("uploadMedia failed:", err);
              return null;
            }
          }
          if (
            typeof item?.previewUrl === "string" &&
            item.previewUrl.startsWith("http")
          ) {
            return item.previewUrl;
          }
          return null;
        }),
      );

      const imageUrls = resolvedUrls.filter(Boolean);

      // 3. BUILD PAYLOAD
      const payload = {
        creativeType: creative?.id,
        categoryType: categoryId,
        brand_id: activeBrandId,

        brandName: formData.brandName || null,
        description: formData.description || null,
        brandColor: formData.brandColor ?? formData.primaryColor ?? null,
        logo: formData.logo || null,
        visualStyle: formData.visualStyle || null,
        font: formData.font || null,
        sourceUrl: brandUrl || null,
        size: formData.size || sizeInfo.value || null,
        campaignGoal: formData.campaignGoal || null,
        fileFormat: formData.fileFormat || null,
        // thumbnail-specific
        videoTitle: formData.videoTitle || null,
        thumbnailHeadline: formData.thumbnailHeadline || null,
        thumbnailSubtext: formData.thumbnailSubtext || null,
        thumbnailNotes: formData.thumbnailNotes || null,
        thumbnailPlatform: formData.thumbnailPlatform || platform,
        contentCategory: formData.contentCategory || null,
        emotionHook: formData.emotionHook || null,
        hashtags: formData.hashtags || [],

        category: (sizeInfo.category || platform)
          ?.toLowerCase()
          .replace(/\s+/g, "_"),
        type_size: formData.size || sizeInfo.value,
        images: imageUrls,
        templates: selectedTemplates,
        generatedAt: new Date().toISOString(),
      };

      // 4. STREAM BATCHES
      const expectedCount = selectedTemplates.length;
      let isFirstBatch = true;
      const result = await generateCustomCreative(payload, (batch) => {
        if (!batch.ok) return;
        const variations = batch.variations || [];
        const assets = batch.assets || [];
        if (isFirstBatch) {
          isFirstBatch = false;
          setGenerating(false); // hide overlay so first batch shows
          onResult({
            type: "design",
            variations,
            assets,
            // Involk has no templates — fall back to returned variation count.
            expectedCount: expectedCount || variations.length,
            done: false,
            reply: batch.data?.reply || "",
            meta: batch.data?.meta || {},
            payload,
            raw: batch.data,
          });
        } else {
          onResult({ type: "design", variations, assets, append: true });
        }
      });

      if (!result.ok) {
        setGenerating(false);
        onResult({ append: true, done: true });
        const msg = result.message || "Generation failed. Please try again.";
        setError(msg);
        showToast(msg);
        return;
      }

      // All batches done — clear skeletons
      onResult({ append: true, done: true });
    } catch (err) {
      console.error("handleGenerate error:", err);
      const msg = err.message || "Something went wrong.";
      setError(msg);
      showToast(msg);
    } finally {
      setGenerating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Step indicator ─────────────────────────────────────────────── */}
      <div className="rounded-2xl px-0 py-4">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => step > s.id && setStep(s.id)}
                  className={`flex flex-1 items-center gap-2 min-w-0 ${step > s.id ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                    ${
                      step > s.id
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : step === s.id
                          ? "border-emerald-600 text-emerald-600 bg-surface"
                          : "border-gray-200 text-gray-300"
                    }`}
                  >
                    {step > s.id ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`hidden sm:block text-xs font-medium truncate ${step >= s.id ? "text-gray-700" : "text-gray-300"}`}
                  >
                    {s.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full transition-all ${step > s.id ? "bg-emerald-600" : "bg-gray-200"}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step content ──────────────────────────────────────────────── */}
      <div className="bg-surface px-2 rounded-lg py-2 flex flex-col gap-6">
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 — Brand & Content ══════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Channel &amp; Video Content</SectionTitle>

            {/* URL import */}
            <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/40">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">
                  Import from URL
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  Auto-fills brand info
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={brandUrl}
                  onChange={(e) => setBrandUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleImportBrand()}
                  placeholder="https://yourdomain.com/"
                  className={inputCls}
                />
                <button
                  onClick={handleImportBrand}
                  disabled={importingBrand || !brandUrl.trim()}
                  className="px-5 py-1.5 bg-emerald-600 cursor-pointer text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {importingBrand ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Import"
                  )}
                </button>
              </div>
            </div>

            <Field label="Brand Name" required>
              <input
                type="text"
                value={formData.brandName || ""}
                onChange={(e) => field("brandName", e.target.value)}
                placeholder="Your channel or brand name"
                className={inputCls}
              />
            </Field>

            {/* <Field label="Video Title" required>
              <input
                type="text" value={formData.videoTitle || ""}
                onChange={(e) => field("videoTitle", e.target.value)}
                placeholder="The actual title of the video (used to generate thumbnail text)"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Thumbnail Headline">
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" value={formData.thumbnailHeadline || ""}
                    onChange={(e) => field("thumbnailHeadline", e.target.value)}
                    placeholder="Bold overlay text"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Supporting Text">
                <input
                  type="text" value={formData.thumbnailSubtext || ""}
                  onChange={(e) => field("thumbnailSubtext", e.target.value)}
                  placeholder="Smaller supporting text (optional)"
                  className={inputCls}
                />
              </Field>
            </div> */}

            <Field label="Video Description / Context">
              <textarea
                value={formData.description || ""}
                onChange={(e) => field("description", e.target.value)}
                placeholder="Brief description of the video — helps the AI match the thumbnail mood…"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>

            {/* <Field label="Hashtags">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.hashtags?.join(" ") || ""}
                  onChange={(e) => field("hashtags", e.target.value.split(" ").filter(Boolean))}
                  placeholder="#YouTube #Tutorial #Viral"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field> */}

            {/* Brand Color + Logo — matches ImageAdsForm layout exactly */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand Color">
                <div className="flex items-center gap-2">
                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 flex-wrap max-w-50">
                    {BRAND_COLORS.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => field("brandColor", hex)}
                        className={`w-7 h-7 rounded-md cursor-pointer border-2 transition-transform hover:scale-110 ${
                          formData.brandColor === hex
                            ? "border-gray-800 scale-110"
                            : "border-transparent"
                        }`}
                        style={{ background: hex }}
                        title={hex}
                      />
                    ))}
                  </div>

                  {/* Picker + Input */}
                  <div className="flex items-center gap-2 flex-none">
                    <label
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 transition hover:scale-105"
                      style={{ background: formData.brandColor }}
                    >
                      <input
                        type="color"
                        value={formData.brandColor}
                        onChange={(e) => field("brandColor", e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>

                    <input
                      type="text"
                      value={formData.brandColor}
                      onChange={(e) =>
                        /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) &&
                        field("brandColor", e.target.value)
                      }
                      className={`${inputCls} w-22.5! flex-none px-2 text-sm font-mono`}
                      maxLength={7}
                    />
                  </div>
                </div>
              </Field>

              <Field label=" Logo">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 px-3 py-2.5 border cursor-pointer border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-emerald-500 hover:text-emerald-600 flex items-center gap-2 transition"
                  >
                    <FileUp className="w-4 h-4" /> Upload
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                  />
                  {formData.logo && (
                    <div className="w-10 h-10 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={formData.logo}
                        alt="logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </Field>
            </div>

            {/* <Field label="Preferred Font">
              <select
                value={formData.font || "Montserrat"}
                onChange={(e) => field("font", e.target.value)}
                className={`${inputCls} bg-surface cursor-pointer`}
              >
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field> */}
          </div>
        )}

        {/* ═══ STEP 2 — Platform & Style ═══════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle>Platform, Style &amp; Goals</SectionTitle>

            <Field label="Target Platform" required>
              <div className="flex flex-wrap gap-2">
                {THUMBNAIL_PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => field("thumbnailPlatform", p.value)}
                    className={`text-left px-3 py-2.5 cursor-pointer rounded-xl border-2 transition-all
                      ${
                        formData.thumbnailPlatform === p.value
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <p
                      className={`text-xs font-semibold ${formData.thumbnailPlatform === p.value ? "text-emerald-700" : "text-gray-700"}`}
                    >
                      {p.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
              {formData.thumbnailPlatform && (
                <p className="text-[11px] text-emerald-600 mt-1">
                  ✓ Output size:{" "}
                  {PLATFORM_SIZES[formData.thumbnailPlatform]?.label}
                </p>
              )}
            </Field>

            {/* <Field label="Content Category" required>
              <div className="flex flex-wrap gap-2">
                {CONTENT_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => field("contentCategory", c.value)}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer text-xs font-semibold border-2 transition-all
                      ${formData.contentCategory === c.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </Field> */}

            <Field label="Visual Style">
              <div className="flex flex-wrap gap-2">
                {VISUAL_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => field("visualStyle", s.value)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-semibold border-2 transition-all
                      ${
                        formData.visualStyle === s.value
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* <Field label="Emotion / Hook">
              <div className="grid grid-cols-3 gap-2">
                {EMOTION_HOOKS.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => field("emotionHook", e.value)}
                    className={`text-left px-3 py-2 cursor-pointer rounded-xl border-2 transition-all
                      ${formData.emotionHook === e.value
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <p className={`text-xs font-semibold ${formData.emotionHook === e.value ? "text-emerald-700" : "text-gray-700"}`}>
                      {e.label}
                    </p>
                  </button>
                ))}
              </div>
            </Field> */}

            <Field label="Campaign Goal">
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => field("campaignGoal", g)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all
                      ${
                        formData.campaignGoal === g
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Output Format">
              <div className="flex gap-2">
                {FILE_FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => field("fileFormat", f)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all
                      ${
                        formData.fileFormat === f
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {f}
                    {f === "PNG" && " ✓"}
                  </button>
                ))}
              </div>
            </Field>

            {/* <Field label="Additional Notes">
              <textarea
                value={formData.thumbnailNotes || ""}
                onChange={(e) => field("thumbnailNotes", e.target.value)}
                placeholder="Anything else — face expression, props, background color, number of variants…"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field> */}
          </div>
        )}

        {/* ═══ STEP 3 — Reference Images ══════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <SectionTitle>Reference Images</SectionTitle>
            <p className="text-xs text-gray-400 -mt-2">
              Upload a background photo, face shot, or any visual that should
              appear in the thumbnail.
            </p>

            {/* ── Brand images strip ── */}
            <BrandImagesStrip
              onSelect={handleBrandImageUse}
              onCrop={handleBrandImageCrop}
              selectedUrls={croppedImages
                .filter(Boolean)
                .map((f) => f?.sourceUrl || f?.previewUrl)
                .filter(Boolean)}
            />

            {/* ── Already-selected previews ── */}
            {croppedImages.filter(Boolean).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Selected ({croppedImages.filter(Boolean).length})
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {croppedImages.map((item, index) => {
                    if (!item) return null;
                    const url = item?.previewUrl;
                    const isVideo = item?.type?.includes?.("video");
                    return (
                      <div key={index} className="relative group">
                        {isVideo ? (
                          <video
                            src={url}
                            poster={item.thumbnail}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            onMouseEnter={(e) =>
                              e.target.play().catch(() => {})
                            }
                            onMouseLeave={(e) => {
                              e.target.pause();
                              e.target.currentTime = 0;
                            }}
                          />
                        ) : url ? (
                          <img
                            src={url}
                            alt={`Reference ${index + 1}`}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 border-2 border-dashed rounded-xl flex items-center justify-center">
                            <span className="text-xs text-gray-400">
                              No media
                            </span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCroppedImage(index);
                          }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Upload / picker zone ── */}
            <div
              className="border-2 border-dashed border-emerald-200 rounded-2xl p-8 bg-emerald-50/30 flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/60 transition-all"
              onClick={() => setMediaPickerOpen(true)}
            >
              <div className="w-10 h-10 bg-surface border border-emerald-200 rounded-xl flex items-center justify-center shadow-sm">
                <PlayCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  Add Background or Subject
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Face shots, Product Studio, or scene backgrounds
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaPickerOpen(true);
                }}
                className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition cursor-pointer flex items-center gap-2"
              >
                <Images className="w-4 h-4" /> Choose Media
              </button>
            </div>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <div
          className={`flex gap-3 pt-2 ${step > 1 ? "justify-between" : "justify-end"}`}
        >
          {step > 1 && (
            <button
              onClick={() => setStep((p) => p - 1)}
              className="px-3 py-2 border border-gray-200 hover:scale-105 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={handleContinue}
              className="px-3 py-2 bg-emerald-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 hover:scale-105 flex items-center gap-2 transition"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-2 bg-emerald-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 hover:scale-105 flex items-center gap-2 transition disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Thumbnails
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ══ MODALS ════════════════════════════════════════════════════════ */}
      <ImageCropperModal
        isOpen={showCropper}
        ref={cropperRef}
        imageSrc={imageSrc[currentCropIndex]}
        currentIndex={currentCropIndex}
        totalImages={imageSrc.length}
        crop={crop}
        onCropChange={setCrop}
        onCropComplete={setCompletedCrop}
        aspectRatio={aspectRatio}
        onSave={saveCroppedImage}
        onSkip={handleSkipCrop}
        onCancel={() => {
          setShowCropper(false);
          setImageSrc([]);
          setImageSrcMeta([]);
          // Roll back only the current cropping batch — preserve prior selections
          setCroppedImages((prev) => prev.slice(0, cropBatchStart));
        }}
        onPrevious={handlePreviousCrop}
      />

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onCancel={() => setMediaPickerOpen(false)}
        onApply={handleApplyFromPicker}
        postData={formData}
        activeBrand={activeBrand}
        showToast={showToast}
        maxSelectable={Math.max(
          0,
          MAX_IMAGES - croppedImages.filter(Boolean).length,
        )}
      />

      {generating && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-10">
            <FloatingAnimation showProgressBar>
              <FloatingElements.ImageFile />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </>
  );
};

// ── shared micro-components ───────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

const SectionTitle = ({ children }) => (
  <h3 className="font-semibold text-gray-900 text-base">{children}</h3>
);

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default ThumbnailsForm;
