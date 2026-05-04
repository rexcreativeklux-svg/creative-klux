"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ArrowRight, ArrowLeft, Loader2, Upload, Check, Megaphone, Share2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdPreview from '../Adpreview';

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
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    selectedBorder: 'border-purple-500',
    selectedBg: 'bg-purple-50',
    badgeBg: 'bg-purple-600',
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

const STEPS_ADS    = ['URL', 'Type', 'Brand Details', 'Size, Goals & Audience'];
const STEPS_SOCIAL = ['URL', 'Type', 'Post Details',  'Size, Goals & Audience'];

const adsSelected    = 'border-purple-500 bg-purple-50 text-purple-700';
const socialSelected = 'border-teal-500 bg-teal-50 text-teal-700';

export default function CreateFromUrl() {
  const router = useRouter();
  const { sendUrl, generateCustomCreative, saveDesign, activeBrandId } = useAuth();

  const [step, setStep] = useState(1);
  const [creationType, setCreationType] = useState(null);

  // Step 1
  const [urlInput, setUrlInput]     = useState('');
  const [importing, setImporting]   = useState(false);
  const [imported, setImported]     = useState(false);
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
  const [adSize, setAdSize]             = useState('Meta Square');
  const [socialSize, setSocialSize]     = useState('Instagram Square');
  const [campaignGoal, setCampaignGoal] = useState('Engagement');
  const [audience, setAudience]         = useState('B2C');
  const [fileFormat, setFileFormat]     = useState('PNG');
  const [generating, setGenerating]     = useState(false);
  const [generateError, setGenerateError] = useState('');

  // Result
  const [result, setResult] = useState(null);

  // Toast state (lightweight, no library needed)
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

  // formData shape that AdPreview expects
  const previewFormData = {
    brandName,
    description,
    primaryColor: brandColor,
    secondaryColor: '#0ea5e9',
    logo: logoUrl || null,
    backgroundImage: null,
    size: getSelectedSize(),
    campaignGoal,
    audience,
    fileFormat,
    font: 'inherit',
    caption: description,
  };

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

      // Handle logo — API may return string URL or nested object
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

  const handleGenerate = async () => {
    if (!brandName.trim()) { setGenerateError('Please enter a brand name'); return; }
    setGenerating(true);
    setGenerateError('');
    try {
      const selectedSize = getSelectedSize();

      const res = await generateCustomCreative({
        creativeType: isAds ? 'ads_creative' : 'social_creative',
        categoryType: isAds ? adSize : socialSize,
        brandName,
        description,
        brandColor,
        logo: logoUrl || null,
        visualStyle,
        sourceUrl: urlInput || null,
        size: selectedSize,
        campaignGoal,
        audience,
        fileFormat,
        ...(isAds ? {} : { postTone, targetPlatform }),
        generatedAt: new Date().toISOString(),
      });

      if (!res.ok) throw new Error(res.message || 'Generation failed');

      const data = res.data;

      // Canvas design result
      if (data?.type === 'design' && Array.isArray(data?.variations) && data.variations.length) {
        setResult({ type: 'design', variations: data.variations, reply: data.reply || '', meta: data.meta || {} });
      } else if (data?.assets?.length) {
        // Image/video asset result
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

  // ── RESULT VIEW ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] py-10 px-4">
        {/* Toast */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-fade-in">
            {toast}
          </div>
        )}
        <div className="max-w-3xl mx-auto">
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

  // ── FORM VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f8fc] py-10 px-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
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
                    ${done ? 'bg-green-500 text-white' : active ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
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
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white
                      ${imported ? 'border-green-300 pr-8' : 'border-gray-200'}`}
                    onKeyDown={e => e.key === 'Enter' && handleImport()}
                  />
                  {imported && <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                </div>
                <button
                  onClick={handleImport}
                  disabled={importing || !urlInput.trim()}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2 shrink-0
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
                    <img
                      src={logoUrl}
                      alt="logo"
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
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
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
                    className={`text-left p-6 rounded-2xl border-2 transition-all cursor-pointer
                      ${selected ? `${type.selectedBorder} ${type.selectedBg}` : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${type.iconBg}`}>
                      <type.icon className={`w-6 h-6 ${type.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{type.label}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{type.description}</p>
                    {selected && (
                      <div className={`mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full text-white ${type.badgeBg}`}>
                        <Check className="w-3 h-3" /> Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!creationType}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Brand / Post Details ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 space-y-6">
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
                        ${visualStyle === style ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
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
                      <img
                        src={logoUrl}
                        alt="logo"
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
              <button onClick={() => setStep(2)} className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!brandName.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Size, Goals & Audience ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 space-y-7">
            <h2 className="text-xl font-bold text-gray-900">Size, Goals & Audience</h2>

            {generateError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {generateError}
              </div>
            )}

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
              <button onClick={() => setStep(3)} className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-60 flex items-center gap-2 min-w-[160px] justify-center"
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  : <>Generate Creative <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}