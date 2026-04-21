import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Upload, Image, X, Trash2, MoreVertical,
  ChevronDown, Check, Loader2, Play, Copy, Crop, Wand2, Link,
  RotateCcw, AlertCircle, Clock, Settings2, AlignLeft, AlignCenter,
  AlignRight, Maximize2, Type, Move, ImageIcon,
} from 'lucide-react';
import api from '../api/axios';
import { useReusableFunctions } from '@/context/ReusableFunctions'; 

// ─────────────────────────────────────────────────────────────
// Image Properties Modal
// ─────────────────────────────────────────────────────────────

const ALIGN_OPTIONS = [
  { value: 'left', icon: AlignLeft, label: 'Left' },
  { value: 'center', icon: AlignCenter, label: 'Center' },
  { value: 'right', icon: AlignRight, label: 'Right' },
];

const FIT_OPTIONS = [
  { value: 'cover', label: 'Cover', desc: 'Fill & crop' },
  { value: 'contain', label: 'Contain', desc: 'Fit inside' },
  { value: 'fill', label: 'Fill', desc: 'Stretch' },
  { value: 'none', label: 'None', desc: 'Natural size' },
];

const ImagePropertiesModal = ({ image, onClose, onApply, existingData }) => {
  const [alt, setAlt] = useState(existingData?.alt || image?.alt || '');
  const [width, setWidth] = useState(existingData?.width || 'auto');
  const [height, setHeight] = useState(existingData?.height || 'auto');
  const [align, setAlign] = useState(existingData?.align || 'center');
  const [objectFit, setObjectFit] = useState(existingData?.objectFit || 'cover');
  const [borderRadius, setBorderRadius] = useState(existingData?.borderRadius ?? 8);
  const [caption, setCaption] = useState(existingData?.caption || '');
  const [linkUrl, setLinkUrl] = useState(existingData?.linkUrl || '');
  const [lazy, setLazy] = useState(existingData?.lazy ?? true);
  const [previewSize, setPreviewSize] = useState('md');

  const previewDims = { sm: 'h-32', md: 'h-48', lg: 'h-64' };

  const handleApply = () => {
    onApply({
      url: image.url,
      alt: alt.trim() || image.alt || 'Image',
      width: width === '' ? 'auto' : width,
      height: height === '' ? 'auto' : height,
      align,
      objectFit,
      borderRadius: `${borderRadius}px`,
      caption: caption.trim(),
      linkUrl: linkUrl.trim(),
      lazy,
    });
  };

  const dimDisplay = (val) => (val === 'auto' ? '' : val.replace('px', ''));
  const dimCommit = (raw) => {
    const n = parseInt(raw, 10);
    return raw === '' ? 'auto' : isNaN(n) ? 'auto' : `${n}px`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-light-border dark:border-dark-border flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-gradient-to-r from-primary-700 to-primary-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/15 rounded-lg">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-none">Image Properties</h3>
              <p className="text-xs opacity-70 mt-0.5">Configure before inserting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-light-border dark:divide-dark-border">

            {/* LEFT — Live preview */}
            <div className="p-5 flex flex-col gap-4 bg-light-bg dark:bg-dark-bg">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-light-text dark:text-dark-text uppercase tracking-wider">
                  Preview
                </p>
                <div className="flex gap-1">
                  {(['sm', 'md', 'lg']).map(s => (
                    <button
                      key={s}
                      onClick={() => setPreviewSize(s)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${previewSize === s
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:border-primary-400'
                        }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview card */}
              <div
                className={`relative w-full ${previewDims[previewSize]} rounded-xl overflow-hidden border-2 border-light-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center transition-all`}
                style={{ justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }}
              >
                <img
                  src={image?.thumbnail || image?.url}
                  alt={alt || 'Preview'}
                  style={{
                    width: width !== 'auto' ? width : '100%',
                    height: height !== 'auto' ? height : '100%',
                    objectFit,
                    borderRadius: `${borderRadius}px`,
                    display: 'block',
                  }}
                />
              </div>

              {caption && (
                <p className="text-xs text-center text-light-text dark:text-dark-text italic px-2 truncate">
                  {caption}
                </p>
              )}

              {/* Source info */}
              <div className="pt-3 border-t border-light-border dark:border-dark-border">
                <p className="text-xs text-light-text dark:text-dark-text truncate flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3 flex-shrink-0" />
                  {image?.photographer ? `By ${image.photographer}` : image?.name || 'Selected image'}
                </p>
                <p className="text-xs text-light-text dark:text-dark-text opacity-50 truncate mt-0.5 font-mono pl-4">
                  {(image?.url || '').slice(0, 50)}{image?.url?.length > 50 ? '…' : ''}
                </p>
              </div>
            </div>

            {/* RIGHT — Controls */}
            <div className="p-5 flex flex-col gap-5 bg-white dark:bg-dark-card">

              {/* Alt text */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-dark-bold mb-1.5">
                  <Type className="w-3.5 h-3.5 text-light-text dark:text-dark-text" />
                  Alt Text
                </label>
                <input
                  type="text"
                  value={alt}
                  onChange={e => setAlt(e.target.value)}
                  placeholder="Describe the image for accessibility…"
                  className="w-full px-3 py-2 text-sm border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-dark-bold placeholder-light-text dark:placeholder-dark-text focus:outline-none focus:ring-2 focus:ring-primary-600/40"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-dark-bold mb-1.5">
                  Caption <span className="font-normal text-light-text dark:text-dark-text">(optional)</span>
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Short caption shown below the image…"
                  className="w-full px-3 py-2 text-sm border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-dark-bold placeholder-light-text dark:placeholder-dark-text focus:outline-none focus:ring-2 focus:ring-primary-600/40"
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-dark-bold mb-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-light-text dark:text-dark-text" />
                  Dimensions
                </label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={dimDisplay(width)}
                      onChange={e => setWidth(e.target.value === '' ? 'auto' : e.target.value)}
                      onBlur={e => setWidth(dimCommit(e.target.value))}
                      placeholder="auto"
                      className="w-full px-3 py-2 pr-8 text-sm border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-dark-bold placeholder-light-text dark:placeholder-dark-text focus:outline-none focus:ring-2 focus:ring-primary-600/40"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-light-text dark:text-dark-text pointer-events-none">W</span>
                  </div>
                  <span className="text-light-text dark:text-dark-text font-bold text-sm select-none">×</span>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={dimDisplay(height)}
                      onChange={e => setHeight(e.target.value === '' ? 'auto' : e.target.value)}
                      onBlur={e => setHeight(dimCommit(e.target.value))}
                      placeholder="auto"
                      className="w-full px-3 py-2 pr-8 text-sm border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-dark-bold placeholder-light-text dark:placeholder-dark-text focus:outline-none focus:ring-2 focus:ring-primary-600/40"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-light-text dark:text-dark-text pointer-events-none">H</span>
                  </div>
                </div>
                <p className="text-xs text-light-text dark:text-dark-text mt-1">
                  Leave blank for natural size. Use px values e.g. 400
                </p>
              </div>

              {/* Alignment */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-dark-bold mb-1.5">
                  <Move className="w-3.5 h-3.5 text-light-text dark:text-dark-text" />
                  Alignment
                </label>
                <div className="flex gap-2">
                  {ALIGN_OPTIONS.map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setAlign(value)}
                      title={label}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 text-xs font-medium transition-all ${align === value
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Object Fit */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-dark-bold mb-1.5">
                  Object Fit
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {FIT_OPTIONS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setObjectFit(value)}
                      className={`px-3 py-2 rounded-lg border-2 text-left transition-all ${objectFit === value
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg hover:border-primary-400'
                        }`}
                    >
                      <p className={`text-xs font-semibold ${objectFit === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-dark-bold'
                        }`}>
                        {label}
                      </p>
                      <p className="text-xs text-light-text dark:text-dark-text mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-900 dark:text-dark-bold">
                    Corner Radius
                  </label>
                  <span className="text-xs font-mono bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border px-2 py-0.5 rounded text-light-text dark:text-dark-text">
                    {borderRadius}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0" max="48" step="2"
                  value={borderRadius}
                  onChange={e => setBorderRadius(Number(e.target.value))}
                  className="w-full accent-primary-600 h-1.5 rounded-full"
                />
                <div className="flex justify-between text-xs text-light-text dark:text-dark-text mt-0.5">
                  <span>Sharp</span><span>Rounded</span><span>Pill</span>
                </div>
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-dark-bold mb-1.5">
                  Link URL <span className="font-normal text-light-text dark:text-dark-text">(optional)</span>
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-light-text dark:text-dark-text" />
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-dark-bold placeholder-light-text dark:placeholder-dark-text focus:outline-none focus:ring-2 focus:ring-primary-600/40"
                  />
                </div>
              </div>

              {/* Lazy load toggle */}
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-dark-bold">Lazy Load</p>
                  <p className="text-xs text-light-text dark:text-dark-text">Defer loading until image enters viewport</p>
                </div>
                <button
                  onClick={() => setLazy(l => !l)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${lazy ? 'bg-primary-600' : 'bg-light-border dark:bg-dark-border'
                    }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${lazy ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-light-border dark:border-dark-border flex items-center justify-between gap-3 flex-shrink-0 bg-white dark:bg-dark-card">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm font-medium text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            Insert Image
          </button>
        </div>

      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// BG Removal Modal
// ─────────────────────────────────────────────────────────────

const PROCESSING_STEPS = [
  { label: 'Loading AI model…', ms: 4000 },
  { label: 'Analysing image…', ms: 3000 },
  { label: 'Detecting foreground…', ms: 4000 },
  { label: 'Removing background…', ms: 5000 },
  { label: 'Cleaning edges…', ms: 3000 },
  { label: 'Finalising result…', ms: 2000 },
];

const BgRemovalModal = ({ image, onClose, onApply }) => {
  const [phase, setPhase] = useState('processing');
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const clockRef = useRef(null);
  const stepRef = useRef(null);
  const startRef = useRef(null);
  const abortRef = useRef(null);

  const startClock = () => {
    startRef.current = Date.now();
    clockRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000,
    );
  };
  const stopClock = () => { clearInterval(clockRef.current); clearTimeout(stepRef.current); };

  const startStepTicker = () => {
    let i = 0;
    const tick = () => {
      i = Math.min(i + 1, PROCESSING_STEPS.length - 1);
      setStepIdx(i);
      if (i < PROCESSING_STEPS.length - 1)
        stepRef.current = setTimeout(tick, PROCESSING_STEPS[i].ms);
    };
    stepRef.current = setTimeout(tick, PROCESSING_STEPS[0].ms);
  };

  const handleProcess = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setPhase('processing'); setError(null); setResultUrl(null); setResultBlob(null);
    setStepIdx(0); setElapsed(0);
    startClock(); startStepTicker();
    try {
      let response;
      if (image.url.startsWith('blob:') || image.url.startsWith('data:')) {
        const srcBlob = await fetch(image.url).then(r => r.blob());
        const formData = new FormData();
        formData.append('image', srcBlob, 'source.png');
        response = await fetch('/api/image-processing/remove-bg', { method: 'POST', body: formData, signal: abortRef.current.signal });
      } else {
        response = await fetch('/api/image-processing/remove-bg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: image.url }),
          signal: abortRef.current.signal,
        });
      }
      if (!response.ok) {
        let msg = `Server error ${response.status}`;
        try { const j = await response.json(); msg = j.error || msg; } catch { }
        throw new Error(msg);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      stopClock(); setResultBlob(blob); setResultUrl(url); setPhase('done');
    } catch (err) {
      stopClock();
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to remove background. Please try again.');
      setPhase('error');
    }
  }, [image.url]);

  useEffect(() => {
    handleProcess();
    return () => { stopClock(); abortRef.current?.abort(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = async () => {
    if (!resultBlob) return;
    setIsSaving(true); setError(null);
    try {
      const formData = new FormData();
      formData.append('image', resultBlob, 'bg-removed.png');
      const res = await api.post('/image-gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const savedUrl = res.data?.image ?? res.data?.image_url ?? res.data?.url;
      onApply({ url: savedUrl, image_url: savedUrl });
    } catch {
      setError('Failed to save image. Please try again.');
    } finally { setIsSaving(false); }
  };

  const checkerStyle = {
    backgroundImage: `
      linear-gradient(45deg,#e5e7eb 25%,transparent 25%),
      linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),
      linear-gradient(45deg,transparent 75%,#e5e7eb 75%),
      linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)
    `,
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0,0 8px,8px -8px,-8px 0px',
  };

  const isProcessing = phase === 'processing';
  const isDone = phase === 'done';
  const isError = phase === 'error';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-light-border dark:border-dark-border flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-gradient-to-r from-primary-700 to-primary-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <Wand2 className="w-5 h-5" />
            <div>
              <h3 className="text-lg font-bold leading-none">Remove Background</h3>
              <p className="text-xs opacity-75 mt-0.5">Powered by AI — processed on our server</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning banner */}
        {isProcessing && (
          <div className="px-6 py-2.5 bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border flex items-center gap-2 flex-shrink-0">
            <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" />
            <p className="text-xs text-light-text dark:text-dark-text">
              AI background removal takes <strong className="text-dark-bold dark:text-dark-bold">5–15 seconds</strong>. Please wait.
            </p>
          </div>
        )}

        {/* Image panels */}
        <div className="p-6 bg-white dark:bg-dark-card">
          <div className="grid grid-cols-2 gap-5">

            {/* Original */}
            <div>
              <p className="text-xs font-semibold text-light-text dark:text-dark-text uppercase tracking-wider mb-2">Original</p>
              <div className="aspect-square rounded-xl overflow-hidden border-2 border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
                <img src={image.thumbnail || image.url} alt="Original" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Result */}
            <div>
              <p className="text-xs font-semibold text-light-text dark:text-dark-text uppercase tracking-wider mb-2">Result</p>
              <div
                className="aspect-square rounded-xl overflow-hidden border-2 border-light-border dark:border-dark-border relative bg-light-bg dark:bg-dark-bg"
                style={isDone ? checkerStyle : {}}
              >
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/90 dark:bg-dark-card/90 p-5">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-950" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
                      <Wand2 className="absolute inset-0 m-auto w-6 h-6 text-primary-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-dark-bold dark:text-dark-bold">{PROCESSING_STEPS[stepIdx].label}</p>
                      <p className="text-xs text-light-text dark:text-dark-text mt-1 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />{elapsed}s elapsed
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {PROCESSING_STEPS.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-500 ${i < stepIdx
                            ? 'w-5 bg-primary-600'
                            : i === stepIdx
                              ? 'w-5 bg-primary-400 animate-pulse'
                              : 'w-1.5 bg-light-border dark:bg-dark-border'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {isDone && resultUrl && (
                  <img src={resultUrl} alt="Background removed" className="w-full h-full object-contain" />
                )}

                {isError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-5 gap-3">
                    <div className="w-12 h-12 rounded-full bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-accent-pink" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-dark-bold dark:text-dark-bold">Processing failed</p>
                      <p className="text-xs text-accent-pink mt-1 max-w-[180px]">{error}</p>
                    </div>
                    <button
                      onClick={handleProcess}
                      className="px-4 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              {isDone && (
                <p className="text-xs text-light-text dark:text-dark-text mt-1.5 flex items-center justify-end gap-1">
                  <Check className="w-3 h-3 text-accent-green" />
                  Completed in {elapsed}s
                </p>
              )}
            </div>
          </div>

          {/* Save error */}
          {!isSaving && error && isDone && (
            <div className="mt-4 px-4 py-2.5 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-accent-pink flex-shrink-0" />
              <p className="text-sm text-accent-pink">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3 flex-shrink-0 bg-white dark:bg-dark-card">
          <div>
            {(isDone || isError) && (
              <button
                onClick={handleProcess}
                className="flex items-center gap-1.5 text-sm text-light-text dark:text-dark-text hover:text-primary-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Re-process
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm font-medium text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!isDone || isSaving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSaving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                : <><Check className="w-4 h-4" />Apply &amp; Save</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// Crop Modal
// ─────────────────────────────────────────────────────────────
const CropModal = ({ image, onClose, onApply }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(null);
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, w: 300, h: 300 });
  const [startPos, setStartPos] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [aspect, setAspect] = useState('free');

  const aspects = [
    { label: 'Free', value: 'free' }, { label: '1:1', value: 1 },
    { label: '16:9', value: 16 / 9 }, { label: '4:3', value: 4 / 3 }, { label: '3:2', value: 3 / 2 },
  ];
  const HANDLE_SIZE = 10;

  const getHandles = (box) => ({
    nw: { x: box.x - HANDLE_SIZE / 2, y: box.y - HANDLE_SIZE / 2 },
    ne: { x: box.x + box.w - HANDLE_SIZE / 2, y: box.y - HANDLE_SIZE / 2 },
    sw: { x: box.x - HANDLE_SIZE / 2, y: box.y + box.h - HANDLE_SIZE / 2 },
    se: { x: box.x + box.w - HANDLE_SIZE / 2, y: box.y + box.h - HANDLE_SIZE / 2 },
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current; const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    ctx.drawImage(img, cropBox.x, cropBox.y, cropBox.w, cropBox.h, cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    // Use primary-600 hex directly for canvas (CSS vars don't work on canvas)
    ctx.strokeStyle = '#3669EC'; ctx.lineWidth = 2;
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(cropBox.x + (cropBox.w / 3) * i, cropBox.y); ctx.lineTo(cropBox.x + (cropBox.w / 3) * i, cropBox.y + cropBox.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cropBox.x, cropBox.y + (cropBox.h / 3) * i); ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + (cropBox.h / 3) * i); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = '#3669EC';
    Object.values(getHandles(cropBox)).forEach(h => ctx.fillRect(h.x, h.y, HANDLE_SIZE, HANDLE_SIZE));
  }, [cropBox, imgLoaded]);

  useEffect(() => { draw(); }, [draw]);

  const getPos = (e) => {
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const hitHandle = (pos) => {
    for (const [key, h] of Object.entries(getHandles(cropBox))) {
      if (pos.x >= h.x && pos.x <= h.x + HANDLE_SIZE && pos.y >= h.y && pos.y <= h.y + HANDLE_SIZE) return key;
    }
    return null;
  };

  const inBox = (pos) =>
    pos.x > cropBox.x && pos.x < cropBox.x + cropBox.w &&
    pos.y > cropBox.y && pos.y < cropBox.y + cropBox.h;

  const onMouseDown = (e) => {
    e.preventDefault(); const pos = getPos(e); const handle = hitHandle(pos);
    if (handle) { setIsResizing(handle); setStartPos(pos); }
    else if (inBox(pos)) { setIsDragging(true); setStartPos(pos); }
  };

  const onMouseMove = (e) => {
    if (!isDragging && !isResizing) return;
    const pos = getPos(e); const dx = pos.x - startPos.x; const dy = pos.y - startPos.y;
    const canvas = canvasRef.current;
    setCropBox(prev => {
      let { x, y, w, h } = prev;
      if (isDragging) {
        x = Math.max(0, Math.min(canvas.width - w, x + dx));
        y = Math.max(0, Math.min(canvas.height - h, y + dy));
      } else {
        const min = 30;
        if (isResizing.includes('e')) w = Math.max(min, w + dx);
        if (isResizing.includes('s')) h = Math.max(min, h + dy);
        if (isResizing.includes('w')) { w = Math.max(min, w - dx); x += dx; }
        if (isResizing.includes('n')) { h = Math.max(min, h - dy); y += dy; }
        if (aspect !== 'free') h = w / aspect;
      }
      x = Math.max(0, Math.min(canvas.width - w, x));
      y = Math.max(0, Math.min(canvas.height - h, y));
      w = Math.min(w, canvas.width - x);
      h = Math.min(h, canvas.height - y);
      return { x, y, w, h };
    });
    setStartPos(pos);
  };

  const onMouseUp = () => { setIsDragging(false); setIsResizing(null); };

  const handleApply = async () => {
    const canvas = canvasRef.current; const img = imgRef.current;
    if (!canvas || !img) return;
    setIsSaving(true); setError(null);
    const scaleX = img.naturalWidth / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;
    const out = document.createElement('canvas');
    out.width = cropBox.w * scaleX; out.height = cropBox.h * scaleY;
    out.getContext('2d').drawImage(img, cropBox.x * scaleX, cropBox.y * scaleY, cropBox.w * scaleX, cropBox.h * scaleY, 0, 0, out.width, out.height);
    out.toBlob(async (blob) => {
      try {
        const formData = new FormData(); formData.append('image', blob, 'cropped.jpg');
        const res = await api.post('/image-gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const savedUrl = res.data?.image ?? res.data?.image_url ?? res.data?.url;
        onApply({ url: savedUrl, image_url: savedUrl });
      } catch {
        setError('Failed to save cropped image.');
      } finally { setIsSaving(false); }
    }, 'image/jpeg', 0.95);
  };

  const resetCrop = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const pad = 40;
    setCropBox({ x: pad, y: pad, w: canvas.width - pad * 2, h: canvas.height - pad * 2 });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-light-border dark:border-dark-border flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-gradient-to-r from-primary-700 to-primary-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <Crop className="w-5 h-5" />
            <h3 className="text-lg font-bold">Crop Image</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-light-border dark:border-dark-border flex items-center gap-4 flex-shrink-0 bg-light-bg dark:bg-dark-bg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-light-text dark:text-dark-text uppercase tracking-wider">Aspect:</span>
            <div className="flex gap-1">
              {aspects.map(a => (
                <button
                  key={a.label}
                  onClick={() => setAspect(a.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${aspect === a.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:border-primary-400'
                    }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={resetCrop}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-light-border dark:border-dark-border text-xs font-medium text-light-text dark:text-dark-text hover:bg-white dark:hover:bg-dark-card hover:text-primary-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Canvas */}
        <div
          className="flex-1 overflow-hidden p-4 flex items-center justify-center bg-dark-bg min-h-0"
          style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
        >
          <div className="relative max-w-full max-h-full">
            <img
              ref={imgRef}
              src={image.thumbnail || image.url}
              alt="Crop source"
              className="hidden"
              crossOrigin="anonymous"
              onLoad={(e) => {
                const canvas = canvasRef.current;
                const maxW = 700, maxH = 450;
                const scale = Math.min(maxW / e.target.naturalWidth, maxH / e.target.naturalHeight, 1);
                canvas.width = e.target.naturalWidth * scale;
                canvas.height = e.target.naturalHeight * scale;
                setImgLoaded(true);
                const pad = 40;
                setCropBox({ x: pad, y: pad, w: canvas.width - pad * 2, h: canvas.height - pad * 2 });
              }}
            />
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full rounded-lg select-none"
              style={{ maxHeight: '450px' }}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="px-6 py-2 text-sm text-accent-pink bg-light-bg dark:bg-dark-bg border-t border-light-border dark:border-dark-border">
            {error}
          </p>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-light-border dark:border-dark-border flex justify-between items-center flex-shrink-0 bg-white dark:bg-dark-card">
          <p className="text-xs text-light-text dark:text-dark-text">
            {Math.round(cropBox.w)} × {Math.round(cropBox.h)} px
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-light-border dark:border-dark-border rounded-lg text-sm font-medium text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!imgLoaded || isSaving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Apply &amp; Save
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// Image Card
// ─────────────────────────────────────────────────────────────
const ImageCard = ({ image, onSelect, onCrop, onBgRemove, onDelete, onCopyLink, showUseImage, onUseImage }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="group relative bg-white dark:bg-dark-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-light-border dark:border-dark-border break-inside-avoid mb-4">

      {/* Thumbnail */}
      <div
        className="overflow-hidden bg-light-bg dark:bg-dark-bg cursor-pointer"
        onClick={() => onSelect(image)}
      >
        {image.isVideo ? (
          <div className="w-full h-full relative">
            <img src={image.thumbnail} alt={image.alt} className="w-full h-auto block group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                <Play className="w-5 h-5 text-dark-bg ml-0.5" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={image.thumbnail || image.url}
            alt={image.alt || image.name}
            className="w-full h-auto block group-hover:scale-110 transition-transform duration-300"
          />
        )}
      </div>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-xs font-medium truncate">
            {image.photographer ? `By ${image.photographer}` : image.name}
          </p>
        </div>
      </div>

      {/* Configure & Insert hint badge */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none pb-8">
        <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-lg border border-light-border dark:border-dark-border">
          <Settings2 className="w-3.5 h-3.5 text-primary-600" />
          <span className="text-xs font-semibold text-primary-600">Configure &amp; Insert</span>
        </div>
      </div>

      {/* Action menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
          className="w-8 h-8 bg-white dark:bg-dark-card rounded-lg shadow-md flex items-center justify-center hover:bg-light-bg dark:hover:bg-dark-bg border border-light-border dark:border-dark-border transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-light-text dark:text-dark-text" />
        </button>

        {menuOpen && (
          <div className="absolute top-full right-0 mt-1 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-light-border dark:border-dark-border py-1.5 z-30 min-w-[175px]">
            {showUseImage && (
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onUseImage?.(image); }}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 font-semibold"
              >
                <Check className="w-4 h-4" /> Use Image
              </button>
            )}
            {!image.isVideo && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onCrop(image); }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg hover:text-dark-bold dark:hover:text-dark-bold transition-colors"
                >
                  <Crop className="w-4 h-4 text-primary-500" /> Crop Image
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onBgRemove(image); }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg hover:text-dark-bold dark:hover:text-dark-bold transition-colors"
                >
                  <Wand2 className="w-4 h-4 text-primary-400" /> Remove Background
                </button>
              </>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onCopyLink(image.url); }}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg hover:text-dark-bold dark:hover:text-dark-bold transition-colors"
            >
              <Copy className="w-4 h-4 text-accent-blue" /> Copy Link
            </button>
            {onDelete && (
              <>
                <div className="my-1 border-t border-light-border dark:border-dark-border" />
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(image.id); }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 text-accent-pink hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────
const ImageUploadModal = ({ isOpen, onClose, onUpload, onUseImage, editMode, currentImageData }) => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaType, setMediaType] = useState('Photos');
  const [orientation, setOrientation] = useState('All Orientations');
  const [myImages, setMyImages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);
  const [bgTarget, setBgTarget] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [orientationOpen, setOrientationOpen] = useState(false);
  const [pastedImages, setPastedImages] = useState([]);
  const [propertiesTarget, setPropertiesTarget] = useState(null);

  const fileInputRef = useRef(null);
  const mediaRef = useRef(null);
  const orientationRef = useRef(null);

  const mediaTypes = ['Photos', 'Videos'];
  const orientations = ['All Orientations', 'Horizontal', 'Vertical', 'Square'];
  const pexelsOrientationMap = { Horizontal: 'landscape', Vertical: 'portrait', Square: 'square' };
  const { showAlert } = useReusableFunctions();

  // ── My Images ─────────────────────────────────────────────
  const fetchMyImages = useCallback(async () => {
    try {
      const res = await api.get('/image-gallery');
      const raw = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.images) ? res.data.images : [];
      setMyImages(raw.map(img => ({
        id: img.id,
        url: img.image_url,
        thumbnail: img.image_url,
        name: img.image_name || `Image ${img.id}`,
        alt: img.image_name || `Image ${img.id}`,
        source: 'gallery',
      })));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (isOpen) { fetchMyImages(); handleSearch('high resolution landscape'); }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pexels search ─────────────────────────────────────────
  const handleSearch = useCallback(async (query = searchQuery) => {
    if (!query.trim()) { setSearchError('Please enter a search term'); return; }
    setIsSearching(true); setSearchError(null); setActiveTab('search');
    try {
      const params = new URLSearchParams({ query, per_page: 100 });
      if (orientation !== 'All Orientations') params.append('orientation', pexelsOrientationMap[orientation]);
      const endpoint = mediaType === 'Photos'
        ? `https://api.pexels.com/v1/search?${params}`
        : `https://api.pexels.com/videos/search?${params}`;
      const response = await fetch(`/api/pexels?endpoint=${encodeURIComponent(endpoint)}`);
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to fetch from Pexels');
      const formatted = mediaType === 'Photos'
        ? data.photos.map(p => ({ id: p.id, url: p.src.large2x, thumbnail: p.src.large, photographer: p.photographer, alt: p.alt || 'Pexels photo', source: 'pexels' }))
        : data.videos.map(v => {
          const best = [...v.video_files].sort((a, b) => b.width - a.width)[0] || {};
          return { id: v.id, url: best.link || '', thumbnail: v.image || '', photographer: v.user.name, alt: 'Pexels video', source: 'pexels', isVideo: true };
        });
      setSearchResults(formatted);
      if (!formatted.length) setSearchError('No results found. Try different search terms.');
    } catch (err) {
      setSearchError(err.message || 'Failed to search. Please try again.');
    } finally { setIsSearching(false); }
  }, [searchQuery, mediaType, orientation]);

  // ── URL paste detection ───────────────────────────────────
  const isUrl = (val) => /^https?:\/\/.+/i.test(val.trim());

  const commitInput = () => {
    const val = searchQuery.trim();
    if (!val) return;
    if (isUrl(val)) {
      setPastedImages(prev => [{
        id: `pasted-${Date.now()}`, url: val, thumbnail: val,
        alt: 'Pasted image', source: 'url', isPasted: true,
      }, ...prev]);
      setSearchQuery(''); setActiveTab('search');
    } else {
      handleSearch(val);
    }
  };

  // ── File upload ───────────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload images only (JPG, PNG, GIF)'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }
    setUploadProgress(0);
    const formData = new FormData(); formData.append('image', file);
    try {
      await api.post('/image-gallery', formData, {
        onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total)); },
      });
      setTimeout(() => { setUploadProgress(null); fetchMyImages(); setActiveTab('my-images'); }, 500);
    } catch (error) {
      setUploadProgress(null);
      showAlert({
        type: 'error',
        message: error.response?.error || error.response?.data?.error || error.message || 'Error uploading file',
      });
    }
  };

  // ── Image select → open properties modal ─────────────────
  const handleImageSelect = (image) => {
    setPropertiesTarget({
      image,
      existingData: editMode && currentImageData
        ? {
          alt: currentImageData.alt || '',
          width: currentImageData.width || 'auto',
          height: currentImageData.height || 'auto',
          align: currentImageData.align || 'center',
          objectFit: currentImageData.objectFit || 'cover',
          borderRadius: parseInt(currentImageData.borderRadius || '8', 10),
          caption: currentImageData.caption || '',
          linkUrl: currentImageData.linkUrl || '',
          lazy: currentImageData.lazy ?? true,
        }
        : null,
    });
  };

  const handlePropertiesApply = (imageData) => {
    setPropertiesTarget(null);
    onUpload(imageData);
  };

  const handleCopyLink = (url) => navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
  const handleEditApply = useCallback(() => {
    setCropTarget(null); setBgTarget(null); fetchMyImages(); setActiveTab('my-images');
  }, [fetchMyImages]);

  const allSearchResults = [...pastedImages, ...searchResults];

  useEffect(() => {
    const handler = (e) => {
      if (mediaRef.current && !mediaRef.current.contains(e.target)) setMediaOpen(false);
      if (orientationRef.current && !orientationRef.current.contains(e.target)) setOrientationOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-2">
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden border border-light-border dark:border-dark-border flex flex-col">

          {/* Header */}
          <div className="px-6 py-5 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-gradient-to-r from-primary-700 to-primary-600 text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Image className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold leading-none">Image Library</h2>
                <p className="text-sm opacity-90 mt-0.5">Click any image to configure and insert</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search bar */}
          <div className="px-6 py-4 border-b border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg flex-shrink-0">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                {isUrl(searchQuery)
                  ? <Link className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" />
                  : <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-light-text dark:text-dark-text" />
                }
                <input
                  type="text"
                  placeholder="Search photos or paste an image URL…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && commitInput()}
                  className="w-full pl-10 pr-36 py-2.5 border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-dark-bold dark:text-dark-bold bg-white dark:bg-dark-card placeholder-light-text dark:placeholder-dark-text"
                />
                {isUrl(searchQuery) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary-600 font-medium bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded-full pointer-events-none">
                    URL detected
                  </span>
                )}
              </div>
              <button
                onClick={commitInput}
                disabled={isSearching}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {isSearching
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : isUrl(searchQuery) ? <Link className="w-5 h-5" /> : <Search className="w-5 h-5" />
                }
                {isUrl(searchQuery) ? 'Add URL' : 'Search'}
              </button>
            </div>

            {/* Filters */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-light-text dark:text-dark-text">Filters:</span>

              <div className="relative" ref={mediaRef}>
                <button
                  onClick={() => setMediaOpen(!mediaOpen)}
                  className="px-3 py-1.5 border border-light-border dark:border-dark-border rounded-lg text-sm flex items-center gap-2 bg-white dark:bg-dark-card text-dark-bold dark:text-dark-bold hover:border-primary-400 transition-colors"
                >
                  {mediaType} <ChevronDown className={`w-4 h-4 transition-transform ${mediaOpen ? 'rotate-180' : ''}`} />
                </button>
                {mediaOpen && (
                  <div className="absolute top-full mt-1 left-0 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-light-border dark:border-dark-border py-2 z-20 min-w-[150px]">
                    {mediaTypes.map(t => (
                      <button
                        key={t}
                        onClick={() => { setMediaType(t); setMediaOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${mediaType === t
                          ? 'bg-primary-50 dark:bg-primary-950 text-primary-600'
                          : 'text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg hover:text-dark-bold dark:hover:text-dark-bold'
                          }`}
                      >
                        {t} {mediaType === t && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={orientationRef}>
                <button
                  onClick={() => setOrientationOpen(!orientationOpen)}
                  className="px-3 py-1.5 border border-light-border dark:border-dark-border rounded-lg text-sm flex items-center gap-2 bg-white dark:bg-dark-card text-dark-bold dark:text-dark-bold hover:border-primary-400 transition-colors"
                >
                  {orientation} <ChevronDown className={`w-4 h-4 transition-transform ${orientationOpen ? 'rotate-180' : ''}`} />
                </button>
                {orientationOpen && (
                  <div className="absolute top-full mt-1 left-0 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-light-border dark:border-dark-border py-2 z-20 min-w-[180px]">
                    {orientations.map(o => (
                      <button
                        key={o}
                        onClick={() => { setOrientation(o); setOrientationOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${orientation === o
                          ? 'bg-primary-50 dark:bg-primary-950 text-primary-600'
                          : 'text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg hover:text-dark-bold dark:hover:text-dark-bold'
                          }`}
                      >
                        {o} {orientation === o && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {searchError && (
              <div className="mt-3 px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg text-accent-pink text-sm">
                {searchError}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-light-border dark:border-dark-border bg-white dark:bg-dark-card flex-shrink-0">
            <div className="px-6 flex gap-6">
              {[
                { id: 'search', icon: <Search className="w-4 h-4" />, label: 'Search Results', count: allSearchResults.length },
                { id: 'my-images', icon: <Image className="w-4 h-4" />, label: 'My Images', count: myImages.length },
                { id: 'upload', icon: <Upload className="w-4 h-4" />, label: 'Upload', count: 0 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 border-b-2 transition-all font-medium text-sm ${activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-light-text dark:text-dark-text hover:text-dark-bold dark:hover:text-dark-bold'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {tab.icon} {tab.label}
                    {tab.count > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600">
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-light-bg dark:bg-dark-bg">

            {/* Search tab */}
            {activeTab === 'search' && (
              isSearching ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                    <p className="text-light-text dark:text-dark-text">Searching…</p>
                  </div>
                </div>
              ) : allSearchResults.length > 0 ? (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {allSearchResults.map(result => (
                    <ImageCard
                      key={result.id}
                      image={result}
                      onSelect={handleImageSelect}
                      onCrop={setCropTarget}
                      onBgRemove={setBgTarget}
                      onCopyLink={handleCopyLink}
                      showUseImage={result.isPasted && !!onUseImage}
                      onUseImage={handleImageSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <Search className="w-16 h-16 text-light-border dark:text-dark-border mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-dark-bold dark:text-dark-bold mb-2">Start Your Search</h3>
                    <p className="text-light-text dark:text-dark-text">Search photos or paste an image URL</p>
                  </div>
                </div>
              )
            )}

            {/* My Images tab */}
            {activeTab === 'my-images' && (
              myImages.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <Image className="w-16 h-16 text-light-border dark:text-dark-border mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-dark-bold dark:text-dark-bold mb-2">No Images Yet</h3>
                    <p className="text-light-text dark:text-dark-text mb-6">Upload your first image to get started</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium inline-flex items-center gap-2 hover:bg-primary-700 transition-colors"
                    >
                      <Upload className="w-5 h-5" /> Upload Images
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center">
                  {myImages.map(img => (
                    <ImageCard
                      key={img.id}
                      image={img}
                      onSelect={handleImageSelect}
                      onCrop={setCropTarget}
                      onBgRemove={setBgTarget}
                      onCopyLink={handleCopyLink}
                      onDelete={async (id) => {
                        try { await api.delete(`/image-gallery/${id}`); } catch { }
                        fetchMyImages();
                      }}
                      showUseImage={false}
                    />
                  ))}
                </div>
              )
            )}

            {/* Upload tab */}
            {activeTab === 'upload' && (
              <div className="max-w-2xl mx-auto">
                {uploadProgress !== null && (
                  <div className="mb-6 bg-white dark:bg-dark-card rounded-lg p-4 border border-light-border dark:border-dark-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-light-text dark:text-dark-text">Uploading…</span>
                      <span className="text-sm font-semibold text-primary-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2">
                      <div
                        className="bg-primary-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <div
                  onDragEnter={handleDrag} onDragLeave={handleDrag}
                  onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${dragActive
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-950 scale-105'
                    : 'border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-400'
                    }`}
                >
                  <Upload className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-dark-bold dark:text-dark-bold mb-2">
                    Drop image here or click to upload
                  </h3>
                  <p className="text-light-text dark:text-dark-text mb-6">JPG, PNG, GIF • Max 5MB</p>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                    <Upload className="w-5 h-5" /> Browse File
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Image Properties Modal */}
      {propertiesTarget && (
        <ImagePropertiesModal
          image={propertiesTarget.image}
          existingData={propertiesTarget.existingData}
          onClose={() => setPropertiesTarget(null)}
          onApply={handlePropertiesApply}
        />
      )}

      {/* Crop Modal */}
      {cropTarget && (
        <CropModal
          image={cropTarget}
          onClose={() => setCropTarget(null)}
          onApply={handleEditApply}
        />
      )}

      {/* BG Removal Modal */}
      {bgTarget && (
        <BgRemovalModal
          image={bgTarget}
          onClose={() => setBgTarget(null)}
          onApply={handleEditApply}
        />
      )}
    </>
  );
};

export default ImageUploadModal;