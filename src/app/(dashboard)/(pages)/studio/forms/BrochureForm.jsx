"use client";
// forms/BrochuresForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Loader2, FileUp, X, CheckCircle2, ChevronRight,
  Sparkles, FileSearch, FolderOpen, Images, Scan, BookOpen,
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

// ── constants ─────────────────────────────────────────────────────────────────

const FOLD_TYPES = [
  { value: "bi_fold",  label: "Bi-fold",  desc: "2 panels, 1 fold" },
  { value: "tri_fold", label: "Tri-fold", desc: "3 panels, 2 folds" },
  { value: "z_fold",   label: "Z-fold",   desc: "Accordion style" },
  { value: "gate_fold",label: "Gate Fold",desc: "Opens like gates" },
];

const SIZE_OPTIONS = [
  { value: "816x1056",  label: "Digital Letter",  desc: "8.5×11in, 96 DPI", type: "Digital" },
  { value: "595x842",   label: "Digital A4",       desc: "210×297mm, 72 DPI", type: "Digital" },
  { value: "420x594",   label: "Digital A5",       desc: "148×210mm, 72 DPI", type: "Digital" },
  { value: "2550x3300", label: "Print Letter",     desc: "8.5×11in, 300 DPI", type: "Print" },
  { value: "2480x3508", label: "Print A4",         desc: "210×297mm, 300 DPI", type: "Print" },
];

const ORIENTATION_OPTIONS = [
  {
    value: "portrait", label: "Portrait",
    svg: <svg width="24" height="38" viewBox="0 0 24 38" fill="none"><rect x="1" y="1" width="22" height="36" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  },
  {
    value: "landscape", label: "Landscape",
    svg: <svg width="38" height="24" viewBox="0 0 38 24" fill="none"><rect x="1" y="1" width="36" height="22" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  },
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

const FILE_FORMATS = ["PDF", "PNG", "JPEG"];

const FONT_OPTIONS = [
  "Arial", "Helvetica", "Times New Roman", "Inter",
  "Roboto", "Playfair Display", "Poppins",
];

const BRAND_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#f59e0b", "#ec4899",
];

const INSPIRE_PROMPTS = [
  "A professional bi-fold brochure for a corporate consulting firm",
  "A vibrant tri-fold brochure for a travel and tourism agency",
  "An elegant digital brochure for a luxury real estate brand",
  "A colorful brochure for a community health and wellness event",
  "A modern tech startup brochure showcasing SaaS products",
  "A restaurant menu brochure with warm tones and food photography",
];

const STEPS = [
  { id: 1, label: "Brand Details",         icon: BookOpen },
  { id: 2, label: "Goals & Formatting",    icon: Scan },
  { id: 3, label: "Background Image",      icon: Images },
];

// ── theme: designer_creative #7c3aed (violet) ─────────────────────────────────
const T = {
  border:       "border-violet-600",
  bg:           "bg-violet-600",
  bgHover:      "hover:bg-violet-700",
  bgLight:      "bg-violet-50",
  textDark:     "text-violet-700",
  importBg:     "bg-violet-50/40",
  importBorder: "border-violet-100",
  stepActive:   "border-violet-600 bg-violet-600 text-white",
  stepCurrent:  "border-violet-600 text-violet-600 bg-white",
  connector:    "bg-violet-600",
  pill:         "border-violet-600 bg-violet-50 text-violet-700",
  ring:         "focus:ring-violet-500",
  inputHover:   "hover:border-violet-400 hover:text-violet-600",
};

// ─────────────────────────────────────────────────────────────────────────────

