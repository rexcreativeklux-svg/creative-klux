"use client";
// forms/PosterForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Image, Loader2, X, ChevronRight, FileUp, Wand2, Target,
  LayoutTemplate, CheckCircle2, Images,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";

// ── constants ─────────────────────────────────────────────────────────────────

const CAMPAIGN_GOAL_OPTIONS = [
  { value: "Brand Awareness", label: "Brand Awareness", emoji: "📣" },
  { value: "Engagement",      label: "Engagement",      emoji: "💬" },
  { value: "Sales",           label: "Sales",           emoji: "🛒" },
  { value: "Lead Generation", label: "Lead Generation", emoji: "🎯" },
  { value: "Website Traffic", label: "Website Traffic", emoji: "🌐" },
];

const AUDIENCE_OPTIONS = [
  { value: "B2B",           label: "B2B",            desc: "Business owners, startups, agencies" },
  { value: "B2C",           label: "B2C",            desc: "End consumers, everyday users" },
  { value: "Casual",        label: "Casual",         desc: "Broad social media audience" },
  { value: "Inspirational", label: "Inspirational",  desc: "Entrepreneurs, creators, startups" },
  { value: "Sales",         label: "Direct / Sales", desc: "Hot leads, ad audiences" },
];

const FILE_FORMAT_OPTIONS = [
  { value: "PNG",  label: "PNG",  desc: "Transparent BG" },
  { value: "PDF",  label: "PDF",  desc: "Print-ready" },
  { value: "JPEG", label: "JPEG", desc: "Compressed" },
];

const SIZE_OPTIONS = [
  { value: "816x1056",  label: "Digital Letter", desc: "8.5×11 in · 96 DPI" },
  { value: "794x1123",  label: "Digital A3",     desc: "297×420 mm · 72 DPI" },
  { value: "5400x7200", label: "Print Poster",   desc: "18×24 in · 300 DPI" },
  { value: "3508x4961", label: "Print A3",       desc: "297×420 mm · 300 DPI" },
  { value: "576x864",   label: "Digital Tabloid",desc: "6×9 in · 96 DPI" },
];

const ORIENTATION_OPTIONS = [
  { value: "Portrait",  label: "Portrait",  w: 30, h: 44 },
  { value: "Landscape", label: "Landscape", w: 44, h: 30 },
];

const INSPIRE_PROMPTS = [
  "A vibrant concert poster for a summer music festival with bold neon typography",
  "A minimalist poster for a modern tech conference with clean geometric shapes",
  "An elegant art exhibition poster featuring abstract watercolor elements",
  "A bold sports event poster with dynamic motion blur and strong colors",
  "A professional corporate seminar poster with a premium and refined feel",
  "A retro-style film festival poster inspired by vintage movie art",
];

const BRAND_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#db2777", "#ef4444",
  "#f59e0b", "#0ea5e9", "#111827",
];

const STEPS = [
  { id: 1, label: "Brand Details",  icon: Image },
  { id: 2, label: "Goals & Format", icon: Target },
  { id: 3, label: "Images",         icon: LayoutTemplate },
];

// ── theme: violet ─────────────────────────────────────────────────────────────
const T = {
  border:       "border-violet-600",
  bg:           "bg-violet-600",
  bgHover:      "hover:bg-violet-700",
  bgLight:      "bg-violet-50",
  textDark:     "text-violet-700",
  importBg:     "bg-violet-50/40",
  importBorder: "border-violet-100",
  stepActive:   "border-violet-600 bg-violet-600 text-white",
  stepCurrent:  "border-violet-600 text-violet-600 bg-surface",
  connector:    "bg-violet-600",
  pill:         "border-violet-600 bg-violet-50 text-violet-700",
  accent:       "accent-violet-600",
};

// ─────────────────────────────────────────────────────────────────────────────

