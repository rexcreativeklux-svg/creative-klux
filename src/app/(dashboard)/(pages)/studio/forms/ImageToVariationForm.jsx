"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Loader2, X, Upload, ImagePlus, FileSearch, FolderOpen,
  FileUp, Sparkles, Images,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ──────────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { value: "Vintage Sepia", label: "Vintage Sepia" },
  { value: "Futuristic Cyberpunk", label: "Cyberpunk" },
  { value: "Watercolor Painting", label: "Watercolor" },
  { value: "Pixel Art", label: "Pixel Art" },
  { value: "Oil Painting", label: "Oil Painting" },
  { value: "Sketch Drawing", label: "Sketch" },
  { value: "Cartoon Style", label: "Cartoon" },
  { value: "Abstract Art", label: "Abstract" },
  { value: "Cinematic", label: "Cinematic" },
  { value: "Minimalist", label: "Minimalist" },
];

// ── theme: pink ────────────────────────────────────────────────────────────────
const T = {
  border: "border-pink-700",
  bg: "bg-pink-700",
  bgHover: "hover:bg-pink-800",
  bgLight: "bg-pink-50",
  textDark: "text-pink-700",
  pill: "border-pink-700 bg-pink-50 text-pink-700",
};

// ─────────────────────────────────────────────────────────────────────────────

