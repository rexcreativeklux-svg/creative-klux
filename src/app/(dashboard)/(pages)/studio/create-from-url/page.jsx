"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  Check,
  Megaphone,
  Share2,
  Images,
  FileUp,
  X,
  Film,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import AdPreview from "../Adpreview";
import FullOverlayLoader from "@/app/(components)/loaders/full-overlay-loader";

import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";
import { CREATIVE_ENGINE } from "@/(lib)/design/creativeEngine";
import {
  MIN_IMAGES,
  MAX_IMAGES,
  meetsImageMinimum,
  imageGateMessage,
} from "@/(lib)/creative/imageGate";

const VISUAL_STYLES = [
  "Minimal",
  "Bold",
  "Elegant",
  "Playful",
  "Corporate",
  "Modern",
  "Neon",
  "Pastel",
];

const AD_SIZES = [
  { label: "LinkedIn Horizontal", size: "1200×627" },
  { label: "LinkedIn Square", size: "627×627" },
  { label: "Google Landscape", size: "1200×628" },
  { label: "Google Square", size: "1200×1200" },
  { label: "TikTok Vertical", size: "1080×1920" },
  { label: "Meta Square", size: "1080×1080" },
  { label: "Meta Vertical", size: "1080×1350" },
  { label: "Meta Stories/Reels", size: "1080×1921" },
];

const SOCIAL_SIZES = [
  { label: "LinkedIn Horizontal", size: "1200×627" },
  { label: "LinkedIn Square", size: "627×627" },
  { label: "Instagram Square", size: "1080×1080" },
  { label: "Instagram Portrait", size: "1080×1350" },
  { label: "Stories / Reels", size: "1080×1920" },
  { label: "Facebook Feed", size: "1200×630" },
  { label: "Twitter / X Post", size: "1600×900" },
  { label: "Pinterest Pin", size: "1000×1500" },
];

const CAMPAIGN_GOALS = [
  "Brand Awareness",
  "Engagement",
  "Sales",
  "Lead Generation",
  "Website Traffic",
];

const AUDIENCES = [
  { label: "B2B", description: "Business owners, startups, agencies" },
  { label: "B2C", description: "End consumers, everyday users" },
  { label: "Casual", description: "Broad social media audience" },
  { label: "Inspirational", description: "Entrepreneurs & creators" },
  { label: "Sales", description: "Hot leads, ad audiences" },
];

const POST_TONES = [
  "Professional",
  "Casual",
  "Humorous",
  "Inspirational",
  "Urgent",
  "Educational",
];
const SOCIAL_PLATFORMS = [
  "Instagram",
  "LinkedIn",
  "Facebook",
  "Twitter / X",
  "TikTok",
  "Pinterest",
];
const FILE_FORMATS = ["PNG", "JPEG", "WEBP", "AVIF"];

const VIDEO_SIZES = [
  { label: "TikTok / Reels", size: "1080×1920" },
  { label: "Meta Square", size: "1080×1080" },
  { label: "Meta Vertical", size: "1080×1350" },
  { label: "YouTube / Landscape", size: "1920×1080" },
  { label: "Google Display", size: "1200×628" },
  { label: "LinkedIn", size: "1200×627" },
  { label: "Stories", size: "720×1280" },
  { label: "Pre-roll", size: "1280×720" },
];

const VIDEO_FORMATS = ["MP4", "MOV"];

const AD_SUB_TYPES = [
  { id: "image", label: "Image", enabled: true },
  { id: "video", label: "Video", enabled: true },
  { id: "interactive", label: "Interactive", enabled: false },
  { id: "playable", label: "Playable", enabled: false },
];
const DEFAULT_COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#ef4444",
  "#1e3a8a",
];

const CREATION_TYPES = [
  {
    id: "ads",
    icon: Megaphone,
    label: "Create Ads",
    description:
      "Generate paid ad creatives for Meta, Google, TikTok, LinkedIn and more.",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    selectedBorder: "border-blue-500",
    selectedBg: "bg-blue-50",
    badgeBg: "bg-blue-600",
    color: "#9333ea",
  },
  {
    id: "social",
    icon: Share2,
    label: "Create Content",
    description:
      "Design social media posts, stories, reels, banners and thumbnails.",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    selectedBorder: "border-teal-500",
    selectedBg: "bg-teal-50",
    badgeBg: "bg-teal-600",
    color: "#0d9488",
  },
];

