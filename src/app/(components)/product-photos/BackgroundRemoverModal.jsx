import { useState, useRef, useEffect, useCallback } from 'react';
import { removeBackground as engineRemoveBackground, disposeSegmentationWorker } from '@/(lib)/ai-engine/tasks/removeBackground';
import { generateImage } from '@/(lib)/ai-helpers';
import { X, Upload, Download, Loader2, Search, Minus, Plus, HelpCircle, ChevronLeft, RefreshCw, RotateCcw, FlipHorizontal2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ── Color data ────────────────────────────────────────────────────────────────
const STANDARD_COLORS = ['#ffffff', '#000000', '#f5f5f5', '#1a1a2e'];
const NEUTRAL_TONES = [
  '#faf9f6', '#f0ede6', '#e8e4db', '#ddd9d0', '#d0ccc4', '#c4c0b8',
  '#f0f2f5', '#e0e4ea', '#d0d6df', '#c0c9d5', '#b0bcc9', '#a0acbc',
];
const SOFT_PASTELS = [
  '#fef9f0', '#f0f9f0', '#f0f0f9', '#f9f0f9', '#f9f0f0', '#f0f5f9',
  '#fdecd0', '#d0f0e0', '#d0e0f0', '#e8d0f0', '#f0d0d8', '#d0ece0',
];

const pxbg = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`;
// Product-display backdrops — empty podiums, pedestals and staged surfaces a product can sit on.
const IMAGE_BACKGROUNDS = [
  // ── Podium ──
  { id: 'podium_beige', name: 'Beige Podium', category: 'Podium', url: pxbg(7897470) },
  { id: 'podium_yellow', name: 'Yellow Podium', category: 'Podium', url: pxbg(16042675) },
  { id: 'podium_green', name: 'Green Podium', category: 'Podium', url: pxbg(16059552) },
  { id: 'podium_pink', name: 'Pink Podium', category: 'Podium', url: pxbg(12932574) },
  { id: 'podium_arch', name: 'Arch Display', category: 'Podium', url: pxbg(12914280) },
  { id: 'podium_white', name: 'White Podium', category: 'Podium', url: pxbg(35073010) },
  // ── Minimal ──
  { id: 'min_geometric', name: 'White Geometric', category: 'Minimal', url: pxbg(16149990) },
  { id: 'min_arch', name: 'Arch Platform', category: 'Minimal', url: pxbg(6840026) },
  { id: 'min_soft', name: 'Soft White', category: 'Minimal', url: pxbg(15067862) },
  { id: 'min_leaf', name: 'Leaf Shadow', category: 'Minimal', url: pxbg(12198526) },
  { id: 'min_spa', name: 'Spa Minimal', category: 'Minimal', url: pxbg(8015809) },
  { id: 'min_shadows', name: 'Soft Shadows', category: 'Minimal', url: pxbg(8015461) },
  // ── Surface ──
  { id: 'surf_wood', name: 'Wood Table', category: 'Surface', url: pxbg(34658646) },
  { id: 'surf_marble', name: 'White Marble', category: 'Surface', url: pxbg(3847496) },
  { id: 'surf_marble_dark', name: 'Dark Marble', category: 'Surface', url: pxbg(18325786) },
  { id: 'surf_stone', name: 'Stone Counter', category: 'Surface', url: pxbg(7533765) },
  { id: 'surf_marble_close', name: 'Marble Close-up', category: 'Surface', url: pxbg(4705932) },
  { id: 'surf_speckled', name: 'Speckled Stone', category: 'Surface', url: pxbg(7232667) },
  // ── Gradient ──
  { id: 'grad_peach', name: 'Peach Gradient', category: 'Gradient', url: pxbg(7130564) },
  { id: 'grad_pastel', name: 'Pastel Gradient', category: 'Gradient', url: pxbg(7135055) },
  { id: 'grad_abstract', name: 'Abstract Blend', category: 'Gradient', url: pxbg(7135028) },
  { id: 'grad_pinkyellow', name: 'Pink & Yellow', category: 'Gradient', url: pxbg(7130557) },
  { id: 'grad_green', name: 'Green Glow', category: 'Gradient', url: pxbg(6985185) },
  { id: 'grad_soft', name: 'Soft Tones', category: 'Gradient', url: pxbg(7135024) },
  // ── Texture (new) ──
  { id: 'tex_concrete', name: 'Concrete Wall', category: 'Texture', url: pxbg(2463329) },
  { id: 'tex_rough', name: 'Rough Concrete', category: 'Texture', url: pxbg(3964666) },
  { id: 'tex_stucco', name: 'Light Stucco', category: 'Texture', url: pxbg(12901948) },
  { id: 'tex_plaster', name: 'Beige Plaster', category: 'Texture', url: pxbg(12998745) },
  { id: 'tex_surface', name: 'Concrete Surface', category: 'Texture', url: pxbg(247719) },
  // ── Fabric (new) ──
  { id: 'fab_linen', name: 'Neutral Linen', category: 'Fabric', url: pxbg(7794365) },
  { id: 'fab_canvas', name: 'Beige Canvas', category: 'Fabric', url: pxbg(7533979) },
  { id: 'fab_crumpled', name: 'Crumpled Linen', category: 'Fabric', url: pxbg(6843273) },
  { id: 'fab_silk', name: 'Cream Silk', category: 'Fabric', url: pxbg(7988399) },
  { id: 'fab_satin_black', name: 'Black Satin', category: 'Fabric', url: pxbg(8007352) },
  { id: 'fab_satin_pink', name: 'Pink Satin', category: 'Fabric', url: pxbg(7956629) },
  // ── Nature (new) ──
  { id: 'nat_palm_shadow', name: 'Palm Shadow', category: 'Nature', url: pxbg(6793893) },
  { id: 'nat_frond', name: 'Frond Shadow', category: 'Nature', url: pxbg(27394932) },
  { id: 'nat_sand', name: 'Rippled Sand', category: 'Nature', url: pxbg(19215108) },
  { id: 'nat_sand_coast', name: 'Coastal Sand', category: 'Nature', url: pxbg(1478450) },
  { id: 'nat_tulips', name: 'White Tulips', category: 'Nature', url: pxbg(30399673) },
  { id: 'nat_roses', name: 'Red Roses', category: 'Nature', url: pxbg(13246785) },
  // ── Paper (new) ──
  { id: 'paper_pastel', name: 'Pastel Papers', category: 'Paper', url: pxbg(8559014) },
  { id: 'paper_sheets', name: 'Colored Sheets', category: 'Paper', url: pxbg(7457657) },
  { id: 'paper_flatlay', name: 'Paper Flatlay', category: 'Paper', url: pxbg(9389596) },
  { id: 'paper_abstract', name: 'Abstract Paper', category: 'Paper', url: pxbg(7953539) },
  { id: 'paper_rolled', name: 'Rolled Paper', category: 'Paper', url: pxbg(36135531) },
  { id: 'paper_rolled2', name: 'Rolled Color', category: 'Paper', url: pxbg(36135526) },
];

// Order categories appear in the Image-background tab.
const IMAGE_BG_CATEGORIES = ['Podium', 'Minimal', 'Surface', 'Gradient', 'Texture', 'Fabric', 'Nature', 'Paper'];

const TEMPLATES = [
  { id: 'clean_white', name: 'Clean White', category: 'Essentials', bg: '#ffffff', padding: { top: 10, bottom: 10, left: 10, right: 10 }, align: 'center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=70' },
  { id: 'clean_grey', name: 'Soft Grey', category: 'Essentials', bg: '#f0ede6', padding: { top: 12, bottom: 12, left: 12, right: 12 }, align: 'center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=70' },
  { id: 'clean_black', name: 'Deep Black', category: 'Essentials', bg: '#111111', padding: { top: 10, bottom: 10, left: 10, right: 10 }, align: 'center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=70' },
  { id: 'bottom_heavy', name: 'Bottom Heavy', category: 'Essentials', bg: '#faf9f6', padding: { top: 5, bottom: 20, left: 10, right: 10 }, align: 'bottom-center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=70' },
  { id: 'studio_warm', name: 'Warm Studio', category: 'Studio', bg: '#f5e6d3', padding: { top: 8, bottom: 18, left: 8, right: 8 }, align: 'bottom-center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=70' },
  { id: 'studio_cool', name: 'Cool Studio', category: 'Studio', bg: '#d8e4f0', padding: { top: 8, bottom: 18, left: 8, right: 8 }, align: 'bottom-center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=70' },
  { id: 'studio_minimal', name: 'Minimal Studio', category: 'Studio', bg: '#f8f8f8', padding: { top: 15, bottom: 15, left: 15, right: 15 }, align: 'center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=70' },
  { id: 'studio_shadow', name: 'Studio Shadow', category: 'Studio', bg: '#e8e8e8', padding: { top: 5, bottom: 20, left: 10, right: 10 }, align: 'bottom-center', scale: 'fit', shadow: 'floating', preview: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=70' },
  { id: 'shopify_white', name: 'Shopify White', category: 'Shopify', bg: '#ffffff', padding: { top: 8, bottom: 8, left: 8, right: 8 }, align: 'center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=70' },
  { id: 'shopify_off', name: 'Off White', category: 'Shopify', bg: '#faf9f5', padding: { top: 10, bottom: 10, left: 10, right: 10 }, align: 'center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=70' },
  { id: 'shopify_life', name: 'Lifestyle', category: 'Shopify', bg: '#ede8df', padding: { top: 12, bottom: 12, left: 12, right: 12 }, align: 'center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=70' },
  { id: 'shopify_bold', name: 'Bold Display', category: 'Shopify', bg: '#1a1a1a', padding: { top: 8, bottom: 8, left: 8, right: 8 }, align: 'center', scale: 'fill', preview: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=70' },
  { id: 'classic_white', name: 'White', category: 'Classics', bg: '#ffffff', padding: { top: 10, bottom: 10, left: 10, right: 10 }, align: 'center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1559629819-638a8f0a4303?w=200&q=70' },
  { id: 'classic_black', name: 'Black', category: 'Classics', bg: '#000000', padding: { top: 10, bottom: 10, left: 10, right: 10 }, align: 'center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1559629819-638a8f0a4303?w=200&q=70' },
  { id: 'classic_trans', name: 'Transparent', category: 'Classics', bg: 'transparent', padding: { top: 10, bottom: 10, left: 10, right: 10 }, align: 'center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1559629819-638a8f0a4303?w=200&q=70' },
  { id: 'profile_vib', name: 'Vibrant', category: 'Profile Pics', bg: 'linear-gradient(135deg,#f093fb,#f5a623)', padding: { top: 5, bottom: 5, left: 5, right: 5 }, align: 'center', scale: 'fill', preview: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=70' },
  { id: 'profile_ocean', name: 'Ocean', category: 'Profile Pics', bg: 'linear-gradient(135deg,#0099f7,#f11712)', padding: { top: 5, bottom: 5, left: 5, right: 5 }, align: 'center', scale: 'fill', preview: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=70' },
  { id: 'profile_min', name: 'Minimal', category: 'Profile Pics', bg: '#f0ede6', padding: { top: 5, bottom: 5, left: 5, right: 5 }, align: 'center', scale: 'fill', preview: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=70' },
  { id: 'marble_light', name: 'Light Marble', category: 'Marble & Wood', bgImage: 'surf_marble', bg: '#f5f5f5', padding: { top: 10, bottom: 20, left: 10, right: 10 }, align: 'bottom-center', scale: 'fit', preview: 'https://images.pexels.com/photos/3847496/pexels-photo-3847496.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'wood_natural', name: 'Natural Wood', category: 'Marble & Wood', bgImage: 'surf_wood', bg: '#c8a874', padding: { top: 10, bottom: 20, left: 10, right: 10 }, align: 'bottom-center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=200&q=70' },
  { id: 'minimal_cream', name: 'Cream', category: 'Minimal Shop', bg: '#f7f3ec', padding: { top: 12, bottom: 18, left: 12, right: 12 }, align: 'bottom-center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=70' },
  { id: 'minimal_rose', name: 'Rose', category: 'Minimal Shop', bg: '#f9ede8', padding: { top: 12, bottom: 18, left: 12, right: 12 }, align: 'bottom-center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=70' },
  { id: 'minimal_sage', name: 'Sage', category: 'Minimal Shop', bg: '#e8ede8', padding: { top: 12, bottom: 18, left: 12, right: 12 }, align: 'bottom-center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=70' },
  { id: 'minimal_slate', name: 'Slate', category: 'Minimal Shop', bg: '#e0e4ea', padding: { top: 12, bottom: 18, left: 12, right: 12 }, align: 'bottom-center', scale: 'fit', preview: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=200&q=70' },
];

const TEMPLATE_CATEGORIES = ['Essentials', 'Studio', 'Shopify', 'Classics', 'Profile Pics', 'Marble & Wood', 'Minimal Shop'];

const RESIZE_STANDARD = [
  { id: 'landscape', name: 'Landscape', dims: '2016 × 1512', w: 4, h: 3 },
  { id: 'portrait', name: 'Portrait', dims: '1512 × 2016', w: 3, h: 4 },
  { id: 'square', name: 'Square', dims: '1512 × 1512', w: 1, h: 1 },
];
const RESIZE_SOCIAL = [
  { id: 'ig_story', name: 'Instagram Story', dims: '1080 × 1920', icon: '📷', w: 9, h: 16 },
  { id: 'ig_post', name: 'Instagram Post', dims: '1080 × 1080', icon: '📷', w: 1, h: 1 },
  { id: 'ig_post_45', name: 'Instagram (4:5)', dims: '1080 × 1350', icon: '📷', w: 4, h: 5 },
  { id: 'ig_reel', name: 'Instagram Reel', dims: '1080 × 1920', icon: '📷', w: 9, h: 16 },
  { id: 'tiktok', name: 'TikTok Post', dims: '1080 × 1920', icon: '♪', w: 9, h: 16 },
  { id: 'tiktok_thumb', name: 'TikTok Thumbnail', dims: '1080 × 1340', icon: '♪', w: 3, h: 4 },
  { id: 'yt_cover', name: 'YouTube Cover', dims: '1280 × 720', icon: '▶', w: 16, h: 9 },
  { id: 'fb_post', name: 'Facebook Post', dims: '1200 × 630', icon: 'f', w: 16, h: 9 },
  { id: 'twitter', name: 'Twitter Header', dims: '1500 × 500', icon: '𝕏', w: 3, h: 1 },
  { id: 'linkedin', name: 'LinkedIn Post', dims: '1200 × 627', icon: 'in', w: 2, h: 1 },
  { id: 'pinterest', name: 'Pinterest Pin', dims: '1000 × 1500', icon: '📌', w: 2, h: 3 },
  { id: 'amazon', name: 'Amazon Product', dims: '2000 × 2000', icon: '🛒', w: 1, h: 1 },
];

const SHADOW_PRESETS = [
  { id: 'none', name: 'None', style: {} },
  { id: 'soft', name: 'Soft', style: { filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))' } },
  { id: 'hard', name: 'Hard', style: { filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.5))' } },
  { id: 'floating', name: 'Floating', style: { filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.35))' } },
  { id: 'glow', name: 'Glow', style: { filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.5))' } },
  { id: 'subtle', name: 'Subtle', style: { filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' } },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-6 rounded-full transition-all flex-shrink-0 cursor-pointer ${enabled ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-surface rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-1'}`} />
    </button>
  );
}

