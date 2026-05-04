"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star, Upload, Loader2, CheckCircle, AlertCircle, X,
    LayoutGrid, Image as ImageIcon, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RadialBarChart, RadialBar } from "recharts";

/* ─── helpers ─────────────────────────────────────────────────── */
const scoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#2563eb";
    if (score >= 40) return "#f97316";
    return "#ef4444";
};

/* ─── sub-components ──────────────────────────────────────────── */
const ScoreGauge = ({ label, value }) => (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
        <div className="relative">
            <RadialBarChart
                width={100} height={100} cx={50} cy={50}
                innerRadius={32} outerRadius={45}
                data={[{ value, fill: scoreColor(value) }]}
                startAngle={90} endAngle={-270}
            >
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#e5e7eb" }} />
            </RadialBarChart>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold" style={{ color: scoreColor(value) }}>
                    {value}%
                </span>
            </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">{label}</p>
    </div>
);

/* ─── DesignModal ─────────────────────────────────────────────── */
function DesignModal({ onClose, onSelect }) {
    const { fetchDesigns } = useAuth();
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState("");

    // Fetch on mount
    React.useEffect(() => {
        (async () => {
            setLoading(true);
            const result = await fetchDesigns(50); // fetch up to 50 designs
            if (!result) {
                setError("Failed to load designs. Make sure you have an active brand selected.");
            } else {
                const arr = Array.isArray(result)
                    ? result
                    : Array.isArray(result.data)
                        ? result.data
                        : [];
                setDesigns(arr);
            }
            setLoading(false);
        })();
    }, []);

    const handleConfirm = () => {
        if (!selected) return;
        onSelect(selected);
        onClose();
    };

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                        >
                            <LayoutGrid className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">Choose a Design</p>
                            <p className="text-xs text-gray-400">Select a saved creative to score</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-sm text-gray-400">Loading your designs…</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    )}

                    {!loading && !error && designs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <LayoutGrid className="w-10 h-10 text-gray-200" />
                            <p className="text-sm text-gray-400">No saved designs found for this brand.</p>
                        </div>
                    )}

                    {/* Masonry grid */}
                    {!loading && designs.length > 0 && (
                        <div className="columns-2 md:columns-3 gap-3 space-y-3">
                            {designs.map((design) => {
                                const canvasData = (() => {
                                    try {
                                        return typeof design.canvas === "string"
                                            ? JSON.parse(design.canvas)
                                            : design.canvas;
                                    } catch {
                                        return null;
                                    }
                                })();
                                const copyData = (() => {
                                    try {
                                        return typeof design.copy === "string"
                                            ? JSON.parse(design.copy)
                                            : design.copy;
                                    } catch {
                                        return {};
                                    }
                                })();

                                const bgColor = canvasData?.canvas?.background || "#f4f4f4";
                                const isSelected = selected?.id === design.id;

                                // Find first image element for thumbnail
                                const imgEl = canvasData?.elements?.find((el) => el.type === "image");

                                return (
                                    <div
                                        key={design.id}
                                        onClick={() => setSelected(design)}
                                        className="break-inside-avoid mb-3 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200"
                                        style={{
                                            borderColor: isSelected ? "#2563eb" : "transparent",
                                            boxShadow: isSelected
                                                ? "0 0 0 3px rgba(37,99,235,0.18)"
                                                : "0 1px 4px rgba(0,0,0,0.07)",
                                        }}
                                    >
                                        {/* Preview area */}
                                        <div
                                            className="w-full relative flex items-center justify-center overflow-hidden"
                                            style={{ background: bgColor, minHeight: 100, aspectRatio: "4/3" }}
                                        >
                                            {imgEl ? (
                                                <img
                                                    src={imgEl.url}
                                                    alt={design.name}
                                                    className="w-full h-auto object-cover"
                                                    style={{ opacity: imgEl.opacity ?? 1 }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-8 h-8 text-gray-300" />
                                                </div>
                                            )}

                                            {/* Selected checkmark */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                </div>
                                            )}

                                            {/* Score badge */}
                                            {design.score && (
                                                <div
                                                    className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                                    style={{ background: scoreColor(design.score) }}
                                                >
                                                    {design.score}
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="bg-white px-3 py-2">
                                            <p className="text-xs font-semibold text-gray-800 truncate">{design.name}</p>
                                            {copyData?.headline && (
                                                <p className="text-xs text-gray-400 truncate mt-0.5">{copyData.headline}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                        {selected ? `Selected: ${selected.name}` : "No design selected"}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selected}
                            className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                        >
                            Use This Design <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function CreativeScoring() {
    const { creativeScoring } = useAuth();

    // Source: "image" | "design" | null
    const [source, setSource] = useState(null);

    // Image upload state
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    // Design state
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Scoring state
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    /* ── handlers ── */
    const acceptFile = (f) => {
        if (!f) return;
        setFile(f);
        setSource("image");
        setSelectedDesign(null);
        setData(null);
        setError("");
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(f);
    };

    const clearAll = () => {
        setFile(null);
        setPreview(null);
        setSelectedDesign(null);
        setSource(null);
        setData(null);
        setError("");
    };

    const handleDesignSelect = (design) => {
        setSelectedDesign(design);
        setSource("design");
        setFile(null);
        setPreview(null);
        setData(null);
        setError("");
    };

    const handleScore = async () => {
        setLoading(true);
        setError("");
        setData(null);

        let response;

        if (source === "image" && file) {
            response = await creativeScoring({ image: file });
        } else if (source === "design" && selectedDesign) {
            // Pass the raw canvas string/object — AuthContext handles serialization
            const canvasPayload = typeof selectedDesign.canvas === "string"
                ? selectedDesign.canvas
                : JSON.stringify(selectedDesign.canvas);
            response = await creativeScoring({ canvas: canvasPayload });
        } else {
            setError("Please upload an image or select a design first.");
            setLoading(false);
            return;
        }

        if (!response.ok) {
            setError(response.message || "Scoring failed. Please try again.");
        } else {
            setData(response.data);
        }
        setLoading(false);
    };

    const hasInput = source !== null;
    const designCanvasData = (() => {
        if (!selectedDesign) return null;
        try {
            return typeof selectedDesign.canvas === "string"
                ? JSON.parse(selectedDesign.canvas)
                : selectedDesign.canvas;
        } catch { return null; }
    })();
    const designBg = designCanvasData?.canvas?.background || "#f4f4f4";
    const designImg = designCanvasData?.elements?.find((el) => el.type === "image");

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* ── Header ── */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
                    >
                        <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Creative Scoring AI</h1>
                        <p className="text-sm text-gray-400">
                            Score your creatives for performance, brand awareness, or engagement to optimize results.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── LEFT: Upload Sources ── */}
                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <p className="font-semibold text-sm text-gray-800 mb-4">Choose Creative Source</p>

                        {/* Both sources cleared — show both pickers */}
                        {!hasInput && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                {/* Upload image box */}
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => acceptFile(e.target.files?.[0])}
                                        className="hidden"
                                    />
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
                                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700 text-center">Upload Image</p>
                                    <p className="text-xs text-gray-400 mt-1 text-center">PNG, JPG, WEBP</p>
                                </label>

                                {/* Choose from designs box */}
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-purple-400 hover:bg-purple-50/40 transition-all group text-left"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center mb-3 transition-colors">
                                        <LayoutGrid className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700 text-center">Choose a Design</p>
                                    <p className="text-xs text-gray-400 mt-1 text-center">From saved creatives</p>
                                </button>
                            </div>
                        )}

                        {/* Image preview */}
                        {source === "image" && preview && (
                            <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden">
                                    <img
                                        src={preview}
                                        alt="Creative"
                                        className="w-full object-contain max-h-72 bg-gray-100"
                                    />
                                    <button
                                        onClick={clearAll}
                                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer shadow-sm"
                                    >
                                        <X className="w-3.5 h-3.5 text-gray-500" />
                                    </button>
                                </div>
                                {/* Swap option */}
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="w-full py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:border-purple-300 hover:text-purple-600 transition cursor-pointer"
                                >
                                    Or choose from saved designs instead
                                </button>
                            </div>
                        )}

                        {/* Design preview */}
                        {source === "design" && selectedDesign && (
                            <div className="space-y-4">
                                <div
                                    className="relative rounded-xl overflow-hidden flex items-center justify-center"
                                    style={{ background: designBg, minHeight: 180, maxHeight: 280 }}
                                >
                                    {designImg ? (
                                        <img
                                            src={designImg.url}
                                            alt={selectedDesign.name}
                                            className="w-full h-full object-cover"
                                            style={{ opacity: designImg.opacity ?? 1, maxHeight: 280 }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 py-10">
                                            <LayoutGrid className="w-8 h-8 text-gray-300" />
                                            <p className="text-xs text-gray-400">Canvas design</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={clearAll}
                                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer shadow-sm"
                                    >
                                        <X className="w-3.5 h-3.5 text-gray-500" />
                                    </button>
                                    {/* Design name badge */}
                                    <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-white/90 rounded-lg text-xs font-semibold text-gray-700 shadow-sm">
                                        {selectedDesign.name}
                                    </div>
                                </div>
                                {/* Swap option */}
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="w-full py-2 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:border-purple-300 hover:text-purple-600 transition cursor-pointer"
                                >
                                    Choose a different design
                                </button>
                            </div>
                        )}

                        {/* Score button */}
                        {hasInput && (
                            <button
                                onClick={handleScore}
                                disabled={loading}
                                className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                            >
                                {loading
                                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Scoring…</span>
                                    : "✦ Score This Creative"
                                }
                            </button>
                        )}
                    </div>

                    {/* Detected elements */}
                    <AnimatePresence>
                        {data?.elements?.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="bg-white border border-gray-200 rounded-2xl p-5"
                            >
                                <p className="font-semibold text-sm text-gray-800 mb-3">Detected Elements</p>
                                <div className="space-y-2">
                                    {data.elements.map((el, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            {el.detected
                                                ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                : <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
                                            }
                                            <span className="text-sm font-medium text-gray-700">{el.name}</span>
                                            {el.note && (
                                                <span className="text-xs text-gray-400 ml-auto">{el.note}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── RIGHT: Scores + Recommendations ── */}
                <div className="space-y-4">

                    {error && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-24 bg-white border border-gray-200 rounded-2xl">
                            <div className="text-center">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                                <p className="text-gray-500 text-sm">AI is scoring your creative…</p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {data && !loading && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                    <p className="font-semibold text-sm text-gray-800 mb-4">Scores</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Conversion", value: data.conversionScore },
                                            { label: "Brand Awareness", value: data.brandScore },
                                            { label: "Engagement", value: data.engagementScore },
                                            { label: "Overall", value: data.overallScore },
                                        ].map((s) => (
                                            <ScoreGauge key={s.label} label={s.label} value={s.value} />
                                        ))}
                                    </div>
                                </div>

                                {data.recommendations?.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                        <p className="font-semibold text-sm text-gray-800 mb-4">AI Recommendations</p>
                                        <div className="space-y-3">
                                            {data.recommendations.map((r, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: 8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.06 }}
                                                    className="p-4 rounded-xl border border-gray-100 bg-gray-50"
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <p className="text-sm font-semibold text-gray-800">{r.title}</p>
                                                        <span className="text-xs font-bold text-green-600 shrink-0">{r.scoreImpact}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{r.detail}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!data && !loading && !hasInput && (
                        <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
                            <div className="text-center">
                                <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">Upload an image or pick a saved design to score</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal ── */}
            <AnimatePresence>
                {showModal && (
                    <DesignModal
                        onClose={() => setShowModal(false)}
                        onSelect={handleDesignSelect}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}