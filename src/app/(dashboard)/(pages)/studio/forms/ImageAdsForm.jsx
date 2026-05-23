"use client";
// forms/ImageAdsForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Globe, Loader2, FileUp, X, CheckCircle2, ChevronRight,
  Sparkles, FileSearch, FolderOpen, Images, Scan, ImageIcon,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import RecommendedImagesSection from "@/app/(components)/RecommendedImagesSection";
import ImportedBrandImagesSection from "@/app/(components)/ImportedBrandImagesSection";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";
import { useAuth } from "@/context/AuthContext";

const MAX_IMAGES = 5;

// ── constants ─────────────────────────────────────────────────────────────────
const SIZE_OPTIONS = [
  { category: "LinkedIn Horizontal", type_size: "1200x627" },
  { category: "LinkedIn Square",     type_size: "627x627"  },
  { category: "Google Landscape",    type_size: "1200x628" },
  { category: "Google Square",       type_size: "1200x1200"},
  { category: "TikTok Vertical",     type_size: "1080x1920"},
  { category: "Meta Square",         type_size: "1080x1080"},
  { category: "Meta Vertical",       type_size: "1080x1350"},
  { category: "Meta Stories/Reels",  type_size: "1080x1921"},
];

const CAMPAIGN_GOALS = ["Brand Awareness", "Engagement", "Sales", "Lead Generation", "Website Traffic"];
const AUDIENCES = [
  { value: "B2B",           label: "B2B",           desc: "Business owners, startups, agencies" },
  { value: "B2C",           label: "B2C",           desc: "End consumers, everyday users" },
  { value: "Casual",        label: "Casual",        desc: "Broad social media audience" },
  { value: "Inspirational", label: "Inspirational", desc: "Entrepreneurs & creators" },
  { value: "Sales",         label: "Sales",         desc: "Hot leads, ad audiences" },
];
const FILE_FORMATS = ["PNG", "JPEG", "WEBP", "AVIF"];
const FONT_OPTIONS = ["Montserrat", "Playfair Display", "Roboto", "Georgia", "Helvetica", "Arial"];
const STEPS = [
  { id: 1, label: "Brand Details",        icon: ImageIcon },
  { id: 2, label: "Size, Goals & Audience", icon: Scan    },
  { id: 3, label: "Background Image",     icon: Images   },
];

const VISUAL_STYLES = [
  { value: "minimal",   label: "Minimal"   },
  { value: "bold",      label: "Bold"      },
  { value: "elegant",   label: "Elegant"   },
  { value: "playful",   label: "Playful"   },
  { value: "corporate", label: "Corporate" },
  { value: "modern",    label: "Modern"    },
  { value: "neon",      label: "Neon"      },
  { value: "pastel",    label: "Pastel"    },
];

const BRAND_COLORS = [
  "#2563eb", "#0ea5e9", "#8b5cf6", "#ec4899", "#ef4444",
];

// ── helpers ───────────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

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

