"use client";
// forms/PackagingForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Loader2, FileUp, X, CheckCircle2, ChevronRight,
  Sparkles, FileSearch, FolderOpen, Images, Scan, Package,
  Milk, ShoppingBag, CupSoda, Package2, Cylinder, GlassWater, Tag,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

import SearchMediaModal from "@/app/(components)/SearchMediaModal";
import LibraryMediaModal from "@/app/(components)/LibraryMediaModal";
import MagicMediaModal from "@/app/(components)/MagicMediaModal";
import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import RecommendedImagesSection from "@/app/(components)/RecommendedImagesSection";
import ImportedBrandImagesSection from "@/app/(components)/ImportedBrandImagesSection";
import OptionChip from "./OptionChip";

import TextToImageTab from "../../old-studio/designer-creatives/create/tabs/text-to-image/page";
import TextToAudioTab from "../../old-studio/designer-creatives/create/tabs/text-to-audio/page";
import TextToVideoTab from "../../old-studio/designer-creatives/create/tabs/text-to-video/page";
import ImageToVariationsTab from "../../old-studio/designer-creatives/create/tabs/image-to-variations/page";
import ScriptToVoiceoverToVideoTab from "../../old-studio/designer-creatives/create/tabs/script-to-voiceover/page";
import AudioToTextTab from "../../old-studio/ai-studio/create/audio-to-text/page";
import PersonaBasedGeneratorTab from "../../old-studio/designer-creatives/create/tabs/persona-based-generator/page";

// ── constants ─────────────────────────────────────────────────────────────────

const MOCKUP_TYPES = [
  { value: "box",    label: "Box",    desc: "Folding carton, gift box",  icon: Package },
  { value: "bottle", label: "Bottle", desc: "Glass, plastic, cosmetic",  icon: Milk },
  { value: "bag",    label: "Bag",    desc: "Paper, kraft, shopping",    icon: ShoppingBag },
  { value: "can",    label: "Can",    desc: "Beverage, food, spray",     icon: CupSoda },
  { value: "pouch",  label: "Pouch",  desc: "Stand-up, flat, ziplock",   icon: Package2 },
  { value: "tube",   label: "Tube",   desc: "Cosmetic, squeeze, lip",    icon: Cylinder },
  { value: "jar",    label: "Jar",    desc: "Glass, cream, candle",      icon: GlassWater },
  { value: "label",  label: "Label",  desc: "Sticker, wrap-around",      icon: Tag },
];

const RESOLUTION_OPTIONS = [
  { value: "1000x1000", label: "Digital Square",      desc: "1000×1000 px",        type: "digital" },
  { value: "1200x800",  label: "Digital Rectangular", desc: "1200×800 px",          type: "digital" },
  { value: "3000x3000", label: "Print Square",        desc: "10×10 in, 300 DPI",    type: "print"   },
  { value: "3600x2400", label: "Print Rectangular",   desc: "12×8 in, 300 DPI",     type: "print"   },
];

const FILE_FORMATS = [
  { value: "PNG",  label: "PNG",  desc: "Recommended" },
  { value: "JPEG", label: "JPEG", desc: "Compressed"  },
  { value: "PDF",  label: "PDF",  desc: "Print-ready" },
];

const CAMPAIGN_GOALS = [
  "Brand Awareness", "Engagement", "Sales", "Lead Generation", "Website Traffic",
];

const AUDIENCES = [
  { value: "B2B",          label: "B2B",          desc: "Business owners, startups, agencies" },
  { value: "B2C",          label: "B2C",          desc: "End consumers, everyday users" },
  { value: "Casual",       label: "Casual",       desc: "Broad social media audience" },
  { value: "Educational",  label: "Educational",  desc: "Students, researchers, learners" },
  { value: "Professional", label: "Professional", desc: "Industry experts, professionals" },
];

const VISUAL_STYLES = [
  { value: "minimal",    label: "Minimal" },
  { value: "luxury",     label: "Luxury" },
  { value: "playful",    label: "Playful" },
  { value: "eco",        label: "Eco / Natural" },
  { value: "bold",       label: "Bold" },
  { value: "corporate",  label: "Corporate" },
];

const BRAND_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#f59e0b", "#ec4899",
];

const FONT_OPTIONS = [
  "Arial", "Helvetica", "Times New Roman", "Roboto", "Poppins",
];

