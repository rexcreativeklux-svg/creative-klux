"use client";
// forms/TextToAudioForm.jsx

import React, { useState } from "react";
import { Mic, Loader2, X, AudioLines } from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const VOICE_OPTIONS = [
  { value: "neutral_ai",    label: "Neutral AI",    desc: "Balanced, clear tone" },
  { value: "male",          label: "Male",          desc: "Deep, confident voice" },
  { value: "female",        label: "Female",        desc: "Clear, warm voice" },
  { value: "energetic",     label: "Energetic",     desc: "Upbeat and lively" },
  { value: "calm",          label: "Calm",          desc: "Soothing and soft" },
  { value: "dramatic",      label: "Dramatic",      desc: "Expressive and bold" },
  { value: "childlike",     label: "Childlike",     desc: "Fun and playful" },
  { value: "authoritative", label: "Authoritative", desc: "Strong, commanding" },
];

const TONE_OPTIONS = [
  "Professional", "Friendly", "Excited", "Serious",
  "Humorous", "Empathetic", "Inspirational", "Conversational",
];

const SPEED_OPTIONS = [
  { value: "slow",   label: "Slow",   desc: "0.75× speed" },
  { value: "normal", label: "Normal", desc: "1.0× speed" },
  { value: "fast",   label: "Fast",   desc: "1.25× speed" },
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

const INSPIRE_PROMPTS = [
  "Welcome to our product launch event. Today we're thrilled to introduce something that will change the way you work forever.",
  "In a world where every second counts, precision and speed are not just advantages — they are necessities.",
  "Thank you for joining us on this journey. Your support means everything to our team and our mission.",
  "Breaking news: Scientists have discovered a new approach to renewable energy that could power entire cities within a decade.",
  "Attention shoppers! For this weekend only, enjoy up to fifty percent off on all premium items storewide.",
  "Hello and welcome back to the show. Today we have an incredible guest who has reshaped an entire industry.",
];

// ── theme: pink ───────────────────────────────────────────────────────────────
const T = {
  border:   "border-pink-600",
  bg:       "bg-pink-700",
  bgHover:  "hover:bg-pink-800",
  bgLight:  "bg-pink-50",
  textDark: "text-pink-700",
  pill:     "border-pink-600 bg-pink-50 text-pink-700",
};

// ─────────────────────────────────────────────────────────────────────────────

const TextToAudioForm = ({ formData, setFormData, activeBrand, showToast, onResult }) => {
  const [error,      setError]     = useState("");
  const [generating, setGenerating]= useState(false);

  const [text,    setText]   = useState("");
  const [voice,   setVoice]  = useState(VOICE_OPTIONS[0].value);
  const [tone,    setTone]   = useState("");
  const [speed,   setSpeed]  = useState("normal");
  const [format,  setFormat] = useState("mp3");
  const [quality, setQuality]= useState("high");

  // ── Inspire ───────────────────────────────────────────────────────────────
  const handleInspire = () => {
    setText(INSPIRE_PROMPTS[Math.floor(Math.random() * INSPIRE_PROMPTS.length)]);
    setError("");
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!text.trim()) return setError("Please enter some text to convert.");
    setError("");
    setGenerating(true);

    try {
      await new Promise((res) => setTimeout(res, 1800));

      const sampleAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      const generated = Array.from({ length: 3 }, (_, i) => ({
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-surface rounded-lg px-2 py-5 flex flex-col gap-5">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* Text Input */}
        <Field label="Text to Convert" required>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(""); }}
              placeholder="Type or paste the text you want to convert to audio… scripts, announcements, narrations, and more."
              rows={8}
              className={`${inputCls} placeholder:text-xs placeholder:text-gray-400 resize-none`}
            />
            <button
              onClick={handleInspire}
              className="absolute bottom-3 left-3 text-xs font-semibold bg-surface border border-gray-200 text-gray-500 hover:border-pink-400 hover:text-pink-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
            >
              ✨ Inspire Me
            </button>
            <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">{text.length}/2000</span>
          </div>
        </Field>

        {/* Voice Type — text-only pills, always one active */}
        <Field label="Voice Type">
          <div className="flex flex-wrap gap-2">
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.value}
                onClick={() => setVoice(v.value)}
                className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                  voice === v.value
                    ? T.pill
                    : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Speaking Tone */}
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

        {/* Speaking Speed — compact inline row */}
        <Field label="Speaking Speed">
          <div className="flex gap-2">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSpeed(s.value)}
                className={`flex-1 px-2 py-2 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  speed === s.value
                    ? `${T.border} ${T.bgLight}`
                    : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <p className={`text-xs font-bold ${speed === s.value ? T.textDark : "text-gray-700"}`}>{s.label}</p>
                <p className={`text-[10px] mt-0.5 ${speed === s.value ? "text-pink-500" : "text-gray-400"}`}>{s.desc}</p>
              </button>
            ))}
          </div>
        </Field>

        {/* Export Format — compact inline row */}
        <Field label="Export Format">
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                className={`flex-1 px-2 py-2 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  format === f.value
                    ? `${T.border} ${T.bgLight}`
                    : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <p className={`text-xs font-bold ${format === f.value ? T.textDark : "text-gray-700"}`}>{f.label}</p>
                <p className={`text-[10px] mt-0.5 ${format === f.value ? "text-pink-500" : "text-gray-400"}`}>{f.desc}</p>
              </button>
            ))}
          </div>
        </Field>

        {/* Audio Quality — compact inline row */}
        <Field label="Audio Quality">
          <div className="flex gap-2">
            {QUALITY_OPTIONS.map((q) => (
              <button
                key={q.value}
                onClick={() => setQuality(q.value)}
                className={`flex-1 px-2 py-2 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  quality === q.value
                    ? `${T.border} ${T.bgLight}`
                    : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <p className={`text-xs font-bold ${quality === q.value ? T.textDark : "text-gray-700"}`}>{q.label}</p>
                <p className={`text-[10px] mt-0.5 ${quality === q.value ? "text-pink-500" : "text-gray-400"}`}>{q.desc}</p>
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
              : <><AudioLines className="w-4 h-4" /> Generate Audio</>
            }
          </button>
        </div>
      </div>

      {generating && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-10">
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

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default TextToAudioForm;