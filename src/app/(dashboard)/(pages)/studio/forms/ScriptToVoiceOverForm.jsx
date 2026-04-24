"use client";
// forms/ScriptToVoiceoverForm.jsx

import React, { useState } from "react";
import {
    Loader2, X, ChevronRight, Mic, LayoutTemplate, Film, Wand2,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

// ── constants ─────────────────────────────────────────────────────────────────

const VOICE_OPTIONS = [
    {
        value: "male_deep",
        label: "Deep Male",
        desc: "Rich & authoritative",
        image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
        value: "male_neutral",
        label: "Neutral Male",
        desc: "Clear & professional",
        image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
        value: "female_warm",
        label: "Warm Female",
        desc: "Friendly & engaging",
        image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
        value: "female_professional",
        label: "Pro Female",
        desc: "Polished & confident",
        image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
        value: "energetic",
        label: "Energetic",
        desc: "Upbeat & exciting",
        image: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
        value: "calm",
        label: "Calm & Soothing",
        desc: "Relaxed & meditative",
        image: "https://images.pexels.com/photos/936564/pexels-photo-936564.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
        value: "dramatic",
        label: "Dramatic",
        desc: "Powerful & intense",
        image: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
    {
        value: "neutral_ai",
        label: "Neutral AI",
        desc: "Clean synthetic voice",
        image: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=200",
    },
];

const TONE_OPTIONS = [
    "Conversational", "Formal", "Inspirational", "Urgent", "Storytelling",
    "Informative", "Humorous", "Empathetic",
];

const PACE_OPTIONS = [
    { value: "slow", label: "Slow", desc: "0.75× — contemplative" },
    { value: "normal", label: "Normal", desc: "1× — balanced" },
    { value: "fast", label: "Fast", desc: "1.25× — energetic" },
    { value: "rapid", label: "Rapid", desc: "1.5× — punchy" },
];

const LAYOUT_OPTIONS = [
    { value: "square", label: "Square", ratio: "1:1", w: 48, h: 48 },
    { value: "landscape", label: "Landscape", ratio: "16:9", w: 64, h: 36 },
    { value: "portrait", label: "Portrait", ratio: "9:16", w: 36, h: 64 },
];

const BACKGROUND_OPTIONS = [
    { value: "stock_video", label: "Stock Video", desc: "Pexels B-roll clips" },
    { value: "slideshow", label: "Slideshow", desc: "Images + transitions" },
    { value: "solid_color", label: "Solid Color", desc: "Clean branded BG" },
    { value: "animated_bg", label: "Animated BG", desc: "Motion graphics" },
];

const CAPTION_OPTIONS = [
    { value: "none", label: "None", desc: "No captions" },
    { value: "auto", label: "Auto Sync", desc: "Word-by-word" },
    { value: "bottom", label: "Bottom Bar", desc: "Subtitle style" },
    { value: "dynamic", label: "Dynamic", desc: "Animated pop-ups" },
];

const MUSIC_OPTIONS = [
    "No Music", "Upbeat Corporate", "Cinematic", "Lo-fi Chill", "Epic Orchestral",
    "Acoustic Warm", "Electronic Pulse", "Ambient Minimal",
];

const QUALITY_OPTIONS = [
    { value: "standard", label: "Standard", desc: "Fast generation" },
    { value: "hd", label: "HD", desc: "Higher detail" },
    { value: "ultra", label: "Ultra", desc: "Max quality" },
];

const INSPIRE_SCRIPTS = [
    "Welcome to our product launch event, where innovation meets possibility. Today, we're unveiling something that will change the way you work forever.",
    "Imagine a world where your brand speaks directly to the heart of every customer. That world starts here, with a single story told the right way.",
    "Every great journey begins with a single step. Our team has spent years perfecting this solution so you don't have to start from scratch.",
    "The future of marketing isn't louder — it's smarter. Join thousands of brands already using AI to connect with their audience on a deeper level.",
    "From humble beginnings to industry leader, our story is one of passion, perseverance, and an unwavering commitment to our customers.",
    "In a crowded marketplace, your voice is your greatest asset. Let us help you make it unforgettable.",
];

const STEPS = [
    { id: 1, label: "Script & Voice", icon: Mic },
    { id: 2, label: "Video & Format", icon: LayoutTemplate },
    { id: 3, label: "Output Settings", icon: Film },
];

// ── theme: violet/indigo for script pipeline ──────────────────────────────────
const T = {
    border: "border-violet-600",
    bg: "bg-violet-600",
    bgHover: "hover:bg-violet-700",
    bgLight: "bg-violet-50",
    textDark: "text-violet-700",
    importBg: "bg-violet-50/40",
    importBorder: "border-violet-100",
    stepActive: "border-violet-600 bg-violet-600 text-white",
    stepCurrent: "border-violet-600 text-violet-600 bg-white",
    connector: "bg-violet-600",
    pill: "border-violet-600 bg-violet-50 text-violet-700",
    accent: "text-violet-500",
    ring: "focus:ring-violet-500",
    inputFocus: "focus:ring-violet-500 focus:border-transparent",
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
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [generating, setGenerating] = useState(false);

    // ── Step 1: Script & Voice ────────────────────────────────────────────
    const [script, setScript] = useState("");
    const [voice, setVoice] = useState("");
    const [tone, setTone] = useState("");
    const [pace, setPace] = useState("normal");

    // ── Step 2: Video & Format ────────────────────────────────────────────
    const [layout, setLayout] = useState("landscape");
    const [background, setBackground] = useState("stock_video");
    const [captions, setCaptions] = useState("auto");
    const [music, setMusic] = useState("No Music");

    // ── Step 3: Output ────────────────────────────────────────────────────
    const [quality, setQuality] = useState("hd");
    const [count, setCount] = useState(4);
    const [exportFormat, setExportFormat] = useState("MP4");

    // ── Helpers ───────────────────────────────────────────────────────────
    const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
    const estDuration = Math.max(5, Math.round(wordCount / 2.5)); // ~150wpm / 60

    const handleInspire = () => {
        setScript(INSPIRE_SCRIPTS[Math.floor(Math.random() * INSPIRE_SCRIPTS.length)]);
        setError("");
    };

    // ── Step navigation ───────────────────────────────────────────────────
    const handleContinue = () => {
        if (step === 1) {
            if (!script.trim()) return setError("Please enter a script first.");
            if (!voice) return setError("Please select a voiceover style.");
        }
        setError("");
        setStep((p) => p + 1);
    };

    // ── Extract keywords for Pexels query ────────────────────────────────
    const extractKeywords = (text) => {
        const stopWords = new Set([
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "about", "our", "is", "are", "was", "were",
            "be", "been", "being", "will", "would", "can", "could", "should", "may",
            "might", "this", "that", "these", "those", "have", "has", "had", "into",
            "through", "welcome", "we", "you", "your", "their", "its", "they",
            "where", "when", "who", "how", "what", "every", "already", "start",
            "starts", "here", "than", "more", "most", "some", "just", "let",
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

    // ── Generate ──────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!script.trim()) return setError("Please enter a script.");
        setError("");
        setGenerating(true);

        const keywords = extractKeywords(script);
        const orientation =
            layout === "portrait" ? "portrait"
                : layout === "landscape" ? "landscape"
                    : "square";

        try {
            const allVideos = [];

            for (const kw of keywords) {
                const res = await fetch(
                    `/api/pexels?query=${encodeURIComponent(kw)}&type=videos&per_page=10`
                );
                const data = await res.json();
                if (data.videos?.length) allVideos.push(...data.videos);
            }

            // Fallback broad search
            if (allVideos.length < 5) {
                const fallbacks = ["business", "people", "office", "creative team"];
                for (const term of fallbacks) {
                    const res = await fetch(
                        `/api/pexels?query=${encodeURIComponent(term)}&type=videos&per_page=8`
                    );
                    const data = await res.json();
                    if (data.videos?.length) allVideos.push(...data.videos);
                    if (allVideos.length >= 12) break;
                }
            }

            // Deduplicate
            const unique = Array.from(new Map(allVideos.map(v => [v.id, v])).values());

            // Filter by layout preference
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

            const selected = filtered.sort(() => Math.random() - 0.5).slice(0, count);

            const proxy = (url) => `/api/proxy-media?url=${encodeURIComponent(url)}`;

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

            if (onResult) onResult({ assets: generated });
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
            {/* ── Step indicator ───────────────────────────────────────────── */}
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
                                    <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${step > s.id ? T.stepActive
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

            {/* ── Form body ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-lg p-2 flex flex-col gap-5">

                {error && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                    </div>
                )}

                {/* ══ STEP 1 — Script & Voice ══════════════════════════════════ */}
                {step === 1 && (
                    <div className="flex flex-col gap-5">
                        <SectionTitle>Script & Voiceover</SectionTitle>

                        {/* Script textarea */}
                        <Field label="Your Script" required>
                            <div className="relative">
                                <textarea
                                    value={script}
                                    onChange={(e) => { setScript(e.target.value); setError(""); }}
                                    placeholder="Enter your full script here… (e.g., 'Welcome to our product launch event, where innovation meets possibility…')"
                                    rows={5}
                                    className={`${inputCls} placeholder:text-xs placeholder:text-gray-400 resize-none`}
                                />
                                <button
                                    onClick={handleInspire}
                                    className="absolute bottom-3 left-3 text-xs font-semibold bg-white border border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
                                >
                                    ✨ Inspire Me
                                </button>
                                <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">{script.length}/2000</span>
                            </div>
                            {/* Word count + estimated duration */}
                            {script.trim() && (
                                <div className={`flex gap-4 mt-1 text-[10px] font-medium ${T.accent}`}>
                                    <span>{wordCount} words</span>
                                    <span>~{estDuration}s read time</span>
                                </div>
                            )}
                        </Field>

                        {/* Voiceover style — avatar grid */}
                        <Field label="Voiceover Style" required>
                            <div className="grid grid-cols-4 gap-2">
                                {VOICE_OPTIONS.map((v) => (
                                    <button
                                        key={v.value}
                                        onClick={() => { setVoice(v.value); setError(""); }}
                                        className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] text-center ${voice === v.value
                                            ? `${T.border} ${T.bgLight}`
                                            : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                            }`}
                                    >
                                        <img
                                            src={v.image}
                                            alt={v.label}
                                            className="w-full h-14 object-cover rounded-lg"
                                        />
                                        <p className={`text-[11px] font-semibold leading-tight ${voice === v.value ? T.textDark : "text-gray-700"}`}>
                                            {v.label}
                                        </p>
                                        <p className={`text-[9px] leading-tight ${voice === v.value ? T.accent : "text-gray-400"}`}>
                                            {v.desc}
                                        </p>
                                        {voice === v.value && (
                                            <div className={`absolute top-1.5 right-1.5 w-4 h-4 ${T.bg} rounded-full flex items-center justify-center`}>
                                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {/* Tone */}
                        <Field label="Narration Tone">
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

                        {/* Speaking Pace */}
                        <Field label="Speaking Pace">
                            <div className="grid grid-cols-4 gap-2">
                                {PACE_OPTIONS.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => setPace(p.value)}
                                        className={`text-left px-2 py-2.5 cursor-pointer rounded-xl border-2 transition-all ${pace === p.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                            }`}
                                    >
                                        <p className={`text-sm font-bold text-center ${pace === p.value ? T.textDark : "text-gray-700"}`}>{p.label}</p>
                                        <p className={`text-[10px] text-center mt-0.5 ${pace === p.value ? T.accent : "text-gray-400"}`}>{p.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </div>
                )}

                {/* ══ STEP 2 — Video & Format ══════════════════════════════════ */}
                {step === 2 && (
                    <div className="flex flex-col gap-5">
                        <SectionTitle>Video & Format</SectionTitle>

                        {/* Layout / Aspect Ratio */}
                        <Field label="Aspect Ratio / Layout">
                            <div className="grid grid-cols-3 gap-2">
                                {LAYOUT_OPTIONS.map((l) => (
                                    <button
                                        key={l.value}
                                        onClick={() => setLayout(l.value)}
                                        className={`flex flex-col items-center gap-2 px-2 py-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${layout === l.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="flex items-center justify-center h-12">
                                            <div
                                                className={`rounded border-2 transition-all ${layout === l.value ? T.border : "border-gray-400"}`}
                                                style={{
                                                    width: `${l.w * 0.6}px`,
                                                    height: `${l.h * 0.6}px`,
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

                        {/* Background Style */}
                        <Field label="Background Type">
                            <div className="grid grid-cols-2 gap-2">
                                {BACKGROUND_OPTIONS.map((b) => (
                                    <button
                                        key={b.value}
                                        onClick={() => setBackground(b.value)}
                                        className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${background === b.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                            }`}
                                    >
                                        <p className={`text-xs font-bold ${background === b.value ? T.textDark : "text-gray-700"}`}>{b.label}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{b.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {/* Captions */}
                        <Field label="Caption / Subtitle Style">
                            <div className="grid grid-cols-2 gap-2">
                                {CAPTION_OPTIONS.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => setCaptions(c.value)}
                                        className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${captions === c.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                            }`}
                                    >
                                        <p className={`text-xs font-bold ${captions === c.value ? T.textDark : "text-gray-700"}`}>{c.label}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{c.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {/* Background Music */}
                        <Field label="Background Music">
                            <div className="flex flex-wrap gap-2">
                                {MUSIC_OPTIONS.map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMusic(music === m ? "" : m)}
                                        className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${music === m ? T.pill : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </div>
                )}

                {/* ══ STEP 3 — Output Settings ═════════════════════════════════ */}
                {step === 3 && (
                    <div className="flex flex-col gap-5">
                        <SectionTitle>Output Settings</SectionTitle>

                        {/* Quality */}
                        <Field label="Output Quality">
                            <div className="grid grid-cols-3 gap-2">
                                {QUALITY_OPTIONS.map((q) => (
                                    <button
                                        key={q.value}
                                        onClick={() => setQuality(q.value)}
                                        className={`text-left px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${quality === q.value ? `${T.border} ${T.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                            }`}
                                    >
                                        <p className={`text-xs font-bold ${quality === q.value ? T.textDark : "text-gray-700"}`}>{q.label}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{q.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {/* Export Format */}
                        <Field label="Export Format">
                            <div className="grid grid-cols-3 gap-2">
                                {["MP4", "MOV", "WebM"].map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setExportFormat(fmt)}
                                        className={`py-2.5 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all ${exportFormat === fmt ? `${T.border} ${T.bgLight} ${T.textDark}` : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        .{fmt}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {/* Number of videos */}
                        <Field label={`Number of Variations: ${count}`}>
                            <input
                                type="range" min={1} max={6} step={1}
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="w-full accent-violet-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                {[1, 2, 3, 4, 5, 6].map((n) => (
                                    <span key={n} className={count === n ? "text-violet-600 font-bold" : ""}>{n}</span>
                                ))}
                            </div>
                        </Field>

                        {/* Full summary */}
                        <div className={`rounded-xl p-3.5 ${T.importBg} border ${T.importBorder} flex flex-col gap-2`}>
                            <p className={`text-[10px] font-semibold ${T.textDark} uppercase tracking-wider`}>Pipeline Summary</p>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                                <SummaryRow label="Voice" value={VOICE_OPTIONS.find(v => v.value === voice)?.label || "—"} />
                                <SummaryRow label="Tone" value={tone || "—"} />
                                <SummaryRow label="Pace" value={PACE_OPTIONS.find(p => p.value === pace)?.label || "—"} />
                                <SummaryRow label="Layout" value={layout || "—"} />
                                <SummaryRow label="Background" value={BACKGROUND_OPTIONS.find(b => b.value === background)?.label || "—"} />
                                <SummaryRow label="Captions" value={CAPTION_OPTIONS.find(c => c.value === captions)?.label || "—"} />
                                <SummaryRow label="Music" value={music || "None"} />
                                <SummaryRow label="Quality" value={quality.toUpperCase()} />
                                <SummaryRow label="Format" value={`.${exportFormat}`} />
                                <SummaryRow label="Variations" value={`${count} video${count > 1 ? "s" : ""}`} />
                            </div>

                            <div className="mt-1 pt-2 border-t border-violet-100">
                                <p className={`text-[10px] font-semibold ${T.textDark} mb-0.5`}>Script Preview</p>
                                <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                                    {script.slice(0, 120)}{script.length > 120 ? "…" : ""}
                                </p>
                                <p className={`text-[10px] ${T.accent} mt-1`}>{wordCount} words · ~{estDuration}s</p>
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
                            onClick={handleGenerate}
                            className={`px-3 py-2 ${T.bg} ${T.bgHover} cursor-pointer text-white rounded-lg text-sm font-semibold hover:scale-105 flex items-center gap-2 transition`}
                        >
                            {generating
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><Film className="w-4 h-4" /> Generate Videos</>
                            }
                        </button>
                    )}
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
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

const SectionTitle = ({ children }) => (
    <h3 className="font-semibold text-gray-900 text-base">{children}</h3>
);

const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            {label}{required && <span className="text-red-400">*</span>}
        </label>
        {children}
    </div>
);

const SummaryRow = ({ label, value }) => (
    <>
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-gray-700 font-semibold truncate">{value}</span>
    </>
);

export default ScriptToVoiceoverForm;