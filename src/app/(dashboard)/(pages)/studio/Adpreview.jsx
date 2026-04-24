"use client";
// AdPreview.jsx
// Right panel: live preview that supports both images and videos

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Eye, Send, Calendar, Download, MoreVertical, CheckCircle2, ImageIcon,
} from "lucide-react";

const AdPreview = ({ creative, category, formData, result, onBack, onOpenModal }) => {
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [menuOpen, setMenuOpen] = useState(null);

    // Store references to all video elements for play/pause control
    const videoRefs = useRef({});

    const getAspectRatio = () => {
        const [w, h] = (formData.size || "1200x628").split("x").map(Number);
        return h ? w / h : 1200 / 628;
    };

    const toggleAsset = (id) => setSelectedAsset((prev) => (prev === id ? null : id));

    const handleDownload = async (asset) => {
        try {
            const downloadUrl = asset.videoSrc || asset.src || asset.preview;
            if (!downloadUrl) return;

            const res = await fetch(downloadUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            
            const extension = asset.type === "video" || 
                            asset.videoSrc || 
                            downloadUrl.toLowerCase().endsWith('.mp4') ? "mp4" : "png";
            
            a.href = url;
            a.download = `creative_${asset.id}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
        }
    };

    // Handle hover play/pause for videos
    const handleVideoHover = (assetId, isEntering) => {
        const video = videoRefs.current[assetId];
        if (!video) return;

        if (isEntering) {
            video.muted = true; // Ensure muted to allow autoplay
            video.play().catch((err) => {
                // Silently handle autoplay restrictions
                console.log("Autoplay prevented by browser:", err);
            });
        } else {
            video.pause();
        }
    };

    // ── RESULT VIEW (Supports Videos + Hover Play) ─────────────────────────────
    if (result) {
        return (
            <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between shrink-0">
                    <h2 className="text-sm font-bold text-gray-900">Generated Ads</h2>
                    <button 
                        onClick={onBack}
                        className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition text-gray-600"
                    >
                        ← Back
                    </button>
                </div>

                <AnimatePresence>
                    {selectedAsset !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0 }}
                            className="flex gap-2 shrink-0"
                        >
                            {[
                                { label: "Create Ad", icon: Send, fn: () => onOpenModal("post", [result.assets.find((a) => a.id === selectedAsset)]) },
                                { label: "Schedule", icon: Calendar, fn: () => onOpenModal("schedule", [result.assets.find((a) => a.id === selectedAsset)]) },
                                { label: "Download", icon: Download, fn: () => handleDownload(result.assets.find((a) => a.id === selectedAsset)), dark: true },
                            ].map(({ label, icon: Icon, fn, dark }) => (
                                <button 
                                    key={label} 
                                    onClick={fn}
                                    className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1.5 transition ${
                                        dark 
                                            ? "bg-gray-900 text-white hover:bg-gray-700" 
                                            : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" /> {label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="columns-2 gap-3 flex-1">
                    {result.assets?.map((asset) => {
                        const isVideo = asset.type === "video" ||
                            asset.src?.toLowerCase().endsWith('.mp4') ||
                            asset.videoSrc ||
                            asset.preview?.toLowerCase().endsWith('.mp4');

                        return (
                            <div
                                key={asset.id}
                                onClick={() => toggleAsset(asset.id)}
                                onMouseEnter={() => isVideo && handleVideoHover(asset.id, true)}
                                onMouseLeave={() => isVideo && handleVideoHover(asset.id, false)}
                                className={`relative border rounded-xl overflow-hidden cursor-pointer transition duration-200 mb-3 break-inside-avoid group ${
                                    selectedAsset === asset.id
                                        ? "border-blue-600 ring-2 ring-blue-600 ring-offset-1"
                                        : "border-gray-200 hover:border-blue-400"
                                }`}
                            >
                                {isVideo ? (
                                    <video
                                        ref={(el) => (videoRefs.current[asset.id] = el)}
                                        src={asset.videoSrc || asset.src || asset.preview}
                                        poster={asset.thumbnail || asset.preview}
                                        className="w-full h-auto rounded-xl object-cover"
                                        muted
                                        loop
                                        playsInline
                                        preload="metadata"
                                    />
                                ) : (
                                    <img
                                        src={asset.preview || asset.src}
                                        alt={asset.alt}
                                        className="w-full h-auto rounded-xl"
                                    />
                                )}

                                {/* Hover Play Indicator */}
                                {isVideo && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="bg-black/70 text-white text-xs px-4 py-1.5 rounded-full flex items-center gap-2">
                                            <span className="text-lg">▶</span> Hover to Play
                                        </div>
                                    </div>
                                )}

                                {/* Radio selector */}
                                <div className="absolute top-3 left-3">
                                    <input
                                        type="radio"
                                        readOnly
                                        checked={selectedAsset === asset.id}
                                        className="w-4 h-4 text-blue-600 accent-blue-600"
                                    />
                                </div>

                                {/* Context menu button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(menuOpen === asset.id ? null : asset.id);
                                    }}
                                    className="absolute top-3 right-3 bg-white/90 rounded-full border border-gray-200 p-1.5 shadow-sm hover:bg-white z-10"
                                >
                                    <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                                </button>

                                {/* Context menu */}
                                {menuOpen === asset.id && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-12 right-3 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[140px] py-1 text-sm"
                                    >
                                        {[
                                            ["Post Now", () => onOpenModal("post", [asset])],
                                            ["Schedule", () => onOpenModal("schedule", [asset])],
                                            ["Download", () => handleDownload(asset)],
                                        ].map(([label, fn]) => (
                                            <button
                                                key={label}
                                                onClick={fn}
                                                className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Duration badge for videos */}
                                {isVideo && asset.duration && (
                                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                                        {asset.duration}s
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── LIVE PREVIEW (Image-focused) ─────────────────────────────────────────
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