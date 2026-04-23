"use client";
// forms/ThumbnailsForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Loader2, FileUp, X, CheckCircle2, ChevronRight,
  Sparkles, FileSearch, FolderOpen, Images,
  Type, Hash, Wand2, PlayCircle, TrendingUp,
  Video,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

import SearchMediaModal from "@/app/(components)/SearchMediaModal";
import LibraryMediaModal from "@/app/(components)/LibraryMediaModal";
import MagicMediaModal from "@/app/(components)/MagicMediaModal";
import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import RecommendedImagesSection from "@/app/(components)/RecommendedImagesSection";
import ImportedBrandImagesSection from "@/app/(components)/ImportedBrandImagesSection";

import TextToImageTab from "../../old-studio/designer-creatives/create/tabs/text-to-image/page";
import TextToAudioTab from "../../old-studio/designer-creatives/create/tabs/text-to-audio/page";
import TextToVideoTab from "../../old-studio/designer-creatives/create/tabs/text-to-video/page";
import ImageToVariationsTab from "../../old-studio/designer-creatives/create/tabs/image-to-variations/page";
import ScriptToVoiceoverToVideoTab from "../../old-studio/designer-creatives/create/tabs/script-to-voiceover/page";
import AudioToTextTab from "../../old-studio/ai-studio/create/audio-to-text/page";
import PersonaBasedGeneratorTab from "../../old-studio/designer-creatives/create/tabs/persona-based-generator/page";

// ── Social Creative theme color ───────────────────────────────────────────────
const THEME = "#059669"; // emerald

// ── constants ─────────────────────────────────────────────────────────────────
const THUMBNAIL_PLATFORMS = [
  { value: "youtube",   label: "YouTube",   desc: "1280 × 720 px" },
  { value: "twitch",    label: "Twitch",    desc: "1280 × 720 px" },
  { value: "tiktok",    label: "TikTok",    desc: "1080 × 1920 px" },
  { value: "instagram", label: "Instagram", desc: "1080 × 1080 px" },
  { value: "linkedin",  label: "LinkedIn",  desc: "1200 × 627 px" },
  { value: "twitter",   label: "X / Twitter", desc: "1600 × 900 px" },
];

const PLATFORM_SIZES = {
  youtube:   { value: "1280x720",  label: "1280 × 720 px",   ratio: 16 / 9 },
  twitch:    { value: "1280x720",  label: "1280 × 720 px",   ratio: 16 / 9 },
  tiktok:    { value: "1080x1920", label: "1080 × 1920 px",  ratio: 9 / 16 },
  instagram: { value: "1080x1080", label: "1080 × 1080 px",  ratio: 1 },
  linkedin:  { value: "1200x627",  label: "1200 × 627 px",   ratio: 1200 / 627 },
  twitter:   { value: "1600x900",  label: "1600 × 900 px",   ratio: 16 / 9 },
};

const CONTENT_CATEGORIES = [
  { value: "tutorial",    label: "Tutorial / How-to" },
  { value: "vlog",        label: "Vlog / Lifestyle" },
  { value: "review",      label: "Product Review" },
  { value: "gaming",      label: "Gaming" },
  { value: "news",        label: "News / Commentary" },
  { value: "podcast",     label: "Podcast / Interview" },
  { value: "fitness",     label: "Fitness / Health" },
  { value: "cooking",     label: "Cooking / Food" },
  { value: "finance",     label: "Finance / Business" },
  { value: "education",   label: "Education" },
  { value: "music",       label: "Music / Entertainment" },
  { value: "travel",      label: "Travel / Adventure" },
];

const VISUAL_STYLES = [
  { value: "bold",       label: "Bold & High Contrast" },
  { value: "clean",      label: "Clean & Minimal" },
  { value: "dramatic",   label: "Dramatic / Cinematic" },
  { value: "playful",    label: "Playful / Colorful" },
  { value: "professional",label: "Professional" },
  { value: "retro",      label: "Retro / Vintage" },
];

const EMOTION_HOOKS = [
  { value: "curiosity",   label: "Curiosity" },
  { value: "shock",       label: "Shock / Surprise" },
  { value: "excitement",  label: "Excitement" },
  { value: "urgency",     label: "Urgency" },
  { value: "humor",       label: "Humor" },
  { value: "inspiration", label: "Inspiration" },
];

