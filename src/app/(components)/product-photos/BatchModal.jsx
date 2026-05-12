import { useState, useRef, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { generateImage } from '@/(lib)/ai-helpers';
import { X, Upload, Download, Loader2, Search, Minus, Plus, HelpCircle, ChevronLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// ── Color data ────────────────────────────────────────────────────────────────
const STANDARD_COLORS = ['#ffffff', '#000000', '#f5f5f5', '#1a1a2e'];
const NEUTRAL_TONES = [
  '#faf9f6','#f0ede6','#e8e4db','#ddd9d0','#d0ccc4','#c4c0b8',
  '#f0f2f5','#e0e4ea','#d0d6df','#c0c9d5','#b0bcc9','#a0acbc',
];
const SOFT_PASTELS = [
  '#fef9f0','#f0f9f0','#f0f0f9','#f9f0f9','#f9f0f0','#f0f5f9',
  '#fdecd0','#d0f0e0','#d0e0f0','#e8d0f0','#f0d0d8','#d0ece0',
];

const IMAGE_BACKGROUNDS = [
  { id: 'studio_white', name: 'White Studio', category: 'Studio', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80' },
  { id: 'studio_grey', name: 'Grey Studio', category: 'Studio', url: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=600&q=80' },
  { id: 'studio_black', name: 'Dark Studio', category: 'Studio', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&q=80' },
  { id: 'marble_white', name: 'White Marble', category: 'Marble', url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80' },
  { id: 'marble_dark', name: 'Dark Marble', category: 'Marble', url: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=600&q=80' },
  { id: 'wood_light', name: 'Light Wood', category: 'Wood', url: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=600&q=80' },
  { id: 'wood_dark', name: 'Dark Wood', category: 'Wood', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  { id: 'concrete', name: 'Concrete', category: 'Concrete', url: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=600&q=80' },
  { id: 'nature_green', name: 'Green Nature', category: 'Other', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80' },
  { id: 'beach', name: 'Beach', category: 'Other', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' },
  { id: 'bokeh_pink', name: 'Pink Bokeh', category: 'Other', url: 'https://images.unsplash.com/photo-1557682268-e3955ed5d732?w=600&q=80' },
  { id: 'plant_white', name: 'Plant & White', category: 'Other', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80' },
  { id: 'dark_plant', name: 'Dark Plant', category: 'Other', url: 'https://images.unsplash.com/photo-1550159930-40066082a4fc?w=600&q=80' },
];

const TEMPLATES = [
  { id: 'clean_white',    name: 'Clean White',     category: 'Essentials',   bg: '#ffffff',  padding: { top:10,bottom:10,left:10,right:10 },  align:'center',        scale:'fit',  preview:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=70' },
  { id: 'clean_grey',     name: 'Soft Grey',       category: 'Essentials',   bg: '#f0ede6',  padding: { top:12,bottom:12,left:12,right:12 },  align:'center',        scale:'fit',  preview:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=70' },
  { id: 'clean_black',    name: 'Deep Black',      category: 'Essentials',   bg: '#111111',  padding: { top:10,bottom:10,left:10,right:10 },  align:'center',        scale:'fit',  preview:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=70' },
  { id: 'bottom_heavy',   name: 'Bottom Heavy',    category: 'Essentials',   bg: '#faf9f6',  padding: { top:5, bottom:20,left:10,right:10 },  align:'bottom-center', scale:'fit',  preview:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=70' },
  { id: 'studio_warm',    name: 'Warm Studio',     category: 'Studio',       bg: '#f5e6d3',  padding: { top:8, bottom:18,left:8, right:8  },  align:'bottom-center', scale:'fit',  preview:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=70' },
  { id: 'studio_cool',    name: 'Cool Studio',     category: 'Studio',       bg: '#d8e4f0',  padding: { top:8, bottom:18,left:8, right:8  },  align:'bottom-center', scale:'fit',  preview:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=70' },
  { id: 'studio_minimal', name: 'Minimal Studio',  category: 'Studio',       bg: '#f8f8f8',  padding: { top:15,bottom:15,left:15,right:15 },  align:'center',        scale:'fit',  preview:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=70' },
  { id: 'studio_shadow',  name: 'Studio Shadow',   category: 'Studio',       bg: '#e8e8e8',  padding: { top:5, bottom:20,left:10,right:10 },  align:'bottom-center', scale:'fit',  shadow:'floating', preview:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=70' },
  { id: 'shopify_white',  name: 'Shopify White',   category: 'Shopify',      bg: '#ffffff',  padding: { top:8, bottom:8, left:8, right:8  },  align:'center',        scale:'fit',  preview:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=70' },
  { id: 'shopify_off',    name: 'Off White',       category: 'Shopify',      bg: '#faf9f5',  padding: { top:10,bottom:10,left:10,right:10 },  align:'center',        scale:'fit',  preview:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=70' },
  { id: 'shopify_life',   name: 'Lifestyle',       category: 'Shopify',      bg: '#ede8df',  padding: { top:12,bottom:12,left:12,right:12 },  align:'center',        scale:'fit',  preview:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=70' },
  { id: 'shopify_bold',   name: 'Bold Display',    category: 'Shopify',      bg: '#1a1a1a',  padding: { top:8, bottom:8, left:8, right:8  },  align:'center',        scale:'fill', preview:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=70' },
  { id: 'classic_white',  name: 'White',           category: 'Classics',     bg: '#ffffff',  padding: { top:10,bottom:10,left:10,right:10 },  align:'center',        scale:'fit',  preview:'https://images.unsplash.com/photo-1559629819-638a8f0a4303?w=200&q=70' },
  { id: 'classic_black',  name: 'Black',           category: 'Classics',     bg: '#000000',  padding: { top:10,bottom:10,left:10,right:10 },  align:'center',        scale:'fit',  preview:'https://images.unsplash.com/photo-1559629819-638a8f0a4303?w=200&q=70' },
  { id: 'classic_trans',  name: 'Transparent',     category: 'Classics',     bg: 'transparent', padding: { top:10,bottom:10,left:10,right:10 }, align:'center',       scale:'fit',  preview:'https://images.unsplash.com/photo-1559629819-638a8f0a4303?w=200&q=70' },
  { id: 'profile_vib',    name: 'Vibrant',         category: 'Profile Pics', bg: 'linear-gradient(135deg,#f093fb,#f5a623)', padding: { top:5,bottom:5,left:5,right:5 }, align:'center', scale:'fill', preview:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=70' },
  { id: 'profile_ocean',  name: 'Ocean',           category: 'Profile Pics', bg: 'linear-gradient(135deg,#0099f7,#f11712)', padding: { top:5,bottom:5,left:5,right:5 }, align:'center', scale:'fill', preview:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=70' },
  { id: 'profile_min',    name: 'Minimal',         category: 'Profile Pics', bg: '#f0ede6',  padding: { top:5, bottom:5, left:5, right:5  },  align:'center',        scale:'fill', preview:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=70' },
  { id: 'marble_light',   name: 'Light Marble',    category: 'Marble & Wood',bgImage:'marble_white', bg:'#f5f5f5', padding:{top:10,bottom:20,left:10,right:10}, align:'bottom-center', scale:'fit', preview:'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&q=70' },
  { id: 'wood_natural',   name: 'Natural Wood',    category: 'Marble & Wood',bgImage:'wood_light',   bg:'#c8a874', padding:{top:10,bottom:20,left:10,right:10}, align:'bottom-center', scale:'fit', preview:'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=200&q=70' },
  { id: 'minimal_cream',  name: 'Cream',           category: 'Minimal Shop', bg: '#f7f3ec',  padding: { top:12,bottom:18,left:12,right:12 },  align:'bottom-center', scale:'fit',  preview:'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=70' },
  { id: 'minimal_rose',   name: 'Rose',            category: 'Minimal Shop', bg: '#f9ede8',  padding: { top:12,bottom:18,left:12,right:12 },  align:'bottom-center', scale:'fit',  preview:'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=70' },
  { id: 'minimal_sage',   name: 'Sage',            category: 'Minimal Shop', bg: '#e8ede8',  padding: { top:12,bottom:18,left:12,right:12 },  align:'bottom-center', scale:'fit',  preview:'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=70' },
  { id: 'minimal_slate',  name: 'Slate',           category: 'Minimal Shop', bg: '#e0e4ea',  padding: { top:12,bottom:18,left:12,right:12 },  align:'bottom-center', scale:'fit',  preview:'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=70' },
];

const TEMPLATE_CATEGORIES = ['Essentials', 'Studio', 'Shopify', 'Classics', 'Profile Pics', 'Marble & Wood', 'Minimal Shop'];

const RESIZE_STANDARD = [
  { id: 'landscape', name: 'Landscape', dims: '2016 × 1512', w: 4, h: 3 },
  { id: 'portrait',  name: 'Portrait',  dims: '1512 × 2016', w: 3, h: 4 },
  { id: 'square',    name: 'Square',    dims: '1512 × 1512', w: 1, h: 1 },
];
const RESIZE_SOCIAL = [
  { id: 'ig_story',     name: 'Instagram Story',    dims: '1080 × 1920', icon: '📷', w: 9,  h: 16 },
  { id: 'ig_post',      name: 'Instagram Post',      dims: '1080 × 1080', icon: '📷', w: 1,  h: 1  },
  { id: 'ig_post_45',   name: 'Instagram (4:5)',     dims: '1080 × 1350', icon: '📷', w: 4,  h: 5  },
  { id: 'ig_reel',      name: 'Instagram Reel',      dims: '1080 × 1920', icon: '📷', w: 9,  h: 16 },
  { id: 'tiktok',       name: 'TikTok Post',         dims: '1080 × 1920', icon: '♪',  w: 9,  h: 16 },
  { id: 'tiktok_thumb', name: 'TikTok Thumbnail',    dims: '1080 × 1340', icon: '♪',  w: 3,  h: 4  },
  { id: 'yt_cover',     name: 'YouTube Cover',       dims: '1280 × 720',  icon: '▶',  w: 16, h: 9  },
  { id: 'fb_post',      name: 'Facebook Post',       dims: '1200 × 630',  icon: 'f',  w: 16, h: 9  },
  { id: 'twitter',      name: 'Twitter Header',      dims: '1500 × 500',  icon: '𝕏',  w: 3,  h: 1  },
  { id: 'linkedin',     name: 'LinkedIn Post',       dims: '1200 × 627',  icon: 'in', w: 2,  h: 1  },
  { id: 'pinterest',    name: 'Pinterest Pin',       dims: '1000 × 1500', icon: '📌', w: 2,  h: 3  },
  { id: 'amazon',       name: 'Amazon Product',      dims: '2000 × 2000', icon: '🛒', w: 1,  h: 1  },
];

const SHADOW_PRESETS = [
  { id: 'none',     name: 'None',     style: {} },
  { id: 'soft',     name: 'Soft',     style: { filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))' } },
  { id: 'hard',     name: 'Hard',     style: { filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.5))' } },
  { id: 'floating', name: 'Floating', style: { filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.35))' } },
  { id: 'glow',     name: 'Glow',     style: { filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.5))' } },
  { id: 'subtle',   name: 'Subtle',   style: { filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' } },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 cursor-pointer ${enabled ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-1'}`} />
    </button>
  );
}

function ColorSwatch({ color, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer hover:scale-110 ${
        selected ? 'border-blue-500 scale-110' : color === '#ffffff' ? 'border-gray-300 hover:border-gray-400' : 'border-transparent hover:border-gray-300'
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

function SidebarIcon({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 px-1 w-full transition-colors cursor-pointer ${
        active ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <div className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${active ? 'bg-blue-100' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BatchModal({ onClose, initialFile }) {
  const fileInputRef    = useRef(null);
  const bgFileInputRef  = useRef(null);

  const [originalFile, setOriginalFile]   = useState(initialFile || null);
  const [originalUrl, setOriginalUrl]     = useState(initialFile ? URL.createObjectURL(initialFile) : null);
  const [removedUrl, setRemovedUrl]       = useState(null);
  const [removing, setRemoving]           = useState(false);
  const [removingProgress, setRemovingProgress] = useState(0);
  const [aiResultUrl, setAiResultUrl]     = useState(null);
  const [applyingAiBg, setApplyingAiBg]   = useState(false);

  const [activePanel, setActivePanel]     = useState('templates');
  const [showBefore, setShowBefore]       = useState(false);
  const [zoom, setZoom]                   = useState(100);

  // Templates
  const [activeTemplate, setActiveTemplate]       = useState(null);
  const [showAllTemplates, setShowAllTemplates]   = useState(false);

  // Background
  const [bgTab, setBgTab]                 = useState('color');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [customColor, setCustomColor]     = useState('#ffffff');
  const [selectedBgImage, setSelectedBgImage] = useState(null);
  const [bgImageUrl, setBgImageUrl]       = useState(null);
  const [removeOrigBg, setRemoveOrigBg]   = useState(true);
  const [aiPrompt, setAiPrompt]           = useState('');

  // Position
  const [posTab, setPosTab]               = useState('center');
  const [padding, setPadding]             = useState({ top: 10, bottom: 10, left: 10, right: 10 });
  const [align, setAlign]                 = useState('center');
  const [scale, setScale]                 = useState('fit');

  // Resize
  const [selectedResize, setSelectedResize] = useState(null);
  const [canvasRatio, setCanvasRatio]       = useState({ w: 1, h: 1 });

  // Shadows
  const [selectedShadow, setSelectedShadow] = useState('none');

  useEffect(() => {
    if (initialFile) doRemoveBg(initialFile);
  }, []);

  // ── Uses @imgly/background-removal (same as ProductStagingModal) ─────────────
  const doRemoveBg = async (file) => {
    setRemoving(true);
    setRemovedUrl(null);
    setAiResultUrl(null);
    setRemovingProgress(0);
    try {
      const objectUrl = URL.createObjectURL(file);
      const blob = await removeBackground(objectUrl, {
        progress: (key, current, total) => {
          if (total > 0) setRemovingProgress(Math.round((current / total) * 100));
        },
      });
      setRemovedUrl(URL.createObjectURL(blob));
      toast.success('Background removed!');
    } catch (err) {
      console.error(err);
      toast.error('Background removal failed');
    } finally {
      setRemoving(false);
      setRemovingProgress(0);
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

  const handleBgFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBgImageUrl(url);
    setSelectedBgImage('custom_upload');
    setBgTab('image');
  };

  const applySceneBackground = async (bgItem) => {
    if (!removedUrl) { toast.error('Remove background first'); return; }
    setApplyingAiBg(true);
    setSelectedBgImage(bgItem.id);
    setBgTab('image');
    try {
      const result = await generateImage({
        prompt: `Composite product photo: place this exact product/subject on a ${bgItem.name} background. Professional commercial photography, natural lighting, keep the product identical.`,
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

  const generateAiBg = async () => {
    if (!aiPrompt.trim() || !removedUrl) { toast.error('Add a description and remove the background first'); return; }
    setApplyingAiBg(true);
    try {
      const result = await generateImage({
        prompt: `Product photography composite: ${aiPrompt}. Professional lighting, commercial photo quality. Keep the product exactly as-is.`,
        existing_image_urls: [removedUrl],
      });
      setAiResultUrl(result.url);
      toast.success('AI background applied!');
    } catch {
      toast.error('Failed to generate background');
    } finally {
      setApplyingAiBg(false);
    }
  };

  const applyTemplate = (tpl) => {
    setActiveTemplate(tpl.id);
    setPadding({ ...tpl.padding });
    setAlign(tpl.align);
    setScale(tpl.scale);
    if (tpl.shadow) setSelectedShadow(tpl.shadow);
    if (tpl.bg && !tpl.bg.startsWith('linear-gradient')) {
      setSelectedColor(tpl.bg);
      setBgTab('color');
    }
    if (tpl.bgImage) {
      const bg = IMAGE_BACKGROUNDS.find(b => b.id === tpl.bgImage);
      if (bg) { setBgImageUrl(bg.url); setSelectedBgImage(bg.id); setBgTab('image'); }
    }
   
    toast.success(`Template "${tpl.name}" applied!`);
  };

  const applyResize = (preset) => {
    setSelectedResize(preset.id);
    setCanvasRatio({ w: preset.w, h: preset.h });
    toast.success(`Resized to ${preset.name}`);
  };

  const handleDownload = () => {
    const url = aiResultUrl || removedUrl || originalUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = 'product-photo.png'; a.target = '_blank'; a.click();
  };

  // ── Canvas sizing: max 500px in either direction ──────────────────────────
  const MAX_DIM = 500;
  const ratio   = canvasRatio.w / canvasRatio.h;
  const canvasW = ratio >= 1 ? MAX_DIM : Math.round(MAX_DIM * ratio);
  const canvasH = ratio >= 1 ? Math.round(MAX_DIM / ratio) : MAX_DIM;

  // ── Image position / scale ────────────────────────────────────────────────
  const getImageStyle = () => {
    const justifyMap = {
      'center': 'center', 'bottom-center': 'center', 'top-center': 'center',
      'bottom-left': 'flex-start', 'bottom-right': 'flex-end',
      'top-left': 'flex-start',    'top-right': 'flex-end',
      'center-left': 'flex-start', 'center-right': 'flex-end',
    };
    const alignMap = {
      'center': 'center', 'bottom-center': 'flex-end', 'top-center': 'flex-start',
      'bottom-left': 'flex-end',  'bottom-right': 'flex-end',
      'top-left': 'flex-start',   'top-right': 'flex-start',
      'center-left': 'center',    'center-right': 'center',
    };
    return {
      containerStyle: {
        position: 'absolute',
        top: `${padding.top}%`, bottom: `${padding.bottom}%`,
        left: `${padding.left}%`, right: `${padding.right}%`,
        display: 'flex',
        justifyContent: justifyMap[align] || 'center',
        alignItems: alignMap[align] || 'center',
      },
      imgStyle: {
        maxWidth: '100%', maxHeight: '100%',
        objectFit: scale === 'fill' ? 'cover' : scale === 'stretch' ? 'fill' : 'contain',
        width:  scale === 'fill' || scale === 'stretch' ? '100%' : undefined,
        height: scale === 'fill' || scale === 'stretch' ? '100%' : undefined,
        ...SHADOW_PRESETS.find(s => s.id === selectedShadow)?.style,
      },
    };
  };

  const checkerBg = {
    backgroundImage: 'linear-gradient(45deg,#d0d0d0 25%,transparent 25%),linear-gradient(-45deg,#d0d0d0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d0d0d0 75%),linear-gradient(-45deg,transparent 75%,#d0d0d0 75%)',
    backgroundSize: '16px 16px', backgroundPosition: '0 0,0 8px,8px -8px,-8px 0', backgroundColor: '#f5f5f5',
  };

  const getCanvasBg = () => {
    if (showBefore) return checkerBg;
    if (bgTab === 'image' && bgImageUrl && !aiResultUrl) return { backgroundImage: `url(${bgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    if (bgTab === 'color') {
      if (selectedColor === 'transparent') return checkerBg;
      if (selectedColor.startsWith('linear-gradient')) return { background: selectedColor };
      return { backgroundColor: selectedColor };
    }
    return checkerBg;
  };

  const displayUrl = showBefore ? originalUrl : (aiResultUrl || removedUrl);
  const { containerStyle, imgStyle } = getImageStyle();

  const grouped = TEMPLATE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = TEMPLATES.filter(t => t.category === cat);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3"
      onClick={onClose}
    >
      {/* Modal: near-fullscreen using vh/vw with small padding from edges */}
      <div
        className="bg-white rounded-2xl shadow-2xl flex overflow-hidden w-full h-full"
        style={{ maxWidth: '1600px', maxHeight: '960px' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Icon sidebar ── */}
        <div className="w-[64px] border-r border-gray-100 flex flex-col items-center py-2 bg-white flex-shrink-0">
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
          <div className="flex-1" />
          <SidebarIcon active={false} onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="w-5 h-5" />}
            label="Upload" />
          <SidebarIcon active={false} onClick={() => {}}
            icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 3"/></svg>}
            label="Usage" />
        </div>

        {/* ── Side panel ── */}
        <div className="w-64 border-r border-gray-100 flex flex-col bg-white flex-shrink-0 overflow-hidden">

          {/* TEMPLATES */}
          {activePanel === 'templates' && !showAllTemplates && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <span className="font-semibold text-sm text-gray-800">Templates</span>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
            
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input placeholder="Search templates" className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50 cursor-text focus:border-blue-400 transition-colors" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {TEMPLATE_CATEGORIES.map(cat => (
                  <div key={cat} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">{cat}</span>
                      <button
                        onClick={() => setShowAllTemplates(true)}
                        className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                      >
                        See all
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {grouped[cat].slice(0, 4).map(tpl => (
                        <button
                          key={tpl.id}
                          onClick={() => applyTemplate(tpl)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:border-blue-400 hover:shadow-md ${activeTemplate === tpl.id ? 'border-blue-500' : 'border-gray-200'}`}
                          style={{
                            background: tpl.bg?.startsWith('linear') ? tpl.bg : tpl.bg === 'transparent' ? undefined : tpl.bg,
                            ...(tpl.bg === 'transparent' ? checkerBg : {}),
                          }}
                        >
                          {tpl.preview && <img src={tpl.preview} alt={tpl.name} className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-multiply" />}
                          {activeTemplate === tpl.id && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg viewBox="0 0 8 8" fill="white" className="w-2.5 h-2.5"><path d="M1 4l2 2 4-4"/></svg>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-1 py-1">
                            <span className="text-white text-[9px] font-medium leading-tight">{tpl.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALL TEMPLATES drill-down */}
          {activePanel === 'templates' && showAllTemplates && (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 flex-shrink-0">
                <button onClick={() => setShowAllTemplates(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="font-semibold text-sm text-gray-800">All Templates</span>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {TEMPLATE_CATEGORIES.map(cat => (
                  <div key={cat} className="mb-5">
                    <p className="text-xs font-semibold text-gray-700 mb-2">{cat}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {grouped[cat].map(tpl => (
                        <button
                          key={tpl.id}
                          onClick={() => { applyTemplate(tpl) }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:border-blue-400 hover:shadow-md ${activeTemplate === tpl.id ? 'border-blue-500' : 'border-gray-200'}`}
                          style={{
                            background: tpl.bg?.startsWith('linear') ? tpl.bg : tpl.bg === 'transparent' ? undefined : tpl.bg,
                            ...(tpl.bg === 'transparent' ? checkerBg : {}),
                          }}
                        >
                          {tpl.preview && <img src={tpl.preview} alt={tpl.name} className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-multiply" />}
                          {activeTemplate === tpl.id && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg viewBox="0 0 8 8" fill="white" className="w-2.5 h-2.5"><path d="M1 4l2 2 4-4"/></svg>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-1 py-1">
                            <span className="text-white text-[9px] font-medium">{tpl.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESIZE */}
          {activePanel === 'resize' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <span className="font-semibold text-sm text-gray-800">Resize</span>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input placeholder="Search formats…" className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50 cursor-text focus:border-blue-400 transition-colors" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Standard</p>
                {RESIZE_STANDARD.map(s => (
                  <button key={s.id} onClick={() => applyResize(s)}
                    className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-colors cursor-pointer ${selectedResize === s.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}>
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <div className={`border-2 rounded-sm transition-colors ${selectedResize === s.id ? 'border-blue-400' : 'border-gray-400'} ${s.w > s.h ? 'w-6 h-4' : s.h > s.w ? 'w-4 h-6' : 'w-5 h-5'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-800">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.dims}</p>
                    </div>
                  </button>
                ))}
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-2">Advanced</p>
                {[{ id: 'custom', name: 'Custom size', sub: 'Enter exact dimensions' }, { id: 'original', name: 'Original image', sub: 'Keep source dimensions' }].map(s => (
                  <button key={s.id} onClick={() => { setSelectedResize(s.id); if (s.id === 'original') setCanvasRatio({ w: 1, h: 1 }); }}
                    className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-colors cursor-pointer ${selectedResize === s.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}>
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <div className={`w-5 h-5 border-2 border-dashed rounded-sm ${selectedResize === s.id ? 'border-blue-400' : 'border-gray-400'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-800">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.sub}</p>
                    </div>
                  </button>
                ))}
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-2">Social Media</p>
                {RESIZE_SOCIAL.map(s => (
                  <button key={s.id} onClick={() => applyResize(s)}
                    className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-colors cursor-pointer ${selectedResize === s.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">{s.icon}</div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-800">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.dims}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* POSITION */}
          {activePanel === 'position' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <span className="font-semibold text-sm text-gray-800">Position</span>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
                  {['original', 'center', 'custom'].map(t => (
                    <button key={t} onClick={() => {
                      setPosTab(t);
                      if (t === 'center')   { setAlign('center');  setPadding({ top:10,bottom:10,left:10,right:10 }); setScale('fit'); }
                      if (t === 'original') { setPadding({ top:0, bottom:0, left:0, right:0 }); setAlign('center'); setScale('fill'); }
                    }}
                      className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg capitalize transition-all cursor-pointer ${posTab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {t}
                    </button>
                  ))}
                </div>

                <p className="text-xs font-semibold text-gray-700 mb-2">Padding</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[['↑','top','Top'],['↓','bottom','Bottom'],['←','left','Left'],['→','right','Right']].map(([arrow, key, label]) => (
                    <div key={key}>
                      <p className="text-[9px] text-gray-400 mb-1">{label}</p>
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus-within:border-blue-400 transition-colors">
                        <span className="text-gray-400 text-xs">{arrow}</span>
                        <input type="number" min="0" max="45" value={padding[key]}
                          onChange={e => { setPadding(p => ({ ...p, [key]: Number(e.target.value) })); setPosTab('custom'); }}
                          className="w-full text-xs text-gray-700 outline-none bg-transparent cursor-text" />
                        <span className="text-[10px] text-gray-400">%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs font-semibold text-gray-700 mb-2">Align</p>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {[
                    ['top-left','↖'],['top-center','↑'],['top-right','↗'],
                    ['center-left','←'],['center','•'],['center-right','→'],
                    ['bottom-left','↙'],['bottom-center','↓'],['bottom-right','↘'],
                  ].map(([a, icon]) => (
                    <button key={a} onClick={() => { setAlign(a); setPosTab('custom'); }}
                      className={`h-9 rounded-lg border flex items-center justify-center text-sm transition-all cursor-pointer ${align === a ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-400'}`}>
                      {icon}
                    </button>
                  ))}
                </div>

                <p className="text-xs font-semibold text-gray-700 mb-2">Scale</p>
                <div className="flex gap-1.5 mb-4">
                  {['fit', 'fill', 'stretch'].map(s => (
                    <button key={s} onClick={() => { setScale(s); setPosTab('custom'); }}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-all cursor-pointer ${scale === s ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'}`}>
                      {s}
                    </button>
                  ))}
                </div>

                <p className="text-xs font-semibold text-gray-700 mb-2">Preview</p>
                <div
                  className="rounded-xl overflow-hidden border border-gray-200 aspect-square flex items-center justify-center relative"
                  style={{ background: selectedColor === 'transparent' ? undefined : selectedColor, ...(selectedColor === 'transparent' ? checkerBg : {}) }}
                >
                  {displayUrl ? (
                    <div style={{
                      position: 'absolute',
                      top: `${padding.top}%`, bottom: `${padding.bottom}%`,
                      left: `${padding.left}%`, right: `${padding.right}%`,
                      display: 'flex',
                      justifyContent: align.includes('right') ? 'flex-end' : align.includes('left') ? 'flex-start' : 'center',
                      alignItems: align.includes('bottom') ? 'flex-end' : align.includes('top') ? 'flex-start' : 'center',
                    }}>
                      <img src={displayUrl} alt="preview" className="max-w-full max-h-full object-contain" style={SHADOW_PRESETS.find(s => s.id === selectedShadow)?.style} />
                    </div>
                  ) : <span className="text-gray-300 text-xs">No image</span>}
                </div>
                <button
                  onClick={() => toast.success('Position applied!')}
                  className="mt-3 w-full py-2 rounded-xl bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-600 active:scale-95 transition-all cursor-pointer"
                >
                  Apply to image
                </button>
              </div>
            </div>
          )}

          {/* BACKGROUND */}
          {activePanel === 'background' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <span className="font-semibold text-sm text-gray-800">Background</span>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                <span className="text-xs text-gray-700">Remove original backgrounds</span>
                <Toggle enabled={removeOrigBg} onChange={v => { setRemoveOrigBg(v); if (v && originalFile) doRemoveBg(originalFile); }} />
              </div>
              <div className="flex border-b border-gray-100 flex-shrink-0">
                {[['color','Color'],['image','Image'],['ai','AI']].map(([id, name]) => (
                  <button key={id} onClick={() => setBgTab(id)}
                    className={`flex-1 py-2 text-[11px] font-medium transition-colors border-b-2 cursor-pointer ${bgTab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                    {name}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                {bgTab === 'color' && (
                  <>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Standard</p>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {STANDARD_COLORS.map(c => <ColorSwatch key={c} color={c} selected={selectedColor === c} onClick={() => setSelectedColor(c)} />)}
                      <label className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 overflow-hidden flex items-center justify-center hover:border-blue-400 transition-colors" style={{ background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }}>
                        <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); setSelectedColor(e.target.value); }} className="opacity-0 w-0 h-0" />
                      </label>
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
                  <>
                    <button onClick={() => bgFileInputRef.current?.click()}
                      className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" /> Upload custom background
                    </button>
                    <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgFileChange} />
                    {['Studio', 'Marble', 'Wood', 'Concrete', 'Other'].map(cat => {
                      const bgs = IMAGE_BACKGROUNDS.filter(b => b.category === cat);
                      return (
                        <div key={cat} className="mb-4">
                          <p className="text-xs font-semibold text-gray-600 mb-2">{cat}</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {bgs.map(bg => (
                              <button key={bg.id} onClick={() => applySceneBackground(bg)}
                                className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer hover:shadow-md ${selectedBgImage === bg.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}>
                                <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors flex items-end p-1">
                                  <span className="text-white text-[9px] font-semibold drop-shadow">{bg.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                {bgTab === 'ai' && (
                  <div>
                    <p className="text-xs text-gray-500 mb-3">Describe any background and AI will generate it</p>
                    <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                      placeholder="e.g. luxury marble counter with soft studio lighting, outdoor garden with bokeh blur…"
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 outline-none resize-none focus:border-blue-400 bg-gray-50 cursor-text transition-colors" rows={4} />
                    <button onClick={generateAiBg} disabled={applyingAiBg || !aiPrompt.trim()}
                      className="mt-2 w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer active:scale-95 hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                      {applyingAiBg
                        ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</span>
                        : '✨ Generate AI Background'}
                    </button>
                    <p className="text-[9px] text-gray-400 mt-2 text-center">Uses AI image generation credits</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI SHADOWS */}
          {activePanel === 'shadows' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <span className="font-semibold text-sm text-gray-800">AI Shadows</span>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <p className="text-xs text-gray-500 mb-3">Choose a shadow style for your product</p>
                <div className="grid grid-cols-2 gap-2">
                  {SHADOW_PRESETS.map(s => (
                    <button key={s.id} onClick={() => setSelectedShadow(s.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${selectedShadow === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center">
                        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg" style={s.style} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Canvas ── */}
        <div className="flex-1 flex flex-col bg-[#e8e8e8] relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-500 shadow-sm cursor-pointer transition-all"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          <div className="absolute top-3.5 left-4 z-20 text-xs text-gray-500">
            {removing
              ? `Removing background… ${removingProgress > 0 ? `${removingProgress}%` : 'loading model'}`
              : removedUrl
                ? 'Background removed ✓'
                : 'Upload an image to start'}
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            {removing ? (
              <div className="flex flex-col items-center gap-4 w-60">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
                <div className="text-center w-full">
                  <p className="text-gray-700 font-semibold mb-2">Removing background…</p>
                  {removingProgress > 0 ? (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${removingProgress}%` }} />
                      </div>
                      <p className="text-gray-400 text-xs mt-1">{removingProgress}%</p>
                    </>
                  ) : (
                    <p className="text-gray-400 text-xs">Loading model…</p>
                  )}
                </div>
              </div>
            ) : originalUrl ? (
              <div className="flex flex-col items-center">
                <div
                  className="rounded-xl overflow-hidden shadow-2xl relative"
                  style={{ width: canvasW, height: canvasH, ...getCanvasBg() }}
                >
                  {/* bg image layer */}
                  {bgTab === 'image' && bgImageUrl && !aiResultUrl && !showBefore && (
                    <img src={bgImageUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  {/* product layer */}
                  {applyingAiBg ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20">
                      <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow" />
                      <p className="text-white text-xs font-medium drop-shadow">Applying background…</p>
                    </div>
                  ) : (
                    <div style={containerStyle}>
                      <img
                        src={!showBefore && aiResultUrl ? aiResultUrl : (!showBefore && removedUrl ? removedUrl : originalUrl)}
                        alt="product"
                        style={{ ...imgStyle, transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                      />
                    </div>
                  )}
                </div>

                {/* Before / After */}
                {removedUrl && (
                  <div className="mt-4 flex bg-white rounded-full shadow border border-gray-200 overflow-hidden text-xs font-medium">
                    <button onClick={() => setShowBefore(false)} className={`px-5 py-1.5 transition-colors cursor-pointer ${!showBefore ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>After</button>
                    <button onClick={() => setShowBefore(true)}  className={`px-5 py-1.5 transition-colors cursor-pointer ${showBefore  ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Before</button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-3 cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-2xl bg-white shadow flex items-center justify-center group-hover:shadow-md group-hover:bg-blue-50 transition-all">
                  <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-gray-500 font-medium group-hover:text-gray-700 transition-colors">Upload an image to get started</p>
                <p className="text-gray-400 text-xs">PNG, JPG or WEBP</p>
              </div>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur-sm border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!originalUrl || removing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              {removedUrl && !removing && (
                <button
                  onClick={() => originalFile && doRemoveBg(originalFile)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-all active:scale-95"
                >
                  <RefreshCw className="w-3 h-3" /> Re-process
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 bg-white rounded-full border border-gray-200 shadow-sm px-2 py-1">
              <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"><Minus className="w-3 h-3 text-gray-500" /></button>
              <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"><Plus className="w-3 h-3 text-gray-500" /></button>
              <HelpCircle className="w-3.5 h-3.5 text-gray-400 ml-1 cursor-help" />
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}