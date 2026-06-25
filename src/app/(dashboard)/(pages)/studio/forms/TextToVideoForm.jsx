"use client";
// forms/TextToVideoForm.jsx

import React, { useState } from "react";
import {
    Sparkles, Loader2, X, Film, Clock,
    Camera, Smile, Shapes, Star, Droplet, Palette, Cpu, Minus,
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
];

const LAYOUT_OPTIONS = [
    { value: "square",    label: "Square",    ratio: "1:1",  w: 48, h: 48 },
    { value: "landscape", label: "Landscape", ratio: "16:9", w: 64, h: 36 },
    { value: "portrait",  label: "Portrait",  ratio: "9:16", w: 36, h: 64 },
];

const DURATION_OPTIONS = [
    { value: "5",  label: "5s",  desc: "Quick clip" },
    { value: "10", label: "10s", desc: "Short form" },
    { value: "15", label: "15s", desc: "Story / ad" },
    { value: "30", label: "30s", desc: "Full spot"  },
];

const MOTION_OPTIONS = [
    "Slow Motion", "Time-lapse", "Smooth Pan", "Zoom In", "Zoom Out",
    "Dolly Shot", "Static", "Handheld",
];

const INSPIRE_PROMPTS = [
    "A luxury car driving on coastal road at sunset with cinematic motion",
    "A chef cooking in cozy kitchen with warm cinematic lighting",
    "Peaceful timelapse of stars over snowy mountains",
    "A rocket launching into space with dramatic slow-motion flames",
    "Cozy coffee shop with rain on window, warm ambiance and bokeh",
    "A lion walking across savanna at golden hour in slow motion",
    "Brand product reveal with elegant lighting and smooth camera movement",
    "Happy team celebrating success in a modern glass office",
];

const STYLE_MAP = {
    photorealistic: "realistic cinematic high quality",
    cartoon:        "cartoon animated colorful",
    anime:          "anime japanese animation",
    abstract:       "abstract surreal motion",
    watercolor:     "watercolor painting style",
    oil_painting:   "oil painting style",
    cyberpunk:      "cyberpunk neon futuristic",
    minimalist:     "minimalist clean aesthetic",
};

// ── theme ─────────────────────────────────────────────────────────────────────
const T = {
    border:   "border-pink-600",
    bg:       "bg-pink-600",
    bgHover:  "hover:bg-pink-700",
    bgLight:  "bg-pink-50",
    textDark: "text-pink-700",
    pill:     "border-pink-600 bg-pink-50 text-pink-700",
};

// ─────────────────────────────────────────────────────────────────────────────

const TextToVideoForm = ({ formData, setFormData, activeBrand, showToast, onResult }) => {
    const [error,      setError]     = useState("");
    const [generating, setGenerating]= useState(false);

    const [prompt,   setPrompt]  = useState("");
    const [style,    setStyle]   = useState(STYLE_OPTIONS[0].value);
    const [motion,   setMotion]  = useState("");
    const [layout,   setLayout]  = useState("landscape");
    const [duration, setDuration]= useState("15");

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

        const styleKeyword = STYLE_MAP[style] || style.replace("_", " ");
        const motionKeyword = motion || "";
        const query = `${prompt} ${styleKeyword} ${motionKeyword}`.trim();
        const proxy = (url) => `/api/proxy-media?url=${encodeURIComponent(url)}`;

        try {
            const res  = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&type=videos&per_page=8`);
            const data = await res.json();

            const generated = (data.videos || []).slice(0, 4).map((video, i) => {
                const hd = video.video_files?.find((f) => f.quality === "hd") || video.video_files?.[0];
                return {
                    id:       `ttv-${video.id}-${i}`,
                    src:      proxy(hd?.link || ""),
                    preview:  proxy(hd?.link || ""),
                    thumbnail:proxy(video.image || ""),
                    alt:      video.url?.split("/").pop()?.replace(/-/g, " ") || `Generated video ${i + 1}`,
                    type:     "video",
                    videoSrc: proxy(hd?.link || ""),
                    duration,
                };
            });

            if (onResult) onResult({ assets: generated });
        } catch (err) {
            console.error("Video generation failed:", err);
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
                <Field label="Video Prompt" required>
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => { setPrompt(e.target.value); setError(""); }}
                            placeholder="Describe the video scene… include subject, movement, lighting, setting, and camera motion."
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

                {/* Camera / Motion */}
                {/* <Field label="Camera / Motion Style">
                    <div className="flex flex-wrap gap-2">
                        {MOTION_OPTIONS.map((m) => (
                            <button
                                key={m}
                                onClick={() => setMotion(motion === m ? "" : m)}
                                className={`px-3 py-1.5 rounded-md border cursor-pointer text-xs font-semibold transition-all ${
                                    motion === m
                                        ? T.pill
                                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </Field> */}

                {/* Duration — compact content-width pills */}
                <Field label="Video Duration">
                    <div className="flex flex-wrap gap-2">
                        {DURATION_OPTIONS.map((d) => (
                            <button
                                key={d.value}
                                onClick={() => setDuration(d.value)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 ${
                                    duration === d.value
                                        ? `${T.border} ${T.bgLight}`
                                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                }`}
                            >
                                <Clock className={`w-3.5 h-3.5 shrink-0 ${duration === d.value ? T.textDark : "text-gray-400"}`} />
                                <span className={`text-xs font-semibold ${duration === d.value ? T.textDark : "text-gray-600"}`}>{d.label}</span>
                                <span className={`text-[10px] font-semibold ${duration === d.value ? "text-pink-500" : "text-gray-500"}`}>{d.desc}</span>
                            </button>
                        ))}
                    </div>
                </Field>

                {/* Aspect Ratio — compact content-width pills */}
                <Field label="Aspect Ratio">
                    <div className="flex flex-wrap gap-2">
                        {LAYOUT_OPTIONS.map((l) => (
                            <button
                                key={l.value}
                                onClick={() => setLayout(l.value)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 ${
                                    layout === l.value
                                        ? `${T.border} ${T.bgLight}`
                                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
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
                            : <><Film className="w-4 h-4" /> Generate Videos</>
                        }
                    </button>
                </div>
            </div>

            {generating && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-surface rounded-2xl p-10">
                        <FloatingAnimation showProgressBar><FloatingElements.VideoFile /></FloatingAnimation>
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

export default TextToVideoForm;