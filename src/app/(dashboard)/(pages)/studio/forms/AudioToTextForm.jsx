"use client";
// forms/AudioToTextForm.jsx

import React, { useState, useRef } from "react";
import {
  Mic, Loader2, X, FileAudio, AudioLines,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto Detect", flag: "🌐" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "de", label: "German", flag: "🇩🇪" },
  { value: "it", label: "Italian", flag: "🇮🇹" },
  { value: "pt", label: "Portuguese", flag: "🇧🇷" },
  { value: "zh", label: "Chinese", flag: "🇨🇳" },
  { value: "ja", label: "Japanese", flag: "🇯🇵" },
  { value: "ko", label: "Korean", flag: "🇰🇷" },
  { value: "ar", label: "Arabic", flag: "🇸🇦" },
  { value: "hi", label: "Hindi", flag: "🇮🇳" },
  { value: "ru", label: "Russian", flag: "🇷🇺" },
  { value: "nl", label: "Dutch", flag: "🇳🇱" },
  { value: "tr", label: "Turkish", flag: "🇹🇷" },
  { value: "pl", label: "Polish", flag: "🇵🇱" },
];

const FORMAT_OPTIONS = [
  { value: "plain", label: "Plain Text", desc: "Raw transcript only" },
  { value: "punctuated", label: "Punctuated", desc: "Auto-add punctuation" },
  { value: "paragraphs", label: "Paragraphs", desc: "Split into paragraphs" },
  { value: "timestamped", label: "Timestamped", desc: "Include time markers" },
];

const QUALITY_OPTIONS = [
  { value: "fast", label: "Fast", desc: "Quick turnaround" },
  { value: "balanced", label: "Balanced", desc: "Speed + accuracy" },
  { value: "accurate", label: "Accurate", desc: "Maximum precision" },
];

const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm", "audio/x-m4a"];
const ACCEPTED_EXT = ".mp3,.wav,.ogg,.m4a,.webm";

// ── theme: pink ───────────────────────────────────────────────────────────────
const T = {
  border: "border-pink-600",
  bg: "bg-pink-700",
  bgHover: "hover:bg-pink-800",
  bgLight: "bg-pink-50",
  textDark: "text-pink-700",
  pill: "border-pink-600 bg-pink-50 text-pink-700",
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
  const [error, setError] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  const [audioFile, setAudioFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [language, setLanguage] = useState("auto");
  const [format, setFormat] = useState("punctuated");
  const [quality, setQuality] = useState("balanced");

  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

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

  // ── Transcribe ────────────────────────────────────────────────────────────
  const handleTranscribe = async () => {
    if (!audioFile) return setError("Please upload an audio file.");
    setError("");
    setTranscribing(true);

    const formPayload = new FormData();
    formPayload.append("audio", audioFile);
    formPayload.append("language", language);
    formPayload.append("format", format);
    formPayload.append("quality", quality);

    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: formPayload });
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
      <div className="bg-surface rounded-lg p-2 flex flex-col gap-5">

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* Audio File Upload */}
        <Field label="Audio File" required>
          {!audioFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-300 hover:border-pink-400 hover:bg-pink-50/40"
                }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all ${isDragging ? "bg-pink-100" : "bg-gray-100"
                }`}>
                <Mic className={`w-7 h-7 transition-all ${isDragging ? "text-pink-600" : "text-gray-400"}`} />
              </div>
              <p className="text-sm font-medium text-gray-700">Drop your audio file here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse</p>
              <p className="text-[10px] text-gray-400 mt-3 bg-gray-100 px-3 py-1 rounded-full">
                MP3 · WAV · OGG · M4A · WEBM · up to 100 MB
              </p>
            </div>
          ) : (
            <div className="border border-pink-200 bg-pink-50/40 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-pink-100 p-2.5 rounded-lg shrink-0">
                  <FileAudio className="w-5 h-5 text-pink-700" />
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
              {previewUrl && (
                <audio
                  ref={audioRef}
                  src={previewUrl}
                  controls
                  className="w-full mt-3 rounded-lg h-9"
                  style={{ accentColor: "#1d4ed8" }}
                />
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-[10px] font-medium text-pink-600 hover:text-pink-800 underline underline-offset-2 transition"
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${language === l.value
                    ? `${T.border} bg-pink-50`
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className={`text-xs font-semibold ${language === l.value ? T.textDark : "text-gray-700"}`}>
                  {l.label}
                </span>
                {language === l.value && (
                  <div className="w-3.5 h-3.5 bg-pink-600 rounded-full flex items-center justify-center ml-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </Field>

        {/* Transcript Format — compact flex row */}
        <Field label="Transcript Format">
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                className={`flex-1 px-2 py-2 rounded-xl border-2 cursor-pointer transition-all text-center ${format === f.value
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

        {/* Transcription Quality — compact flex row */}
        <Field label="Transcription Quality">
          <div className="flex gap-2">
            {QUALITY_OPTIONS.map((q) => (
              <button
                key={q.value}
                onClick={() => setQuality(q.value)}
                className={`flex-1 px-2 py-2 rounded-xl border-2 cursor-pointer transition-all text-center ${quality === q.value
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

        {/* Transcribe */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleTranscribe}
            className={`px-4 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}
          >
            {transcribing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><AudioLines className="w-4 h-4" /> Transcribe Audio</>
            }
          </button>
        </div>
      </div>

      {transcribing && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-10">
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
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default AudioToTextForm;