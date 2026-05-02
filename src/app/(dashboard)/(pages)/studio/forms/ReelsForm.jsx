"use client";
// forms/ReelsForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Loader2, FileUp, X, CheckCircle2, ChevronRight,
  Sparkles, Images, Scan, Film, Hash, Music,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";

// ── constants ─────────────────────────────────────────────────────────────────

const UNIQUE_SIZES = [
  { value: "1080x1920", label: "9:16 — Reels / TikTok / Shorts / Stories" },
  { value: "1080x1350", label: "4:5 — Portrait Feed" },
  { value: "1080x1080", label: "1:1 — Square" },
];

const PLATFORMS = [
  { value: "instagram_reels",   label: "Instagram Reels" },
  { value: "tiktok",            label: "TikTok" },
  { value: "youtube",    label: "YouTube Shorts" },
  { value: "instagram", label: "Instagram Stories" },
  { value: "facebook_reels",    label: "Facebook Reels" },
  { value: "snapchat",          label: "Snapchat" },
];

const DURATION_OPTIONS = [
  { value: "15", label: "15s", desc: "Stories / quick hook" },
  { value: "30", label: "30s", desc: "Reels / TikTok sweet spot" },
  { value: "60", label: "60s", desc: "Full story arc" },
  { value: "90", label: "90s", desc: "YouTube Shorts max" },
];

const CAMPAIGN_GOALS = [
  "Brand Awareness", "Engagement", "Followers", "Sales", "Website Traffic",
];

const AUDIENCES = [
  { value: "Gen Z",         label: "Gen Z",      desc: "13–26, TikTok-native" },
  { value: "Millennials",   label: "Millennials", desc: "27–42, Instagram-first" },
  { value: "B2C",           label: "B2C",         desc: "End consumers" },
  { value: "B2B",           label: "B2B",         desc: "Professionals & teams" },
  { value: "Inspirational", label: "Creators",    desc: "Entrepreneurs & influencers" },
];

const VIDEO_STYLES = [
  { value: "trending",     label: "Trending" },
  { value: "cinematic",    label: "Cinematic" },
  { value: "raw",          label: "Raw / UGC" },
  { value: "animated",     label: "Animated" },
  { value: "talking_head", label: "Talking Head" },
  { value: "slideshow",    label: "Slideshow" },
];

const HOOKS = [
  { value: "question",   label: "Question hook" },
  { value: "bold_claim", label: "Bold claim" },
  { value: "story",      label: "Story opener" },
  { value: "stat",       label: "Stat / fact" },
  { value: "challenge",  label: "Challenge" },
];

const BRAND_COLORS = [
  "#059669", "#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b",
];

const VIDEO_FORMAT = ["MP4", "MOV", "WEBM"];

const STEPS = [
  { id: 1, label: "Video Details",            icon: Film },
  { id: 2, label: "Format, Goals & Audience", icon: Scan },
  { id: 3, label: "Media & Assets",           icon: Images },
];

// ─────────────────────────────────────────────────────────────────────────────