const STEPS_ADS = [
  "URL",
  "Type",
  "Brand Details",
  "Size, Goals & Audience",
  "Select Images",
];
const STEPS_SOCIAL = [
  "URL",
  "Type",
  "Post Details",
  "Size, Goals & Audience",
  "Select Images",
];

const adsSelected = "border-blue-500 bg-blue-50 text-blue-700";
const socialSelected = "border-teal-500 bg-teal-50 text-teal-700";

export default function CreateFromUrl() {
  const router = useRouter();
  const {
    sendUrl,
    generateCustomCreative,
    createDesign,
    saveDesign,
    activeBrandId,
    uploadMedia,
    fetchDesignTemplates,
  } = useAuth();

  const [step, setStep] = useState(1);
  const [creationType, setCreationType] = useState(null);

  // Which generation backend to use. Defaults to the app-wide CREATIVE_ENGINE
  // flag; a ?engine=involk|redesign query param overrides it for this visit
  // (e.g. the "Create using Involk" entry point passes ?engine=involk).
  const [engine, setEngine] = useState(CREATIVE_ENGINE);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("engine");
    if (q === "involk" || q === "redesign") setEngine(q);
  }, []);

  // Step 1
  const [urlInput, setUrlInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [importError, setImportError] = useState("");
  const [scrapedImages, setScrapedImages] = useState([]); // images extracted from imported URL (max 10)

  // Step 3
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [visualStyle, setVisualStyle] = useState("Modern");
  const [brandColor, setBrandColor] = useState("#1e3a8a");
  const [logoUrl, setLogoUrl] = useState("");
  const [postTone, setPostTone] = useState("Casual");
  const [targetPlatform, setTargetPlatform] = useState("Instagram");

  // Step 4
  const [adSubType, setAdSubType] = useState("image"); // 'image' | 'video' | 'interactive' | 'playable'
  const [adSize, setAdSize] = useState("Meta Square");
  const [socialSize, setSocialSize] = useState("Instagram Square");
  const [videoSize, setVideoSize] = useState("Meta Square");
  const [campaignGoal, setCampaignGoal] = useState("Engagement");
  const [audience, setAudience] = useState("B2C");
  const [fileFormat, setFileFormat] = useState("PNG");
  const [videoFormat, setVideoFormat] = useState("MP4");
  const [generating, setGenerating] = useState(false);

  // ── Step 5 — Image state (mirrors ImageAdsForm exactly) ──────────────────
  const [imageSrc, setImageSrc] = useState([]); // raw URLs for cropper (current batch only)
  const [croppedImages, setCroppedImages] = useState([]); // master list — finished Files / pseudos / video objects
  const [cropBatchStart, setCropBatchStart] = useState(0); // index in croppedImages where current cropping batch begins
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
  const [imageSrcMeta, setImageSrcMeta] = useState([]); // original URLs parallel to imageSrc
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const cropperRef = useRef(null);

  // Reset completedCrop when crop index changes
  useEffect(() => {
    setCompletedCrop(null);
  }, [currentCropIndex]);

  // Result
  const [result, setResult] = useState(null);

  const [localToast, setLocalToast] = useState("");
  const showToast = (msg) => {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(""), 3000);
  };

  const isAds = creationType === "ads";
  const STEPS = isAds ? STEPS_ADS : STEPS_SOCIAL;
  const activeType =
    CREATION_TYPES.find((t) => t.id === creationType) || CREATION_TYPES[0];

  const getSelectedSize = () => {
    if (!isAds) {
      return (
        SOCIAL_SIZES.find((s) => s.label === socialSize)?.size?.replace(
          "×",
          "x",
        ) || "1080x1080"
      );
    }
    if (adSubType === "video") {
      return (
        VIDEO_SIZES.find((s) => s.label === videoSize)?.size?.replace(
          "×",
          "x",
        ) || "1080x1920"
      );
    }
    return (
      AD_SIZES.find((s) => s.label === adSize)?.size?.replace("×", "x") ||
      "1080x1080"
    );
  };

  const previewFormData = {
    brandName,
    description,
    primaryColor: brandColor,
    secondaryColor: "#0ea5e9",
    logo: logoUrl || null,
    backgroundImage: croppedImages.find(Boolean)?.previewUrl || null,
    size: getSelectedSize(),
    campaignGoal,
    audience,
    fileFormat,
    font: "inherit",
    caption: description,
  };

  // ── URL import ──────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!urlInput.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      const result = await sendUrl(urlInput.trim());
      if (!result?.ok) throw new Error(result?.message || "Import failed");
      const d = result.data?.data || result.data || {};
      if (d.name) setBrandName(d.name);
      if (d.description) setDescription(d.description);
      if (d.primary_color) setBrandColor(d.primary_color);
      const logo = d.logo || d.logo_url || d.logo?.url || null;
      if (logo && typeof logo === "string") setLogoUrl(logo);
      const imgs = Array.isArray(d.images) ? d.images.slice(0, 10) : [];
      setScrapedImages(imgs);
      setImported(true);
    } catch (err) {
      const message =
        err.message || "Failed to import. Please fill in manually.";
      setImportError(message);
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Cropper: save crop (mirrors ImageAdsForm saveCroppedImage) ───────────
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
      const updated = [...prev];
      updated[cropBatchStart + currentCropIndex] = file;
      return updated;
    });

    if (currentCropIndex < imageSrc.length - 1) {
      setCurrentCropIndex((prev) => prev + 1);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);
    } else {
      setShowCropper(false);
    }
  }, [
    completedCrop,
    currentCropIndex,
    imageSrc.length,
    imageSrcMeta,
    cropBatchStart,
  ]);

  // ── Cropper: skip (mirrors ImageAdsForm handleSkipCrop) ─────────────────
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

  // ── Cropper: previous (mirrors ImageAdsForm handlePreviousCrop) ──────────
  const handlePreviousCrop = () => {
    if (currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
      setCompletedCrop(null);
    }
  };

  // ── Remove a selected image ──────────────────────────────────────────────
  const removeCroppedImage = (idx) => {
    const next = croppedImages.filter((_, i) => i !== idx);
    setCroppedImages(next);
    if (idx <= currentCropIndex && currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
    }
  };

  // ── MediaPicker apply (mirrors ImageAdsForm handleApplyFromPicker) ───────
  const handleApplyFromPicker = async (images, media) => {
    let remaining = MAX_IMAGES - croppedImages.length;

    if (remaining <= 0) {
      showToast(`Maximum of ${MAX_IMAGES} items reached.`);
      setMediaPickerOpen(false);
      return;
    }

    const imagesToAdd = images.slice(0, remaining);
    remaining -= imagesToAdd.length;
    const mediaToAdd = media.slice(0, remaining);

    const skippedSome =
      imagesToAdd.length < images.length || mediaToAdd.length < media.length;

    if (imagesToAdd.length > 0) {
      try {
        const processedFiles = await Promise.all(
          imagesToAdd.map(async (item, idx) => {
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

        // Always APPEND — never reset. Track where this batch begins.
        setCropBatchStart(croppedImages.length);
        setImageSrc(previewUrls);
        setImageSrcMeta(sourceUrls);
        setCroppedImages((prev) => [
          ...prev,
          ...Array(previewUrls.length).fill(null),
        ]);
        setCurrentCropIndex(0);
        setShowCropper(true);

        showToast(`Added ${imagesToAdd.length} image(s) — crop them`);
      } catch (err) {
        console.error("Image loading failed:", err);
        showToast("Some images couldn't be loaded.");
      }
    }

    if (mediaToAdd.length > 0) {
      const videoObjects = mediaToAdd.map((src, i) => ({
        id: `video-${Date.now()}-${i}`,
        previewUrl: src,
        thumbnail: src,
        type: "video",
      }));
      setCroppedImages((prev) => [...prev, ...videoObjects]);
      showToast(`Added ${mediaToAdd.length} media item(s)`);
    }

    if (skippedSome) {
      showToast(`Only added what fits — max ${MAX_IMAGES}.`);
    }

    setMediaPickerOpen(false);
  };

  // ── BrandImagesStrip: use without cropping ───────────────────────────────
  const handleBrandImageUse = (imageObjs) => {
    const remaining = MAX_IMAGES - croppedImages.length;
    if (remaining <= 0) {
      showToast(`Maximum of ${MAX_IMAGES} items reached.`);
      return;
    }
    const toAdd = imageObjs.slice(0, remaining);
    const pseudos = toAdd.map((obj) => ({
      previewUrl: obj.src,
      sourceUrl: obj.src,
      name: obj.alt || "brand-image",
      type: "image/jpeg",
    }));
    setCroppedImages((prev) => [...prev, ...pseudos]);
    if (toAdd.length < imageObjs.length) {
      showToast(`Only added ${toAdd.length} — max ${MAX_IMAGES} reached.`);
    } else {
      showToast(
        `${pseudos.length} image${pseudos.length > 1 ? "s" : ""} added ✓`,
      );
    }
  };

  // ── BrandImagesStrip: crop ───────────────────────────────────────────────
  const handleBrandImageCrop = async (imageObjs) => {
    const remaining = MAX_IMAGES - croppedImages.length;
    if (remaining <= 0) {
      showToast(`Maximum of ${MAX_IMAGES} items reached.`);
      return;
    }
    const toAdd = imageObjs.slice(0, remaining);

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

    if (newUrls.length === 0) return;

    setCropBatchStart(croppedImages.length);
    setImageSrc(newUrls);
    setImageSrcMeta(newMetas);
    setCroppedImages((prev) => [...prev, ...Array(newUrls.length).fill(null)]);
    setCurrentCropIndex(0);
    setShowCropper(true);

    if (toAdd.length < imageObjs.length) {
      showToast(
        `Only ${toAdd.length} queued for crop — max ${MAX_IMAGES} reached.`,
      );
    }
  };

  // ── Shared generate helpers ───────────────────────────────────────────────
  // Resolve cropped/selected images to real URLs (used by both backends):
  //  - real https sourceUrl → as-is; File → upload to /gallery; blob → drop.
  const resolveImageUrls = async (validImages) =>
    (
      await Promise.all(
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
              console.error("uploadMedia failed for cropped item:", err);
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
      )
    ).filter(Boolean);

  // Base payload shared by both backends (no `templates`).
  const buildPayload = ({
    imageUrls,
    selectedSize,
    scraiveCategory,
    isVideo,
  }) => ({
    creativeType: isAds ? "ads_creative" : "social_creative",
    categoryType: isAds ? adSubType : "posts",
    brand_id: activeBrandId,
    brandName,
    description,
    brandColor,
    logo: logoUrl || null,
    visualStyle,
    font: "Montserrat",
    sourceUrl: urlInput || null,
    size: selectedSize,
    campaignGoal,
    audience,
    ...(isVideo ? { videoFormat } : { fileFormat }),
    images: imageUrls,
    category: scraiveCategory,
    type_size: selectedSize,
    ...(isAds ? {} : { tone: postTone, platforms: targetPlatform }),
    generatedAt: new Date().toISOString(),
  });

  // Common prep both functions need (size + images + base payload).
  const prepare = async () => {
    const selectedSize = getSelectedSize();
    const validImages = croppedImages.filter(Boolean);
    const isVideo = isAds && adSubType === "video";
    const selectedSizeLabel = !isAds
      ? socialSize
      : adSubType === "video"
        ? videoSize
        : adSize;
    const scraiveCategory = (selectedSizeLabel || "")
      .toLowerCase()
      .replace(/\s+/g, "_");
    const imageUrls = await resolveImageUrls(validImages);
    const payload = buildPayload({
      imageUrls,
      selectedSize,
      scraiveCategory,
      isVideo,
    });
    return { selectedSize, selectedSizeLabel, isVideo, payload };
  };

  // ═══ OPTION A — Scraive templates → POST /creatives/redesign (streamed batches) ═══
  const generateViaRedesign = async () => {
    setGenerating(true);
    try {
      const {
        selectedSize,
        selectedSizeLabel,
        isVideo,
        payload: base,
      } = await prepare();

      const templateRes = await fetchDesignTemplates({
        type: isVideo ? "video" : "image",
        category: selectedSizeLabel,
        type_size: selectedSize,
        design_type: isAds ? "ads" : "social",
      });
      if (!templateRes?.ok) {
        toast.error(templateRes?.message || "Failed to fetch templates");
        setGenerating(false);
        return;
      }
      const templates = Array.isArray(templateRes.data) ? templateRes.data : [];
      if (!templates.length) {
        toast.error("No templates found for this size");
        setGenerating(false);
        return;
      }

      const payload = { ...base, templates };
      const expectedCount = templates.length;
      let isFirstBatch = true;
      // Force the real Scraive endpoint here — this path is the explicit
      // "redesign" branch and must not be redirected by the CREATIVE_ENGINE flag.
      const res = await generateCustomCreative(
        payload,
        (batch) => {
        if (!batch.ok) return;
        const variations = batch.variations || [];
        const assets = batch.assets || [];
        if (isFirstBatch) {
          isFirstBatch = false;
          setGenerating(false);
          if (variations.length || assets.length) {
            setResult({
              type: "design",
              variations,
              assets,
              expectedCount,
              done: false,
              reply: batch.data?.reply || "",
              meta: batch.data?.meta || {},
            });
          }
        } else {
          setResult((prev) => {
            if (!prev)
              return {
                type: "design",
                variations,
                assets,
                expectedCount,
                done: false,
              };
            return {
              ...prev,
              variations: [...(prev.variations || []), ...variations],
              assets: [...(prev.assets || []), ...assets],
            };
          });
        }
        },
        { forceEngine: "redesign" },
      );

      if (!res.ok) {
        setResult((prev) => (prev ? { ...prev, done: true } : prev));
        throw new Error(res.message || "Generation failed");
      }
      const data = res.data;
      if (!data?.variations?.length && !data?.assets?.length) {
        throw new Error("No results returned from generation");
      }
      setResult((prev) => (prev ? { ...prev, done: true } : prev));
    } catch (err) {
      toast.error(err.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ═══ OPTION B — POST /design/generate-design/involk_llm (no Scraive, single design) ═══
  const generateViaLLM = async () => {
    setGenerating(true);
    try {
      const { isVideo, payload } = await prepare();

      // Keep the overlay up for the whole involk_llm request (single call, no streaming).
      const createRes = await createDesign(payload);
      console.log("🎨 createDesign output (create-from-url):", createRes);
      if (!createRes?.ok) {
        throw new Error(createRes?.message || "Generation failed");
      }

      // ADAPTER: involk_llm → { design: {canvas, elements}, copy } (single) OR
      // { variations: [...] }. Wrap a single design as one variation.
      const data = createRes.raw || createRes.data || {};

      // involk_llm returns each variation with `canvas` and `copy` as JSON STRINGS.
      // `canvas` decodes to { canvas: {width,height,background}, elements: [...] }.
      // DesignCanvas, the preview cards, and saveDesign all expect parsed objects
      // with a top-level `elements` array (the single-design branch below already
      // emits that shape) — so normalize each streamed variation the same way.
      const parseMaybe = (val) => {
        if (typeof val !== "string") return val;
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      };
      const normalizeVariation = (v) => {
        const design = parseMaybe(v?.canvas) || {};
        return {
          ...v,
          canvas: design.canvas || design || null,
          elements: Array.isArray(design.elements) ? design.elements : [],
          copy: parseMaybe(v?.copy) || {},
          category: v?.category || v?.sub_type || (isAds ? adSubType : "posts"),
        };
      };

      let variations = Array.isArray(data.variations)
        ? data.variations.map(normalizeVariation)
        : [];
      const assets = Array.isArray(data.assets) ? data.assets : [];
      if (!variations.length && data.design) {
        variations = [
          {
            id: `cd-${Date.now()}`,
            name: data.copy?.headline || brandName || "Generated Design",
            category: isAds ? adSubType : "posts",
            canvas: data.design.canvas,
            elements: data.design.elements || [],
            copy: data.copy || {},
          },
        ];
      }
      if (!variations.length && !assets.length) {
        throw new Error("No results returned from generation");
      }
      setResult({
        type: "design",
        variations,
        assets,
        expectedCount: variations.length || assets.length || 1,
        done: true,
      });
    } catch (err) {
      toast.error(err.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Generate — pick the backend by uncommenting ONE line ───────────────────
  const handleGenerate = async () => {
    if (!brandName.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    // Gate: generation needs at least MIN_IMAGES selected (gallery/uploads or
    // brand images). Max is capped at MAX_IMAGES during selection.
    const selectedMedia = croppedImages.filter(Boolean);
    if (!meetsImageMinimum(selectedMedia.length)) {
      toast.error(imageGateMessage(selectedMedia.length));
      return;
    }

    if (engine === "involk")
      await generateViaLLM(); // /design/generate-design/involk_llm
    else await generateViaRedesign(); // Scraive → /creatives/redesign
  };

  // ── RESULT VIEW ───────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-full py-1">
        {localToast && (
          <div className="fixed top-5 right-5 z-100 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-fade-in">
            {localToast}
          </div>
        )}
        <div>
          <AdPreview
            creative={activeType}
            category={{ label: isAds ? "Ad Creative" : "Social Content" }}
            creativeType={isAds ? "ads" : "social"}
            formData={previewFormData}
            result={result}
            onBack={() => setResult(null)}
            onOpenModal={() => {}}
            saveDesign={saveDesign}
            activeBrandId={activeBrandId}
            showToast={showToast}
          />
        </div>
      </div>
    );
  }

  // Image gate — Generate stays locked until at least MIN_IMAGES are selected.
  const selectedCount = croppedImages.filter(Boolean).length;
  const canGenerate = meetsImageMinimum(selectedCount);

  // ── FORM VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full py-8 px-gutter sm:py-10">
      {generating && (
        <FullOverlayLoader
          title="Generating your ad creative"
          subtitle="Crafting copy, layout & visuals"
        />
      )}
      {localToast && (
        <div className="fixed top-5 right-5 z-100 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {localToast}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <React.Fragment key={n}>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                    ${done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : n}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${active ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {label}
                  </span>
                </div>
                {n < STEPS.length && (
                  <div className="flex-1 h-px bg-gray-200" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── STEP 1: URL ── */}
        {step === 1 && (
          <div className="bg-surface rounded-2xl border border-gray-200 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Enter your website URL
              </h2>
              <p className="text-sm text-gray-500">
                We'll automatically extract your brand details to get started.
              </p>
            </div>

            <div
              className={`rounded-xl border p-5 transition-all ${imported ? "border-green-300 bg-green-50/50" : "border-gray-200 bg-gray-50"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Globe
                    className={`w-4 h-4 ${imported ? "text-green-500" : "text-blue-500"}`}
                  />
                  URL
                  {imported && (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" /> Brand data imported
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400">
                  Auto-fills brand info
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setImported(false);
                      setImportError("");
                    }}
                    placeholder="https://yourwebsite.com"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-surface
                      ${imported ? "border-green-300 pr-8" : "border-gray-200"}`}
                    onKeyDown={(e) => e.key === "Enter" && handleImport()}
                  />
                  {imported && (
                    <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                <button
                  onClick={handleImport}
                  disabled={importing || !urlInput.trim()}
                  className={`px-5 py-2 cursor-pointer rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2 shrink-0
                    ${imported ? "bg-green-500 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : imported ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Done
                    </>
                  ) : (
                    "Import"
                  )}
                </button>
              </div>

              {importError && (
                <p className="text-xs text-red-500 mt-2">{importError}</p>
              )}

              {imported && brandName && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-green-100 border border-green-200">
                  <div
                    className="w-8 h-8 rounded-full shrink-0 border-2 border-white shadow-sm"
                    style={{ background: brandColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-green-700">
                      {brandName}
                    </p>
                    {description && (
                      <p className="text-[11px] text-gray-500 truncate">
                        {description}
                      </p>
                    )}
                  </div>
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="logo"
                      className="w-10 h-10 object-contain rounded-lg border border-green-200 bg-surface p-0.5 shrink-0"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                </div>
              )}

              {!imported && !importError && (
                <p className="text-[11px] text-gray-400 mt-2">
                  Enter your website URL and click Import to auto-fill your
                  brand details.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!imported}
                className="px-5 py-2 cursor-pointer bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Type ── */}
        {step === 2 && (
          <div className="bg-surface rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                What would you like to create?
              </h2>
              <p className="text-sm text-gray-500">
                Choose your creative type to get started.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CREATION_TYPES.map((type) => {
                const selected = creationType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setCreationType(type.id)}
                    className={`text-left p-6 rounded-xl border-2 transition-all cursor-pointer
                      ${selected ? `${type.selectedBorder} ${type.selectedBg}` : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${type.iconBg}`}
                    >
                      <type.icon className={`w-6 h-6 ${type.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {type.label}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 cursor-pointer border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!creationType}
                className="px-5 py-2 cursor-pointer bg-blue-700 rounded-lg hover:bg-blue-800 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Brand / Post Details ── */}
        {step === 3 && (
          <div className="bg-surface rounded-2xl border border-gray-200 p-7 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isAds ? "Brand Details" : "Post Details"}
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Brand Name / Project Name{" "}
                <span className="text-red-400">*</span>
              </label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Acme Inc"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                {isAds ? "Description" : "Post Description"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isAds ? "What does the brand do?" : "What is this post about?"
                }
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {isAds ? (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Visual Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {VISUAL_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => setVisualStyle(style)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all cursor-pointer
                        ${visualStyle === style ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Post Tone
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POST_TONES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setPostTone(t)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all cursor-pointer
                          ${postTone === t ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Target Platform
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SOCIAL_PLATFORMS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setTargetPlatform(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all cursor-pointer
                          ${targetPlatform === p ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Brand Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBrandColor(c)}
                      style={{ background: c }}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer
                        ${brandColor === c ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"}`}
                    />
                  ))}
                  <label
                    className="w-7 h-7 rounded-full border border-gray-200 cursor-pointer overflow-hidden"
                    style={{ background: brandColor }}
                  >
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="opacity-0 w-full h-full cursor-pointer"
                    />
                  </label>
                  <input
                    value={brandColor}
                    onChange={(e) =>
                      /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) &&
                      setBrandColor(e.target.value)
                    }
                    className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Logo
                </label>
                <label
                  className={`flex items-center gap-2 border border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all
                  ${logoUrl ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  {logoUrl ? (
                    <>
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-green-600 font-medium flex-1 truncate">
                        {logoUrl.startsWith("data:")
                          ? "Logo uploaded"
                          : "Logo imported"}
                      </span>
                      <img
                        src={logoUrl}
                        alt="logo"
                        className="w-10 h-10 object-contain rounded border border-green-200 bg-surface p-0.5 shrink-0"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setLogoUrl("");
                        }}
                        className="text-gray-400 hover:text-red-500 transition shrink-0 text-xs ml-1"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Upload logo</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 cursor-pointer border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!brandName.trim() || !description.trim()}
                className="px-5 py-2 cursor-pointer bg-blue-700 rounded-lg hover:bg-blue-800 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Size, Goals & Audience ── */}
        {step === 4 && (
          <div className="bg-surface rounded-2xl border border-gray-200 p-7 space-y-7">
            <h2 className="text-xl font-bold text-gray-900">
              Size, Goals & Audience
            </h2>

            {isAds && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Ad Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {AD_SUB_TYPES.map((t) => {
                    const isSelected = adSubType === t.id;
                    const baseClasses =
                      "px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all flex items-center gap-2";
                    if (!t.enabled) {
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled
                          title="Coming soon…"
                          className={`${baseClasses} border-gray-100 bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed`}
                        >
                          {t.label}
                        </button>
                      );
                    }
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAdSubType(t.id)}
                        className={`${baseClasses} cursor-pointer
                          ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300"
                          }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                {isAds
                  ? adSubType === "video"
                    ? "Video Size"
                    : "Ad Size"
                  : "Post Size"}
              </label>
              <div className="flex flex-wrap gap-2">
                {(isAds
                  ? adSubType === "video"
                    ? VIDEO_SIZES
                    : AD_SIZES
                  : SOCIAL_SIZES
                ).map((s) => {
                  const isSelected = isAds
                    ? adSubType === "video"
                      ? videoSize === s.label
                      : adSize === s.label
                    : socialSize === s.label;
                  const handleClick = () => {
                    if (!isAds) return setSocialSize(s.label);
                    if (adSubType === "video") return setVideoSize(s.label);
                    return setAdSize(s.label);
                  };
                  return (
                    <button
                      key={s.label}
                      onClick={handleClick}
                      className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer
                        ${
                          isSelected
                            ? isAds
                              ? adsSelected
                              : socialSelected
                            : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300"
                        }`}
                    >
                      <p className="text-xs font-semibold">{s.label}</p>
                      <p
                        className={`text-[10px] mt-0.5 ${isSelected ? "opacity-70" : "text-gray-400"}`}
                      >
                        {s.size}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Campaign Goal
              </label>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setCampaignGoal(g)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all cursor-pointer
                      ${
                        campaignGoal === g
                          ? isAds
                            ? adsSelected
                            : socialSelected
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Audience
              </label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => setAudience(a.label)}
                    className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer
                      ${
                        audience === a.label
                          ? isAds
                            ? adsSelected
                            : socialSelected
                          : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200"
                      }`}
                  >
                    <p className="text-xs font-semibold">{a.label}</p>
                    <p
                      className={`text-[11px] mt-0.5 ${audience === a.label ? "opacity-70" : "text-gray-400"}`}
                    >
                      {a.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                {isAds && adSubType === "video"
                  ? "Video Format"
                  : "File Format"}
              </label>
              <div className="flex gap-2">
                {(isAds && adSubType === "video"
                  ? VIDEO_FORMATS
                  : FILE_FORMATS
                ).map((f) => {
                  const isVideoFmt = isAds && adSubType === "video";
                  const currentValue = isVideoFmt ? videoFormat : fileFormat;
                  const setValue = isVideoFmt ? setVideoFormat : setFileFormat;
                  return (
                    <button
                      key={f}
                      onClick={() => setValue(f)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer flex items-center gap-1.5
                        ${
                          currentValue === f
                            ? isAds
                              ? adsSelected
                              : socialSelected
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                    >
                      {currentValue === f && <Check className="w-3 h-3" />}
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(3)}
                className="px-4 cursor-pointer py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="px-5 py-2 cursor-pointer bg-blue-700 rounded-lg hover:bg-blue-800 text-white text-sm font-semibold transition-all flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Select Images / Background Media ── */}
        {step === 5 && (
          <div className="bg-surface rounded-2xl border border-gray-200 p-7 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isAds && adSubType === "video"
                  ? "Select Background Media"
                  : "Select Images"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isAds && adSubType === "video"
                  ? "Add background media (images or videos) for your video ad. You can search, upload, or use brand assets."
                  : "Add background images for your creative. You can search, upload, or use brand images."}
              </p>
            </div>

            {/* Brand images strip — shows images scraped from the imported URL */}
            <BrandImagesStrip
              images={scrapedImages}
              label="Images from imported site"
              maxImages={10}
              onSelect={handleBrandImageUse}
              onCrop={handleBrandImageCrop}
              selectedUrls={croppedImages
                .filter(Boolean)
                .map((f) => f?.sourceUrl || f?.previewUrl)
                .filter(Boolean)}
            />

            {/* Already-selected previews */}
            {croppedImages.filter(Boolean).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Selected ({croppedImages.filter(Boolean).length})
                </p>
                <div className="grid grid-fluid-[76px] gap-2">
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
                            alt={`Selected ${index + 1}`}
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

            {/* Upload / picker drop zone */}
            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              onClick={() => setMediaPickerOpen(true)}
            >
              <div className="w-10 h-10 bg-surface border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                {isAds && adSubType === "video" ? (
                  <Film className="w-5 h-5 text-gray-400" />
                ) : (
                  <FileUp className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {isAds && adSubType === "video"
                    ? "Upload or Search Background Media"
                    : "Upload or Search Images"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {isAds && adSubType === "video"
                    ? "Images or videos — from library, web search, or AI generation"
                    : "Search the web, magic studio, or upload from device"}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaPickerOpen(true);
                }}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer flex items-center gap-2"
              >
                {isAds && adSubType === "video" ? (
                  <>
                    <Film className="w-4 h-4" /> Choose Media
                  </>
                ) : (
                  <>
                    <Images className="w-4 h-4" /> Choose Media
                  </>
                )}
              </button>
            </div>

            <p
              className={`text-xs text-center ${canGenerate ? "text-gray-400" : "text-amber-600"}`}
            >
              {isAds && adSubType === "video"
                ? `Select at least ${MIN_IMAGES} media items (max ${MAX_IMAGES}) to generate.`
                : `Select at least ${MIN_IMAGES} images (max ${MAX_IMAGES}) to generate.`}
            </p>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(4)}
                className="px-4 cursor-pointer py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 cursor-pointer py-2 bg-blue-700 rounded-lg hover:bg-blue-800 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center gap-2 min-w-40 justify-center"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    {isAds && adSubType === "video"
                      ? "Generate Video Ads"
                      : "Generate Creative"}{" "}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ImageCropperModal
        isOpen={showCropper}
        ref={cropperRef}
        imageSrc={imageSrc[currentCropIndex]}
        currentIndex={currentCropIndex}
        totalImages={imageSrc.length}
        crop={crop}
        onCropChange={setCrop}
        onCropComplete={setCompletedCrop}
        aspectRatio={undefined}
        onSave={saveCroppedImage}
        onSkip={handleSkipCrop}
        onCancel={() => {
          setShowCropper(false);
          setImageSrc([]);
          setImageSrcMeta([]);
          // Roll back only the current cropping batch — preserve prior selections.
          setCroppedImages((prev) => prev.slice(0, cropBatchStart));
        }}
        onPrevious={handlePreviousCrop}
      />

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onCancel={() => setMediaPickerOpen(false)}
        onApply={handleApplyFromPicker}
        maxSelectable={Math.max(0, MAX_IMAGES - croppedImages.length)}
        postData={{
          brandName,
          description,
          primaryColor: brandColor,
          logo: logoUrl || null,
        }}
        activeBrand={null}
        showToast={showToast}
      />
    </div>
  );
}
