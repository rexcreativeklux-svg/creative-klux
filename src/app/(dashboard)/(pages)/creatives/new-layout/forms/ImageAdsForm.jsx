"use client";
// forms/ImageAdsForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Loader2, FileUp, X, CheckCircle2, ChevronRight,
  Sparkles, FileSearch, FolderOpen, Images, Scan, ImageIcon,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

import SearchMediaModal from "@/app/(components)/SearchMediaModal";
import LibraryMediaModal from "@/app/(components)/LibraryMediaModal";
import MagicMediaModal from "@/app/(components)/MagicMediaModal";
import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import RecommendedImagesSection from "@/app/(components)/RecommendedImagesSection";
import ImportedBrandImagesSection from "@/app/(components)/ImportedBrandImagesSection";

import TextToImageTab from "../../designer-creatives/create/tabs/text-to-image/page";
import TextToAudioTab from "../../designer-creatives/create/tabs/text-to-audio/page";
import TextToVideoTab from "../../designer-creatives/create/tabs/text-to-video/page";
import ImageToVariationsTab from "../../designer-creatives/create/tabs/image-to-variations/page";
import ScriptToVoiceoverToVideoTab from "../../designer-creatives/create/tabs/script-to-voiceover/page";
import AudioToTextTab from "../../ai-studio/create/audio-to-text/page";
import PersonaBasedGeneratorTab from "../../designer-creatives/create/tabs/persona-based-generator/page";

// ── constants ─────────────────────────────────────────────────────────────────
const SIZE_OPTIONS = [
  { value: "1200x627", label: "LinkedIn Horizontal" },
  { value: "627x627", label: "LinkedIn Square" },
  { value: "1200x628", label: "Google Landscape" },
  { value: "1200x1200", label: "Google Square" },
  { value: "1080x1920", label: "TikTok Vertical" },
  { value: "1080x1080", label: "Meta Square" },
  { value: "1080x1350", label: "Meta Vertical" },
  { value: "1080x1921", label: "Meta Stories/Reels" },
];
const CAMPAIGN_GOALS = ["Brand Awareness", "Engagement", "Sales", "Lead Generation", "Website Traffic"];
const AUDIENCES = [
  { value: "B2B", label: "B2B", desc: "Business owners, startups, agencies" },
  { value: "B2C", label: "B2C", desc: "End consumers, everyday users" },
  { value: "Casual", label: "Casual", desc: "Broad social media audience" },
  { value: "Inspirational", label: "Inspirational", desc: "Entrepreneurs & creators" },
  { value: "Sales", label: "Sales", desc: "Hot leads, ad audiences" },
];
const FILE_FORMATS = ["PNG", "JPEG", "WEBP", "AVIF"];
const FONT_OPTIONS = ["Montserrat", "Playfair Display", "Roboto", "Georgia", "Helvetica", "Arial"];
const STEPS = [
  { id: 1, label: "Brand Details", icon: ImageIcon },
  { id: 2, label: "Size, Goals & Audience", icon: Scan },
  { id: 3, label: "Background Image", icon: Images },
];

// ─────────────────────────────────────────────────────────────────────────────

