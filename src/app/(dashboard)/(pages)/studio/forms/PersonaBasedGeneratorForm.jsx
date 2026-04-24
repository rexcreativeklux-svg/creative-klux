"use client";
// forms/PersonaBasedGeneratorForm.jsx

import React, { useState } from "react";
import {
  User, ChevronRight, X, Loader2, Sparkles,
  UserCircle, Settings2, Image, Film, FileText,
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
  { value: "text",  label: "Text",  desc: "AI-written copy",    icon: FileText },
  { value: "image", label: "Image", desc: "Persona visuals",    icon: Image },
  { value: "video", label: "Video", desc: "Motion content",     icon: Film },
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

const COUNT_OPTIONS = [2, 3, 4, 5, 6];

const INSPIRE_PERSONAS = [
  { name: "Amara Osei",    occupation: "Marketing Manager",   tone: "Friendly" },
  { name: "Raj Patel",     occupation: "Software Engineer",   tone: "Professional" },
  { name: "Sofia Reyes",   occupation: "Creative Director",   tone: "Inspirational" },
  { name: "James Whitfield", occupation: "Sales Executive",  tone: "Bold" },
  { name: "Yuki Tanaka",   occupation: "Product Manager",     tone: "Casual" },
];

const STEPS = [
  { id: 1, label: "Define Persona",    icon: UserCircle },
  { id: 2, label: "Content Settings",  icon: Settings2 },
];

// ── theme: pink (matching TextToImage / TextToVideo) ──────────────────────────
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

const PersonaBasedGeneratorForm = ({ formData, setFormData, activeBrand, showToast, onResult }) => {
  const [step,       setStep]      = useState(1);
  const [error,      setError]     = useState("");
  const [generating, setGenerating]= useState(false);

  // persona fields
  const [name,       setName]      = useState("");
  const [ageGroup,   setAgeGroup]  = useState("");
  const [customAge,  setCustomAge] = useState("");
  const [occupation, setOccupation]= useState("");
  const [tone,       setTone]      = useState("");
  const [bio,        setBio]       = useState("");

  // content settings
  const [contentType,   setContentType]   = useState("image");
  const [layout,        setLayout]        = useState("Square");
  const [exportFormat,  setExportFormat]  = useState("PNG");
  const [count,         setCount]         = useState(4);

  // ── Inspire ───────────────────────────────────────────────────────────────
  const handleInspire = () => {
    const p = INSPIRE_PERSONAS[Math.floor(Math.random() * INSPIRE_PERSONAS.length)];
    setName(p.name);
    setOccupation(p.occupation);
    setTone(p.tone);
    setError("");
  };

  // ── Content type change — reset export format ─────────────────────────────
  const handleContentTypeChange = (val) => {
    setContentType(val);
    setExportFormat(EXPORT_FORMAT_MAP[val][0]);
    // default layout sense
    if (val === "video") setLayout("Landscape");
    else setLayout("Square");
  };

  // ── Step nav ──────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (!name.trim())       return setError("Please enter a persona name.");
    if (!ageGroup && !customAge.trim()) return setError("Please select or enter an age.");
    if (!occupation.trim()) return setError("Please enter an occupation.");
    if (!tone)              return setError("Please select a tone.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setError("");
    setGenerating(true);

    const resolvedAge = customAge.trim() || ageGroup;

    const payload = {
      name,
      age: resolvedAge,
      occupation,
      tone,
      bio,
      contentType,
      layout,
      exportFormat,
      count,
    };

    try {
      if (contentType === "text") {
        // Text — call Claude (or existing text API)
        const newOutputs = Array(count).fill(null).map((_, i) => ({
          id: i,
          type: "text",
          content: `Sample content ${i + 1} for ${name}, a ${resolvedAge}-year-old ${occupation} with a ${tone} tone.`,
        }));
        if (onResult) onResult({ assets: newOutputs, exportFormat, layout });
        setGenerating(false);
        return;
      }

      // Image / Video — build queries from persona
      const queries = buildQueries(payload);
      const orientation =
        layout === "Portrait"  ? "portrait"  :
        layout === "Landscape" ? "landscape" : "square";

      const proxy = (url) => `/api/proxy-media?url=${encodeURIComponent(url)}`;

      if (contentType === "image") {
        const allPhotos = [];
        for (const q of queries) {
          const res  = await fetch(`/api/pexels?query=${encodeURIComponent(q)}&type=photos&per_page=15&orientation=${orientation}`);
          const data = await res.json();
          allPhotos.push(...(data.photos || []));
          if (allPhotos.length >= count * 3) break;
        }
        const unique = Array.from(new Map(allPhotos.map((p) => [p.id, p])).values());
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
        const unique = Array.from(new Map(allVideos.map((v) => [v.id, v])).values());
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

        {/* ═══ STEP 1 — Define Persona ═════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <SectionTitle>Define Persona</SectionTitle>
              <button
                onClick={handleInspire}
                className="text-xs font-semibold bg-white border border-gray-200 text-gray-500 hover:border-pink-400 hover:text-pink-600 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
              >
                ✨ Inspire Me
              </button>
            </div>

            {/* Name */}
            <Field label="Persona Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="e.g. Jane Doe"
                className={inputCls}
              />
            </Field>

            {/* Age Group */}
            <Field label="Age Group" required>
              <div className="flex flex-wrap gap-2 mb-2">
                {AGE_GROUPS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => { setAgeGroup(a.value); setCustomAge(""); setError(""); }}
                    className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 cursor-pointer transition-all ${
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

            {/* Optional bio */}
            <Field label="Bio / Additional Context">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Optionally describe interests, goals, or background for richer output…"
                rows={3}
                className={`${inputCls} resize-none placeholder:text-xs placeholder:text-gray-400`}
              />
            </Field>
          </div>
        )}

        {/* ═══ STEP 2 — Content Settings ═══════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Content Settings</SectionTitle>

            {/* Content Type */}
            <Field label="Content Type">
              <div className="grid grid-cols-3 gap-2">
                {CONTENT_TYPE_OPTIONS.map((ct) => {
                  const Icon = ct.icon;
                  return (
                    <button
                      key={ct.value}
                      onClick={() => handleContentTypeChange(ct.value)}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                        contentType === ct.value
                          ? `${T.border} ${T.bgLight}`
                          : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${contentType === ct.value ? "text-pink-600" : "text-gray-400"}`} />
                      <p className={`text-xs font-bold ${contentType === ct.value ? T.textDark : "text-gray-700"}`}>{ct.label}</p>
                      <p className={`text-[10px] ${contentType === ct.value ? "text-pink-500" : "text-gray-400"}`}>{ct.desc}</p>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Layout — only for image/video */}
            {contentType !== "text" && (
              <Field label="Aspect Ratio / Layout">
                <div className="grid grid-cols-3 gap-2">
                  {LAYOUT_OPTIONS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLayout(l.value)}
                      className={`flex flex-col items-center gap-2 px-2 py-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                        layout === l.value
                          ? `${T.border} ${T.bgLight}`
                          : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-center h-10">
                        <div
                          className={`rounded border-2 transition-all ${layout === l.value ? T.border : "border-gray-400"}`}
                          style={{ width: `${l.w * 0.55}px`, height: `${l.h * 0.55}px`, background: layout === l.value ? "#fdf2f8" : "#f9fafb" }}
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
            )}

            {/* Export Format */}
            <Field label="Export Format">
              <div className="flex flex-wrap gap-2">
                {EXPORT_FORMAT_MAP[contentType].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`px-4 py-2 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all ${
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

            {/* Count */}
            <Field label={`Number of Outputs: ${count}`}>
              <input
                type="range"
                min={2} max={6} step={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-pink-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                {COUNT_OPTIONS.map((n) => (
                  <span key={n} className={count === n ? "text-pink-600 font-bold" : ""}>{n}</span>
                ))}
              </div>
            </Field>

            {/* Persona summary */}
            <div className={`rounded-xl p-3 ${T.importBg} border ${T.importBorder}`}>
              <p className="text-[10px] font-semibold text-pink-600 uppercase tracking-wider mb-1.5">Persona Summary</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-pink-600" />
                </div>
                <p className="text-xs font-semibold text-gray-800">{name}</p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 ml-9">
                {(customAge || ageGroup) && (
                  <span className="text-[10px] text-pink-500">Age: {customAge || ageGroup}</span>
                )}
                {occupation && <span className="text-[10px] text-pink-500">· {occupation}</span>}
                {tone && <span className="text-[10px] text-pink-500">· {tone}</span>}
              </div>
              {bio && (
                <p className="text-[10px] text-gray-500 mt-1.5 ml-9 leading-relaxed line-clamp-2">{bio}</p>
              )}
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
                : <><Sparkles className="w-4 h-4" /> Generate Content</>
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

export default PersonaBasedGeneratorForm;