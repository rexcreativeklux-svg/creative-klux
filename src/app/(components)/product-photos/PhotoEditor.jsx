import { useState, useRef, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { generateImage } from '@/(lib)/ai-helpers';
import {
  X, Undo, Redo, Plus, Download, Share2, ChevronRight,
  AlignCenter, AlignVerticalJustifyCenter,
  Scissors, Pencil, Sun, Layers, Box,
  Sparkles, SlidersHorizontal, ImageIcon, Type, Loader2,
  FlipHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

const topTools = [
  { id: 'insert', label: 'Insert', icon: Plus },
  { id: 'brandit', label: 'Brand it', icon: ImageIcon },
  { id: 'addtext', label: 'Add text', icon: Type },
  { id: 'templates', label: 'Templates', icon: Layers },
  { id: 'backgrounds', label: 'Backgrounds', icon: Box },
  { id: 'aishadows', label: 'AI Shadows', icon: Sun },
  { id: 'resize', label: 'Resize', icon: SlidersHorizontal },
];

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(!enabled); }}
      className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${enabled ? 'bg-violet-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

function Slider({ label, value, min, max, onChange, unit = '' }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-violet-600"
      />
      <span className="text-xs text-gray-500 w-8 text-right">{value}{unit}</span>
    </div>
  );
}

