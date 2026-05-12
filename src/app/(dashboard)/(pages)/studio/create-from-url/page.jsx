"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ArrowRight, ArrowLeft, Loader2, Upload, Check, Megaphone, Share2, Images, FileUp, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdPreview from '../Adpreview';

import ImageCropperModal from "@/app/(components)/ImageCropperModal";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import BrandImagesStrip from "@/app/(components)/BrandImagesStrip";

const VISUAL_STYLES = ['Minimal', 'Bold', 'Elegant', 'Playful', 'Corporate', 'Modern', 'Neon', 'Pastel'];

const AD_SIZES = [
  { label: 'LinkedIn Horizontal', size: '1200×627' },
  { label: 'LinkedIn Square',     size: '627×627' },
  { label: 'Google Landscape',    size: '1200×628' },
  { label: 'Google Square',       size: '1200×1200' },
  { label: 'TikTok Vertical',     size: '1080×1920' },
  { label: 'Meta Square',         size: '1080×1080' },
  { label: 'Meta Vertical',       size: '1080×1350' },
  { label: 'Meta Stories/Reels',  size: '1080×1921' },
];

const SOCIAL_SIZES = [
  { label: 'LinkedIn Horizontal', size: '1200×627' },
  { label: 'LinkedIn Square',     size: '627×627' },
  { label: 'Instagram Square',    size: '1080×1080' },
  { label: 'Instagram Portrait',  size: '1080×1350' },
  { label: 'Stories / Reels',     size: '1080×1920' },
  { label: 'Facebook Feed',       size: '1200×630' },
  { label: 'Twitter / X Post',    size: '1600×900' },
  { label: 'Pinterest Pin',       size: '1000×1500' },
];

const CAMPAIGN_GOALS = ['Brand Awareness', 'Engagement', 'Sales', 'Lead Generation', 'Website Traffic'];

const AUDIENCES = [
  { label: 'B2B',           description: 'Business owners, startups, agencies' },
  { label: 'B2C',           description: 'End consumers, everyday users' },
  { label: 'Casual',        description: 'Broad social media audience' },
  { label: 'Inspirational', description: 'Entrepreneurs & creators' },
  { label: 'Sales',         description: 'Hot leads, ad audiences' },
];

const POST_TONES = ['Professional', 'Casual', 'Humorous', 'Inspirational', 'Urgent', 'Educational'];
const SOCIAL_PLATFORMS = ['Instagram', 'LinkedIn', 'Facebook', 'Twitter / X', 'TikTok', 'Pinterest'];
const FILE_FORMATS = ['PNG', 'JPEG', 'WEBP', 'AVIF'];
const DEFAULT_COLORS = ['#3b82f6', '#06b6d4', '#a855f7', '#ec4899', '#ef4444', '#1e3a8a'];

const CREATION_TYPES = [
  {
    id: 'ads',
    icon: Megaphone,
    label: 'Create Ads',
    description: 'Generate paid ad creatives for Meta, Google, TikTok, LinkedIn and more.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    selectedBorder: 'border-blue-500',
    selectedBg: 'bg-blue-50',
    badgeBg: 'bg-blue-600',
    color: '#9333ea',
  },
  {
    id: 'social',
    icon: Share2,
    label: 'Create Content',
    description: 'Design social media posts, stories, reels, banners and thumbnails.',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    selectedBorder: 'border-teal-500',
    selectedBg: 'bg-teal-50',
    badgeBg: 'bg-teal-600',
    color: '#0d9488',
  },
];

const STEPS_ADS    = ['URL', 'Type', 'Brand Details', 'Size, Goals & Audience', 'Select Images'];
const STEPS_SOCIAL = ['URL', 'Type', 'Post Details',  'Size, Goals & Audience', 'Select Images'];

const adsSelected    = 'border-blue-500 bg-blue-50 text-blue-700';
const socialSelected = 'border-teal-500 bg-teal-50 text-teal-700';