const INSPIRE_PROMPTS = [
  "A sleek box packaging for a luxury skincare product",
  "A vibrant bottle label for an artisan energy drink",
  "A minimalist bag design for premium organic coffee",
  "A modern can design for a craft beer series",
  "An eco-friendly pouch for sustainable wellness snacks",
];

const STEPS = [
  { id: 1, label: "Brand & Product",   icon: Package },
  { id: 2, label: "Format & Goals",    icon: Scan },
  { id: 3, label: "Background Image",  icon: Images },
];

// ── theme: designer_creative #7c3aed (violet) ─────────────────────────────────
const T = {
  border:       "border-violet-600",
  bg:           "bg-violet-600",
  bgHover:      "hover:bg-violet-700",
  bgLight:      "bg-violet-50",
  text:         "text-violet-600",
  textDark:     "text-violet-700",
  importBg:     "bg-violet-50/40",
  importBorder: "border-violet-100",
  stepActive:   "border-violet-600 bg-violet-600 text-white",
  stepCurrent:  "border-violet-600 text-violet-600 bg-surface",
  connector:    "bg-violet-600",
  pill:         "border-violet-600 bg-violet-50 text-violet-700",
};

// ─────────────────────────────────────────────────────────────────────────────

const PackagingForm = ({ formData, setFormData, activeBrand, sendUrl, showToast, onResult }) => {
  const [step, setStep]               = useState(1);
  const [error, setError]             = useState("");
  const [brandUrl, setBrandUrl]       = useState(activeBrand?.url || activeBrand?.source_url || "");
  const [importingBrand, setImportingBrand] = useState(false);
  const [generating, setGenerating]   = useState(false);

  // ── image state ───────────────────────────────────────────────────────────
  const [imageSrc, setImageSrc]               = useState([]);
  const [croppedImages, setCroppedImages]     = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper]         = useState(false);
  const [crop, setCrop]                       = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop]     = useState(null);

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
        const mockupKw = formData.mockupType || "packaging";
        const query = `${formData.brandName} ${mockupKw} product packaging design`;
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=8`);
        const d   = await res.json();
        setRecommendedImages(
          (d.photos || []).map((p) => ({ id: p.id, src: p.src.medium, large: p.src.large2x, alt: p.alt || "" }))
        );
      } catch { setRecommendedImages([]); }
      finally   { setLoadingRecommended(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [formData.brandName, formData.mockupType]);

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

  // ── Inspire Me ────────────────────────────────────────────────────────────
  const handleInspire = () =>
    field("description", INSPIRE_PROMPTS[Math.floor(Math.random() * INSPIRE_PROMPTS.length)]);

  // ── URL import ────────────────────────────────────────────────────────────
  const handleImportBrand = async () => {
    if (!brandUrl.trim()) return setError("Please enter a valid brand URL.");
    setImportingBrand(true);
    try {
      const r = await sendUrl(brandUrl);
      if (!r?.ok) throw new Error(r?.message || "Import failed");
      const d = r.data?.data || r.data || {};
      const cleanName = (d.name || "").replace(/\s+/g, "");
      setFormData((p) => ({
        ...p,
        brandName:      d.name        || "",
        description:    d.description || "",
        tagline:        d.tagline     || "",
        primaryColor:   d.primary_color   || "#7c3aed",
        secondaryColor: d.secondary_color || "#2563eb",
        font:           d.font || "Arial",
        logo:           d.logo || "",
        caption:        p.caption || `Beautiful packaging by ${d.name} – ready to launch!`,
        hashtags:       p.hashtags?.length ? p.hashtags : ["#PackagingDesign", "#Mockup", "#Branding", `#${cleanName}`],
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
            let url = item.src || item.large || item;
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
          setImageSrc((prev) => [...prev, ...previewUrls]);
          setCroppedImages((prev) => [...prev, ...Array(previewUrls.length).fill(null)]);
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
      setCroppedImages((prev) => [...prev, ...videoObjects]);
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
      setImageSrc((prev) => [...prev, ...urls]);
      setCroppedImages((prev) => [...prev, ...Array(urls.length).fill(null)]);
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
      setCurrentCropIndex((prev) => prev + 1);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 }); setCompletedCrop(null);
    } else { setShowCropper(false); }
  }, [completedCrop, currentCropIndex, imageSrc.length]);

  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url).then((r) => r.blob()).then((blob) => {
      const file = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
      file.previewUrl = url;
      setCroppedImages((prev) => { const u = [...prev]; u[currentCropIndex] = file; return u; });
      if (currentCropIndex < imageSrc.length - 1) {
        setCurrentCropIndex((prev) => prev + 1); setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      } else { setShowCropper(false); }
    });
  };

  const removeCroppedImage = (idx) => {
    const next  = croppedImages.filter((_, i) => i !== idx);
    const first = next.find(Boolean);
    setCroppedImages(next);
    setFormData((p) => ({ ...p, backgroundImage: first?.previewUrl || null }));
    if (idx <= currentCropIndex && currentCropIndex > 0) setCurrentCropIndex((prev) => prev - 1);
  };

  const handlePreviousCrop = () => {
    if (currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 }); setCompletedCrop(null);
    }
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !formData.brandName)      return setError("Brand name is required.");
    if (step === 1 && !formData.mockupType)      return setError("Please select a mockup type.");
    if (step === 2 && (!formData.campaignGoal || !formData.audience || !formData.resolution))
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
        return { id: `packaging_${i}`, preview: url, alt: `Generated Packaging ${i + 1}` };
      });
      onResult({ assets }); setGenerating(false);
    }, 3000);
  };

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

  // Crop aspect ratio from selected resolution
  const cropAspectRatio = (() => {
    if (!formData.resolution) return 1;
    const [w, h] = formData.resolution.split("x").map(Number);
    return w && h ? w / h : 1;
  })();

  // Currently selected mockup type (used for inline hints + the step-2 summary)
  const selectedMockup     = MOCKUP_TYPES.find((m) => m.value === formData.mockupType);
  const SelectedMockupIcon = selectedMockup?.icon || Package;

  // Group resolutions
  const resolutionGroups = RESOLUTION_OPTIONS.reduce((acc, r) => {
    const g = r.type === "digital" ? "Digital" : "Print";
    if (!acc[g]) acc[g] = [];
    acc[g].push(r);
    return acc;
  }, {});

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Step indicator ───────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl px-2 py-4">
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
      <div className="bg-surface rounded-lg py-2 flex flex-col gap-6">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 — Brand & Product ════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle icon={Package} subtitle="Who the brand is and what's going on the packaging.">
              Brand & Product
            </SectionTitle>

            {/* URL import */}
            <div className={`border ${T.importBorder} rounded-xl p-4 ${T.importBg}`}>
              <div className="flex items-center gap-2 mb-3">
                <Globe className={`w-4 h-4 ${T.text}`} />
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

            {/* Brand + Project name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Brand Name" required>
                <input type="text" value={formData.brandName || ""} onChange={(e) => field("brandName", e.target.value)}
                  placeholder="Your Brand" className={inputCls} />
              </Field>
              <Field label="Project Name">
                <input type="text" value={formData.projectName || ""} onChange={(e) => field("projectName", e.target.value)}
                  placeholder="e.g. Summer Skincare Line" className={inputCls} />
              </Field>
            </div>

            {/* Tagline */}
            <Field label="Product Tagline">
              <input type="text" value={formData.tagline || ""} onChange={(e) => field("tagline", e.target.value)}
                placeholder="e.g. Pure. Natural. Powerful." className={inputCls} />
            </Field>

            {/* Mockup type — required in step 1 so it informs the rest.
                Compact icon chips: they only take the width they need, and the
                selected type's description shows inline on the label row. */}
            <Field
              label="Packaging / Mockup Type"
              required
              hint={selectedMockup ? selectedMockup.desc : "Pick the surface you want mocked up"}
            >
              <div className="flex flex-wrap gap-2">
                {MOCKUP_TYPES.map((m) => (
                  <OptionChip
                    key={m.value}
                    icon={m.icon}
                    label={m.label}
                    title={m.desc}
                    theme={T}
                    active={formData.mockupType === m.value}
                    onClick={() => field("mockupType", m.value)}
                  />
                ))}
              </div>
            </Field>

            {/* Description — pb-10 keeps long briefs from running under the
                Inspire Me button / counter that sit inside the textarea. */}
            <Field label="Product / Design Brief">
              <div className="relative">
                <textarea value={formData.description || ""} onChange={(e) => field("description", e.target.value)}
                  placeholder="Describe the product, key design elements, target feel, and any special requirements…"
                  rows={4} maxLength={500}
                  className={`${inputCls} pb-10 placeholder:text-xs placeholder:text-gray-400 resize-none`} />
                <button onClick={handleInspire}
                  className="absolute bottom-3 left-3 text-xs font-semibold bg-surface border border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-600 px-3 py-1 rounded-lg cursor-pointer transition-all">
                  ✨ Inspire Me
                </button>
                <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">
                  {(formData.description?.length || 0)}/500
                </span>
              </div>
            </Field>

            {/* Visual style */}
            <Field label="Visual Style">
              <div className="flex flex-wrap gap-2">
                {VISUAL_STYLES.map((s) => (
                  <button key={s.value} onClick={() => field("visualStyle", s.value)}
                    className={`px-4 py-2 rounded-lg border-2 cursor-pointer text-xs font-semibold transition-all ${
                      formData.visualStyle === s.value ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Primary Color">
                {/* flex-wrap so the swatches + hex input can never force the
                    column wider than the pane on narrow screens */}
                <div className="flex items-center gap-2 flex-wrap">
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
                    <label className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 hover:scale-105"
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
                  <label className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 hover:scale-105"
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

            {/* Font + Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Font">
                <select value={formData.font || "Arial"} onChange={(e) => field("font", e.target.value)}
                  className={`${inputCls} bg-surface cursor-pointer`}>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Logo">
                <div className="flex items-center gap-2">
                  <button onClick={() => logoInputRef.current?.click()}
                    className="flex-1 px-3 py-2.5 border cursor-pointer border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-500 hover:text-violet-600 flex items-center gap-2 transition">
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

            {/* Caption + Hashtags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Caption">
                <div className="relative">
                  <input type="text" value={formData.caption || ""} onChange={(e) => field("caption", e.target.value)}
                    placeholder="e.g. New packaging alert! Fresh, bold, and ready to stand out"
                    maxLength={280} className={`${inputCls} pr-12`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {280 - (formData.caption?.length || 0)}
                  </span>
                </div>
              </Field>
              <Field label="Hashtags">
                <input type="text"
                  value={Array.isArray(formData.hashtags) ? formData.hashtags.join(" ") : formData.hashtags || ""}
                  onChange={(e) => field("hashtags", e.target.value.split(" ").filter(Boolean))}
                  placeholder="#PackagingDesign #Mockup #Branding" className={inputCls} />
              </Field>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 — Format & Goals ══════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle icon={Scan} subtitle="Output size, file type, and who this mockup is aimed at.">
              Format & Goals
            </SectionTitle>

            {/* Resolution — groups sit side by side so the block stays short */}
            <Field label="Resolution" required hint="Digital for social, Print for 300 DPI output">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(resolutionGroups).map(([group, options]) => (
                  <div key={group}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {options.map((r) => {
                        const active = formData.resolution === r.value;
                        return (
                          <button key={r.value} onClick={() => field("resolution", r.value)}
                            className={`flex items-center gap-2.5 text-left px-3 py-2.5 cursor-pointer rounded-xl border-2 transition-all ${
                              active ? `${T.border} ${T.bgLight} ${T.textDark}` : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                            }`}>
                            <AspectGlyph value={r.value} active={active} />
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold truncate">{r.label}</span>
                              <span className={`block text-[10px] mt-0.5 ${active ? "text-violet-500" : "text-gray-400"}`}>{r.desc}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Field>

            {/* File format — intrinsic width so the row doesn't stretch edge to edge */}
            <Field label="File Format">
              <div className="flex flex-wrap gap-2">
                {FILE_FORMATS.map((f) => (
                  <button key={f.value} onClick={() => field("fileFormat", f.value)}
                    className={`flex items-baseline gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer text-xs transition-all ${
                      formData.fileFormat === f.value ? T.pill : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}>
                    <span className="font-bold">{f.label}</span>
                    <span className={`text-[10px] ${formData.fileFormat === f.value ? "text-violet-500" : "text-gray-400"}`}>{f.desc}</span>
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

            {/* Audience — 5 across on wide screens so the row fills evenly */}
            <Field label="Audience">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {AUDIENCES.map((a) => (
                  <button key={a.value} onClick={() => field("audience", a.value)}
                    className={`text-left px-3 py-2.5 cursor-pointer rounded-xl border-2 transition-all ${
                      formData.audience === a.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}>
                    <p className={`text-xs font-semibold ${formData.audience === a.value ? T.textDark : "text-gray-700"}`}>{a.label}</p>
                    <p className={`text-[10px] mt-0.5 ${formData.audience === a.value ? "text-violet-500" : "text-gray-400"}`}>{a.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Mockup type summary reminder */}
            {selectedMockup && (
              <div className={`flex items-center gap-3 rounded-xl p-3 ${T.importBg} border ${T.importBorder}`}>
                <span className={`w-9 h-9 shrink-0 rounded-xl ${T.bg} text-white flex items-center justify-center`}>
                  <SelectedMockupIcon className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">Selected Mockup</p>
                  <p className="text-xs text-gray-700 mt-0.5">{selectedMockup.label} — {selectedMockup.desc}</p>
                </div>
                <button onClick={() => setStep(1)}
                  className="ml-auto shrink-0 text-[11px] font-semibold text-violet-600 hover:text-violet-700 cursor-pointer">
                  Change
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3 — Background Image ════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <SectionTitle icon={Images}>Background Image</SectionTitle>
              {selectedImages.length > 0 && (
                <button onClick={handleApplySelected}
                  className={`px-4 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white text-xs font-semibold rounded-lg flex items-center gap-2`}>
                  <CheckCircle2 className="w-4 h-4" /> Apply ({selectedImages.length})
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {formData.resolution ? `Optimal: ${formData.resolution}px` : "Select a resolution in Step 2 for best crop results"}
            </p>

            {(formData.importedImages || []).length > 0 && (
              <ImportedBrandImagesSection importedImages={formData.importedImages}
                selectedImages={selectedImages} setSelectedImages={setSelectedImages} showToast={showToast} />
            )}

            <RecommendedImagesSection recommendedImages={recommendedImages} isLoadingRecommended={loadingRecommended}
              selectedImages={selectedImages} setSelectedImages={setSelectedImages} showToast={showToast} />

            {/* Selected media grid */}
            {croppedImages.length > 0 && (
              <div className="py-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Selected media</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
              <div className="w-10 h-10 bg-surface border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
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
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Generate Mockups</>}
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
          <div className="bg-surface rounded-2xl p-10">
            <FloatingAnimation showProgressBar><FloatingElements.ImageFile /></FloatingAnimation>
          </div>
        </div>
      )}
    </>
  );
};

// ── micro-components ──────────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

/**
 * Step heading. `icon` renders a tinted theme chip on the left and `subtitle`
 * a one-line explainer underneath — both optional, so a bare
 * <SectionTitle>Text</SectionTitle> still renders like the other forms.
 */
const SectionTitle = ({ icon: Icon, subtitle, children }) => (
  <div className="flex items-start gap-2.5">
    {Icon && (
      <span className={`w-8 h-8 shrink-0 rounded-xl ${T.bgLight} ${T.text} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </span>
    )}
    <div className="min-w-0">
      <h3 className="font-semibold text-gray-900 text-base leading-5">{children}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

/**
 * Labelled field wrapper. `hint` shows secondary copy on the right of the label
 * row — used to surface a selected option's description without spending
 * vertical space on it.
 */
const Field = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
        {label}{required && <span className="text-red-400">*</span>}
      </label>
      {hint && <span className="text-[10px] text-gray-400 ml-auto truncate">{hint}</span>}
    </div>
    {children}
  </div>
);

/**
 * Tiny outlined rectangle drawn to a resolution's aspect ratio (e.g. 1200x800),
 * so square vs. rectangular output is readable at a glance.
 */
const AspectGlyph = ({ value, active }) => {
  const [w, h] = String(value).split("x").map(Number);
  const ratio  = w && h ? w / h : 1;
  const MAX    = 18;
  const width  = ratio >= 1 ? MAX : Math.round(MAX * ratio);
  const height = ratio >= 1 ? Math.round(MAX / ratio) : MAX;
  return (
    <span className="w-5 h-5 shrink-0 flex items-center justify-center">
      <span
        className={`block rounded-[3px] border-2 transition-colors ${active ? "border-violet-500" : "border-gray-300"}`}
        style={{ width, height }}
      />
    </span>
  );
};
const MediaBtn = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 px-4 py-2 cursor-pointer rounded-lg text-xs font-semibold bg-surface border border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600 transition-all">
    <Icon className="w-4 h-4" /> {label}
  </button>
);

export default PackagingForm;