// ── main component ────────────────────────────────────────────────────────────
const ImageAdsForm = ({
  formData, setFormData, activeBrand, sendUrl, showToast,
  onResult, generateCustomCreative, creative, categoryId,
  fetchDesignTemplates, // ← new prop passed from StudioPage via commonProps
}) => {
  const { uploadImage, activeBrandId } = useAuth();

  const [step, setStep]               = useState(1);
  const [error, setError]             = useState("");
  const [brandUrl, setBrandUrl]       = useState(activeBrand?.url || activeBrand?.source_url || "");
  const [importingBrand, setImportingBrand] = useState(false);
  const [generating, setGenerating]   = useState(false);

  // Tracks which size option is selected: { category, type_size }
  const [selectedSize, setSelectedSize] = useState(null);

  // ── IMAGE STATE ──────────────────────────────────────────────────────────
  const [imageSrc, setImageSrc]               = useState([]);
  const [croppedImages, setCroppedImages]     = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper]         = useState(false);
  const [crop, setCrop]                       = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop]     = useState(null);
  const [imageSrcMeta, setImageSrcMeta]       = useState([]);

  const cropperRef   = useRef(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [recommendedImages, setRecommendedImages] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen]     = useState(false);

  useEffect(() => {
    if (!formData.brandName?.trim()) return;
    const t = setTimeout(async () => {
      setLoadingRecommended(true);
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(formData.brandName)}&per_page=8`);
        const d   = await res.json();
        setRecommendedImages(
          (d.photos || []).map((p) => ({ id: p.id, src: p.src.medium, large: p.src.large2x, alt: p.alt || "" }))
        );
      } catch { setRecommendedImages([]); }
      finally { setLoadingRecommended(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [formData.brandName]);

  useEffect(() => {
    const first = croppedImages.find(Boolean);
    if (first?.previewUrl) setFormData((p) => ({ ...p, backgroundImage: first.previewUrl }));
  }, [croppedImages]);

  useEffect(() => { setCompletedCrop(null); }, [currentCropIndex]);

  // ── field helper ─────────────────────────────────────────────────────────
  const field = (key, value) => {
    if (key === "brandColor") value = value.startsWith("#") ? value : `#${value}`;
    setFormData((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "brandColor" && { primaryColor: value }),
    }));
    setError("");
  };

  // ── URL import ───────────────────────────────────────────────────────────
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
        primaryColor: d.primary_color, secondaryColor: d.secondary_color || "#0ea5e9",
        font: d.font || "Montserrat", caption: `Discover ${d.name}!`,
        hashtags: ["#ImageAd", "#Brand"], logo: d.logo || "",
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

  // ── File / crop helpers (identical to original) ──────────────────────────
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
  }, [completedCrop, currentCropIndex, imageSrc.length]);

  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url).then((r) => r.blob()).then((blob) => {
      const file     = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
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
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
      setCompletedCrop(null);
    }
  };

  // ── Step nav ─────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !formData.brandName)
      return setError("Brand name is required.");
    if (step === 2 && (!selectedSize || !formData.campaignGoal || !formData.audience || !formData.fileFormat))
      return setError("Please complete all fields before continuing.");
    if (step === 3 && croppedImages.filter(Boolean).length === 0)
      return setError("Select at least one background image.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate: fetch templates first, then customGenerate ─────────────────
  // const handleGenerate = async () => {
  //   if (!selectedSize) return setError("Please select an ad size.");
  //   const validImages = croppedImages.filter(Boolean);

  //   setGenerating(true);
  //   setError("");

  //   // ── 1. Fetch canvas templates ──────────────────────────────────────────
  //   const templateRes = await fetchDesignTemplates({
  //     type:      "image",                  // always "image" for this form
  //     category:  selectedSize.category,    // e.g. "Meta Square"
  //     type_size: selectedSize.type_size,   // e.g. "1080x1080"
  //   });

  //   if (!templateRes.ok) {
  //     setError(templateRes.message || "Could not fetch design templates. Please try again.");
  //     setGenerating(false);
  //     return;
  //   }

  //   const templates = templateRes.data; // array
  //   if (!templates || templates.length === 0) {
  //     setError("No templates found for the selected size. Try a different size.");
  //     setGenerating(false);
  //     return;
  //   }

  //   // Take first 2 templates to send downstream
  //   const selectedTemplates = templates.slice(0, 2);

  //   // ── 2. Call custom generate with templates + form data ─────────────────
  //   const payload = {
  //     creativeType:      creative?.id,
  //     categoryType:      categoryId,
  //     brandName:         formData.brandName    || null,
  //     description:       formData.description  || null,
  //     brandColor:        formData.brandColor   ?? null,
  //     logo:              formData.logo         || null,
  //     visualStyle:       formData.visualStyle  || null,
  //     font:              formData.font         || null,
  //     sourceUrl:         brandUrl              || null,
  //     // ── size fields ──
  //     category:          selectedSize.category,   // "Meta Square"
  //     type_size:         selectedSize.type_size,  // "1080x1080"
  //     // ── rest ──
  //     campaignGoal:      formData.campaignGoal || null,
  //     audience:          formData.audience     || null,
  //     fileFormat:        formData.fileFormat   || null,
  //     caption:           formData.caption      || null,
  //     images: validImages
  //       .map((f) => f?.sourceUrl || f?.previewUrl)
  //       .filter(Boolean),
  //     templates:         selectedTemplates,        // first 2 from fetch
  //     generatedAt:       new Date().toISOString(),
  //   };

  //   const result = await generateCustomCreative(payload);

  //   if (!result.ok) {
  //     setError(result.message || "Generation failed. Please try again.");
  //     setGenerating(false);
  //     return;
  //   }

  //   const data = result.data;

  //   if (data?.type === "design" && Array.isArray(data?.variations) && data.variations.length) {
  //     onResult({
  //       type:       "design",
  //       variations: data.variations,
  //       reply:      data.reply || "",
  //       meta:       data.meta  || {},
  //       payload,
  //       raw:        data,
  //     });
  //   } else {
  //     onResult({
  //       assets:  data?.assets || [],
  //       payload,
  //       raw:     data,
  //     });
  //   }

  //   setGenerating(false);
  // };

  const handleGenerate = async () => {
  if (!selectedSize) {
    return setError("Please select an ad size.");
  }

  const validImages = croppedImages.filter(Boolean);

  setGenerating(true);
  setError("");

  try {
    // ─────────────────────────────────────────────
    // 1. FETCH DESIGN TEMPLATES FIRST
    // ─────────────────────────────────────────────
    const templateRes = await fetchDesignTemplates({
      type: "image",
      category: selectedSize.category,   // "Meta Square"
      type_size: selectedSize.type_size, // "1080x1080"
    });

    if (!templateRes.ok) {
      setGenerating(false);
      return setError(
        templateRes.message || "Failed to fetch templates."
      );
    }

    // API returns:
    // { designs: [...] }

  const templates = templateRes.data || [];

    if (!templates.length) {
      setGenerating(false);
      return setError("No templates found for this size.");
    }

    // Use ALL templates — generateCustomCreative will batch them in pairs
    const selectedTemplates = templates;

    console.log("🎨 Selected Templates:", selectedTemplates);

    // ─────────────────────────────────────────────
    // 2. RESOLVE IMAGE URLs — upload File items to /image-gallery
    // ─────────────────────────────────────────────
    const resolvedUrls = await Promise.all(
      validImages.map(async (item) => {
        if (typeof item?.sourceUrl === "string" && item.sourceUrl.startsWith("http")) {
          return item.sourceUrl;
        }
        if (item instanceof File) {
          try {
            const result = await uploadImage(item);
            const url =
              result?.image_url ||
              result?.url ||
              result?.data?.image_url ||
              null;
            return typeof url === "string" && url.startsWith("http") ? url : null;
          } catch (err) {
            console.error("uploadImage failed:", err);
            return null;
          }
        }
        if (typeof item?.previewUrl === "string" && item.previewUrl.startsWith("http")) {
          return item.previewUrl;
        }
        return null;
      })
    );

    const imageUrls = resolvedUrls.filter(Boolean);

    // ─────────────────────────────────────────────
    // 3. SEND TO CUSTOM GENERATE ENDPOINT
    // ─────────────────────────────────────────────
    const payload = {
      creativeType: creative?.id,
      categoryType: categoryId,
      brand_id: activeBrandId,

      brandName: formData.brandName || null,
      description: formData.description || null,

      brandColor: formData.brandColor || null,
      logo: formData.logo || null,


      font: formData.font || null,

      sourceUrl: brandUrl || null,

      campaignGoal: formData.campaignGoal || null,
      audience: formData.audience || null,
      fileFormat: formData.fileFormat || null,

      caption: formData.caption || null,

      category: selectedSize.category
        ?.toLowerCase()
        .replace(/\s+/g, "_"),

      type_size: selectedSize.type_size,

      images: imageUrls,

      // 👇 FIRST 2 TEMPLATE OBJECTS
      templates: selectedTemplates,

      generatedAt: new Date().toISOString(),
    };

    console.log("🚀 Final Generate Payload:", payload);

    let isFirstBatch = true;
    const result = await generateCustomCreative(payload, (batch) => {
      if (!batch.ok) return; // failure handled below
      const variations = batch.variations || [];
      const assets = batch.assets || [];
      if (isFirstBatch) {
        isFirstBatch = false;
        // Hide overlay so user sees first batch immediately
        setGenerating(false);
        onResult({
          type: "design",
          variations,
          assets,
          reply: batch.data?.reply || "",
          meta: batch.data?.meta || {},
          payload,
          raw: batch.data,
        });
      } else {
        onResult({
          type: "design",
          variations,
          assets,
          append: true,
        });
      }
    });
    console.log(" GENERATE RESULT:", result);

    if (!result.ok) {
      setGenerating(false);
      showToast(result.message || "Generation failed.");
      return setError(result.message || "Generation failed.");
    }

    // Make sure overlay is hidden if it never got dismissed (e.g., zero variations)
    setGenerating(false);
  } catch (err) {
    console.error("handleGenerate error:", err);

    setError(
      err.message || "Something went wrong."
    );
  } finally {
    setGenerating(false);
  }
};

  // ── Media picker apply ────────────────────────────────────────────────────
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
            const fetchUrl = url.startsWith("http") ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url;
            const res      = await fetch(fetchUrl);
            const blob     = await res.blob();
            const file     = new File([blob], `selected-${Date.now()}-${idx}`, { type: blob.type || "image/png" });
            file.previewUrl = URL.createObjectURL(blob);
            file.sourceUrl  = item.large || item.src || null;
            return file;
          })
        );
        const previewUrls = processedFiles.map((f) => f.previewUrl);
        const sourceUrls  = processedFiles.map((f) => f.sourceUrl || null);
        if (!showCropper) {
          setImageSrc(previewUrls); setImageSrcMeta(sourceUrls);
          setCroppedImages(Array(previewUrls.length).fill(null)); setCurrentCropIndex(0);
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
        id: `video-${Date.now()}-${i}`, previewUrl: src, thumbnail: src, type: "video",
      }));
      setCroppedImages((prev) => [...prev, ...videoObjects]);
      showToast(`Added ${media.length} media item(s)`);
    }
    setMediaPickerOpen(false);
  };

  const handleBrandImageUse = (imageObjs) => {
    const remaining = Math.max(0, MAX_IMAGES - croppedImages.filter(Boolean).length);
    const toAdd = imageObjs.slice(0, remaining);
    if (toAdd.length === 0) {
      showToast(`Max ${MAX_IMAGES} items reached.`);
      return;
    }
    const pseudos = toAdd.map((imageObj) => ({
      previewUrl: imageObj.src, sourceUrl: imageObj.src,
      name: imageObj.alt || "brand-image", type: "image/jpeg",
    }));
    setCroppedImages((prev) => [...prev, ...pseudos]);
    if (toAdd.length < imageObjs.length) {
      showToast(`Only ${toAdd.length} added — max ${MAX_IMAGES} reached.`);
    } else {
      showToast(`${pseudos.length} image${pseudos.length > 1 ? "s" : ""} added ✓`);
    }
  };

  const handleBrandImageCrop = async (imageObjs) => {
    const remaining = Math.max(0, MAX_IMAGES - croppedImages.filter(Boolean).length);
    const toAdd = imageObjs.slice(0, remaining);
    if (toAdd.length === 0) {
      showToast(`Max ${MAX_IMAGES} items reached.`);
      return;
    }
    for (const imageObj of toAdd) {
      const originalUrl = imageObj.src;
      let cropperUrl    = originalUrl;
      try {
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(originalUrl)}`);
        const blob = await res.blob();
        cropperUrl = URL.createObjectURL(blob);
      } catch (err) { console.warn("Proxy failed, falling back to original URL", err); }
      setImageSrc((prev) => [...prev, cropperUrl]);
      setImageSrcMeta((prev) => [...prev, originalUrl]);
      setCroppedImages((prev) => [...prev, null]);
    }
    if (!showCropper) setCurrentCropIndex(0);
    setShowCropper(true);
    if (toAdd.length < imageObjs.length) {
      showToast(`Only ${toAdd.length} queued — max ${MAX_IMAGES} reached.`);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Step indicator */}
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
                    ${step > s.id  ? "border-blue-600 bg-blue-600 text-white"
                    : step === s.id ? "border-blue-600 text-blue-600 bg-white"
                    : "border-gray-200 text-gray-300"}`}>
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

      {/* Step content */}
      <div className="bg-white px-2 rounded-lg py-2 flex flex-col gap-6">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 ════════════════════════════════════════════════════════ */}
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

            <Field label="Brand Name / Project Name" required>
              <input type="text" value={formData.brandName}
                onChange={(e) => field("brandName", e.target.value)}
                placeholder="Your Brand" className={inputCls} />
            </Field>

            <Field label="Description">
              <textarea value={formData.description}
                onChange={(e) => field("description", e.target.value)}
                placeholder="Brief description of your brand or campaign…"
                rows={3} className={`${inputCls} resize-none`} />
            </Field>

            <Field label="Visual Style">
              <div className="flex flex-wrap py-1 gap-2">
                {VISUAL_STYLES.map((s) => (
                  <button key={s.value} onClick={() => field("visualStyle", s.value)}
                    className={`px-3 py-1 rounded-md border cursor-pointer transition-all
                      ${formData.visualStyle === s.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"}`}>
                    <span className={`text-xs font-semibold
                      ${formData.visualStyle === s.value ? "text-blue-700" : "text-gray-500"}`}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand Color">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap max-w-50">
                    {BRAND_COLORS.map((hex) => (
                      <button key={hex} onClick={() => field("brandColor", hex)}
                        className={`w-7 h-7 rounded-md cursor-pointer border-2 transition-transform hover:scale-110
                          ${formData.brandColor === hex ? "border-gray-800 scale-110" : "border-transparent"}`}
                        style={{ background: hex }} title={hex} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <label
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 transition hover:scale-105"
                      style={{ background: formData.brandColor }}>
                      <input type="color" value={formData.brandColor}
                        onChange={(e) => field("brandColor", e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer" />
                    </label>
                    <input type="text" value={formData.brandColor}
                      onChange={(e) =>
                        /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && field("brandColor", e.target.value)}
                      className={`${inputCls} w-22.5! flex-none px-2 text-sm font-mono`}
                      maxLength={7} />
                  </div>
                </div>
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
          </div>
        )}

        {/* ═══ STEP 2 ════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <SectionTitle>Size, Goals & Audience</SectionTitle>

            {/* ── Size picker: shows both name and dimensions ── */}
            <Field label="Ad Size">
              <div className="grid grid-cols-4 gap-2">
                {SIZE_OPTIONS.map((s) => {
                  const active = selectedSize?.type_size === s.type_size;
                  return (
                    <button
                      key={s.type_size}
                      onClick={() => { setSelectedSize(s); setError(""); }}
                      className={`text-left px-2 py-2.5 cursor-pointer rounded-lg border-2 transition-all
                        ${active
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"}`}>
                      <p className="text-xs font-semibold leading-tight">{s.category}</p>
                      <p className={`text-[10px] mt-1 font-mono ${active ? "text-blue-500" : "text-gray-400"}`}>
                        {s.type_size}
                      </p>
                    </button>
                  );
                })}
              </div>
              {selectedSize && (
                <p className="text-xs text-blue-600 font-medium mt-1">
                  Selected: {selectedSize.category} ({selectedSize.type_size})
                </p>
              )}
            </Field>

            <Field label="Campaign Goal">
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_GOALS.map((g) => (
                  <button key={g} onClick={() => field("campaignGoal", g)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all
                      ${formData.campaignGoal === g
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Audience">
              <div className="grid grid-cols-3 gap-2">
                {AUDIENCES.map((a) => (
                  <button key={a.value} onClick={() => field("audience", a.value)}
                    className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all
                      ${formData.audience === a.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"}`}>
                    <p className={`text-xs font-semibold ${formData.audience === a.value ? "text-blue-700" : "text-gray-700"}`}>
                      {a.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="File Format">
              <div className="flex gap-2">
                {FILE_FORMATS.map((f) => (
                  <button key={f} onClick={() => field("fileFormat", f)}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all
                      ${formData.fileFormat === f
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"}`}>
                    {f}{f === "PNG" && " ✓"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ═══ STEP 3 ════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <SectionTitle>Select Images</SectionTitle>

            <BrandImagesStrip
              onSelect={handleBrandImageUse}
              onCrop={handleBrandImageCrop}
              selectedUrls={croppedImages
                .filter(Boolean)
                .map((f) => f?.sourceUrl || f?.previewUrl)
                .filter(Boolean)}
            />

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
                          <video src={url} poster={item.thumbnail}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                            muted loop playsInline preload="metadata"
                            onMouseEnter={(e) => e.target.play().catch(() => {})}
                            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }} />
                        ) : url ? (
                          <img src={url} alt={`Selected ${index + 1}`}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 border-2 border-dashed rounded-xl flex items-center justify-center">
                            <span className="text-xs text-gray-400">No media</span>
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); removeCroppedImage(index); }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              onClick={() => setMediaPickerOpen(true)}>
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                <FileUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Upload or Search More Images</p>
                <p className="text-xs text-gray-400 mt-1">Search web, magic studio, or upload from device</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setMediaPickerOpen(true); }}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer flex items-center gap-2">
                <Images className="w-4 h-4" /> Choose Media
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={`flex gap-3 pt-2 ${step > 1 ? "justify-between" : "justify-end"}`}>
          {step > 1 && (
            <button onClick={() => setStep((p) => p - 1)}
              className="px-3 py-2 cursor-pointer border border-gray-200 hover:scale-105 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={handleContinue}
              className="px-3 py-2 bg-blue-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-blue-700 hover:scale-105 flex items-center gap-2 transition">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleGenerate} disabled={generating}
              className="px-3 py-2 bg-blue-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-blue-700 hover:scale-105 flex items-center gap-2 transition disabled:opacity-60">
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                : <><Sparkles className="w-4 h-4" /> Generate Ads</>}
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
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
        onCancel={() => { setShowCropper(false); setImageSrc([]); setImageSrcMeta([]); setCroppedImages([]); }}
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
        maxSelectable={Math.max(0, MAX_IMAGES - croppedImages.filter(Boolean).length)}
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

export default ImageAdsForm;