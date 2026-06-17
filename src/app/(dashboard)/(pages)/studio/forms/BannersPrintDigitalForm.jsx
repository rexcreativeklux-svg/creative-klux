"use client";
// forms/BannersPrintDigitalForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Loader2, FileUp, X, CheckCircle2, ChevronRight,
  Sparkles, Images, Layers,
  Palette, Wand2, LayoutTemplate, Monitor, Printer,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";

// ── Designer Creative theme color ─────────────────────────────────────────────
const THEME = "#7c3aed";

// ── constants ─────────────────────────────────────────────────────────────────
const BANNER_MEDIUM = [
  { value: "digital", label: "Digital",  icon: Monitor,  desc: "Web, social, display" },
  { value: "print",   label: "Print",    icon: Printer,  desc: "Vinyl, fabric, paper" },
  { value: "both",    label: "Both",     icon: Layers,   desc: "Multi-use assets" },
];

const DIGITAL_SIZES = [
  { value: "2560x1440", label: "YouTube Banner",       desc: "2560 × 1440 px" },
  { value: "1920x1080", label: "Facebook Banner",      desc: "1920 × 1080 px" },
  { value: "1600x400",  label: "LinkedIn Banner",      desc: "1600 × 400 px" },
  { value: "820x312",   label: "Twitter Banner",       desc: "820 × 312 px" },
  { value: "1200x628",  label: "Display Ad Landscape", desc: "1200 × 628 px" },
  { value: "300x250",   label: "Display Ad Rectangle", desc: "300 × 250 px" },
  { value: "728x90",    label: "Leaderboard Ad",       desc: "728 × 90 px" },
  { value: "160x600",   label: "Wide Skyscraper",      desc: "160 × 600 px" },
];

const PRINT_SIZES = [
  { value: "2x6ft",   label: "Step & Repeat",    desc: "2 × 6 ft" },
  { value: "3x6ft",   label: "Retractable",       desc: "3 × 6 ft" },
  { value: "4x8ft",   label: "Trade Show",        desc: "4 × 8 ft" },
  { value: "8x2ft",   label: "Outdoor Horizontal",desc: "8 × 2 ft" },
  { value: "24x36in", label: "Poster / Yard Sign",desc: "24 × 36 in" },
  { value: "18x24in", label: "Medium Poster",     desc: "18 × 24 in" },
  { value: "custom",  label: "Custom Size",       desc: "Enter dimensions" },
];

const VISUAL_STYLES = [
  { value: "minimal",   label: "Minimal" },
  { value: "bold",      label: "Bold" },
  { value: "corporate", label: "Corporate" },
  { value: "vibrant",   label: "Vibrant" },
  { value: "elegant",   label: "Elegant" },
  { value: "modern",    label: "Modern" },
  { value: "retro",     label: "Retro" },
  { value: "dark",      label: "Dark" },
];

const BANNER_PURPOSES = [
  { value: "event",        label: "Event / Conference" },
  { value: "sale",         label: "Sale / Promotion" },
  { value: "product",      label: "Product Launch" },
  { value: "brand",        label: "Brand Awareness" },
  { value: "social",       label: "Social Media" },
  { value: "trade_show",   label: "Trade Show" },
  { value: "announcement", label: "Announcement" },
  { value: "seasonal",     label: "Seasonal / Holiday" },
];

const AUDIENCES = [
  { value: "B2B",          label: "B2B",          desc: "Business professionals" },
  { value: "B2C",          label: "B2C",          desc: "End consumers" },
  { value: "Casual",       label: "Casual",       desc: "Broad social audience" },
  { value: "Inspirational",label: "Inspirational",desc: "Creators & entrepreneurs" },
  { value: "Sales",        label: "Direct Sales", desc: "Hot leads, ad audiences" },
];

const DIGITAL_FORMATS = ["PNG", "JPEG", "WEBP", "SVG"];
const PRINT_FORMATS   = ["PDF", "TIFF", "EPS", "PNG"];

const FONT_OPTIONS = [
  "Montserrat", "Bebas Neue", "Oswald", "Raleway", "Poppins",
  "Playfair Display", "Roboto Condensed", "Lato", "Anton", "Merriweather",
];

const BRAND_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#db2777", "#ef4444",
  "#f59e0b", 
];

const STEPS = [
  { id: 1, label: "Brand & Content", icon: Layers },
  { id: 2, label: "Size & Purpose",  icon: LayoutTemplate },
  { id: 3, label: "Reference Images",icon: Images },
];

// ─────────────────────────────────────────────────────────────────────────────

