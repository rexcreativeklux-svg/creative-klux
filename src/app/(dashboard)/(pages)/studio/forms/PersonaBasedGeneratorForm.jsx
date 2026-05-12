"use client";
// forms/PersonaBasedGeneratorForm.jsx

import React, { useState } from "react";
import {
  User, X, Loader2, Sparkles,
  Image, Film, FileText,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const TONE_OPTIONS = [
  "Professional", "Friendly", "Authoritative", "Casual",
  "Inspirational", "Empathetic", "Bold", "Witty",
  "Formal", "Conversational",
];

const OCCUPATION_SUGGESTIONS = [
  "Marketing Manager", "Software Engineer", "Entrepreneur",
  "Sales Executive", "Creative Director", "Product Manager",
  "HR Specialist", "Financial Analyst", "Teacher", "Consultant",
];

const AGE_GROUPS = [
  { value: "18-24", label: "18–24", desc: "Gen Z" },
  { value: "25-34", label: "25–34", desc: "Millennial" },
  { value: "35-44", label: "35–44", desc: "Gen X" },
  { value: "45-54", label: "45–54", desc: "Boomer+" },
  { value: "55+",   label: "55+",   desc: "Senior" },
];

const CONTENT_TYPE_OPTIONS = [
  { value: "text",  label: "Text",  icon: FileText },
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Video", icon: Film },
];

const LAYOUT_OPTIONS = [
  { value: "Square",    label: "Square",    ratio: "1:1",  w: 48, h: 48 },
  { value: "Landscape", label: "Landscape", ratio: "16:9", w: 64, h: 36 },
  { value: "Portrait",  label: "Portrait",  ratio: "9:16", w: 36, h: 64 },
];

const EXPORT_FORMAT_MAP = {
  text:  ["TXT", "PDF"],
  image: ["PNG", "JPEG", "PDF"],
  video: ["MP4", "AVI"],
};

const INSPIRE_PERSONAS = [
  { name: "Amara Osei",      occupation: "Marketing Manager", tone: "Friendly" },
  { name: "Raj Patel",       occupation: "Software Engineer", tone: "Professional" },
  { name: "Sofia Reyes",     occupation: "Creative Director", tone: "Inspirational" },
  { name: "James Whitfield", occupation: "Sales Executive",   tone: "Bold" },
  { name: "Yuki Tanaka",     occupation: "Product Manager",   tone: "Casual" },
];

// ── theme: pink ───────────────────────────────────────────────────────────────
const T = {
  border:   "border-pink-600",
  bg:       "bg-pink-600",
  bgHover:  "hover:bg-pink-700",
  bgLight:  "bg-pink-50",
  textDark: "text-pink-700",
  pill:     "border-pink-600 bg-pink-50 text-pink-700",
};

// ─────────────────────────────────────────────────────────────────────────────

const PersonaBasedGeneratorForm = ({ formData, setFormData, activeBrand, showToast, onResult }) => {
  const [error,      setError]     = useState("");
  const [generating, setGenerating]= useState(false);

  // persona fields
  const [name,        setName]       = useState("");
  const [ageGroup,    setAgeGroup]   = useState("");
  const [customAge,   setCustomAge]  = useState("");
  const [occupation,  setOccupation] = useState("");
  const [tone,        setTone]       = useState("");

  // content settings
  const [contentType,  setContentType]  = useState("image");
  const [layout,       setLayout]       = useState("Square");
  const [exportFormat, setExportFormat] = useState("PNG");

  // ── Inspire ───────────────────────────────────────────────────────────────
  const handleInspire = () => {
    const p = INSPIRE_PERSONAS[Math.floor(Math.random() * INSPIRE_PERSONAS.length)];
    setName(p.name);
    setOccupation(p.occupation);
    setTone(p.tone);
    setError("");
  };

  // ── Content type change ───────────────────────────────────────────────────
  const handleContentTypeChange = (val) => {
    setContentType(val);
    setExportFormat(EXPORT_FORMAT_MAP[val][0]);
    setLayout(val === "video" ? "Landscape" : "Square");
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!name.trim())                         return setError("Please enter a persona name.");
    if (!ageGroup && !customAge.trim())        return setError("Please select or enter an age.");
    if (!occupation.trim())                    return setError("Please enter an occupation.");
    if (!tone)                                 return setError("Please select a tone.");

    setError("");
    setGenerating(true);

    const resolvedAge = customAge.trim() || ageGroup;
    const count = 4;

    try {
      if (contentType === "text") {
        const newOutputs = Array(count).fill(null).map((_, i) => ({
          id:      i,
          type:    "text",
          content: `Sample content ${i + 1} for ${name}, a ${resolvedAge}-year-old ${occupation} with a ${tone} tone.`,
        }));
        if (onResult) onResult({ assets: newOutputs, exportFormat, layout });
        setGenerating(false);
        return;
      }

      const queries     = buildQueries({ occupation, tone, age: resolvedAge, contentType });
      const orientation = layout === "Portrait" ? "portrait" : layout === "Landscape" ? "landscape" : "square";
      const proxy       = (url) => `/api/proxy-media?url=${encodeURIComponent(url)}`;

      if (contentType === "image") {
        const allPhotos = [];
        for (const q of queries) {
          const res  = await fetch(`/api/pexels?query=${encodeURIComponent(q)}&type=photos&per_page=15&orientation=${orientation}`);
          const data = await res.json();
          allPhotos.push(...(data.photos || []));
          if (allPhotos.length >= count * 3) break;
        }
        const unique   = Array.from(new Map(allPhotos.map((p) => [p.id, p])).values());
        const selected = unique.sort(() => Math.random() - 0.5).slice(0, count).map((photo, i) => ({
          id:              `pbg-img-${photo.id}-${i}`,
          type:            "image",
          src:             photo.src.large2x || photo.src.large || photo.src.medium,
          thumbnail:       photo.src.medium,
          alt:             photo.alt || `Persona image ${i + 1}`,
          photographer:    photo.photographer,
          photographerUrl: photo.photographer_url,
          pexelsUrl:       photo.url,
        }));
        if (onResult) onResult({ assets: selected, exportFormat, layout });
      }

      if (contentType === "video") {
        const allVideos = [];
        for (const q of queries) {
          const res  = await fetch(`/api/pexels?query=${encodeURIComponent(q)}&type=videos&per_page=15&orientation=${orientation}`);
          const data = await res.json();
          allVideos.push(...(data.videos || []));
          if (allVideos.length >= count * 3) break;
        }
        const unique   = Array.from(new Map(allVideos.map((v) => [v.id, v])).values());
        const selected = unique.sort(() => Math.random() - 0.5).slice(0, count).map((video, i) => {
          const hd = video.video_files?.find((f) => f.quality === "hd") || video.video_files?.[0];
          return {
            id:        `pbg-vid-${video.id}-${i}`,
            type:      "video",
            src:       proxy(hd?.link || ""),
            videoSrc:  proxy(hd?.link || ""),
            thumbnail: proxy(video.image || ""),
            alt:       `Persona video ${i + 1}`,
            duration:  video.duration,
            pexelsUrl: video.url,
            user:      video.user?.name || "Pexels",
          };
        });
        if (onResult) onResult({ assets: selected, exportFormat, layout });
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-white rounded-lg p-2 flex flex-col gap-5">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* Name */}
        <div className="flex items-end gap-3">
          <Field label="Persona Name" required className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Jane Doe"
              className={inputCls}
            />
          </Field>
          <button
            onClick={handleInspire}
            className="shrink-0 text-xs font-semibold bg-white border border-gray-200 text-gray-500 hover:border-pink-400 hover:text-pink-600 px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-0.5"
          >
            ✨ Inspire Me
          </button>
        </div>

        {/* Age Group */}
        <Field label="Age Group" required>
          <div className="flex gap-2 mb-2">
            {AGE_GROUPS.map((a) => (
              <button
                key={a.value}
                onClick={() => { setAgeGroup(a.value); setCustomAge(""); setError(""); }}
                className={`flex-1 flex flex-col items-center px-2 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                  ageGroup === a.value
                    ? `${T.border} ${T.bgLight}`
                    : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <span className={`text-xs font-bold ${ageGroup === a.value ? T.textDark : "text-gray-700"}`}>{a.label}</span>
                <span className={`text-[10px] mt-0.5 ${ageGroup === a.value ? "text-pink-500" : "text-gray-400"}`}>{a.desc}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customAge}
            onChange={(e) => { setCustomAge(e.target.value); setAgeGroup(""); setError(""); }}
            placeholder="Or enter exact age (e.g. 32)"
            className={inputCls}
          />
        </Field>

        {/* Occupation */}
        <Field label="Occupation" required>
          <input
            type="text"
            value={occupation}
            onChange={(e) => { setOccupation(e.target.value); setError(""); }}
            placeholder="e.g. Marketing Manager"
            className={`${inputCls} mb-2`}
          />
          <div className="flex flex-wrap gap-1.5">
            {OCCUPATION_SUGGESTIONS.map((o) => (
              <button
                key={o}
                onClick={() => { setOccupation(o); setError(""); }}
                className={`px-2.5 py-1 rounded-md border cursor-pointer text-[10px] font-semibold transition-all ${
                  occupation === o ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </Field>

        {/* Tone */}
        <Field label="Communication Tone" required>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => { setTone(tone === t ? "" : t); setError(""); }}
                className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                  tone === t ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        {/* Content Type */}
        <Field label="Content Type">
          <div className="flex gap-2">
            {CONTENT_TYPE_OPTIONS.map((ct) => {
              const Icon = ct.icon;
              return (
                <button
                  key={ct.value}
                  onClick={() => handleContentTypeChange(ct.value)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                    contentType === ct.value
                      ? `${T.border} ${T.bgLight}`
                      : "border-gray-100 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${contentType === ct.value ? "text-pink-600" : "text-gray-400"}`} />
                  <span className={`text-xs font-bold ${contentType === ct.value ? T.textDark : "text-gray-700"}`}>{ct.label}</span>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Layout — only for image/video */}
        {contentType !== "text" && (
          <Field label="Aspect Ratio">
            <div className="flex gap-2">
              {LAYOUT_OPTIONS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLayout(l.value)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                    layout === l.value
                      ? `${T.border} ${T.bgLight}`
                      : "border-gray-100 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`rounded border-2 shrink-0 transition-all ${layout === l.value ? T.border : "border-gray-400"}`}
                    style={{ width: `${l.w * 0.35}px`, height: `${l.h * 0.35}px`, background: layout === l.value ? "#fdf2f8" : "#f9fafb" }}
                  />
                  <span className={`text-xs font-semibold ${layout === l.value ? T.textDark : "text-gray-700"}`}>{l.label}</span>
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* Export Format */}
        <Field label="Export Format">
          <div className="flex gap-2">
            {EXPORT_FORMAT_MAP[contentType].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setExportFormat(fmt)}
                className={`px-4 py-2 rounded-lg border-2 cursor-pointer text-xs font-bold transition-all ${
                  exportFormat === fmt
                    ? `${T.border} ${T.bgLight} ${T.textDark}`
                    : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                {fmt}
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
              : <><Sparkles className="w-4 h-4" /> Generate Content</>
            }
          </button>
        </div>
      </div>

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

// ── query builder ─────────────────────────────────────────────────────────────
function buildQueries({ occupation, tone, age, contentType }) {
  const queries = [];
  if (occupation) {
    queries.push(occupation.toLowerCase());
    queries.push(`${occupation.toLowerCase()} professional`);
  }
  if (tone) queries.push(`${tone.toLowerCase()} ${contentType === "video" ? "video" : "person"}`);
  const ageNum = parseInt(age);
  if (!isNaN(ageNum)) {
    if (ageNum < 25)      queries.push("young professional");
    else if (ageNum < 40) queries.push("professional adult");
    else if (ageNum < 60) queries.push("mature professional");
    else                  queries.push("senior professional");
  }
  queries.push("business professional", "professional portrait", "working professional");
  return queries;
}

// ── shared sub-components ─────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent";

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default PersonaBasedGeneratorForm;