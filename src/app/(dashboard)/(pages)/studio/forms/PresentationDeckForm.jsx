"use client";
// forms/PresentationDeckForm.jsx

import React, { useState, useRef, useCallback } from "react";
import {
  Globe, Loader2, X, ChevronRight, FileUp, Wand2, Target, LayoutTemplate, MonitorPlay, CheckCircle2,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const PRESENTATION_GOAL_OPTIONS = [
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
  { value: "PDF",  label: "PDF",  desc: "Recommended" },
  { value: "PNG",  label: "PNG",  desc: "Slide images" },
  { value: "PPTX", label: "PPTX", desc: "Editable deck" },
];

const SIZE_OPTIONS = [
  { value: "1280x720",  label: "Standard",   desc: "1280×720 · Digital" },
  { value: "1920x1080", label: "Widescreen", desc: "1920×1080 · Full HD" },
  { value: "3600x2025", label: "Print",      desc: "3600×2025 · 300 DPI" },
];

const SLIDE_STYLE_OPTIONS = [
  { value: "minimal",   label: "Minimal",   desc: "Clean white, bold type" },
  { value: "bold",      label: "Bold",      desc: "Strong colors, big visuals" },
  { value: "corporate", label: "Corporate", desc: "Professional and polished" },
  { value: "creative",  label: "Creative",  desc: "Dynamic layouts, gradients" },
];

const SLIDE_COUNT_OPTIONS = [
  { value: "5",  label: "5 slides",  desc: "Quick overview" },
  { value: "10", label: "10 slides", desc: "Standard deck" },
  { value: "15", label: "15 slides", desc: "Detailed pitch" },
  { value: "20", label: "20 slides", desc: "Full presentation" },
];

const INSPIRE_PROMPTS = [
  "A professional pitch deck for a B2B SaaS startup targeting enterprise clients",
  "An educational presentation on the future of renewable energy and climate tech",
  "A sleek corporate overview deck showcasing Q4 performance and 2025 goals",
  "A compelling investor deck for a health-tech startup raising a Series A",
  "A product launch presentation introducing a new AI-powered mobile application",
  "A bold sales deck designed to close mid-market deals in financial services",
];

const BRAND_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#db2777", "#ef4444",
  "#f59e0b", "#0ea5e9", "#111827",
];

const STEPS = [
  { id: 1, label: "Brand Details",  icon: MonitorPlay },
  { id: 2, label: "Style & Format", icon: LayoutTemplate },
];

// ── theme: indigo ─────────────────────────────────────────────────────────────
const T = {
  border:       "border-indigo-600",
  bg:           "bg-indigo-600",
  bgHover:      "hover:bg-indigo-700",
  bgLight:      "bg-indigo-50",
  textDark:     "text-indigo-700",
  importBg:     "bg-indigo-50/40",
  importBorder: "border-indigo-100",
  stepActive:   "border-indigo-600 bg-indigo-600 text-white",
  stepCurrent:  "border-indigo-600 text-indigo-600 bg-white",
  connector:    "bg-indigo-600",
  pill:         "border-indigo-600 bg-indigo-50 text-indigo-700",
};

// ─────────────────────────────────────────────────────────────────────────────