const BrochuresForm = ({ formData, setFormData, activeBrand, sendUrl, showToast, onResult }) => {
  const [step,       setStep]      = useState(1);
  const [error,      setError]     = useState("");
  const [brandUrl,   setBrandUrl]  = useState(activeBrand?.url || activeBrand?.source_url || "");
  const [importingBrand, setImportingBrand] = useState(false);
  const [generating, setGenerating]= useState(false);

  // ── image state ───────────────────────────────────────────────────────────
  const [imageSrc,         setImageSrc]         = useState([]);
  const [croppedImages,    setCroppedImages]     = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper,      setShowCropper]      = useState(false);
  const [crop,             setCrop]             = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop,    setCompletedCrop]    = useState(null);

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
        const query = `${formData.brandName} ${formData.campaignGoal || "brochure marketing"} professional`;
        const res  = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=8`);
        const d    = await res.json();
        setRecommendedImages(
          (d.photos || []).map((p) => ({ id: p.id, src: p.src.medium, large: p.src.large2x, alt: p.alt || "" }))
        );
      } catch { setRecommendedImages([]); }
      finally   { setLoadingRecommended(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [formData.brandName, formData.campaignGoal]);

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
        description:    d.description || "",
        primaryColor:   d.primary_color   || "#7c3aed",
        secondaryColor: d.secondary_color || "#2563eb",
        font:           d.font || "Arial",
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

  // ── Apply selected ────────────────────────────────────────────────────────
  const handleApplySelected = async () => {
    const sources = magicModalOpen ? selectedMedia : selectedImages;
    if (sources.length === 0) return;

    const images = sources.filter(
      (item) => !item.type || item.type === "image" ||
        (typeof item.src === "string" && !item.src.includes(".mp4") && !item.videoSrc)
    );
    const videos = sources.filter(
      (item) => item.type === "video" || item.videoSrc ||
        (typeof item.src === "string" && item.src.includes(".mp4"))
    );

    if (images.length > 0) {
      try {
        const processedFiles = await Promise.all(
          images.map(async (item, idx) => {
            const url = item.src || item.large || item;
            const shouldProxy = typeof url === "string" && url.startsWith("http");
            const fetchUrl = shouldProxy ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url;
            const res  = await fetch(fetchUrl);
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const file = new File([blob], `selected-image-${Date.now()}-${idx}`, { type: blob.type || "image/png" });
            file.previewUrl = URL.createObjectURL(blob);
            return file;
          })
        );
        const previewUrls = processedFiles.map((f) => f.previewUrl);
        if (!showCropper) {
          setImageSrc(previewUrls); setCroppedImages(Array(previewUrls.length).fill(null)); setCurrentCropIndex(0);
        } else {
          setImageSrc((p) => [...p, ...previewUrls]);
          setCroppedImages((p) => [...p, ...Array(previewUrls.length).fill(null)]);
          setCurrentCropIndex(imageSrc.length);
        }
        setShowCropper(true);
        showToast(`Added ${images.length} image${images.length > 1 ? "s" : ""} — now crop them`);
      } catch { showToast("Some images couldn't be loaded. Please try again."); }
    }

    if (videos.length > 0) {
      const videoObjects = videos.map((video, i) => ({
        id: `video-${Date.now()}-${i}`,
        previewUrl: video.videoSrc || video.src || video.large,
        thumbnail:  video.thumbnail || video.image || video.src,
        type: "video", alt: video.alt || "Selected video", original: video,
      }));
      setCroppedImages((p) => [...p, ...videoObjects]);
      showToast(`Added ${videos.length} video${videos.length > 1 ? "s" : ""}`);
    }

    if (images.length === 0 && videos.length > 0) setShowCropper(false);
    setSearchModalOpen(false); setLibraryModalOpen(false); setMagicModalOpen(false);
    setSelectedImages([]); setSelectedMedia([]);
  };

  // ── File input ────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    if (!showCropper) {
      setImageSrc(urls); setCroppedImages(Array(urls.length).fill(null)); setCurrentCropIndex(0);
    } else {
      setImageSrc((p) => [...p, ...urls]);
      setCroppedImages((p) => [...p, ...Array(urls.length).fill(null)]);
      setCurrentCropIndex(imageSrc.length);
    }
    setShowCropper(true); e.target.value = "";
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
    ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const file = new File([blob], `cropped-${currentCropIndex}.png`, { type: "image/png" });
    file.previewUrl = URL.createObjectURL(blob);
    setCroppedImages((prev) => { const u = [...prev]; u[currentCropIndex] = file; return u; });
    if (currentCropIndex < imageSrc.length - 1) {
      setCurrentCropIndex((p) => p + 1); setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 }); setCompletedCrop(null);
    } else { setShowCropper(false); }
  }, [completedCrop, currentCropIndex, imageSrc.length]);

  // ── Skip crop ─────────────────────────────────────────────────────────────
  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url).then((r) => r.blob()).then((blob) => {
      const file = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
      file.previewUrl = url;
      setCroppedImages((prev) => { const u = [...prev]; u[currentCropIndex] = file; return u; });
      if (currentCropIndex < imageSrc.length - 1) {
        setCurrentCropIndex((p) => p + 1); setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      } else { setShowCropper(false); }
    });
  };

  const removeCroppedImage = (idx) => {
    const next  = croppedImages.filter((_, i) => i !== idx);
    const first = next.find(Boolean);
    setCroppedImages(next);
    setFormData((p) => ({ ...p, backgroundImage: first?.previewUrl || null }));
    if (idx <= currentCropIndex && currentCropIndex > 0) setCurrentCropIndex((p) => p - 1);
  };

  const handlePreviousCrop = () => {
    if (currentCropIndex > 0) {
      setCurrentCropIndex((p) => p - 1); setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 }); setCompletedCrop(null);
    }
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !formData.brandName) return setError("Brand name is required.");
    if (step === 2 && (!formData.campaignGoal || !formData.audience || !formData.fileFormat))
      return setError("Please complete all fields before continuing.");
    if (step === 3 && croppedImages.filter(Boolean).length === 0)
      return setError("Select at least one background image.");
    setError(""); setStep((p) => p + 1);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const valid  = croppedImages.filter(Boolean);
      const assets = Array.from({ length: 4 }, (_, i) => {
        const src = valid[i % Math.max(valid.length, 1)];
        const url = src?.previewUrl || recommendedImages[i]?.large || "/placeholder.png";
        return { id: `brochure_${i}`, preview: url, alt: `Generated Brochure ${i + 1}` };
      });
      onResult({ assets }); setGenerating(false);
    }, 3000);
  };

  // ── Magic / modal helpers ─────────────────────────────────────────────────
  const handleMagicSelect = (src) =>
    setSelectedMedia((p) => p.includes(src) ? p.filter((m) => m !== src) : p.length < 5 ? [...p, src] : p);

  const handleCancelSelection = () => {
    setSelectedImages([]); setSelectedMedia([]);
    setSearchModalOpen(false); setLibraryModalOpen(false); setMagicModalOpen(false);
  };

  const renderTabContent = () => {
    const shared = { selectedMedia, handleSelectMedia: handleMagicSelect };
    const map = {
      "Text to Image":               <TextToImageTab {...shared} postData={formData} activeBrand={activeBrand} />,
      "Text to Audio":               <TextToAudioTab {...shared} />,
      "Text to Video":               <TextToVideoTab {...shared} />,
      "Image to Variations":         <ImageToVariationsTab {...shared} brandName={formData.brandName} postData={formData} activeBrand={activeBrand}
                                       onClose={() => setMagicModalOpen(false)}
                                       openSearchModal={() => { setSearchModalOpen(true); setMagicModalOpen(false); }}
                                       openLibraryModal={() => { setLibraryModalOpen(true); setMagicModalOpen(false); }} />,
      "Script to Voiceover to Video":<ScriptToVoiceoverToVideoTab {...shared} />,
      "Audio to Text":               <AudioToTextTab {...shared} />,
      "Persona-based Generator":     <PersonaBasedGeneratorTab {...shared} />,
    };
    return map[magicTab] ?? <div className="p-4 text-sm text-gray-500">Select a tab</div>;
  };

  // Crop ratio from selected size
  const cropAspectRatio = (() => {
    if (!formData.size) return 816 / 1056;
    const [w, h] = formData.size.split("x").map(Number);
    return w && h ? w / h : 816 / 1056;
  })();

  // Group sizes
  const sizeGroups = SIZE_OPTIONS.reduce((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, {});

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Step indicator ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl px-0 py-4">
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
                    step > s.id    ? T.stepActive
                    : step === s.id ? T.stepCurrent
                    : "border-gray-200 text-gray-300"
                  }`}>
                    {step > s.id
                      ? <CheckCircle2 className="w-4 h-4" />
                      : <Icon className="w-4 h-4" />
                    }
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

      {/* ── Form content ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg py-2 flex flex-col gap-6">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 — Brand Details ═══════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Brand Details</SectionTitle>

            {/* URL import */}
            <div className={`border ${T.importBorder} rounded-xl p-4 ${T.importBg}`}>
              <div className="flex items-center gap-2 mb-3">
                <Globe className={`w-4 h-4 ${T.textDark}`} />
                <span className="text-sm font-medium text-gray-700">Import from URL</span>
                <span className="text-xs text-gray-400 ml-auto">Auto-fills brand info</span>
              </div>
              <div className="flex gap-2">
                <input type="url" value={brandUrl} onChange={(e) => setBrandUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleImportBrand()}
                  placeholder="https://yourdomain.com/" className={inputCls} />
                <button onClick={handleImportBrand} disabled={importingBrand || !brandUrl.trim()}
                  className={`px-5 py-1.5 ${T.bg} ${T.bgHover} cursor-pointer text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2 shrink-0`}>
                  {importingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                </button>
              </div>
            </div>

            {/* Brand + Project names */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand Name" required>
                <input type="text" value={formData.brandName || ""} onChange={(e) => field("brandName", e.target.value)}
                  placeholder="Your Brand" className={inputCls} />
              </Field>
              <Field label="Project Name">
                <input type="text" value={formData.projectName || ""} onChange={(e) => field("projectName", e.target.value)}
                  placeholder="e.g. Product Launch Brochure 2025" className={inputCls} />
              </Field>
            </div>

            {/* Description */}
            <Field label="Description">
              <div className="relative">
                <textarea value={formData.description || ""} onChange={(e) => field("description", e.target.value)}
                  placeholder="Describe what this brochure is for — include tone, purpose, key messages, and target readers."
                  rows={4} className={`${inputCls} resize-none`} />
                <button
                  onClick={() => field("description", INSPIRE_PROMPTS[Math.floor(Math.random() * INSPIRE_PROMPTS.length)])}
                  className="absolute bottom-3 left-3 text-xs font-semibold bg-white border border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
                >
                  ✨ Inspire Me
                </button>
              </div>
            </Field>

            {/* Fold type */}
            <Field label="Fold Type">
              <div className="grid grid-cols-4 gap-2">
                {FOLD_TYPES.map((f) => (
                  <button key={f.value} onClick={() => field("foldType", f.value)}
                    className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${
                      formData.foldType === f.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}>
                    <p className={`text-xs font-semibold ${formData.foldType === f.value ? T.textDark : "text-gray-700"}`}>{f.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Colors + Font + Logo */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary Color">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap max-w-44">
                    {BRAND_COLORS.map((hex) => (
                      <button key={hex} onClick={() => field("primaryColor", hex)}
                        className={`w-7 h-7 rounded-md cursor-pointer border-2 transition-transform hover:scale-110 ${
                          formData.primaryColor === hex ? "border-gray-800 scale-110" : "border-transparent"
                        }`}
                        style={{ background: hex }} title={hex} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <label className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 transition hover:scale-105"
                      style={{ background: formData.primaryColor || "#7c3aed" }}>
                      <input type="color" value={formData.primaryColor || "#7c3aed"}
                        onChange={(e) => field("primaryColor", e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer" />
                    </label>
                    <input type="text" value={formData.primaryColor || "#7c3aed"}
                      onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && field("primaryColor", e.target.value)}
                      className={`${inputCls} w-24! flex-none px-2 text-sm font-mono`} maxLength={7} />
                  </div>
                </div>
              </Field>

              <Field label="Secondary Color">
                <div className="flex items-center gap-2">
                  <label className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 hover:scale-105 transition"
                    style={{ background: formData.secondaryColor || "#2563eb" }}>
                    <input type="color" value={formData.secondaryColor || "#2563eb"}
                      onChange={(e) => field("secondaryColor", e.target.value)}
                      className="opacity-0 w-full h-full cursor-pointer" />
                  </label>
                  <input type="text" value={formData.secondaryColor || "#2563eb"}
                    onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && field("secondaryColor", e.target.value)}
                    className={`${inputCls} flex-1 px-2 text-sm font-mono`} maxLength={7} />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Font">
                <select value={formData.font || "Arial"} onChange={(e) => field("font", e.target.value)}
                  className={`${inputCls} bg-white cursor-pointer`}>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Logo">
                <div className="flex items-center gap-2">
                  <button onClick={() => logoInputRef.current?.click()}
                    className={`flex-1 px-3 py-2.5 border cursor-pointer border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-500 hover:text-violet-600 flex items-center gap-2 transition`}>
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

        {/* ═══ STEP 2 — Goals & Formatting ══════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle>Goals & Formatting</SectionTitle>

            {/* Size */}
            <Field label="Brochure Size">
              {Object.entries(sizeGroups).map(([type, sizes]) => (
                <div key={type} className="mb-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{type}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map((s) => {
                      const active = formData.size === s.value;
                      return (
                        <button key={s.value} onClick={() => field("size", s.value)}
                          className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${
                            active ? `${T.border} ${T.bgLight} ${T.textDark}` : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                          }`}>
                          <p className="text-xs font-semibold">{s.label}</p>
                          <p className={`text-[10px] mt-0.5 ${active ? "text-violet-500" : "text-gray-400"}`}>{s.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Field>

            {/* Orientation */}
            <Field label="Orientation">
              <div className="grid grid-cols-2 gap-3">
                {ORIENTATION_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => field("orientation", o.value)}
                    className={`flex flex-col items-center gap-2 py-4 cursor-pointer rounded-xl border-2 transition-all hover:scale-[1.02] ${
                      formData.orientation === o.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}>
                    <span className={formData.orientation === o.value ? T.textDark : "text-gray-400"}>{o.svg}</span>
                    <p className={`text-xs font-semibold ${formData.orientation === o.value ? T.textDark : "text-gray-700"}`}>{o.label}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Campaign goal */}
            <Field label="Campaign Goal">
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_GOALS.map((g) => (
                  <button key={g} onClick={() => field("campaignGoal", g)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${
                      formData.campaignGoal === g ? T.pill : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            {/* Audience */}
            <Field label="Audience">
              <div className="grid grid-cols-3 gap-2">
                {AUDIENCES.map((a) => (
                  <button key={a.value} onClick={() => field("audience", a.value)}
                    className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${
                      formData.audience === a.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}>
                    <p className={`text-xs font-semibold ${formData.audience === a.value ? T.textDark : "text-gray-700"}`}>{a.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* File format */}
            <Field label="Export Format">
              <div className="flex gap-2">
                {FILE_FORMATS.map((f) => (
                  <button key={f} onClick={() => field("fileFormat", f)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${
                      formData.fileFormat === f ? T.pill : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}>
                    {f}{f === "PDF" && " ✓"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ═══ STEP 3 — Background Image ════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <SectionTitle>Background Image</SectionTitle>
              {selectedImages.length > 0 && (
                <button onClick={handleApplySelected}
                  className={`px-4 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white text-xs font-semibold rounded-lg flex items-center gap-2`}>
                  <CheckCircle2 className="w-4 h-4" /> Apply ({selectedImages.length})
                </button>
              )}
            </div>

            {(formData.importedImages || []).length > 0 && (
              <ImportedBrandImagesSection importedImages={formData.importedImages}
                selectedImages={selectedImages} setSelectedImages={setSelectedImages} showToast={showToast} />
            )}

            <RecommendedImagesSection recommendedImages={recommendedImages} isLoadingRecommended={loadingRecommended}
              selectedImages={selectedImages} setSelectedImages={setSelectedImages} showToast={showToast} />

            {/* Selected media */}
            {croppedImages.length > 0 && (
              <div className="py-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Selected media</p>
                <div className="grid grid-cols-5 gap-2">
                  {croppedImages.map((item, index) => {
                    const url = item?.previewUrl ||
                      (item instanceof File || item instanceof Blob ? URL.createObjectURL(item) : null);
                    const isVideo = item?.videoSrc || item?.type?.includes?.("video");
                    return (
                      <div key={index} className="relative group">
                        {url ? (
                          isVideo ? (
                            <video src={item.videoSrc || url} poster={item.thumbnail}
                              className="w-full h-auto object-cover rounded-md border border-gray-200 shadow"
                              muted loop playsInline preload="metadata"
                              onMouseEnter={(e) => e.target.play().catch(() => {})}
                              onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }} />
                          ) : (
                            <img src={url} alt={`Selected ${index + 1}`}
                              className="w-full h-auto object-cover rounded-md border border-gray-200 shadow" />
                          )
                        ) : (
                          <div className="w-full h-32 bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-500">No media</span>
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); removeCroppedImage(index); }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer">
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
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 flex flex-col items-center gap-3 mt-2">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                <FileUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Upload or Select Background</p>
                <p className="text-xs text-gray-400 mt-1">From library, web search, or AI generation</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <MediaBtn icon={FileSearch} label="Search Media"  onClick={() => setSearchModalOpen(true)} />
                <MediaBtn icon={FolderOpen} label="Your Library"  onClick={() => setLibraryModalOpen(true)} />
                <MediaBtn icon={Sparkles}   label="Magic Media"   onClick={() => setMagicModalOpen(true)} />
                <MediaBtn icon={FileUp}     label="Upload File"   onClick={() => fileInputRef.current?.click()} />
              </div>
              <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className={`flex gap-3 pt-2 ${step > 1 ? "justify-between" : "justify-end"}`}>
          {step > 1 && (
            <button onClick={() => setStep((p) => p - 1)}
              className="px-3 py-2 border border-gray-200 hover:scale-105 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={handleContinue}
              className={`px-3 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleGenerate}
              className={`px-3 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Generate Brochures</>}
            </button>
          )}
        </div>
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}
      <ImageCropperModal isOpen={showCropper} ref={cropperRef} imageSrc={imageSrc[currentCropIndex]}
        currentIndex={currentCropIndex} totalImages={imageSrc.length} crop={crop}
        onCropChange={setCrop} onCropComplete={setCompletedCrop} aspectRatio={cropAspectRatio}
        onSave={saveCroppedImage} onSkip={handleSkipCrop}
        onCancel={() => { setShowCropper(false); setImageSrc([]); setCroppedImages([]); }}
        onPrevious={handlePreviousCrop} />

      <SearchMediaModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)}
        selectedImages={selectedImages}
        onSelectImage={(src) => setSelectedImages((p) => p.includes(src) ? p.filter((s) => s !== src) : [...p, src])}
        onApply={handleApplySelected} onCancel={handleCancelSelection} />

      <LibraryMediaModal isOpen={libraryModalOpen} onClose={() => setLibraryModalOpen(false)}
        selectedImages={selectedImages}
        onSelectImage={(src) => setSelectedImages((p) => p.includes(src) ? p.filter((s) => s !== src) : [...p, src])}
        onApply={handleApplySelected} onCancel={handleCancelSelection} />

      <MagicMediaModal isOpen={magicModalOpen} onClose={() => { setMagicModalOpen(false); setSelectedMedia([]); }}
        activeTab={magicTab} onTabChange={setMagicTab} selectedMedia={selectedMedia}
        onSelectMedia={handleMagicSelect} onApply={handleApplySelected} onCancel={handleCancelSelection}>
        {renderTabContent()}
      </MagicMediaModal>

      {generating && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10">
            <FloatingAnimation showProgressBar><FloatingElements.ImageFile /></FloatingAnimation>
          </div>
        </div>
      )}
    </>
  );
};

// ── micro-components ──────────────────────────────────────────────────────────
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
const MediaBtn = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 px-4 py-2 cursor-pointer rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600 transition-all">
    <Icon className="w-4 h-4" /> {label}
  </button>
);

export default BrochuresForm;