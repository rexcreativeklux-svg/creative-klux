"use client";
// forms/VideoAdsForm.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Globe, Loader2, FileUp, X, CheckCircle2, ChevronRight,
    Sparkles, Film, Scan, Video, Clapperboard,
} from "lucide-react";
import { FloatingAnimation, FloatingElements } from "@/app/(components)/FloatingAnimation";

import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import RecommendedImagesSection from "@/app/(components)/RecommendedImagesSection";
import ImportedBrandImagesSection from "@/app/(components)/ImportedBrandImagesSection";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";
import { useAuth } from "@/context/AuthContext";

const MAX_IMAGES = 5;

// ── constants ─────────────────────────────────────────────────────────────────
const SIZE_OPTIONS = [
    { value: "1080x1920", label: "TikTok / Reels" },
    { value: "1080x1080", label: "Meta Square" },
    { value: "1080x1350", label: "Meta Vertical" },
    { value: "1920x1080", label: "YouTube / Landscape" },
    { value: "1200x628", label: "Google Display" },
    { value: "1200x627", label: "LinkedIn" },
    { value: "720x1280", label: "Stories" },
    { value: "1280x720", label: "Pre-roll" },
];

const VIDEO_TYPES = [
    { value: "Reels", label: "Reels", desc: "15–90s looping" },
    { value: "Shorts", label: "Shorts", desc: "Up to 60s" },
    { value: "Pre-roll", label: "Pre-roll", desc: "5–15s skippable" },
    { value: "Story", label: "Story", desc: "Up to 15s" },
    { value: "Long-form", label: "Long-form", desc: "60s+" },
];

const CAMPAIGN_GOALS = ["Brand Awareness", "Engagement", "Sales", "Lead Generation", "Website Traffic"];

const AUDIENCES = [
    { value: "B2B", label: "B2B", desc: "Business owners, startups, agencies" },
    { value: "B2C", label: "B2C", desc: "End consumers, everyday users" },
    { value: "Casual", label: "Casual", desc: "Broad social media audience" },
    { value: "Inspirational", label: "Inspirational", desc: "Entrepreneurs & creators" },
    { value: "Sales", label: "Sales", desc: "Hot leads, ad audiences" },
];

const VIDEO_FORMAT = ["MP4", "MOV"];

const VISUAL_STYLES = [
    { value: "minimal", label: "Minimal" },
    { value: "bold", label: "Bold" },
    { value: "elegant", label: "Elegant" },
    { value: "playful", label: "Playful" },
    { value: "corporate", label: "Corporate" },
    { value: "modern", label: "Modern" },
    { value: "luxury", label: "Luxury" },
    { value: "cinematic", label: "Cinematic" },
];

const BRAND_COLORS = [
    "#2563eb", "#0ea5e9", "#8b5cf6", "#ec4899", "#ef4444",
];

const STEPS = [
    { id: 1, label: "Brand & Script", icon: Video },
    { id: 2, label: "Size, Goals & Audience", icon: Scan },
    { id: 3, label: "Background Media", icon: Film },
];

// ─────────────────────────────────────────────────────────────────────────────

