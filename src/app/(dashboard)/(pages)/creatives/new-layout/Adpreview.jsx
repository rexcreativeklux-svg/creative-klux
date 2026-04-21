"use client";
// AdPreview.jsx
// Right panel: live preview (non-scrollable) that updates from formData,
// and switches to a result gallery when `result` is passed.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Eye, Send, Calendar, Download, MoreVertical, CheckCircle2, ImageIcon,
} from "lucide-react";

const AdPreview = ({ creative, category, formData, result, onBack, onOpenModal }) => {
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [menuOpen, setMenuOpen] = useState(null);
    const [processedAssets, setProcessedAssets] = useState({});

    const getAspectRatio = () => {
        const [w, h] = (formData.size || "1200x628").split("x").map(Number);
        return h ? w / h : 1200 / 628;
    };

    const toggleAsset = (id) => setSelectedAsset((prev) => (prev === id ? null : id));

    const handleDownload = async (asset) => {
        try {
            const res = await fetch(asset.preview || asset.src);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `creative_${asset.id}.png`; a.click();
            URL.revokeObjectURL(url);
            setProcessedAssets((prev) => ({ ...prev, [asset.id]: { type: "download", data: url } }));
        } catch { }
    };

    // ── RESULT VIEW ──────────────────────────────────────────────────────────
    if (result) {
        return (
            <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between shrink-0">
                    <h2 className="text-sm font-bold text-gray-900">Generated Ads</h2>
                    <button onClick={onBack}
                        className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition text-gray-600">
                        ← Back
                    </button>
                </div>

                <AnimatePresence>
                    {selectedAsset !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex gap-2 shrink-0"
                        >
                            {[
                                { label: "Create Ad", icon: Send, fn: () => onOpenModal("post", [result.assets.find((a) => a.id === selectedAsset)]) },
                                { label: "Schedule", icon: Calendar, fn: () => onOpenModal("schedule", [result.assets.find((a) => a.id === selectedAsset)]) },
                                { label: "Download", icon: Download, fn: () => handleDownload(result.assets.find((a) => a.id === selectedAsset)), dark: true },
                            ].map(({ label, icon: Icon, fn, dark }) => (
                                <button key={label} onClick={fn}
                                    className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1.5 transition ${dark
                                            ? "bg-gray-900 text-white hover:bg-gray-700"
                                            : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                                        }`}>
                                    <Icon className="w-3.5 h-3.5" /> {label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="columns-2 gap-3  flex-1">
                    {result.assets?.map((asset) => (
                        <div
                            key={asset.id}
                            onClick={() => toggleAsset(asset.id)}
                            className={`relative border rounded-xl overflow-hidden cursor-pointer transition duration-200 mb-3 break-inside-avoid ${selectedAsset === asset.id
                                    ? "border-blue-600 ring-2 ring-blue-600 ring-offset-1"
                                    : "border-gray-200 hover:border-blue-400"
                                }`}
                        >
                            <img
                                src={asset.preview || asset.src}
                                alt={asset.alt}
                                className="w-full h-auto rounded-xl"
                            />


                            {/* radio */}
                            <div className="absolute top-2 left-2">
                                <input type="radio" readOnly checked={selectedAsset === asset.id}
                                    className="w-3.5 h-3.5 text-blue-600" />
                            </div>

                            {/* context menu */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === asset.id ? null : asset.id); }}
                                className="absolute top-2 right-2 bg-white/90 rounded-full border border-gray-200 p-1 shadow-sm hover:bg-gray-50 z-10"
                            >
                                <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                            </button>

                            {menuOpen === asset.id && (
                                <div onClick={(e) => e.stopPropagation()}
                                    className="absolute top-8 right-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[130px] py-1">
                                    {[
                                        ["Post Now", () => onOpenModal("post", [asset])],
                                        ["Schedule", () => onOpenModal("schedule", [asset])],
                                        ["Download", () => handleDownload(asset)],
                                    ].map(([label, fn]) => (
                                        <button key={label} onClick={fn}
                                            className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50">
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── LIVE PREVIEW ─────────────────────────────────────────────────────────
    const previewBg = formData.backgroundImage || null;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            {/* header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Live Preview</span>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-white"
                        style={{ background: creative.color }}
                    >
                        {category?.label || creative.label}
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-mono">
                        {formData.size}
                    </span>
                </div>
            </div>

            {/* preview frame */}
            <div className="flex items-center justify-center bg-[#f0f2f7] rounded-xl p-5 min-h-[280px]">
                <div
                    className="relative w-full overflow-hidden rounded-xl shadow-lg"
                    style={{ maxWidth: 400, aspectRatio: getAspectRatio() }}
                >
                    {/* background */}
                    {previewBg ? (
                        <img src={previewBg} alt="preview bg" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                                background: `linear-gradient(135deg, ${formData.primaryColor}33, ${formData.secondaryColor}44)`,
                            }}
                        >
                            <ImageIcon className="w-12 h-12 text-gray-300" />
                        </div>
                    )}

                    {/* overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* size badge */}
                    <div className="absolute top-3 left-3 bg-white/90 text-[9px] font-mono text-gray-600 px-2 py-1 rounded-full">
                        {formData.size}
                    </div>

                    {/* sponsored */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2">
                        <span className="text-[9px] font-semibold tracking-widest text-white/70 uppercase">Sponsored</span>
                    </div>

                    {/* logo */}
                    {formData.logo && (
                        <div className="absolute top-3 right-3 w-10 h-10 bg-white rounded-xl p-1.5 shadow">
                            <img src={formData.logo} alt="logo" className="w-full h-full object-contain" />
                        </div>
                    )}

                    {/* bottom content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        {formData.brandName && (
                            <h2
                                className="text-xl font-bold leading-tight drop-shadow mb-1"
                                style={{ color: formData.primaryColor, fontFamily: formData.font || "inherit" }}
                            >
                                {formData.brandName}
                            </h2>
                        )}
                        {formData.caption && (
                            <p className="text-white text-xs leading-snug drop-shadow opacity-90 line-clamp-2">
                                {formData.caption}
                            </p>
                        )}
                        {formData.campaignGoal && (
                            <div
                                className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold"
                                style={{ background: formData.primaryColor, color: "#fff" }}
                            >
                                {formData.campaignGoal}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* meta chips */}
            <div className="grid grid-cols-3 gap-2 shrink-0">
                {[
                    ["Format", formData.fileFormat || "—"],
                    ["Audience", formData.audience || "—"],
                    ["Goal", formData.campaignGoal?.split(" ")[0] || "—"],
                ].map(([label, value]) => (
                    <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</p>
                        <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{value}</p>
                    </div>
                ))}
            </div>

            {/* platform compatibility note */}
            <div
                className="rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2"
                style={{ background: `${creative.color}10`, color: creative.color }}
            >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Ready for {getPlatformLabel(formData.size)} · {category?.label || "Image Ads"}
            </div>
        </div>
    );
};

const getPlatformLabel = (size) => {
    const map = {
        "1200x627": "LinkedIn",
        "627x627": "LinkedIn",
        "1200x628": "Google",
        "1200x1200": "Google",
        "1080x1920": "TikTok / Meta Stories",
        "1080x1080": "Meta",
        "1080x1350": "Meta",
    };
    return map[size] || "all platforms";
};

export default AdPreview;