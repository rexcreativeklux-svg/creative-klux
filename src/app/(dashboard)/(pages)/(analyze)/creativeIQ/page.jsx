"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    RefreshCw, Download, Brain, Upload, ChevronDown,
    Maximize2, MoreHorizontal, Share2, CheckCircle2, Loader2, X
} from "lucide-react";

// ── design token ──────────────────────────────────────────────────────────────
const PRIMARY = "#2563eb";

// ── fake result database ──────────────────────────────────────────────────────
const FAKE_RESULT = {
    iqScore: 83,
    tier: "GOOD",
    tierLabel: "Above Average",
    scoringMode: "Brand Awareness",
    platform: "Meta / Instagram",
    subScores: [
        { label: "Visual Appeal", value: 82, color: "#10b981" },
        { label: "CTA Strength", value: 61, color: "#f59e0b" },
        { label: "Copy Score", value: 79, color: "#10b981" },
    ],
    recommendations: [
        {
            title: "Add a discount or limited offer",
            body: "Creatives with clear value props show up to 90% higher conversion intent. Add urgency.",
            pts: 5,
        },
        {
            title: "Strengthen your Call-to-Action",
            body: 'Use action-driven verbs — "Get Started", "Claim Offer", "Shop Now" — not generic labels.',
            pts: 4,
        },
        {
            title: "Increase focal product saliency",
            body: "The hero product should occupy at least 40% of the frame. Reduce background noise.",
            pts: 3,
        },
        {
            title: "Reduce text density",
            body: "One headline, one sub-line, one CTA. More text reduces readability and attention span.",
            pts: 2,
        },
        {
            title: "Test a warmer color palette",
            body: "For this audience, warm tones outperform cool tones by ~18% in ad recall tests.",
            pts: 2,
        },
    ],
};

const SCORE_FOR_OPTIONS = [
    "Brand Awareness",
    "Conversion",
    "Engagement",
    "Lead Generation",
];

const PLATFORM_OPTIONS = [
    "Meta / Instagram",
    "TikTok",
    "Google Display",
    "LinkedIn",
    "YouTube",
    "Twitter / X",
];

// ── IQ donut gauge (pure SVG) ─────────────────────────────────────────────────
function IQGauge({ value, size = 120 }) {
    const r = size * 0.38;
    const cx = size / 2, cy = size / 2;
    const sweep = 270;
    const start = 135;
    const toRad = (d) => (d * Math.PI) / 180;
    const ax = (a) => cx + r * Math.cos(toRad(a));
    const ay = (a) => cy + r * Math.sin(toRad(a));
    const endAngle = start + sweep * (value / 100);
    const trackEnd = start + sweep;
    const largeArc = sweep * (value / 100) > 180 ? 1 : 0;

    const color = value >= 80 ? PRIMARY : value >= 60 ? "#f59e0b" : "#ef4444";

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* track */}
            <path
                d={`M ${ax(start)} ${ay(start)} A ${r} ${r} 0 1 1 ${ax(trackEnd)} ${ay(trackEnd)}`}
                fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round"
            />
            {/* fill */}
            <path
                d={`M ${ax(start)} ${ay(start)} A ${r} ${r} 0 ${largeArc} 1 ${ax(endAngle)} ${ay(endAngle)}`}
                fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            />
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={size * 0.2} fontWeight="700" fill="#111827">{value}%</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize={size * 0.09} fill="#6b7280" letterSpacing="0.5">GOOD</text>
        </svg>
    );
}

