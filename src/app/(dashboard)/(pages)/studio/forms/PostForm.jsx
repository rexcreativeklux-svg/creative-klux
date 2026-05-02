"use client";
// forms/PostsForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Loader2, FileUp, X, CheckCircle2, ChevronRight,
  Sparkles, Images, Scan, Type, Hash,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";

// ── constants ─────────────────────────────────────────────────────────────────
const SIZE_OPTIONS = [
  { value: "1200x627",  label: "LinkedIn Horizontal" },
  { value: "627x627",   label: "LinkedIn Square" },
  { value: "1080x1080", label: "Instagram Square" },
  { value: "1080x1350", label: "Instagram Portrait" },
  { value: "1080x1920", label: "Stories / Reels" },
  { value: "1200x630",  label: "Facebook Feed" },
  { value: "1600x900",  label: "Twitter / X Post" },
  { value: "1000x1500", label: "Pinterest Pin" },
];

const CAMPAIGN_GOALS = [
  "Brand Awareness", "Engagement", "Sales", "Lead Generation", "Website Traffic",
];

const AUDIENCES = [
  { value: "B2B",           label: "B2B",           desc: "Business owners, startups, agencies" },
  { value: "B2C",           label: "B2C",           desc: "End consumers, everyday users" },
  { value: "Casual",        label: "Casual",        desc: "Broad social media audience" },
  { value: "Inspirational", label: "Inspirational", desc: "Entrepreneurs & creators" },
  { value: "Sales",         label: "Sales",         desc: "Hot leads, ad audiences" },
];

const FILE_FORMATS = ["PNG", "JPEG", "WEBP", "AVIF"];

const TONES = [
  { value: "professional",  label: "Professional" },
  { value: "casual",        label: "Casual" },
  { value: "humorous",      label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
  { value: "urgent",        label: "Urgent" },
  { value: "educational",   label: "Educational" },
];

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "facebook",  label: "Facebook" },
  { value: "twitter",   label: "Twitter / X" },
  { value: "tiktok",    label: "TikTok" },
  { value: "pinterest", label: "Pinterest" },
];

const BRAND_COLORS = [
  "#2563eb", "#0ea5e9", "#8b5cf6", "#ec4899", "#ef4444",
];

const STEPS = [
  { id: 1, label: "Post Details",           icon: Type },
  { id: 2, label: "Size, Goals & Audience", icon: Scan },
  { id: 3, label: "Background Image",       icon: Images },
];

// ─────────────────────────────────────────────────────────────────────────────