export default function CreateFromUrl() {
  const router = useRouter();
  const { sendUrl, generateCustomCreative, saveDesign, activeBrandId } = useAuth();

  const [step, setStep] = useState(1);
  const [creationType, setCreationType] = useState(null);

  // Step 1
  const [urlInput, setUrlInput]       = useState('');
  const [importing, setImporting]     = useState(false);
  const [imported, setImported]       = useState(false);
  const [importError, setImportError] = useState('');

  // Step 3
  const [brandName, setBrandName]           = useState('');
  const [description, setDescription]       = useState('');
  const [visualStyle, setVisualStyle]       = useState('Modern');
  const [brandColor, setBrandColor]         = useState('#1e3a8a');
  const [logoUrl, setLogoUrl]               = useState('');
  const [postTone, setPostTone]             = useState('Casual');
  const [targetPlatform, setTargetPlatform] = useState('Instagram');

  // Step 4
  const [adSize, setAdSize]               = useState('Meta Square');
  const [socialSize, setSocialSize]       = useState('Instagram Square');
  const [campaignGoal, setCampaignGoal]   = useState('Engagement');
  const [audience, setAudience]           = useState('B2C');
  const [fileFormat, setFileFormat]       = useState('PNG');
  const [generating, setGenerating]       = useState(false);
  const [generateError, setGenerateError] = useState('');

  // ── Step 5 — Image state (mirrors ImageAdsForm exactly) ──────────────────
  const [imageSrc, setImageSrc]               = useState([]);   // raw URLs for cropper
  const [croppedImages, setCroppedImages]     = useState([]);   // finished Files with .previewUrl
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [showCropper, setShowCropper]         = useState(false);
  const [crop, setCrop]                       = useState({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop]     = useState(null);
  const [imageSrcMeta, setImageSrcMeta]       = useState([]); // original URLs parallel to imageSrc
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const cropperRef = useRef(null);

  // Reset completedCrop when crop index changes
  useEffect(() => {
    setCompletedCrop(null);
  }, [currentCropIndex]);

  // Result
  const [result, setResult] = useState(null);

  const [toast, setToast] = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const isAds  = creationType === 'ads';
  const STEPS  = isAds ? STEPS_ADS : STEPS_SOCIAL;
  const activeType = CREATION_TYPES.find(t => t.id === creationType) || CREATION_TYPES[0];

  const getSelectedSize = () => isAds
    ? AD_SIZES.find(s => s.label === adSize)?.size?.replace('×', 'x') || '1080x1080'
    : SOCIAL_SIZES.find(s => s.label === socialSize)?.size?.replace('×', 'x') || '1080x1080';

  const previewFormData = {
    brandName,
    description,
    primaryColor: brandColor,
    secondaryColor: '#0ea5e9',
    logo: logoUrl || null,
    backgroundImage: croppedImages.find(Boolean)?.previewUrl || null,
    size: getSelectedSize(),
    campaignGoal,
    audience,
    fileFormat,
    font: 'inherit',
    caption: description,
  };

  // ── URL import ──────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!urlInput.trim()) return;
    setImporting(true);
    setImportError('');
    try {
      const result = await sendUrl(urlInput.trim());
      if (!result?.ok) throw new Error(result?.message || 'Import failed');
      const d = result.data?.data || result.data || {};
      if (d.name)          setBrandName(d.name);
      if (d.description)   setDescription(d.description);
      if (d.primary_color) setBrandColor(d.primary_color);
      const logo = d.logo || d.logo_url || d.logo?.url || null;
      if (logo && typeof logo === 'string') setLogoUrl(logo);
      setImported(true);
    } catch (err) {
      setImportError(err.message || 'Failed to import. Please fill in manually.');
    } finally {
      setImporting(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Cropper: save crop (mirrors ImageAdsForm saveCroppedImage) ───────────
  const saveCroppedImage = useCallback(async () => {
    if (!completedCrop || !cropperRef.current) return;
    const image = cropperRef.current.cropper?.getImage?.();
    if (!image) return;

    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d");
    const scaleX = image.naturalWidth  / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width  = completedCrop.width;
    canvas.height = completedCrop.height;
    ctx.drawImage(
      image,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, canvas.width, canvas.height
    );

    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const file  = new File([blob], `cropped-${currentCropIndex}.png`, { type: "image/png" });
    file.previewUrl = URL.createObjectURL(blob);
    file.sourceUrl  = imageSrcMeta[currentCropIndex] || null;

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

  // ── Cropper: skip (mirrors ImageAdsForm handleSkipCrop) ─────────────────
  const handleSkipCrop = () => {
    const url = imageSrc[currentCropIndex];
    fetch(url).then(r => r.blob()).then(blob => {
      const file = new File([blob], `original-${currentCropIndex}.png`, { type: blob.type });
      file.previewUrl = url;
      file.sourceUrl  = imageSrcMeta[currentCropIndex] || null;
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

  // ── Cropper: previous (mirrors ImageAdsForm handlePreviousCrop) ──────────
  const handlePreviousCrop = () => {
    if (currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
      setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
      setCompletedCrop(null);
    }
  };

  // ── Remove a selected image ──────────────────────────────────────────────
  const removeCroppedImage = (idx) => {
    const next  = croppedImages.filter((_, i) => i !== idx);
    setCroppedImages(next);
    if (idx <= currentCropIndex && currentCropIndex > 0) {
      setCurrentCropIndex((prev) => prev - 1);
    }
  };

  // ── MediaPicker apply (mirrors ImageAdsForm handleApplyFromPicker) ───────
  const handleApplyFromPicker = async (images, media) => {
    if (images.length > 0) {
      try {
        const processedFiles = await Promise.all(
          images.map(async (item, idx) => {
            if (item.file instanceof File) {
              item.file.previewUrl = item.src;
              item.file.sourceUrl  = null;
              return item.file;
            }
            const url      = item.large || item.src;
            const fetchUrl = url.startsWith("http")
              ? `/api/proxy-image?url=${encodeURIComponent(url)}`
              : url;
            const res  = await fetch(fetchUrl);
            const blob = await res.blob();
            const file = new File([blob], `selected-${Date.now()}-${idx}`, { type: blob.type || "image/png" });
            file.previewUrl = URL.createObjectURL(blob);
            file.sourceUrl  = item.large || item.src || null;
            return file;
          })
        );

        const previewUrls = processedFiles.map(f => f.previewUrl);
        const sourceUrls  = processedFiles.map(f => f.sourceUrl || null);

        if (!showCropper) {
          setImageSrc(previewUrls);
          setImageSrcMeta(sourceUrls);
          setCroppedImages(Array(previewUrls.length).fill(null));
          setCurrentCropIndex(0);
        } else {
          setImageSrc(prev => [...prev, ...previewUrls]);
          setImageSrcMeta(prev => [...prev, ...sourceUrls]);
          setCroppedImages(prev => [...prev, ...Array(previewUrls.length).fill(null)]);
          setCurrentCropIndex(imageSrc.length);
        }

        setShowCropper(true);
        showToast(`Added ${images.length} image(s) — crop them`);
      } catch (err) {
        console.error("Image loading failed:", err);
        showToast("Some images couldn't be loaded.");
      }
    }

    if (media.length > 0) {
      const videoObjects = media.map((src, i) => ({
        id: `video-${Date.now()}-${i}`,
        previewUrl: src,
        thumbnail: src,
        type: "video",
      }));
      setCroppedImages(prev => [...prev, ...videoObjects]);
      showToast(`Added ${media.length} media item(s)`);
    }

    setMediaPickerOpen(false);
  };

  // ── BrandImagesStrip: use without cropping ───────────────────────────────
  const handleBrandImageUse = (imageObjs) => {
    const pseudos = imageObjs.map(obj => ({
      previewUrl: obj.src,
      sourceUrl:  obj.src,
      name: obj.alt || "brand-image",
      type: "image/jpeg",
    }));
    setCroppedImages(prev => [...prev, ...pseudos]);
    showToast(`${pseudos.length} image${pseudos.length > 1 ? "s" : ""} added ✓`);
  };

  // ── BrandImagesStrip: crop ───────────────────────────────────────────────
  const handleBrandImageCrop = async (imageObjs) => {
    for (const imageObj of imageObjs) {
      const originalUrl = imageObj.src;
      let cropperUrl    = originalUrl;
      try {
        const res  = await fetch(`/api/proxy-image?url=${encodeURIComponent(originalUrl)}`);
        const blob = await res.blob();
        cropperUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.warn("Proxy failed, falling back to original URL", err);
      }
      setImageSrc(prev => [...prev, cropperUrl]);
      setImageSrcMeta(prev => [...prev, originalUrl]);
      setCroppedImages(prev => [...prev, null]);
    }
    if (!showCropper) setCurrentCropIndex(0);
    setShowCropper(true);
  };

  // ── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!brandName.trim()) { setGenerateError('Please enter a brand name'); return; }
    setGenerating(true);
    setGenerateError('');
    try {
      const selectedSize = getSelectedSize();
      const validImages  = croppedImages.filter(Boolean);

      const res = await generateCustomCreative({
        creativeType: isAds ? 'ads_creative' : 'social_creative',
        categoryType: isAds ? 'image' : 'posts',
        brandName,
        description,
        brandColor,
        logo: logoUrl || null,
        visualStyle,
        font: 'Montserrat',
        sourceUrl: urlInput || null,
        size: selectedSize,
        campaignGoal,
        audience,
        fileFormat,
        // ── image URLs included in payload ───────────────────────────────
        images: validImages
          .map(f => f?.sourceUrl || f?.previewUrl)
          .filter(Boolean),
        ...(isAds ? {} : { tone: postTone, platforms: targetPlatform }),
        generatedAt: new Date().toISOString(),
      });

      if (!res.ok) throw new Error(res.message || 'Generation failed');

      const data = res.data;

      if (data?.type === 'design' && Array.isArray(data?.variations) && data.variations.length) {
        setResult({ type: 'design', variations: data.variations, reply: data.reply || '', meta: data.meta || {} });
      } else if (data?.assets?.length) {
        setResult({ assets: data.assets });
      } else {
        throw new Error('No results returned from generation');
      }
    } catch (err) {
      setGenerateError(err.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ── RESULT VIEW ───────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen py-1">
        {toast && (
          <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-fade-in">
            {toast}
          </div>
        )}
        <div>
          <AdPreview
            creative={activeType}
            category={{ label: isAds ? 'Ad Creative' : 'Social Content' }}
            formData={previewFormData}
            result={result}
            onBack={() => setResult(null)}
            onOpenModal={() => {}}
            saveDesign={saveDesign}
            activeBrandId={activeBrandId}
            showToast={showToast}
          />
        </div>
      </div>
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-10 px-4">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => {
            const n      = i + 1;
            const done   = step > n;
            const active = step === n;
            return (
              <React.Fragment key={n}>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                    ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : n}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {n < STEPS.length && <div className="flex-1 h-px bg-gray-200" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── STEP 1: URL ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Enter your website URL</h2>
              <p className="text-sm text-gray-500">We'll automatically extract your brand details to get started.</p>
            </div>

            <div className={`rounded-xl border p-5 transition-all ${imported ? 'border-green-300 bg-green-50/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Globe className={`w-4 h-4 ${imported ? 'text-green-500' : 'text-blue-500'}`} />
                  URL
                  {imported && (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" /> Brand data imported
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400">Auto-fills brand info</span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={urlInput}
                    onChange={e => { setUrlInput(e.target.value); setImported(false); setImportError(''); }}
                    placeholder="https://yourwebsite.com"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white
                      ${imported ? 'border-green-300 pr-8' : 'border-gray-200'}`}
                    onKeyDown={e => e.key === 'Enter' && handleImport()}
                  />
                  {imported && <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                </div>
                <button
                  onClick={handleImport}
                  disabled={importing || !urlInput.trim()}
                  className={`px-5 py-2 cursor-pointer rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2 shrink-0
                    ${imported ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {importing
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : imported ? <><Check className="w-3.5 h-3.5" /> Done</> : 'Import'}
                </button>
              </div>

              {importError && <p className="text-xs text-red-500 mt-2">{importError}</p>}

              {imported && brandName && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-green-100 border border-green-200">
                  <div className="w-8 h-8 rounded-full shrink-0 border-2 border-white shadow-sm" style={{ background: brandColor }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-green-700">{brandName}</p>
                    {description && <p className="text-[11px] text-gray-500 truncate">{description}</p>}
                  </div>
                  {logoUrl && (
                    <img src={logoUrl} alt="logo"
                      className="w-10 h-10 object-contain rounded-lg border border-green-200 bg-white p-0.5 shrink-0"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              )}

              {!imported && !importError && (
                <p className="text-[11px] text-gray-400 mt-2">
                  Enter your website URL and click Import to auto-fill your brand details.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!imported}
                className="px-5 py-2 cursor-pointer bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Type ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">What would you like to create?</h2>
              <p className="text-sm text-gray-500">Choose your creative type to get started.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CREATION_TYPES.map(type => {
                const selected = creationType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setCreationType(type.id)}
                    className={`text-left p-6 rounded-xl border-2 transition-all cursor-pointer
                      ${selected ? `${type.selectedBorder} ${type.selectedBg}` : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${type.iconBg}`}>
                      <type.icon className={`w-6 h-6 ${type.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{type.label}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{type.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(1)} className="px-4 py-2 cursor-pointer border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!creationType}
                className="px-5 py-2 cursor-pointer bg-blue-700 rounded-lg hover:bg-blue-800 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Brand / Post Details ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-7 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isAds ? 'Brand Details' : 'Post Details'}
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Brand Name / Project Name <span className="text-red-400">*</span>
              </label>
              <input
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="e.g. Acme Inc"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                {isAds ? 'Description' : 'Post Description'}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={isAds ? 'What does the brand do?' : 'What is this post about?'}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {isAds ? (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Visual Style</label>
                <div className="flex flex-wrap gap-2">
                  {VISUAL_STYLES.map(style => (
                    <button
                      key={style}
                      onClick={() => setVisualStyle(style)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all cursor-pointer
                        ${visualStyle === style ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Post Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {POST_TONES.map(t => (
                      <button
                        key={t}
                        onClick={() => setPostTone(t)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all cursor-pointer
                          ${postTone === t ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Target Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {SOCIAL_PLATFORMS.map(p => (
                      <button
                        key={p}
                        onClick={() => setTargetPlatform(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all cursor-pointer
                          ${targetPlatform === p ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Brand Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {DEFAULT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setBrandColor(c)}
                      style={{ background: c }}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer
                        ${brandColor === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
                    />
                  ))}
                  <label className="w-7 h-7 rounded-full border border-gray-200 cursor-pointer overflow-hidden" style={{ background: brandColor }}>
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
                  </label>
                  <input
                    value={brandColor}
                    onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setBrandColor(e.target.value)}
                    className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Logo</label>
                <label className={`flex items-center gap-2 border border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all
                  ${logoUrl ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  {logoUrl ? (
                    <>
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-green-600 font-medium flex-1 truncate">
                        {logoUrl.startsWith('data:') ? 'Logo uploaded' : 'Logo imported'}
                      </span>
                      <img src={logoUrl} alt="logo"
                        className="w-10 h-10 object-contain rounded border border-green-200 bg-white p-0.5 shrink-0"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); setLogoUrl(''); }}
                        className="text-gray-400 hover:text-red-500 transition shrink-0 text-xs ml-1"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Upload logo</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(2)} className="px-4 py-2 cursor-pointer border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!brandName.trim()}
                className="px-5 py-2 cursor-pointer bg-blue-700 rounded-lg hover:bg-blue-800 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Size, Goals & Audience ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-7 space-y-7">
            <h2 className="text-xl font-bold text-gray-900">Size, Goals & Audience</h2>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">{isAds ? 'Ad Size' : 'Post Size'}</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(isAds ? AD_SIZES : SOCIAL_SIZES).map(s => {
                  const isSelected = isAds ? adSize === s.label : socialSize === s.label;
                  return (
                    <button
                      key={s.label}
                      onClick={() => isAds ? setAdSize(s.label) : setSocialSize(s.label)}
                      className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer
                        ${isSelected
                          ? isAds ? adsSelected : socialSelected
                          : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300'}`}
                    >
                      <p className="text-xs font-semibold">{s.label}</p>
                      <p className={`text-[10px] mt-0.5 ${isSelected ? 'opacity-70' : 'text-gray-400'}`}>{s.size}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Campaign Goal</label>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_GOALS.map(g => (
                  <button
                    key={g}
                    onClick={() => setCampaignGoal(g)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all cursor-pointer
                      ${campaignGoal === g
                        ? isAds ? adsSelected : socialSelected
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Audience</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AUDIENCES.map(a => (
                  <button
                    key={a.label}
                    onClick={() => setAudience(a.label)}
                    className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer
                      ${audience === a.label
                        ? isAds ? adsSelected : socialSelected
                        : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'}`}
                  >
                    <p className="text-xs font-semibold">{a.label}</p>
                    <p className={`text-[11px] mt-0.5 ${audience === a.label ? 'opacity-70' : 'text-gray-400'}`}>{a.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">File Format</label>
              <div className="flex gap-2">
                {FILE_FORMATS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFileFormat(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer flex items-center gap-1.5
                      ${fileFormat === f
                        ? isAds ? adsSelected : socialSelected
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {fileFormat === f && <Check className="w-3 h-3" />}
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(3)} className="px-4 cursor-pointer py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="px-5 py-2 cursor-pointer bg-blue-700 rounded-lg hover:bg-blue-800 text-white text-sm font-semibold transition-all flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Select Images ── */}
        {step === 5 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-7 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select Images</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add background images for your creative. You can search, upload, or use brand images.
              </p>
            </div>

            {generateError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <X className="w-4 h-4 shrink-0" /> {generateError}
              </div>
            )}

            {/* Brand images strip */}
            <BrandImagesStrip
              onSelect={handleBrandImageUse}
              onCrop={handleBrandImageCrop}
              selectedUrls={croppedImages
                .filter(Boolean)
                .map(f => f?.sourceUrl || f?.previewUrl)
                .filter(Boolean)}
            />

            {/* Already-selected previews */}
            {croppedImages.filter(Boolean).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Selected ({croppedImages.filter(Boolean).length})
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {croppedImages.map((item, index) => {
                    if (!item) return null;
                    const url     = item?.previewUrl;
                    const isVideo = item?.type?.includes?.("video");
                    return (
                      <div key={index} className="relative group">
                        {isVideo ? (
                          <video
                            src={url} poster={item.thumbnail}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                            muted loop playsInline preload="metadata"
                            onMouseEnter={e => e.target.play().catch(() => {})}
                            onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                          />
                        ) : url ? (
                          <img
                            src={url}
                            alt={`Selected ${index + 1}`}
                            className="w-full h-auto object-cover rounded-xl border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 border-2 border-dashed rounded-xl flex items-center justify-center">
                            <span className="text-xs text-gray-400">No media</span>
                          </div>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); removeCroppedImage(index); }}
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

            {/* Upload / picker drop zone */}
            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              onClick={() => setMediaPickerOpen(true)}
            >
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                <FileUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Upload or Search Images</p>
                <p className="text-xs text-gray-400 mt-1">Search the web, magic studio, or upload from device</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setMediaPickerOpen(true); }}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer flex items-center gap-2"
              >
                <Images className="w-4 h-4" /> Choose Media
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Images are optional — skip to generate with brand colors only.
            </p>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(4)} className="px-4 cursor-pointer py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 cursor-pointer py-2 bg-blue-700 rounded-lg hover:bg-blue-800 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center gap-2 min-w-[160px] justify-center"
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  : <>Generate Creative <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
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
        postData={{
          brandName,
          description,
          primaryColor: brandColor,
          logo: logoUrl || null,
        }}
        activeBrand={null}
        showToast={showToast}
      />
    </div>
  );
}