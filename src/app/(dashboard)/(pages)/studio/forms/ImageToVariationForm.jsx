"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Loader2, X, ChevronRight, Upload, ImagePlus, LayoutTemplate,
  FileSearch, FolderOpen, FileUp, Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SearchMediaModal from "@/app/(components)/SearchMediaModal";
import LibraryMediaModal from "@/app/(components)/LibraryMediaModal";
import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ──────────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { value: "Vintage Sepia",       label: "Vintage Sepia",       image: "https://images.pexels.com/photos/302820/pexels-photo-302820.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "Futuristic Cyberpunk",label: "Cyberpunk",           image: "https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "Watercolor Painting", label: "Watercolor",          image: "https://images.pexels.com/photos/1053687/pexels-photo-1053687.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "Pixel Art",           label: "Pixel Art",           image: "https://images.pexels.com/photos/1293261/pexels-photo-1293261.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "Oil Painting",        label: "Oil Painting",        image: "https://images.pexels.com/photos/1642125/pexels-photo-1642125.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "Sketch Drawing",      label: "Sketch",              image: "https://images.pexels.com/photos/4740260/pexels-photo-4740260.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "3D Render",           label: "3D Render",           image: "https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "Cartoon Style",       label: "Cartoon",             image: "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "Black & White",       label: "Black & White",       image: "https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=200" },
  { value: "Abstract Art",        label: "Abstract",            image: "https://images.pexels.com/photos/1812960/pexels-photo-1812960.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "Cinematic",           label: "Cinematic",           image: "https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "Minimalist",          label: "Minimalist",          image: "https://images.pexels.com/photos/583842/pexels-photo-583842.jpeg?auto=compress&cs=tinysrgb&w=200" },
];

const VARIATION_FOCUS_OPTIONS = [
  "Lighting",
  "Angle",
  "Color Palette",
  "Composition",
  "Background",
  "Texture",
  "Mood",
  "Season",
];

const OUTPUT_COUNT_OPTIONS = [
  { value: 4,  label: "4",  desc: "Quick preview" },
  { value: 8,  label: "8",  desc: "More variety" },
  { value: 12, label: "12", desc: "Full spread" },
  { value: 16, label: "16", desc: "Maximum" },
];

const STEPS = [
  { id: 1, label: "Upload & Style",   icon: ImagePlus },
  { id: 2, label: "Output Settings",  icon: LayoutTemplate },
];

// ── theme: blue (matching the page's blue-700 accent) ─────────────────────────
const T = {
  border:       "border-blue-700",
  bg:           "bg-blue-700",
  bgHover:      "hover:bg-blue-800",
  bgLight:      "bg-blue-50",
  textDark:     "text-blue-700",
  importBg:     "bg-blue-50/40",
  importBorder: "border-blue-100",
  stepActive:   "border-blue-700 bg-blue-700 text-white",
  stepCurrent:  "border-blue-700 text-blue-700 bg-white",
  connector:    "bg-blue-700",
  pill:         "border-blue-700 bg-blue-50 text-blue-700",
  ring:         "focus:ring-blue-500",
};

// ─────────────────────────────────────────────────────────────────────────────

