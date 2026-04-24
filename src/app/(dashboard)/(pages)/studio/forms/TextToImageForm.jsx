"use client";
// forms/TextToImageForm.jsx

import React, { useState } from "react";
import {
  Sparkles, Loader2, X, ChevronRight, Wand2, LayoutTemplate,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { value: "photorealistic", label: "Photorealistic", preview: "https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "cartoon",        label: "Cartoon",        preview: "https://images.pexels.com/photos/1632790/pexels-photo-1632790.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "abstract",       label: "Abstract",       preview: "https://images.pexels.com/photos/2110951/pexels-photo-2110951.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "anime",          label: "Anime",          preview: "https://images.pexels.com/photos/3601441/pexels-photo-3601441.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "watercolor",     label: "Watercolor",     preview: "https://images.pexels.com/photos/208139/pexels-photo-208139.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "oil_painting",   label: "Oil Painting",   preview: "https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "cyberpunk",      label: "Cyberpunk",      preview: "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "minimalist",     label: "Minimalist",     preview: "https://images.pexels.com/photos/583842/pexels-photo-583842.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "cinematic",      label: "Cinematic",      preview: "https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "vintage",        label: "Vintage",        preview: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "neon",           label: "Neon / Glow",    preview: "https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg?auto=compress&cs=tinysrgb&w=200" },
  { value: "flat_design",    label: "Flat Design",    preview: "https://images.pexels.com/photos/583842/pexels-photo-583842.jpeg?auto=compress&cs=tinysrgb&w=200" },
];

const LAYOUT_OPTIONS = [
  { value: "square",    label: "Square",     ratio: "1:1",  w: 48, h: 48 },
  { value: "landscape", label: "Landscape",  ratio: "16:9", w: 64, h: 36 },
  { value: "portrait",  label: "Portrait",   ratio: "9:16", w: 36, h: 64 },
  { value: "wide",      label: "Ultra Wide", ratio: "21:9", w: 70, h: 30 },
];

const MOOD_OPTIONS = [
  "Vibrant", "Moody", "Dark", "Bright", "Warm", "Cold", "Dreamy", "Gritty",
];

const QUALITY_OPTIONS = [
  { value: "standard", label: "Standard", desc: "Fast generation" },
  { value: "hd",       label: "HD",       desc: "Higher detail" },
  { value: "ultra",    label: "Ultra",    desc: "Max quality" },
];

const INSPIRE_PROMPTS = [
  "A futuristic city at sunset with neon lights reflecting on wet streets",
  "A cozy coffee shop corner with warm lighting and rainy windows",
  "An elegant product shot of a luxury watch on dark marble",
  "A minimalist workspace with plants and golden hour light streaming in",
  "An abstract cosmic explosion of color and light in deep space",
  "A serene mountain lake at dawn with mist rolling over the water",
  "A bold brand billboard in Times Square at night",
  "A close-up of colorful macarons arranged on a pastel background",
];

const STEPS = [
  { id: 1, label: "Prompt & Style",   icon: Wand2 },
  { id: 2, label: "Layout & Quality", icon: LayoutTemplate },
];

// ── theme: magic_studio #db2777 (pink) ────────────────────────────────────────
const T = {
  border:       "border-pink-600",
  bg:           "bg-pink-600",
  bgHover:      "hover:bg-pink-700",
  bgLight:      "bg-pink-50",
  textDark:     "text-pink-700",
  importBg:     "bg-pink-50/40",
  importBorder: "border-pink-100",
  stepActive:   "border-pink-600 bg-pink-600 text-white",
  stepCurrent:  "border-pink-600 text-pink-600 bg-white",
  connector:    "bg-pink-600",
  pill:         "border-pink-600 bg-pink-50 text-pink-700",
};

// ─────────────────────────────────────────────────────────────────────────────

const TextToImageForm = ({ formData, setFormData, activeBrand, showToast, onResult }) => {
  const [step,       setStep]      = useState(1);
  const [error,      setError]     = useState("");
  const [generating, setGenerating]= useState(false);

  // local form state
  const [prompt,    setPrompt]    = useState("");
  const [style,     setStyle]     = useState("");
  const [mood,      setMood]      = useState("");
  const [layout,    setLayout]    = useState("square");
  const [quality,   setQuality]   = useState("hd");
  const [negPrompt, setNegPrompt] = useState("");
  const [count,     setCount]     = useState(4);

  // ── Inspire ───────────────────────────────────────────────────────────────
  const handleInspire = () => {
    setPrompt(INSPIRE_PROMPTS[Math.floor(Math.random() * INSPIRE_PROMPTS.length)]);
    setError("");
  };

  // ── Step nav ──────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !prompt.trim()) return setError("Please enter a prompt first.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate — hands results to parent (AdPreview renders them) ───────────
  const handleGenerate = async () => {
    if (!prompt.trim()) return setError("Please enter a prompt.");
    setError("");
    setGenerating(true);

    const styleKeyword = style ? style.replace("_", " ") : "";
    const moodKeyword  = mood || "";
    const orientation  = layout === "portrait"  ? "portrait"
                       : layout === "landscape" || layout === "wide" ? "landscape"
                       : "square";

    const query = `${prompt} ${styleKeyword} ${moodKeyword} high quality professional`.trim();

    try {
      const res  = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=${count * 2}&orientation=${orientation}`);
      const data = await res.json();

      const generated = (data.photos || []).slice(0, count).map((photo, i) => ({
        id:      `tti-${photo.id}-${i}`,
        src:     photo.src.large2x || photo.src.large || photo.src.medium,
        preview: photo.src.large2x || photo.src.large || photo.src.medium,
        alt:     photo.alt || `Generated image ${i + 1}`,
        type:    "image",
      }));

      if (onResult) onResult({ assets: generated });
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
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
                    step > s.id    ? T.stepActive
                    : step === s.id ? T.stepCurrent
                    : "border-gray-200 text-gray-300"
                  }`}>
                    {step > s.id
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
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

        {/* ═══ STEP 1 — Prompt & Style ════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Prompt & Style</SectionTitle>

            <Field label="Text Prompt" required>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => { setPrompt(e.target.value); setError(""); }}
                  placeholder="Describe the image you want to create… be specific about subject, setting, lighting, and mood."
                  rows={4}
                  className={`${inputCls} placeholder:text-xs placeholder:text-gray-400 resize-none`}
                />
                <button
                  onClick={handleInspire}
                  className="absolute bottom-3 left-3 text-xs font-semibold bg-white border border-gray-200 text-gray-500 hover:border-pink-400 hover:text-pink-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
                >
                  ✨ Inspire Me
                </button>
                <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">{prompt.length}/500</span>
              </div>
            </Field>

            <Field label="Negative Prompt">
              <input
                type="text"
                value={negPrompt}
                onChange={(e) => setNegPrompt(e.target.value)}
                placeholder="Things to avoid: blurry, low quality, watermark, text…"
                className={inputCls}
              />
            </Field>

            <Field label="Visual Style">
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(style === s.value ? "" : s.value)}
                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border cursor-pointer transition-all text-left ${
                      style === s.value ? `${T.border} bg-pink-50` : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <img src={s.preview} alt={s.label} className="w-7 h-7 rounded-md object-cover shrink-0" />
                    <span className={`text-xs font-semibold flex-1 ${style === s.value ? T.textDark : "text-gray-700"}`}>{s.label}</span>
                    {style === s.value && (
                      <div className="w-4 h-4 bg-pink-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Mood">
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(mood === m ? "" : m)}
                    className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                      mood === m ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ═══ STEP 2 — Layout & Quality ══════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Layout & Quality</SectionTitle>

            <Field label="Aspect Ratio / Layout">
              <div className="grid grid-cols-4 gap-2">
                {LAYOUT_OPTIONS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLayout(l.value)}
                    className={`flex flex-col items-center gap-2 px-2 py-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                      layout === l.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-center h-12">
                      <div
                        className={`rounded border-2 transition-all ${layout === l.value ? T.border : "border-gray-400"}`}
                        style={{ width: `${l.w * 0.6}px`, height: `${l.h * 0.6}px`, background: layout === l.value ? "#fdf2f8" : "#f9fafb" }}
                      />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-semibold ${layout === l.value ? T.textDark : "text-gray-700"}`}>{l.label}</p>
                      <p className={`text-[10px] ${layout === l.value ? "text-pink-500" : "text-gray-400"}`}>{l.ratio}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Output Quality">
              <div className="grid grid-cols-3 gap-2">
                {QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => setQuality(q.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      quality === q.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${quality === q.value ? T.textDark : "text-gray-700"}`}>{q.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{q.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            <Field label={`Number of Images: ${count}`}>
              <input
                type="range" min={1} max={8} step={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-pink-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                {[1,2,3,4,5,6,7,8].map((n) => (
                  <span key={n} className={count === n ? "text-pink-600 font-bold" : ""}>{n}</span>
                ))}
              </div>
            </Field>

            {/* Prompt summary */}
            <div className={`rounded-xl p-3 ${T.importBg} border ${T.importBorder}`}>
              <p className="text-[10px] font-semibold text-pink-600 uppercase tracking-wider mb-1">Your Prompt</p>
              <p className="text-xs text-gray-700 leading-relaxed">{prompt}</p>
              {(style || mood) && (
                <p className="text-[10px] text-pink-500 mt-1">
                  {style && `Style: ${style.replace("_", " ")}`}
                  {style && mood && " · "}
                  {mood  && `Mood: ${mood}`}
                </p>
              )}
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
          {step < STEPS.length ? (
            <button onClick={handleContinue}
              className={`px-3 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleGenerate}
              className={`px-3 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Generate Images</>}
            </button>
          )}
        </div>
      </div>

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

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent";
const SectionTitle = ({ children }) => <h3 className="font-semibold text-gray-900 text-base">{children}</h3>;
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default TextToImageForm;