const VideoAdsForm = ({
    formData, setFormData, activeBrand, sendUrl, showToast, onResult,
    generateCustomCreative, creative, categoryId, fetchDesignTemplates,
}) => {
    const { uploadImage, activeBrandId } = useAuth();

    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [brandUrl, setBrandUrl] = useState(activeBrand?.url || activeBrand?.source_url || "");
    const [importingBrand, setImportingBrand] = useState(false);
    const [generating, setGenerating] = useState(false);

    // ── IMAGE / VIDEO MEDIA STATE ─────────────────────────────────────────────
    const [imageSrc, setImageSrc] = useState([]);
    const [croppedImages, setCroppedImages] = useState([]);
    const [currentCropIndex, setCurrentCropIndex] = useState(0);
    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [imageSrcMeta, setImageSrcMeta] = useState([]);

    const cropperRef = useRef(null);
    const fileInputRef = useRef(null);
    const logoInputRef = useRef(null);

    // ── modal state ───────────────────────────────────────────────────────────
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

    // ── recommended images ────────────────────────────────────────────────────
    const [recommendedImages, setRecommendedImages] = useState([]);
    const [loadingRecommended, setLoadingRecommended] = useState(false);

    useEffect(() => {
        if (!formData.brandName?.trim()) return;
        const t = setTimeout(async () => {
            setLoadingRecommended(true);
            try {
                const res = await fetch(`/api/pexels?query=${encodeURIComponent(formData.brandName)}&per_page=8`);
                const d = await res.json();
                setRecommendedImages((d.photos || []).map((p) => ({
                    id: p.id, src: p.src.medium, large: p.src.large2x, alt: p.alt || "",
                })));
            } catch { setRecommendedImages([]); }
            finally { setLoadingRecommended(false); }
        }, 800);
        return () => clearTimeout(t);
    }, [formData.brandName]);

    // Sync first media item → live preview
    useEffect(() => {
        const first = croppedImages.find(Boolean);
        if (first?.previewUrl) setFormData((p) => ({ ...p, backgroundImage: first.previewUrl }));
    }, [croppedImages]);

    useEffect(() => {
        setCompletedCrop(null);
    }, [currentCropIndex]);

    // ── field helper ──────────────────────────────────────────────────────────
    const field = (key, value) => {
        if (key === "primaryColor" || key === "secondaryColor" || key === "brandColor")
            value = value.startsWith("#") ? value : `#${value}`;
        setFormData((p) => ({ ...p, [key]: value }));
        setError("");
    };

    // ── Inspire Me ────────────────────────────────────────────────────────────
    const handleInspireMe = () => {
        const brand = formData.brandName || "your brand";
        const goal = formData.campaignGoal || "Engagement";
        const type = formData.videoType || "Reels";
        const audience = formData.audience || "B2C";

        const templates = {
            Sales: `Open with a bold close-up of ${brand}'s hero product. Quick cuts showing key features. Flash "Limited Offer" in bold text. Countdown timer overlay. End with strong CTA "Shop Now" with a swipe-up link. ${type} format, high energy, direct tone.`,
            "Brand Awareness": `Cinematic slow-motion shots of ${brand} in premium lifestyle settings. Soft music, elegant text overlays. Subtle logo reveal at the end. ${type} style, aspirational and polished, perfect for ${audience} audience.`,
            Engagement: `Trending audio hook in first 2 seconds. Show ${brand} in a relatable, fun situation. Text overlay asks a question to prompt comments. End with branded hashtag challenge. ${type} format, casual and shareable.`,
            "Lead Generation": `Problem-solution format: show a pain point in 3 seconds, reveal ${brand} as the fix. Overlay "Get Your Free Guide" with arrow animation pointing to link. ${type} style, clear and persuasive.`,
            "Website Traffic": `Fast-paced product tour of ${brand} with benefit callouts. Final screen: animated "Learn More" button. ${type} format, 15–30s, direct and clickable.`,
        };

        field("description", templates[goal] || templates.Engagement);
    };

    // ── URL import ────────────────────────────────────────────────────────────
    const handleImportBrand = async () => {
        if (!brandUrl.trim()) {
            setError("Please enter a valid brand URL.");
            showToast("Please enter a valid brand URL.");
            return;
        }
        setImportingBrand(true);
        try {
            const r = await sendUrl(brandUrl);
            console.log("🌐 scrape response (VideoAdsForm):", r);
            if (!r?.ok) throw new Error(r?.message || "Import failed");
            // Backend wraps payload twice: r.data = { success, message, data: {...} }
            const d = r.data?.data || r.data || {};
            // Images may come back as ["url", ...] or [{ url, alt }, ...] — normalize to URL strings
            const normalizedImages = Array.isArray(d.images)
                ? d.images
                    .map((i) => (typeof i === "string" ? i : i?.url))
                    .filter((u) => typeof u === "string" && u.startsWith("http"))
                : [];
            setFormData((p) => ({
                ...p,
                brandName:      d.name           || p.brandName,
                description:    d.description    || p.description,
                primaryColor:   d.primary_color  || p.primaryColor,
                brandColor:     d.primary_color  || p.brandColor,
                secondaryColor: d.secondary_color|| p.secondaryColor,
                font:           d.font           || p.font,
                logo:           d.logo           || p.logo,
                caption:        d.name ? `Discover ${d.name}!` : p.caption,
                hashtags:       p.hashtags?.length ? p.hashtags : ["#VideoAd", "#Brand"],
                importedImages: normalizedImages.length ? normalizedImages : p.importedImages || [],
            }));
            showToast("Brand imported!");
        } catch (err) {
            const msg = err?.message || "Failed to import brand. Check the URL.";
            setError(msg);
            showToast(msg);
        }
        finally { setImportingBrand(false); }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => field("logo", reader.result);
        reader.readAsDataURL(file);
    };

    // ── Apply selected from MediaPickerModal ──────────────────────────────────
    const handleApplyFromPicker = async (images, media) => {
        // images = [{ src, large, file? }]  (search + upload items)
        // media  = [src, ...]               (magic studio selections — videos)

        // Combined cap of 5 across both sources
        const remaining = Math.max(0, MAX_IMAGES - croppedImages.filter(Boolean).length);
        const imagesToProcess = images.slice(0, remaining);
        const overflowImages = images.length - imagesToProcess.length;
        const mediaRemaining = Math.max(0, remaining - imagesToProcess.length);
        const mediaToAdd = media.slice(0, mediaRemaining);
        const overflowMedia = media.length - mediaToAdd.length;

        if (imagesToProcess.length > 0) {
            try {
                const processedFiles = await Promise.all(
                    imagesToProcess.map(async (item, idx) => {
                        if (item.file instanceof File) {
                            item.file.previewUrl = item.src;
                            item.file.sourceUrl = null;
                            return item.file;
                        }
                        const url = item.large || item.src;
                        const fetchUrl = url.startsWith("http")
                            ? `/api/proxy-image?url=${encodeURIComponent(url)}`
                            : url;
                        const res = await fetch(fetchUrl);
                        const blob = await res.blob();
                        const file = new File([blob], `selected-${Date.now()}-${idx}`, { type: blob.type || "image/png" });
                        file.previewUrl = URL.createObjectURL(blob);
                        file.sourceUrl = item.large || item.src || null;
                        return file;
                    })
                );

                const previewUrls = processedFiles.map((f) => f.previewUrl);
                const sourceUrls = processedFiles.map((f) => f.sourceUrl || null);

                // Always APPEND — never wipe existing croppedImages
                setImageSrc((prev) => [...prev, ...previewUrls]);
                setImageSrcMeta((prev) => [...prev, ...sourceUrls]);
                setCroppedImages((prev) => [...prev, ...Array(previewUrls.length).fill(null)]);
                setCurrentCropIndex(imageSrc.length);

                setShowCropper(true);
                showToast(`Added ${imagesToProcess.length} image(s) — crop to fit`);
            } catch (err) {
                console.error("Image loading failed:", err);
                showToast("Some images couldn't be loaded.");
            }
        }

        // Video items from magic studio
        if (mediaToAdd.length > 0) {
            const videoObjects = mediaToAdd.map((src, i) => ({
                id: `video-${Date.now()}-${i}`,
                previewUrl: src,
                videoSrc: src,
                thumbnail: src,
                type: "video",
            }));
            setCroppedImages((prev) => [...prev, ...videoObjects]);
            showToast(`Added ${mediaToAdd.length} video(s)`);
        }

        if (overflowImages + overflowMedia > 0) {
            showToast(`Max ${MAX_IMAGES} items reached — some skipped.`);
        }

        setMediaPickerOpen(false);
    };

    // ── Brand image strip handlers ────────────────────────────────────────────
    const handleBrandImageUse = (imageObjs) => {
        const remaining = Math.max(0, MAX_IMAGES - croppedImages.filter(Boolean).length);
        const toAdd = imageObjs.slice(0, remaining);
        if (toAdd.length === 0) {
            showToast(`Max ${MAX_IMAGES} items reached.`);
            return;
        }
        const pseudos = toAdd.map((imageObj) => ({
            previewUrl: imageObj.src,
            sourceUrl: imageObj.src,
            name: imageObj.alt || "brand-image",
            type: "image/jpeg",
        }));
        setCroppedImages((prev) => [...prev, ...pseudos]);
        if (toAdd.length < imageObjs.length) {
            showToast(`Only ${toAdd.length} added — max ${MAX_IMAGES} reached.`);
        } else {
            showToast(`${pseudos.length} image${pseudos.length > 1 ? "s" : ""} added ✓`);
        }
    };

    const handleBrandImageCrop = async (imageObjs) => {
        const remaining = Math.max(0, MAX_IMAGES - croppedImages.filter(Boolean).length);
        const toAdd = imageObjs.slice(0, remaining);
        if (toAdd.length === 0) {
            showToast(`Max ${MAX_IMAGES} items reached.`);
            return;
        }
        for (const imageObj of toAdd) {
            const originalUrl = imageObj.src;
            let cropperUrl = originalUrl;
            try {
                const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(originalUrl)}`);
                const blob = await res.blob();
                cropperUrl = URL.createObjectURL(blob);
            } catch (err) {
                console.warn("Proxy failed, falling back to original URL", err);
            }
            setImageSrc((prev) => [...prev, cropperUrl]);
            setImageSrcMeta((prev) => [...prev, originalUrl]);
            setCroppedImages((prev) => [...prev, null]);
        }
        if (!showCropper) setCurrentCropIndex(0);
        setShowCropper(true);
        if (toAdd.length < imageObjs.length) {
            showToast(`Only ${toAdd.length} queued — max ${MAX_IMAGES} reached.`);
        }
    };

    // ── Save crop ─────────────────────────────────────────────────────────────
    const saveCroppedImage = useCallback(async () => {
        if (!completedCrop || !cropperRef.current) return;
        const image = cropperRef.current.cropper?.getImage?.();
        if (!image) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        ctx.drawImage(
            image,
            completedCrop.x * scaleX, completedCrop.y * scaleY,
            completedCrop.width * scaleX, completedCrop.height * scaleY,
            0, 0, canvas.width, canvas.height
        );

        const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
        const file = new File([blob], `cropped-${currentCropIndex}.png`, { type: "image/png" });
        file.previewUrl = URL.createObjectURL(blob);
        file.sourceUrl = imageSrcMeta[currentCropIndex] || null;

        setCroppedImages((prev) => {
            const updated = [...prev];
            updated[currentCropIndex] = file;
            return updated;
        });

        if (currentCropIndex < imageSrc.length - 1) {
            setCurrentCropIndex((prev) => prev + 1);
            setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
            setCompletedCrop(null);
        } else {
            setShowCropper(false);
        }
    }, [completedCrop, currentCropIndex, imageSrc.length, imageSrcMeta]);

    // ── Skip crop ─────────────────────────────────────────────────────────────
    const handleSkipCrop = () => {
        const url = imageSrc[currentCropIndex];
        fetch(url).then((r) => r.blob()).then((blob) => {
            const file = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
            file.previewUrl = url;
            file.sourceUrl = imageSrcMeta[currentCropIndex] || null;
            setCroppedImages((prev) => {
                const u = [...prev];
                u[currentCropIndex] = file;
                return u;
            });
            if (currentCropIndex < imageSrc.length - 1) {
                setCurrentCropIndex((prev) => prev + 1);
                setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
            } else {
                setShowCropper(false);
            }
        });
    };

    // ── Remove a media item ───────────────────────────────────────────────────
    const removeCroppedImage = (idx) => {
        const next = croppedImages.filter((_, i) => i !== idx);
        const first = next.find(Boolean);
        setCroppedImages(next);
        setFormData((p) => ({ ...p, backgroundImage: first?.previewUrl || null }));
        if (idx <= currentCropIndex && currentCropIndex > 0) {
            setCurrentCropIndex((prev) => prev - 1);
        }
    };

    // ── Step navigation ───────────────────────────────────────────────────────
    const handleContinue = () => {
        if (step === 1 && (!formData.brandName || !formData.description)) {
            const msg = "Brand name and description are required.";
            setError(msg); showToast(msg); return;
        }
        if (step === 2 && (!formData.size || !formData.campaignGoal || !formData.audience || !formData.videoFormat)) {
            const msg = "Please complete all fields before continuing.";
            setError(msg); showToast(msg); return;
        }
        if (step === 3 && croppedImages.filter(Boolean).length === 0) {
            const msg = "Select at least one background image or video.";
            setError(msg); showToast(msg); return;
        }
        setError("");
        setStep((p) => p + 1);
    };

    // ── Generate — Scraive → upload images → Redesign ────────────────────────
    const handleGenerate = async () => {
        setGenerating(true);
        setError("");

        try {
            const validMedia = croppedImages.filter(Boolean);

            // Resolve the size's label (for Scraive category + Redesign payload)
            const selectedSizeLabel =
                SIZE_OPTIONS.find((s) => s.value === formData.size)?.label || "";
            const scraiveCategory = selectedSizeLabel
                .toLowerCase()
                .replace(/\s+/g, "_");

            // 1) Scraive templates first
            const templateRes = await fetchDesignTemplates?.({
                type: "video",
                category: selectedSizeLabel,
                type_size: formData.size,
            });

            if (!templateRes?.ok) {
                setError(templateRes?.message || "Failed to fetch templates");
                showToast(templateRes?.message || "Failed to fetch templates");
                setGenerating(false);
                return;
            }

            const templates = Array.isArray(templateRes.data) ? templateRes.data : [];
            if (!templates.length) {
                setError("No templates found for this size");
                showToast("No templates found for this size");
                setGenerating(false);
                return;
            }
            // Use ALL templates — generateCustomCreative will batch them in pairs
            const selectedTemplates = templates;

            // 2) Resolve image URLs — upload File items to /image-gallery
            const resolvedUrls = await Promise.all(
                validMedia.map(async (item) => {
                    if (typeof item?.sourceUrl === "string" && item.sourceUrl.startsWith("http")) {
                        return item.sourceUrl;
                    }
                    if (item instanceof File) {
                        try {
                            const result = await uploadImage(item);
                            const url =
                                result?.image_url ||
                                result?.url ||
                                result?.data?.image_url ||
                                null;
                            return typeof url === "string" && url.startsWith("http")
                                ? url
                                : null;
                        } catch (err) {
                            console.error("uploadImage failed:", err);
                            return null;
                        }
                    }
                    if (typeof item?.previewUrl === "string" && item.previewUrl.startsWith("http")) {
                        return item.previewUrl;
                    }
                    return null;
                })
            );

            const imageUrls = resolvedUrls.filter(Boolean);

            // 3) Redesign payload
            const payload = {
                creativeType: creative?.id,
                categoryType: categoryId,
                brand_id: activeBrandId,
                brandName: formData.brandName || null,
                description: formData.description || null,
                brandColor: formData.brandColor ?? formData.primaryColor ?? null,
                logo: formData.logo || null,
                visualStyle: formData.visualStyle || null,
                font: formData.font || null,
                sourceUrl: brandUrl || null,
                size: formData.size || null,
                campaignGoal: formData.campaignGoal || null,
                audience: formData.audience || null,
                videoFormat: formData.videoFormat || null,
                videoType: formData.videoType || null,
                caption: formData.caption || null,
                images: imageUrls,
                category: scraiveCategory,
                type_size: formData.size || null,
                templates: selectedTemplates,
                generatedAt: new Date().toISOString(),
            };

            const expectedCount = selectedTemplates.length;
            let isFirstBatch = true;
            const result = await generateCustomCreative(payload, (batch) => {
                if (!batch.ok) return; // failure handled below
                const variations = batch.variations || [];
                const assets = batch.assets || [];
                if (isFirstBatch) {
                    isFirstBatch = false;
                    setGenerating(false); // hide overlay so user sees first batch
                    onResult({
                        type: "design",
                        variations,
                        assets,
                        expectedCount,
                        done: false,
                        reply: batch.data?.reply || "",
                        meta: batch.data?.meta || {},
                        payload,
                        raw: batch.data,
                    });
                } else {
                    onResult({
                        type: "design",
                        variations,
                        assets,
                        append: true,
                    });
                }
            });

            if (!result.ok) {
                setError(result.message || "Generation failed. Please try again.");
                showToast(result.message || "Generation failed. Please try again.");
                setGenerating(false);
                onResult({ append: true, done: true });
                return;
            }

            onResult({ append: true, done: true });
            setGenerating(false);
        } catch (err) {
            console.error("handleGenerate error:", err);
            setError(err.message || "Something went wrong.");
            showToast(err.message || "Something went wrong.");
        } finally {
            setGenerating(false);
        }
    };

    const handlePreviousCrop = () => {
        if (currentCropIndex > 0) {
            setCurrentCropIndex((prev) => prev - 1);
            setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
            setCompletedCrop(null);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Step indicator ───────────────────────────────────────────────── */}
            <div className=" px-0 py-4">
                <div className="flex items-center justify-between gap-2">
                    {STEPS.map((s, idx) => {
                        const Icon = s.icon;
                        return (
                            <React.Fragment key={s.id}>
                                <button
                                    onClick={() => step > s.id && setStep(s.id)}
                                    className={`flex flex-1 items-center gap-2 min-w-0 ${step > s.id ? "cursor-pointer" : "cursor-default"}`}
                                >
                                    <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${step > s.id ? "border-blue-600 bg-blue-600 text-white"
                                        : step === s.id ? "border-blue-600 text-blue-600 bg-white"
                                            : "border-gray-200 text-gray-300"
                                        }`}>
                                        {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <span className={`hidden sm:block text-xs font-medium truncate ${step >= s.id ? "text-gray-700" : "text-gray-300"}`}>
                                        {s.label}
                                    </span>
                                </button>
                                {idx < STEPS.length - 1 && (
                                    <div className={`h-0.5 flex-1 rounded-full transition-all ${step > s.id ? "bg-blue-600" : "bg-gray-200"}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* ── Step content card ────────────────────────────────────────────── */}
            <div className="bg-white rounded-lg py-5 px-2 flex flex-col gap-6">

                {error && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                    </div>
                )}

                {/* ═══ STEP 1 — Brand & Script ══════════════════════════════════════ */}
                {step === 1 && (
                    <div className="flex flex-col gap-5">
                        <SectionTitle>Brand & Script</SectionTitle>

                        {/* URL import */}
                        <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/40">
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">Import from URL</span>
                                <span className="text-xs text-gray-400 ml-auto">Auto-fills brand info</span>
                            </div>
                            <div className="flex gap-2">
                                <input type="url" value={brandUrl} onChange={(e) => setBrandUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleImportBrand()}
                                    placeholder="https://yourdomain.com/" className={inputCls} />
                                <button onClick={handleImportBrand} disabled={importingBrand || !brandUrl.trim()}
                                    className="px-5 py-1.5 bg-blue-600 cursor-pointer text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shrink-0">
                                    {importingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                                </button>
                            </div>
                        </div>

                        {/* Brand name */}
                        <Field label="Brand Name / Project Name" required>
                            <input type="text" value={formData.brandName} onChange={(e) => field("brandName", e.target.value)}
                                placeholder="Your Brand" className={inputCls} />
                        </Field>

                        {/* Script / description */}
                        <Field label="Video Script / Description">
                            <div className="relative">
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => field("description", e.target.value)}
                                    placeholder="Describe your video (e.g., 'Open with close-up of product, bold text overlay, end with CTA…')"
                                    rows={4}
                                    className={`${inputCls} resize-none pb-10`}
                                />
                                <button
                                    onClick={handleInspireMe}
                                    className="absolute bottom-3 left-3 bg-gray-100 hover:bg-white border border-gray-300 text-gray-600 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition flex items-center gap-1.5"
                                >
                                    <Sparkles className="w-3 h-3 text-blue-500" /> Inspire Me
                                </button>
                            </div>
                        </Field>

                        {/* Video Type */}
                        <Field label="Video Type">
                            <div className="flex gap-2 flex-wrap">
                                {VIDEO_TYPES.map((t) => (
                                    <button key={t.value} onClick={() => field("videoType", t.value)}
                                        className={`flex flex-col items-start px-5 py-2 rounded-lg border-2 cursor-pointer transition-all ${formData.videoType === t.value
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                            }`}>
                                        <span className={`text-xs font-semibold ${formData.videoType === t.value ? "text-blue-700" : "text-gray-700"}`}>
                                            {t.label}
                                        </span>
                                        <span className="text-[10px] text-gray-400 mt-0.5">{t.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {/* Visual Style */}
                        <Field label="Visual Style">
                            <div className="flex py-1 gap-2 flex-wrap">
                                {VISUAL_STYLES.map((s) => (
                                    <button key={s.value} onClick={() => field("visualStyle", s.value)}
                                        className={`flex flex-col gap-2 px-3 py-1 rounded-md border cursor-pointer transition-all ${formData.visualStyle === s.value
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                            }`}>
                                        <span className={`text-xs font-semibold ${formData.visualStyle === s.value ? "text-blue-700" : "text-gray-500"}`}>
                                            {s.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {/* Colors + Logo */}
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Brand Color">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {BRAND_COLORS.map((hex) => (
                                            <button
                                                key={hex}
                                                onClick={() => field("brandColor", hex)}
                                                className={`w-7 h-7 rounded-md cursor-pointer border-2 transition-transform hover:scale-110 ${formData.brandColor === hex ? "border-gray-800 scale-110" : "border-transparent"}`}
                                                style={{ background: hex }}
                                                title={hex}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 flex-none">
                                        <label
                                            className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden shrink-0 transition hover:scale-105"
                                            style={{ background: formData.brandColor || "#2563eb" }}
                                        >
                                            <input type="color" value={formData.brandColor || "#2563eb"}
                                                onChange={(e) => field("brandColor", e.target.value)}
                                                className="opacity-0 w-full h-full cursor-pointer" />
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.brandColor || "#2563eb"}
                                            onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && field("brandColor", e.target.value)}
                                            className={`${inputCls} w-24! flex-none px-2 text-sm font-mono`}
                                            maxLength={7}
                                        />
                                    </div>
                                </div>
                            </Field>

                            <Field label="Logo">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => logoInputRef.current?.click()}
                                        className="flex-1 px-3 py-2.5 border cursor-pointer border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 flex items-center gap-2 transition">
                                        <FileUp className="w-4 h-4" /> Upload
                                    </button>
                                    <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
                                    {formData.logo && (
                                        <div className="w-10 h-10 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                                            <img src={formData.logo} alt="logo" className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                </div>
                            </Field>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 2 — Size, Goals & Audience ═════════════════════════════ */}
                {step === 2 && (
                    <div className="flex flex-col gap-6">
                        <SectionTitle>Size, Goals & Audience</SectionTitle>

                        <Field label="Video Size">
                            <div className="grid grid-cols-4 gap-2">
                                {SIZE_OPTIONS.map((s) => (
                                    <button key={s.value} onClick={() => field("size", s.value)}
                                        className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${formData.size === s.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"}`}>
                                        <p className="text-xs font-semibold">{s.label}</p>
                                        <p className={`text-[10px] mt-0.5 ${formData.size === s.value ? "text-blue-500" : "text-gray-400"}`}>{s.value}</p>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <Field label="Campaign Goal">
                            <div className="flex flex-wrap gap-2">
                                {CAMPAIGN_GOALS.map((g) => (
                                    <button key={g} onClick={() => field("campaignGoal", g)}
                                        className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${formData.campaignGoal === g ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"}`}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <Field label="Audience">
                            <div className="grid grid-cols-3 gap-2">
                                {AUDIENCES.map((a) => (
                                    <button key={a.value} onClick={() => field("audience", a.value)}
                                        className={`text-left px-2 py-2 cursor-pointer rounded-lg border-2 transition-all ${formData.audience === a.value ? "border-blue-600 bg-blue-50" : "border-gray-100 bg-gray-50 hover:border-gray-300"}`}>
                                        <p className={`text-xs font-semibold ${formData.audience === a.value ? "text-blue-700" : "text-gray-700"}`}>{a.label}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <Field label="Video Format">
                            <div className="flex gap-2">
                                {VIDEO_FORMAT.map((f) => (
                                    <button key={f} onClick={() => field("videoFormat", f)}
                                        className={`px-4 py-2 rounded-lg cursor-pointer text-xs font-medium border-2 transition-all ${formData.videoFormat === f ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"}`}>
                                        {f}{f === "MP4" && " ✓"}
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </div>
                )}

                {/* ═══ STEP 3 — Background Media ════════════════════════════════════ */}
                {step === 3 && (
                    <div className="flex flex-col gap-4">
                        <SectionTitle>Select Background Media</SectionTitle>

                        {/* ── Brand images strip ── */}
                        <BrandImagesStrip
                            images={formData.importedImages?.length ? formData.importedImages : undefined}
                            onSelect={handleBrandImageUse}
                            onCrop={handleBrandImageCrop}
                            selectedUrls={croppedImages
                                .filter(Boolean)
                                .map((f) => f?.sourceUrl || f?.previewUrl)
                                .filter(Boolean)}
                        />

                        {/* ── Already-selected previews ── */}
                        {croppedImages.filter(Boolean).length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">
                                    Selected ({croppedImages.filter(Boolean).length})
                                </p>
                                <div className="grid grid-cols-5 gap-2">
                                    {croppedImages.map((item, index) => {
                                        if (!item) return null;
                                        const url = item?.previewUrl ||
                                            (item instanceof File || item instanceof Blob ? URL.createObjectURL(item) : null);
                                        const isVideo = item?.videoSrc || item?.type?.includes?.("video");

                                        return (
                                            <div key={index} className="relative group">
                                                {url ? (
                                                    isVideo ? (
                                                        <video
                                                            src={item.videoSrc || url}
                                                            poster={item.thumbnail}
                                                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                                                            muted loop playsInline preload="metadata"
                                                            onMouseEnter={(e) => e.target.play().catch(() => { })}
                                                            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                                                        />
                                                    ) : (
                                                        <img src={url} alt={`Selected ${index + 1}`}
                                                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm" />
                                                    )
                                                ) : (
                                                    <div className="w-full h-24 bg-gray-100 border-2 border-dashed rounded-xl flex items-center justify-center">
                                                        <span className="text-xs text-gray-400">No media</span>
                                                    </div>
                                                )}
                                                {isVideo && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="bg-black/40 rounded-full p-1.5">
                                                            <Clapperboard className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeCroppedImage(index); }}
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Upload / picker zone ── */}
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                            onClick={() => setMediaPickerOpen(true)}
                        >
                            <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                                <Film className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-700">Upload or Search Background Media</p>
                                <p className="text-xs text-gray-400 mt-1">Images or videos — from library, web search, or AI generation</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMediaPickerOpen(true); }}
                                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer flex items-center gap-2"
                            >
                                <Film className="w-4 h-4" /> Choose Media
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Navigation ── */}
                <div className={`flex gap-3 pt-2 ${step > 1 ? "justify-between" : "justify-end"}`}>
                    {step > 1 && (
                        <button onClick={() => setStep((p) => p - 1)}
                            className="px-3 py-2 border border-gray-200 hover:scale-105 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            ← Back
                        </button>
                    )}
                    {step < 3 ? (
                        <button onClick={handleContinue}
                            disabled={step === 1 && (!formData.brandName?.trim() || !formData.description?.trim())}
                            className="px-3 py-2 bg-blue-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-blue-700 hover:scale-105 flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={handleGenerate} disabled={generating}
                            className="px-3 py-2 bg-blue-600 cursor-pointer text-white rounded-lg text-sm font-semibold hover:bg-blue-700 hover:scale-105 flex items-center gap-2 transition disabled:opacity-60">
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Film className="w-4 h-4" /> Generate Video Ads</>}
                        </button>
                    )}
                </div>
            </div>

            {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

            <ImageCropperModal
                isOpen={showCropper}
                ref={cropperRef}
                imageSrc={imageSrc[currentCropIndex]}
                currentIndex={currentCropIndex}
                totalImages={imageSrc.length}
                crop={crop}
                onCropChange={setCrop}
                onCropComplete={setCompletedCrop}
                aspectRatio={undefined}
                onSave={saveCroppedImage}
                onSkip={handleSkipCrop}
                onCancel={() => {
                    setShowCropper(false);
                    setImageSrc([]);
                    setImageSrcMeta([]);
                    setCroppedImages([]);
                }}
                onPrevious={handlePreviousCrop}
            />

            <MediaPickerModal
                isOpen={mediaPickerOpen}
                onClose={() => setMediaPickerOpen(false)}
                onCancel={() => setMediaPickerOpen(false)}
                onApply={handleApplyFromPicker}
                postData={formData}
                activeBrand={activeBrand}
                showToast={showToast}
                maxSelectable={Math.max(0, MAX_IMAGES - croppedImages.filter(Boolean).length)}
            />

            {/* Generating overlay */}
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

// ── shared micro-components ───────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

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

export default VideoAdsForm;