function ColorSwatch({ color, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer hover:scale-110 ${selected ? 'border-blue-500 scale-110' : color === '#ffffff' ? 'border-gray-200 hover:border-gray-400' : 'border-transparent hover:border-gray-200'}`}
      style={{ backgroundColor: color }}
    />
  );
}

function SidebarIcon({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 px-1 w-full transition-colors cursor-pointer ${active ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
    >
      <div className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${active ? 'bg-blue-100' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
    </button>
  );
}

// ── Resize handle component ───────────────────────────────────────────────────
const HANDLES = [
  { id: 'nw', cursor: 'nw-resize', style: { top: -5, left: -5 } },
  { id: 'n',  cursor: 'n-resize',  style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
  { id: 'ne', cursor: 'ne-resize', style: { top: -5, right: -5 } },
  { id: 'e',  cursor: 'e-resize',  style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
  { id: 'se', cursor: 'se-resize', style: { bottom: -5, right: -5 } },
  { id: 's',  cursor: 's-resize',  style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
  { id: 'sw', cursor: 'sw-resize', style: { bottom: -5, left: -5 } },
  { id: 'w',  cursor: 'w-resize',  style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
];

// ── Canvas export helpers (shared by single + batch download) ─────────────────
const loadImg = (src) => new Promise((resolve, reject) => {
  const im = new Image();
  im.crossOrigin = 'anonymous';
  im.onload = () => resolve(im);
  im.onerror = reject;
  im.src = src;
});

// Pull the color stops out of a `linear-gradient(...)` string.
const gradientStops = (g) => {
  const inner = g.substring(g.indexOf('(') + 1, g.lastIndexOf(')'));
  const parts = inner.split(/,(?![^(]*\))/).map(p => p.trim());
  if (/deg|to /.test(parts[0])) parts.shift();
  return parts.map(p => p.split(/\s+/)[0]);
};

// Re-scale a CSS drop-shadow filter so it matches the higher-res export.
const scaleShadow = (filterStr, factor) => {
  if (!filterStr) return '';
  const m = filterStr.match(/drop-shadow\((.+)\)\s*$/);
  if (!m) return '';
  const inner = m[1];
  const colorMatch = inner.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/);
  const color = colorMatch ? colorMatch[0] : 'rgba(0,0,0,0.3)';
  const lenPart = colorMatch ? inner.slice(0, colorMatch.index).trim() : inner.trim();
  const scaled = lenPart.split(/\s+/).map(t => {
    const n = parseFloat(t);
    return isNaN(n) ? t : `${(n * factor).toFixed(1)}px`;
  }).join(' ');
  return `drop-shadow(${scaled} ${color})`;
};

// Downscale very large images before background removal — saves decode/inference
// time and memory. Returns the original file when it's already within maxDim.
const downscaleFile = (file, maxDim = 2500) => new Promise((resolve) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (Math.max(w, h) <= maxDim) { URL.revokeObjectURL(url); resolve(file); return; }
    const scale = maxDim / Math.max(w, h);
    const cw = Math.round(w * scale), ch = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(url);
      resolve(blob ? new File([blob], file.name || 'image.png', { type: 'image/png' }) : file);
    }, 'image/png');
  };
  img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
  img.src = url;
});

const triggerDownload = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

// ── Main component ────────────────────────────────────────────────────────────
export default function BackgroundRemoverModal({ onClose, initialFile, files }) {
  const fileInputRef    = useRef(null);
  const bgFileInputRef  = useRef(null);
  const canvasRef       = useRef(null);

  const [originalFile, setOriginalFile] = useState(initialFile || null);
  const [originalUrl, setOriginalUrl]   = useState(initialFile ? URL.createObjectURL(initialFile) : null);
  const [removedUrl, setRemovedUrl]     = useState(null);
  const [removing, setRemoving]         = useState(false);
  const [removingProgress, setRemovingProgress] = useState(0);
  const [aiResultUrl, setAiResultUrl]   = useState(null);
  const [applyingAiBg, setApplyingAiBg] = useState(false);

  const [activePanel, setActivePanel]   = useState('templates');
  const [showBefore, setShowBefore]     = useState(false);
  const [zoom, setZoom]                 = useState(100);

  // Templates
  const [activeTemplate, setActiveTemplate]     = useState(null);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  // Background
  const [bgTab, setBgTab]               = useState('color');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [customColor, setCustomColor]   = useState('#ffffff');
  const [selectedBgImage, setSelectedBgImage] = useState(null);
  const [bgImageUrl, setBgImageUrl]     = useState(null);
  const [removeOrigBg, setRemoveOrigBg] = useState(true);
  const [aiPrompt, setAiPrompt]         = useState('');

  // Resize canvas ratio
  const [selectedResize, setSelectedResize] = useState(null);
  const [canvasRatio, setCanvasRatio]       = useState({ w: 1, h: 1 });

  // Shadows
  const [selectedShadow, setSelectedShadow] = useState('none');

  // ── Batch mode ─────────────────────────────────────────────────────────────
  // batchItems: { name, file, originalUrl, removedUrl, status: 'pending'|'processing'|'done'|'error' }
  const [batchItems, setBatchItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const activeIndexRef = useRef(0);
  const batchMode = batchItems.length > 0;
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  // ── Background removal (on-device AI engine) ─────────────────────────────────
  // Uses the shared engine's segmentation worker (ONNX U²-Net, WebGPU→WASM, model
  // cached after first download). The engine holds ONE worker + model session and
  // frees it on unmount, so peak RAM stays low even on weak devices. Replaces the
  // former @imgly (AGPL) worker pool.
  useEffect(() => () => { disposeSegmentationWorker(); }, []);

  // ── Interactive image state ──────────────────────────────────────────────
  const [selected, setSelected]     = useState(false);
  const [imgPos, setImgPos]         = useState({ x: 0, y: 0 });       // offset from canvas center
  const [imgSize, setImgSize]       = useState({ w: 0, h: 0 });        // rendered px size
  const [rotation, setRotation]     = useState(0);
  const [flipped, setFlipped]       = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [imgInitialized, setImgInitialized] = useState(false);

  const dragRef   = useRef(null);   // { startX, startY, startPosX, startPosY }
  const resizeRef = useRef(null);   // { handle, startX, startY, startW, startH, startPosX, startPosY }

  // ── Canvas sizing ────────────────────────────────────────────────────────
  const MAX_DIM = 500;
  const ratio   = canvasRatio.w / canvasRatio.h;
  const canvasW = ratio >= 1 ? MAX_DIM : Math.round(MAX_DIM * ratio);
  const canvasH = ratio >= 1 ? Math.round(MAX_DIM / ratio) : MAX_DIM;

  const displayUrl = showBefore ? originalUrl : (aiResultUrl || removedUrl);

  // Initialize image position/size when displayUrl or canvas changes
  useEffect(() => {
    if (!displayUrl) { setImgInitialized(false); return; }
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      setNaturalSize({ w: nw, h: nh });
      // Fit inside 80% of canvas
      const maxW = canvasW * 0.8;
      const maxH = canvasH * 0.8;
      const scale = Math.min(maxW / nw, maxH / nh);
      setImgSize({ w: Math.round(nw * scale), h: Math.round(nh * scale) });
      setImgPos({ x: 0, y: 0 });
      setImgInitialized(true);
    };
    img.src = displayUrl;
  }, [displayUrl, canvasW, canvasH]);

  // ── Drag ────────────────────────────────────────────────────────────────
  const onDragMouseDown = useCallback((e) => {
    if (!selected) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: imgPos.x, startPosY: imgPos.y };

    const onMove = (me) => {
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      setImgPos({ x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [selected, imgPos]);

  // ── Resize ──────────────────────────────────────────────────────────────
  const onResizeMouseDown = useCallback((e, handleId) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      handle: handleId,
      startX: e.clientX, startY: e.clientY,
      startW: imgSize.w,  startH: imgSize.h,
      startPosX: imgPos.x, startPosY: imgPos.y,
    };

    const onMove = (me) => {
      const { handle, startX, startY, startW, startH, startPosX, startPosY } = resizeRef.current;
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      const aspect = startW / startH;

      let newW = startW;
      let newH = startH;
      let newX = startPosX;
      let newY = startPosY;

      // Corner handles: maintain aspect ratio
      if (handle === 'se') {
        newW = Math.max(40, startW + dx);
        newH = Math.max(40, newW / aspect);
      } else if (handle === 'sw') {
        newW = Math.max(40, startW - dx);
        newH = Math.max(40, newW / aspect);
        newX = startPosX + (startW - newW);
      } else if (handle === 'ne') {
        newW = Math.max(40, startW + dx);
        newH = Math.max(40, newW / aspect);
        newY = startPosY + (startH - newH);
      } else if (handle === 'nw') {
        newW = Math.max(40, startW - dx);
        newH = Math.max(40, newW / aspect);
        newX = startPosX + (startW - newW);
        newY = startPosY + (startH - newH);
      }
      // Edge handles: free resize
      else if (handle === 'e') { newW = Math.max(40, startW + dx); }
      else if (handle === 'w') { newW = Math.max(40, startW - dx); newX = startPosX + (startW - newW); }
      else if (handle === 's') { newH = Math.max(40, startH + dy); }
      else if (handle === 'n') { newH = Math.max(40, startH - dy); newY = startPosY + (startH - newH); }

      setImgSize({ w: Math.round(newW), h: Math.round(newH) });
      setImgPos({ x: Math.round(newX), y: Math.round(newY) });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      resizeRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [imgSize, imgPos]);

  // Deselect on canvas click
  const onCanvasClick = (e) => {
    if (e.target === canvasRef.current) setSelected(false);
  };

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (!selected) return;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft')  setImgPos(p => ({ ...p, x: p.x - step }));
      if (e.key === 'ArrowRight') setImgPos(p => ({ ...p, x: p.x + step }));
      if (e.key === 'ArrowUp')    setImgPos(p => ({ ...p, y: p.y - step }));
      if (e.key === 'ArrowDown')  setImgPos(p => ({ ...p, y: p.y + step }));
      if (e.key === 'Escape')     setSelected(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  useEffect(() => {
    if (initialFile) doRemoveBg(initialFile);
  }, []);

  // Batch entry point — process every selected file, one at a time.
  useEffect(() => {
    if (files && files.length) processBatch(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const removeBgBlob = async (file, onProgress) => {
    // On-device AI engine (ONNX U²-Net in a Web Worker, WebGPU→WASM, cached model).
    // The engine reports 0–100 via `pct`; adapt it to this component's (current,
    // total) progress shape.
    const { blob } = await engineRemoveBackground(file, {
      onProgress: onProgress ? ({ pct }) => onProgress(pct || 0, 100) : undefined,
    });
    return blob;
  };

  const processBatch = async (fileList) => {
    const list = Array.from(fileList).filter(f => f.type?.startsWith('image/'));
    if (!list.length) return;
    const items = list.map(f => ({
      name: f.name || 'image.png', file: f,
      originalUrl: URL.createObjectURL(f), removedUrl: null, status: 'pending',
    }));
    setBatchItems(items);
    setActiveIndex(0);
    activeIndexRef.current = 0;
    // Show the first image immediately while the rest process.
    setOriginalFile(items[0].file);
    setOriginalUrl(items[0].originalUrl);
    setRemovedUrl(null);
    setAiResultUrl(null);
    setShowBefore(false);

    // Dispatch all at once — the worker pool caps real concurrency to POOL_SIZE.
    await Promise.all(items.map(async (it, i) => {
      setBatchItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'processing' } : p));
      try {
        const downscaled = await downscaleFile(it.file, 2500);
        const blob = await removeBgBlob(downscaled);
        const url = URL.createObjectURL(blob);
        setBatchItems(prev => prev.map((p, idx) => idx === i ? { ...p, removedUrl: url, status: 'done' } : p));
        if (activeIndexRef.current === i) setRemovedUrl(url);
      } catch (err) {
        console.error('Batch item failed', err);
        setBatchItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error' } : p));
      }
    }));
    toast.success('All images processed');
  };

  const selectBatchItem = (i) => {
    const it = batchItems[i];
    if (!it) return;
    setActiveIndex(i);
    activeIndexRef.current = i;
    setOriginalFile(it.file);
    setOriginalUrl(it.originalUrl);
    setRemovedUrl(it.removedUrl);
    setAiResultUrl(null);
    setShowBefore(false);
  };

  const doRemoveBg = async (file) => {
    setRemoving(true);
    setRemovedUrl(null);
    setAiResultUrl(null);
    setRemovingProgress(0);
    setImgInitialized(false);
    try {
      const downscaled = await downscaleFile(file, 2500);
      const blob = await removeBgBlob(downscaled, (current, total) => {
        if (total > 0) setRemovingProgress(Math.round((current / total) * 100));
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
    setBgImageUrl(URL.createObjectURL(file));
    setSelectedBgImage('custom_upload');
    setBgTab('image');
    setAiResultUrl(null);   // a composited scene bg would otherwise suppress the uploaded image
    setShowBefore(false);   // make sure we're on the "After" view so the new bg is visible
  };

  const applySceneBackground = (bgItem) => {
    // Layer the scene photo behind the cut-out product — instant, no backend round-trip.
    setBgImageUrl(bgItem.url);
    setSelectedBgImage(bgItem.id);
    setBgTab('image');
    setAiResultUrl(null);   // drop any prior AI composite so this scene shows
    setShowBefore(false);   // ensure we're on the "After" view
    if (!removedUrl) toast('Tip: remove the product background so the scene shows through.');
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

  // Compose the current shared style (background + shadow) with a product image and
  // return a PNG data URL. `autoFit: true` centres + contains the product (used for
  // batch, where one style is applied to many differently-sized images); otherwise it
  // honours the manual position/scale/rotation of the active image.
  const composeCanvas = async (productUrl, { autoFit = false, withShadow = true } = {}) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const outW = 1200;
    const outH = Math.round(outW / ratio);
    canvas.width = outW;
    canvas.height = outH;

    // ── Background layer (shared style) ──
    const showImageBg = bgTab === 'image' && bgImageUrl && !aiResultUrl;
    if (showImageBg) {
      try {
        const bgImg = await loadImg(bgImageUrl);
        const s = Math.max(outW / bgImg.width, outH / bgImg.height); // cover
        const bw = bgImg.width * s, bh = bgImg.height * s;
        ctx.drawImage(bgImg, (outW - bw) / 2, (outH - bh) / 2, bw, bh);
      } catch {
        toast.error('Could not load the background image for export.');
      }
    } else if (bgTab === 'color' && selectedColor !== 'transparent') {
      if (selectedColor.startsWith('linear-gradient')) {
        const stops = gradientStops(selectedColor);
        const grad = ctx.createLinearGradient(0, 0, outW, outH);
        stops.forEach((c, i) => grad.addColorStop(stops.length > 1 ? i / (stops.length - 1) : 0, c));
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = selectedColor;
      }
      ctx.fillRect(0, 0, outW, outH);
    }
    // else: leave transparent (the checkerboard is only a UI hint)

    // ── Product layer ──
    const img = await loadImg(productUrl); // caller handles load errors
    const scaleX = outW / canvasW;

    ctx.save();
    if (withShadow) ctx.filter = scaleShadow(shadowStyle.filter, scaleX);
    if (autoFit) {
      const fit = Math.min((outW * 0.85) / img.width, (outH * 0.85) / img.height);
      const dw = img.width * fit, dh = img.height * fit;
      ctx.drawImage(img, (outW - dw) / 2, (outH - dh) / 2, dw, dh);
    } else {
      const cx = outW / 2 + imgPos.x * scaleX;
      const cy = outH / 2 + imgPos.y * (outH / canvasH);
      const dw = imgSize.w * scaleX;
      const dh = imgSize.h * (outH / canvasH);
      ctx.translate(cx, cy);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipped) ctx.scale(-1, 1);
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    }
    ctx.restore();

    return canvas.toDataURL('image/png'); // may throw if tainted — caller catches
  };

  const safeName = (name, fallback) => {
    const base = (name || fallback).replace(/\.[^.]+$/, '');
    return `${base || fallback}.png`;
  };

  const handleDownload = async () => {
    if (!originalUrl) return;
    try {
      // aiResultUrl already has its background + shadow baked in.
      const productUrl = aiResultUrl || removedUrl || originalUrl;
      const dataUrl = await composeCanvas(productUrl, { autoFit: false, withShadow: !aiResultUrl });
      triggerDownload(dataUrl, batchMode ? safeName(batchItems[activeIndex]?.name, 'product-photo') : 'product-photo.png');
    } catch {
      toast.error('Export failed. The background image may not be cross-origin accessible.');
    }
  };

  const handleDownloadAll = async () => {
    const done = batchItems.filter(it => it.status === 'done' && it.removedUrl);
    if (!done.length) { toast.error('No processed images to download yet.'); return; }
    setDownloadingAll(true);
    toast(`Downloading ${done.length} image${done.length > 1 ? 's' : ''}…`);
    let ok = 0;
    for (const it of done) {
      try {
        const dataUrl = await composeCanvas(it.removedUrl, { autoFit: true, withShadow: true });
        triggerDownload(dataUrl, safeName(it.name, `product-${ok + 1}`));
        ok++;
        await new Promise(r => setTimeout(r, 350)); // let the browser queue each download
      } catch {
        // skip failed item, keep going
      }
    }
    setDownloadingAll(false);
    if (ok) toast.success(`Downloaded ${ok} image${ok > 1 ? 's' : ''}`);
    else toast.error('Could not export the images.');
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

  const shadowStyle = SHADOW_PRESETS.find(s => s.id === selectedShadow)?.style || {};

  // Shared background for the batch filmstrip thumbnails (mirrors the current style).
  const previewBgStyle = (() => {
    if (bgTab === 'image' && bgImageUrl) return { backgroundImage: `url(${bgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    if (bgTab === 'color') {
      if (selectedColor === 'transparent') return checkerBg;
      if (selectedColor.startsWith('linear-gradient')) return { background: selectedColor };
      return { backgroundColor: selectedColor };
    }
    return checkerBg;
  })();

  const grouped = TEMPLATE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = TEMPLATES.filter(t => t.category === cat);
    return acc;
  }, {});

  // Image left/top in canvas (canvas is positioned with overflow:hidden, image centered)
  const imgLeft = canvasW / 2 + imgPos.x - imgSize.w / 2;
  const imgTop  = canvasH / 2 + imgPos.y - imgSize.h / 2;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-3"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl flex overflow-hidden w-full h-full"
        style={{ maxWidth: '1600px', maxHeight: '960px' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Icon sidebar ── */}
        <div className="w-[64px] border-r border-gray-200 flex flex-col items-center py-2 bg-surface flex-shrink-0">
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
        <div className="w-64 border-r border-gray-200 flex flex-col bg-surface flex-shrink-0 overflow-hidden">

          {/* TEMPLATES */}
          {activePanel === 'templates' && !showAllTemplates && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
                <span className="font-semibold text-sm text-gray-900">Templates</span>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input placeholder="Search templates" className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-100 cursor-text focus:border-blue-400 transition-colors" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {TEMPLATE_CATEGORIES.map(cat => (
                  <div key={cat} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-900">{cat}</span>
                      <button onClick={() => setShowAllTemplates(true)} className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer transition-colors">See all</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {grouped[cat].slice(0, 4).map(tpl => (
                        <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:border-blue-400 hover:shadow-md ${activeTemplate === tpl.id ? 'border-blue-500' : 'border-gray-200'}`}
                          style={{ background: tpl.bg?.startsWith('linear') ? tpl.bg : tpl.bg === 'transparent' ? undefined : tpl.bg, ...(tpl.bg === 'transparent' ? checkerBg : {}) }}>
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

          {activePanel === 'templates' && showAllTemplates && (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-200 flex-shrink-0">
                <button onClick={() => setShowAllTemplates(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
                <span className="font-semibold text-sm text-gray-900">All Templates</span>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {TEMPLATE_CATEGORIES.map(cat => (
                  <div key={cat} className="mb-5">
                    <p className="text-xs font-semibold text-gray-900 mb-2">{cat}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {grouped[cat].map(tpl => (
                        <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:border-blue-400 hover:shadow-md ${activeTemplate === tpl.id ? 'border-blue-500' : 'border-gray-200'}`}
                          style={{ background: tpl.bg?.startsWith('linear') ? tpl.bg : tpl.bg === 'transparent' ? undefined : tpl.bg, ...(tpl.bg === 'transparent' ? checkerBg : {}) }}>
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
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
                <span className="font-semibold text-sm text-gray-900">Resize</span>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input placeholder="Search formats…" className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-100 cursor-text focus:border-blue-400 transition-colors" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Standard</p>
                {RESIZE_STANDARD.map(s => (
                  <button key={s.id} onClick={() => applyResize(s)}
                    className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-colors cursor-pointer ${selectedResize === s.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100 border border-transparent hover:border-gray-200'}`}>
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <div className={`border-2 rounded-sm transition-colors ${selectedResize === s.id ? 'border-blue-400' : 'border-gray-400'} ${s.w > s.h ? 'w-6 h-4' : s.h > s.w ? 'w-4 h-6' : 'w-5 h-5'}`} />
                    </div>
                    <div className="text-left"><p className="text-xs font-medium text-gray-900">{s.name}</p><p className="text-[10px] text-gray-500">{s.dims}</p></div>
                  </button>
                ))}
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Advanced</p>
                {[{ id: 'custom', name: 'Custom size', sub: 'Enter exact dimensions' }, { id: 'original', name: 'Original image', sub: 'Keep source dimensions' }].map(s => (
                  <button key={s.id} onClick={() => { setSelectedResize(s.id); if (s.id === 'original') setCanvasRatio({ w: 1, h: 1 }); }}
                    className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-colors cursor-pointer ${selectedResize === s.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100 border border-transparent hover:border-gray-200'}`}>
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <div className={`w-5 h-5 border-2 border-dashed rounded-sm ${selectedResize === s.id ? 'border-blue-400' : 'border-gray-400'}`} />
                    </div>
                    <div className="text-left"><p className="text-xs font-medium text-gray-900">{s.name}</p><p className="text-[10px] text-gray-500">{s.sub}</p></div>
                  </button>
                ))}
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Social Media</p>
                {RESIZE_SOCIAL.map(s => (
                  <button key={s.id} onClick={() => applyResize(s)}
                    className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-colors cursor-pointer ${selectedResize === s.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100 border border-transparent hover:border-gray-200'}`}>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500">{s.icon}</div>
                    <div className="text-left"><p className="text-xs font-medium text-gray-900">{s.name}</p><p className="text-[10px] text-gray-500">{s.dims}</p></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* POSITION */}
          {activePanel === 'position' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
                <span className="font-semibold text-sm text-gray-900">Position</span>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <p className="text-xs font-semibold text-gray-900 mb-2">Size</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[['W', 'w'], ['H', 'h']].map(([label, key]) => (
                    <div key={key}>
                      <p className="text-[9px] text-gray-500 mb-1">{label}</p>
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1.5 bg-surface focus-within:border-blue-400 transition-colors">
                        <input type="number" min="20" value={imgSize[key] || 0}
                          onChange={e => setImgSize(s => ({ ...s, [key]: Number(e.target.value) }))}
                          className="w-full text-xs text-gray-900 outline-none bg-transparent cursor-text" />
                        <span className="text-[10px] text-gray-500">px</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-semibold text-gray-900 mb-2">Position</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[['X', 'x'], ['Y', 'y']].map(([label, key]) => (
                    <div key={key}>
                      <p className="text-[9px] text-gray-500 mb-1">{label}</p>
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1.5 bg-surface focus-within:border-blue-400 transition-colors">
                        <input type="number" value={imgPos[key] || 0}
                          onChange={e => setImgPos(p => ({ ...p, [key]: Number(e.target.value) }))}
                          className="w-full text-xs text-gray-900 outline-none bg-transparent cursor-text" />
                        <span className="text-[10px] text-gray-500">px</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-semibold text-gray-900 mb-2">Rotation</p>
                <div className="flex items-center gap-2 mb-4">
                  <input type="range" min={-180} max={180} value={rotation}
                    onChange={e => setRotation(Number(e.target.value))}
                    className="flex-1 accent-blue-500" />
                  <span className="text-xs text-gray-500 w-10 text-right">{rotation}°</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setFlipped(f => !f)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${flipped ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                    <FlipHorizontal2 className="w-3.5 h-3.5" /> Flip
                  </button>
                  <button onClick={() => { setImgPos({ x: 0, y: 0 }); setRotation(0); setFlipped(false); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:border-gray-400 transition-all cursor-pointer">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BACKGROUND */}
          {activePanel === 'background' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
                <span className="font-semibold text-sm text-gray-900">Background</span>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
                <span className="text-xs text-gray-900">Remove original backgrounds</span>
                <Toggle enabled={removeOrigBg} onChange={v => { setRemoveOrigBg(v); if (v && originalFile) doRemoveBg(originalFile); }} />
              </div>
              <div className="flex border-b border-gray-200 flex-shrink-0">
                {[['color', 'Color'], ['image', 'Image'], ['ai', 'AI']].map(([id, name]) => (
                  <button key={id} onClick={() => setBgTab(id)}
                    className={`flex-1 py-2 text-[11px] font-medium transition-colors border-b-2 cursor-pointer ${bgTab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                    {name}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                {bgTab === 'color' && (
                  <>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Standard</p>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {STANDARD_COLORS.map(c => <ColorSwatch key={c} color={c} selected={selectedColor === c} onClick={() => setSelectedColor(c)} />)}
                      <label className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 overflow-hidden flex items-center justify-center hover:border-blue-400 transition-colors" style={{ background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }}>
                        <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); setSelectedColor(e.target.value); }} className="opacity-0 w-0 h-0" />
                      </label>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Neutral tones</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {NEUTRAL_TONES.map(c => <ColorSwatch key={c} color={c} selected={selectedColor === c} onClick={() => setSelectedColor(c)} />)}
                    </div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Soft pastels</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SOFT_PASTELS.map(c => <ColorSwatch key={c} color={c} selected={selectedColor === c} onClick={() => setSelectedColor(c)} />)}
                    </div>
                  </>
                )}
                {bgTab === 'image' && (
                  <>
                    <button onClick={() => bgFileInputRef.current?.click()}
                      className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" /> Upload custom background
                    </button>
                    <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgFileChange} />
                    {IMAGE_BG_CATEGORIES.map(cat => {
                      const bgs = IMAGE_BACKGROUNDS.filter(b => b.category === cat);
                      return (
                        <div key={cat} className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 mb-2">{cat}</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {bgs.map(bg => (
                              <button key={bg.id} onClick={() => applySceneBackground(bg)}
                                className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer hover:shadow-md ${selectedBgImage === bg.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
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
                      placeholder="e.g. luxury marble counter with soft studio lighting…"
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 outline-none resize-none focus:border-blue-400 bg-gray-100 cursor-text transition-colors" rows={4} />
                    <button onClick={generateAiBg} disabled={applyingAiBg || !aiPrompt.trim()}
                      className="mt-2 w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer active:scale-95 hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                      {applyingAiBg ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</span> : '✨ Generate AI Background'}
                    </button>
                    <p className="text-[9px] text-gray-500 mt-2 text-center">Uses AI image generation credits</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI SHADOWS */}
          {activePanel === 'shadows' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
                <span className="font-semibold text-sm text-gray-900">AI Shadows</span>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <p className="text-xs text-gray-500 mb-3">Choose a shadow style for your product</p>
                <div className="grid grid-cols-2 gap-2">
                  {SHADOW_PRESETS.map(s => (
                    <button key={s.id} onClick={() => setSelectedShadow(s.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${selectedShadow === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-200'}`}>
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                        <div className="w-8 h-8 bg-surface border border-gray-200 rounded-lg" style={s.style} />
                      </div>
                      <span className="text-xs font-medium text-gray-900">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Canvas area ── */}
        <div className="flex-1 flex flex-col bg-[#e8e8e8] dark:bg-canvas relative overflow-hidden">
          <button onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 bg-surface rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-500 shadow-sm cursor-pointer transition-all">
            <X className="w-4 h-4 text-gray-500" />
          </button>

          <div className="absolute top-3.5 left-4 z-20 text-xs text-gray-500">
            {batchMode
              ? (() => {
                  const done = batchItems.filter(it => it.status === 'done').length;
                  const failed = batchItems.filter(it => it.status === 'error').length;
                  return done + failed < batchItems.length
                    ? `Processing ${done + failed}/${batchItems.length}…`
                    : `${done} image${done !== 1 ? 's' : ''} ready${failed ? ` · ${failed} failed` : ''} · one style applies to all`;
                })()
              : removing
              ? `Removing background… ${removingProgress > 0 ? `${removingProgress}%` : 'loading model'}`
              : removedUrl ? 'Background removed ✓'
              : 'Upload an image to start'}
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center p-8 overflow-auto">
            {removing ? (
              <div className="flex flex-col items-center gap-4 w-60">
                <div className="w-20 h-20 rounded-2xl bg-surface shadow-lg flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
                <div className="text-center w-full">
                  <p className="text-gray-900 font-semibold mb-2">Removing background…</p>
                  {removingProgress > 0 ? (
                    <>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${removingProgress}%` }} />
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{removingProgress}%</p>
                    </>
                  ) : <p className="text-gray-500 text-xs">Loading model…</p>}
                </div>
              </div>
            ) : originalUrl ? (
              <div className="flex flex-col items-center gap-4">
                {/* ── Interactive Canvas ── */}
                <div
                  ref={canvasRef}
                  className="rounded-xl overflow-hidden shadow-2xl relative select-none"
                  style={{
                    width: canvasW,
                    height: canvasH,
                    ...getCanvasBg(),
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center',
                  }}
                  onClick={onCanvasClick}
                >
                  {/* bg image layer */}
                  {bgTab === 'image' && bgImageUrl && !aiResultUrl && !showBefore && (
                    <img src={bgImageUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                  )}

                  {(() => {
                    const activeItem = batchMode ? batchItems[activeIndex] : null;
                    const itemProcessing = activeItem && activeItem.status !== 'done' && activeItem.status !== 'error';
                    if (applyingAiBg || itemProcessing) {
                      return (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 z-10">
                          <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow" />
                          <p className="text-white text-xs font-medium drop-shadow">
                            {applyingAiBg ? 'Applying background…' : 'Removing background…'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {imgInitialized && displayUrl ? (
                    /* ── Draggable / resizable image ── */
                    <div
                      style={{
                        position: 'absolute',
                        left: imgLeft,
                        top: imgTop,
                        width: imgSize.w,
                        height: imgSize.h,
                        transform: `rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`,
                        transformOrigin: 'center',
                        cursor: selected ? 'move' : 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={e => { e.stopPropagation(); setSelected(true); }}
                      onMouseDown={selected ? onDragMouseDown : undefined}
                    >
                      {/* The image */}
                      <img
                        src={displayUrl}
                        alt="product"
                        draggable={false}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                          ...shadowStyle,
                          pointerEvents: 'none',
                        }}
                      />

                      {/* Selection outline + handles */}
                      {selected && (
                        <>
                          {/* Dashed border */}
                          <div className="absolute inset-0 pointer-events-none"
                            style={{ border: '2px solid #3b82f6', borderRadius: 2 }} />

                          {/* Resize handles */}
                          {HANDLES.map(h => (
                            <div
                              key={h.id}
                              onMouseDown={e => { e.stopPropagation(); onResizeMouseDown(e, h.id); }}
                              style={{
                                position: 'absolute',
                                width: 10,
                                height: 10,
                                background: 'white',
                                border: '2px solid #3b82f6',
                                borderRadius: 2,
                                cursor: h.cursor,
                                zIndex: 10,
                                ...h.style,
                              }}
                            />
                          ))}

                          {/* Floating toolbar above image */}
                          <div
                            className="absolute flex items-center gap-0.5 bg-surface rounded-lg shadow-lg border border-gray-200 px-1.5 py-1"
                            style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8, whiteSpace: 'nowrap' }}
                            onMouseDown={e => e.stopPropagation()}
                          >
                            <button
                              onClick={e => { e.stopPropagation(); setRotation(r => r - 90); }}
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition-colors" title="Rotate -90°">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setFlipped(f => !f); }}
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition-colors" title="Flip horizontal">
                              <FlipHorizontal2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-px h-4 bg-gray-100 mx-0.5" />
                            <span className="text-[10px] text-gray-500 px-1">{imgSize.w} × {imgSize.h}</span>
                            <div className="w-px h-4 bg-gray-100 mx-0.5" />
                            <button
                              onClick={e => { e.stopPropagation(); setOriginalUrl(null); setRemovedUrl(null); setAiResultUrl(null); setSelected(false); setImgInitialized(false); }}
                              className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-500 transition-colors" title="Remove image">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Before / After toggle */}
                {removedUrl && (
                  <div className="flex bg-surface rounded-full shadow border border-gray-200 overflow-hidden text-xs font-medium">
                    <button onClick={() => setShowBefore(false)} className={`px-5 py-1.5 transition-colors cursor-pointer ${!showBefore ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>After</button>
                    <button onClick={() => setShowBefore(true)}  className={`px-5 py-1.5 transition-colors cursor-pointer ${showBefore ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Before</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-2xl bg-surface shadow flex items-center justify-center group-hover:shadow-md group-hover:bg-blue-50 transition-all">
                  <Upload className="w-10 h-10 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-gray-500 font-medium group-hover:text-gray-900 transition-colors">Upload an image to get started</p>
                <p className="text-gray-500 text-xs">PNG, JPG or WEBP</p>
              </div>
            )}
          </div>

          {/* Batch filmstrip */}
          {batchMode && (
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-surface/80 backdrop-blur-sm border-t border-gray-200 overflow-x-auto hide-scrollbar">
              {batchItems.map((it, i) => (
                <button key={i} onClick={() => selectBatchItem(i)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${i === activeIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-200'}`}
                  title={it.name} style={it.removedUrl ? previewBgStyle : checkerBg}>
                  <img src={it.removedUrl || it.originalUrl} alt={it.name}
                    className="absolute inset-0 w-full h-full object-contain p-1" />
                  {it.status !== 'done' && it.status !== 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                  {it.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/30">
                      <X className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Bottom toolbar */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-surface/90 backdrop-blur-sm border-t border-gray-200">
            <div className="flex items-center gap-2">
              {batchMode ? (
                <button onClick={handleDownloadAll} disabled={downloadingAll || !batchItems.some(it => it.status === 'done')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  {downloadingAll
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Downloading…</>
                    : <><Download className="w-3.5 h-3.5" /> Download all ({batchItems.filter(it => it.status === 'done').length})</>}
                </button>
              ) : (
                <button onClick={handleDownload} disabled={!originalUrl || removing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              )}
              {batchMode && (
                <button onClick={handleDownload} disabled={!removedUrl}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-100 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Download className="w-3 h-3" /> This one
                </button>
              )}
              {!batchMode && removedUrl && !removing && (
                <button onClick={() => originalFile && doRemoveBg(originalFile)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-100 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-all active:scale-95">
                  <RefreshCw className="w-3 h-3" /> Re-process
                </button>
              )}
              {selected && (
                <span className="text-xs text-gray-500 ml-2">
                  Arrow keys to nudge · Shift+Arrow for 10px
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 bg-surface rounded-full border border-gray-200 shadow-sm px-2 py-1">
              <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"><Minus className="w-3 h-3 text-gray-500" /></button>
              <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"><Plus className="w-3 h-3 text-gray-500" /></button>
              <HelpCircle className="w-3.5 h-3.5 text-gray-500 ml-1 cursor-help" />
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}