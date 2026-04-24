"use client";
// forms/AudioToTextForm.jsx

import React, { useState, useRef } from "react";
import {
  Mic, Loader2, X, ChevronRight, Upload, FileAudio,
  Languages, Settings2, AudioLines,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  { value: "auto",  label: "Auto Detect",  flag: "🌐" },
  { value: "en",    label: "English",       flag: "🇺🇸" },
  { value: "es",    label: "Spanish",       flag: "🇪🇸" },
  { value: "fr",    label: "French",        flag: "🇫🇷" },
  { value: "de",    label: "German",        flag: "🇩🇪" },
  { value: "it",    label: "Italian",       flag: "🇮🇹" },
  { value: "pt",    label: "Portuguese",    flag: "🇧🇷" },
  { value: "zh",    label: "Chinese",       flag: "🇨🇳" },
  { value: "ja",    label: "Japanese",      flag: "🇯🇵" },
  { value: "ko",    label: "Korean",        flag: "🇰🇷" },
  { value: "ar",    label: "Arabic",        flag: "🇸🇦" },
  { value: "hi",    label: "Hindi",         flag: "🇮🇳" },
  { value: "ru",    label: "Russian",       flag: "🇷🇺" },
  { value: "nl",    label: "Dutch",         flag: "🇳🇱" },
  { value: "tr",    label: "Turkish",       flag: "🇹🇷" },
  { value: "pl",    label: "Polish",        flag: "🇵🇱" },
];

const FORMAT_OPTIONS = [
  { value: "plain",       label: "Plain Text",     desc: "Raw transcript only" },
  { value: "punctuated",  label: "Punctuated",      desc: "Auto-add punctuation" },
  { value: "paragraphs",  label: "Paragraphs",      desc: "Split into paragraphs" },
  { value: "timestamped", label: "Timestamped",     desc: "Include time markers" },
];

const SPEAKER_OPTIONS = [
  { value: "none",   label: "None",         desc: "No diarization" },
  { value: "2",      label: "2 Speakers",   desc: "Dialogue / interview" },
  { value: "3",      label: "3 Speakers",   desc: "Small group" },
  { value: "auto",   label: "Auto Detect",  desc: "Let AI decide" },
];

const AUDIO_TYPE_OPTIONS = [
  "Meeting",
  "Interview",
  "Podcast",
  "Lecture",
  "Voice Note",
  "Call Recording",
  "Dictation",
  "Other",
];

const QUALITY_OPTIONS = [
  { value: "fast",     label: "Fast",     desc: "Quick turnaround" },
  { value: "balanced", label: "Balanced", desc: "Speed + accuracy" },
  { value: "accurate", label: "Accurate", desc: "Maximum precision" },
];

const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm", "audio/x-m4a"];
const ACCEPTED_EXT   = ".mp3,.wav,.ogg,.m4a,.webm";

const STEPS = [
  { id: 1, label: "Upload & Source",  icon: Upload },
  { id: 2, label: "Output Settings",  icon: Settings2 },
];

// ── theme: blue (matching AudioToTextTab) ─────────────────────────────────────
const T = {
  border:       "border-blue-600",
  bg:           "bg-blue-700",
  bgHover:      "hover:bg-blue-800",
  bgLight:      "bg-blue-50",
  textDark:     "text-blue-700",
  importBg:     "bg-blue-50/40",
  importBorder: "border-blue-100",
  stepActive:   "border-blue-600 bg-blue-600 text-white",
  stepCurrent:  "border-blue-600 text-blue-600 bg-white",
  connector:    "bg-blue-600",
  pill:         "border-blue-600 bg-blue-50 text-blue-700",
  accent:       "focus:ring-blue-500",
};

// ── helpers ───────────────────────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// ─────────────────────────────────────────────────────────────────────────────

