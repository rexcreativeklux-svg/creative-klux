"use client";
// forms/PresentationDeckForm.jsx

import React, { useState, useRef, useCallback } from "react";
import {
  PresentationIcon, Loader2, X, ChevronRight, FileUp, Wand2, Target, LayoutTemplate, MonitorPlay,
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
  { value: "1280x720",  label: "Standard",    desc: "1280×720 · Digital" },
  { value: "1920x1080", label: "Widescreen",  desc: "1920×1080 · Full HD" },
  { value: "3600x2025", label: "Print",       desc: "3600×2025 · 300 DPI" },
];

const FONT_OPTIONS = [
  "Arial", "Helvetica", "Roboto", "Open Sans",
  "Inter", "Poppins", "Playfair Display",
];

const DECK_TYPE_OPTIONS = [
  { value: "pitch",      label: "Pitch Deck",      desc: "Investors & fundraising" },
  { value: "sales",      label: "Sales Deck",       desc: "Prospects & deals" },
  { value: "corporate",  label: "Corporate",        desc: "Internal or board use" },
  { value: "educational",label: "Educational",      desc: "Teaching & learning" },
  { value: "product",    label: "Product Launch",   desc: "New feature or release" },
  { value: "report",     label: "Report / Review",  desc: "Data & analysis" },
];

const SLIDE_STYLE_OPTIONS = [
  { value: "minimal",    label: "Minimal",     desc: "Clean white, bold type" },
  { value: "bold",       label: "Bold",        desc: "Strong colors, big visuals" },
  { value: "corporate",  label: "Corporate",   desc: "Professional and polished" },
  { value: "creative",   label: "Creative",    desc: "Dynamic layouts, gradients" },
];

const SLIDE_COUNT_OPTIONS = [
  { value: "5",   label: "5 slides",   desc: "Quick overview" },
  { value: "10",  label: "10 slides",  desc: "Standard deck" },
  { value: "15",  label: "15 slides",  desc: "Detailed pitch" },
  { value: "20",  label: "20 slides",  desc: "Full presentation" },
];

const INSPIRE_PROMPTS = [
  "A professional pitch deck for a B2B SaaS startup targeting enterprise clients",
  "An educational presentation on the future of renewable energy and climate tech",
  "A sleek corporate overview deck showcasing Q4 performance and 2025 goals",
  "A compelling investor deck for a health-tech startup raising a Series A",
  "A product launch presentation introducing a new AI-powered mobile application",
  "A bold sales deck designed to close mid-market deals in financial services",
];

const STEPS = [
  { id: 1, label: "Brand Details",   icon: MonitorPlay },
  { id: 2, label: "Goals & Format",  icon: Target },
  { id: 3, label: "Deck Style",      icon: LayoutTemplate },
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
  accent:       "accent-indigo-600",
  ring:         "focus:ring-indigo-500",
};

// ─────────────────────────────────────────────────────────────────────────────

