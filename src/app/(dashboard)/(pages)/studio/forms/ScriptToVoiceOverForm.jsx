"use client";
// forms/ScriptToVoiceoverForm.jsx

import React, { useState } from "react";
import { Loader2, X, Film, Mic, Zap, Leaf, Flame, Cpu, Heart, User } from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const VOICE_OPTIONS = [
    { value: "male_deep", label: "Deep male", desc: "Rich & authoritative", Icon: Mic },
    { value: "male_neutral", label: "Neutral male", desc: "Clear & professional", Icon: User },
    { value: "female_warm", label: "Warm female", desc: "Friendly & engaging", Icon: Heart },
    { value: "female_pro", label: "Pro female", desc: "Polished & confident", Icon: Mic },
    { value: "energetic", label: "Energetic", desc: "Upbeat & exciting", Icon: Zap },
    { value: "calm", label: "Calm & soothing", desc: "Relaxed & meditative", Icon: Leaf },
    { value: "dramatic", label: "Dramatic", desc: "Powerful & intense", Icon: Flame },
    { value: "neutral_ai", label: "Neutral AI", desc: "Clean synthetic voice", Icon: Cpu },
];

const TONE_OPTIONS = [
    "Conversational", "Formal", "Inspirational", "Urgent",
    "Storytelling", "Informative", "Humorous", "Empathetic",
];

const PACE_OPTIONS = [
    { value: "slow", label: "Slow", desc: "0.75× — contemplative" },
    { value: "normal", label: "Normal", desc: "1× — balanced" },
    { value: "fast", label: "Fast", desc: "1.25× — energetic" },
    { value: "rapid", label: "Rapid", desc: "1.5× — punchy" },
];

const LAYOUT_OPTIONS = [
    { value: "square", label: "Square", ratio: "1:1", w: 36, h: 36 },
    { value: "landscape", label: "Landscape", ratio: "16:9", w: 52, h: 30 },
    { value: "portrait", label: "Portrait", ratio: "9:16", w: 30, h: 52 },
];

const INSPIRE_SCRIPTS = [
    "Welcome to our product launch event, where innovation meets possibility. Today, we're unveiling something that will change the way you work forever.",
    "Imagine a world where your brand speaks directly to the heart of every customer. That world starts here, with a single story told the right way.",
    "Every great journey begins with a single step. Our team has spent years perfecting this solution so you don't have to start from scratch.",
    "The future of marketing isn't louder — it's smarter. Join thousands of brands already using AI to connect with their audience on a deeper level.",
    "In a crowded marketplace, your voice is your greatest asset. Let us help you make it unforgettable.",
];

// ── theme ─────────────────────────────────────────────────────────────────────
const T = {
    border: "border-pink-600",
    bg: "bg-pink-600",
    bgHover: "hover:bg-pink-700",
    bgLight: "bg-pink-50",
    textDark: "text-pink-700",
    accent: "text-pink-500",
    pill: "border-pink-600 bg-pink-50 text-pink-700",
};

// ─────────────────────────────────────────────────────────────────────────────