const ImageToVariationsForm = ({
  formData,
  setFormData,
  activeBrand,
  showToast,
  onResult,
}) => {
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  // ── image state (mirrors ImageAdsForm exactly) ────────────────────────────
  const [imageSrc, setImageSrc] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageSrcMeta, setImageSrcMeta] = useState([]);

  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── modal ─────────────────────────────────────────────────────────────────
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // ── style ─────────────────────────────────────────────────────────────────
  const [style, setStyle] = useState(STYLE_OPTIONS[0].value);

  // reset completedCrop on index change
  useEffect(() => { setCompletedCrop(null); }, [currentCropIndex]);

  // ── file upload ───────────────────────────────────────────────────────────
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

  // ── save crop ─────────────────────────────────────────────────────────────
  const saveCroppedImage = useCallback(async () => {
    if (!completedCrop || !cropperRef.current) return;
    const image = cropperRef.current.cropper?.getImage?.();
    if (!image) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
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
    file.sourceUrl = imageSrcMeta[currentCropIndex] || null;

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

  // ── skip crop ─────────────────────────────────────────────────────────────
  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url).then((r) => r.blob()).then((blob) => {
      const file = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
      file.previewUrl = url;
      file.sourceUrl = imageSrcMeta[currentCropIndex] || null;
      setCroppedImages((prev) => { const u = [...prev]; u[currentCropIndex] = file; return u; });
      if (currentCropIndex < imageSrc.length - 1) {
        setCurrentCropIndex((prev) => prev + 1);
        setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      } else {
        setShowCropper(false);
      }
    });
  };

  // ── previous crop ─────────────────────────────────────────────────────────
  const handlePreviousCrop = () => {
    if (currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
      setCompletedCrop(null);
    }
  };

  // ── remove image ──────────────────────────────────────────────────────────
  const removeCroppedImage = (idx) => {
    setCroppedImages((prev) => prev.filter((_, i) => i !== idx));
    setImageSrc((prev) => prev.filter((_, i) => i !== idx));
    setImageSrcMeta((prev) => prev.filter((_, i) => i !== idx));
    if (idx <= currentCropIndex && currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
    }
  };

  // ── brand image handlers ──────────────────────────────────────────────────
  const handleBrandImageUse = (imageObjs) => {
    const pseudos = imageObjs.map((imageObj) => ({
      previewUrl: imageObj.src,
      sourceUrl: imageObj.src,
      name: imageObj.alt || "brand-image",
      type: "image/jpeg",
    }));
    setCroppedImages((prev) => [...prev, ...pseudos]);
    showToast(`${pseudos.length} image${pseudos.length > 1 ? "s" : ""} added ✓`);
  };

  const handleBrandImageCrop = async (imageObjs) => {
    for (const imageObj of imageObjs) {
      const originalUrl = imageObj.src;
      let cropperUrl = originalUrl;
      try {
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(originalUrl)}`);
        const blob = await res.blob();
        cropperUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.warn("Proxy failed, falling back to original URL", err);
      }
      setImageSrc((prev) => [...prev, cropperUrl]);
      setImageSrcMeta((prev) => [...prev, originalUrl]);
      setCroppedImages((prev) => [...prev, null]);
    }
    if (!showCropper) setCurrentCropIndex(0);
    setShowCropper(true);
  };

  // ── media picker apply ────────────────────────────────────────────────────
  const handleApplyFromPicker = async (images, media) => {
    if (images.length > 0) {
      try {
        const processedFiles = await Promise.all(
          images.map(async (item, idx) => {
            if (item.file instanceof File) {
              item.file.previewUrl = item.src;
              item.file.sourceUrl = null;
              return item.file;
            }
            const url = item.large || item.src;
            const fetchUrl = url.startsWith("http")
              ? `/api/proxy-image?url=${encodeURIComponent(url)}`
              : url;
            const res = await fetch(fetchUrl);
            const blob = await res.blob();
            const file = new File([blob], `selected-${Date.now()}-${idx}`, { type: blob.type || "image/png" });
            file.previewUrl = URL.createObjectURL(blob);
            file.sourceUrl = item.large || item.src || null;
            return file;
          })
        );

        const previewUrls = processedFiles.map((f) => f.previewUrl);
        const sourceUrls = processedFiles.map((f) => f.sourceUrl || null);

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
        id: `video-${Date.now()}-${i}`,
        previewUrl: src,
        thumbnail: src,
        type: "video",
      }));
      setCroppedImages((prev) => [...prev, ...videoObjects]);
      showToast(`Added ${media.length} media item(s)`);
    }

    setMediaPickerOpen(false);
  };

  // ── generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (croppedImages.filter(Boolean).length === 0) {
      return setError("Please upload at least one image.");
    }
    setError("");
    setGenerating(true);

    const prompt = [
      "professional creative variation",
      "different angle, lighting, composition",
      style || "high quality",
    ].filter(Boolean).join(", ");

    try {
      const res = await fetch(`/api/pexels?query=${encodeURIComponent(prompt)}&per_page=16`);
      const data = await res.json();

      const variations = (data.photos || []).slice(0, 8).map((p, i) => ({
        id: `var-${p.id}-${Date.now()}-${i}`,
        src: p.src.medium,
        large: p.src.large2x,
        alt: p.alt || `Variation ${i + 1}`,
        type: "image",
      }));

      if (onResult) onResult({ assets: variations });
    } catch (err) {
      setError("Failed to generate variations. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const hasImages = croppedImages.filter(Boolean).length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-white rounded-lg p-2 flex flex-col gap-5">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* Visual Style — text-only pills, always one active */}
        <Field label="Visual Style">
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${style === s.value
                    ? T.pill
                    : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Brand images strip */}
        <BrandImagesStrip
          onSelect={handleBrandImageUse}
          onCrop={handleBrandImageCrop}
          selectedUrls={croppedImages
            .filter(Boolean)
            .map((f) => f?.sourceUrl || f?.previewUrl)
            .filter(Boolean)}
        />

        {/* Selected image previews */}
        {hasImages && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">
              Selected ({croppedImages.filter(Boolean).length})
            </p>
            <div className="grid grid-cols-5 gap-2">
              {croppedImages.map((item, index) => {
                if (!item) return null;
                const url = item?.previewUrl;
                const isVideo = item?.type?.includes?.("video");
                return (
                  <div key={index} className="relative group">
                    {isVideo ? (
                      <video
                        src={url} poster={item.thumbnail}
                        className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                        muted loop playsInline preload="metadata"
                        onMouseEnter={(e) => e.target.play().catch(() => { })}
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

        {/* Upload / picker zone */}
        <div
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 flex flex-col items-center gap-3 cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 transition-all"
          onClick={() => setMediaPickerOpen(true)}
        >
          <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
            <FileUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Upload or Search Images</p>
            <p className="text-xs text-gray-400 mt-1">Search web, magic studio, or upload from device</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setMediaPickerOpen(true); }}
            className="px-5 py-2 bg-pink-700 text-white text-sm font-semibold rounded-xl hover:bg-pink-800 transition cursor-pointer flex items-center gap-2"
          >
            <Images className="w-4 h-4" /> Choose Images
          </button>
        </div>



        {/* Generate */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`px-4 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {generating
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Sparkles className="w-4 h-4" /> Generate Variations</>
            }
          </button>
        </div>
      </div>

      {/* Cropper Modal */}
      <ImageCropperModal
        isOpen={showCropper}
        ref={cropperRef}
        imageSrc={imageSrc[currentCropIndex]}
        currentIndex={currentCropIndex}
        totalImages={imageSrc.length}
        crop={crop}
        onCropChange={setCrop}
        onCropComplete={setCompletedCrop}
        aspectRatio={1}
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

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onCancel={() => setMediaPickerOpen(false)}
        onApply={handleApplyFromPicker}
        postData={formData}
        activeBrand={activeBrand}
        showToast={showToast}
      />

      {/* Generating overlay */}
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

// ── shared micro-components ────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent";

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default ImageToVariationsForm;