const PosterForm = ({
  formData,
  setFormData,
  activeBrand,
  sendUrl,
  showToast,
  onResult,
  generateCustomCreative,
  creative,
  categoryId,
}) => {
  const [step,       setStep]      = useState(1);
  const [error,      setError]     = useState("");
  const [generating, setGenerating]= useState(false);

  // Brand details
  const [brandName,      setBrandName]      = useState(activeBrand?.name || "");
  const [projectName,    setProjectName]    = useState(activeBrand?.name || "");
  const [description,    setDescription]    = useState(activeBrand?.description || "");
  const [brandColor,     setBrandColor]     = useState(activeBrand?.primary_color || "#7c3aed");
  const [font,           setFont]           = useState(activeBrand?.font || "Inter");
  const [logo,           setLogo]           = useState(activeBrand?.logo || null);
  const [caption,        setCaption]        = useState(`Check out ${activeBrand?.name || "our brand"}!`);
  const [hashtags,       setHashtags]       = useState("#Poster #Design #Brand");
  const [brandUrl,       setBrandUrl]       = useState(activeBrand?.url || activeBrand?.source_url || "");
  const [importingBrand, setImportingBrand] = useState(false);

  // Goals & format — with defaults
  const [campaignGoal, setCampaignGoal] = useState("Brand Awareness");
  const [audience,     setAudience]     = useState("B2C");
  const [fileFormat,   setFileFormat]   = useState("PNG");
  const [size,         setSize]         = useState("816x1056");
  const [orientation,  setOrientation]  = useState("Portrait");

  // ── image / crop state ────────────────────────────────────────────────────
  const [imageSrc,         setImageSrc]         = useState([]);
  const [croppedImages,    setCroppedImages]    = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper,      setShowCropper]      = useState(false);
  const [crop,             setCrop]             = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop,    setCompletedCrop]    = useState(null);
  const [imageSrcMeta,     setImageSrcMeta]     = useState([]);

  const cropperRef   = useRef(null);
  const logoInputRef = useRef(null);

  // ── media picker modal ────────────────────────────────────────────────────
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  useEffect(() => { setCompletedCrop(null); }, [currentCropIndex]);

  // Sync first cropped image → live preview
  useEffect(() => {
    const first = croppedImages.find(Boolean);
    if (first?.previewUrl) setFormData?.((p) => ({ ...p, backgroundImage: first.previewUrl }));
  }, [croppedImages]);

  // ── URL import ────────────────────────────────────────────────────────────
  const handleImportBrand = async () => {
    if (!brandUrl.trim()) return setError("Please enter a valid brand URL.");
    setImportingBrand(true);
    try {
      const r = await sendUrl(brandUrl);
      if (!r?.ok) throw new Error(r?.message || "Import failed");
      const d = r.data?.data || r.data || {};
      setBrandName(d.name           || "");
      setDescription(d.description  || "");
      setBrandColor(d.primary_color || "#7c3aed");
      setFont(d.font                || "Inter");
      setLogo(d.logo                || null);
      setFormData?.((p) => ({
        ...p,
        importedImages: d.images?.map((i) => i.url).filter(Boolean) || [],
      }));
      showToast("Brand imported!");
    } catch { setError("Failed to import brand. Check the URL."); }
    finally { setImportingBrand(false); }
  };

  // ── Inspire ───────────────────────────────────────────────────────────────
  const handleInspire = () => {
    setDescription(INSPIRE_PROMPTS[Math.floor(Math.random() * INSPIRE_PROMPTS.length)]);
    setError("");
  };

  // ── Logo upload ───────────────────────────────────────────────────────────
  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  }, []);

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
    file.sourceUrl  = imageSrcMeta[currentCropIndex] || null;

    setCroppedImages((prev) => { const u = [...prev]; u[currentCropIndex] = file; return u; });

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

  // ── Remove a cropped image ────────────────────────────────────────────────
  const removeCroppedImage = (idx) => {
    const next  = croppedImages.filter((_, i) => i !== idx);
    const first = next.find(Boolean);
    setCroppedImages(next);
    setFormData?.((p) => ({ ...p, backgroundImage: first?.previewUrl || null }));
    if (idx <= currentCropIndex && currentCropIndex > 0) setCurrentCropIndex((prev) => prev - 1);
  };

  const handlePreviousCrop = () => {
    if (currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
      setCompletedCrop(null);
    }
  };

  // ── Unified apply handler from MediaPickerModal ───────────────────────────
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
          setImageSrc((prev)      => [...prev, ...previewUrls]);
          setImageSrcMeta((prev)  => [...prev, ...sourceUrls]);
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
        id: `video-${Date.now()}-${i}`, previewUrl: src, thumbnail: src, type: "video",
      }));
      setCroppedImages((prev) => [...prev, ...videoObjects]);
      showToast(`Added ${media.length} media item(s)`);
    }

    setMediaPickerOpen(false);
  };

  // ── BrandImagesStrip handlers ─────────────────────────────────────────────
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
      let cropperUrl = originalUrl;
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

  // ── Step nav ──────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !brandName.trim())    return setError("Please enter a brand name.");
    if (step === 1 && !description.trim())  return setError("Please enter a poster description.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!brandName.trim() || !description.trim()) return setError("Brand name and description are required.");
    setError("");
    setGenerating(true);

    const validImages = croppedImages.filter(Boolean);

    const payload = {
      creativeType:  creative?.id,
      categoryType:  categoryId,
      brandName:     brandName    || null,
      projectName:   projectName  || null,
      description:   description  || null,
      brandColor:    brandColor   || null,
      primaryColor:  brandColor   || null,
      font:          font         || null,
      logo:          logo         || null,
      caption:       caption      || null,
      hashtags:      hashtags     || null,
      campaignGoal:  campaignGoal || null,
      audience:      audience     || null,
      fileFormat:    fileFormat   || null,
      size:          size         || null,
      orientation:   orientation  || null,
      count:         4,
      sourceUrl:     brandUrl     || null,
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

    if (data?.type === "design" && Array.isArray(data?.variations) && data.variations.length) {
      onResult({
        type: "design",
        variations: data.variations,
        reply:  data.reply  || "",
        meta:   data.meta   || {},
        payload,
        raw: data,
      });
    } else {
      onResult({
        assets:  data?.assets || [],
        payload,
        raw: data,
      });
    }

    setGenerating(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Step indicator ───────────────────────────────────────────────── */}
      <div className="px-2 py-2">
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
                    step > s.id     ? T.stepActive
                    : step === s.id ? T.stepCurrent
                    : "border-gray-200 text-gray-300"
                  }`}>
                    {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`hidden sm:block text-xs font-medium truncate ${step >= s.id ? "text-gray-700" : "text-gray-300"}`}>
                    {s.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full transition-all ${step > s.id ? T.connector : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-lg p-2 flex flex-col gap-5">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 — Brand Details ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Brand Details</SectionTitle>

            {/* URL import */}
            <div className={`border ${T.importBorder} rounded-xl p-4 ${T.importBg}`}>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-violet-600" />
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
                  className={`px-5 py-1.5 ${T.bg} cursor-pointer text-white text-sm font-medium rounded-lg ${T.bgHover} disabled:opacity-50 flex items-center gap-2 shrink-0`}
                >
                  {importingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                </button>
              </div>
            </div>

            {/* Brand Name */}
            <Field label="Brand / Project Name" required>
              <input
                type="text"
                value={brandName}
                onChange={(e) => { setBrandName(e.target.value); setError(""); }}
                placeholder="e.g. Acme Corp"
                className={inputCls}
              />
            </Field>

            {/* Description */}
            <Field label="Poster Description" required>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setError(""); }}
                  placeholder="Describe your poster… event name, headline message, mood, key details."
                  rows={4}
                  maxLength={500}
                  className={`${inputCls} placeholder:text-xs placeholder:text-gray-400 resize-none`}
                />
                <button
                  onClick={handleInspire}
                  className="absolute bottom-3 left-3 text-xs font-semibold bg-surface border border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
                >
                  ✨ Inspire Me
                </button>
                <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">{description.length}/500</span>
              </div>
            </Field>

            {/* Brand Color + Logo */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand Color">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {BRAND_COLORS.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => setBrandColor(hex)}
                        className={`w-6 h-6 rounded-md cursor-pointer border-2 transition-transform hover:scale-110 ${brandColor === hex ? "border-gray-800 scale-110" : "border-transparent"}`}
                        style={{ background: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <label
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 transition hover:scale-105"
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
                      type="text"
                      value={brandColor}
                      onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setBrandColor(e.target.value)}
                      className={`${inputCls} w-[5.5rem]! flex-none px-2 text-sm font-mono`}
                      maxLength={7}
                    />
                  </div>
                </div>
              </Field>

              <Field label="Logo">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 px-3 py-2.5 border cursor-pointer border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-500 hover:text-violet-600 flex items-center gap-2 transition"
                  >
                    <FileUp className="w-4 h-4" /> {logo ? "Replace" : "Upload"}
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
                  {logo && (
                    <div className="relative group w-10 h-10 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                      <img src={logo} alt="logo" className="w-full h-full object-contain" />
                      <button
                        onClick={() => setLogo(null)}
                        className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 — Goals & Format ═════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Goals &amp; Format</SectionTitle>

            {/* Campaign Goal */}
            <Field label="Campaign Goal">
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_GOAL_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setCampaignGoal(g.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-semibold transition-all ${
                      campaignGoal === g.value ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span>{g.emoji}</span>
                    {g.label}
                    {campaignGoal === g.value && (
                      <div className="w-3.5 h-3.5 bg-violet-600 rounded-full flex items-center justify-center ml-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Field>

            {/* Audience */}
            <Field label="Target Audience">
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setAudience(a.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      audience === a.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${audience === a.value ? T.textDark : "text-gray-700"}`}>{a.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* File Format */}
            <Field label="Export Format">
              <div className="flex flex-wrap gap-2">
                {FILE_FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFileFormat(f.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      fileFormat === f.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${fileFormat === f.value ? T.textDark : "text-gray-700"}`}>{f.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Poster Size */}
            <Field label="Poster Size">
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSize(s.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      size === s.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${size === s.value ? T.textDark : "text-gray-700"}`}>{s.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Orientation */}
            <Field label="Orientation">
              <div className="grid grid-cols-2 gap-2">
                {ORIENTATION_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setOrientation(o.value)}
                    className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                      orientation === o.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-center h-10">
                      <div
                        className={`rounded border-2 transition-all ${orientation === o.value ? T.border : "border-gray-400"}`}
                        style={{
                          width:      `${o.w * 0.9}px`,
                          height:     `${o.h * 0.9}px`,
                          background: orientation === o.value ? "#f5f3ff" : "#f9fafb",
                        }}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${orientation === o.value ? T.textDark : "text-gray-700"}`}>{o.label}</p>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ═══ STEP 3 — Images ═════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Images</SectionTitle>

            {/* Brand images strip */}
            <BrandImagesStrip
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
                          <img src={url} alt={`Selected ${index + 1}`} className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm" />
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

            {/* Upload / picker zone */}
            <div
              className="border-2 border-dashed border-violet-200 rounded-2xl p-8 bg-violet-50/30 flex flex-col items-center gap-3 cursor-pointer hover:border-violet-400 hover:bg-violet-50/60 transition-all"
              onClick={() => setMediaPickerOpen(true)}
            >
              <div className="w-10 h-10 bg-surface border border-violet-200 rounded-xl flex items-center justify-center shadow-sm">
                <FileUp className="w-5 h-5 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Upload or Search Images</p>
                <p className="text-xs text-gray-400 mt-1">Search web, magic studio, or upload from device</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setMediaPickerOpen(true); }}
                className="px-5 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition cursor-pointer flex items-center gap-2"
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
              className="px-3 py-2 border border-gray-200 hover:scale-105 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              ← Back
            </button>
          )}
          {step < STEPS.length ? (
            <button
              onClick={handleContinue}
              className={`px-3 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`px-3 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition disabled:opacity-70`}
            >
              {generating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Wand2 className="w-4 h-4" /> Generate Posters</>
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
        aspectRatio={undefined}
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

      {/* ── Fullscreen loading overlay ────────────────────────────────────── */}
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

// ── shared sub-components ─────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";
const SectionTitle = ({ children }) => <h3 className="font-semibold text-gray-900 text-base">{children}</h3>;
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default PosterForm;