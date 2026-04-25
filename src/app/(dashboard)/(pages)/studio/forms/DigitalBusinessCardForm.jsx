"use client";
// forms/DigitalBusinessCardForm.jsx

import React, { useState, useRef, useCallback } from "react";
import {
  CreditCard, Loader2, X, ChevronRight, FileUp, Wand2, Settings2, User,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const FILE_FORMAT_OPTIONS = [
  { value: "PNG",  label: "PNG",  desc: "Recommended" },
  { value: "JPEG", label: "JPEG", desc: "Compressed" },
  { value: "PDF",  label: "PDF",  desc: "Print-ready" },
];

const SIZE_OPTIONS = [
  { value: "252x144",  label: "Digital Horizontal", desc: "3.5×2 in · 72 DPI" },
  { value: "144x252",  label: "Digital Vertical",   desc: "2×3.5 in · 72 DPI" },
  { value: "1050x600", label: "Print Horizontal",   desc: "3.5×2 in · 300 DPI" },
  { value: "600x1050", label: "Print Vertical",     desc: "2×3.5 in · 300 DPI" },
];

const ORIENTATION_OPTIONS = [
  { value: "Horizontal", label: "Horizontal", w: 44, h: 28 },
  { value: "Vertical",   label: "Vertical",   w: 28, h: 44 },
];

const FONT_OPTIONS = [
  "Arial", "Helvetica", "Times New Roman", "Roboto", "Poppins",
];

const CARD_STYLE_OPTIONS = [
  { value: "minimalist",  label: "Minimalist",  desc: "Clean, white-space focused" },
  { value: "bold",        label: "Bold",         desc: "Strong colors, big type" },
  { value: "elegant",     label: "Elegant",      desc: "Refined and luxury feel" },
  { value: "modern",      label: "Modern",       desc: "Flat design, sans-serif" },
  { value: "creative",    label: "Creative",     desc: "Unique layouts, gradients" },
  { value: "corporate",   label: "Corporate",    desc: "Professional and formal" },
];

const INSPIRE_PROMPTS = [
  "A minimalist digital business card for a senior tech consultant",
  "A vibrant business card for a creative agency director with bold typography",
  "A professional business card for a corporate lawyer at a top-tier firm",
  "A modern business card for a startup founder with a clean, fresh design",
  "An elegant business card for a luxury brand manager with gold accents",
  "A sleek card for a product designer at a well-known tech company",
];

const STEPS = [
  { id: 1, label: "Personal Details", icon: User },
  { id: 2, label: "Card Format",      icon: Settings2 },
  { id: 3, label: "Style & Output",   icon: CreditCard },
];

// ── theme: rose ───────────────────────────────────────────────────────────────
const T = {
  border:       "border-rose-500",
  bg:           "bg-rose-500",
  bgHover:      "hover:bg-rose-600",
  bgLight:      "bg-rose-50",
  textDark:     "text-rose-700",
  importBg:     "bg-rose-50/40",
  importBorder: "border-rose-100",
  stepActive:   "border-rose-500 bg-rose-500 text-white",
  stepCurrent:  "border-rose-500 text-rose-600 bg-white",
  connector:    "bg-rose-500",
  pill:         "border-rose-500 bg-rose-50 text-rose-700",
  accent:       "accent-rose-500",
  ring:         "focus:ring-rose-400",
};

// ─────────────────────────────────────────────────────────────────────────────

const DigitalBusinessCardForm = ({ formData, setFormData, activeBrand, showToast, onResult }) => {
  const [step,       setStep]      = useState(1);
  const [error,      setError]     = useState("");
  const [generating, setGenerating]= useState(false);

  // Personal details
  const [brandName,      setBrandName]      = useState(activeBrand?.name || "");
  const [description,    setDescription]    = useState(activeBrand?.description || "");
  const [name,           setName]           = useState("");
  const [title,          setTitle]          = useState("");
  const [email,          setEmail]          = useState("");
  const [phone,          setPhone]          = useState("");
  const [company,        setCompany]        = useState(activeBrand?.name || "");
  const [website,        setWebsite]        = useState("");
  const [primaryColor,   setPrimaryColor]   = useState(activeBrand?.primary_color || "#000000");
  const [secondaryColor, setSecondaryColor] = useState(activeBrand?.secondary_color || "#e11d48");
  const [font,           setFont]           = useState(activeBrand?.font || "Poppins");
  const [logo,           setLogo]           = useState(activeBrand?.logo || null);

  // Card format
  const [fileFormat,   setFileFormat]   = useState("PNG");
  const [size,         setSize]         = useState("1050x600");
  const [orientation,  setOrientation]  = useState("Horizontal");

  // Style & output
  const [cardStyle,    setCardStyle]    = useState("minimalist");
  const [count,        setCount]        = useState(3);

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
    if (step === 1 && !name.trim())        return setError("Please enter a name.");
    if (step === 1 && !email.trim())       return setError("Please enter an email address.");
    if (step === 1 && !description.trim()) return setError("Please enter a card description.");
    if (step === 2 && !fileFormat)         return setError("Please select a file format.");
    if (step === 2 && !orientation)        return setError("Please select an orientation.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!name.trim() || !email.trim()) return setError("Name and email are required.");
    setError("");
    setGenerating(true);

    try {
      await new Promise((res) => setTimeout(res, 1800));

      const styleQuery = cardStyle ? cardStyle.replace("_", " ") : "professional";
      const res  = await fetch(`/api/pexels?query=${encodeURIComponent(`${brandName || company} business card ${styleQuery} professional`)}&per_page=${count * 2}`);
      const data = await res.json();

      const generated = (data.photos || []).slice(0, count).map((photo, i) => ({
        id:      `card-${photo.id}-${i}`,
        src:     photo.src.large2x || photo.src.large || photo.src.medium,
        preview: photo.src.large2x || photo.src.large || photo.src.medium,
        alt:     photo.alt || `Business card ${i + 1}`,
        type:    "image",
      }));

      if (onResult) onResult({ assets: generated });
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Card generation failed. Please try again.");
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

        {/* ═══ STEP 1 — Personal Details ══════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Personal Details</SectionTitle>

            {/* Brand + Description */}
            <Field label="Brand Name">
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className={inputCls}
              />
            </Field>

            <Field label="Card Description" required>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setError(""); }}
                  placeholder="Describe your business card style, industry, and intended use."
                  rows={3}
                  className={`${inputCls} placeholder:text-xs placeholder:text-gray-400 resize-none`}
                />
                <button
                  onClick={handleInspire}
                  className="absolute bottom-3 left-3 text-xs font-semibold bg-white border border-gray-200 text-gray-500 hover:border-rose-400 hover:text-rose-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
                >
                  ✨ Inspire Me
                </button>
                <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">{description.length}/300</span>
              </div>
            </Field>

            {/* Contact info */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="e.g. Jane Smith"
                  className={inputCls}
                />
              </Field>
              <Field label="Job Title">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Product Designer"
                  className={inputCls}
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="e.g. jane@acme.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555 000 1234"
                  className={inputCls}
                />
              </Field>
              <Field label="Company">
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className={inputCls}
                />
              </Field>
              <Field label="Website">
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://acme.com"
                  className={inputCls}
                />
              </Field>
            </div>

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
                      : "border-gray-300 text-gray-500 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50/40"
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
          </div>
        )}

        {/* ═══ STEP 2 — Card Format ════════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Card Format</SectionTitle>

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

            {/* Size */}
            <Field label="Card Size">
              <div className="grid grid-cols-2 gap-2">
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

            {/* Orientation */}
            <Field label="Orientation">
              <div className="grid grid-cols-2 gap-2">
                {ORIENTATION_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setOrientation(o.value)}
                    className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                      orientation === o.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-center h-10">
                      <div
                        className={`rounded border-2 transition-all ${orientation === o.value ? T.border : "border-gray-400"}`}
                        style={{
                          width:  `${o.w * 0.9}px`,
                          height: `${o.h * 0.9}px`,
                          background: orientation === o.value ? "#fff1f2" : "#f9fafb",
                        }}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${orientation === o.value ? T.textDark : "text-gray-700"}`}>{o.label}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Details summary */}
            <div className={`rounded-xl p-3 ${T.importBg} border ${T.importBorder}`}>
              <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider mb-1">Your Card</p>
              <p className="text-xs text-gray-700 font-medium">{name} {title && `· ${title}`}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{email}{phone && ` · ${phone}`}</p>
              {company && <p className="text-[10px] text-gray-500">{company}{website && ` · ${website}`}</p>}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" style={{ background: primaryColor }} />
                <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" style={{ background: secondaryColor }} />
                <span className="text-[10px] text-rose-500" style={{ fontFamily: font }}>{font}</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3 — Style & Output ═════════════════════════════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Style &amp; Output</SectionTitle>

            {/* Card Style */}
            <Field label="Card Style">
              <div className="grid grid-cols-2 gap-2">
                {CARD_STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setCardStyle(s.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      cardStyle === s.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${cardStyle === s.value ? T.textDark : "text-gray-700"}`}>{s.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Variations */}
            <Field label={`Card Variations: ${count}`}>
              <input
                type="range" min={1} max={5} step={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className={`w-full ${T.accent} cursor-pointer`}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={count === n ? "text-rose-600 font-bold" : ""}>{n}</span>
                ))}
              </div>
            </Field>

            {/* Full summary */}
            <div className={`rounded-xl p-3 ${T.importBg} border ${T.importBorder}`}>
              <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider mb-1">Summary</p>
              <p className="text-xs text-gray-700 font-medium">{name} — {title || "No title"}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{email}{company && ` · ${company}`}</p>
              <p className="text-[10px] text-rose-500 mt-1">
                {`Style: ${CARD_STYLE_OPTIONS.find((s) => s.value === cardStyle)?.label}`}
                {` · ${fileFormat} · ${selectedSize?.label} · ${orientation}`}
                {` · ${count} variation${count > 1 ? "s" : ""}`}
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
                : <><Wand2 className="w-4 h-4" /> Generate Cards</>
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
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent";
const SectionTitle = ({ children }) => <h3 className="font-semibold text-gray-900 text-base">{children}</h3>;
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default DigitalBusinessCardForm;