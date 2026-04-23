"use client";
// forms/BusinessCardForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Loader2, FileUp, X, CheckCircle2, ChevronRight,
  Sparkles, FileSearch, FolderOpen, Images, Layers,
  Palette, CreditCard, Wand2, Phone, Mail, MapPin,
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

// ── Designer Creative theme color ─────────────────────────────────────────────
const THEME = "#7c3aed"; // violet

// ── constants ─────────────────────────────────────────────────────────────────
const CARD_SIZES = [
  { value: "3.5x2",        label: "Standard US",  desc: "3.5 × 2 in" },
  { value: "85x55mm",      label: "Standard EU",  desc: "85 × 55 mm" },
  { value: "3.375x2.125",  label: "Mini",         desc: "3.375 × 2.125 in" },
  { value: "square_2.5",   label: "Square",       desc: "2.5 × 2.5 in" },
];

const CARD_LAYOUTS = [
  { value: "horizontal",  label: "Horizontal", desc: "Classic landscape" },
  { value: "vertical",    label: "Vertical",   desc: "Portrait orientation" },
  { value: "folded",      label: "Folded",     desc: "Double-sided fold" },
  { value: "square",      label: "Square",     desc: "Equal dimensions" },
];

const VISUAL_STYLES = [
  { value: "minimal",   label: "Minimal" },
  { value: "bold",      label: "Bold" },
  { value: "elegant",   label: "Elegant" },
  { value: "corporate", label: "Corporate" },
  { value: "creative",  label: "Creative" },
  { value: "luxury",    label: "Luxury" },
  { value: "modern",    label: "Modern" },
  { value: "retro",     label: "Retro" },
];

const FINISHES = [
  { value: "matte",      label: "Matte",       desc: "Smooth, non-reflective" },
  { value: "glossy",     label: "Glossy",      desc: "Shiny finish" },
  { value: "soft_touch", label: "Soft Touch",  desc: "Velvet-like texture" },
  { value: "spot_uv",    label: "Spot UV",     desc: "Selective gloss coating" },
];

const FILE_FORMATS = ["PDF", "PNG", "JPEG", "WEBP"];

const FONT_OPTIONS = [
  "Montserrat", "Playfair Display", "Poppins", "Raleway", "Helvetica",
  "Cormorant Garamond", "Oswald", "Lato", "Merriweather", "Bebas Neue",
];

const BRAND_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#db2777", "#ef4444",
  "#f59e0b", "#0ea5e9", "#111827",
];

const STEPS = [
  { id: 1, label: "Brand & Contact",  icon: CreditCard },
  { id: 2, label: "Style & Layout",   icon: Palette },
  { id: 3, label: "Reference Images", icon: Images },
];

// ─────────────────────────────────────────────────────────────────────────────