export default function PhotoEditor({ mode, onClose, initialImageUrl }) {
  const fileInputRef = useRef(null);
  const [originalUrl, setOriginalUrl] = useState(initialImageUrl || null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [removeBg, setRemoveBg] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selected, setSelected] = useState(!!initialImageUrl);
  const [aiPrompt, setAiPrompt] = useState('');
  const [applyingAi, setApplyingAi] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null);

  // Adjust settings
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Transform
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [scale, setScale] = useState(100);

  // Shadow
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOpacity, setShadowOpacity] = useState(50);

  // Blur
  const [blurAmount, setBlurAmount] = useState(0);

  // Filter
  const [selectedFilter, setSelectedFilter] = useState('none');

  // Toggles
  const [toggles, setToggles] = useState({
    shadows: false, outline: false, reflection: false,
    blur: false, filter: false, texture: false
  });

  const imageFilter = [
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturation}%)`,
    toggles.blur ? `blur(${blurAmount}px)` : '',
    selectedFilter === 'grayscale' ? 'grayscale(1)' : '',
    selectedFilter === 'sepia' ? 'sepia(1)' : '',
    selectedFilter === 'invert' ? 'invert(0.2)' : '',
    selectedFilter === 'warm' ? 'sepia(0.3) saturate(1.4)' : '',
    selectedFilter === 'cool' ? 'hue-rotate(30deg) saturate(0.9)' : '',
  ].filter(Boolean).join(' ');

  const imageTransform = [
    `rotate(${rotation}deg)`,
    `scaleX(${flipH ? -1 : 1})`,
    `scale(${scale / 100})`,
  ].join(' ');

  const displayImage = processedUrl || originalUrl;

  useEffect(() => {
    if (!initialImageUrl) {
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  }, []);

  // Core background removal using @imgly/background-removal (runs locally in browser)
  const runBgRemoval = async (imageSource) => {
    setProcessing(true);
    setProcessingProgress(0);
    try {
      const blob = await removeBackground(imageSource, {
        progress: (key, current, total) => {
          if (total > 0) {
            setProcessingProgress(Math.round((current / total) * 100));
          }
        },
      });
      const resultUrl = URL.createObjectURL(blob);
      setProcessedUrl(resultUrl);
      setRemoveBg(true);
      toast.success('Background removed!');
    } catch (err) {
      console.error('Background removal error:', err);
      toast.error('Background removal failed');
    } finally {
      setProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setProcessedUrl(null);
    setRemoveBg(false);
    setSelected(true);

    if (mode === 'bgremove') {
      await runBgRemoval(url);
    }
  };

  const handleRemoveBgToggle = async (val) => {
    if (val && originalUrl) {
      await runBgRemoval(originalUrl);
    } else {
      setProcessedUrl(null);
      setRemoveBg(false);
    }
  };

  const handleAiApply = async () => {
    if (!aiPrompt.trim() || !displayImage) return;
    setApplyingAi(true);
    try {
      const result = await generateImage({
        prompt: aiPrompt + ' — product photo style, professional, high quality, clean',
        existing_image_urls: [displayImage],
      });
      setProcessedUrl(result.url);
      setAiPrompt('');
      toast.success('Applied!');
    } catch {
      toast.error('Failed to apply change');
    } finally {
      setApplyingAi(false);
    }
  };

  const handleDownload = () => {
    if (!displayImage) return;
    const a = document.createElement('a');
    a.href = displayImage;
    a.download = 'product-photo.png';
    a.target = '_blank';
    a.click();
  };

  const handleRetouchRelight = async (type) => {
    if (!displayImage) { toast.error('Upload an image first'); return; }
    setApplyingAi(true);
    const prompts = {
      retouch: 'Professionally retouch this product photo: enhance skin/surface, remove blemishes, improve clarity and sharpness, keep natural look',
      light: 'Add professional studio lighting to this product photo: bright even lighting, subtle shadows, commercial photography style',
    };
    try {
      const result = await generateImage({
        prompt: prompts[type],
        existing_image_urls: [displayImage],
      });
      setProcessedUrl(result.url);
      toast.success(type === 'retouch' ? 'Retouched!' : 'Lighting applied!');
    } catch {
      toast.error('Failed');
    } finally {
      setApplyingAi(false);
    }
  };

  const togglePanel = (id) => setExpandedPanel(p => p === id ? null : id);

  const filters = ['none', 'grayscale', 'sepia', 'warm', 'cool', 'invert'];

  return (
    <div className="h-screen bg-[#efefef] flex flex-col overflow-hidden text-gray-800" onClick={() => setSelected(false)}>
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 flex items-center px-4 py-2 gap-4 z-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => { setProcessedUrl(null); setRotation(0); setFlipH(false); setBrightness(100); setContrast(100); setSaturation(100); setRemoveBg(false); }}
            className="p-2 hover:bg-gray-100 rounded-lg" title="Reset"
          >
            <Undo className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg"><Redo className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="flex items-center gap-0.5 flex-1 justify-center">
          {topTools.map(({ id, label, icon: Icon }) => (
            <button key={id} className="flex flex-col items-center gap-0.5 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <Icon className="w-4 h-4 text-gray-600" />
              <span className="text-[10px] text-gray-600">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">D</div>
          <button onClick={handleDownload} disabled={!displayImage} className="flex items-center gap-2 border border-violet-500 text-violet-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-violet-50 transition-colors disabled:opacity-40">
            <Download className="w-4 h-4" /> Download
          </button>
          <button className="flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-violet-700 transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center relative p-8" onClick={() => setSelected(false)}>
          <div
            className="relative rounded-lg shadow-sm overflow-hidden"
            style={{
              width: 520, height: 440,
              background: removeBg
                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                : 'white',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
              backgroundColor: removeBg ? '#f0f0f0' : 'white',
            }}
            onClick={e => { if (!displayImage) { e.stopPropagation(); fileInputRef.current?.click(); } }}
          >
            {!displayImage && !processing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-violet-500" />
                </div>
                <p className="text-gray-600 font-medium">Click to upload a photo</p>
                <p className="text-gray-400 text-sm mt-1">PNG, JPG, WEBP supported</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {processing ? (
                  <div className="flex flex-col items-center gap-3 w-48">
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                    <p className="text-gray-500 text-sm font-medium">Removing background…</p>
                    {processingProgress > 0 && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${processingProgress}%` }}
                          />
                        </div>
                        <p className="text-gray-400 text-xs">{processingProgress}%</p>
                      </>
                    )}
                    {processingProgress === 0 && (
                      <p className="text-gray-400 text-xs">Loading model…</p>
                    )}
                  </div>
                ) : displayImage && (
                  <div
                    className={`relative cursor-move ${selected ? 'outline outline-2 outline-violet-500' : ''}`}
                    onClick={e => { e.stopPropagation(); setSelected(true); }}
                    style={{ maxWidth: '78%', maxHeight: '82%', position: 'relative' }}
                  >
                    {selected && (
                      <>
                        {[[-1,-1,'tl'],['50%',-1,'tc'],['100%',-1,'tr'],[-1,'50%','ml'],['100%','50%','mr'],[-1,'100%','bl'],['50%','100%','bc'],['100%','100%','br']].map(([l,t,k]) => (
                          <div key={k} className="absolute w-3 h-3 bg-white border-2 border-violet-500 rounded-sm z-10"
                            style={{ left: typeof l === 'number' ? `${l}px` : l, top: typeof t === 'number' ? `${t}px` : t, transform: 'translate(-50%,-50%)' }} />
                        ))}
                        <div className="absolute -top-10 left-0 flex items-center gap-1 bg-white rounded-lg shadow px-2 py-1 z-10">
                          <button onClick={e => { e.stopPropagation(); setOriginalUrl(null); setProcessedUrl(null); setSelected(false); setRemoveBg(false); }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">🗑</button>
                          <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 text-xs font-medium">Replace</button>
                          <button className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">···</button>
                        </div>
                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-violet-500 rounded-full z-10 flex items-center justify-center cursor-e-resize">
                          <div className="w-1 h-1 rounded-full bg-violet-500" />
                        </div>
                      </>
                    )}
                    {toggles.shadows && (
                      <div className="absolute inset-0 z-0 rounded"
                        style={{ boxShadow: `0 ${shadowBlur}px ${shadowBlur * 2}px rgba(0,0,0,${shadowOpacity / 100})`, pointerEvents: 'none' }} />
                    )}
                    <img
                      src={displayImage}
                      alt="product"
                      draggable={false}
                      className="block object-contain"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 340,
                        filter: imageFilter,
                        transform: imageTransform,
                        transformOrigin: 'center',
                        ...(toggles.outline ? { outline: '3px solid #7c3aed', outlineOffset: '4px' } : {}),
                        ...(toggles.reflection ? { WebkitBoxReflect: 'below 4px linear-gradient(transparent 60%, rgba(0,0,0,0.15))' } : {}),
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* AI prompt */}
          <div className="mt-5 flex items-center gap-2 bg-white rounded-full border border-gray-200 shadow-sm px-4 py-2.5 w-96" onClick={e => e.stopPropagation()}>
            <input
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Describe a change…"
              className="flex-1 text-sm text-gray-600 outline-none bg-transparent"
              onKeyDown={e => e.key === 'Enter' && handleAiApply()}
            />
            <button
              onClick={handleAiApply}
              disabled={applyingAi || !aiPrompt.trim() || !displayImage}
              className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center hover:bg-violet-700 transition-colors disabled:opacity-40"
            >
              {applyingAi ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <span className="text-white font-bold text-sm">↑</span>}
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {originalUrl && <img src={originalUrl} alt="" className="w-8 h-8 rounded object-cover" />}
                <span className="font-semibold text-sm text-gray-800">
                  {originalUrl ? 'Image' : 'No image'}
                </span>
              </div>
              <button onClick={handleDownload} disabled={!displayImage} className="text-sm text-violet-600 hover:text-violet-700 font-medium disabled:opacity-40">Save</button>
            </div>

            <div className="grid grid-cols-3 gap-1 mb-3">
              <button className="flex flex-col items-center gap-1 py-2 border border-gray-200 rounded-lg hover:border-violet-400 text-xs text-gray-600 transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <Undo className="w-4 h-4" /> Replace
              </button>
              <button
                className="flex flex-col items-center gap-1 py-2 border border-gray-200 rounded-lg hover:border-violet-400 text-xs text-gray-600 transition-colors disabled:opacity-40"
                disabled={!displayImage || applyingAi}
                onClick={() => handleRetouchRelight('retouch')}>
                <Sparkles className="w-4 h-4" />
                {applyingAi ? '...' : 'Retouch'}
              </button>
              <button
                className="flex flex-col items-center gap-1 py-2 border border-gray-200 rounded-lg hover:border-violet-400 text-xs text-gray-600 transition-colors disabled:opacity-40"
                disabled={!displayImage || applyingAi}
                onClick={() => handleRetouchRelight('light')}>
                <Sun className="w-4 h-4" /> Light On
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-2">Align to canvas</p>
            <div className="grid grid-cols-2 gap-1 mb-4">
              <button className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg hover:border-violet-400 text-xs text-gray-600 transition-colors">
                <AlignCenter className="w-3.5 h-3.5" /> Center
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg hover:border-violet-400 text-xs text-gray-600 transition-colors">
                <AlignVerticalJustifyCenter className="w-3.5 h-3.5" /> Middle
              </button>
            </div>

            {/* Remove background */}
            <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Scissors className="w-4 h-4 text-gray-400" />
                Remove background
              </div>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <Toggle enabled={removeBg} onChange={handleRemoveBgToggle} />
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>

            <div className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-violet-400 transition-colors cursor-pointer">
              <Pencil className="w-3.5 h-3.5" /> Edit Cutout
            </div>
          </div>

          {/* Expandable panels */}
          <div className="flex-1 px-2 py-2">

            {/* Shadows */}
            <div className="rounded-lg overflow-hidden mb-0.5">
              <div onClick={() => togglePanel('shadows')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700">Shadows</span>
                <div className="flex items-center gap-1.5">
                  <Toggle enabled={toggles.shadows} onChange={val => setToggles(p => ({ ...p, shadows: val }))} />
                  <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${expandedPanel === 'shadows' ? 'rotate-90' : ''}`} />
                </div>
              </div>
              {expandedPanel === 'shadows' && toggles.shadows && (
                <div className="px-3 pb-3 bg-gray-50">
                  <Slider label="Blur" value={shadowBlur} min={0} max={50} onChange={setShadowBlur} unit="px" />
                  <Slider label="Opacity" value={shadowOpacity} min={0} max={100} onChange={setShadowOpacity} unit="%" />
                </div>
              )}
            </div>

            {/* Outline */}
            <div className="rounded-lg overflow-hidden mb-0.5">
              <div onClick={() => togglePanel('outline')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700">Outline</span>
                <div className="flex items-center gap-1.5">
                  <Toggle enabled={toggles.outline} onChange={val => setToggles(p => ({ ...p, outline: val }))} />
                  <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${expandedPanel === 'outline' ? 'rotate-90' : ''}`} />
                </div>
              </div>
            </div>

            {/* Reflection */}
            <div className="rounded-lg overflow-hidden mb-0.5">
              <div onClick={() => togglePanel('reflection')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700">Reflection</span>
                <div className="flex items-center gap-1.5">
                  <Toggle enabled={toggles.reflection} onChange={val => setToggles(p => ({ ...p, reflection: val }))} />
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </div>

            {/* Adjust */}
            <div className="rounded-lg overflow-hidden mb-0.5">
              <button onClick={() => togglePanel('adjust')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">Adjust</span>
                <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${expandedPanel === 'adjust' ? 'rotate-90' : ''}`} />
              </button>
              {expandedPanel === 'adjust' && (
                <div className="px-3 pb-3 bg-gray-50">
                  <Slider label="Brightness" value={brightness} min={0} max={200} onChange={setBrightness} unit="%" />
                  <Slider label="Contrast" value={contrast} min={0} max={200} onChange={setContrast} unit="%" />
                  <Slider label="Saturation" value={saturation} min={0} max={200} onChange={setSaturation} unit="%" />
                  <button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}
                    className="mt-2 text-xs text-violet-600 hover:text-violet-700">Reset adjustments</button>
                </div>
              )}
            </div>

            {/* Blend */}
            <div className="rounded-lg overflow-hidden mb-0.5">
              <button className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">Blend</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Normal</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            </div>

            {/* Transform */}
            <div className="rounded-lg overflow-hidden mb-0.5">
              <button onClick={() => togglePanel('transform')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">Transform</span>
                <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${expandedPanel === 'transform' ? 'rotate-90' : ''}`} />
              </button>
              {expandedPanel === 'transform' && (
                <div className="px-3 pb-3 bg-gray-50">
                  <Slider label="Rotation" value={rotation} min={-180} max={180} onChange={setRotation} unit="°" />
                  <Slider label="Scale" value={scale} min={20} max={200} onChange={setScale} unit="%" />
                  <button onClick={() => setFlipH(f => !f)}
                    className="mt-2 flex items-center gap-2 text-xs text-violet-600 hover:text-violet-700">
                    <FlipHorizontal className="w-3.5 h-3.5" /> Flip horizontal
                  </button>
                  <button onClick={() => { setRotation(0); setScale(100); setFlipH(false); }}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-600">Reset transform</button>
                </div>
              )}
            </div>

            {/* Position */}
            <div className="rounded-lg overflow-hidden mb-0.5">
              <button className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">Position</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            </div>

            {/* Blur */}
            <div className="rounded-lg overflow-hidden mb-0.5">
              <div onClick={() => togglePanel('blur')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700">Blur</span>
                <div className="flex items-center gap-1.5">
                  <Toggle enabled={toggles.blur} onChange={val => setToggles(p => ({ ...p, blur: val }))} />
                  <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${expandedPanel === 'blur' ? 'rotate-90' : ''}`} />
                </div>
              </div>
              {expandedPanel === 'blur' && toggles.blur && (
                <div className="px-3 pb-3 bg-gray-50">
                  <Slider label="Amount" value={blurAmount} min={0} max={20} onChange={setBlurAmount} unit="px" />
                </div>
              )}
            </div>

            {/* Filter */}
            <div className="rounded-lg overflow-hidden mb-0.5">
              <div onClick={() => togglePanel('filter')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700">Filter</span>
                <div className="flex items-center gap-1.5">
                  <Toggle enabled={toggles.filter} onChange={val => { setToggles(p => ({ ...p, filter: val })); if (!val) setSelectedFilter('none'); }} />
                  <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${expandedPanel === 'filter' ? 'rotate-90' : ''}`} />
                </div>
              </div>
              {expandedPanel === 'filter' && toggles.filter && (
                <div className="px-3 pb-3 bg-gray-50">
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {filters.map(f => (
                      <button key={f} onClick={() => setSelectedFilter(f)}
                        className={`px-2.5 py-1 rounded-md text-xs capitalize border transition-all ${selectedFilter === f ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:border-violet-300'}`}>
                        {f === 'none' ? 'None' : f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Texture */}
            <div className="rounded-lg overflow-hidden mb-0.5">
              <div className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700">Texture</span>
                <div className="flex items-center gap-1.5">
                  <Toggle enabled={toggles.texture} onChange={val => setToggles(p => ({ ...p, texture: val }))} />
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </div>

          </div>

          {/* Bottom tools */}
          <div className="border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
            {[{ label: 'Front', icon: '⬆' }, { label: 'Back', icon: '⬇' }, { label: 'Duplicate', icon: '❐' }].map(t => (
              <button key={t.label} className="flex flex-col items-center gap-1 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-sm">{t.icon}</span>
                <span className="text-xs text-gray-500">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}