const PostsForm = ({
  formData, setFormData, activeBrand, sendUrl, showToast, onResult,
  generateCustomCreative, creative, categoryId,
}) => {
  const [step, setStep]                     = useState(1);
  const [error, setError]                   = useState("");
  const [brandUrl, setBrandUrl]             = useState(activeBrand?.url || activeBrand?.source_url || "");
  const [importingBrand, setImportingBrand] = useState(false);
  const [generating, setGenerating]         = useState(false);

  // ── image state ──────────────────────────────────────────────────────────
  const [imageSrc, setImageSrc]                 = useState([]);
  const [croppedImages, setCroppedImages]       = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper]           = useState(false);
  const [crop, setCrop]                         = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop]       = useState(null);
  const [imageSrcMeta, setImageSrcMeta]         = useState([]);

  const cropperRef   = useRef(null);
  const logoInputRef = useRef(null);

  // ── modal state ───────────────────────────────────────────────────────────
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  useEffect(() => { setCompletedCrop(null); }, [currentCropIndex]);

  // Sync first cropped image → live preview
  useEffect(() => {
    const first = croppedImages.find(Boolean);
    if (first?.previewUrl) setFormData((p) => ({ ...p, backgroundImage: first.previewUrl }));
  }, [croppedImages]);

  // ── field helper ──────────────────────────────────────────────────────────
  // Mirrors ImageAdsForm: color keys are kept bidirectionally in sync so that
  // brandColor and primaryColor always reflect the same value regardless of
  // which key the parent or payload consumer reads.
  const field = (key, value) => {
    if (key === "primaryColor" || key === "secondaryColor" || key === "brandColor")
      value = value.startsWith("#") ? value : `#${value}`;

    setFormData((prev) => ({
      ...prev,
      [key]: value,

      // ✅ keep brandColor ↔ primaryColor in sync (mirrors ImageAdsForm pattern)
      ...(key === "primaryColor" && { brandColor: value }),
      ...(key === "brandColor"   && { primaryColor: value }),
    }));

    setError("");
  };

  const togglePlatform = (val) => {
    const current = formData.platforms || [];
    field("platforms", current.includes(val) ? current.filter((v) => v !== val) : [...current, val]);
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
        primaryColor:   d.primary_color   || "#2563eb",
        brandColor:     d.primary_color   || "#2563eb",
        secondaryColor: d.secondary_color || "#0ea5e9",
        font:           d.font || "Montserrat",
        caption:        p.caption || `Discover ${d.name}!`,
        hashtags:       p.hashtags?.length ? p.hashtags : ["#SocialMedia", "#Brand"],
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

  // ── Apply from MediaPickerModal ───────────────────────────────────────────
  const handleApplyFromPicker = async (images, media) => {
    if (images.length > 0) {
      try {
        const processedFiles = await Promise.all(
          images.map(async (item, idx) => {
            if (item.file instanceof File) {
              item.file.previewUrl = item.src;
              item.file.sourceUrl  = null;
              return item.file;
            }
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

  // ── Brand image strip handlers ────────────────────────────────────────────
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

  // ── Remove cropped image ──────────────────────────────────────────────────
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
    if (step === 2 && (!formData.size || !formData.campaignGoal || !formData.audience || !formData.fileFormat))
      return setError("Please complete all fields before continuing.");
    if (step === 3 && croppedImages.filter(Boolean).length === 0)
      return setError("Select at least one background image.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate — mirrors ImageAdsForm.handleGenerate exactly ───────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    const validImages = croppedImages.filter(Boolean);

    const payload = {
      creativeType: creative?.id,
      categoryType: categoryId,
      brandName:    formData.brandName    || null,
      description:  formData.description  || null,
      // brandColor and primaryColor are kept in sync by field(), so either works;
      // fall back to primaryColor for backward compat with older formData shapes.
      brandColor:   formData.brandColor   ?? formData.primaryColor ?? null,
      logo:         formData.logo         || null,
      visualStyle:  formData.visualStyle  || null,
      font:         formData.font         || null,
      sourceUrl:    brandUrl              || null,
      size:         formData.size         || null,
      campaignGoal: formData.campaignGoal || null,
      audience:     formData.audience     || null,
      fileFormat:   formData.fileFormat   || null,
      caption:      formData.caption      || null,
      hashtags:     formData.hashtags     || [],
      tone:         formData.tone         || null,
      platforms:    formData.platforms    || [],
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
      // ── fallback: image/video asset response
      onResult({
        assets: data?.assets || [],
        payload,
        raw: data,
      });
    }

    setGenerating(false);
  };

  // ── Aspect ratio for cropper based on selected size ───────────────────────
  const cropAspectRatio = (() => {
    if (!formData.size) return undefined;
    const [w, h] = formData.size.split("x").map(Number);
    return w && h ? w / h : undefined;
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

        {/* ═══ STEP 1 — Post Details ════════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Post Details</SectionTitle>

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

            <div className="">
              <Field label="Brand Name / Project Name" required>
                <input
                  type="text" value={formData.brandName}
                  onChange={(e) => field("brandName", e.target.value)}
                  placeholder="Your Brand"
                  className={inputCls}
                />
              </Field>
              {/* <Field label="Project Name">
                <input
                  type="text" value={formData.projectName || ""}
                  onChange={(e) => field("projectName", e.target.value)}
                  placeholder="Campaign or project name"
                  className={inputCls}
                />
              </Field> */}
            </div>

            <Field label="Post Description">
              <textarea
                value={formData.description}
                onChange={(e) => field("description", e.target.value)}
                placeholder="What is this post about? Describe the message, product, or story you want to tell…"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </Field>

            {/* <Field label="Caption">
              <div className="relative">
                <textarea
                  value={formData.caption || ""}
                  onChange={(e) => field("caption", e.target.value)}
                  placeholder="Write your post caption here…"
                  rows={2}
                  maxLength={280}
                  className={`${inputCls} resize-none pr-12`}
                />
                <span className="absolute bottom-2.5 right-3 text-xs text-gray-400">
                  {280 - (formData.caption?.length || 0)}
                </span>
              </div>
            </Field> */}

            {/* <Field label="Hashtags">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={(formData.hashtags || []).join(" ")}
                  onChange={(e) => field("hashtags", e.target.value.split(" ").filter(Boolean))}
                  placeholder="#SocialMedia #Brand #Marketing"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field> */}

            <Field label="Post Tone">
              <div className="flex flex-wrap gap-2 py-1">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => field("tone", t.value)}
                    className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                      formData.tone === t.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Target Platform">
              <div className="flex flex-wrap gap-2 py-1">
                {PLATFORMS.map((p) => {
                  const active = (formData.platforms || []).includes(p.value);
                  return (
                    <button
                      key={p.value}
                      onClick={() => togglePlatform(p.value)}
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
                      style={{ background: formData.primaryColor || "#2563eb" }}
                    >
                      <input
                        type="color"
                        value={formData.primaryColor || "#2563eb"}
                        onChange={(e) => field("primaryColor", e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={formData.primaryColor || "#2563eb"}
                      onChange={(e) =>
                        /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && field("primaryColor", e.target.value)
                      }
                      className={`${inputCls} w-24! flex-none px-2 text-sm font-mono`}
                      maxLength={7}
                    />
                  </div>
                </div>
              </Field>

              <Field label="Logo">
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

        {/* ═══ STEP 2 — Size, Goals & Audience ═════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle>Size, Goals & Audience</SectionTitle>

            <Field label="Post Size">
              <div className="grid grid-cols-4 gap-2">
                {SIZE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => field("size", s.value)}
                    className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${
                      formData.size === s.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-xs font-semibold">{s.label}</p>
                    <p className={`text-[10px] mt-0.5 ${formData.size === s.value ? "text-emerald-500" : "text-gray-400"}`}>{s.value}</p>
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

            <Field label="File Format">
              <div className="flex gap-2">
                {FILE_FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => field("fileFormat", f)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${
                      formData.fileFormat === f
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {f}{f === "PNG" && " ✓"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ═══ STEP 3 — Background Image ════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <SectionTitle>Select Images</SectionTitle>

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
                    const isVideo = item?.type?.includes?.("video");
                    return (
                      <div key={index} className="relative group">
                        {isVideo ? (
                          <video
                            src={url} poster={item.thumbnail}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                            muted loop playsInline preload="metadata"
                            onMouseEnter={(e) => e.target.play().catch(() => {})}
                            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                          />
                        ) : url ? (
                          <img
                            src={url}
                            alt={`Selected ${index + 1}`}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 border-2 border-dashed rounded-xl flex items-center justify-center">
                            <span className="text-xs text-gray-400">No media</span>
                          </div>
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
                <FileUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Upload or Search More Images</p>
                <p className="text-xs text-gray-400 mt-1">Search web, magic studio, or upload from device</p>
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
                : <><Sparkles className="w-4 h-4" /> Generate Posts</>
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

export default PostsForm;