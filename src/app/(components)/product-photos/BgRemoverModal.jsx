import { useState, useRef, useEffect } from 'react';
import { generateImage, uploadFile } from '@/(lib)/ai-helpers';
import { X, Upload, Download, Loader2, Search, ChevronRight, Minus, Plus, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

// ── Background data ──────────────────────────────────────────────────────────
const STANDARD_COLORS = ['#ffffff', '#000000'];
const NEUTRAL_TONES = [
  '#faf9f6','#f0ede6','#e8e4db','#ddd9d0','#d0ccc4','#c4c0b8',
  '#f0f2f5','#e0e4ea','#d0d6df','#c0c9d5','#b0bcc9','#a0acbc',
];
const SOFT_PASTELS = [
  '#fef9f0','#f0f9f0','#f0f0f9','#f9f0f9','#f9f0f0','#f0f5f9',
  '#fdecd0','#d0f0e0','#d0e0f0','#e8d0f0','#f0d0d8','#d0ece0',
];
const AI_BACKGROUNDS = [
  { id: 'studio', name: 'Studio', img: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=300&q=60' },
  { id: 'street', name: 'Street', img: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300&q=60' },
  { id: 'nature', name: 'Nature', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=60' },
  { id: 'minimal', name: 'Minimal', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=60' },
  { id: 'forest', name: 'Forest', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=70' },
  { id: 'beach', name: 'Beach', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=60' },
];

const RESIZE_STANDARD = [
  { id: 'landscape', name: 'Landscape', dims: '2016 × 1512', ratio: '4:3', w: 4, h: 3 },
  { id: 'portrait', name: 'Portrait', dims: '1512 × 2016', ratio: '3:4', w: 3, h: 4 },
  { id: 'square', name: 'Square', dims: '1512 × 1512', ratio: '1:1', w: 1, h: 1 },
];
const RESIZE_SOCIAL = [
  { id: 'ig_story', name: 'Instagram Story', dims: '1080 × 1920', ratio: '9:16', icon: '📷' },
  { id: 'ig_post_sq', name: 'Instagram Post', dims: '1080 × 1080', ratio: '1:1', icon: '📷' },
  { id: 'ig_post_4_5', name: 'Instagram Post', dims: '1080 × 1350', ratio: '4:5', icon: '📷' },
  { id: 'ig_reel', name: 'Instagram Reel', dims: '1080 × 1920', ratio: '9:16', icon: '📷' },
  { id: 'tiktok', name: 'TikTok Post', dims: '1080 × 1920', ratio: '9:16', icon: '♪' },
  { id: 'tiktok_thumb', name: 'TikTok Thumbnail', dims: '1080 × 1340', ratio: '3:4', icon: '♪' },
  { id: 'yt_cover', name: 'Youtube Cover', dims: '1280 × 720', ratio: '16:9', icon: '▶' },
];

const SHADOW_PRESETS = [
  { id: 'none', name: 'None', style: {} },
  { id: 'soft', name: 'Soft', style: { filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))' } },
  { id: 'hard', name: 'Hard', style: { filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.5))' } },
  { id: 'floating', name: 'Floating', style: { filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.35))' } },
];

const AI_TOOLS = [
  { id: 'recolor', name: 'Recolor', img: 'https://images.unsplash.com/photo-1617952139391-3b48c6c0c4c9?w=200&q=60' },
  { id: 'beautifier', name: 'Product Beautifier', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=60' },
  { id: 'virtual_model', name: 'Virtual Model', img: 'https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=200&q=60' },
  { id: 'staging', name: 'Product Staging', img: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=200&q=60' },
  { id: 'edit_ai', name: 'Edit with AI', img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200&q=60' },
  { id: 'flat_lay', name: 'Flat lay', img: 'https://images.unsplash.com/photo-1517231925375-bf2cb42917a5?w=200&q=60' },
  { id: 'mannequin', name: 'Ghost Mannequin', img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200&q=60' },
  { id: 'ironing', name: 'Ironing', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60' },
];

// ── Tiny helpers ─────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }) {
  return (
    <button onClick={() => onChange(!enabled)}
      className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 ${enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-1'}`} />
    </button>
  );
}

function ColorSwatch({ color, selected, onClick }) {
  const isWhite = color === '#ffffff';
  return (
    <button onClick={onClick}
      className={`w-8 h-8 rounded-full border-2 transition-all ${selected ? 'border-blue-500 scale-110' : isWhite ? 'border-gray-300 hover:border-gray-400' : 'border-transparent hover:border-gray-300'}`}
      style={{ backgroundColor: color }} />
  );
}

function SidebarIcon({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 px-1 w-full transition-colors ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
      <div className={`w-7 h-7 flex items-center justify-center rounded-lg ${active ? 'bg-blue-100' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
    </button>
  );
}

export default function BgRemoverModal({ onClose, initialFile }) {
  const fileInputRef = useRef(null);
  const [originalFile, setOriginalFile] = useState(initialFile || null);
  const [originalUrl, setOriginalUrl] = useState(initialFile ? URL.createObjectURL(initialFile) : null);
  const [removedUrl, setRemovedUrl] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [activePanel, setActivePanel] = useState('background');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [removeOrigBg, setRemoveOrigBg] = useState(true);
  const [bgTab, setBgTab] = useState('color'); // 'color' | 'image' | 'ai'
  const [selectedAiBg, setSelectedAiBg] = useState(null);
  const [applyingAiBg, setApplyingAiBg] = useState(false);
  const [aiResultUrl, setAiResultUrl] = useState(null);
  const [selectedResize, setSelectedResize] = useState(null);
  const [selectedShadow, setSelectedShadow] = useState('none');
  const [showBefore, setShowBefore] = useState(false);
  const [zoom, setZoom] = useState(100);
  // Position
  const [posTab, setPosTab] = useState('center');
  const [padding, setPadding] = useState({ top: 10, bottom: 17, left: 10, right: 23 });
  const [align, setAlign] = useState('bottom-center');
  const [scale, setScale] = useState('fit');
  // Custom color
  const [customColor, setCustomColor] = useState('#e0e7ff');

  useEffect(() => {
    if (initialFile) doRemoveBg(initialFile);
  }, []);

  const doRemoveBg = async (file) => {
    setRemoving(true);
    setRemovedUrl(null);
    setAiResultUrl(null);
    try {
      const { file_url } = await uploadFile({ file });
      const result = await generateImage({
        prompt: 'Remove the background completely. Keep only the subject/product with a perfectly clean cutout. Transparent background, no background elements, professional e-commerce product photo style. Keep the product exactly as it is.',
        existing_image_urls: [file_url],
      });
      setRemovedUrl(result.url);
      toast.success('Background removed!');
    } catch {
      toast.error('Background removal failed');
    } finally {
      setRemoving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOriginalFile(file);
    setOriginalUrl(URL.createObjectURL(file));
    setRemovedUrl(null);
    setAiResultUrl(null);
    await doRemoveBg(file);
  };

  const applyAiBackground = async (bgItem) => {
    if (!removedUrl) { toast.error('Remove background first'); return; }
    setApplyingAiBg(true);
    setSelectedAiBg(bgItem.id);
    try {
      const result = await generateImage({
        prompt: `Place this product/subject on a ${bgItem.name} background — ${bgItem.name} scene, professional product photography composite. Keep the product exactly as-is.`,
        existing_image_urls: [removedUrl],
      });
      setAiResultUrl(result.url);
      toast.success('Background applied!');
    } catch {
      toast.error('Failed to apply background');
    } finally {
      setApplyingAiBg(false);
    }
  };

  const handleDownload = () => {
    const url = displayUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = 'product-no-bg.png'; a.target = '_blank'; a.click();
  };

  const shadowStyle = SHADOW_PRESETS.find(s => s.id === selectedShadow)?.style || {};
  const displayUrl = showBefore ? originalUrl : (aiResultUrl || removedUrl || originalUrl);

  const checkerBg = {
    backgroundImage: 'linear-gradient(45deg,#d0d0d0 25%,transparent 25%),linear-gradient(-45deg,#d0d0d0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d0d0d0 75%),linear-gradient(-45deg,transparent 75%,#d0d0d0 75%)',
    backgroundSize: '16px 16px', backgroundPosition: '0 0,0 8px,8px -8px,-8px 0', backgroundColor: '#f5f5f5',
  };

  // Canvas background style
  let canvasBgStyle = {};
  if (bgTab === 'color' && !showBefore) {
    canvasBgStyle = { backgroundColor: selectedColor };
  } else if (bgTab === 'image' && selectedAiBg && !showBefore) {
    const bg = AI_BACKGROUNDS.find(b => b.id === selectedAiBg);
    if (bg) canvasBgStyle = {};
  } else if (selectedColor === 'transparent' || (!aiResultUrl && removedUrl && !showBefore)) {
    canvasBgStyle = bgTab === 'color' ? { backgroundColor: selectedColor } : checkerBg;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl flex overflow-hidden" style={{ width: '1060px', height: '640px' }} onClick={e => e.stopPropagation()}>

        {/* ── Icon sidebar ── */}
        <div className="w-[60px] border-r border-gray-100 flex flex-col items-center py-2 bg-white flex-shrink-0">
          <SidebarIcon active={activePanel === 'templates'} onClick={() => setActivePanel('templates')}
            icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/></svg>}
            label="Templates" />
          <SidebarIcon active={activePanel === 'resize'} onClick={() => setActivePanel('resize')}
            icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="3" y="3" width="14" height="14" rx="1"/><path d="M7 3v14M3 7h14"/></svg>}
            label="Resize" />
          <SidebarIcon active={activePanel === 'position'} onClick={() => setActivePanel('position')}
            icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M10 2v16M2 10h16"/><circle cx="10" cy="10" r="3"/></svg>}
            label="Position" />
          <SidebarIcon active={activePanel === 'background'} onClick={() => setActivePanel('background')}
            icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><circle cx="10" cy="10" r="8"/></svg>}
            label="Background" />
          <SidebarIcon active={activePanel === 'shadows'} onClick={() => setActivePanel('shadows')}
            icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-70"><rect x="3" y="3" width="10" height="10" rx="1" opacity="0.5"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>}
            label="AI Shadows" />
          <SidebarIcon active={activePanel === 'aitools'} onClick={() => setActivePanel('aitools')}
            icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M10 2l1.5 5h5l-4 3 1.5 5-4-3-4 3 1.5-5-4-3h5z"/></svg>}
            label="AI tools" />
          <div className="flex-1" />
          <SidebarIcon active={activePanel === 'upload'} onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="w-5 h-5" />}
            label="Upload" />
          <SidebarIcon active={false} onClick={() => {}}
            icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 3"/></svg>}
            label="Usage" />
        </div>

        {/* ── Panel ── */}
        <div className="w-56 border-r border-gray-100 flex flex-col bg-white flex-shrink-0 overflow-y-auto">
          
          {/* TEMPLATES */}
          {activePanel === 'templates' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-800">Templates</span>
                <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex gap-2 mb-2">
                  <button className="flex-1 py-1.5 text-xs font-medium rounded-full bg-gray-900 text-white">From Photoroom</button>
                  <button className="flex-1 py-1.5 text-xs font-medium rounded-full border border-gray-200 text-gray-600">Your Templates</button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input placeholder="Search templates" className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50" />
                </div>
              </div>
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Essentials</span>
                  <button className="text-xs text-gray-400 hover:text-gray-600">See all</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-gray-200 hover:border-violet-400 cursor-pointer transition-colors flex items-center justify-center">
                      <div className="w-12 h-14 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Studio</span>
                  <button className="text-xs text-gray-400 hover:text-gray-600">See all</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {AI_BACKGROUNDS.slice(0,4).map((bg, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-violet-400 cursor-pointer transition-colors relative group">
                      <img src={bg.img} alt={bg.name} className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 w-5 h-5 bg-white/80 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-600 text-xs">✦</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RESIZE */}
          {activePanel === 'resize' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-800">Resize</span>
                <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input placeholder="Marketplaces, social media" className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Standard</p>
                {RESIZE_STANDARD.map(s => (
                  <button key={s.id} onClick={() => setSelectedResize(s.id)}
                    className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-colors ${selectedResize === s.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                    <div className="w-7 h-7 border-2 border-gray-300 rounded flex items-center justify-center flex-shrink-0 bg-white">
                      <div className={`border border-gray-400 rounded-sm ${s.w > s.h ? 'w-5 h-3.5' : s.h > s.w ? 'w-3.5 h-5' : 'w-4 h-4'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-800">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.dims}, {s.ratio}</p>
                    </div>
                  </button>
                ))}
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Advanced</p>
                {['Custom size', 'Original image'].map(name => (
                  <button key={name} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 hover:bg-gray-50">
                    <div className="w-7 h-7 border-2 border-gray-300 rounded flex items-center justify-center bg-white">
                      <div className="w-4 h-4 border-dashed border border-gray-400 rounded-sm" />
                    </div>
                    <span className="text-xs font-medium text-gray-800">{name}</span>
                  </button>
                ))}
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Social Media sizes</p>
                {RESIZE_SOCIAL.map(s => (
                  <button key={s.id} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 hover:bg-gray-50">
                    <div className="w-7 h-7 rounded flex items-center justify-center bg-gray-100 flex-shrink-0 text-sm">{s.icon}</div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-800">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.dims}, {s.ratio}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* POSITION */}
          {activePanel === 'position' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-800">Position</span>
                <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="px-3 py-3 border-b border-gray-100">
                <div className="flex gap-1 mb-4">
                  {['Original', 'Center', 'Custom'].map(t => (
                    <button key={t} onClick={() => setPosTab(t.toLowerCase())}
                      className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${posTab === t.toLowerCase() ? 'border-gray-400 bg-white text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Padding</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[['←', 'left'], ['→', 'right'], ['↑', 'top'], ['↓', 'bottom']].map(([arrow, key]) => (
                    <div key={key} className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2 py-1.5">
                      <span className="text-gray-400 text-sm">{arrow}</span>
                      <input type="number" value={padding[key]} onChange={e => setPadding(p => ({ ...p, [key]: Number(e.target.value) }))}
                        className="w-full text-xs text-gray-700 outline-none bg-transparent" />
                      <span className="text-[10px] text-gray-400">%</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">Align</p>
                    <select value={align} onChange={e => setAlign(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                      {['Bottom center','Center','Top center','Bottom left','Bottom right'].map(a => (
                        <option key={a} value={a.toLowerCase().replace(' ','-')}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">Scale</p>
                    <select value={scale} onChange={e => setScale(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                      {['Fit','Fill','Stretch'].map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" className="rounded" /> Ignore padding on cropped sides
                </label>
              </div>
              {/* Preview */}
              <div className="px-3 py-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Preview</p>
                <div className="rounded-xl overflow-hidden border border-gray-200 aspect-square bg-teal-100 flex items-center justify-center relative">
                  {displayUrl && <img src={displayUrl} alt="preview" className="max-w-[70%] max-h-[70%] object-contain" />}
                </div>
                <button className="mt-3 w-full py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 flex items-center justify-center gap-1.5 hover:bg-gray-50">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-blue-500"><path d="M8 1l.5 1.5h5l-4 3L11 11 8 9l-3 2 1.5-5.5-4-3h5z"/></svg>
                  Apply to 1 image
                </button>
                <p className="text-[9px] text-gray-400 text-center mt-1">Any AI edits will re-generate and will use AI image generation credits.</p>
              </div>
            </div>
          )}

          {/* BACKGROUND */}
          {activePanel === 'background' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-800">Background</span>
                <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              {/* Remove toggle */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span className="text-xs text-gray-700">Remove original backgrounds</span>
                <Toggle enabled={removeOrigBg} onChange={v => { setRemoveOrigBg(v); if (v && originalFile) doRemoveBg(originalFile); }} />
              </div>
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {[['color', 'Color', <svg key="c" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><circle cx="8" cy="8" r="7"/></svg>],
                  ['image', 'Image', <svg key="i" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M2 10l4-4 3 3 2-2 3 3"/></svg>],
                  ['ai', 'AI', <svg key="a" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-blue-500"><path d="M8 1l.5 1.5h5l-4 3L11 11 8 9l-3 2 1.5-5.5-4-3h5z"/></svg>]
                ].map(([id, name, icon]) => (
                  <button key={id} onClick={() => setBgTab(id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors border-b-2 ${bgTab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {icon}{name}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                {bgTab === 'color' && (
                  <>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Standard</p>
                    <div className="flex items-center gap-2 mb-3">
                      {STANDARD_COLORS.map(c => (
                        <ColorSwatch key={c} color={c} selected={selectedColor === c} onClick={() => setSelectedColor(c)} />
                      ))}
                      {/* Color wheel */}
                      <label className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 overflow-hidden flex items-center justify-center"
                        style={{ background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }}>
                        <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); setSelectedColor(e.target.value); }} className="opacity-0 w-0 h-0" />
                      </label>
                      {/* Eyedropper */}
                      <button className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M2 14l3-3 7-7-3-3-7 7-1 4 1-1z"/><circle cx="12" cy="4" r="2"/></svg>
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Neutral tones</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {NEUTRAL_TONES.map(c => <ColorSwatch key={c} color={c} selected={selectedColor === c} onClick={() => setSelectedColor(c)} />)}
                    </div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Soft pastels</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SOFT_PASTELS.map(c => <ColorSwatch key={c} color={c} selected={selectedColor === c} onClick={() => setSelectedColor(c)} />)}
                    </div>
                  </>
                )}
                {bgTab === 'image' && (
                  <div className="grid grid-cols-2 gap-2">
                    {AI_BACKGROUNDS.map(bg => (
                      <button key={bg.id} onClick={() => applyAiBackground(bg)}
                        className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${selectedAiBg === bg.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}>
                        <img src={bg.img} alt={bg.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-end p-1.5">
                          <span className="text-white text-[9px] font-semibold">{bg.name}</span>
                        </div>
                        {applyingAiBg && selectedAiBg === bg.id && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {bgTab === 'ai' && (
                  <div>
                    <p className="text-xs text-gray-500 mb-3">Generate a background with AI</p>
                    <textarea placeholder="Describe your background (e.g. soft studio gradient, outdoor garden…)"
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 outline-none resize-none focus:border-blue-400 bg-gray-50" rows={3} />
                    <button onClick={() => toast.info('Type a description and generate!')}
                      className="mt-2 w-full py-2 rounded-xl text-xs font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                      Generate AI Background
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI SHADOWS */}
          {activePanel === 'shadows' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-800">AI Shadows</span>
                <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="px-3 py-3">
                <div className="grid grid-cols-2 gap-2">
                  {SHADOW_PRESETS.map(s => (
                    <button key={s.id} onClick={() => setSelectedShadow(s.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedShadow === s.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center relative">
                        {s.id !== 'none' && (
                          <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg" style={s.style} />
                        )}
                        {s.id === 'none' && <div className="w-8 h-8 bg-white border-2 border-violet-300 rounded-lg" />}
                        {s.id !== 'none' && <div className="absolute top-1 right-1 w-4 h-4 bg-violet-100 rounded flex items-center justify-center"><svg viewBox="0 0 8 8" fill="currentColor" className="w-2.5 h-2.5 text-violet-500"><path d="M4 1l.5 1.5h2L5 3.5l.5 2L4 5 2.5 5.5 3 3.5 1.5 2.5h2z"/></svg></div>}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI TOOLS */}
          {activePanel === 'aitools' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-800">AI Tools</span>
                <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {AI_TOOLS.map(tool => (
                  <button key={tool.id}
                    onClick={() => toast.info(`${tool.name} coming soon!`)}
                    className="w-full flex items-center gap-3 px-3 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={tool.img} alt={tool.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-medium text-gray-800 text-left">{tool.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Canvas area ── */}
        <div className="flex-1 flex flex-col bg-[#e8e8e8] relative overflow-hidden">
          {/* Close */}
          <button onClick={onClose} className="absolute top-3 right-3 z-20 w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 shadow-sm">
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {/* Breadcrumb */}
          <div className="absolute top-3.5 left-4 z-20 text-xs text-gray-500">
            {removing ? 'Processing…' : removedUrl ? `Everything ${1}` : 'Upload an image'}
          </div>

          {/* Main canvas */}
          <div className="flex-1 flex items-center justify-center p-8">
            {removing ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-semibold">Removing background…</p>
                  <p className="text-gray-400 text-xs mt-1">This takes about 15 seconds</p>
                </div>
              </div>
            ) : displayUrl ? (
              <div className="relative">
                {/* Canvas card */}
                <div className="rounded-2xl overflow-hidden shadow-2xl relative"
                  style={{
                    width: 420, height: 460,
                    ...(bgTab === 'color' && !showBefore ? { backgroundColor: selectedColor } : checkerBg),
                  }}>
                  {/* AI bg image behind */}
                  {bgTab === 'image' && selectedAiBg && aiResultUrl && !showBefore && (
                    <img src={aiResultUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  {/* Product image */}
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    {applyingAiBg ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow" />
                        <p className="text-white text-sm font-medium drop-shadow">Applying background…</p>
                      </div>
                    ) : (
                      <img src={aiResultUrl && !showBefore ? aiResultUrl : (removedUrl && !showBefore ? removedUrl : originalUrl)}
                        alt="product"
                        className="max-w-full max-h-full object-contain"
                        style={{ ...shadowStyle }}
                      />
                    )}
                  </div>
                </div>

                {/* Before/After */}
                {originalUrl && removedUrl && (
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex bg-white rounded-full shadow border border-gray-200 overflow-hidden text-xs font-medium">
                    <button onClick={() => setShowBefore(false)} className={`px-4 py-1.5 transition-colors ${!showBefore ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>After</button>
                    <button onClick={() => setShowBefore(true)} className={`px-4 py-1.5 transition-colors ${showBefore ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Before</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-2xl bg-white shadow flex items-center justify-center">
                  <Upload className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Upload an image to get started</p>
                <p className="text-gray-400 text-xs">PNG, JPG or WEBP</p>
              </div>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-sm border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button onClick={handleDownload} disabled={!displayUrl || removing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors disabled:opacity-40">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              {removedUrl && !removing && (
                <button onClick={() => originalFile && doRemoveBg(originalFile)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                  Re-process
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 bg-white rounded-full border border-gray-200 shadow-sm px-2 py-1">
              <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><Minus className="w-3 h-3" /></button>
              <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><Plus className="w-3 h-3" /></button>
              <HelpCircle className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}