const ScriptToVoiceoverForm = ({
    formData,
    setFormData,
    activeBrand,
    sendUrl,
    showToast,
    onResult,
}) => {
    const [error, setError] = useState("");
    const [generating, setGenerating] = useState(false);

    // fields
    const [script, setScript] = useState("");
    const [voice, setVoice] = useState("neutral_ai");
    const [tone, setTone] = useState("Conversational");
    const [pace, setPace] = useState("normal");
    const [layout, setLayout] = useState("landscape");
    const [exportFormat, setExportFormat] = useState("MP4");

    // ── derived ───────────────────────────────────────────────────────────
    const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
    const estDuration = Math.max(5, Math.round(wordCount / 2.5));

    const handleInspire = () => {
        setScript(INSPIRE_SCRIPTS[Math.floor(Math.random() * INSPIRE_SCRIPTS.length)]);
        setError("");
    };

    // ── keyword extraction ────────────────────────────────────────────────
    const extractKeywords = (text) => {
        const stopWords = new Set([
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
            "by", "from", "about", "our", "is", "are", "was", "were", "be", "been", "being",
            "will", "would", "can", "could", "should", "may", "might", "this", "that", "these",
            "those", "have", "has", "had", "into", "through", "welcome", "we", "you", "your",
            "their", "its", "they", "where", "when", "who", "how", "what", "every", "already",
            "start", "starts", "here", "than", "more", "most", "some", "just", "let",
        ]);
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const freq = {};
        words.filter(w => w.length > 3 && !stopWords.has(w)).forEach(w => {
            freq[w] = (freq[w] || 0) + 1;
        });
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([w]) => w);
    };

    // ── generate ──────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!script.trim()) return setError("Please enter a script first.");
        if (!voice) return setError("Please select a voiceover style.");
        setError("");
        setGenerating(true);

        const keywords = extractKeywords(script);

        try {
            const allVideos = [];

            for (const kw of keywords) {
                const res = await fetch(`/api/pexels?query=${encodeURIComponent(kw)}&type=videos&per_page=10`);
                const data = await res.json();
                if (data.videos?.length) allVideos.push(...data.videos);
            }

            if (allVideos.length < 5) {
                for (const term of ["business", "people", "office", "creative team"]) {
                    const res = await fetch(`/api/pexels?query=${encodeURIComponent(term)}&type=videos&per_page=8`);
                    const data = await res.json();
                    if (data.videos?.length) allVideos.push(...data.videos);
                    if (allVideos.length >= 12) break;
                }
            }

            const unique = Array.from(new Map(allVideos.map(v => [v.id, v])).values());

            let filtered = unique;
            if (layout === "portrait") {
                const v = unique.filter(v => v.height > v.width);
                if (v.length) filtered = v;
            } else if (layout === "square") {
                const v = unique.filter(v => { const r = v.width / v.height; return r >= 0.85 && r <= 1.15; });
                if (v.length) filtered = v;
            } else {
                const v = unique.filter(v => v.width > v.height);
                if (v.length) filtered = v;
            }

            const selected = filtered.sort(() => Math.random() - 0.5).slice(0, 4);

            const generated = selected.map((video, i) => {
                const hd = video.video_files?.find(f => f.quality === "hd" && f.width <= 1920)
                    || video.video_files?.find(f => f.quality === "sd")
                    || video.video_files?.[0];
                return {
                    id: `stv-${video.id}-${i}`,
                    src: hd?.link || "",
                    preview: hd?.link || "",
                    thumbnail: video.image,
                    alt: `Voiceover Video ${i + 1}`,
                    type: "video",
                    videoSrc: hd?.link || "",
                    duration: video.duration,
                    pexelsUrl: video.url,
                    user: video.user?.name || "Pexels",
                    scriptExcerpt: script.slice(0, 60) + (script.length > 60 ? "…" : ""),
                    voice,
                    tone,
                };
            });

            onResult?.({ assets: generated });
            showToast?.("Videos generated successfully!");
        } catch (err) {
            console.error("Generation failed:", err);
            setError("Generation failed. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    return (
        <>
            <div className="bg-white rounded-lg p-2 flex flex-col gap-6">

                {error && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                    </div>
                )}

                {/* ── Script ─────────────────────────────────────────────────── */}
                <Field label="Script" required>
                    <div className="relative">
                        <textarea
                            value={script}
                            onChange={(e) => { setScript(e.target.value); setError(""); }}
                            placeholder="Enter your script here… e.g. 'Welcome to our product launch, where innovation meets possibility…'"
                            rows={5}
                            maxLength={2000}
                            className={`${inputCls} placeholder:text-xs placeholder:text-gray-400 resize-none`}
                        />
                        <button
                            onClick={handleInspire}
                            className="absolute bottom-3 left-3 text-xs font-semibold bg-white border border-gray-200 text-gray-500 hover:border-pink-400 hover:text-pink-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
                        >
                            ✨ Inspire me
                        </button>
                        <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">
                            {script.length}/2000
                        </span>
                    </div>
                    {script.trim() && (
                        <p className={`text-[10px] font-medium ${T.accent}`}>
                            {wordCount} words · ~{estDuration}s read time
                        </p>
                    )}
                </Field>

                <Divider label="Voice & delivery" />

                {/* ── Voiceover style ─────────────────────────────────────────── */}
                <Field label="Voiceover style" required>
                    <div className="flex flex-wrap gap-2">
                        {VOICE_OPTIONS.map(({ value, label, desc, Icon }) => (
                            <button
                                key={value}
                                onClick={() => { setVoice(value); setError(""); }}
                                className={`flex flex-row items-center gap-1.5 px-2.5 py-2 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] text-center ${voice === value
                                        ? `${T.border} ${T.bgLight}`
                                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${voice === value ? "bg-pink-100" : "bg-gray-100"
                                    }`}>
                                    <Icon className={`w-4 h-4 ${voice === value ? T.textDark : "text-gray-500"}`} />
                                </div>
                                <div className="flex flex-col">
                                    <p className={`text-[11px] font-semibold leading-tight ${voice === value ? T.textDark : "text-gray-700"}`}>
                                        {label}
                                    </p>
                                    <p className={`text-[9px] leading-tight ${voice === value ? T.accent : "text-gray-400"}`}>
                                        {desc}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </Field>

                {/* ── Tone ────────────────────────────────────────────────────── */}
                <Field label="Narration tone">
                    <div className="flex flex-wrap gap-2">
                        {TONE_OPTIONS.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTone(tone === t ? "" : t)}
                                className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${tone === t ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </Field>

                {/* ── Pace ────────────────────────────────────────────────────── */}
                <Field label="Speaking pace">
                    <div className="flex flex-wrap gap-4">
                        {PACE_OPTIONS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPace(p.value)}
                                className={`text-center px-5 py-2.5 cursor-pointer rounded-lg border-2 transition-all ${pace === p.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                    }`}
                            >
                                <p className={`text-sm font-bold ${pace === p.value ? T.textDark : "text-gray-700"}`}>{p.label}</p>
                                <p className={`text-[10px] mt-0.5 ${pace === p.value ? T.accent : "text-gray-400"}`}>{p.desc}</p>
                            </button>
                        ))}
                    </div>
                </Field>

                <Divider label="Video format" />

                {/* ── Aspect ratio ────────────────────────────────────────────── */}
                <Field label="Aspect ratio">
                    <div className="grid grid-cols-3 gap-2">
                        {LAYOUT_OPTIONS.map((l) => (
                            <button
                                key={l.value}
                                onClick={() => setLayout(l.value)}
                                className={`flex flex-col items-center gap-2 px-2 py-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${layout === l.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex items-center justify-center h-12">
                                    <div
                                        className={`rounded border-2 transition-all ${layout === l.value ? T.border : "border-gray-400"}`}
                                        style={{
                                            width: `${l.w * 0.65}px`,
                                            height: `${l.h * 0.65}px`,
                                            background: layout === l.value ? "#f5f3ff" : "#f9fafb",
                                        }}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className={`text-xs font-semibold ${layout === l.value ? T.textDark : "text-gray-700"}`}>{l.label}</p>
                                    <p className={`text-[10px] ${layout === l.value ? T.accent : "text-gray-400"}`}>{l.ratio}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </Field>

                {/* ── Export format ────────────────────────────────────────────── */}
                <Field label="Export format">
                    <div className="flex flex-wrap gap-2">
                        {["MP4", "MOV", "WebM"].map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => setExportFormat(fmt)}
                                className={`py-2.5 px-4 rounded-lg border-2 cursor-pointer text-xs font-semibold transition-all ${exportFormat === fmt
                                        ? `${T.border} ${T.bgLight} ${T.textDark}`
                                        : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                .{fmt}
                            </button>
                        ))}
                    </div>
                </Field>

                {/* ── Generate button ──────────────────────────────────────────── */}
                <div className="flex justify-end pt-1">
                    <button
                        onClick={handleGenerate}
                        className={`px-4 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}
                    >
                        {generating
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><Film className="w-4 h-4" /> Generate video</>
                        }
                    </button>
                </div>
            </div>

            {/* ── Loading overlay ───────────────────────────────────────────── */}
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

// ── Shared sub-components ─────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent";

const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            {label}{required && <span className="text-red-400">*</span>}
        </label>
        {children}
    </div>
);

const Divider = ({ label }) => (
    <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="h-px flex-1 bg-gray-100" />
    </div>
);

export default ScriptToVoiceoverForm;