const AudioToTextForm = ({ formData, setFormData, activeBrand, showToast, onResult }) => {
  const [step,        setStep]       = useState(1);
  const [error,       setError]      = useState("");
  const [transcribing, setTranscribing] = useState(false);

  // audio file state
  const [audioFile,   setAudioFile]  = useState(null);
  const [previewUrl,  setPreviewUrl] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [isDragging,  setIsDragging] = useState(false);

  // settings state
  const [language,    setLanguage]   = useState("auto");
  const [audioType,   setAudioType]  = useState("");
  const [format,      setFormat]     = useState("punctuated");
  const [speakers,    setSpeakers]   = useState("none");
  const [quality,     setQuality]    = useState("balanced");
  const [filterProfanity, setFilterProfanity] = useState(false);

  const fileInputRef = useRef(null);
  const audioRef     = useRef(null);

  // ── File handling ─────────────────────────────────────────────────────────
  const processFile = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|webm)$/i)) {
      setError("Please upload a valid audio file (.mp3, .wav, .ogg, .m4a, .webm)");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be under 100 MB.");
      return;
    }
    setError("");
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAudioDuration(null);

    // read duration
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => setAudioDuration(tempAudio.duration);
  };

  const handleFileChange = (e) => processFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleRemoveFile = () => {
    setAudioFile(null);
    setPreviewUrl(null);
    setAudioDuration(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Step nav ──────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (step === 1 && !audioFile) return setError("Please upload an audio file first.");
    setError("");
    setStep((p) => p + 1);
  };

  // ── Transcribe ────────────────────────────────────────────────────────────
  const handleTranscribe = async () => {
    if (!audioFile) return setError("Please upload an audio file.");
    setError("");
    setTranscribing(true);

    const formPayload = new FormData();
    formPayload.append("audio", audioFile);
    formPayload.append("language", language);
    formPayload.append("format", format);
    formPayload.append("speakers", speakers);
    formPayload.append("quality", quality);
    formPayload.append("filterProfanity", String(filterProfanity));
    if (audioType) formPayload.append("audioType", audioType);

    try {
      const res  = await fetch("/api/transcribe", { method: "POST", body: formPayload });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Transcription failed");

      if (onResult) onResult({ text: data.text || "No transcription returned.", file: audioFile });
    } catch (err) {
      console.error("Transcription error:", err);
      setError("Could not transcribe audio. Please try again.");
    } finally {
      setTranscribing(false);
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

        {/* ═══ STEP 1 — Upload & Source ════════════════════════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Upload & Source</SectionTitle>

            {/* Drop Zone */}
            <Field label="Audio File" required>
              {!audioFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/40"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all ${
                    isDragging ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    <Mic className={`w-7 h-7 transition-all ${isDragging ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Drop your audio file here</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                  <p className="text-[10px] text-gray-400 mt-3 bg-gray-100 px-3 py-1 rounded-full">
                    MP3 · WAV · OGG · M4A · WEBM · up to 100 MB
                  </p>
                </div>
              ) : (
                /* File preview card */
                <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2.5 rounded-lg shrink-0">
                      <FileAudio className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{audioFile.name}</p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[10px] text-gray-500">{formatFileSize(audioFile.size)}</span>
                        {audioDuration && (
                          <span className="text-[10px] text-gray-500">· {formatDuration(audioDuration)}</span>
                        )}
                        <span className="text-[10px] text-gray-500">· {audioFile.type.split("/")[1]?.toUpperCase()}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="shrink-0 p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Inline audio player */}
                  {previewUrl && (
                    <audio
                      ref={audioRef}
                      src={previewUrl}
                      controls
                      className="w-full mt-3 rounded-lg h-9"
                      style={{ accentColor: "#1d4ed8" }}
                    />
                  )}

                  {/* Replace file */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 text-[10px] font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 transition"
                  >
                    Replace file
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXT}
                onChange={handleFileChange}
                className="hidden"
              />
            </Field>

            {/* Language */}
            <Field label="Source Language">
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLanguage(l.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all text-left ${
                      language === l.value
                        ? `${T.border} bg-blue-50`
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-base leading-none">{l.flag}</span>
                    <span className={`text-xs font-semibold ${language === l.value ? T.textDark : "text-gray-700"}`}>
                      {l.label}
                    </span>
                    {language === l.value && (
                      <div className="w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center ml-0.5">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Field>

            {/* Audio type */}
            <Field label="Content Type">
              <div className="flex flex-wrap gap-2">
                {AUDIO_TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setAudioType(audioType === t ? "" : t)}
                    className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                      audioType === t ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* ═══ STEP 2 — Output Settings ════════════════════════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <SectionTitle>Output Settings</SectionTitle>

            {/* Output Format */}
            <Field label="Transcript Format">
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      format === f.value
                        ? `${T.border} ${T.bgLight}`
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${format === f.value ? T.textDark : "text-gray-700"}`}>{f.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Speaker Diarization */}
            <Field label="Speaker Detection">
              <div className="grid grid-cols-2 gap-2">
                {SPEAKER_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSpeakers(s.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      speakers === s.value
                        ? `${T.border} ${T.bgLight}`
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${speakers === s.value ? T.textDark : "text-gray-700"}`}>{s.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Transcription Quality */}
            <Field label="Transcription Quality">
              <div className="grid grid-cols-3 gap-2">
                {QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => setQuality(q.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      quality === q.value
                        ? `${T.border} ${T.bgLight}`
                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-bold ${quality === q.value ? T.textDark : "text-gray-700"}`}>{q.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{q.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Filter Profanity toggle */}
            <Field label="Additional Options">
              <button
                onClick={() => setFilterProfanity((v) => !v)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                  filterProfanity ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="text-left">
                  <p className={`text-xs font-bold ${filterProfanity ? T.textDark : "text-gray-700"}`}>Filter Profanity</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Replace offensive words with asterisks</p>
                </div>
                <div className={`w-9 h-5 rounded-full transition-all flex items-center px-0.5 ${filterProfanity ? "bg-blue-600" : "bg-gray-300"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${filterProfanity ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>
            </Field>

            {/* File summary */}
            <div className={`rounded-xl p-3 ${T.importBg} border ${T.importBorder}`}>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">Your File</p>
              <p className="text-xs text-gray-700 font-medium leading-relaxed truncate">{audioFile?.name}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {audioFile && <span className="text-[10px] text-blue-500">{formatFileSize(audioFile.size)}</span>}
                {audioDuration && <span className="text-[10px] text-blue-500">· {formatDuration(audioDuration)}</span>}
                {language !== "auto" && (
                  <span className="text-[10px] text-blue-500">
                    · {LANGUAGE_OPTIONS.find((l) => l.value === language)?.label}
                  </span>
                )}
                {audioType && <span className="text-[10px] text-blue-500">· {audioType}</span>}
                {speakers !== "none" && <span className="text-[10px] text-blue-500">· {SPEAKER_OPTIONS.find((s) => s.value === speakers)?.label}</span>}
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
              onClick={handleTranscribe}
              className={`px-3 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}
            >
              {transcribing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><AudioLines className="w-4 h-4" /> Transcribe Audio</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Fullscreen loading overlay ────────────────────────────────────── */}
      {transcribing && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10">
            <FloatingAnimation showProgressBar>
              <FloatingElements.FileUp />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </>
  );
};

// ── shared sub-components ─────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const SectionTitle = ({ children }) => <h3 className="font-semibold text-gray-900 text-base">{children}</h3>;
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default AudioToTextForm;