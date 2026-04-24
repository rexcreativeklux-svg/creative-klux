"use client";
// forms/TextToAudioForm.jsx

import React, { useState } from "react";
import {
  Mic, Loader2, X, ChevronRight, AudioLines, Settings2,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const VOICE_OPTIONS = [
  {
    value: "neutral_ai",
    label: "Neutral AI",
    desc: "Balanced, clear tone",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    value: "male",
    label: "Male",
    desc: "Deep, confident voice",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    value: "female",
    label: "Female",
    desc: "Clear, warm voice",
    image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    value: "energetic",
    label: "Energetic",
    desc: "Upbeat and lively",
    image: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    value: "calm",
    label: "Calm",
    desc: "Soothing and soft",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    value: "dramatic",
    label: "Dramatic",
    desc: "Expressive and bold",
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    value: "childlike",
    label: "Childlike",
    desc: "Fun and playful",
    image: "https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    value: "authoritative",
    label: "Authoritative",
    desc: "Strong, commanding",
    image: "https://images.pexels.com/photos/936564/pexels-photo-936564.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
];

const TONE_OPTIONS = [
  "Professional", "Friendly", "Excited", "Serious",
  "Humorous", "Empathetic", "Inspirational", "Conversational",
];

const SPEED_OPTIONS = [
  { value: "slow",    label: "Slow",    desc: "0.75× speed" },
  { value: "normal",  label: "Normal",  desc: "1.0× speed" },
  { value: "fast",    label: "Fast",    desc: "1.25× speed" },
];

const FORMAT_OPTIONS = [
  { value: "mp3", label: "MP3", desc: "Best compatibility" },
  { value: "wav", label: "WAV", desc: "Lossless quality" },
];

const QUALITY_OPTIONS = [
  { value: "standard", label: "Standard", desc: "Fast generation" },
  { value: "high",     label: "High",     desc: "Richer audio" },
  { value: "studio",   label: "Studio",   desc: "Max fidelity" },
];

const PAUSE_OPTIONS = [
  { value: "none",   label: "None",    desc: "No added pauses" },
  { value: "light",  label: "Light",   desc: "Natural breathing" },
  { value: "medium", label: "Medium",  desc: "Podcast style" },
  { value: "heavy",  label: "Heavy",   desc: "Dramatic pacing" },
];

const COUNT_OPTIONS = [1, 2, 3];

const INSPIRE_PROMPTS = [
  "Welcome to our product launch event. Today we're thrilled to introduce something that will change the way you work forever.",
  "In a world where every second counts, precision and speed are not just advantages — they are necessities.",
  "Thank you for joining us on this journey. Your support means everything to our team and our mission.",
  "Breaking news: Scientists have discovered a new approach to renewable energy that could power entire cities within a decade.",
  "Attention shoppers! For this weekend only, enjoy up to fifty percent off on all premium items storewide.",
  "Hello and welcome back to the show. Today we have an incredible guest who has reshaped an entire industry.",
];

const STEPS = [
  { id: 1, label: "Text & Voice",     icon: Mic },
  { id: 2, label: "Audio Settings",   icon: Settings2 },
];

// ── theme: pink (matching text-to-audio branding) ────────────────────────────
const T = {
  border:       "border-pink-600",
  bg:           "bg-pink-700",
  bgHover:      "hover:bg-pink-800",
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

const TextToAudioForm = ({ formData, setFormData, activeBrand, showToast, onResult }) => {
  const [step,       setStep]      = useState(1);
  const [error,      setError]     = useState("");
  const [generating, setGenerating]= useState(false);

  // local form state
  const [text,        setText]       = useState("");
  const [voice,       setVoice]      = useState("neutral_ai");
  const [tone,        setTone]       = useState("");
  const [speed,       setSpeed]      = useState("normal");
  const [format,      setFormat]     = useState("mp3");
  const [quality,     setQuality]    = useState("high");
  const [pauseStyle,  setPauseStyle] = useState("light");
  const [count,       setCount]      = useState(3);
  const [addMusic,    setAddMusic]   = useState(false);

  // ── Inspire ───────────────────────────────────────────────────────────────
  const handleInspire = () => {
    setText(INSPIRE_PROMPTS[Math.floor(Math.random() * INSPIRE_PROMPTS.length)]);
    setError("");
  };

  // ── Step nav ──────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !text.trim()) return setError("Please enter some text to convert.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Generate — hands results to parent ───────────────────────────────────
  const handleGenerate = async () => {
    if (!text.trim()) return setError("Please enter some text.");
    setError("");
    setGenerating(true);

    try {
      // Simulated audio generation — replace with real API call
      await new Promise((res) => setTimeout(res, 1800));

      const sampleAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

      const generated = Array.from({ length: count }, (_, i) => ({
        id:   `tta-${Date.now()}-${i}`,
        src:  sampleAudioUrl,
        type: "audio",
      }));

      if (onResult) onResult({ assets: generated });
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Audio generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const selectedVoice = VOICE_OPTIONS.find((v) => v.value === voice);

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

        {/* ═══ STEP 1 — Text & Voice ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Text &amp; Voice</SectionTitle>

            {/* Text Input */}
            <Field label="Text to Convert" required>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => { setText(e.target.value); setError(""); }}
                  placeholder="Type or paste the text you want to convert to audio… scripts, announcements, narrations, and more."
                  rows={5}
                  className={`${inputCls} placeholder:text-xs placeholder:text-gray-400 resize-none`}
                />
                <button
                  onClick={handleInspire}
                  className="absolute bottom-3 left-3 text-xs font-semibold bg-white border border-gray-200 text-gray-500 hover:border-pink-400 hover:text-pink-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
                >
                  ✨ Inspire Me
                </button>
                <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">{text.length}/2000</span>
              </div>
            </Field>

            {/* Voice Type */}
            <Field label="Voice Type">
              <div className="flex flex-wrap gap-2">
                {VOICE_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setVoice(v.value)}
                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border cursor-pointer transition-all text-left ${
                      voice === v.value ? `${T.border} bg-pink-50` : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <img
                      src={v.image}
                      alt={v.label}
                      className="w-7 h-7 rounded-md object-cover shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-semibold leading-none ${voice === v.value ? T.textDark : "text-gray-700"}`}>
                        {v.label}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5 leading-none">{v.desc}</span>
                    </div>
                    {voice === v.value && (
                      <div className="w-4 h-4 bg-pink-600 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Field>

            {/* Tone */}
            <Field label="Speaking Tone">
              <div className="flex flex-wrap gap-2">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(tone === t ? "" : t)}
                    className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                      tone === t ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ═══ STEP 2 — Audio Settings ════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Audio Settings</SectionTitle>

            {/* Speaking Speed */}
            <Field label="Speaking Speed">
              <div className="grid grid-cols-3 gap-2">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSpeed(s.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      speed === s.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${speed === s.value ? T.textDark : "text-gray-700"}`}>{s.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Pause Style */}
            <Field label="Pause &amp; Breathing">
              <div className="grid grid-cols-2 gap-2">
                {PAUSE_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPauseStyle(p.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      pauseStyle === p.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${pauseStyle === p.value ? T.textDark : "text-gray-700"}`}>{p.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Export Format */}
            <Field label="Export Format">
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      format === f.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${format === f.value ? T.textDark : "text-gray-700"}`}>{f.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Audio Quality */}
            <Field label="Audio Quality">
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

            {/* Number of Variations */}
            <Field label={`Audio Variations: ${count}`}>
              <input
                type="range" min={1} max={3} step={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-pink-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
                {COUNT_OPTIONS.map((n) => (
                  <span key={n} className={count === n ? "text-pink-600 font-bold" : ""}>{n}</span>
                ))}
              </div>
            </Field>

            {/* Background Music toggle */}
            <Field label="Additional Options">
              <button
                onClick={() => setAddMusic((v) => !v)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                  addMusic ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="text-left">
                  <p className={`text-xs font-bold ${addMusic ? T.textDark : "text-gray-700"}`}>Add Background Music</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Blend soft ambient music behind the voiceover</p>
                </div>
                <div className={`w-9 h-5 rounded-full transition-all flex items-center px-0.5 ${addMusic ? "bg-pink-600" : "bg-gray-300"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${addMusic ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>
            </Field>

            {/* Text + settings summary */}
            <div className={`rounded-xl p-3 ${T.importBg} border ${T.importBorder}`}>
              <p className="text-[10px] font-semibold text-pink-600 uppercase tracking-wider mb-1">Your Text</p>
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{text}</p>
              {(voice || tone) && (
                <p className="text-[10px] text-pink-500 mt-1">
                  {selectedVoice && `Voice: ${selectedVoice.label}`}
                  {selectedVoice && tone && " · "}
                  {tone && `Tone: ${tone}`}
                  {` · Speed: ${speed.charAt(0).toUpperCase() + speed.slice(1)}`}
                  {` · ${format.toUpperCase()}`}
                </p>
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
                : <><AudioLines className="w-4 h-4" /> Generate Audio</>
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
              <FloatingElements.VideoFile />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </>
  );
};

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

export default TextToAudioForm;