const ImageToVariationsForm = ({
  formData,
  setFormData,
  activeBrand,
  showToast,
  onResult,
}) => {
  const { uploadImage, myImages = [], myImagesLoading, fetchMyImages, deleteImage } = useAuth();

  const [step,       setStep]      = useState(1);
  const [error,      setError]     = useState("");
  const [generating, setGenerating]= useState(false);

  // ── image state ────────────────────────────────────────────────────────────
  const [imageSrc,      setImageSrc]      = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [selectedImages,setSelectedImages]= useState([]);

  // ── cropper state ──────────────────────────────────────────────────────────
  const [showCropper,      setShowCropper]      = useState(false);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [crop,             setCrop]             = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop,    setCompletedCrop]    = useState(null);
  const cropperRef = useRef();

  // ── modal state ────────────────────────────────────────────────────────────
  const [searchModalOpen,  setSearchModalOpen]  = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  // ── form options state ─────────────────────────────────────────────────────
  const [style,          setStyle]          = useState("");
  const [variationFocus, setVariationFocus] = useState([]);
  const [outputCount,    setOutputCount]    = useState(8);
  const [customPrompt,   setCustomPrompt]   = useState("");
  const [preserveColors, setPreserveColors] = useState(false);
  const [preserveLayout, setPreserveLayout] = useState(false);

  const fileInputRef = useRef();

  // ── file upload handler ────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) {
      setError("Invalid format. Use JPG, PNG, GIF or WEBP.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc([reader.result]);
      setCroppedImages([file]);
      setCurrentCropIndex(0);
      setShowCropper(true);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  // ── library/search apply ───────────────────────────────────────────────────
  const handleApplySelected = () => {
    if (selectedImages.length === 0) return;
    setImageSrc(selectedImages);
    setCroppedImages(new Array(selectedImages.length).fill(null));
    setCurrentCropIndex(0);
    setShowCropper(true);
    setLibraryModalOpen(false);
    setSearchModalOpen(false);
    setSelectedImages([]);
    setError("");
  };

  const handleSelectImage = (src) => {
    setSelectedImages((prev) =>
      prev.includes(src)
        ? prev.filter((s) => s !== src)
        : prev.length < 5
        ? [...prev, src]
        : prev
    );
  };

  // ── remove uploaded image ──────────────────────────────────────────────────
  const removeImage = (i) => {
    setCroppedImages((prev) => prev.filter((_, idx) => idx !== i));
    setImageSrc((prev) => prev.filter((_, idx) => idx !== i));
  };

  // ── cropper save ───────────────────────────────────────────────────────────
  const saveCroppedImage = async () => {
    if (!completedCrop || !cropperRef.current?.cropper?.getImage()) return;

    const image  = cropperRef.current.cropper.getImage();
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
      0, 0,
      completedCrop.width, completedCrop.height
    );

    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const file = new File([blob], `cropped-${currentCropIndex}.png`, { type: "image/png" });
    const url  = URL.createObjectURL(file);

    setCroppedImages((prev) => { const u = [...prev]; u[currentCropIndex] = file; return u; });
    setImageSrc((prev)      => { const u = [...prev]; u[currentCropIndex] = url;  return u; });

    if (currentCropIndex >= imageSrc.length - 1) {
      setShowCropper(false);
    } else {
      setCurrentCropIndex((p) => p + 1);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);
    }
  };

  // ── focus toggle ───────────────────────────────────────────────────────────
  const toggleFocus = (f) =>
    setVariationFocus((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  // ── step nav ───────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && croppedImages.filter(Boolean).length === 0 && imageSrc.length === 0) {
      setError("Please upload at least one image to continue.");
      return;
    }
    setError("");
    setStep((p) => p + 1);
  };

  // ── generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (croppedImages.filter(Boolean).length === 0 && imageSrc.length === 0) {
      setError("Please upload an image first.");
      return;
    }
    setError("");
    setGenerating(true);

    const focusKeywords = variationFocus.join(", ");
    const prompt = [
      "professional creative variation",
      focusKeywords || "different angle, lighting, composition",
      style || "high quality",
      customPrompt,
      preserveColors ? "same color palette" : "",
      preserveLayout ? "same layout structure" : "",
    ]
      .filter(Boolean)
      .join(", ");

    try {
      const res  = await fetch(`/api/pexels?query=${encodeURIComponent(prompt)}&per_page=${outputCount * 2}`);
      const data = await res.json();

      const variations = (data.photos || []).slice(0, outputCount).map((p, i) => ({
        id:      `var-${p.id}-${Date.now()}-${i}`,
        src:     p.src.medium,
        large:   p.src.large2x,
        alt:     p.alt || `Variation ${i + 1}`,
        type:    "image",
      }));

      if (onResult) onResult({ assets: variations });
    } catch (err) {
      setError("Failed to generate variations. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const hasImages = imageSrc.length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Step indicator ────────────────────────────────────────────────── */}
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
                    step > s.id    ? T.stepActive
                    : step === s.id ? T.stepCurrent
                    : "border-gray-200 text-gray-300"
                  }`}>
                    {step > s.id ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
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

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg p-2 flex flex-col gap-5">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 — Upload & Style ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Upload Image</SectionTitle>

            {/* Upload zone */}
            {!hasImages ? (
              <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 py-8 px-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Drop an image or choose a source</p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP up to 10MB</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs font-medium text-gray-700 hover:border-blue-600 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleFileChange}
                    />
                  </label>
                  <button
                    onClick={() => setSearchModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs font-medium text-gray-700 hover:border-blue-600 transition-colors cursor-pointer"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    Search Images
                  </button>
                  <button
                    onClick={() => setLibraryModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs font-medium text-gray-700 hover:border-blue-600 transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Your Library
                  </button>
                </div>
              </div>
            ) : (
              /* Image preview thumbnails */
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {imageSrc.map((src, i) => (
                    <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                      <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* Add more */}
                  {imageSrc.length < 5 && (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 transition-colors shrink-0">
                      <ImagePlus className="w-4 h-4 text-gray-400" />
                      <span className="text-[10px] text-gray-400">Add more</span>
                      <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">{imageSrc.length} image{imageSrc.length > 1 ? "s" : ""} ready · click thumbnail to remove</p>
              </div>
            )}

            {/* Visual Style */}
            <Field label="Visual Style" hint="Leave empty to auto-detect from your image">
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(style === s.value ? "" : s.value)}
                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border cursor-pointer transition-all text-left ${
                      style === s.value ? `${T.border} bg-blue-50` : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <img src={s.image} alt={s.label} className="w-7 h-7 rounded-md object-cover shrink-0" />
                    <span className={`text-xs font-semibold flex-1 ${style === s.value ? T.textDark : "text-gray-700"}`}>
                      {s.label}
                    </span>
                    {style === s.value && (
                      <div className="w-4 h-4 bg-blue-700 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Field>

            {/* Variation Focus */}
            <Field label="Variation Focus" hint="What should differ between variations?">
              <div className="flex flex-wrap gap-2">
                {VARIATION_FOCUS_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFocus(f)}
                    className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                      variationFocus.includes(f)
                        ? T.pill
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Field>

            {/* Custom instructions */}
            <Field label="Additional Instructions" hint="Optional — describe specific changes">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Keep the subject centered, change the background to a studio environment…"
                rows={2}
                className={`${inputCls} resize-none placeholder:text-xs placeholder:text-gray-400`}
              />
            </Field>
          </div>
        )}

        {/* ═══ STEP 2 — Output Settings ══════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Output Settings</SectionTitle>

            {/* Number of outputs */}
            <Field label="Number of Variations">
              <div className="grid grid-cols-4 gap-2">
                {OUTPUT_COUNT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setOutputCount(o.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      outputCount === o.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-sm font-bold ${outputCount === o.value ? T.textDark : "text-gray-700"}`}>{o.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{o.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Preserve options */}
            <Field label="Preservation Rules" hint="Lock aspects that should stay consistent">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setPreserveColors((p) => !p)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${preserveColors ? "bg-blue-700" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${preserveColors ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Preserve Color Palette</p>
                    <p className="text-[10px] text-gray-400">Keep the original colors consistent across variations</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setPreserveLayout((p) => !p)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${preserveLayout ? "bg-blue-700" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${preserveLayout ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Preserve Layout / Composition</p>
                    <p className="text-[10px] text-gray-400">Maintain the overall structure and subject placement</p>
                  </div>
                </label>
              </div>
            </Field>

            {/* Summary card */}
            <div className={`rounded-xl p-3 ${T.importBg} border ${T.importBorder}`}>
              <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-2">Summary</p>
              <div className="flex gap-3">
                {imageSrc[0] && (
                  <img src={imageSrc[0]} alt="Source" className="w-12 h-12 object-cover rounded-lg border border-blue-100 shrink-0" />
                )}
                <div className="space-y-0.5 text-xs text-gray-700 leading-relaxed">
                  <p><span className="text-gray-400">Images:</span> {imageSrc.length}</p>
                  <p><span className="text-gray-400">Style:</span> {style || "Auto-detect"}</p>
                  <p><span className="text-gray-400">Focus:</span> {variationFocus.length ? variationFocus.join(", ") : "General"}</p>
                  <p><span className="text-gray-400">Output:</span> {outputCount} variations</p>
                  {(preserveColors || preserveLayout) && (
                    <p className="text-blue-600 text-[10px]">
                      Preserving: {[preserveColors && "Colors", preserveLayout && "Layout"].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
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
              className={`px-3 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Variations</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Cropper Modal ──────────────────────────────────────────────────── */}
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
        onSkip={() =>
          currentCropIndex < imageSrc.length - 1
            ? setCurrentCropIndex((c) => c + 1)
            : setShowCropper(false)
        }
        onCancel={() => setShowCropper(false)}
      />

      {/* ── Search Modal ───────────────────────────────────────────────────── */}
      <SearchMediaModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        selectedImages={selectedImages}
        onSelectImage={handleSelectImage}
        onApply={handleApplySelected}
        onCancel={() => { setSearchModalOpen(false); setSelectedImages([]); }}
      />

      {/* ── Library Modal ──────────────────────────────────────────────────── */}
      <LibraryMediaModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        selectedImages={selectedImages}
        onSelectImage={handleSelectImage}
        onApply={handleApplySelected}
        onCancel={() => { setLibraryModalOpen(false); setSelectedImages([]); }}
      />

      {/* ── Generating overlay ─────────────────────────────────────────────── */}
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
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const SectionTitle = ({ children }) => (
  <h3 className="font-semibold text-gray-900 text-base">{children}</h3>
);

const Field = ({ label, hint, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    {hint && <p className="text-[10px] text-gray-400 -mt-1">{hint}</p>}
    {children}
  </div>
);

export default ImageToVariationsForm;