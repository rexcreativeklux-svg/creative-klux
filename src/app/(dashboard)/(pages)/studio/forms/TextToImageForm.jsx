"use client";
// forms/TextToImageForm.jsx

import React, { useState } from "react";
import {
  Sparkles, Loader2, X, LayoutTemplate,
  Camera, Smile, Shapes, Star, Droplet, Palette, Cpu, Minus, Film, Aperture, Zap,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { value: "photorealistic", label: "Photorealistic", icon: Camera },
  { value: "cartoon",        label: "Cartoon",        icon: Smile },
  { value: "abstract",       label: "Abstract",       icon: Shapes },
  { value: "anime",          label: "Anime",          icon: Star },
  { value: "watercolor",     label: "Watercolor",     icon: Droplet },
  { value: "oil_painting",   label: "Oil Painting",   icon: Palette },
  { value: "cyberpunk",      label: "Cyberpunk",      icon: Cpu },
  { value: "minimalist",     label: "Minimalist",     icon: Minus },
  { value: "cinematic",      label: "Cinematic",      icon: Film },
  { value: "vintage",        label: "Vintage",        icon: Aperture },
  { value: "neon",           label: "Neon / Glow",    icon: Zap },
];

const LAYOUT_OPTIONS = [
  { value: "square",    label: "Square",     ratio: "1:1",  w: 48, h: 48 },
  { value: "landscape", label: "Landscape",  ratio: "16:9", w: 64, h: 36 },
  { value: "portrait",  label: "Portrait",   ratio: "9:16", w: 36, h: 64 },
  { value: "wide",      label: "Ultra Wide", ratio: "21:9", w: 70, h: 30 },
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

// ── theme ─────────────────────────────────────────────────────────────────────
const T = {
  border:       "border-pink-600",
  bg:           "bg-pink-600",
  bgHover:      "hover:bg-pink-700",
  bgLight:      "bg-pink-50",
  textDark:     "text-pink-700",
  importBg:     "bg-pink-50/40",
  importBorder: "border-pink-100",
  pill:         "border-pink-600 bg-pink-50 text-pink-700",
};

// ─────────────────────────────────────────────────────────────────────────────

const TextToImageForm = ({ formData, setFormData, activeBrand, showToast, onResult }) => {
  const [error,      setError]     = useState("");
  const [generating, setGenerating]= useState(false);

  const [prompt,  setPrompt]  = useState("");
  const [style,   setStyle]   = useState(STYLE_OPTIONS[0].value); // always one active
  const [layout,  setLayout]  = useState("square");

  // ── Inspire ───────────────────────────────────────────────────────────────
  const handleInspire = () => {
    setPrompt(INSPIRE_PROMPTS[Math.floor(Math.random() * INSPIRE_PROMPTS.length)]);
    setError("");
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim()) return setError("Please enter a prompt.");
    setError("");
    setGenerating(true);

    const styleKeyword = style.replace("_", " ");
    const orientation  = layout === "portrait"  ? "portrait"
                       : layout === "landscape" || layout === "wide" ? "landscape"
                       : "square";

    const query = `${prompt} ${styleKeyword} high quality professional`.trim();

    try {
      const res  = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=8&orientation=${orientation}`);
      const data = await res.json();

      const generated = (data.photos || []).slice(0, 4).map((photo, i) => ({
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
      <div className="bg-surface rounded-lg p-2 flex flex-col gap-5">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* Prompt */}
        <Field label="Text Prompt" required>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setError(""); }}
              placeholder="Describe the image you want to create… be specific about subject, setting, lighting, and mood."
              rows={8}
              className={`${inputCls} placeholder:text-xs placeholder:text-gray-400 resize-none`}
            />
            <button
              onClick={handleInspire}
              className="absolute bottom-3 left-3 text-xs font-semibold bg-surface border border-gray-200 text-gray-500 hover:border-pink-400 hover:text-pink-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
            >
              ✨ Inspire Me
            </button>
            <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">{prompt.length}/500</span>
          </div>
        </Field>

        {/* Visual Style — icon + label pills, always one active */}
        <Field label="Visual Style">
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                    style === s.value
                      ? T.pill
                      : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Layout — compact content-width pills */}
        <Field label="Aspect Ratio">
          <div className="flex flex-wrap gap-2">
            {LAYOUT_OPTIONS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLayout(l.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 ${
                  layout === l.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center justify-center w-6 h-6 shrink-0">
                  <span
                    className={`rounded-sm border-2 transition-all ${layout === l.value ? T.border : "border-gray-400"}`}
                    style={{ width: `${l.w * 0.32}px`, height: `${l.h * 0.32}px`, background: layout === l.value ? "#fdf2f8" : "#f9fafb" }}
                  />
                </span>
                <span className={`text-xs font-semibold ${layout === l.value ? T.textDark : "text-gray-700"}`}>{l.label}</span>
                <span className={`text-[10px] ${layout === l.value ? "text-pink-500" : "text-gray-400"}`}>{l.ratio}</span>
              </button>
            ))}
          </div>
        </Field>

        {/* Generate */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleGenerate}
            className={`px-4 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}
          >
            {generating
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Sparkles className="w-4 h-4" /> Generate Images</>
            }
          </button>
        </div>
      </div>

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

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent";

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default TextToImageForm;