const BannersPrintDigitalForm = ({
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
  const [imageSrcMeta, setImageSrcMeta] = useState([]); // tracks original URLs parallel to imageSrc

  const cropperRef   = useRef(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // ── media picker modal ────────────────────────────────────────────────────
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // derive which size list and file formats to show based on medium
  const medium        = formData.bannerMedium || "digital";
  const sizeList      = medium === "print" ? PRINT_SIZES : DIGITAL_SIZES;
  const formatList    = medium === "print" ? PRINT_FORMATS : DIGITAL_FORMATS;
  const defaultFormat = medium === "print" ? "PDF" : "PNG";

  useEffect(() => {
    if (!formData.brandName?.trim()) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(formData.brandName + " banner design")}&per_page=8`);
        const d = await res.json();
        // stored but not displayed — available if needed
      } catch { /* silent */ }
    }, 800);
    return () => clearTimeout(t);
  }, [formData.brandName]);

  // Sync first cropped image → live preview
  useEffect(() => {
    const first = croppedImages.find(Boolean);
    if (first?.previewUrl) setFormData((p) => ({ ...p, backgroundImage: first.previewUrl }));
  }, [croppedImages]);

  useEffect(() => { setCompletedCrop(null); }, [currentCropIndex]);

  // Reset file format when medium changes
  useEffect(() => {
    setFormData((p) => ({ ...p, fileFormat: defaultFormat, bannerSize: "" }));
  }, [medium]);

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
      if (!r?.ok) throw new Error(r?.message || "Import failed");
      const d = r.data?.data || r.data || {};
      setFormData((p) => ({
        ...p,
        brandName:      d.name        || "",
        tagline:        d.tagline     || "",
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

  // ── File input ────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));

    if (!showCropper) {
      setImageSrc(urls);
      setImageSrcMeta(Array(urls.length).fill(null));
      setCroppedImages(Array(urls.length).fill(null));
      setCurrentCropIndex(0);
    } else {
      setImageSrc((prev) => [...prev, ...urls]);
      setImageSrcMeta((prev) => [...prev, ...Array(urls.length).fill(null)]);
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
    setFormData((p) => ({ ...p, backgroundImage: first?.previewUrl || null }));
    if (idx <= currentCropIndex && currentCropIndex > 0) setCurrentCropIndex((prev) => prev - 1);
  };

  // ── Step navigation ───────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !formData.brandName) return setError("Brand name is required.");
    if (step === 1 && !formData.bannerHeadline) return setError("Banner headline is required.");
    if (step === 2 && !formData.bannerMedium) return setError("Please select a banner medium.");
    if (step === 2 && !formData.bannerSize) return setError("Please select a banner size.");
    if (step === 2 && !formData.bannerPurpose) return setError("Please select a banner purpose.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    const validImages = croppedImages.filter(Boolean);

    const payload = {
      creativeType:     creative?.id,
      categoryType:     categoryId,
      brandName:        formData.brandName        || null,
      bannerHeadline:   formData.bannerHeadline   || null,
      bannerSubheadline:formData.bannerSubheadline|| null,
      bannerCta:        formData.bannerCta        || null,
      bannerCtaUrl:     formData.bannerCtaUrl     || null,
      description:      formData.description      || null,
      brandColor:       formData.brandColor       ?? null,
      logo:             formData.logo             || null,
      font:             formData.font             || null,
      visualStyle:      formData.visualStyle      || null,
      bannerMedium:     formData.bannerMedium     || null,
      bannerSize:       formData.bannerSize       || null,
      bannerPurpose:    formData.bannerPurpose    || null,
      audience:         formData.audience         || null,
      fileFormat:       formData.fileFormat       || null,
      bleedMargin:      formData.bleedMargin      || null,
      printDpi:         formData.printDpi         || null,
      customWidth:      formData.customWidth      || null,
      customHeight:     formData.customHeight     || null,
      bannerNotes:      formData.bannerNotes      || null,
      sourceUrl:        brandUrl                  || null,
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
        type: "design",
        variations: data.variations,
        reply:  data.reply  || "",
        meta:   data.meta   || {},
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
                    ${step > s.id   ? "border-violet-600 bg-violet-600 text-white"
                    : step === s.id ? "border-violet-600 text-violet-600 bg-surface"
                    : "border-gray-200 text-gray-300"}`}>
                    {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`hidden sm:block text-xs font-medium truncate ${step >= s.id ? "text-gray-700" : "text-gray-300"}`}>
                    {s.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full transition-all ${step > s.id ? "bg-violet-600" : "bg-gray-200"}`} />
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
            <SectionTitle>Brand &amp; Banner Content</SectionTitle>

            {/* URL import */}
            <div className="border border-violet-100 rounded-xl p-4 bg-violet-50/40">
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
                  className="px-5 py-1.5 bg-violet-600 cursor-pointer text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {importingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                </button>
              </div>
            </div>

            {/* Brand Name */}
            <Field label="Brand / Company Name" required>
              <input
                type="text"
                value={formData.brandName || ""}
                onChange={(e) => field("brandName", e.target.value)}
                placeholder="Acme Corp"
                className={inputCls}
              />
            </Field>

            {/* Headline + Subheadline */}
            <div className="grid grid-cols-1 gap-4">
              <Field label="Banner Headline" required>
                <input
                  type="text"
                  value={formData.bannerHeadline || ""}
                  onChange={(e) => field("bannerHeadline", e.target.value)}
                  placeholder="The big, bold text on your banner (e.g., 'Summer Sale — Up to 50% Off')"
                  className={inputCls}
                />
              </Field>
              <Field label="Subheadline / Supporting Text">
                <input
                  type="text"
                  value={formData.bannerSubheadline || ""}
                  onChange={(e) => field("bannerSubheadline", e.target.value)}
                  placeholder="A shorter supporting line below the headline"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Call to Action (CTA)">
                <input
                  type="text"
                  value={formData.bannerCta || ""}
                  onChange={(e) => field("bannerCta", e.target.value)}
                  placeholder="e.g., Shop Now, Learn More, Register Free"
                  className={inputCls}
                />
              </Field>
              <Field label="CTA URL / QR Destination">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.bannerCtaUrl || ""}
                    onChange={(e) => field("bannerCtaUrl", e.target.value)}
                    placeholder="https://yourdomain.com/offer"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
            </div>

            {/* Description */}
            <Field label="Additional Context">
              <textarea
                value={formData.description || ""}
                onChange={(e) => field("description", e.target.value)}
                placeholder="Any extra context, key messages, or design direction for the AI…"
                rows={2}
                className={`${inputCls} resize-none`}
              />
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

              <Field label="Logo (optional)">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 px-3 py-2.5 border cursor-pointer border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-500 hover:text-violet-600 flex items-center gap-2 transition"
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
            {/* <Field label="Preferred Font">
              <select
                value={formData.font || "Montserrat"}
                onChange={(e) => field("font", e.target.value)}
                className={`${inputCls} bg-surface cursor-pointer`}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field> */}
          </div>
        )}

        {/* ═══ STEP 2 — Size & Purpose ═══════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle>Size, Medium &amp; Purpose</SectionTitle>

            {/* Medium toggle */}
            <Field label="Banner Medium" required>
              <div className="grid grid-cols-3 gap-2">
                {BANNER_MEDIUM.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      onClick={() => field("bannerMedium", m.value)}
                      className={`flex items-center gap-2 px-3 py-3 cursor-pointer rounded-xl border-2 transition-all
                        ${formData.bannerMedium === m.value
                          ? "border-violet-600 bg-violet-50"
                          : "border-gray-100 bg-gray-50 hover:border-gray-300"
                        }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${formData.bannerMedium === m.value ? "text-violet-600" : "text-gray-400"}`} />
                      <div className="text-left">
                        <p className={`text-xs font-semibold ${formData.bannerMedium === m.value ? "text-violet-700" : "text-gray-700"}`}>
                          {m.label}
                        </p>
                        <p className="text-[10px] text-gray-400">{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Size — list changes based on medium */}
            <Field label={medium === "print" ? "Print Size" : "Digital Size"} required>
              <div className="grid grid-cols-4 gap-2">
                {sizeList.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => field("bannerSize", s.value)}
                    className={`text-left px-3 py-2.5 cursor-pointer rounded-xl border-2 transition-all
                      ${formData.bannerSize === s.value
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <p className={`text-xs font-semibold leading-tight ${formData.bannerSize === s.value ? "text-violet-700" : "text-gray-700"}`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>

              {/* Custom size input for print */}
              {medium === "print" && formData.bannerSize === "custom" && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={formData.customWidth || ""}
                    onChange={(e) => field("customWidth", e.target.value)}
                    placeholder="Width (e.g., 48)"
                    className={inputCls}
                  />
                  <span className="flex items-center text-gray-400 text-sm">×</span>
                  <input
                    type="text"
                    value={formData.customHeight || ""}
                    onChange={(e) => field("customHeight", e.target.value)}
                    placeholder='Height (e.g., 96")'
                    className={inputCls}
                  />
                </div>
              )}
            </Field>

            {/* Banner Purpose */}
            <Field label="Banner Purpose" required>
              <div className="flex flex-wrap gap-2">
                {BANNER_PURPOSES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => field("bannerPurpose", p.value)}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer text-xs font-semibold border-2 transition-all
                      ${formData.bannerPurpose === p.value
                        ? "border-violet-600 bg-violet-50 text-violet-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {p.label}
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
                        ? "border-violet-600 bg-violet-50 text-violet-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Audience */}
            <Field label="Target Audience">
              <div className="grid grid-cols-5 gap-2">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => field("audience", a.value)}
                    className={`text-left px-3 py-2.5 cursor-pointer rounded-xl border-2 transition-all
                      ${formData.audience === a.value
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <p className={`text-xs font-semibold ${formData.audience === a.value ? "text-violet-700" : "text-gray-700"}`}>
                      {a.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Output Format */}
            <Field label="Output Format">
              <div className="flex gap-2 flex-wrap">
                {formatList.map((f) => (
                  <button
                    key={f}
                    onClick={() => field("fileFormat", f)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all
                      ${formData.fileFormat === f
                        ? "border-violet-600 bg-violet-50 text-violet-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {f}{f === defaultFormat && " ✓"}
                  </button>
                ))}
              </div>
              {medium === "print" && (
                <p className="text-[10px] text-gray-400 mt-1">PDF is recommended for print-ready files with bleed marks.</p>
              )}
            </Field>

            {/* Print-specific specs */}
            {(medium === "print" || medium === "both") && (
              <div className="border border-violet-100 bg-violet-50/40 rounded-xl px-4 py-3 flex flex-col gap-2">
                <p className="text-xs font-semibold text-violet-700">Print Specifications</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bleed Margin">
                    <select
                      value={formData.bleedMargin || "0.125in"}
                      onChange={(e) => field("bleedMargin", e.target.value)}
                      className={`${inputCls} bg-surface cursor-pointer text-xs`}
                    >
                      <option value="0.125in">0.125 in (Standard)</option>
                      <option value="0.25in">0.25 in (Large format)</option>
                      <option value="none">None</option>
                    </select>
                  </Field>
                  <Field label="Print Resolution">
                    <select
                      value={formData.printDpi || "300dpi"}
                      onChange={(e) => field("printDpi", e.target.value)}
                      className={`${inputCls} bg-surface cursor-pointer text-xs`}
                    >
                      <option value="300dpi">300 DPI (Standard print)</option>
                      <option value="150dpi">150 DPI (Large format)</option>
                      <option value="72dpi">72 DPI (Digital only)</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* Additional notes */}
            {/* <Field label="Additional Notes">
              <textarea
                value={formData.bannerNotes || ""}
                onChange={(e) => field("bannerNotes", e.target.value)}
                placeholder="Special placement requirements, event details, color restrictions…"
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
                            src={url}
                            poster={item.thumbnail}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                            muted loop playsInline preload="metadata"
                            onMouseEnter={(e) => e.target.play().catch(() => {})}
                            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                          />
                        ) : url ? (
                          <img
                            src={url}
                            alt={`Reference ${index + 1}`}
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
              className="border-2 border-dashed border-violet-200 rounded-2xl p-8 bg-violet-50/30 flex flex-col items-center gap-3 cursor-pointer hover:border-violet-400 hover:bg-violet-50/60 transition-all"
              onClick={() => setMediaPickerOpen(true)}
            >
              <div className="w-10 h-10 bg-surface border border-violet-200 rounded-xl flex items-center justify-center shadow-sm">
                <FileUp className="w-5 h-5 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Upload or Search Reference Images</p>
                <p className="text-xs text-gray-400 mt-1">Brand photos, textures, or design inspiration</p>
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

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <div className={`flex gap-3 pt-2 ${step > 1 ? "justify-between" : "justify-end"}`}>
          {step > 1 && (
            <button
              onClick={() => setStep((p) => p - 1)}
              className="px-3 py-2 cursor-pointer border border-gray-200 hover:scale-105 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={handleContinue}
              className="px-3 py-2 bg-violet-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-violet-700 hover:scale-105 flex items-center gap-2 transition"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-2 bg-violet-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-violet-700 hover:scale-105 flex items-center gap-2 transition disabled:opacity-70"
            >
              {generating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Sparkles className="w-4 h-4" /> Generate Banners</>
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
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

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

export default BannersPrintDigitalForm;