// ── select component ──────────────────────────────────────────────────────────
function Select({ label, options, value, onChange }) {
    return (
        <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer pr-8"
                    style={{ focusRingColor: PRIMARY }}
                >
                    {options.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
        </div>
    );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function CreativeIQPage() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [scoreFor, setScoreFor] = useState(SCORE_FOR_OPTIONS[0]);
    const [platform, setPlatform] = useState(PLATFORM_OPTIONS[0]);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null); // null = not yet analyzed
    const [animBars, setAnimBars] = useState(false);
    const fileRef = useRef();

    const acceptFile = (f) => {
        if (!f) return;
        setFile(f);
        setResult(null);
        setAnimBars(false);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(f);
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        acceptFile(e.dataTransfer.files?.[0]);
    }, []);

    const clearFile = () => { setFile(null); setPreview(null); setResult(null); setAnimBars(false); };

    // simulate API call with fake data
    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        await new Promise((r) => setTimeout(r, 2200)); // fake latency
        setResult(FAKE_RESULT);
        setAnalyzing(false);
        setTimeout(() => setAnimBars(true), 300);
    };

    const hasResult = !!result;

    return (
        <div className="min-h-screen " style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* ── top bar ── */}
            <div className="flex mb-3 items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" style={{ color: PRIMARY }} />
                    <span className="font-semibold text-gray-900 text-sm">Creative IQ</span>
                    <span className="text-xs text-gray-400 ml-1">— Ad scoring &amp; recommendations</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center hover:scale-105 gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">
                        <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                    <button
                        className="flex items-center gap-1.5 hover:scale-105 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition cursor-pointer"
                        style={{ background: PRIMARY }}
                    >
                        <Download className="w-3 h-3" /> Export PDF
                    </button>
                </div>
            </div>

            {/* ── info banner ── */}
            <div className="px-6 py-2.5 flex rounded-lg items-center gap-2 border border-blue-100" style={{ background: "#eff6ff" }}>
                <Brain className="w-3.5 h-3.5 shrink-0" style={{ color: PRIMARY }} />
                <p className="text-xs text-blue-700">
                    Upload any ad creative. Creative IQ scores it for conversion, awareness, or engagement and gives AI-powered recommendations.
                </p>
            </div>

            {/* ── body ── */}
            <div className=" py-7  mx-auto">
                <AnimatePresence mode="wait">

                    {/* ══ CENTERED (no result yet) ══════════════════════════════════════ */}
                    {!hasResult && (
                        <motion.div
                            key="centered"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.22 }}
                            className="flex flex-col items-center justify-center"
                            style={{ minHeight: "calc(100vh - 300px)" }}
                        >
                            <div className="w-full max-w-xl">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Upload Creative</p>

                                {/* drop zone */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={onDrop}
                                    onClick={() => !file && fileRef.current?.click()}
                                    className="relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden"
                                    style={{
                                        borderColor: dragging ? PRIMARY : file ? "#d1d5db" : "#d1d5db",
                                        background: dragging ? "#eff6ff" : "#ffffff",
                                        cursor: file ? "default" : "pointer",
                                        minHeight: 220,
                                    }}
                                >
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*,video/mp4"
                                        className="hidden"
                                        onChange={(e) => acceptFile(e.target.files?.[0])}
                                    />

                                    {file && preview ? (
                                        <div className="relative w-full">
                                            <img
                                                src={preview}
                                                alt="preview"
                                                className="w-full h-auto object-cover rounded-xl"
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                                                className="absolute top-2 right-2 w-7 h-7 bg-white cursor-pointer rounded-full hover:scale-105 border border-gray-200 flex items-center justify-center  hover:bg-gray-100 transition"
                                            >
                                                <X className="w-3.5 h-3.5 text-gray-500" />
                                            </button>
                                            <div className="px-4 pt-2 pb-3">
                                                <p className="text-xs font-semibold text-gray-700 truncate">{file.name}</p>
                                                <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-2 py-14">
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                                                style={{ background: `${PRIMARY}12` }}
                                            >
                                                <Upload className="w-5 h-5" style={{ color: PRIMARY }} />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-700">Drop your creative here</p>
                                            <p className="text-xs text-gray-400">PNG, JPG, GIF, MP4 — max 50MB</p>
                                        </div>
                                    )}
                                </div>

                                {/* selects */}
                                <div className="flex gap-3 mt-4">
                                    <Select label="Score for" options={SCORE_FOR_OPTIONS} value={scoreFor} onChange={setScoreFor} />
                                    <Select label="Platform" options={PLATFORM_OPTIONS} value={platform} onChange={setPlatform} />
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!file || analyzing}
                                    className="mt-4 w-full flex items-center hover:scale-105 justify-center gap-2 py-3.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-50"
                                    style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1d4ed8)` }}
                                >
                                    {analyzing
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                                        : <><Brain className="w-4 h-4" /> Analyze Creative</>
                                    }
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ══ SPLIT (result visible) ════════════════════════════════════════ */}
                    {hasResult && (
                        <motion.div
                            key="split"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25 }}
                            className="grid gap-5"
                            style={{ gridTemplateColumns: "1fr 1fr" }}
                        >
                            {/* ── LEFT: upload panel ── */}
                            <div className="flex flex-col gap-4">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Upload Creative</p>

                                {/* drop zone */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={onDrop}
                                    className="rounded-2xl border border-gray-200 bg-white  overflow-hidden"
                                >
                                    {/* mini drop hint */}
                                    <div
                                        className="border-b border-dashed border-gray-200 px-4 py-2 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        <p className="text-[11px] text-gray-400">PNG, JPG, GIF, MP4 — max 50MB</p>
                                    </div>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*,video/mp4"
                                        className="hidden"
                                        onChange={(e) => acceptFile(e.target.files?.[0])}
                                    />

                                    {/* file card */}
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
                                                    <Upload className="w-3 h-3 text-gray-500" />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
                                                    {file?.name?.replace(/\.[^.]+$/, "") || "Creative"}
                                                </span>
                                            </div>

                                        </div>

                                        {/* preview */}
                                        {preview && (
                                            <div className=" overflow-hidden  mb-3">
                                                <img src={preview} alt="creative" className="w-full object-contain max-h-72" />
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{file?.name?.replace(/\.[^.]+$/, "") || "Untitled"}</p>
                                                <p className="text-xs text-gray-400">{(file?.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer transition">
                                                    <Share2 className="w-3.5 h-3.5 text-gray-500" />
                                                </button>
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#dcfce7" }}>
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* selects */}
                                <div className="flex gap-3">
                                    <Select label="Score for" options={SCORE_FOR_OPTIONS} value={scoreFor} onChange={setScoreFor} />
                                    <Select label="Platform" options={PLATFORM_OPTIONS} value={platform} onChange={setPlatform} />
                                </div>

                                {/* re-analyze */}
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="w-full flex items-center hover:scale-105 justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition cursor-pointer disabled:opacity-50"
                                    style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1d4ed8)` }}
                                >
                                    {analyzing
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                                        : <><Brain className="w-4 h-4" /> Re-analyze</>
                                    }
                                </button>
                            </div>

                            {/* ── RIGHT: results ── */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="flex flex-col gap-4"
                            >
                                {/* IQ Score card */}
                                <div className="bg-white rounded-2xl border border-gray-200  p-5">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">IQ Score</p>

                                    <div className="flex items-center gap-6 mb-5">
                                        <IQGauge value={result.iqScore} size={110} />
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Awareness Score</p>
                                            <p className="text-4xl font-black text-gray-900">{result.iqScore}%</p>
                                            <span
                                                className="inline-block mt-1 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-md uppercase"
                                                style={{ background: "#dcfce7", color: "#15803d" }}
                                            >
                                                {result.tierLabel}
                                            </span>
                                        </div>
                                    </div>

                                    {/* sub scores */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {result.subScores.map((s) => (
                                            <div
                                                key={s.label}
                                                className="rounded-xl p-3 text-center border border-gray-100"
                                                style={{ background: "#f9fafb" }}
                                            >
                                                <p className="text-[10px] text-gray-400 mb-1">{s.label}</p>
                                                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}%</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* AI recommendations */}
                                <div className="bg-white rounded-2xl border border-gray-200  p-5 flex-1">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">AI Recommendations</p>
                                    <div className="flex flex-col gap-4">
                                        {result.recommendations.map((rec, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: 0.15 + i * 0.07 }}
                                                className="flex items-start gap-3"
                                            >
                                                <div
                                                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                                                    style={{ background: PRIMARY }}
                                                >
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-semibold text-gray-800 leading-snug">{rec.title}</p>
                                                        <span
                                                            className="shrink-0 text-[11px] font-bold"
                                                            style={{ color: "#10b981" }}
                                                        >
                                                            +{rec.pts} pts
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{rec.body}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}