const PresentationDeckForm = ({
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
  const [description,    setDescription]    = useState(activeBrand?.description || "");
  const [brandColor,     setBrandColor]     = useState(activeBrand?.primary_color || "#4f46e5");
  const [logo,           setLogo]           = useState(activeBrand?.logo || null);
  const [brandUrl,       setBrandUrl]       = useState(activeBrand?.url || activeBrand?.source_url || "");
  const [importingBrand, setImportingBrand] = useState(false);

  // Deck style — with defaults
  const [slideStyle,  setSlideStyle]  = useState("minimal");
  const [slideCount,  setSlideCount]  = useState("10");

  // Goals & format — with defaults
  const [presentationGoal, setPresentationGoal] = useState("Brand Awareness");
  const [audience,         setAudience]         = useState("B2B");
  const [fileFormat,       setFileFormat]       = useState("PDF");
  const [size,             setSize]             = useState("1920x1080");

  const logoInputRef = useRef(null);

  // ── URL import ────────────────────────────────────────────────────────────
  const handleImportBrand = async () => {
    if (!brandUrl.trim()) return setError("Please enter a valid brand URL.");
    setImportingBrand(true);
    try {
      const r = await sendUrl(brandUrl);
      if (!r?.data) throw new Error();
      const d = r.data;
      setBrandName(d.name           || "");
      setDescription(d.description  || "");
      setBrandColor(d.primary_color || "#4f46e5");
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

  // ── Step nav ──────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !brandName.trim())   return setError("Please enter a brand name.");
    if (step === 1 && !description.trim()) return setError("Please enter a deck description.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!brandName.trim() || !description.trim()) return setError("Brand name and description are required.");
    setError("");
    setGenerating(true);

    const payload = {
      creativeType:     creative?.id,
      categoryType:     categoryId,
      brandName:        brandName        || null,
      description:      description      || null,
      brandColor:       brandColor       || null,
      primaryColor:     brandColor       || null,
      logo:             logo             || null,
      presentationGoal: presentationGoal || null,
      audience:         audience         || null,
      fileFormat:       fileFormat       || null,
      size:             size             || null,
      slideStyle:       slideStyle       || null,
      slideCount:       slideCount       || null,
      count:            4,
      sourceUrl:        brandUrl         || null,
      generatedAt:      new Date().toISOString(),
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
        type:       "design",
        variations: data.variations,
        reply:      data.reply || "",
        meta:       data.meta  || {},
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
      <div className="bg-white rounded-lg p-2 flex flex-col gap-5">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 — Brand Details ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Brand Details</SectionTitle>

            {/* URL import */}
            <div className={`border ${T.importBorder} rounded-lg p-4 ${T.importBg}`}>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-indigo-600" />
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

            {/* Brand / Project Name */}
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
            <Field label="Deck Description" required>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setError(""); }}
                  placeholder="Describe your presentation… topic, key message, who it's for, and what you want to achieve."
                  rows={4}
                  maxLength={500}
                  className={`${inputCls} placeholder:text-xs placeholder:text-gray-400 resize-none`}
                />
                <button
                  onClick={handleInspire}
                  className="absolute bottom-3 left-3 text-xs font-semibold bg-white border border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
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
                    className="flex-1 px-3 py-2.5 border cursor-pointer border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-500 hover:text-indigo-600 flex items-center gap-2 transition"
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

        {/* ═══ STEP 2 — Style & Format (merged) ═══════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Style &amp; Format</SectionTitle>

            {/* Visual Style */}
            <Field label="Visual Style">
              <div className="flex flex-wrap gap-2">
                {SLIDE_STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSlideStyle(s.value)}
                    className={`text-left px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                      slideStyle === s.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${slideStyle === s.value ? T.textDark : "text-gray-700"}`}>{s.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Number of Slides */}
            <Field label="Number of Slides">
              <div className="grid grid-cols-4 gap-2">
                {SLIDE_COUNT_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSlideCount(s.value)}
                    className={`text-left px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                      slideCount === s.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${slideCount === s.value ? T.textDark : "text-gray-700"}`}>{s.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Presentation Goal */}
            <Field label="Presentation Goal">
              <div className="flex flex-wrap gap-2">
                {PRESENTATION_GOAL_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setPresentationGoal(g.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-semibold transition-all ${
                      presentationGoal === g.value ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span>{g.emoji}</span>
                    {g.label}
                    {presentationGoal === g.value && (
                      <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full flex items-center justify-center ml-0.5">
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
                    className={`text-left px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                      audience === a.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${audience === a.value ? T.textDark : "text-gray-700"}`}>{a.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Slide Size + Export Format side by side */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Slide Size">
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSize(s.value)}
                      className={`text-left px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                        size === s.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <p className={`text-xs font-bold ${size === s.value ? T.textDark : "text-gray-700"}`}>{s.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Export Format">
                <div className="flex flex-wrap gap-2">
                  {FILE_FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFileFormat(f.value)}
                      className={`text-left px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                        fileFormat === f.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <p className={`text-xs font-bold ${fileFormat === f.value ? T.textDark : "text-gray-700"}`}>{f.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{f.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>
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
                : <><Wand2 className="w-4 h-4" /> Generate Deck</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Fullscreen loading overlay ────────────────────────────────────── */}
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

// ── shared sub-components ─────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const SectionTitle = ({ children }) => <h3 className="font-semibold text-gray-900 text-base">{children}</h3>;
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default PresentationDeckForm;