const ReelsForm = ({
  formData, setFormData, activeBrand, sendUrl, showToast, onResult,
  generateCustomCreative, creative, categoryId,
}) => {
  const [step, setStep]                     = useState(1);
  const [error, setError]                   = useState("");
  const [brandUrl, setBrandUrl]             = useState(activeBrand?.url || activeBrand?.source_url || "");
  const [importingBrand, setImportingBrand] = useState(false);
  const [generating, setGenerating]         = useState(false);

  // ── image/video asset state ───────────────────────────────────────────────
  const [imageSrc, setImageSrc]                 = useState([]);
  const [croppedImages, setCroppedImages]       = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper]           = useState(false);
  const [crop, setCrop]                         = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop]       = useState(null);
  const [imageSrcMeta, setImageSrcMeta]         = useState([]); // tracks original URLs parallel to imageSrc

  const cropperRef   = useRef(null);
  const logoInputRef = useRef(null);

  // ── modal state ───────────────────────────────────────────────────────────
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Sync first cropped media → live preview
  useEffect(() => {
    const first = croppedImages.find(Boolean);
    if (first?.previewUrl) setFormData((p) => ({ ...p, backgroundImage: first.previewUrl }));
  }, [croppedImages]);

  useEffect(() => { setCompletedCrop(null); }, [currentCropIndex]);

  // ── field helper ──────────────────────────────────────────────────────────
  // Keeps brandColor ↔ primaryColor in sync (mirrors ImageAdsForm / PostsForm pattern)
  const field = (key, value) => {
    if (key === "primaryColor" || key === "brandColor")
      value = value.startsWith("#") ? value : `#${value}`;

    setFormData((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "primaryColor" && { brandColor: value }),
      ...(key === "brandColor"   && { primaryColor: value }),
    }));

    setError("");
  };

  // Toggle multi-select (platforms)
  const toggleMulti = (key, val) => {
    const current = formData[key] || [];
    field(key, current.includes(val) ? current.filter((v) => v !== val) : [...current, val]);
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
        // sync both color keys on import
        primaryColor:   d.primary_color || "#059669",
        brandColor:     d.primary_color || "#059669",
        font:           d.font || "Montserrat",
        caption:        p.caption   || `Watch ${d.name}!`,
        hashtags:       p.hashtags?.length ? p.hashtags : ["#Reels", "#Shorts", "#TikTok"],
        logo:           d.logo || "",
        importedImages: d.images?.map((i) => i.url).filter(Boolean) || [],
      }));
      showToast("Brand imported!");
    } catch { setError("Failed to import brand. Check the URL."); }
    finally   { setImportingBrand(false); }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => field("logo", reader.result);
    reader.readAsDataURL(file);
  };

  // ── Apply from MediaPickerModal (mirrors ImageAdsForm exactly) ────────────
  const handleApplyFromPicker = async (images, media) => {
    if (images.length > 0) {
      try {
        const processedFiles = await Promise.all(
          images.map(async (item, idx) => {
            // If it already has a File object (upload tab), use it directly
            if (item.file instanceof File) {
              item.file.previewUrl = item.src;
              item.file.sourceUrl  = null;
              return item.file;
            }
            // Otherwise proxy-fetch (search / library URLs)
            const url      = item.large || item.src;
            const fetchUrl = url.startsWith("http")
              ? `/api/proxy-image?url=${encodeURIComponent(url)}`
              : url;
            const res  = await fetch(fetchUrl);
            const blob = await res.blob();
            const file = new File([blob], `selected-${Date.now()}-${idx}`, { type: blob.type || "image/png" });
            file.previewUrl = URL.createObjectURL(blob);
            file.sourceUrl  = item.large || item.src || null;
            return file;
          })
        );

        const previewUrls = processedFiles.map((f) => f.previewUrl);
        const sourceUrls  = processedFiles.map((f) => f.sourceUrl || null);

        if (!showCropper) {
          setImageSrc(previewUrls);
          setImageSrcMeta(sourceUrls);
          setCroppedImages(Array(previewUrls.length).fill(null));
          setCurrentCropIndex(0);
        } else {
          setImageSrc((prev) => [...prev, ...previewUrls]);
          setImageSrcMeta((prev) => [...prev, ...sourceUrls]);
          setCroppedImages((prev) => [...prev, ...Array(previewUrls.length).fill(null)]);
          setCurrentCropIndex(imageSrc.length);
        }

        setShowCropper(true);
        showToast(`Added ${images.length} image(s) — crop them`);
      } catch (err) {
        console.error("Image loading failed:", err);
        showToast("Some images couldn't be loaded.");
      }
    }

    if (media.length > 0) {
      const videoObjects = media.map((src, i) => ({
        id:         `video-${Date.now()}-${i}`,
        previewUrl: src,
        thumbnail:  src,
        type:       "video",
      }));
      setCroppedImages((prev) => [...prev, ...videoObjects]);
      showToast(`Added ${media.length} media item(s)`);
    }

    setMediaPickerOpen(false);
  };

  // ── Brand image strip handlers (mirrors ImageAdsForm exactly) ─────────────
  const handleBrandImageUse = (imageObjs) => {
    const pseudos = imageObjs.map((imageObj) => ({
      previewUrl: imageObj.src,
      sourceUrl:  imageObj.src,
      name:       imageObj.alt || "brand-image",
      type:       "image/jpeg",
    }));
    setCroppedImages((prev) => [...prev, ...pseudos]);
    showToast(`${pseudos.length} image${pseudos.length > 1 ? "s" : ""} added ✓`);
  };

  const handleBrandImageCrop = async (imageObjs) => {
    for (const imageObj of imageObjs) {
      const originalUrl = imageObj.src;
      let cropperUrl    = originalUrl;
      try {
        const res  = await fetch(`/api/proxy-image?url=${encodeURIComponent(originalUrl)}`);
        const blob = await res.blob();
        cropperUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.warn("Proxy failed, falling back to original URL", err);
      }
      setImageSrc((prev)      => [...prev, cropperUrl]);
      setImageSrcMeta((prev)  => [...prev, originalUrl]);
      setCroppedImages((prev) => [...prev, null]);
    }
    if (!showCropper) setCurrentCropIndex(0);
    setShowCropper(true);
  };

  // ── Save crop ─────────────────────────────────────────────────────────────
  const saveCroppedImage = useCallback(async () => {
    if (!completedCrop || !cropperRef.current) return;
    const image = cropperRef.current.cropper?.getImage?.();
    if (!image) return;

    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d");
    const scaleX = image.naturalWidth  / image.width;
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
    const file = new File([blob], `cropped-${currentCropIndex}.png`, { type: "image/png" });
    file.previewUrl = URL.createObjectURL(blob);
    file.sourceUrl  = imageSrcMeta[currentCropIndex] || null;

    setCroppedImages((prev) => {
      const updated = [...prev];
      updated[currentCropIndex] = file;
      return updated;
    });

    if (currentCropIndex < imageSrc.length - 1) {
      setCurrentCropIndex((prev) => prev + 1);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);
    } else {
      setShowCropper(false);
    }
  }, [completedCrop, currentCropIndex, imageSrc.length, imageSrcMeta]);

  // ── Skip crop ─────────────────────────────────────────────────────────────
  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url).then((r) => r.blob()).then((blob) => {
      const file = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
      file.previewUrl = url;
      file.sourceUrl  = imageSrcMeta[currentCropIndex] || null;
      setCroppedImages((prev) => { const u = [...prev]; u[currentCropIndex] = file; return u; });
      if (currentCropIndex < imageSrc.length - 1) {
        setCurrentCropIndex((prev) => prev + 1);
        setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      } else {
        setShowCropper(false);
      }
    });
  };

  // ── Remove media ──────────────────────────────────────────────────────────
  const removeCroppedImage = (idx) => {
    const next  = croppedImages.filter((_, i) => i !== idx);
    const first = next.find(Boolean);
    setCroppedImages(next);
    setFormData((p) => ({ ...p, backgroundImage: first?.previewUrl || null }));
    if (idx <= currentCropIndex && currentCropIndex > 0) setCurrentCropIndex((prev) => prev - 1);
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
  const handleContinue = () => {
    if (step === 1 && !formData.brandName) return setError("Brand name is required.");
    if (step === 2 && (!formData.size || !formData.campaignGoal || !formData.audience))
      return setError("Please complete all fields before continuing.");
    if (step === 3 && croppedImages.filter(Boolean).length === 0)
      return setError("Add at least one media asset.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate — mirrors ImageAdsForm.handleGenerate exactly ────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    const validImages = croppedImages.filter(Boolean);

    const payload = {
      creativeType: creative?.id,
      categoryType: categoryId,
      brandName:    formData.brandName    || null,
      description:  formData.description  || null,
      brandColor:   formData.brandColor   ?? formData.primaryColor ?? null,
      logo:         formData.logo         || null,
      videoStyle:   formData.videoStyle   || null,
      hook:         formData.hook         || null,
      font:         formData.font         || null,
      sourceUrl:    brandUrl              || null,
      size:         formData.size         || null,
      duration:     formData.duration     || null,
      campaignGoal: formData.campaignGoal || null,
      audience:     formData.audience     || null,
      videoFormat:   formData.videoFormat   || null,
      caption:      formData.caption      || null,
      hashtags:     formData.hashtags     || [],
      platforms:    formData.platforms    || [],
      musicVibe:    formData.musicVibe    || null,
      subtitles:    formData.subtitles    || null,
      images: validImages
        .map((f) => f?.sourceUrl || f?.previewUrl)
        .filter(Boolean),
      generatedAt: new Date().toISOString(),
    };

    const result = await generateCustomCreative(payload);

    if (!result.ok) {
      setError(result.message || "Generation failed. Please try again.");
      setGenerating(false);
      return;
    }

    const data = result.data;

    // ── canvas-based design response
    if (data?.type === "design" && Array.isArray(data?.variations) && data.variations.length) {
      onResult({
        type:       "design",
        variations: data.variations,
        reply:      data.reply || "",
        meta:       data.meta  || {},
        payload,
        raw: data,
      });
    } else {
      // ── fallback: asset response
      onResult({
        assets: data?.assets || [],
        payload,
        raw: data,
      });
    }

    setGenerating(false);
  };

  // Reels default to 9:16; respect selected size if set
  const cropAspectRatio = (() => {
    if (!formData.size) return 9 / 16;
    const [w, h] = formData.size.split("x").map(Number);
    return w && h ? w / h : 9 / 16;
  })();

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Step indicator ───────────────────────────────────────────────── */}
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
                  <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    step > s.id    ? "border-emerald-600 bg-emerald-600 text-white"
                    : step === s.id ? "border-emerald-600 text-emerald-600 bg-white"
                    : "border-gray-200 text-gray-300"
                  }`}>
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

      {/* ── Step content ─────────────────────────────────────────────────── */}
      <div className="bg-white px-2 rounded-lg py-2 flex flex-col gap-6">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 — Video Details ═══════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Video Details</SectionTitle>

            {/* URL import */}
            <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/40">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Import from URL</span>
                <span className="text-xs text-gray-400 ml-auto">Auto-fills brand info</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url" value={brandUrl}
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

            {/* Brand name + Project name */}
            <div className="">
              <Field label="Brand Name / Project Name" required>
                <input
                  type="text" value={formData.brandName || ""}
                  onChange={(e) => field("brandName", e.target.value)}
                  placeholder="Your Brand"
                  className={inputCls}
                />
              </Field>
              {/* <Field label="Project / Series Name">
                <input
                  type="text" value={formData.projectName || ""}
                  onChange={(e) => field("projectName", e.target.value)}
                  placeholder="e.g. Summer Drop Series"
                  className={inputCls}
                />
              </Field> */}
            </div>

            {/* Script / description */}
            <Field label="Video Script / Description">
              <textarea
                value={formData.description || ""}
                onChange={(e) => field("description", e.target.value)}
                placeholder="Describe your reel or paste a script. What story do you want to tell? What should happen scene by scene?"
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </Field>

            {/* Hook type */}
            {/* <Field label="Opening Hook">
              <div className="flex flex-wrap gap-2 py-1">
                {HOOKS.map((h) => (
                  <button
                    key={h.value}
                    onClick={() => field("hook", h.value)}
                    className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                      formData.hook === h.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </Field> */}

            {/* Video style */}
            <Field label="Video Style">
              <div className="flex flex-wrap gap-2 py-1">
                {VIDEO_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => field("videoStyle", s.value)}
                    className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                      formData.videoStyle === s.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Caption */}
            {/* <Field label="Caption">
              <div className="relative">
                <textarea
                  value={formData.caption || ""}
                  onChange={(e) => field("caption", e.target.value)}
                  placeholder="Write a caption that stops the scroll…"
                  rows={2}
                  maxLength={2200}
                  className={`${inputCls} resize-none pr-16`}
                />
                <span className="absolute bottom-2.5 right-3 text-xs text-gray-400">
                  {2200 - (formData.caption?.length || 0)}
                </span>
              </div>
            </Field> */}

            {/* Hashtags */}
            {/* <Field label="Hashtags">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={(formData.hashtags || []).join(" ")}
                  onChange={(e) => field("hashtags", e.target.value.split(" ").filter(Boolean))}
                  placeholder="#Reels #Shorts #TikTok #Viral"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field> */}

            {/* Target platforms */}
            <Field label="Target Platforms">
              <div className="flex flex-wrap gap-2 py-1">
                {PLATFORMS.map((p) => {
                  const active = (formData.platforms || []).includes(p.value);
                  return (
                    <button
                      key={p.value}
                      onClick={() => toggleMulti("platforms", p.value)}
                      className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                        active
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Brand color + Logo */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand Color">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap max-w-44">
                    {BRAND_COLORS.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => field("primaryColor", hex)}
                        className={`w-7 h-7 rounded-md cursor-pointer border-2 transition-transform hover:scale-110 ${
                          formData.primaryColor === hex ? "border-gray-800 scale-110" : "border-transparent"
                        }`}
                        style={{ background: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <label
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 transition hover:scale-105"
                      style={{ background: formData.primaryColor || "#059669" }}
                    >
                      <input
                        type="color"
                        value={formData.primaryColor || "#059669"}
                        onChange={(e) => field("primaryColor", e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={formData.primaryColor || "#059669"}
                      onChange={(e) =>
                        /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && field("primaryColor", e.target.value)
                      }
                      className={`${inputCls} w-24! flex-none px-2 text-sm font-mono`}
                      maxLength={7}
                    />
                  </div>
                </div>
              </Field>

              <Field label="Logo / Watermark">
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

          </div>
        )}

        {/* ═══ STEP 2 — Format, Goals & Audience ═══════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle>Format, Goals & Audience</SectionTitle>

            <Field label="Video Duration">
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => field("duration", d.value)}
                    className={`text-left px-2 py-2.5 cursor-pointer rounded-lg border-2 transition-all ${
                      formData.duration === d.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-bold">{d.label}</p>
                    <p className={`text-[10px] mt-0.5 ${formData.duration === d.value ? "text-emerald-500" : "text-gray-400"}`}>{d.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Aspect Ratio / Size">
              <div className="grid grid-cols-3 gap-2">
                {UNIQUE_SIZES.map((s) => (
                  <button
                    key={s.value + s.label}
                    onClick={() => field("size", s.value)}
                    className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${
                      formData.size === s.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-xs font-semibold leading-snug">{s.label}</p>
                    <p className={`text-[10px] mt-0.5 font-mono ${formData.size === s.value ? "text-emerald-500" : "text-gray-400"}`}>{s.value}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Campaign Goal">
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => field("campaignGoal", g)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${
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

            <Field label="Audience">
              <div className="grid grid-cols-3 gap-2">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => field("audience", a.value)}
                    className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${
                      formData.audience === a.value ? "border-emerald-600 bg-emerald-50" : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${formData.audience === a.value ? "text-emerald-700" : "text-gray-700"}`}>{a.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Export Format">
              <div className="flex gap-2">
                {VIDEO_FORMAT.map((f) => (
                  <button
                    key={f}
                    onClick={() => field("videoFormat", f)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${
                      formData.videoFormat === f
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {f}{f === "MP4" && " ✓"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ═══ STEP 3 — Media & Assets ══════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <SectionTitle>Media & Assets</SectionTitle>

            <p className="text-xs text-gray-400 -mt-2">
              Add images or video clips to compose your reel. Videos are preferred — images will be used as slides.
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
                    const url     = item?.previewUrl;
                    const isVideo = item?.type?.includes?.("video") || item?.videoSrc;
                    return (
                      <div key={index} className="relative group">
                        {isVideo ? (
                          <video
                            src={item.videoSrc || url}
                            poster={item.thumbnail}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                            muted loop playsInline preload="metadata"
                            onMouseEnter={(e) => e.target.play().catch(() => {})}
                            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                          />
                        ) : url ? (
                          <img
                            src={url}
                            alt={`Asset ${index + 1}`}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 border-2 border-dashed rounded-xl flex items-center justify-center">
                            <span className="text-xs text-gray-400">No media</span>
                          </div>
                        )}
                        {isVideo && (
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            VIDEO
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeCroppedImage(index); }}
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
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
              onClick={() => setMediaPickerOpen(true)}
            >
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                <Film className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Upload Clips or Images</p>
                <p className="text-xs text-gray-400 mt-1">Videos recommended · Images will become slides · Max 5 assets</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setMediaPickerOpen(true); }}
                className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition cursor-pointer flex items-center gap-2"
              >
                <Images className="w-4 h-4" /> Choose Media
              </button>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
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
              disabled={generating}
              className="px-3 py-2 bg-emerald-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 hover:scale-105 flex items-center gap-2 transition disabled:opacity-60"
            >
              {generating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Sparkles className="w-4 h-4" /> Generate Reels</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

      <ImageCropperModal
        isOpen={showCropper}
        ref={cropperRef}
        imageSrc={imageSrc[currentCropIndex]}
        currentIndex={currentCropIndex}
        totalImages={imageSrc.length}
        crop={crop}
        onCropChange={setCrop}
        onCropComplete={setCompletedCrop}
        aspectRatio={cropAspectRatio}
        onSave={saveCroppedImage}
        onSkip={handleSkipCrop}
        onCancel={() => {
          setShowCropper(false);
          setImageSrc([]);
          setImageSrcMeta([]);
          setCroppedImages([]);
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
      />

      {generating && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10">
            <FloatingAnimation showProgressBar>
              <FloatingElements.VideoFile />
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

export default ReelsForm;