const CAMPAIGN_GOALS = [
  "Views / Reach", "Subscriber Growth", "Engagement", "Website Traffic", "Sales / Conversions",
];

const FILE_FORMATS = ["PNG", "JPEG", "WEBP"];

const FONT_OPTIONS = [
  "Montserrat", "Bebas Neue", "Anton", "Oswald", "Poppins",
  "Raleway", "Roboto Condensed", "Impact", "Lato", "Nunito",
];

const BRAND_COLORS = [
  "#059669", "#2563eb", "#7c3aed", "#db2777", "#ef4444",
  "#f59e0b", "#0ea5e9", "#111827",
];

const STEPS = [
  { id: 1, label: "Brand & Content",   icon: Video },
  { id: 2, label: "Platform & Style",  icon: TrendingUp },
  { id: 3, label: "Reference Images",  icon: Images },
];

// ─────────────────────────────────────────────────────────────────────────────

const ThumbnailsForm = ({ formData, setFormData, activeBrand, sendUrl, showToast, onResult }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [brandUrl, setBrandUrl] = useState(activeBrand?.url || activeBrand?.source_url || "");
  const [importingBrand, setImportingBrand] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ── image / crop state ────────────────────────────────────────────────────
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState(null);

  const cropperRef   = useRef(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // ── modal state ───────────────────────────────────────────────────────────
  const [searchModalOpen,  setSearchModalOpen]  = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicModalOpen,   setMagicModalOpen]   = useState(false);
  const [selectedImages,   setSelectedImages]   = useState([]);
  const [selectedMedia,    setSelectedMedia]    = useState([]);
  const [magicTab,         setMagicTab]         = useState("Text to Image");

  // ── recommended images ────────────────────────────────────────────────────
  const [recommendedImages,  setRecommendedImages]  = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  // derive aspect ratio from selected platform
  const platform     = formData.thumbnailPlatform || "youtube";
  const aspectRatio  = PLATFORM_SIZES[platform]?.ratio || 16 / 9;

  useEffect(() => {
    if (!formData.brandName?.trim()) return;
    const query = `${formData.brandName} ${formData.contentCategory || "video"} thumbnail`;
    const t = setTimeout(async () => {
      setLoadingRecommended(true);
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=8`);
        const d = await res.json();
        setRecommendedImages((d.photos || []).map((p) => ({ id: p.id, src: p.src.medium, large: p.src.large2x, alt: p.alt || "" })));
      } catch { setRecommendedImages([]); }
      finally { setLoadingRecommended(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [formData.brandName, formData.contentCategory]);

  // Sync first cropped image → live preview
  useEffect(() => {
    const first = croppedImages.find(Boolean);
    if (first?.previewUrl) setFormData((p) => ({ ...p, backgroundImage: first.previewUrl }));
  }, [croppedImages]);

  useEffect(() => { setCompletedCrop(null); }, [currentCropIndex]);

  // Auto-set size when platform changes
  useEffect(() => {
    const size = PLATFORM_SIZES[platform]?.value;
    if (size) setFormData((p) => ({ ...p, size }));
  }, [platform]);

  // ── field helper ──────────────────────────────────────────────────────────
  const field = (key, value) => {
    setFormData((p) => ({ ...p, [key]: value }));
    setError("");
  };

  // ── URL import ────────────────────────────────────────────────────────────
  const handleImportBrand = async () => {
    if (!brandUrl.trim()) return setError("Please enter a valid brand URL.");
    setImportingBrand(true);
    try {
      const r = await sendUrl(brandUrl);
      if (!r?.data) throw new Error();
      const d = r.data;
      setFormData((p) => ({
        ...p,
        brandName:      d.name        || "",
        description:    d.description || "",
        brandColor:     d.primary_color   || THEME,
        font:           d.font            || "Montserrat",
        logo:           d.logo            || "",
        importedImages: d.images?.map((i) => i.url).filter(Boolean) || [],
      }));
      showToast("Brand imported!");
    } catch { setError("Failed to import brand. Check the URL."); }
    finally { setImportingBrand(false); }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => field("logo", reader.result);
    reader.readAsDataURL(file);
  };

  // ── Apply selected ────────────────────────────────────────────────────────
  const handleApplySelected = async () => {
    const sources = magicModalOpen ? selectedMedia : selectedImages;
    if (sources.length === 0) return;

    const images = sources.filter(
      (item) =>
        !item.type ||
        item.type === "image" ||
        (typeof item.src === "string" && !item.src.includes(".mp4") && !item.videoSrc)
    );
    const videos = sources.filter(
      (item) =>
        item.type === "video" ||
        item.videoSrc ||
        (typeof item.src === "string" && item.src.includes(".mp4"))
    );

    if (images.length > 0) {
      try {
        const processedFiles = await Promise.all(
          images.map(async (item, idx) => {
            let url = item.src || item.large || item;
            const shouldProxy = typeof url === "string" && url.startsWith("http");
            const fetchUrl = shouldProxy ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url;
            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`Failed to load image: ${url}`);
            const blob = await res.blob();
            const file = new File([blob], `selected-image-${Date.now()}-${idx}`, { type: blob.type || "image/png" });
            file.previewUrl = URL.createObjectURL(blob);
            return file;
          })
        );

        const previewUrls = processedFiles.map((f) => f.previewUrl);

        if (!showCropper) {
          setImageSrc(previewUrls);
          setCroppedImages(Array(previewUrls.length).fill(null));
          setCurrentCropIndex(0);
        } else {
          setImageSrc((prev) => [...prev, ...previewUrls]);
          setCroppedImages((prev) => [...prev, ...Array(previewUrls.length).fill(null)]);
          setCurrentCropIndex(imageSrc.length);
        }

        setShowCropper(true);
        showToast(`Added ${images.length} image${images.length > 1 ? "s" : ""} — now crop them`);
      } catch (err) {
        console.error("Image loading failed:", err);
        showToast("Some images couldn't be loaded. Please try again.");
      }
    }

    if (videos.length > 0) {
      const videoObjects = videos.map((video, i) => ({
        id: `video-${Date.now()}-${i}`,
        previewUrl: video.videoSrc || video.src || video.large,
        thumbnail: video.thumbnail || video.image || video.src,
        type: "video",
        alt: video.alt || "Selected video",
        original: video,
      }));
      setCroppedImages((prev) => [...prev, ...videoObjects]);
      showToast(`Added ${videos.length} video${videos.length > 1 ? "s" : ""}`);
    }

    if (images.length === 0 && videos.length > 0) setShowCropper(false);

    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicModalOpen(false);
    setSelectedImages([]);
    setSelectedMedia([]);
  };

  // ── File input ────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));

    if (!showCropper) {
      setImageSrc(urls);
      setCroppedImages(Array(urls.length).fill(null));
      setCurrentCropIndex(0);
    } else {
      setImageSrc((prev) => [...prev, ...urls]);
      setCroppedImages((prev) => [...prev, ...Array(urls.length).fill(null)]);
      setCurrentCropIndex(imageSrc.length);
    }

    setShowCropper(true);
    e.target.value = "";
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
    canvas.width  = completedCrop.width;
    canvas.height = completedCrop.height;
    ctx.drawImage(
      image,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, canvas.width, canvas.height
    );

    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const file  = new File([blob], `cropped-${currentCropIndex}.png`, { type: "image/png" });
    file.previewUrl = URL.createObjectURL(blob);

    setCroppedImages((prev) => { const u = [...prev]; u[currentCropIndex] = file; return u; });

    if (currentCropIndex < imageSrc.length - 1) {
      setCurrentCropIndex((prev) => prev + 1);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);
    } else {
      setShowCropper(false);
    }
  }, [completedCrop, currentCropIndex, imageSrc.length]);

  // ── Skip crop ─────────────────────────────────────────────────────────────
  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url).then((r) => r.blob()).then((blob) => {
      const file = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
      file.previewUrl = url;
      setCroppedImages((prev) => { const u = [...prev]; u[currentCropIndex] = file; return u; });
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
    const next  = croppedImages.filter((_, i) => i !== idx);
    const first = next.find(Boolean);
    setCroppedImages(next);
    setFormData((p) => ({ ...p, backgroundImage: first?.previewUrl || null }));
    if (idx <= currentCropIndex && currentCropIndex > 0) setCurrentCropIndex((prev) => prev - 1);
  };

  // ── Step navigation ───────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !formData.brandName) return setError("Channel / brand name is required.");
    if (step === 1 && !formData.videoTitle) return setError("Video title is required.");
    if (step === 2 && !formData.thumbnailPlatform) return setError("Please select a platform.");
    if (step === 2 && !formData.contentCategory) return setError("Please select a content category.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const valid = croppedImages.filter(Boolean);
      const assets = Array.from({ length: 6 }, (_, i) => {
        const src = valid[i % Math.max(valid.length, 1)];
        const url = src?.previewUrl || recommendedImages[i]?.large || "/placeholder.png";
        return { id: `thumb_${i}`, preview: url, alt: `Thumbnail ${i + 1}` };
      });
      onResult({ assets });
      setGenerating(false);
    }, 3000);
  };

  const handleMagicSelect = (src) =>
    setSelectedMedia((p) => p.includes(src) ? p.filter((m) => m !== src) : p.length < 5 ? [...p, src] : p);

  const handleCancelSelection = () => {
    setSelectedImages([]);
    setSelectedMedia([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicModalOpen(false);
  };

  const handlePreviousCrop = () => {
    if (currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
      setCompletedCrop(null);
    }
  };

  const renderTabContent = () => {
    const shared = { selectedMedia, handleSelectMedia: handleMagicSelect };
    const map = {
      "Text to Image":           <TextToImageTab {...shared} postData={formData} activeBrand={activeBrand} />,
      "Text to Audio":           <TextToAudioTab {...shared} />,
      "Text to Video":           <TextToVideoTab {...shared} />,
      "Image to Variations":     <ImageToVariationsTab {...shared} brandName={formData.brandName} postData={formData} activeBrand={activeBrand}
                                    onClose={() => setMagicModalOpen(false)}
                                    openSearchModal={() => { setSearchModalOpen(true); setMagicModalOpen(false); }}
                                    openLibraryModal={() => { setLibraryModalOpen(true); setMagicModalOpen(false); }} />,
      "Script to Voiceover to Video": <ScriptToVoiceoverToVideoTab {...shared} />,
      "Audio to Text":           <AudioToTextTab {...shared} />,
      "Persona-based Generator": <PersonaBasedGeneratorTab {...shared} />,
    };
    return map[magicTab] ?? <div className="p-4 text-sm text-gray-500">Select a tab</div>;
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
                  <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                    ${step > s.id  ? "border-emerald-600 bg-emerald-600 text-white"
                    : step === s.id ? "border-emerald-600 text-emerald-600 bg-white"
                    : "border-gray-200 text-gray-300"}`}>
                    {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`hidden sm:block text-xs font-medium truncate ${step >= s.id ? "text-gray-700" : "text-gray-300"}`}>
                    {s.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full transition-all ${step > s.id ? "bg-emerald-600" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step content ──────────────────────────────────────────────── */}
      <div className="bg-white px-2 rounded-lg py-2 flex flex-col gap-6">

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
                <span className="text-sm font-medium text-gray-700">Import from URL</span>
                <span className="text-xs text-gray-400 ml-auto">Auto-fills brand info</span>
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
                  {importingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                </button>
              </div>
            </div>

            {/* Channel / Brand name */}
            <Field label="Channel / Brand Name" required>
              <input
                type="text"
                value={formData.brandName || ""}
                onChange={(e) => field("brandName", e.target.value)}
                placeholder="Your channel or brand name"
                className={inputCls}
              />
            </Field>

            {/* Video title — most thumbnail-specific field */}
            <Field label="Video Title" required>
              <input
                type="text"
                value={formData.videoTitle || ""}
                onChange={(e) => field("videoTitle", e.target.value)}
                placeholder="The actual title of the video (used to generate thumbnail text)"
                className={inputCls}
              />
            </Field>

            {/* Thumbnail headline + subtext */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Thumbnail Headline">
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.thumbnailHeadline || ""}
                    onChange={(e) => field("thumbnailHeadline", e.target.value)}
                    placeholder="Bold overlay text (e.g., '10X Your Results')"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Supporting Text">
                <input
                  type="text"
                  value={formData.thumbnailSubtext || ""}
                  onChange={(e) => field("thumbnailSubtext", e.target.value)}
                  placeholder="Smaller supporting text (optional)"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Description */}
            <Field label="Video Description / Context">
              <textarea
                value={formData.description || ""}
                onChange={(e) => field("description", e.target.value)}
                placeholder="Brief description of the video — helps the AI match the thumbnail mood…"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>

            {/* Hashtags */}
            <Field label="Hashtags">
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
            </Field>

            {/* Brand Color + Logo */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand Color">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap max-w-44">
                    {BRAND_COLORS.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => field("brandColor", hex)}
                        className={`w-6 h-6 rounded-md cursor-pointer border-2 transition-transform hover:scale-110 ${formData.brandColor === hex ? "border-gray-800 scale-110" : "border-transparent"}`}
                        style={{ background: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <label
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 transition hover:scale-105"
                      style={{ background: formData.brandColor || THEME }}
                    >
                      <input
                        type="color"
                        value={formData.brandColor || THEME}
                        onChange={(e) => field("brandColor", e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={formData.brandColor || THEME}
                      onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && field("brandColor", e.target.value)}
                      className={`${inputCls} w-24! flex-none px-2 text-sm font-mono`}
                      maxLength={7}
                    />
                  </div>
                </div>
              </Field>

              <Field label="Channel Logo (optional)">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 px-3 py-2.5 border cursor-pointer border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-emerald-500 hover:text-emerald-600 flex items-center gap-2 transition"
                  >
                    <FileUp className="w-4 h-4" /> Upload
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
                  {formData.logo && (
                    <div className="w-10 h-10 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                      <img src={formData.logo} alt="logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </Field>
            </div>

            {/* Font */}
            <Field label="Preferred Font">
              <select
                value={formData.font || "Montserrat"}
                onChange={(e) => field("font", e.target.value)}
                className={`${inputCls} bg-white cursor-pointer`}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {/* ═══ STEP 2 — Platform & Style ═══════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle>Platform, Style &amp; Goals</SectionTitle>

            {/* Platform — drives the aspect ratio used in cropper */}
            <Field label="Target Platform" required>
              <div className="grid grid-cols-3 gap-2">
                {THUMBNAIL_PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => field("thumbnailPlatform", p.value)}
                    className={`text-left px-3 py-2.5 cursor-pointer rounded-xl border-2 transition-all
                      ${formData.thumbnailPlatform === p.value
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <p className={`text-xs font-semibold ${formData.thumbnailPlatform === p.value ? "text-emerald-700" : "text-gray-700"}`}>
                      {p.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
              {formData.thumbnailPlatform && (
                <p className="text-[11px] text-emerald-600 mt-1">
                  ✓ Output size: {PLATFORM_SIZES[formData.thumbnailPlatform]?.label}
                </p>
              )}
            </Field>

            {/* Content Category */}
            <Field label="Content Category" required>
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
            </Field>

            {/* Visual Style */}
            <Field label="Visual Style">
              <div className="flex flex-wrap gap-2">
                {VISUAL_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => field("visualStyle", s.value)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-semibold border-2 transition-all
                      ${formData.visualStyle === s.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Emotion Hook — thumbnail-specific */}
            <Field label="Emotion / Hook">
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
            </Field>

            {/* Campaign Goal */}
            <Field label="Campaign Goal">
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => field("campaignGoal", g)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all
                      ${formData.campaignGoal === g
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            {/* File Format */}
            <Field label="Output Format">
              <div className="flex gap-2">
                {FILE_FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => field("fileFormat", f)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all
                      ${formData.fileFormat === f
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {f}{f === "PNG" && " ✓"}
                  </button>
                ))}
              </div>
            </Field>

            {/* Additional notes */}
            <Field label="Additional Notes">
              <textarea
                value={formData.thumbnailNotes || ""}
                onChange={(e) => field("thumbnailNotes", e.target.value)}
                placeholder="Anything else — face expression, props, background color, number of variants…"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>
        )}

        {/* ═══ STEP 3 — Reference Images ══════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <SectionTitle>Reference Images</SectionTitle>
              {selectedImages.length > 0 && (
                <button
                  onClick={handleApplySelected}
                  className="px-4 py-2 bg-emerald-600 cursor-pointer text-white text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply ({selectedImages.length})
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 -mt-2">
              Upload a background photo, face shot, or any visual that should appear in the thumbnail.
            </p>

            {(formData.importedImages || []).length > 0 && (
              <ImportedBrandImagesSection
                importedImages={formData.importedImages}
                selectedImages={selectedImages}
                setSelectedImages={setSelectedImages}
                showToast={showToast}
              />
            )}

            <RecommendedImagesSection
              recommendedImages={recommendedImages}
              isLoadingRecommended={loadingRecommended}
              selectedImages={selectedImages}
              setSelectedImages={setSelectedImages}
              showToast={showToast}
            />

            {/* Selected media grid */}
            {croppedImages.length > 0 && (
              <div className="py-2">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Selected ({croppedImages.filter(Boolean).length}/5)
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {croppedImages.map((item, index) => {
                    const url =
                      item?.previewUrl ||
                      (item instanceof File || item instanceof Blob ? URL.createObjectURL(item) : null);
                    const isVideo = item?.videoSrc || item?.type?.includes?.("video");

                    return (
                      <div key={index} className="relative group">
                        {url ? (
                          isVideo ? (
                            <video
                              src={item.videoSrc || url}
                              poster={item.thumbnail}
                              className="w-full h-auto object-cover rounded-md border border-gray-200 shadow"
                              muted loop playsInline preload="metadata"
                              onMouseEnter={(e) => e.target.play().catch(() => {})}
                              onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`Reference ${index + 1}`}
                              className="w-full h-auto object-cover rounded-md border border-gray-200 shadow"
                            />
                          )
                        ) : (
                          <div className="w-full h-24 bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-500">No media</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeCroppedImage(index); }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload zone */}
            <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-6 bg-emerald-50/30 flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-white border border-emerald-200 rounded-xl flex items-center justify-center shadow-sm">
                <PlayCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Add Background or Subject</p>
                <p className="text-xs text-gray-400 mt-1">Face shots, product photos, or scene backgrounds</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <MediaBtn icon={FileSearch} label="Search Media"  onClick={() => setSearchModalOpen(true)} />
                <MediaBtn icon={FolderOpen}  label="Your Library" onClick={() => setLibraryModalOpen(true)} />
                <MediaBtn icon={Sparkles}    label="Magic Media"  onClick={() => setMagicModalOpen(true)} />
                <MediaBtn icon={FileUp}      label="Upload File"  onClick={() => fileInputRef.current?.click()} />
              </div>
              <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <div className={`flex gap-3 pt-2 ${step > 1 ? "justify-between" : "justify-end"}`}>
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
              className="px-3 py-2 bg-emerald-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 hover:scale-105 flex items-center gap-2 transition"
            >
              {generating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Sparkles className="w-4 h-4" /> Generate Thumbnails</>
              }
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
        onCancel={() => { setShowCropper(false); setImageSrc([]); setCroppedImages([]); }}
        onPrevious={handlePreviousCrop}
      />

      <SearchMediaModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        selectedImages={selectedImages}
        onSelectImage={(src) => setSelectedImages((p) => p.includes(src) ? p.filter((s) => s !== src) : [...p, src])}
        onApply={handleApplySelected}
        onCancel={handleCancelSelection}
      />

      <LibraryMediaModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        selectedImages={selectedImages}
        onSelectImage={(src) => setSelectedImages((p) => p.includes(src) ? p.filter((s) => s !== src) : [...p, src])}
        onApply={handleApplySelected}
        onCancel={handleCancelSelection}
      />

      <MagicMediaModal
        isOpen={magicModalOpen}
        onClose={() => { setMagicModalOpen(false); setSelectedMedia([]); }}
        activeTab={magicTab}
        onTabChange={setMagicTab}
        selectedMedia={selectedMedia}
        onSelectMedia={handleMagicSelect}
        onApply={handleApplySelected}
        onCancel={handleCancelSelection}
      >
        {renderTabContent()}
      </MagicMediaModal>

      {generating && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10">
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
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

const SectionTitle = ({ children }) => (
  <h3 className="font-semibold text-gray-900 text-base">{children}</h3>
);

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const MediaBtn = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-4 py-2 cursor-pointer rounded-lg text-xs font-semibold transition-all bg-white border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600"
  >
    <Icon className="w-4 h-4" /> {label}
  </button>
);

export default ThumbnailsForm;