const BusinessCardForm = ({ formData, setFormData, activeBrand, sendUrl, showToast, onResult }) => {
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

  useEffect(() => {
    if (!formData.brandName?.trim()) return;
    const t = setTimeout(async () => {
      setLoadingRecommended(true);
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(formData.brandName + " business card professional")}&per_page=8`);
        const d = await res.json();
        setRecommendedImages((d.photos || []).map((p) => ({ id: p.id, src: p.src.medium, large: p.src.large2x, alt: p.alt || "" })));
      } catch { setRecommendedImages([]); }
      finally { setLoadingRecommended(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [formData.brandName]);

  // Sync first cropped image → live preview
  useEffect(() => {
    const first = croppedImages.find(Boolean);
    if (first?.previewUrl) setFormData((p) => ({ ...p, backgroundImage: first.previewUrl }));
  }, [croppedImages]);

  useEffect(() => { setCompletedCrop(null); }, [currentCropIndex]);

  // ── field helper ──────────────────────────────────────────────────────────
  const field = (key, value) => {
    if (key === "primaryColor" || key === "secondaryColor")
      value = value.startsWith("#") ? value : `#${value}`;
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
        tagline:        d.tagline     || "",
        description:    d.description || "",
        brandColor:     d.primary_color   || "#7c3aed",
        font:           d.font            || "Montserrat",
        logo:           d.logo            || "",
        website:        d.url             || "",
        email:          d.email           || "",
        phone:          d.phone           || "",
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
    if (step === 1 && !formData.brandName) return setError("Brand name is required.");
    if (step === 1 && !formData.contactName) return setError("Contact name is required.");
    if (step === 2 && (!formData.cardSize || !formData.cardLayout || !formData.visualStyle))
      return setError("Please select a card size, layout, and visual style.");
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
        return { id: `card_${i}`, preview: url, alt: `Business Card Design ${i + 1}` };
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
                    ${step > s.id  ? "border-violet-600 bg-violet-600 text-white"
                    : step === s.id ? "border-violet-600 text-violet-600 bg-white"
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
      <div className="bg-white px-2 rounded-lg py-2 flex flex-col gap-6">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 — Brand & Contact ══════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Brand &amp; Contact Details</SectionTitle>

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

            {/* Brand name + Contact name */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand / Company Name" required>
                <input
                  type="text"
                  value={formData.brandName || ""}
                  onChange={(e) => field("brandName", e.target.value)}
                  placeholder="Acme Corp"
                  className={inputCls}
                />
              </Field>
              <Field label="Contact Name" required>
                <input
                  type="text"
                  value={formData.contactName || ""}
                  onChange={(e) => field("contactName", e.target.value)}
                  placeholder="Jane Doe"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Job title + Department */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Job Title">
                <input
                  type="text"
                  value={formData.jobTitle || ""}
                  onChange={(e) => field("jobTitle", e.target.value)}
                  placeholder="Creative Director"
                  className={inputCls}
                />
              </Field>
              <Field label="Department">
                <input
                  type="text"
                  value={formData.department || ""}
                  onChange={(e) => field("department", e.target.value)}
                  placeholder="Marketing"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => field("email", e.target.value)}
                    placeholder="hello@acme.com"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Phone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => field("phone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
            </div>

            {/* Website + Address */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Website">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.website || ""}
                    onChange={(e) => field("website", e.target.value)}
                    placeholder="www.acme.com"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Address">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => field("address", e.target.value)}
                    placeholder="123 Main St, City"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
            </div>

            {/* Tagline */}
            <Field label="Tagline / Slogan">
              <input
                type="text"
                value={formData.tagline || ""}
                onChange={(e) => field("tagline", e.target.value)}
                placeholder="Your brand's short tagline (optional)"
                className={inputCls}
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

        {/* ═══ STEP 2 — Style & Layout ═══════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle>Style &amp; Layout</SectionTitle>

            {/* Card Size */}
            <Field label="Card Size" required>
              <div className="grid grid-cols-4 gap-2">
                {CARD_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => field("cardSize", s.value)}
                    className={`text-left px-3 py-2.5 cursor-pointer rounded-xl border-2 transition-all
                      ${formData.cardSize === s.value
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <p className={`text-xs font-semibold ${formData.cardSize === s.value ? "text-violet-700" : "text-gray-700"}`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Card Layout */}
            <Field label="Card Orientation" required>
              <div className="grid grid-cols-4 gap-2">
                {CARD_LAYOUTS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => field("cardLayout", l.value)}
                    className={`text-left px-3 py-2.5 cursor-pointer rounded-xl border-2 transition-all
                      ${formData.cardLayout === l.value
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <p className={`text-xs font-semibold ${formData.cardLayout === l.value ? "text-violet-700" : "text-gray-700"}`}>
                      {l.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{l.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Visual Style */}
            <Field label="Visual Style" required>
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

            {/* Finish */}
            <Field label="Print Finish">
              <div className="grid grid-cols-4 gap-2">
                {FINISHES.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => field("finish", f.value)}
                    className={`text-left px-3 py-2.5 cursor-pointer rounded-xl border-2 transition-all
                      ${formData.finish === f.value
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <p className={`text-xs font-semibold ${formData.finish === f.value ? "text-violet-700" : "text-gray-700"}`}>
                      {f.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{f.desc}</p>
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
                        ? "border-violet-600 bg-violet-50 text-violet-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {f}{f === "PDF" && " ✓"}
                  </button>
                ))}
              </div>
            </Field>

            {/* Additional notes */}
            <Field label="Additional Notes">
              <textarea
                value={formData.cardNotes || ""}
                onChange={(e) => field("cardNotes", e.target.value)}
                placeholder="Any specific design direction, special requirements, or inspiration…"
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
                  className="px-4 py-2 bg-violet-600 cursor-pointer text-white text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-violet-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply ({selectedImages.length})
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 -mt-2">
              Optionally upload reference designs that inspire the look and feel of your business card.
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
                  Selected references ({croppedImages.filter(Boolean).length}/5)
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
            <div className="border-2 border-dashed border-violet-200 rounded-2xl p-6 bg-violet-50/30 flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-white border border-violet-200 rounded-xl flex items-center justify-center shadow-sm">
                <Wand2 className="w-5 h-5 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Add Reference Designs</p>
                <p className="text-xs text-gray-400 mt-1">Business card inspirations, brand assets, or textures</p>
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
              className="px-3 py-2 bg-violet-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-violet-700 hover:scale-105 flex items-center gap-2 transition"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="px-3 py-2 bg-violet-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-violet-700 hover:scale-105 flex items-center gap-2 transition"
            >
              {generating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Sparkles className="w-4 h-4" /> Generate Cards</>
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
        aspectRatio={3.5 / 2}
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

const MediaBtn = ({ icon: Icon, label, onClick, primary }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-4 py-2 cursor-pointer rounded-lg text-xs font-semibold transition-all
      ${primary
        ? "bg-violet-600 text-white hover:bg-violet-700"
        : "bg-white border border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600"
      }`}
  >
    <Icon className="w-4 h-4" /> {label}
  </button>
);

export default BusinessCardForm;