const ImageAdsForm = ({ formData, setFormData, activeBrand, sendUrl, showToast, onResult }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [brandUrl, setBrandUrl] = useState(activeBrand?.url || activeBrand?.source_url || "");
  const [importingBrand, setImportingBrand] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ── IMAGE STATE — mirrors Posts exactly ──────────────────────────────────
  const [imageSrc, setImageSrc] = useState([]);        // raw URLs fed to cropper
  const [croppedImages, setCroppedImages] = useState([]);        // finished Files with .previewUrl
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState(null);

  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // ── modal state ───────────────────────────────────────────────────────────
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [magicModalOpen, setMagicModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [magicTab, setMagicTab] = useState("Text to Image");

  // ── recommended images ────────────────────────────────────────────────────
  const [recommendedImages, setRecommendedImages] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  useEffect(() => {
    if (!formData.brandName?.trim()) return;
    const t = setTimeout(async () => {
      setLoadingRecommended(true);
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(formData.brandName)}&per_page=8`);
        const d = await res.json();
        setRecommendedImages((d.photos || []).map((p) => ({ id: p.id, src: p.src.medium, large: p.src.large2x, alt: p.alt || "" })));
      } catch { setRecommendedImages([]); }
      finally { setLoadingRecommended(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [formData.brandName]);

  // Sync first cropped image → live preview (keep this from original)
  useEffect(() => {
    const first = croppedImages.find(Boolean);
    if (first?.previewUrl) setFormData((p) => ({ ...p, backgroundImage: first.previewUrl }));
  }, [croppedImages]);

  useEffect(() => {
    setCompletedCrop(null);
  }, [currentCropIndex]);

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
        brandName: d.name || "", description: d.description || "",
        primaryColor: d.primary_color || "#2563eb", secondaryColor: d.secondary_color || "#0ea5e9",
        font: d.font || "Montserrat", caption: `Discover ${d.name}!`,
        hashtags: ["#ImageAd", "#Brand"], logo: d.logo || "",
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

  // ── Apply selected — EXACT copy of Posts handleApplySelected ─────────────
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
            const fetchUrl = shouldProxy
              ? `/api/proxy-image?url=${encodeURIComponent(url)}`
              : url;

            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`Failed to load image: ${url}`);

            const blob = await res.blob();
            const file = new File([blob], `selected-image-${Date.now()}-${idx}`, {
              type: blob.type || "image/png",
            });
            file.previewUrl = URL.createObjectURL(blob);
            return file;
          })
        );

        const previewUrls = processedFiles.map((f) => f.previewUrl);

        // ← Reset instead of appending if cropper was closed
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

    if (images.length === 0 && videos.length > 0) {
      setShowCropper(false);
    }

    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicModalOpen(false);
    setSelectedImages([]);
    setSelectedMedia([]);
  };

  // ── File input — EXACT copy of Posts handleFileChange ────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));

    // ← Reset instead of appending if cropper was closed
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

  // ── Save crop — EXACT copy of Posts saveCroppedImage ─────────────────────
  const saveCroppedImage = useCallback(async () => {
    if (!completedCrop || !cropperRef.current) return;
    const image = cropperRef.current.cropper?.getImage?.();
    if (!image) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;   // ← pixel values from user drag
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

    setCroppedImages((prev) => {
      const updated = [...prev];
      updated[currentCropIndex] = file;
      return updated;
    });

    if (currentCropIndex < imageSrc.length - 1) {
      setCurrentCropIndex((prev) => prev + 1);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);  // ← reset to null like Posts
    } else {
      setShowCropper(false);
    }
  }, [completedCrop, currentCropIndex, imageSrc.length]);

  // ── Skip crop — EXACT copy of Posts handleSkipCrop ───────────────────────
  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url).then((r) => r.blob()).then((blob) => {
      const file = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
      file.previewUrl = url;
      setCroppedImages((prev) => {
        const u = [...prev];
        u[currentCropIndex] = file;
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
    const next = croppedImages.filter((_, i) => i !== idx);  // ← compute outside
    const first = next.find(Boolean);

    setCroppedImages(next);  // ← update local state directly
    setFormData((p) => ({ ...p, backgroundImage: first?.previewUrl || null }));  // ← update parent separately

    if (idx <= currentCropIndex && currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
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

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const valid = croppedImages.filter(Boolean);
      const assets = Array.from({ length: 4 }, (_, i) => {
        const src = valid[i % Math.max(valid.length, 1)];
        const url = src?.previewUrl || recommendedImages[i]?.large || "/placeholder.png";
        return { id: `img_${i}`, preview: url, alt: `Generated Image ${i + 1}` };
      });
      onResult({ assets });
      setGenerating(false);
    }, 3000);
  };

  // ── Magic media select toggle ─────────────────────────────────────────────
  const handleMagicSelect = (src) =>
    setSelectedMedia((p) => p.includes(src) ? p.filter((m) => m !== src) : p.length < 5 ? [...p, src] : p);

  const handleCancelSelection = () => {
    setSelectedImages([]);
    setSelectedMedia([]);
    setSearchModalOpen(false);
    setLibraryModalOpen(false);
    setMagicModalOpen(false);
  };

  const renderTabContent = () => {
    const shared = { selectedMedia, handleSelectMedia: handleMagicSelect };
    const map = {
      "Text to Image": <TextToImageTab {...shared} postData={formData} activeBrand={activeBrand} />,
      "Text to Audio": <TextToAudioTab {...shared} />,
      "Text to Video": <TextToVideoTab {...shared} />,
      "Image to Variations": <ImageToVariationsTab {...shared} brandName={formData.brandName} postData={formData} activeBrand={activeBrand}
        onClose={() => setMagicModalOpen(false)}
        openSearchModal={() => { setSearchModalOpen(true); setMagicModalOpen(false); }}
        openLibraryModal={() => { setLibraryModalOpen(true); setMagicModalOpen(false); }} />,
      "Script to Voiceover to Video": <ScriptToVoiceoverToVideoTab {...shared} />,
      "Audio to Text": <AudioToTextTab {...shared} />,
      "Persona-based Generator": <PersonaBasedGeneratorTab {...shared} />,
    };
    return map[magicTab] ?? <div className="p-4 text-sm text-gray-500">Select a tab</div>;
  };

  const handlePreviousCrop = () => {
    if (currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
      setCompletedCrop(null);  // ← was setting a value, now null
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Step indicator ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => step > s.id && setStep(s.id)}
                  className={`flex flex-1 items-center gap-2 min-w-0 ${step > s.id ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${step > s.id ? "border-blue-600 bg-blue-600 text-white"
                    : step === s.id ? "border-blue-600 text-blue-600 bg-white"
                      : "border-gray-200 text-gray-300"
                    }`}>
                    {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`hidden sm:block text-xs font-medium truncate ${step >= s.id ? "text-gray-700" : "text-gray-300"}`}>
                    {s.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full transition-all ${step > s.id ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step content card ────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm flex flex-col gap-6">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 ═══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Brand Details</SectionTitle>

            <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/40">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Import from URL</span>
                <span className="text-xs text-gray-400 ml-auto">Auto-fills brand info</span>
              </div>
              <div className="flex gap-2">
                <input type="url" value={brandUrl} onChange={(e) => setBrandUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleImportBrand()}
                  placeholder="https://yourdomain.com/" className={inputCls} />
                <button onClick={handleImportBrand} disabled={importingBrand || !brandUrl.trim()}
                  className="px-5 py-1.5 bg-blue-600 cursor-pointer text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shrink-0">
                  {importingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand Name" required>
                <input type="text" value={formData.brandName} onChange={(e) => field("brandName", e.target.value)} placeholder="Your Brand" className={inputCls} />
              </Field>
              <Field label="Project Name">
                <input type="text" value={formData.projectName || ""} onChange={(e) => field("projectName", e.target.value)} placeholder="Campaign Name" className={inputCls} />
              </Field>
            </div>

            <Field label="Description">
              <textarea value={formData.description} onChange={(e) => field("description", e.target.value)}
                placeholder="Brief description of your brand or campaign…" rows={3} className={`${inputCls} resize-none`} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              {["primaryColor", "secondaryColor"].map((f) => (
                <Field key={f} label={f === "primaryColor" ? "Primary Color" : "Secondary Color"}>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={formData[f]} onChange={(e) => field(f, e.target.value)}
                      className="w-10 h-10 border border-gray-200 rounded-lg cursor-pointer p-1 shrink-0" />
                    <input type="text" value={formData[f]} onChange={(e) => field(f, e.target.value)}
                      className={`${inputCls} flex-1 min-w-0`} />
                  </div>
                </Field>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Font">
                <select value={formData.font} onChange={(e) => field("font", e.target.value)} className={`${inputCls} bg-white cursor-pointer`}>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Logo">
                <div className="flex items-center gap-2">
                  <button onClick={() => logoInputRef.current?.click()}
                    className="flex-1 px-3 py-2.5 border cursor-pointer border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 flex items-center gap-2 transition">
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

            <div className="grid grid-cols-2 gap-4">
              <Field label="Caption">
                <div className="relative">
                  <input type="text" value={formData.caption} maxLength={280}
                    onChange={(e) => field("caption", e.target.value)}
                    placeholder="Your ad message" className={`${inputCls} pr-10`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {280 - (formData.caption?.length || 0)}
                  </span>
                </div>
              </Field>
              <Field label="Hashtags">
                <input type="text"
                  value={Array.isArray(formData.hashtags) ? formData.hashtags.join(" ") : ""}
                  onChange={(e) => field("hashtags", e.target.value.split(" ").filter(Boolean))}
                  placeholder="#Brand #Ad" className={inputCls} />
              </Field>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 ═══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle>Size, Goals & Audience</SectionTitle>

            <Field label="Ad Size">
              <div className="grid grid-cols-4 gap-2">
                {SIZE_OPTIONS.map((s) => (
                  <button key={s.value} onClick={() => field("size", s.value)}
                    className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${formData.size === s.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}>
                    <p className="text-xs font-semibold">{s.label}</p>
                    <p className={`text-[10px] mt-0.5 ${formData.size === s.value ? "text-blue-500" : "text-gray-400"}`}>{s.value}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Campaign Goal">
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_GOALS.map((g) => (
                  <button key={g} onClick={() => field("campaignGoal", g)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${formData.campaignGoal === g ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}>
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Audience">
              <div className="grid grid-cols-3 gap-2">
                {AUDIENCES.map((a) => (
                  <button key={a.value} onClick={() => field("audience", a.value)}
                    className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${formData.audience === a.value ? "border-blue-600 bg-blue-50" : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}>
                    <p className={`text-xs font-semibold ${formData.audience === a.value ? "text-blue-700" : "text-gray-700"}`}>{a.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="File Format">
              <div className="flex gap-2">
                {FILE_FORMATS.map((f) => (
                  <button key={f} onClick={() => field("fileFormat", f)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${formData.fileFormat === f ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                      }`}>
                    {f}{f === "PNG" && " ✓"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ═══ STEP 3 ═══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col ">
            <div className="flex items-center justify-between">
              <SectionTitle>Background Image</SectionTitle>
              {selectedImages.length > 0 && (
                <button
                  onClick={handleApplySelected}
                  className="px-4 py-2 bg-blue-600 cursor-pointer text-white text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply ({selectedImages.length})
                </button>
              )}
            </div>

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

            {/* ── Selected media — EXACT render logic from Posts ────────────── */}
            {croppedImages.length > 0 && (
              <div className="py-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Selected media</p>
                <div className="grid grid-cols-5 gap-2">
                  {croppedImages.map((item, index) => {
                    // Posts' exact safe URL extraction
                    const url =
                      item?.previewUrl ||
                      (item instanceof File || item instanceof Blob
                        ? URL.createObjectURL(item)
                        : null);

                    // Posts' exact video detection
                    const isVideo =
                      item?.videoSrc || item?.type?.includes?.("video");

                    return (
                      <div key={index} className="relative group">
                        {url ? (
                          isVideo ? (
                            <video
                              src={item.videoSrc || url}
                              poster={item.thumbnail}
                              className="w-full h-auto object-cover rounded-md border border-gray-200 shadow"
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              onMouseEnter={(e) => e.target.play().catch(() => { })}
                              onMouseLeave={(e) => {
                                e.target.pause();
                                e.target.currentTime = 0;
                              }}
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`Selected ${index + 1}`}
                              className="w-full h-auto object-cover rounded-md border border-gray-200 shadow"
                            />
                          )
                        ) : (
                          <div className="w-full h-32 bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-500">No media</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCroppedImage(index);
                          }}
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

            {/* ── Upload / source zone ─────────────────────────────────────── */}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                <FileUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Upload or Select Background</p>
                <p className="text-xs text-gray-400 mt-1">From library, web search, or AI generation</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <MediaBtn icon={FileSearch} label="Search Media" onClick={() => setSearchModalOpen(true)} />
                <MediaBtn icon={FolderOpen} label="Your Library" onClick={() => setLibraryModalOpen(true)} />
                <MediaBtn icon={Sparkles} label="Magic Media" onClick={() => setMagicModalOpen(true)} />
                <MediaBtn icon={FileUp} label="Upload File" onClick={() => fileInputRef.current?.click()} />
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
              className="px-3 py-2 bg-blue-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-blue-700 hover:scale-105 flex items-center gap-2 transition">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleGenerate}
              className="px-3 py-2 bg-blue-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-blue-700 hover:scale-105 flex items-center gap-2 transition">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Generate Ads</>}
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
        aspectRatio={undefined}
        onSave={saveCroppedImage}
        onSkip={handleSkipCrop}
        onCancel={() => {
          setShowCropper(false);
          setImageSrc([]);
          setCroppedImages([]);
        }}
        onPrevious={handlePreviousCrop}
      />

      <SearchMediaModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        selectedImages={selectedImages}
        onSelectImage={(src) =>
          setSelectedImages((p) => p.includes(src) ? p.filter((s) => s !== src) : [...p, src])
        }
        onApply={handleApplySelected}
        onCancel={handleCancelSelection}
      />

      <LibraryMediaModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        selectedImages={selectedImages}
        onSelectImage={(src) =>
          setSelectedImages((p) => p.includes(src) ? p.filter((s) => s !== src) : [...p, src])
        }
        onApply={handleApplySelected}
        onCancel={handleCancelSelection}
      />

      <MagicMediaModal
        isOpen={magicModalOpen}
        onClose={() => {
          setMagicModalOpen(false);
          setSelectedMedia([]);
        }}
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
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

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
  <button onClick={onClick}
    className={`flex items-center gap-1.5 px-4 py-2 cursor-pointer rounded-lg text-xs font-semibold transition-all ${primary
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
      }`}>
    <Icon className="w-4 h-4" /> {label}
  </button>
);

export default ImageAdsForm;