const PresentationDeckForm = ({ formData, setFormData, activeBrand, showToast, onResult }) => {
  const [step,       setStep]      = useState(1);
  const [error,      setError]     = useState("");
  const [generating, setGenerating]= useState(false);

  // Brand details
  const [brandName,      setBrandName]      = useState(activeBrand?.name || "");
  const [projectName,    setProjectName]    = useState("");
  const [description,    setDescription]    = useState(activeBrand?.description || "");
  const [primaryColor,   setPrimaryColor]   = useState(activeBrand?.primary_color || "#000000");
  const [secondaryColor, setSecondaryColor] = useState(activeBrand?.secondary_color || "#4f46e5");
  const [font,           setFont]           = useState(activeBrand?.font || "Inter");
  const [logo,           setLogo]           = useState(activeBrand?.logo || null);
  const [caption,        setCaption]        = useState(`Powerful presentation by ${activeBrand?.name || "your brand"}!`);
  const [hashtags,       setHashtags]       = useState("#Presentation #PitchDeck #Business");

  // Goals & format
  const [presentationGoal, setPresentationGoal] = useState("");
  const [audience,          setAudience]         = useState("");
  const [fileFormat,        setFileFormat]       = useState("PDF");
  const [size,              setSize]             = useState("1920x1080");

  // Deck style
  const [deckType,    setDeckType]    = useState("");
  const [slideStyle,  setSlideStyle]  = useState("minimal");
  const [slideCount,  setSlideCount]  = useState("10");

  const logoInputRef = useRef(null);

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
    if (step === 1 && !brandName.trim())    return setError("Please enter a brand name.");
    if (step === 1 && !description.trim()) return setError("Please enter a deck description.");
    if (step === 2 && !presentationGoal)   return setError("Please select a presentation goal.");
    if (step === 2 && !audience)           return setError("Please select a target audience.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!brandName.trim() || !description.trim()) return setError("Brand name and description are required.");
    setError("");
    setGenerating(true);

    try {
      await new Promise((res) => setTimeout(res, 2000));

      const typeQuery  = deckType    ? deckType.replace("_", " ")   : "presentation";
      const styleQuery = slideStyle  ? slideStyle.replace("_", " ") : "";
      const res  = await fetch(`/api/pexels?query=${encodeURIComponent(`${brandName} ${presentationGoal} ${typeQuery} ${styleQuery} deck`)}&per_page=20`);
      const data = await res.json();

      const count = parseInt(slideCount, 10);
      const generated = (data.photos || []).slice(0, Math.min(count, 20)).map((photo, i) => ({
        id:      `deck-${photo.id}-${i}`,
        src:     photo.src.large2x || photo.src.large || photo.src.medium,
        preview: photo.src.large2x || photo.src.large || photo.src.medium,
        alt:     photo.alt || `Slide ${i + 1}`,
        type:    "image",
      }));

      if (onResult) onResult({ assets: generated });
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Deck generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Color field helper ────────────────────────────────────────────────────
  const ColorField = ({ label, value, onChange }) => (
    <Field label={label}>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className={inputCls}
        />
      </div>
    </Field>
  );

  const selectedSize = SIZE_OPTIONS.find((s) => s.value === size);

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
                    {step > s.id
                      ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )
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

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg p-2 flex flex-col gap-5">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ═══ STEP 1 — Brand Details ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Brand Details</SectionTitle>

            {/* Brand Name + Project Name */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Brand Name" required>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => { setBrandName(e.target.value); setError(""); }}
                  placeholder="e.g. Acme Corp"
                  className={inputCls}
                />
              </Field>
              <Field label="Project Name">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Q4 Investor Deck"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Description */}
            <Field label="Deck Description" required>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setError(""); }}
                  placeholder="Describe your presentation… topic, key message, who it's for, and what you want to achieve."
                  rows={4}
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

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Primary Color"   value={primaryColor}   onChange={setPrimaryColor} />
              <ColorField label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} />
            </div>

            {/* Font */}
            <Field label="Font">
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFont(f)}
                    style={{ fontFamily: f }}
                    className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                      font === f ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Field>

            {/* Logo */}
            <Field label="Logo">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className={`flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                    logo
                      ? `${T.border} ${T.bgLight} ${T.textDark}`
                      : "border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/40"
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  {logo ? "Replace Logo" : "Upload Logo"}
                </button>
                {logo && (
                  <div className="relative group">
                    <img src={logo} alt="Logo" className="w-10 h-10 object-contain rounded-md border border-gray-200" />
                    <button
                      onClick={() => setLogo(null)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </Field>

            {/* Caption + Hashtags */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Caption">
                <div className="relative">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Your presentation caption!"
                    maxLength={280}
                    className={inputCls}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {280 - caption.length}
                  </span>
                </div>
              </Field>
              <Field label="Hashtags">
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#Presentation #PitchDeck #Business"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 — Goals & Format ═════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Goals &amp; Format</SectionTitle>

            {/* Presentation Goal */}
            <Field label="Presentation Goal" required>
              <div className="flex flex-wrap gap-2">
                {PRESENTATION_GOAL_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => { setPresentationGoal(g.value); setError(""); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-semibold transition-all ${
                      presentationGoal === g.value ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span>{g.emoji}</span>
                    {g.label}
                    {presentationGoal === g.value && (
                      <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full flex items-center justify-center ml-0.5">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Field>

            {/* Audience */}
            <Field label="Target Audience" required>
              <div className="grid grid-cols-2 gap-2">
                {AUDIENCE_OPTIONS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => { setAudience(a.value); setError(""); }}
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

            {/* Slide Size */}
            <Field label="Slide Size">
              <div className="grid grid-cols-3 gap-2">
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

            {/* File Format */}
            <Field label="Export Format">
              <div className="grid grid-cols-3 gap-2">
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

            {/* Brand summary */}
            <div className={`rounded-xl p-3 ${T.importBg} border ${T.importBorder}`}>
              <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-1">Your Brand</p>
              <p className="text-xs text-gray-700 font-medium">{brandName}</p>
              {description && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{description}</p>}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" style={{ background: primaryColor }} />
                <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" style={{ background: secondaryColor }} />
                <span className="text-[10px] text-indigo-500" style={{ fontFamily: font }}>{font}</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3 — Deck Style ═════════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Deck Style</SectionTitle>

            {/* Deck Type */}
            <Field label="Deck Type">
              <div className="grid grid-cols-2 gap-2">
                {DECK_TYPE_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDeckType(deckType === d.value ? "" : d.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      deckType === d.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${deckType === d.value ? T.textDark : "text-gray-700"}`}>{d.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{d.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Slide Visual Style */}
            <Field label="Visual Style">
              <div className="grid grid-cols-2 gap-2">
                {SLIDE_STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSlideStyle(s.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
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
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      slideCount === s.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${slideCount === s.value ? T.textDark : "text-gray-700"}`}>{s.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Full summary */}
            <div className={`rounded-xl p-3 ${T.importBg} border ${T.importBorder}`}>
              <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-1">Summary</p>
              <p className="text-xs text-gray-700 font-medium">{brandName} — {projectName || "Untitled Deck"}</p>
              <p className="text-[10px] text-indigo-500 mt-1">
                {presentationGoal && `Goal: ${presentationGoal}`}
                {presentationGoal && audience    && " · "}
                {audience         && `Audience: ${audience}`}
                {deckType         && ` · ${DECK_TYPE_OPTIONS.find((d) => d.value === deckType)?.label}`}
                {slideStyle       && ` · ${SLIDE_STYLE_OPTIONS.find((s) => s.value === slideStyle)?.label}`}
                {` · ${slideCount} slides · ${fileFormat} · ${selectedSize?.label}`}
              </p>
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
              className={`px-3 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}
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
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
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