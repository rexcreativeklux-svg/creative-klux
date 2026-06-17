import { useState, useRef, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import {
    X, Undo, Redo, Plus, Download, Share2, ChevronRight,
    AlignCenter, AlignVerticalJustifyCenter,
    Scissors, Pencil, Sun, Layers, Box, LayoutTemplate,
    Sparkles, SlidersHorizontal, ImageIcon, Type, Loader2,
    FlipHorizontal, Upload, Trash2, Copy, Eye, EyeOff, ChevronUp, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const topTools = [
    { id: 'insert', label: 'Insert', icon: Plus },
    { id: 'brandit', label: 'Brand Kit', icon: ImageIcon },
    { id: 'addtext', label: 'Add text', icon: Type },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'backgrounds', label: 'Backgrounds', icon: Box },
    { id: 'layers', label: 'Layers', icon: Layers },
    { id: 'aishadows', label: 'AI Shadows', icon: Sun },
    { id: 'resize', label: 'Resize', icon: SlidersHorizontal },
];

// Logical design-canvas size (matches the preview box). Exports render at 2×.
const CANVAS_W = 520;
const CANVAS_H = 440;
const EXPORT_SCALE = 2;

// ── Brand Kit fonts (curated Google Fonts; loaded on demand) ──────────────
const BRAND_FONTS = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway',
    'Oswald', 'Merriweather', 'Playfair Display', 'Nunito', 'Work Sans', 'DM Sans',
    'Source Sans 3', 'Rubik', 'Bebas Neue', 'Anton', 'Pacifico', 'Lobster',
    'Dancing Script', 'Caveat', 'Archivo', 'Manrope', 'Quicksand', 'Josefin Sans',
    'Mulish', 'Karla', 'Space Grotesk', 'Libre Baskerville', 'PT Serif',
    'Abril Fatface', 'Comfortaa', 'Teko', 'Fredoka', 'Cormorant Garamond',
];
const googleFontHref = (family) =>
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;700&display=swap`;

// Inject a Google Fonts <link> once per family (idempotent). Returns a promise
// that resolves when the face is usable, so canvas export renders the right font.
const loadWebFont = (family) => {
    if (typeof document === 'undefined' || !family) return Promise.resolve();
    const id = `ck-font-${family.replace(/\s+/g, '-').toLowerCase()}`;
    if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = googleFontHref(family);
        document.head.appendChild(link);
    }
    return document.fonts?.load
        ? document.fonts.load(`16px "${family}"`).then(() => document.fonts.load(`700 16px "${family}"`)).catch(() => {})
        : Promise.resolve();
};

// ── Add-text style presets (Photoroom-style "text styles") ────────────────
// Each becomes a text layer; fonts come from BRAND_FONTS so loadWebFont works.
const TEXT_STYLE_CATEGORIES = ['All', 'Celebration', 'Labels', 'Sale', 'Promo'];
const TEXT_STYLES = [
    { id: 'new',       text: 'NEW',            category: 'Labels',      fontFamily: 'Anton',             fontWeight: '400', color: '#ffffff', bgColor: '#111111', radius: 4,   fontSize: 44, w: 170, h: 66 },
    { id: 'natural',   text: 'Natural',        category: 'Labels',      fontFamily: 'Dancing Script',    fontWeight: '700', color: '#c9a27a',                                fontSize: 50, w: 240, h: 72 },
    { id: 'medium',    text: 'MEDIUM',         category: 'Labels',      fontFamily: 'Oswald',            fontWeight: '700', color: '#ffffff', bgColor: '#3b5b73', radius: 4,   fontSize: 40, w: 240, h: 74 },
    { id: 'hbd',       text: 'Happy\nBirthday!', category: 'Celebration', fontFamily: 'Pacifico',        fontWeight: '400', color: '#f4a6b0', bgColor: '#fdecee', radius: 14,  fontSize: 30, w: 230, h: 120 },
    { id: 'large',     text: 'LARGE',          category: 'Labels',      fontFamily: 'Archivo',           fontWeight: '700', color: '#111827', bgColor: '#e5e7eb', radius: 6,   fontSize: 46, w: 240, h: 82 },
    { id: 'today',     text: 'TODAY',          category: 'Labels',      fontFamily: 'Josefin Sans',      fontWeight: '400', color: '#111827',                                fontSize: 48, w: 240, h: 72 },
    { id: 'healthy',   text: 'Healthy',        category: 'Labels',      fontFamily: 'Playfair Display',  fontWeight: '700', color: '#f0a08a',                                fontSize: 50, w: 240, h: 72 },
    { id: 'tagus',     text: 'Tag us',         category: 'Promo',       fontFamily: 'Cormorant Garamond', fontWeight: '700', color: '#6b6b5a', bgColor: '#e8e4d8', radius: 999, fontSize: 32, w: 120, h: 120 },
    { id: 'signmeup',  text: 'Sign me up!',    category: 'Promo',       fontFamily: 'Caveat',            fontWeight: '700', color: '#111827',                                fontSize: 46, w: 240, h: 72 },
    { id: 'tagus2',    text: 'TAG US',         category: 'Promo',       fontFamily: 'Oswald',            fontWeight: '700', color: '#111827',                                fontSize: 50, w: 240, h: 72 },
    { id: 'likeshare', text: 'Like & Share',   category: 'Celebration', fontFamily: 'Lobster',           fontWeight: '400', color: '#2f7d6b',                                fontSize: 42, w: 320, h: 72 },
    { id: 'thankyou',  text: 'Thank you',      category: 'Celebration', fontFamily: 'Pacifico',          fontWeight: '400', color: '#8aa9d6',                                fontSize: 42, w: 280, h: 72 },
    { id: 'sale',      text: 'SALE',           category: 'Sale',        fontFamily: 'Anton',             fontWeight: '400', color: '#ffffff', bgColor: '#ef4444', radius: 6,   fontSize: 50, w: 210, h: 76 },
    { id: 'off',       text: '50% OFF',        category: 'Sale',        fontFamily: 'Archivo',           fontWeight: '700', color: '#ef4444',                                fontSize: 44, w: 240, h: 72 },
    { id: 'hotdeal',   text: 'HOT DEAL',       category: 'Sale',        fontFamily: 'Oswald',            fontWeight: '700', color: '#ffffff', bgColor: '#f97316', radius: 6,   fontSize: 38, w: 250, h: 74 },
    { id: 'congrats',  text: 'Congrats!',      category: 'Celebration', fontFamily: 'Dancing Script',    fontWeight: '700', color: '#7c3aed',                                fontSize: 50, w: 260, h: 72 },
];

const SHAPE_COLORS = ['#7c3aed', '#2563eb', '#f97316', '#ef4444', '#22c55e', '#eab308', '#111827', '#ffffff'];
// 5-point star in a 0..100 viewbox (used for preview + export).
const STAR_POINTS = [[50, 2], [61, 35], [98, 35], [68, 57], [79, 91], [50, 70], [21, 91], [32, 57], [2, 35], [39, 35]];
const STAR_PTS_STR = STAR_POINTS.map((p) => p.join(',')).join(' ');

// ── Insert asset library (all drawn from SVG paths / unicode — no licensed art) ──
const BLOBS = [
    'M50 8 C68 8 90 20 90 42 C90 62 80 74 64 84 C50 92 30 92 18 80 C6 68 8 46 16 32 C24 18 34 8 50 8 Z',
    'M52 6 C72 8 86 22 88 42 C90 60 82 70 70 82 C56 96 34 94 20 82 C8 72 10 48 14 34 C18 18 34 4 52 6 Z',
    'M50 10 C66 6 84 16 88 34 C92 52 86 66 74 78 C60 92 38 94 24 82 C10 70 8 48 16 32 C22 18 36 12 50 10 Z',
    'M48 8 C66 4 88 18 90 40 C92 60 76 70 66 84 C54 98 32 92 20 80 C6 66 10 44 16 30 C22 16 34 10 48 8 Z',
];
const ARROWS = [
    'M8 42 L62 42 L62 26 L94 50 L62 74 L62 58 L8 58 Z',
    'M5 38 L58 38 L58 20 L96 50 L58 80 L58 62 L5 62 Z',
    'M30 22 L82 22 L82 74 L66 74 L66 50 L26 84 L16 74 L56 34 L30 34 Z',
];
const LINES = [
    { d: 'M6 50 H94', sw: 8 },
    { d: 'M6 50 H94', sw: 3 },
    { d: 'M6 50 H86 M86 50 L76 42 M86 50 L76 58', sw: 5 },
    { d: 'M14 50 H86 M14 50 L22 43 M14 50 L22 57 M86 50 L78 43 M86 50 L78 57', sw: 4 },
];
const BUBBLES = [
    'M12 12 H88 V64 H44 L26 86 L32 64 H12 Z',
    'M50 12 C76 12 92 26 92 44 C92 60 76 74 50 74 C44 74 39 73 34 72 L18 86 L25 68 C14 61 8 53 8 44 C8 26 24 12 50 12 Z',
    'M14 14 H86 A8 8 0 0 1 94 22 V58 A8 8 0 0 1 86 66 H40 L24 84 L30 66 H14 A8 8 0 0 1 6 58 V22 A8 8 0 0 1 14 14 Z',
];
const INSERT_EMOJIS = ['😀', '😍', '🥳', '🔥', '✨', '💯', '❤️', '👍', '🎉', '⭐', '🛍️', '🏷️', '💖', '😎', '🤩', '💎', '🌟', '⚡', '🎁', '💸', '✅', '🚀', '👏', '🥰'];
const REACTIONS = ['❤️', '😍', '😂', '👍', '🔥', '🙌', '😮', '🎉', '💯', '🥰', '👏', '😎'];
const INDEXES = ['1', '2', '3', '4', '5', '6'];
const PROMO = [
    { text: 'NEW', fill: '#ef4444' }, { text: 'SALE', fill: '#ef4444' },
    { text: '-20%', fill: '#111827' }, { text: '-50%', fill: '#111827' },
    { text: 'HOT', fill: '#f97316' }, { text: 'FREE', fill: '#22c55e' },
];
const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL'];

const INSERT_LIBRARY = [
    { id: 'classics', label: 'Classics', colorable: true, items: [
        { type: 'shape', shape: 'circle' }, { type: 'shape', shape: 'triangle' },
        { type: 'shape', shape: 'rect' }, { type: 'shape', shape: 'star' },
    ] },
    { id: 'blobs', label: 'Blobs', colorable: true, items: BLOBS.map((d) => ({ type: 'path', d })) },
    { id: 'arrows', label: 'Arrows', colorable: true, items: ARROWS.map((d) => ({ type: 'path', d })) },
    { id: 'lines', label: 'Lines', colorable: true, items: LINES.map((l) => ({ type: 'path', d: l.d, stroke: true, strokeWidth: l.sw, w: 170, h: 50 })) },
    { id: 'bubbles', label: 'Speech Bubbles', colorable: true, items: BUBBLES.map((d) => ({ type: 'path', d, w: 150, h: 130 })) },
    { id: 'emojis', label: 'Emojis', items: INSERT_EMOJIS.map((e) => ({ type: 'emoji', emoji: e })) },
    { id: 'reactions', label: 'Reactions', items: REACTIONS.map((e) => ({ type: 'emoji', emoji: e })) },
    { id: 'indexes', label: 'Indexes', items: INDEXES.map((t) => ({ type: 'badge', fill: '#111827', textColor: '#fff', text: t })) },
    { id: 'promo', label: 'Promotions', items: PROMO.map((p) => ({ type: 'badge', fill: p.fill, textColor: '#fff', text: p.text })) },
    { id: 'sizes', label: 'Sizes', items: SIZES.map((t) => ({ type: 'badge', fill: '#111827', textColor: '#fff', text: t })) },
];

// Apply the chosen colour to colourable items (shapes/paths).
function resolveItem(item, color) {
    if (item.type === 'shape') return { ...item, fill: color };
    if (item.type === 'path') return item.stroke ? { ...item, stroke: color, fill: 'none' } : { ...item, fill: color };
    return item;
}

// Shared visual for an item/layer — used by previews, the canvas, everywhere.
function VisualSVG({ spec }) {
    if (spec.type === 'image') return <img src={spec.src} draggable={false} className="w-full h-full object-contain pointer-events-none" alt="" />;
    if (spec.type === 'emoji') return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" className="pointer-events-none"><text x="50" y="54" fontSize="78" textAnchor="middle" dominantBaseline="central">{spec.emoji}</text></svg>
    );
    if (spec.type === 'badge') return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" className="pointer-events-none">
            <circle cx="50" cy="50" r="48" fill={spec.fill} />
            <text x="50" y="53" fontSize={spec.text.length > 3 ? 22 : 30} fontWeight="700" fill={spec.textColor} textAnchor="middle" dominantBaseline="central" fontFamily="system-ui, sans-serif">{spec.text}</text>
        </svg>
    );
    if (spec.type === 'shape') return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" className="pointer-events-none">
            {spec.shape === 'rect' && <rect x="0" y="0" width="100" height="100" fill={spec.fill} />}
            {spec.shape === 'circle' && <ellipse cx="50" cy="50" rx="50" ry="50" fill={spec.fill} />}
            {spec.shape === 'triangle' && <polygon points="50,0 100,100 0,100" fill={spec.fill} />}
            {spec.shape === 'star' && <polygon points={STAR_PTS_STR} fill={spec.fill} />}
        </svg>
    );
    if (spec.type === 'path') return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" className="pointer-events-none">
            <path d={spec.d} fill={spec.fill || 'none'} stroke={spec.stroke || 'none'} strokeWidth={spec.strokeWidth || 0} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    return null;
}

const loadImageEl = (src) => new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
});

// ── Backgrounds / Resize / Templates data ──
const ckpx = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`;
const BG_SOLIDS = ['#ffffff', '#000000', '#f4f4f5', '#1e293b', '#fde68a', '#fca5a5', '#a7f3d0', '#bfdbfe', '#ddd6fe', '#fbcfe8'];
const BG_GRADIENTS = [
    { from: '#f093fb', to: '#f5576c' }, { from: '#4facfe', to: '#00f2fe' },
    { from: '#43e97b', to: '#38f9d7' }, { from: '#fa709a', to: '#fee140' },
    { from: '#a18cd1', to: '#fbc2eb' }, { from: '#0f2027', to: '#2c5364' },
];
const BG_IMAGES = [7897470, 16042675, 3847496, 34658646, 7130564, 2463329, 6793893, 8559014].map(ckpx);
const gradientCss = (g) => `linear-gradient(135deg, ${g.from}, ${g.to})`;

// Curated colour palettes for the Backgrounds → Color tab.
const NEUTRAL_TONES = ['#f4f1ea', '#e7ded0', '#cdbfae', '#e9e7e2', '#dfe2dc', '#c2c8bf', '#fbfbf9', '#dfe3e6', '#c4ccd2', '#aab4bd', '#8b97a1', '#6b7780'];
const SOFT_PASTELS  = ['#fdf6e3', '#eaf3e0', '#e0ecf4', '#efe6f6', '#fbe7ea', '#f7e8da', '#f3ead8', '#e2efe0', '#dfeaf2', '#e8e0f0', '#f0dde0', '#f5e5d2'];
const VIBRANT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#111827', '#ffffff'];

// Image-background library (verified Pexels IDs, shared with the bg-remover).
const BG_LIBRARY = [
    { category: 'Podium',   ids: [7897470, 16042675, 16059552, 12932574, 12914280, 35073010] },
    { category: 'Minimal',  ids: [16149990, 6840026, 15067862, 12198526, 8015809, 8015461] },
    { category: 'Surface',  ids: [34658646, 3847496, 18325786, 7533765, 4705932, 7232667] },
    { category: 'Gradient', ids: [7130564, 7135055, 7135028, 7130557, 6985185, 7135024] },
    { category: 'Texture',  ids: [2463329, 3964666, 12901948, 12998745, 247719] },
    { category: 'Fabric',   ids: [7794365, 7533979, 6843273, 7988399, 8007352, 7956629] },
    { category: 'Nature',   ids: [6793893, 27394932, 19215108, 1478450, 30399673, 13246785] },
    { category: 'Paper',    ids: [8559014, 7457657, 9389596, 7953539, 36135531, 36135526] },
].map((g) => ({ category: g.category, images: g.ids.map(ckpx) }));

const RESIZE_PRESETS = [
    { id: 'original', label: 'Original', w: 520, h: 440 },
    { id: 'square', label: '1:1', w: 460, h: 460 },
    { id: 'portrait', label: '4:5', w: 416, h: 520 },
    { id: 'story', label: '9:16', w: 300, h: 533 },
    { id: 'landscape', label: '16:9', w: 540, h: 304 },
    { id: 'wide', label: '3:2', w: 540, h: 360 },
];

// ── Resize size presets (Photoroom-style, real target dimensions) ─────────
const RESIZE_GROUPS = [
    {
        title: 'Standard', items: [
            { id: 'std-land', label: 'Landscape', w: 2016, h: 1512, ratio: '4:3', color: '#6b7280' },
            { id: 'std-port', label: 'Portrait',  w: 1512, h: 2016, ratio: '3:4', color: '#6b7280' },
            { id: 'std-sq',   label: 'Square',     w: 1512, h: 1512, ratio: '1:1', color: '#6b7280' },
        ],
    },
    {
        title: 'Social Media sizes', items: [
            { id: 'ig-story',  label: 'Instagram Story',   w: 1080, h: 1920, ratio: '9:16',   color: '#E1306C' },
            { id: 'ig-post',   label: 'Instagram Post',    w: 1080, h: 1080, ratio: '1:1',    color: '#E1306C' },
            { id: 'ig-post45', label: 'Instagram Post',    w: 1080, h: 1350, ratio: '4:5',    color: '#E1306C' },
            { id: 'ig-reel',   label: 'Instagram Reel',    w: 1080, h: 1920, ratio: '9:16',   color: '#E1306C' },
            { id: 'tt-post',   label: 'TikTok Post',       w: 1080, h: 1920, ratio: '9:16',   color: '#111111' },
            { id: 'tt-thumb',  label: 'TikTok Thumbnail',  w: 1080, h: 1440, ratio: '3:4',    color: '#111111' },
            { id: 'yt-cover',  label: 'Youtube Cover',     w: 1280, h: 720,  ratio: '16:9',   color: '#FF0000' },
            { id: 'yt-art',    label: 'Youtube Channel Art', w: 2560, h: 1440, ratio: '16:9', color: '#FF0000' },
            { id: 'fb-cover',  label: 'Facebook Cover',    w: 820,  h: 312,  ratio: '2.39:1', color: '#1877F2' },
            { id: 'fb-post',   label: 'Facebook Post',     w: 1200, h: 628,  ratio: '1.85:1', color: '#1877F2' },
            { id: 'li-banner', label: 'LinkedIn Banner',   w: 820,  h: 312,  ratio: '2.39:1', color: '#0A66C2' },
            { id: 'li-pfp',    label: 'LinkedIn Profile Picture', w: 800, h: 800, ratio: '1:1', color: '#0A66C2' },
            { id: 'wa-sticker', label: 'WhatsApp Sticker', w: 512,  h: 512,  ratio: '1:1',    color: '#25D366' },
            { id: 'pin',       label: 'Pinterest',         w: 735,  h: 1102, ratio: '2:3',    color: '#E60023' },
            { id: 'line',      label: 'Line',              w: 1040, h: 1040, ratio: '1:1',    color: '#06C755' },
        ],
    },
    {
        title: 'Marketplace sizes', items: [
            { id: 'mp-fb',     label: 'Facebook Marketplace', w: 1080, h: 1080, ratio: '1:1', color: '#1877F2' },
            { id: 'mp-ebay',   label: 'eBay',          w: 1600, h: 1600, ratio: '1:1', color: '#E53238' },
            { id: 'mp-posh',   label: 'Poshmark',      w: 1080, h: 1080, ratio: '1:1', color: '#7f0353' },
            { id: 'mp-depop',  label: 'Depop',         w: 1280, h: 1280, ratio: '1:1', color: '#FF2300' },
            { id: 'mp-merc',   label: 'Mercari',       w: 1080, h: 1080, ratio: '1:1', color: '#FF0211' },
            { id: 'mp-ml',     label: 'Mercado Libre', w: 1080, h: 1080, ratio: '1:1', color: '#2D3277' },
            { id: 'mp-shopee', label: 'Shopee',        w: 1080, h: 1080, ratio: '1:1', color: '#EE4D2D' },
            { id: 'mp-lazada', label: 'Lazada',        w: 1080, h: 1080, ratio: '1:1', color: '#F0508C' },
            { id: 'mp-etsy-sq', label: 'Etsy Square',  w: 2048, h: 2048, ratio: '1:1', color: '#F1641E' },
            { id: 'mp-etsy-ld', label: 'Etsy Landscape', w: 2700, h: 2025, ratio: '4:3', color: '#F1641E' },
            { id: 'mp-vinted', label: 'Vinted',        w: 800,  h: 600,  ratio: '4:3', color: '#09B1BA' },
            { id: 'mp-amazon', label: 'Amazon',        w: 2000, h: 2000, ratio: '1:1', color: '#FF9900' },
            { id: 'mp-shop-sq', label: 'Shopify Square', w: 2048, h: 2048, ratio: '1:1', color: '#95BF47' },
            { id: 'mp-shop-ld', label: 'Shopify Landscape', w: 2000, h: 1800, ratio: '10:9', color: '#95BF47' },
            { id: 'mp-shop-pt', label: 'Shopify Portrait', w: 1600, h: 2000, ratio: '4:5', color: '#95BF47' },
        ],
    },
];

// Simple starter templates — each adds a set of overlay layers (+ optional bg).
const TEMPLATES_PRESETS = [
    {
        id: 'sale', label: 'Sale',
        bg: { type: 'gradient', from: '#fa709a', to: '#fee140' },
        layers: [
            { type: 'badge', fill: '#ef4444', textColor: '#fff', text: 'SALE', w: 96, h: 96, x: 90, y: 90 },
            { type: 'text', text: 'Up to 50% OFF', color: '#111111', fontWeight: '800', align: 'center', fontSize: 34, w: 300, h: 60, x: 260, y: 380 },
        ],
    },
    {
        id: 'new', label: 'New Drop',
        bg: { type: 'color', value: '#111827' },
        layers: [
            { type: 'badge', fill: '#22c55e', textColor: '#fff', text: 'NEW', w: 90, h: 90, x: 90, y: 90 },
            { type: 'text', text: 'Just Landed', color: '#ffffff', fontWeight: '800', align: 'center', fontSize: 36, w: 320, h: 60, x: 260, y: 380 },
        ],
    },
    {
        id: 'headline', label: 'Headline',
        bg: { type: 'none' },
        layers: [
            { type: 'text', text: 'Your headline here', color: '#111111', fontWeight: '800', align: 'center', fontSize: 40, w: 380, h: 70, x: 260, y: 70 },
            { type: 'path', d: 'M6 50 H94', stroke: '#7c3aed', strokeWidth: 6, w: 200, h: 30, x: 260, y: 120 },
        ],
    },
];

// ── Photoroom-style Templates (grouped, searchable) ───────────────────────
// Each item carries an `apply` describing the editor-state change it makes.
const STUDIO_BG = [
    { id: 'st-sage',  label: 'Sage',  bg: { type: 'gradient', from: '#dce7d5', to: '#c4d8bf' } },
    { id: 'st-sky',   label: 'Sky',   bg: { type: 'gradient', from: '#d6e4f0', to: '#bcd4ea' } },
    { id: 'st-blush', label: 'Blush', bg: { type: 'gradient', from: '#f6dcd2', to: '#f0c9bd' } },
    { id: 'st-sand',  label: 'Sand',  bg: { type: 'gradient', from: '#efe6d6', to: '#e2d3ba' } },
    { id: 'st-lilac', label: 'Lilac', bg: { type: 'gradient', from: '#e4ddf2', to: '#ccbff0' } },
    { id: 'st-slate', label: 'Slate', bg: { type: 'gradient', from: '#1e293b', to: '#0f172a' } },
];
const FILTER_TEMPLATES = [
    { id: 'f-gray',   label: 'Grayscale', filter: 'grayscale' },
    { id: 'f-sepia',  label: 'Sepia',     filter: 'sepia' },
    { id: 'f-warm',   label: 'Warm',      filter: 'warm' },
    { id: 'f-cool',   label: 'Cool',      filter: 'cool' },
    { id: 'f-invert', label: 'Invert',    filter: 'invert' },
    { id: 'f-blur',   label: 'Blur',      blur: 6 },
];
const SIZE_TEMPLATES = [
    { id: 'sz-1-1',  label: 'Square 1:1',   w: 460, h: 460 },
    { id: 'sz-4-5',  label: 'Portrait 4:5', w: 416, h: 520 },
    { id: 'sz-9-16', label: 'Story 9:16',   w: 300, h: 533 },
    { id: 'sz-16-9', label: 'Wide 16:9',    w: 540, h: 304 },
];
const PROFILE_TEMPLATES = [
    { id: 'pf-sunset', label: 'Sunset', from: '#f857a6', to: '#ff5858' },
    { id: 'pf-ocean',  label: 'Ocean',  from: '#2193b0', to: '#6dd5ed' },
    { id: 'pf-grape',  label: 'Grape',  from: '#7f00ff', to: '#e100ff' },
];
// CSS filter string for thumbnail previews (mirrors the editor's imageFilter map).
const staticFilterCss = (name) => ({
    grayscale: 'grayscale(1)', sepia: 'sepia(1)', invert: 'invert(0.2)',
    warm: 'sepia(0.3) saturate(1.4)', cool: 'hue-rotate(30deg) saturate(0.9)',
}[name] || 'none');

const TEMPLATE_GROUPS = [
    {
        title: 'Classics', items: [
            { id: 'cl-white', label: 'White',       swatch: '#ffffff', apply: { bg: { type: 'color', value: '#ffffff' }, round: false } },
            { id: 'cl-black', label: 'Black',       swatch: '#000000', apply: { bg: { type: 'color', value: '#000000' }, round: false } },
            { id: 'cl-trans', label: 'Transparent', checker: true,     apply: { bg: { type: 'none' }, round: false } },
            { id: 'cl-orig',  label: 'Original',                       apply: { bg: { type: 'none' }, removeBg: false, round: false } },
        ],
    },
    { title: 'Studio',      items: STUDIO_BG.map((s) => ({ id: s.id, label: s.label, apply: { bg: s.bg, round: false } })) },
    { title: 'Backgrounds', items: BG_IMAGES.map((src, i) => ({ id: `bg-${i}`, label: `Scene ${i + 1}`, apply: { bg: { type: 'image', src }, round: false } })) },
    { title: 'Photo Filters', items: FILTER_TEMPLATES.map((f) => ({ id: f.id, label: f.label, apply: { filter: f.filter, blur: f.blur } })) },
    { title: 'Sizes',       items: SIZE_TEMPLATES.map((s) => ({ id: s.id, label: s.label, apply: { size: { w: s.w, h: s.h }, bg: { type: 'color', value: '#ffffff' }, round: false } })) },
    { title: 'Profile Pics', items: PROFILE_TEMPLATES.map((p) => ({ id: p.id, label: p.label, apply: { size: { w: 460, h: 460 }, round: true, bg: { type: 'gradient', from: p.from, to: p.to } } })) },
    { title: 'Promo',       items: TEMPLATES_PRESETS.map((t) => ({ id: `promo-${t.id}`, label: t.label, apply: { bg: t.bg, layers: t.layers, round: false } })) },
];

function Toggle({ enabled, onChange }) {
    return (
        <button
            onClick={e => { e.stopPropagation(); onChange(!enabled); }}
            className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${enabled ? 'bg-blue-600' : 'bg-gray-100'}`}
        >
            <span className={`absolute top-0.5 w-4 h-4 bg-surface rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
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
                className="flex-1 h-1.5 accent-blue-600"
            />
            <span className="text-xs text-gray-500 w-8 text-right">{value}{unit}</span>
        </div>
    );
}

export default function PhotoEditor({ mode, onClose, initialImageUrl }) {
    const { uploadImage, myImages = [], activeBrand, sendUrl } = useAuth();
    const fileInputRef = useRef(null);
    const imgRef = useRef(null);
    const insertFileRef = useRef(null);
    const [saving, setSaving] = useState(false);

    // ── Layer system (overlay elements on top of the base image) ──────────
    const [layers, setLayers] = useState([]);
    const [selectedLayerId, setSelectedLayerId] = useState(null);
    const [editingLayerId, setEditingLayerId] = useState(null); // text layer being edited inline
    const [activeTool, setActiveTool] = useState(null); // null = image-edit panel; 'insert' = Insert panel
    const [insertCat, setInsertCat] = useState(null); // open category id within the Insert panel
    const [shapeColor, setShapeColor] = useState(SHAPE_COLORS[0]);
    const layerDragRef = useRef(null);

    // ── Brand Kit (logos / colour palettes / fonts) ───────────────────────
    // Seeded from the API brand, extended by the user, persisted per-brand in
    // localStorage (backend has no multi-asset brand-kit storage yet).
    const [kit, setKit] = useState(null); // { logos:[url], palettes:[{id,name,colors:[]}], fonts:[family] }
    const kitLoadedRef = useRef(false);
    const [kitTab, setKitTab] = useState('logos'); // logos | colors | fonts | import
    const [kitUrl, setKitUrl] = useState('');
    const [kitImporting, setKitImporting] = useState(false);
    const [fontQuery, setFontQuery] = useState('');
    const kitLogoInputRef = useRef(null);

    // ── Add Text panel ────────────────────────────────────────────────────
    const [textStyleCat, setTextStyleCat] = useState('All');
    const [textStyleQuery, setTextStyleQuery] = useState('');
    const kitStorageKey = `ck_brandkit_${activeBrand?.id || 'none'}`;

    const seedKitFromBrand = (b) => ({
        logos: b?.logo ? [b.logo] : [],
        palettes: [{
            id: 'brand',
            name: b?.name || 'Brand colors',
            colors: [b?.primary_color, b?.secondary_color].filter(Boolean),
        }].filter((p) => p.colors.length),
        fonts: b?.fonts ? [b.fonts] : [],
    });

    // Load (or seed) the kit whenever the active brand changes.
    useEffect(() => {
        kitLoadedRef.current = false;
        let next = null;
        try {
            const stored = localStorage.getItem(kitStorageKey);
            if (stored) next = JSON.parse(stored);
        } catch { /* ignore */ }
        if (!next) next = seedKitFromBrand(activeBrand);
        // Normalise shape.
        next = {
            logos: Array.isArray(next.logos) ? next.logos : [],
            palettes: Array.isArray(next.palettes) && next.palettes.length
                ? next.palettes
                : seedKitFromBrand(activeBrand).palettes,
            fonts: Array.isArray(next.fonts) ? next.fonts : [],
        };
        setKit(next);
        // Pre-load any saved fonts so they render immediately.
        next.fonts.forEach((f) => loadWebFont(f));
        kitLoadedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBrand?.id]);

    // Persist on change (after the initial load).
    useEffect(() => {
        if (!kit || !kitLoadedRef.current) return;
        try { localStorage.setItem(kitStorageKey, JSON.stringify(kit)); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kit]);

    // Preload preset + kit fonts when the Add Text panel opens so previews render.
    useEffect(() => {
        if (activeTool !== 'addtext') return;
        TEXT_STYLES.forEach((s) => s.fontFamily && loadWebFont(s.fontFamily));
        (kit?.fonts || []).forEach((f) => loadWebFont(f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTool]);

    // Load recent resize presets once.
    useEffect(() => {
        try { const s = localStorage.getItem('ck_resize_recent'); if (s) setRecentSizes(JSON.parse(s)); } catch { /* ignore */ }
    }, []);

    // Canvas background (behind the cut-out) + canvas size (Resize).
    const [canvasBg, setCanvasBg] = useState({ type: 'none' }); // {type:'color',value} | {type:'gradient',from,to} | {type:'image',src}
    const [canvasSize, setCanvasSize] = useState({ w: CANVAS_W, h: CANVAS_H });
    const [canvasRound, setCanvasRound] = useState(false); // circular clip (Profile Pics)
    const [exportSize, setExportSize] = useState(null); // real output dims {w,h} (Resize); null = 2× preview
    const [templateQuery, setTemplateQuery] = useState('');

    // Base image box model (preview px) — drives 8-handle resize + export.
    const [imgW, setImgW] = useState(null);
    const [imgH, setImgH] = useState(null);
    const [imgHidden, setImgHidden] = useState(false);
    const imgFitRef = useRef({ w: 0, h: 0 }); // fitted size at load (for the Scale slider)
    const imgResizeRef = useRef(null);

    // ── Resize panel ──────────────────────────────────────────────────────
    const [resizeQuery, setResizeQuery] = useState('');
    const [pendingResize, setPendingResize] = useState(null);
    const [showCustomSize, setShowCustomSize] = useState(false);
    const [customW, setCustomW] = useState('');
    const [customH, setCustomH] = useState('');
    const [recentSizes, setRecentSizes] = useState([]);

    // ── Backgrounds panel ─────────────────────────────────────────────────
    const [bgTab, setBgTab] = useState('color'); // 'color' | 'image'
    const [bgSearchQuery, setBgSearchQuery] = useState('');
    const [bgSearchResults, setBgSearchResults] = useState([]);
    const [bgSearching, setBgSearching] = useState(false);
    const bgFileRef = useRef(null);

    // Edit Cutout (manual eraser)
    const [cutoutOpen, setCutoutOpen] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const cutoutCanvasRef = useRef(null);
    const cutoutDrawing = useRef(false);
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
        blur: false, filter: false
    });

    // Position (drag + align) — preview-space offset from centre, in px.
    const [posX, setPosX] = useState(0);
    const [posY, setPosY] = useState(0);
    const dragRef = useRef(null);

    // Undo / redo history
    const [history, setHistory] = useState([]);
    const [histIndex, setHistIndex] = useState(-1);
    const histIndexRef = useRef(-1);
    const applyingHistoryRef = useRef(false);
    const histTimerRef = useRef(null);
    useEffect(() => { histIndexRef.current = histIndex; }, [histIndex]);

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
        `translate(${posX}px, ${posY}px)`,
        `rotate(${rotation}deg)`,
        `scaleX(${flipH ? -1 : 1})`,
        `scale(${scale / 100})`,
    ].join(' ');

    const displayImage = processedUrl || originalUrl;

    // ── Undo / redo history ───────────────────────────────────────────────
    const snapKey = JSON.stringify({
        originalUrl, processedUrl, removeBg,
        brightness, contrast, saturation,
        rotation, flipH, scale,
        blurAmount, selectedFilter,
        shadowBlur, shadowOpacity,
        posX, posY, toggles, layers, canvasBg, canvasSize, canvasRound, exportSize,
        imgW, imgH, imgHidden,
    });

    useEffect(() => {
        // Skip the change we just caused by applying a history snapshot.
        if (applyingHistoryRef.current) { applyingHistoryRef.current = false; return; }
        clearTimeout(histTimerRef.current);
        histTimerRef.current = setTimeout(() => {
            setHistory((prev) => {
                const base = prev.slice(0, histIndexRef.current + 1);
                if (base.length && JSON.stringify(base[base.length - 1]) === snapKey) return prev;
                const next = [...base, JSON.parse(snapKey)];
                setHistIndex(next.length - 1);
                return next;
            });
        }, 300);
        return () => clearTimeout(histTimerRef.current);
    }, [snapKey]);

    const applySnapshot = (s) => {
        applyingHistoryRef.current = true;
        setOriginalUrl(s.originalUrl);
        setProcessedUrl(s.processedUrl);
        setRemoveBg(s.removeBg);
        setBrightness(s.brightness);
        setContrast(s.contrast);
        setSaturation(s.saturation);
        setRotation(s.rotation);
        setFlipH(s.flipH);
        setScale(s.scale);
        setBlurAmount(s.blurAmount);
        setSelectedFilter(s.selectedFilter);
        setShadowBlur(s.shadowBlur);
        setShadowOpacity(s.shadowOpacity);
        setPosX(s.posX);
        setPosY(s.posY);
        setToggles({ ...s.toggles });
        setLayers(s.layers ? JSON.parse(JSON.stringify(s.layers)) : []);
        if (s.canvasBg) setCanvasBg(s.canvasBg);
        if (s.canvasSize) setCanvasSize(s.canvasSize);
        setCanvasRound(!!s.canvasRound);
        setExportSize(s.exportSize || null);
        if (s.imgW !== undefined) setImgW(s.imgW);
        if (s.imgH !== undefined) setImgH(s.imgH);
        setImgHidden(!!s.imgHidden);
    };

    const canUndo = histIndex > 0;
    const canRedo = histIndex >= 0 && histIndex < history.length - 1;
    const handleUndo = () => { if (!canUndo) return; const i = histIndex - 1; applySnapshot(history[i]); setHistIndex(i); };
    const handleRedo = () => { if (!canRedo) return; const i = histIndex + 1; applySnapshot(history[i]); setHistIndex(i); };

    // ── Drag to move (powers Align) ───────────────────────────────────────
    const onImgPointerDown = (e) => {
        e.stopPropagation();
        setSelected(true);
        setSelectedLayerId(null);
        dragRef.current = { sx: e.clientX, sy: e.clientY, bx: posX, by: posY };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const onImgPointerMove = (e) => {
        if (!dragRef.current) return;
        setPosX(dragRef.current.bx + (e.clientX - dragRef.current.sx));
        setPosY(dragRef.current.by + (e.clientY - dragRef.current.sy));
    };
    const onImgPointerUp = (e) => {
        dragRef.current = null;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };

    // ── Top-tool bar ──────────────────────────────────────────────────────
    const handleTopTool = (id) => {
        if (id === 'insert') { setInsertCat(null); setActiveTool((t) => (t === 'insert' ? null : 'insert')); return; }
        if (id === 'addtext') { setActiveTool((t) => (t === 'addtext' ? null : 'addtext')); return; }
        if (id === 'aishadows') {
            setActiveTool(null);
            setToggles((p) => ({ ...p, shadows: true }));
            setExpandedPanel('shadows');
            return;
        }
        if (id === 'backgrounds' || id === 'resize' || id === 'brandit' || id === 'templates' || id === 'layers') {
            setActiveTool((t) => (t === id ? null : id));
            return;
        }
        toast.info('This tool is coming soon.');
    };

    // Brand it: drop the active brand's logo as a layer.
    const addBrandLogo = () => {
        if (!activeBrand?.logo) { toast.info('No brand logo found. Set one in your Brand Kit.'); return; }
        addImageLayer(activeBrand.logo);
    };

    // ── Brand Kit helpers ─────────────────────────────────────────────────
    const addLogosToKit = (urls) => {
        const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
        if (!list.length) return;
        setKit((k) => ({ ...k, logos: Array.from(new Set([...(k?.logos || []), ...list])) }));
    };
    const removeLogoFromKit = (url) =>
        setKit((k) => ({ ...k, logos: (k?.logos || []).filter((u) => u !== url) }));

    const onKitLogoUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (!files.length) return;
        const t = toast.loading(files.length > 1 ? 'Uploading logos…' : 'Uploading logo…');
        try {
            const urls = [];
            for (const f of files) {
                const res = await uploadImage(f);
                const url = res?.url || res?.data?.url || res?.image_url || res?.data?.image_url;
                if (url) urls.push(url);
            }
            if (urls.length) { addLogosToKit(urls); toast.success('Logo added to brand kit', { id: t }); }
            else toast.error('Upload failed', { id: t });
        } catch {
            toast.error('Upload failed', { id: t });
        }
    };

    // Colour clicked in the kit → text colour if a text layer is selected,
    // otherwise apply it as the canvas background.
    const applyKitColor = (c) => {
        if (selectedLayer?.type === 'text') { updateLayer(selectedLayer.id, { color: c }); toast.success('Text colour applied'); }
        else { setCanvasBg({ type: 'color', value: c }); toast.success('Background applied'); }
    };
    const addColorToPalette = (paletteId, color) => {
        if (!color) return;
        setKit((k) => ({
            ...k,
            palettes: (k?.palettes || []).map((p) =>
                p.id === paletteId ? { ...p, colors: Array.from(new Set([...p.colors, color])) } : p),
        }));
    };
    const removeColorFromPalette = (paletteId, color) =>
        setKit((k) => ({
            ...k,
            palettes: (k?.palettes || []).map((p) =>
                p.id === paletteId ? { ...p, colors: p.colors.filter((c) => c !== color) } : p),
        }));
    const addPalette = () =>
        setKit((k) => ({
            ...k,
            palettes: [...(k?.palettes || []), { id: genId(), name: 'Untitled palette', colors: [] }],
        }));
    const removePalette = (paletteId) =>
        setKit((k) => ({ ...k, palettes: (k?.palettes || []).filter((p) => p.id !== paletteId) }));

    const addFontToKit = async (family) => {
        await loadWebFont(family);
        setKit((k) => ({ ...k, fonts: Array.from(new Set([...(k?.fonts || []), family])) }));
        toast.success(`${family} added`);
    };
    const removeFontFromKit = (family) =>
        setKit((k) => ({ ...k, fonts: (k?.fonts || []).filter((f) => f !== family) }));

    // Apply a kit font to the selected text layer (loads the webfont first).
    const applyKitFont = async (family) => {
        if (selectedLayer?.type !== 'text') { toast.info('Select a text layer first'); return; }
        await loadWebFont(family);
        updateLayer(selectedLayer.id, { fontFamily: family });
        toast.success(`Font set to ${family}`);
    };

    // Import a brand from a URL → seed logos / palette / fonts.
    const handleKitImport = async () => {
        const url = kitUrl.trim();
        if (!url) return;
        setKitImporting(true);
        const t = toast.loading('Importing brand…');
        try {
            const result = await sendUrl(url);
            if (!result?.ok) throw new Error(result?.message || 'Import failed');
            const d = result.data?.data || result.data || {};
            const logos = [d.logo || d.logo_url, ...(Array.isArray(d.images) ? d.images.slice(0, 10) : [])]
                .filter((u) => typeof u === 'string' && u.startsWith('http'));
            if (logos.length) addLogosToKit(logos);
            const colors = [d.primary_color, d.secondary_color].filter(Boolean);
            if (colors.length) {
                setKit((k) => ({
                    ...k,
                    palettes: [
                        { id: genId(), name: d.name || 'Imported', colors: Array.from(new Set(colors)) },
                        ...(k?.palettes || []),
                    ],
                }));
            }
            toast.success('Brand imported', { id: t });
            setKitUrl('');
            setKitTab('logos');
        } catch (err) {
            toast.error(err.message || 'Import failed', { id: t });
        } finally {
            setKitImporting(false);
        }
    };

    // Templates: apply a preset (sets background + adds layers).
    const applyTemplate = (tpl) => {
        if (tpl.bg) setCanvasBg(tpl.bg.type === 'none' ? { type: 'none' } : tpl.bg);
        setLayers((prev) => [
            ...prev,
            ...tpl.layers.map((l, i) => ({ id: `l_${Date.now().toString(36)}_${i}`, rotation: 0, ...l })),
        ]);
        setActiveTool(null);
        toast.success(`${tpl.label} template applied`);
    };

    // Photoroom-style template item → apply its bundle of editor changes.
    const applyTemplateItem = (item) => {
        const a = item.apply || {};
        if (a.bg) setCanvasBg(a.bg);
        if (a.size) setCanvasSize(a.size);
        if (a.round !== undefined) setCanvasRound(a.round);
        if (a.removeBg === false) setRemoveBg(false);
        if (a.filter !== undefined) setSelectedFilter(a.filter);
        if (a.blur !== undefined) {
            setBlurAmount(a.blur);
            setToggles((p) => ({ ...p, blur: a.blur > 0 }));
            setSelectedFilter('none');
        }
        if (a.adjust) {
            if (a.adjust.brightness != null) setBrightness(a.adjust.brightness);
            if (a.adjust.contrast != null) setContrast(a.adjust.contrast);
            if (a.adjust.saturation != null) setSaturation(a.adjust.saturation);
        }
        if (a.layers) setLayers((prev) => [...prev, ...a.layers.map((l, i) => ({ id: `${genId()}_${i}`, rotation: 0, ...l }))]);
        toast.success(`${item.label} applied`);
    };

    // Thumbnail background for a template card.
    const thumbBgStyle = (item) => {
        const a = item.apply || {};
        if (item.checker) return {
            backgroundImage: 'linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0,0 6px,6px -6px,-6px 0',
            backgroundColor: '#fff',
        };
        if (a.bg?.type === 'color') return { background: a.bg.value };
        if (a.bg?.type === 'gradient') return { background: gradientCss(a.bg) };
        if (a.bg?.type === 'image') return { backgroundColor: '#eee' };
        return { background: '#fff' };
    };
    // CSS filter applied to the product preview in a template card.
    const thumbFilter = (item) => {
        const a = item.apply || {};
        const parts = [];
        if (a.filter) parts.push(staticFilterCss(a.filter));
        if (a.blur) parts.push(`blur(${Math.max(1, a.blur / 3)}px)`);
        if (a.adjust) {
            if (a.adjust.brightness) parts.push(`brightness(${a.adjust.brightness}%)`);
            if (a.adjust.contrast) parts.push(`contrast(${a.adjust.contrast}%)`);
            if (a.adjust.saturation) parts.push(`saturate(${a.adjust.saturation}%)`);
        }
        return parts.join(' ') || 'none';
    };

    // ── Resize helpers ────────────────────────────────────────────────────
    // Fit real target dims into the preview box (cap ≈ CANVAS_W) keeping ratio.
    const fitPreview = (w, h) => {
        const cap = 520;
        const r = w / h;
        return r >= 1 ? { w: cap, h: Math.round(cap / r) } : { w: Math.round(cap * r), h: cap };
    };
    const pushRecent = (item) => setRecentSizes((prev) => {
        const next = [{ label: item.label, w: item.w, h: item.h, ratio: item.ratio, color: item.color },
            ...prev.filter((p) => !(p.w === item.w && p.h === item.h && p.label === item.label))].slice(0, 5);
        try { localStorage.setItem('ck_resize_recent', JSON.stringify(next)); } catch { /* ignore */ }
        return next;
    });
    const applyResize = (item) => {
        const p = fitPreview(item.w, item.h);
        setCanvasSize(p);
        setExportSize({ w: item.w, h: item.h });
        setCanvasRound(false);
        pushRecent(item);
        setPendingResize(null);
        setActiveTool(null);
        toast.success(`Resized to ${item.w}×${item.h}`);
    };
    const clearRecent = () => {
        setRecentSizes([]);
        try { localStorage.removeItem('ck_resize_recent'); } catch { /* ignore */ }
    };

    // ── Backgrounds helpers ───────────────────────────────────────────────
    const swatchBtn = (c) => (
        <button key={c} onClick={() => setCanvasBg({ type: 'color', value: c })} title={c}
            className={`w-9 h-9 rounded-lg border cursor-pointer ${canvasBg.type === 'color' && canvasBg.value === c ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}
            style={{ background: c }} />
    );
    const onBgFileChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setCanvasBg({ type: 'image', src: URL.createObjectURL(file) });
    };
    const runBgSearch = async () => {
        const q = bgSearchQuery.trim();
        if (!q) return;
        setBgSearching(true);
        try {
            const res = await fetch(`/api/pexels?query=${encodeURIComponent(q)}&per_page=18`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Search failed');
            setBgSearchResults((data.photos || []).map((p) => ({
                id: p.id,
                thumb: p.src?.medium || p.src?.small,
                full: p.src?.large || p.src?.large2x || p.src?.original,
            })));
        } catch (err) {
            toast.error(err.message || 'Search failed');
            setBgSearchResults([]);
        } finally {
            setBgSearching(false);
        }
    };

    // ── Layers ────────────────────────────────────────────────────────────
    const genId = () => `l_${Date.now().toString(36)}_${Math.round(performance.now() * 1000) % 100000}`;

    const addLayer = (layer) => {
        const id = genId();
        setLayers((prev) => [...prev, { id, rotation: 0, ...layer }]);
        setSelectedLayerId(id);
        setSelected(false); // deselect base image
    };
    const addItem = (spec) => {
        const defaults = { image: 200, emoji: 90, shape: 120, path: 120, badge: 90 };
        const d = defaults[spec.type] || 120;
        addLayer({ ...spec, x: canvasSize.w / 2, y: canvasSize.h / 2, w: spec.w || d, h: spec.h || d });
    };
    const insertTextLayer = (fields = {}, { edit = false } = {}) => {
        const id = genId();
        setLayers((prev) => [...prev, {
            id, type: 'text', text: 'Your text',
            color: '#111111', fontWeight: '700', align: 'center', fontSize: 36,
            x: canvasSize.w / 2, y: canvasSize.h / 2, w: 260, h: 70, rotation: 0,
            ...fields,
        }]);
        setSelectedLayerId(id);
        setSelected(false);
        if (edit) setEditingLayerId(id);
        return id;
    };
    const addText = () => insertTextLayer({}, { edit: true });
    // Add a styled preset from the Add Text panel.
    const addTextStyle = async (s) => {
        if (s.fontFamily) await loadWebFont(s.fontFamily);
        insertTextLayer({
            text: s.text, color: s.color, fontWeight: s.fontWeight,
            align: s.align || 'center', fontSize: s.fontSize, fontFamily: s.fontFamily,
            bgColor: s.bgColor, radius: s.radius, w: s.w, h: s.h,
        });
    };
    // Add a fresh text layer pre-set to a brand-kit font.
    const addTextWithFont = async (family) => {
        await loadWebFont(family);
        insertTextLayer({ fontFamily: family }, { edit: true });
    };
    const addImageLayer = async (src) => {
        try {
            const im = await loadImageEl(src);
            const ratio = (im.naturalWidth / im.naturalHeight) || 1;
            const base = 200;
            const w = ratio >= 1 ? base : Math.round(base * ratio);
            const h = ratio >= 1 ? Math.round(base / ratio) : base;
            addLayer({ type: 'image', src, x: CANVAS_W / 2, y: CANVAS_H / 2, w, h });
        } catch {
            toast.error('Could not load that image');
        }
    };
    const updateLayer = (id, patch) => setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    const deleteLayer = (id) => { setLayers((prev) => prev.filter((l) => l.id !== id)); setSelectedLayerId((s) => (s === id ? null : s)); setEditingLayerId((s) => (s === id ? null : s)); };
    const duplicateLayer = (id) => {
        const src = layers.find((l) => l.id === id);
        if (!src) return;
        const nid = genId();
        setLayers((prev) => [...prev, { ...src, id: nid, x: src.x + 20, y: src.y + 20 }]);
        setSelectedLayerId(nid);
    };
    const reorderLayer = (id, dir) => {
        setLayers((prev) => {
            const i = prev.findIndex((l) => l.id === id);
            if (i < 0) return prev;
            const next = [...prev];
            const [item] = next.splice(i, 1);
            if (dir === 'front') next.push(item);
            else next.unshift(item);
            return next;
        });
    };

    const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

    // Drag a layer (pointer events on its box)
    const onLayerPointerDown = (e, layer) => {
        e.stopPropagation();
        setSelectedLayerId(layer.id);
        setSelected(false);
        // While a text layer is being edited, let clicks reach the editor (no drag).
        if (editingLayerId === layer.id) return;
        layerDragRef.current = { id: layer.id, mode: 'move', sx: e.clientX, sy: e.clientY, bx: layer.x, by: layer.y };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const onLayerPointerMove = (e) => {
        const d = layerDragRef.current;
        if (!d || d.mode !== 'move') return;
        updateLayer(d.id, { x: d.bx + (e.clientX - d.sx), y: d.by + (e.clientY - d.sy) });
    };
    const onLayerPointerUp = (e) => {
        layerDragRef.current = null;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };
    // ── Shared 8-direction resize geometry ────────────────────────────────
    // k ∈ tl,tc,tr,ml,mr,bl,bc,br. start={w,h,cx,cy}. Corners keep aspect when
    // lockAspect; edges stretch a single axis. Opposite edge/corner stays put.
    const HANDLES = ['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'];
    const handleCursor = (k) => (
        k === 'tl' || k === 'br' ? 'nwse-resize'
        : k === 'tr' || k === 'bl' ? 'nesw-resize'
        : k === 'tc' || k === 'bc' ? 'ns-resize' : 'ew-resize'
    );
    const geomResize = (k, dx, dy, start, lockAspect) => {
        const hr = k.includes('l') ? -1 : k.includes('r') ? 1 : 0;
        const vr = k.includes('t') ? -1 : k.includes('b') ? 1 : 0;
        let w = start.w, h = start.h;
        if (hr && vr && lockAspect) {
            const fw = (start.w + hr * dx) / start.w;
            const fh = (start.h + vr * dy) / start.h;
            const f = Math.max(0.05, (fw + fh) / 2);
            w = Math.max(20, start.w * f);
            h = Math.max(20, start.h * f);
        } else {
            if (hr) w = Math.max(20, start.w + hr * dx);
            if (vr) h = Math.max(20, start.h + vr * dy);
        }
        return { w, h, cx: start.cx + hr * (w - start.w) / 2, cy: start.cy + vr * (h - start.h) / 2 };
    };

    // ── Base image resize ─────────────────────────────────────────────────
    const onImageLoad = (e) => {
        if (imgW != null && imgH != null) return; // already sized
        const nat = { w: e.target.naturalWidth || 1, h: e.target.naturalHeight || 1 };
        const r = nat.w / nat.h;
        let w = canvasSize.w * 0.7, h = w / r;
        if (h > canvasSize.h * 0.8) { h = canvasSize.h * 0.8; w = h * r; }
        imgFitRef.current = { w, h };
        setImgW(w); setImgH(h);
    };
    const onImgResizeDown = (e, k) => {
        e.stopPropagation();
        setSelected(true);
        imgResizeRef.current = { k, sx: e.clientX, sy: e.clientY, w0: imgW, h0: imgH, cx0: canvasSize.w / 2 + posX, cy0: canvasSize.h / 2 + posY };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const onImgResizeMove = (e) => {
        const d = imgResizeRef.current;
        if (!d) return;
        const r = geomResize(d.k, e.clientX - d.sx, e.clientY - d.sy, { w: d.w0, h: d.h0, cx: d.cx0, cy: d.cy0 }, true);
        setImgW(r.w); setImgH(r.h);
        setPosX(r.cx - canvasSize.w / 2); setPosY(r.cy - canvasSize.h / 2);
        if (imgFitRef.current.w) setScale(Math.round((r.w / imgFitRef.current.w) * 100));
    };
    const onImgResizeUp = (e) => { imgResizeRef.current = null; e.currentTarget.releasePointerCapture?.(e.pointerId); };

    // Scale slider → uniform-scale the base box from its fitted size.
    const setBaseScale = (v) => {
        setScale(v);
        if (imgFitRef.current.w) { setImgW(imgFitRef.current.w * v / 100); setImgH(imgFitRef.current.h * v / 100); }
    };

    // ── Layer resize (8 handles) ──────────────────────────────────────────
    const onResizePointerDown = (e, layer, k = 'br') => {
        e.stopPropagation();
        layerDragRef.current = { id: layer.id, mode: 'resize', k, sx: e.clientX, sy: e.clientY, w0: layer.w, h0: layer.h, cx0: layer.x, cy0: layer.y, fs0: layer.fontSize };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const onResizePointerMove = (e) => {
        const d = layerDragRef.current;
        if (!d || d.mode !== 'resize') return;
        const layer = layers.find((l) => l.id === d.id);
        const lock = layer && layer.type !== 'text' && layer.type !== 'shape';
        const r = geomResize(d.k, e.clientX - d.sx, e.clientY - d.sy, { w: d.w0, h: d.h0, cx: d.cx0, cy: d.cy0 }, lock);
        const patch = { w: r.w, h: r.h, x: r.cx, y: r.cy };
        // Scale text size with the box on a corner drag.
        if (layer?.type === 'text' && d.fs0 && (d.k.length === 2)) patch.fontSize = Math.max(8, Math.round(d.fs0 * (r.w / d.w0)));
        updateLayer(d.id, patch);
    };

    // Reorder a layer up/down one step (z-order) for the Layers panel.
    const moveLayer = (id, dir) => {
        setLayers((prev) => {
            const i = prev.findIndex((l) => l.id === id);
            if (i < 0) return prev;
            const j = dir === 'up' ? i + 1 : i - 1;
            if (j < 0 || j >= prev.length) return prev;
            const next = [...prev];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
        });
    };
    const toggleLayerHidden = (id) => setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, hidden: !l.hidden } : l)));

    const handleInsertFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        addImageLayer(URL.createObjectURL(file));
        e.target.value = '';
    };

    // ── Share ─────────────────────────────────────────────────────────────
    const handleShare = async () => {
        if (!displayImage) { toast.error('Add an image first'); return; }
        try {
            const blob = await exportBlob();
            if (!blob) throw new Error('Export failed');
            const file = new File([blob], 'product-photo.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Product photo' });
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'product-photo.png'; a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                toast.info('Sharing not supported here — downloaded instead.');
            }
        } catch (err) {
            if (err?.name === 'AbortError') return; // user dismissed the share sheet
            console.error('Share error:', err);
            toast.error('Could not share image');
        }
    };

    useEffect(() => {
        if (!initialImageUrl) {
            // Clear the timer on cleanup so React StrictMode's double-mount in dev
            // doesn't fire .click() twice (which reopens the picker after the first pick).
            const t = setTimeout(() => fileInputRef.current?.click(), 100);
            return () => clearTimeout(t);
        }
    }, []);

    // ── Edit Cutout (brush eraser) ────────────────────────────────────────
    const openCutout = () => {
        if (!displayImage) { toast.error('Add an image first'); return; }
        setCutoutOpen(true);
    };
    const drawCutoutBase = async () => {
        try {
            const img = await loadImageEl(displayImage);
            const cv = cutoutCanvasRef.current;
            if (!cv) return;
            const cap = 1600;
            let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
            if (Math.max(w, h) > cap) { const r = cap / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
            cv.width = w; cv.height = h;
            const ctx = cv.getContext('2d');
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
        } catch { toast.error('Could not load image for editing'); }
    };
    useEffect(() => { if (cutoutOpen) drawCutoutBase(); }, [cutoutOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const eraseAt = (e) => {
        const cv = cutoutCanvasRef.current;
        if (!cv) return;
        const rect = cv.getBoundingClientRect();
        const sx = cv.width / rect.width;
        const x = (e.clientX - rect.left) * sx;
        const y = (e.clientY - rect.top) * (cv.height / rect.height);
        const ctx = cv.getContext('2d');
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, (brushSize * sx) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    };
    const applyCutout = () => {
        const cv = cutoutCanvasRef.current;
        if (!cv) return;
        cv.toBlob((blob) => {
            if (!blob) { toast.error('Could not apply'); return; }
            setProcessedUrl(URL.createObjectURL(blob));
            setRemoveBg(true);
            setCutoutOpen(false);
            toast.success('Cutout updated');
        }, 'image/png');
    };

    // Delete/Backspace removes the selected overlay layer (not while typing).
    useEffect(() => {
        const onKey = (e) => {
            if (!selectedLayerId) return;
            const tag = e.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                deleteLayer(selectedLayerId);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedLayerId]);

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
        setImgW(null); setImgH(null); // refit the new image to its own ratio
        setPosX(0); setPosY(0); setScale(100);

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
        // AI image editing needs a backend generation endpoint that isn't wired up yet.
        toast.info('AI editing is coming soon — not available yet.');
    };

    // Composite the image + every active edit (filters, adjust, transform, flip,
    // blur, shadow, outline) onto a canvas and return a PNG blob. Keeps the
    // cut-out transparency when "Remove background" is on.
    const renderToCanvas = async () => {
        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.crossOrigin = 'anonymous';
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = displayImage;
        });

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const s = scale / 100;
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));

        // Bounding box of the scaled + rotated image, plus padding for shadow/outline.
        const ew = w * s;
        const eh = h * s;
        const bw = ew * cos + eh * sin;
        const bh = ew * sin + eh * cos;
        const shadowPad = toggles.shadows ? shadowBlur * 3 + 10 : 0;
        const outlinePad = toggles.outline ? 12 : 0;
        const pad = Math.max(shadowPad, outlinePad, 2);

        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(bw + pad * 2);
        canvas.height = Math.ceil(bh + pad * 2);
        const ctx = canvas.getContext('2d');

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.scale(flipH ? -s : s, s);

        // Shadow (mimics the CSS box-shadow: 0 blur (blur*2)).
        if (toggles.shadows) {
            ctx.save();
            ctx.shadowColor = `rgba(0,0,0,${shadowOpacity / 100})`;
            ctx.shadowBlur = shadowBlur * 2;
            ctx.shadowOffsetY = shadowBlur;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
            ctx.restore();
        }

        // Outline (CSS outline ≈ stroked rect around the image bounds).
        if (toggles.outline) {
            ctx.save();
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 3 / s;
            const o = 4 / s;
            ctx.strokeRect(-w / 2 - o, -h / 2 - o, w + o * 2, h + o * 2);
            ctx.restore();
        }

        // The image itself, with the same CSS filter string used for preview.
        ctx.filter = imageFilter || 'none';
        ctx.drawImage(img, -w / 2, -h / 2, w, h);

        return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    };

    // Draw a single overlay layer onto a canvas context (export). `sc` = export scale.
    const drawLayer = async (ctx, layer, sc) => {
        ctx.save();
        ctx.translate(layer.x * sc, layer.y * sc);
        ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);
        const w = layer.w * sc, h = layer.h * sc;
        if (layer.type === 'image') {
            const im = await loadImageEl(layer.src);
            ctx.drawImage(im, -w / 2, -h / 2, w, h);
        } else if (layer.type === 'emoji') {
            ctx.font = `${h * 0.78}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(layer.emoji, 0, h * 0.04);
        } else if (layer.type === 'badge') {
            ctx.fillStyle = layer.fill || '#111827';
            ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = layer.textColor || '#fff';
            const fs = ((layer.text.length > 3 ? 22 : 30) / 100) * h;
            ctx.font = `700 ${fs}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(layer.text, 0, h * 0.03);
        } else if (layer.type === 'text') {
            const fs = (layer.fontSize || 36) * sc;
            const fam = layer.fontFamily ? `'${layer.fontFamily}', ` : '';
            if (layer.fontFamily) { try { await document.fonts.load(`${layer.fontWeight || 700} ${fs}px '${layer.fontFamily}'`); } catch { /* ignore */ } }
            ctx.font = `${layer.fontWeight || 700} ${fs}px ${fam}'DM Sans', system-ui, sans-serif`;
            ctx.textBaseline = 'top';
            const lh = fs * 1.15;
            const hasBg = !!layer.bgColor;
            // Background pill (matches the live preview's bg/padding).
            const padX = hasBg ? 12 * sc : 0;
            const padY = hasBg ? 4 * sc : 0;
            if (hasBg) {
                const r = Math.min((layer.radius ?? 8) * sc, w / 2, h / 2);
                ctx.fillStyle = layer.bgColor;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, r);
                else ctx.rect(-w / 2, -h / 2, w, h);
                ctx.fill();
            }
            ctx.fillStyle = layer.color || '#111111';
            const innerW = w - 2 * padX;
            // Word-wrap to the (inner) box width, honouring explicit line breaks.
            const lines = [];
            for (const para of String(layer.text || '').split('\n')) {
                const words = para.split(/\s+/).filter(Boolean);
                if (!words.length) { lines.push(''); continue; }
                let line = '';
                for (const word of words) {
                    const test = line ? `${line} ${word}` : word;
                    if (ctx.measureText(test).width > innerW && line) { lines.push(line); line = word; }
                    else line = test;
                }
                lines.push(line);
            }
            const align = layer.align || 'left';
            ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
            const tx = align === 'center' ? 0 : align === 'right' ? w / 2 - padX : -w / 2 + padX;
            // With a bg pill, vertically centre the text block; otherwise top-anchor.
            const startY = hasBg ? -(lines.length * lh) / 2 : -h / 2 + padY;
            lines.forEach((ln, i) => ctx.fillText(ln, tx, startY + i * lh));
        } else if (layer.type === 'path') {
            ctx.save();
            ctx.translate(-w / 2, -h / 2);
            ctx.scale(w / 100, h / 100);
            const p = new Path2D(layer.d);
            if (layer.stroke && layer.stroke !== 'none') {
                ctx.strokeStyle = layer.stroke;
                ctx.lineWidth = layer.strokeWidth || 4;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke(p);
            }
            if (layer.fill && layer.fill !== 'none') {
                ctx.fillStyle = layer.fill;
                ctx.fill(p);
            }
            ctx.restore();
        } else if (layer.type === 'shape') {
            ctx.fillStyle = layer.fill || '#7c3aed';
            if (layer.shape === 'rect') {
                ctx.fillRect(-w / 2, -h / 2, w, h);
            } else if (layer.shape === 'circle') {
                ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
            } else if (layer.shape === 'triangle') {
                ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill();
            } else if (layer.shape === 'star') {
                ctx.beginPath();
                STAR_POINTS.forEach(([px, py], idx) => {
                    const X = (px / 100 - 0.5) * w, Y = (py / 100 - 0.5) * h;
                    idx === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
                });
                ctx.closePath(); ctx.fill();
            }
        }
        ctx.restore();
    };

    // Composite the whole design frame (base image + overlay layers) at export scale.
    const renderFrameToCanvas = async () => {
        // When a Resize target is set, scale so output = exportSize; else 2× preview.
        const sc = exportSize ? exportSize.w / canvasSize.w : EXPORT_SCALE;
        const W = Math.round(canvasSize.w * sc), H = Math.round(canvasSize.h * sc);
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // Circular clip for Profile Pics — corners stay transparent.
        if (canvasRound) {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(W / 2, H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
            ctx.clip();
        }

        // Canvas background (behind everything).
        if (canvasBg.type === 'color') {
            ctx.fillStyle = canvasBg.value; ctx.fillRect(0, 0, W, H);
        } else if (canvasBg.type === 'gradient') {
            const g = ctx.createLinearGradient(0, 0, W, H);
            g.addColorStop(0, canvasBg.from); g.addColorStop(1, canvasBg.to);
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        } else if (canvasBg.type === 'image') {
            try {
                const bg = await loadImageEl(canvasBg.src);
                // cover-fit
                const ir = bg.naturalWidth / bg.naturalHeight, cr = W / H;
                let dw = W, dh = H, dx = 0, dy = 0;
                if (ir > cr) { dh = H; dw = H * ir; dx = (W - dw) / 2; }
                else { dw = W; dh = W / ir; dy = (H - dh) / 2; }
                ctx.drawImage(bg, dx, dy, dw, dh);
            } catch { /* ignore bg load failure */ }
        }

        // Base image, placed where it appears in the preview (box model).
        if (displayImage && !imgHidden && imgW != null && imgH != null) {
            const im = await loadImageEl(displayImage);
            const dw = imgW * sc, dh = imgH * sc;
            ctx.save();
            ctx.translate((canvasSize.w / 2 + posX) * sc, (canvasSize.h / 2 + posY) * sc);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(flipH ? -1 : 1, 1);
            if (toggles.shadows) {
                ctx.save();
                ctx.shadowColor = `rgba(0,0,0,${shadowOpacity / 100})`;
                ctx.shadowBlur = shadowBlur * 2 * sc;
                ctx.shadowOffsetY = shadowBlur * sc;
                ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh);
                ctx.restore();
            }
            ctx.filter = imageFilter || 'none';
            ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh);
            ctx.restore();
        }

        for (const layer of layers) {
            if (layer.hidden) continue;
            // eslint-disable-next-line no-await-in-loop
            await drawLayer(ctx, layer, sc);
        }
        if (canvasRound) ctx.restore();
        return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    };

    // Pick the right exporter: frame (layers / background / resized / round) vs. tight product crop.
    const exportBlob = async () => {
        // Non-uniform (edge-stretched) base image must use the frame compositor;
        // uniform scaling stays on the high-res tight-crop path.
        const fit = imgFitRef.current;
        const distorted = imgW != null && imgH != null && fit.w && Math.abs((imgW / imgH) - (fit.w / fit.h)) > 0.01;
        const framed = layers.length > 0 || canvasBg.type !== 'none' || canvasRound || exportSize || distorted || canvasSize.w !== CANVAS_W || canvasSize.h !== CANVAS_H;
        return framed ? renderFrameToCanvas() : renderToCanvas();
    };

    const handleDownload = async () => {
        if (!displayImage) return;
        try {
            const blob = await exportBlob();
            if (!blob) throw new Error('Export failed');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'product-photo.png';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error('Download error:', err);
            toast.error('Could not export image');
        }
    };

    // Save the edited image to the user's Image Gallery (/image-gallery).
    const handleSave = async () => {
        if (!displayImage || saving) return;
        setSaving(true);
        try {
            const blob = await exportBlob();
            if (!blob) throw new Error('Export failed');
            const file = new File([blob], `edited-${Date.now()}.png`, { type: 'image/png' });
            await uploadImage(file);
            toast.success('Saved to your Image Gallery');
        } catch (err) {
            console.error('Save error:', err);
            toast.error(err?.message || 'Could not save image');
        } finally {
            setSaving(false);
        }
    };

    const handleRetouchRelight = async (type) => {
        if (!displayImage) { toast.error('Upload an image first'); return; }
        // Retouch / Light On need an AI generation backend that isn't wired up yet.
        toast.info(`${type === 'retouch' ? 'Retouch' : 'Light On'} is coming soon — not available yet.`);
    };

    const togglePanel = (id) => setExpandedPanel(p => p === id ? null : id);

    const filters = ['none', 'grayscale', 'sepia', 'warm', 'cool', 'invert'];

    // Canvas box background driven by the Backgrounds tool.
    const boxBackground =
        canvasBg.type === 'color' ? { background: canvasBg.value }
        : canvasBg.type === 'gradient' ? { background: gradientCss(canvasBg) }
        : canvasBg.type === 'image' ? { backgroundColor: '#fff' }
        : removeBg ? {
            background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
            backgroundColor: '#f0f0f0',
        }
        : { background: 'white' };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3"
            onClick={onClose}
        >
            <div
                className="bg-[#efefef] dark:bg-canvas flex flex-col overflow-hidden text-gray-900 rounded-2xl shadow-2xl w-full h-full"
                style={{ width: '95vw', height: '92vh', maxWidth: '1400px' }}
                onClick={e => { e.stopPropagation(); setSelected(false); }}
            >
                {/* Top Bar */}
                <div className="bg-surface border-b border-gray-200 flex items-center px-4 py-2 gap-4 z-10" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                            onClick={handleUndo} disabled={!canUndo}
                            className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Undo"
                        >
                            <Undo className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                            onClick={handleRedo} disabled={!canRedo}
                            className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Redo"
                        >
                            <Redo className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex items-center gap-0.5 flex-1 justify-center">
                        {topTools.map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => handleTopTool(id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                                <Icon className="w-4 h-4 text-gray-500" />
                                <span className="text-[10px] text-gray-500">{label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">D</div>
                        <button onClick={handleDownload} disabled={!displayImage} className="flex items-center gap-2 border border-blue-500 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                            <Download className="w-4 h-4" /> Download
                        </button>
                        <button onClick={handleShare} disabled={!displayImage} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
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
                            style={{ width: canvasSize.w, height: canvasSize.h, ...boxBackground, ...(canvasRound ? { borderRadius: '50%' } : {}) }}
                            onClick={e => { if (!displayImage) { e.stopPropagation(); fileInputRef.current?.click(); } }}
                        >
                            {canvasBg.type === 'image' && (
                                <img src={canvasBg.src} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ zIndex: 0 }} />
                            )}
                            {!displayImage && !processing ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-colors">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                                        <ImageIcon className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <p className="text-gray-500 font-medium">Click to upload a photo</p>
                                    <p className="text-gray-500 text-sm mt-1">PNG, JPG, WEBP supported</p>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {processing ? (
                                        <div className="flex flex-col items-center gap-3 w-48">
                                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                            <p className="text-gray-500 text-sm font-medium">Removing background…</p>
                                            {processingProgress > 0 && (
                                                <>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div
                                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                                            style={{ width: `${processingProgress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-gray-500 text-xs">{processingProgress}%</p>
                                                </>
                                            )}
                                            {processingProgress === 0 && (
                                                <p className="text-gray-500 text-xs">Loading model…</p>
                                            )}
                                        </div>
                                    ) : displayImage && !imgHidden && (
                                        (() => {
                                            const baseReady = imgW != null && imgH != null;
                                            return (
                                        <div
                                            className={`absolute ${selected ? 'outline outline-2 outline-blue-500' : ''}`}
                                            onClick={e => { e.stopPropagation(); setSelected(true); }}
                                            onPointerDown={onImgPointerDown}
                                            onPointerMove={onImgPointerMove}
                                            onPointerUp={onImgPointerUp}
                                            style={baseReady
                                                ? { left: canvasSize.w / 2 + posX - imgW / 2, top: canvasSize.h / 2 + posY - imgH / 2, width: imgW, height: imgH, cursor: 'move', touchAction: 'none', zIndex: 4 }
                                                : { left: '50%', top: '50%', transform: 'translate(-50%,-50%)', maxWidth: '78%', maxHeight: 340, cursor: 'move', touchAction: 'none', zIndex: 4 }}
                                        >
                                            {selected && baseReady && (
                                                <>
                                                    {HANDLES.map((k) => (
                                                        <div key={k}
                                                            onPointerDown={(e) => onImgResizeDown(e, k)}
                                                            onPointerMove={onImgResizeMove}
                                                            onPointerUp={onImgResizeUp}
                                                            className="absolute w-3 h-3 bg-surface border-2 border-blue-500 rounded-sm z-10"
                                                            style={{
                                                                left: k.includes('l') ? '0%' : k.includes('r') ? '100%' : '50%',
                                                                top: k.includes('t') ? '0%' : k.includes('b') ? '100%' : '50%',
                                                                transform: 'translate(-50%,-50%)', cursor: handleCursor(k), touchAction: 'none',
                                                            }} />
                                                    ))}
                                                    <div className="absolute -top-10 left-0 flex items-center gap-1 bg-surface rounded-lg shadow px-2 py-1 z-10" onPointerDown={(e) => e.stopPropagation()}>
                                                        <button onClick={e => { e.stopPropagation(); setOriginalUrl(null); setProcessedUrl(null); setSelected(false); setRemoveBg(false); setImgW(null); setImgH(null); }}
                                                            className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm cursor-pointer">🗑</button>
                                                        <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                            className="p-1 hover:bg-gray-100 rounded text-gray-500 text-xs font-medium cursor-pointer">Replace</button>
                                                    </div>
                                                </>
                                            )}
                                            {toggles.shadows && (
                                                <div className="absolute inset-0 z-0 rounded"
                                                    style={{ boxShadow: `0 ${shadowBlur}px ${shadowBlur * 2}px rgba(0,0,0,${shadowOpacity / 100})`, pointerEvents: 'none' }} />
                                            )}
                                            <img
                                                ref={imgRef}
                                                src={displayImage}
                                                alt="product"
                                                draggable={false}
                                                onLoad={onImageLoad}
                                                className="block w-full h-full"
                                                style={{
                                                    objectFit: baseReady ? 'fill' : 'contain',
                                                    maxWidth: baseReady ? undefined : '100%',
                                                    maxHeight: baseReady ? undefined : 340,
                                                    filter: imageFilter,
                                                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                                                    transformOrigin: 'center',
                                                    ...(toggles.outline ? { outline: '3px solid #7c3aed', outlineOffset: '4px' } : {}),
                                                    ...(toggles.reflection ? { WebkitBoxReflect: 'below 4px linear-gradient(transparent 60%, rgba(0,0,0,0.15))' } : {}),
                                                }}
                                            />
                                        </div>
                                            );
                                        })()
                                    )}
                                </div>
                            )}

                            {/* Overlay layers (Insert) */}
                            {layers.map((layer) => {
                                if (layer.hidden) return null;
                                const isSel = layer.id === selectedLayerId;
                                const isText = layer.type === 'text';
                                const isEditing = layer.id === editingLayerId;
                                const textStyle = {
                                    color: layer.color,
                                    fontWeight: layer.fontWeight,
                                    fontSize: layer.fontSize,
                                    lineHeight: 1.15,
                                    textAlign: layer.align,
                                    fontFamily: layer.fontFamily
                                        ? `'${layer.fontFamily}', 'DM Sans', sans-serif`
                                        : undefined,
                                    ...(layer.bgColor ? {
                                        background: layer.bgColor,
                                        borderRadius: layer.radius ?? 8,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: layer.align === 'left' ? 'flex-start' : layer.align === 'right' ? 'flex-end' : 'center',
                                        padding: '4px 12px',
                                    } : {}),
                                };
                                return (
                                    <div
                                        key={layer.id}
                                        onPointerDown={(e) => onLayerPointerDown(e, layer)}
                                        onPointerMove={onLayerPointerMove}
                                        onPointerUp={onLayerPointerUp}
                                        onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                                        onDoubleClick={isText ? (e) => { e.stopPropagation(); setSelectedLayerId(layer.id); setEditingLayerId(layer.id); } : undefined}
                                        className={`absolute select-none ${isSel ? 'outline outline-2 outline-blue-500' : ''}`}
                                        style={{
                                            left: layer.x - layer.w / 2,
                                            top: layer.y - layer.h / 2,
                                            width: layer.w,
                                            height: layer.h,
                                            transform: `rotate(${layer.rotation || 0}deg)`,
                                            cursor: isEditing ? 'text' : 'move',
                                            touchAction: 'none',
                                            zIndex: 5,
                                        }}
                                    >
                                        {isText ? (
                                            isEditing ? (
                                                <div
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    ref={(el) => {
                                                        if (!el || el.getAttribute('data-init')) return;
                                                        el.setAttribute('data-init', '1');
                                                        el.textContent = layer.text;
                                                        el.focus();
                                                        const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
                                                        const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
                                                    }}
                                                    onInput={(e) => updateLayer(layer.id, { text: e.currentTarget.textContent })}
                                                    onBlur={() => setEditingLayerId(null)}
                                                    onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); }}
                                                    className="w-full h-full outline-none whitespace-pre-wrap break-words overflow-hidden cursor-text"
                                                    style={textStyle}
                                                />
                                            ) : (
                                                <div className="w-full h-full whitespace-pre-wrap break-words overflow-hidden pointer-events-none" style={textStyle}>{layer.text}</div>
                                            )
                                        ) : (
                                            <VisualSVG spec={layer} />
                                        )}
                                        {isSel && (
                                            <>
                                                <div className="absolute -top-10 left-0 flex items-center gap-1 bg-surface rounded-lg shadow px-1.5 py-1 whitespace-nowrap" onPointerDown={(e) => e.stopPropagation()}>
                                                    {isText && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); setEditingLayerId(layer.id); }} className="p-1 hover:bg-gray-100 rounded text-gray-500 cursor-pointer" title="Edit text"><Pencil className="w-3.5 h-3.5" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { fontWeight: layer.fontWeight === '700' ? '400' : '700' }); }} className={`px-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm font-bold ${layer.fontWeight === '700' ? 'text-blue-600' : 'text-gray-500'}`} title="Bold">B</button>
                                                            <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { fontSize: Math.max(10, layer.fontSize - 4) }); }} className="px-1 rounded hover:bg-gray-100 cursor-pointer text-gray-500 text-xs" title="Smaller">A−</button>
                                                            <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { fontSize: layer.fontSize + 4 }); }} className="px-1 rounded hover:bg-gray-100 cursor-pointer text-gray-500 text-sm" title="Larger">A+</button>
                                                            <button onClick={(e) => { e.stopPropagation(); const o = ['left', 'center', 'right']; updateLayer(layer.id, { align: o[(o.indexOf(layer.align) + 1) % 3] }); }} className="px-1 rounded hover:bg-gray-100 cursor-pointer text-gray-500 text-xs" title="Align">{layer.align === 'left' ? '⯇' : layer.align === 'right' ? '⯈' : '≡'}</button>
                                                            {['#111111', '#ffffff', '#ef4444', '#2563eb', '#22c55e', '#eab308', '#7c3aed'].map((c) => (
                                                                <button key={c} onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { color: c }); }} className="w-4 h-4 rounded-full border border-gray-300 cursor-pointer" style={{ background: c }} title={c} />
                                                            ))}
                                                            <span className="w-px h-4 bg-gray-200 mx-0.5" />
                                                        </>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} className="p-1 hover:bg-gray-100 rounded text-gray-500 cursor-pointer" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} className="p-1 hover:bg-gray-100 rounded text-red-500 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                                {!isEditing && HANDLES.map((k) => (
                                                    <div key={k}
                                                        onPointerDown={(e) => onResizePointerDown(e, layer, k)}
                                                        onPointerMove={onResizePointerMove}
                                                        onPointerUp={onLayerPointerUp}
                                                        className="absolute w-3 h-3 bg-surface border-2 border-blue-500 rounded-sm z-10"
                                                        style={{
                                                            left: k.includes('l') ? '0%' : k.includes('r') ? '100%' : '50%',
                                                            top: k.includes('t') ? '0%' : k.includes('b') ? '100%' : '50%',
                                                            transform: 'translate(-50%,-50%)', cursor: handleCursor(k), touchAction: 'none',
                                                        }} />
                                                ))}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        <input ref={insertFileRef} type="file" accept="image/*" className="hidden" onChange={handleInsertFile} />

                        {/* AI prompt */}
                        <div className="mt-5 flex items-center gap-2 bg-surface rounded-full border border-gray-200 shadow-sm px-4 py-2.5 w-96" onClick={e => e.stopPropagation()}>
                            <input
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                placeholder="Describe a change…"
                                className="flex-1 text-sm text-gray-500 outline-none bg-transparent"
                                onKeyDown={e => e.key === 'Enter' && handleAiApply()}
                            />
                            <button
                                onClick={handleAiApply}
                                disabled={applyingAi || !aiPrompt.trim() || !displayImage}
                                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40"
                            >
                                {applyingAi ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <span className="text-white font-bold text-sm">↑</span>}
                            </button>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="w-84 bg-surface border-l border-gray-200 flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {activeTool === 'layers' ? (
                            (() => {
                                const layerLabel = (l) => (
                                    l.type === 'text' ? (l.text || 'Text')
                                    : l.type === 'image' ? 'Image'
                                    : l.type === 'emoji' ? l.emoji
                                    : l.type === 'badge' ? (l.text || 'Badge')
                                    : l.type === 'shape' ? 'Shape' : 'Graphic'
                                );
                                const row = (opts) => (
                                    <div key={opts.key}
                                        onClick={opts.onSelect}
                                        className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer ${opts.active ? 'bg-blue-50 ring-1 ring-blue-400' : 'hover:bg-gray-100'}`}>
                                        <button onClick={(e) => { e.stopPropagation(); opts.onToggleHidden(); }}
                                            className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer shrink-0" title={opts.hidden ? 'Show' : 'Hide'}>
                                            {opts.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <span className="w-8 h-8 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {opts.thumb}
                                        </span>
                                        <span className={`flex-1 text-sm truncate ${opts.hidden ? 'text-gray-400' : 'text-gray-800'}`}>{opts.label}</span>
                                        {opts.controls}
                                    </div>
                                );
                                return (
                                    <div className="flex flex-col max-h-full">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                            <span className="font-semibold text-base text-gray-900">Layers</span>
                                            <button onClick={() => setActiveTool(null)} className="p-1 rounded hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                            {!displayImage && layers.length === 0 && (
                                                <p className="text-xs text-gray-400 text-center py-8">No layers yet. Add an image, text or graphics.</p>
                                            )}
                                            {/* Overlay layers (front first) */}
                                            {[...layers].reverse().map((l) => row({
                                                key: l.id,
                                                active: l.id === selectedLayerId,
                                                hidden: l.hidden,
                                                label: layerLabel(l),
                                                thumb: l.type === 'image' ? <img src={l.src} alt="" className="w-full h-full object-cover" />
                                                    : l.type === 'text' ? <Type className="w-4 h-4 text-gray-400" />
                                                    : <VisualSVG spec={l} />,
                                                onSelect: () => { setSelectedLayerId(l.id); setSelected(false); },
                                                onToggleHidden: () => toggleLayerHidden(l.id),
                                                controls: (
                                                    <span className="flex items-center shrink-0">
                                                        <button onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 'up'); }} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer" title="Bring forward"><ChevronUp className="w-4 h-4" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 'down'); }} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer" title="Send backward"><ChevronDown className="w-4 h-4" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); duplicateLayer(l.id); }} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteLayer(l.id); }} className="p-1 text-gray-400 hover:text-red-500 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </span>
                                                ),
                                            }))}
                                            {/* Base product image (bottom of stack) */}
                                            {displayImage && row({
                                                key: 'base',
                                                active: selected,
                                                hidden: imgHidden,
                                                label: 'Product image',
                                                thumb: <img src={displayImage} alt="" className="w-full h-full object-contain" />,
                                                onSelect: () => { setSelected(true); setSelectedLayerId(null); },
                                                onToggleHidden: () => setImgHidden((v) => !v),
                                                controls: (
                                                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer text-xs font-medium" title="Replace">Replace</button>
                                                ),
                                            })}
                                        </div>
                                    </div>
                                );
                            })()
                        ) : activeTool === 'addtext' ? (
                            <div className="flex flex-col max-h-full">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <span className="font-semibold text-base text-gray-900">Add Text</span>
                                    <button onClick={() => setActiveTool(null)} className="p-1 rounded hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
                                </div>
                                <div className="p-4 overflow-y-auto">
                                    {/* Add plain text */}
                                    <button onClick={addText}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer">
                                        <Plus className="w-4 h-4" /> Add text
                                    </button>

                                    {/* Search */}
                                    <div className="relative mt-3">
                                        <input value={textStyleQuery} onChange={(e) => setTextStyleQuery(e.target.value)}
                                            placeholder="Search text styles"
                                            className="w-full pl-3 pr-3 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800" />
                                    </div>

                                    {/* Brand kit fonts */}
                                    {(kit?.fonts || []).length > 0 && (
                                        <div className="mt-5">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Brand kit</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(kit.fonts).map((f) => (
                                                    <button key={f} onClick={() => addTextWithFont(f)} onMouseEnter={() => loadWebFont(f)}
                                                        className="h-20 rounded-xl border border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center px-2 cursor-pointer">
                                                        <span className="text-xl text-gray-900 truncate max-w-full" style={{ fontFamily: `'${f}', sans-serif`, fontWeight: 700 }}>{f}</span>
                                                        <span className="text-xs text-gray-400 truncate max-w-full" style={{ fontFamily: `'${f}', sans-serif` }}>Regular</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* All styles */}
                                    <div className="mt-5">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">All styles</p>
                                        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
                                            {TEXT_STYLE_CATEGORIES.map((c) => (
                                                <button key={c} onClick={() => setTextStyleCat(c)}
                                                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer ${textStyleCat === c ? 'bg-gray-900 text-gray-50' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {TEXT_STYLES
                                                .filter((s) => textStyleCat === 'All' || s.category === textStyleCat)
                                                .filter((s) => s.text.toLowerCase().includes(textStyleQuery.toLowerCase()))
                                                .map((s) => (
                                                    <button key={s.id} onClick={() => addTextStyle(s)} title={`Add "${s.text.replace(/\n/g, ' ')}"`}
                                                        className="h-24 rounded-xl border border-gray-200 hover:border-blue-400 bg-surface flex items-center justify-center p-2 overflow-hidden cursor-pointer">
                                                        <span
                                                            className="text-center leading-tight whitespace-pre-line"
                                                            style={{
                                                                fontFamily: `'${s.fontFamily}', sans-serif`,
                                                                fontWeight: s.fontWeight,
                                                                color: s.color,
                                                                fontSize: Math.min(s.fontSize, 24),
                                                                ...(s.bgColor ? { background: s.bgColor, borderRadius: s.radius >= 999 ? 999 : 6, padding: s.radius >= 999 ? '14px 12px' : '4px 10px' } : {}),
                                                            }}
                                                        >{s.text}</span>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTool === 'insert' ? (
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                                    <span className="font-semibold text-base text-gray-900">Insert</span>
                                    <button onClick={() => setActiveTool(null)} className="p-1 rounded hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4 text-gray-500" /></button>
                                </div>
                                {insertCat ? (() => {
                                    /* ── Category detail: show all items, pick one ── */
                                    const cat = INSERT_LIBRARY.find((c) => c.id === insertCat);
                                    if (!cat) return null;
                                    return (
                                        <div className="p-4">
                                            <button onClick={() => setInsertCat(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 cursor-pointer">
                                                <ChevronRight className="w-4 h-4 rotate-180" /> {cat.label}
                                            </button>
                                            {cat.colorable && (
                                                <div className="flex items-center gap-1.5 mb-3">
                                                    {SHAPE_COLORS.map((c) => (
                                                        <button key={c} onClick={() => setShapeColor(c)} title={c}
                                                            className={`w-5 h-5 rounded-full cursor-pointer ${shapeColor === c ? 'ring-2 ring-offset-1 ring-blue-500' : 'border border-gray-200'}`}
                                                            style={{ background: c }} />
                                                    ))}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-4 gap-2">
                                                {cat.items.map((it, i) => {
                                                    const resolved = cat.colorable ? resolveItem(it, shapeColor) : it;
                                                    return (
                                                        <button key={i} onClick={() => addItem(resolved)}
                                                            className="aspect-square flex items-center justify-center p-1.5 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer">
                                                            <VisualSVG spec={resolved} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    /* ── Category list: AI / upload / recent + category cards ── */
                                    <div className="p-4 space-y-5">
                                        <button onClick={() => toast.info('AI image generation is coming soon.')} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                                            <Sparkles className="w-4 h-4" /> Generate an image with AI
                                        </button>
                                        <button onClick={() => insertFileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                                            <Upload className="w-4 h-4" /> Drop a file or select an image
                                        </button>
                                        {myImages.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 mb-2">Recent uploads</p>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {myImages.slice(0, 6).map((img) => (
                                                        <button key={img.id} onClick={() => addImageLayer(img.src)} className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 cursor-pointer bg-gray-100">
                                                            <img src={img.src} alt={img.alt || ''} className="w-full h-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {INSERT_LIBRARY.map((cat) => (
                                            <button key={cat.id} onClick={() => setInsertCat(cat.id)}
                                                className="w-full text-left border border-gray-200 rounded-xl p-2.5 hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-gray-900">{cat.label}</span>
                                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {cat.items.slice(0, 4).map((it, i) => (
                                                        <div key={i} className="aspect-square flex items-center justify-center p-1 bg-gray-100 rounded-md">
                                                            <VisualSVG spec={cat.colorable ? resolveItem(it, cat.id === 'classics' ? '#2563eb' : shapeColor) : it} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : activeTool === 'backgrounds' ? (
                            <div className="flex flex-col max-h-full">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <span className="font-semibold text-base text-gray-900">Background</span>
                                    <button onClick={() => setActiveTool(null)} className="p-1 rounded hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
                                </div>

                                {/* Quick actions */}
                                <div className="flex gap-2 px-4 pt-3">
                                    <button onClick={() => setCanvasBg({ type: 'none' })}
                                        className={`flex-1 py-2 rounded-lg border text-xs font-medium cursor-pointer ${canvasBg.type === 'none' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:border-blue-400'}`}>
                                        Transparent
                                    </button>
                                    <button onClick={() => handleRemoveBgToggle(!removeBg)} disabled={!originalUrl || processing}
                                        className={`flex-1 py-2 rounded-lg border text-xs font-medium cursor-pointer disabled:opacity-40 ${removeBg ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:border-blue-400'}`}>
                                        {removeBg ? 'Bg removed' : 'Remove bg'}
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1 px-3 pt-3">
                                    {[{ id: 'color', label: 'Color' }, { id: 'image', label: 'Image' }].map((t) => (
                                        <button key={t.id} onClick={() => setBgTab(t.id)}
                                            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg cursor-pointer ${bgTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 overflow-y-auto space-y-5">
                                    {bgTab === 'color' ? (
                                        <>
                                            {/* Custom picker */}
                                            <div className="flex items-center gap-3">
                                                <label className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 cursor-pointer shrink-0"
                                                    style={{ background: 'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' }}>
                                                    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer"
                                                        value={canvasBg.type === 'color' ? canvasBg.value : '#ffffff'}
                                                        onChange={(e) => setCanvasBg({ type: 'color', value: e.target.value })} />
                                                </label>
                                                <span className="text-sm text-gray-600">{canvasBg.type === 'color' ? canvasBg.value.toUpperCase() : 'Pick a color'}</span>
                                            </div>

                                            {/* Brand kit palettes */}
                                            {(kit?.palettes || []).filter((p) => p.colors.length).map((p) => (
                                                <div key={p.id}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="text-xs font-semibold text-gray-600 truncate">{p.name}</p>
                                                        <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Brand kit</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">{p.colors.map(swatchBtn)}</div>
                                                </div>
                                            ))}

                                            {/* Curated palettes */}
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Neutral tones</p>
                                                <div className="flex flex-wrap gap-2">{NEUTRAL_TONES.map(swatchBtn)}</div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Soft pastels</p>
                                                <div className="flex flex-wrap gap-2">{SOFT_PASTELS.map(swatchBtn)}</div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Vibrant</p>
                                                <div className="flex flex-wrap gap-2">{VIBRANT_COLORS.map(swatchBtn)}</div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Gradients</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {BG_GRADIENTS.map((g, i) => (
                                                        <button key={i} onClick={() => setCanvasBg({ type: 'gradient', from: g.from, to: g.to })}
                                                            className={`aspect-video rounded-lg border cursor-pointer ${canvasBg.type === 'gradient' && canvasBg.from === g.from ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}
                                                            style={{ background: gradientCss(g) }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Upload */}
                                            <button onClick={() => bgFileRef.current?.click()}
                                                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                                                <Upload className="w-4 h-4" /> Drop a file or select an image
                                            </button>
                                            <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={onBgFileChange} />

                                            {/* Recent uploads */}
                                            {myImages.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">Recent uploads</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {myImages.slice(0, 6).map((img) => (
                                                            <button key={img.id} onClick={() => setCanvasBg({ type: 'image', src: img.src })}
                                                                className={`aspect-square rounded-lg overflow-hidden border cursor-pointer bg-gray-100 ${canvasBg.type === 'image' && canvasBg.src === img.src ? 'ring-2 ring-blue-500' : 'border-gray-200 hover:border-blue-400'}`}>
                                                                <img src={img.src} alt={img.alt || ''} className="w-full h-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Search */}
                                            <div>
                                                <div className="relative">
                                                    <input value={bgSearchQuery} onChange={(e) => setBgSearchQuery(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') runBgSearch(); }}
                                                        placeholder="Search backgrounds"
                                                        className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800" />
                                                    <button onClick={runBgSearch} disabled={bgSearching || !bgSearchQuery.trim()}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 disabled:opacity-40 cursor-pointer">
                                                        {bgSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                {bgSearchResults.length > 0 && (
                                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                                        {bgSearchResults.map((r) => (
                                                            <button key={r.id} onClick={() => setCanvasBg({ type: 'image', src: r.full })}
                                                                className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 cursor-pointer bg-gray-100">
                                                                <img src={r.thumb} alt="" className="w-full h-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Library by category */}
                                            {BG_LIBRARY.map((group) => (
                                                <div key={group.category}>
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">{group.category}</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {group.images.map((src) => (
                                                            <button key={src} onClick={() => setCanvasBg({ type: 'image', src })}
                                                                className={`aspect-square rounded-lg overflow-hidden border cursor-pointer ${canvasBg.type === 'image' && canvasBg.src === src ? 'ring-2 ring-blue-500' : 'border-gray-200 hover:border-blue-400'}`}>
                                                                <img src={src} alt="" className="w-full h-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            <p className="text-[10px] text-gray-400">Tip: turn on “Remove bg” above so your product sits on the new background.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : activeTool === 'resize' ? (
                            (() => {
                                const q = resizeQuery.trim().toLowerCase();
                                const isActive = (item) => exportSize && exportSize.w === item.w && exportSize.h === item.h;
                                const isPending = (item) => pendingResize && pendingResize.w === item.w && pendingResize.h === item.h && pendingResize.label === item.label;
                                const resizeRow = (item, key) => (
                                    <button key={key} onClick={() => setPendingResize(item)}
                                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer ${isPending(item) ? 'bg-blue-50 ring-1 ring-blue-400' : isActive(item) ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>
                                        <span className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: item.color || '#6b7280' }}>{item.label[0]}</span>
                                            <span className="text-sm text-gray-800 truncate">{item.label}</span>
                                        </span>
                                        <span className="text-[11px] text-gray-400 shrink-0 ml-2">{item.w} × {item.h}{item.ratio ? `, ${item.ratio}` : ''}</span>
                                    </button>
                                );
                                return (
                                    <div className="flex flex-col max-h-full">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                            <span className="font-semibold text-base text-gray-900">Resize</span>
                                            <button onClick={() => setActiveTool(null)} className="p-1 rounded hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
                                        </div>
                                        <div className="px-4 pt-3">
                                            <input value={resizeQuery} onChange={(e) => setResizeQuery(e.target.value)}
                                                placeholder="Search size presets"
                                                className="w-full px-3 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800" />
                                        </div>
                                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                                            {/* Custom size */}
                                            <div>
                                                <button onClick={() => setShowCustomSize((v) => !v)}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-100 cursor-pointer">
                                                    <span className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center text-gray-500 shrink-0"><SlidersHorizontal className="w-4 h-4" /></span>
                                                    <span className="text-sm text-gray-800">Custom size</span>
                                                </button>
                                                {showCustomSize && (
                                                    <div className="flex items-center gap-2 mt-2 px-2.5">
                                                        <input type="number" value={customW} onChange={(e) => setCustomW(e.target.value)} placeholder="W"
                                                            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 bg-surface text-gray-800" />
                                                        <span className="text-gray-400">×</span>
                                                        <input type="number" value={customH} onChange={(e) => setCustomH(e.target.value)} placeholder="H"
                                                            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 bg-surface text-gray-800" />
                                                        <button onClick={() => { const w = parseInt(customW, 10), h = parseInt(customH, 10); if (w > 0 && h > 0) setPendingResize({ label: 'Custom', w, h, ratio: '', color: '#6b7280' }); }}
                                                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer">Set</button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Recent */}
                                            {!q && recentSizes.length > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs font-semibold text-gray-600">Recent</p>
                                                        <button onClick={clearRecent} className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">clear</button>
                                                    </div>
                                                    {recentSizes.map((item, i) => resizeRow(item, `recent-${i}`))}
                                                </div>
                                            )}

                                            {/* Groups */}
                                            {RESIZE_GROUPS.map((group) => {
                                                const items = group.items.filter((i) => !q || i.label.toLowerCase().includes(q));
                                                if (!items.length) return null;
                                                return (
                                                    <div key={group.title}>
                                                        <p className="text-xs font-semibold text-gray-600 mb-1">{group.title}</p>
                                                        {items.map((item) => resizeRow(item, item.id))}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Footer */}
                                        <div className="border-t border-gray-100 p-3 space-y-2">
                                            <button onClick={() => pendingResize && applyResize(pendingResize)} disabled={!pendingResize}
                                                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                                                Resize
                                            </button>
                                            <button onClick={() => { setPendingResize(null); setActiveTool(null); }}
                                                className="w-full py-2.5 rounded-xl text-blue-600 text-sm font-semibold hover:bg-blue-50 cursor-pointer">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()
                        ) : activeTool === 'brandit' ? (
                            <div className="flex flex-col max-h-full">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <span className="font-semibold text-base text-gray-900">Brand Kit</span>
                                    <button onClick={() => setActiveTool(null)} className="p-1 rounded hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
                                </div>

                                {/* Active brand header */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                                    {activeBrand?.logo
                                        ? <img src={activeBrand.logo} alt="" className="w-9 h-9 rounded-lg object-contain border border-gray-200 bg-surface" />
                                        : <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400"><ImageIcon className="w-4 h-4" /></div>}
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{activeBrand?.name || 'No brand selected'}</p>
                                        <p className="text-[11px] text-gray-400">Active brand</p>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1 px-3 pt-3">
                                    {[
                                        { id: 'logos', label: 'Logos' },
                                        { id: 'colors', label: 'Colors' },
                                        { id: 'fonts', label: 'Fonts' },
                                        { id: 'import', label: 'Import' },
                                    ].map((t) => (
                                        <button key={t.id} onClick={() => setKitTab(t.id)}
                                            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg cursor-pointer ${kitTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 overflow-y-auto">
                                    {/* ── Logos ── */}
                                    {kitTab === 'logos' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-gray-600">Logos ({(kit?.logos || []).length})</p>
                                                <button onClick={() => kitLogoInputRef.current?.click()} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add</button>
                                            </div>
                                            <input ref={kitLogoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onKitLogoUpload} />
                                            {(kit?.logos || []).length === 0 ? (
                                                <p className="text-[11px] text-gray-400">No logos yet. Upload one or import from a URL.</p>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(kit?.logos || []).map((url) => (
                                                        <div key={url} className="group relative aspect-square rounded-xl border border-gray-200 bg-surface flex items-center justify-center overflow-hidden">
                                                            <img src={url} alt="" className="max-w-[80%] max-h-[80%] object-contain" />
                                                            <button onClick={() => addImageLayer(url)} title="Add to canvas"
                                                                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                                                                <span className="flex items-center gap-1 text-xs font-semibold text-white"><Plus className="w-3.5 h-3.5" /> Add</span>
                                                            </button>
                                                            <button onClick={() => removeLogoFromKit(url)} title="Remove"
                                                                className="absolute top-1 right-1 p-1 rounded-full bg-surface/90 text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── Colors ── */}
                                    {kitTab === 'colors' && (
                                        <div className="space-y-4">
                                            <p className="text-[11px] text-gray-400">Click a swatch to apply it — to the selected text layer, or the canvas background.</p>
                                            {(kit?.palettes || []).map((p) => (
                                                <div key={p.id}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs font-semibold text-gray-600 truncate">{p.name}</p>
                                                        {p.id !== 'brand' && (
                                                            <button onClick={() => removePalette(p.id)} className="text-gray-300 hover:text-red-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {p.colors.map((c) => (
                                                            <div key={c} className="group relative">
                                                                <button onClick={() => applyKitColor(c)} title={c}
                                                                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" style={{ background: c }} />
                                                                <button onClick={() => removeColorFromPalette(p.id, c)} title="Remove"
                                                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-surface border border-gray-200 text-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                                                            </div>
                                                        ))}
                                                        <label className="w-9 h-9 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer" title="Add color">
                                                            <Plus className="w-4 h-4" />
                                                            <input type="color" className="sr-only" onChange={(e) => addColorToPalette(p.id, e.target.value)} />
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={addPalette} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-blue-400 cursor-pointer">
                                                <Plus className="w-3.5 h-3.5" /> New palette
                                            </button>
                                        </div>
                                    )}

                                    {/* ── Fonts ── */}
                                    {kitTab === 'fonts' && (
                                        <div className="space-y-4">
                                            {(kit?.fonts || []).length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">Brand fonts ({kit.fonts.length})</p>
                                                    <div className="space-y-1.5">
                                                        {kit.fonts.map((f) => (
                                                            <div key={f} className="group flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200">
                                                                <button onClick={() => applyKitFont(f)} className="text-sm text-gray-800 truncate cursor-pointer text-left flex-1" style={{ fontFamily: `'${f}', sans-serif` }} title="Apply to selected text">{f}</button>
                                                                <button onClick={() => removeFontFromKit(f)} className="text-gray-300 hover:text-red-500 cursor-pointer ml-2"><Trash2 className="w-3.5 h-3.5" /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mt-1.5">Select a text layer, then click a font to apply it.</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Add a font</p>
                                                <input value={fontQuery} onChange={(e) => setFontQuery(e.target.value)} placeholder="Search fonts…"
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-2 outline-none focus:border-blue-400 bg-surface text-gray-800" />
                                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                                    {BRAND_FONTS.filter((f) => f.toLowerCase().includes(fontQuery.toLowerCase())).map((f) => {
                                                        const added = (kit?.fonts || []).includes(f);
                                                        return (
                                                            <button key={f} onClick={() => addFontToKit(f)} disabled={added}
                                                                onMouseEnter={() => loadWebFont(f)}
                                                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-700 cursor-pointer disabled:opacity-40 disabled:cursor-default">
                                                                <span style={{ fontFamily: `'${f}', sans-serif` }} className="truncate">{f}</span>
                                                                {added ? <span className="text-[11px] text-green-600">Added</span> : <Plus className="w-3.5 h-3.5 text-gray-400" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Import ── */}
                                    {kitTab === 'import' && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-semibold text-gray-800">Import your brand</p>
                                            <p className="text-[11px] text-gray-400">Fetch logos, colors and images directly from your website.</p>
                                            <input value={kitUrl} onChange={(e) => setKitUrl(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleKitImport(); }}
                                                placeholder="https://yourbrand.com"
                                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 bg-surface text-gray-800" />
                                            <button onClick={handleKitImport} disabled={kitImporting || !kitUrl.trim()}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                                                {kitImporting && <Loader2 className="w-4 h-4 animate-spin" />}
                                                {kitImporting ? 'Importing…' : 'Import'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeTool === 'templates' ? (
                            <div className="flex flex-col max-h-full">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <span className="font-semibold text-base text-gray-900">Templates</span>
                                    <button onClick={() => setActiveTool(null)} className="p-1 rounded hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
                                </div>
                                <div className="px-4 pt-3">
                                    <input value={templateQuery} onChange={(e) => setTemplateQuery(e.target.value)}
                                        placeholder="Search templates"
                                        className="w-full px-3 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800" />
                                </div>
                                <div className="p-4 space-y-5 overflow-y-auto">
                                    {TEMPLATE_GROUPS.map((group) => {
                                        const q = templateQuery.trim().toLowerCase();
                                        const items = group.items.filter((i) => !q || i.label.toLowerCase().includes(q) || group.title.toLowerCase().includes(q));
                                        if (!items.length) return null;
                                        return (
                                            <div key={group.title}>
                                                <p className="text-xs font-semibold text-gray-600 mb-2">{group.title}</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {items.map((item) => (
                                                        <button key={item.id} onClick={() => applyTemplateItem(item)} title={item.label}
                                                            className="group cursor-pointer">
                                                            <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group-hover:border-blue-400 flex items-center justify-center"
                                                                style={{ ...thumbBgStyle(item), ...(item.apply?.round ? { borderRadius: '9999px' } : {}) }}>
                                                                {item.apply?.bg?.type === 'image' && (
                                                                    <img src={item.apply.bg.src} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                                                )}
                                                                {displayImage
                                                                    ? <img src={displayImage} alt="" className="relative max-w-[78%] max-h-[78%] object-contain" style={{ filter: thumbFilter(item) }} />
                                                                    : <ImageIcon className="relative w-5 h-5 text-gray-300" />}
                                                            </div>
                                                            <span className="block text-[10px] text-gray-500 text-center mt-1 truncate">{item.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                        <>
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {originalUrl && <img src={originalUrl} alt="" className="w-8 h-8 rounded object-cover" />}
                                    <span className="font-semibold text-sm text-gray-900">
                                        {originalUrl ? 'Image' : 'No image'}
                                    </span>
                                </div>
                                <button onClick={handleSave} disabled={!displayImage || saving} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 cursor-pointer">
                                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-1 mb-3">
                                <button className="flex flex-col items-center gap-1 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-500 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}>
                                    <Undo className="w-4 h-4" /> Replace
                                </button>
                                <button
                                    className="flex flex-col items-center gap-1 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-500 transition-colors disabled:opacity-40"
                                    disabled={!displayImage || applyingAi}
                                    onClick={() => handleRetouchRelight('retouch')}>
                                    <Sparkles className="w-4 h-4" />
                                    {applyingAi ? '...' : 'Retouch'}
                                </button>
                                <button
                                    className="flex flex-col items-center gap-1 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-500 transition-colors disabled:opacity-40"
                                    disabled={!displayImage || applyingAi}
                                    onClick={() => handleRetouchRelight('light')}>
                                    <Sun className="w-4 h-4" /> Light On
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 mb-2">Align to canvas</p>
                            <div className="grid grid-cols-2 gap-1 mb-4">
                                <button onClick={() => setPosX(0)} disabled={!displayImage} className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                                    <AlignCenter className="w-3.5 h-3.5" /> Center
                                </button>
                                <button onClick={() => setPosY(0)} disabled={!displayImage} className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                                    <AlignVerticalJustifyCenter className="w-3.5 h-3.5" /> Middle
                                </button>
                            </div>

                            {/* Remove background */}
                            <div className="flex items-center justify-between py-2.5 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-sm text-gray-900">
                                    <Scissors className="w-4 h-4 text-gray-500" />
                                    Remove background
                                </div>
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <Toggle enabled={removeBg} onChange={handleRemoveBgToggle} />
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                </div>
                            </div>

                            <button onClick={openCutout} disabled={!displayImage} className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                                <Pencil className="w-3.5 h-3.5" /> Edit Cutout
                            </button>
                        </div>

                        {/* Expandable panels */}
                        <div className="flex-1 px-2 py-2">

                            {/* Shadows */}
                            <div className="rounded-lg overflow-hidden mb-0.5">
                                <div onClick={() => togglePanel('shadows')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer">
                                    <span className="text-sm text-gray-900">Shadows</span>
                                    <div className="flex items-center gap-1.5">
                                        <Toggle enabled={toggles.shadows} onChange={val => setToggles(p => ({ ...p, shadows: val }))} />
                                        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedPanel === 'shadows' ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>
                                {expandedPanel === 'shadows' && toggles.shadows && (
                                    <div className="px-3 pb-3 bg-gray-100">
                                        <Slider label="Blur" value={shadowBlur} min={0} max={50} onChange={setShadowBlur} unit="px" />
                                        <Slider label="Opacity" value={shadowOpacity} min={0} max={100} onChange={setShadowOpacity} unit="%" />
                                    </div>
                                )}
                            </div>

                            {/* Outline */}
                            <div className="rounded-lg overflow-hidden mb-0.5">
                                <div onClick={() => togglePanel('outline')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer">
                                    <span className="text-sm text-gray-900">Outline</span>
                                    <div className="flex items-center gap-1.5">
                                        <Toggle enabled={toggles.outline} onChange={val => setToggles(p => ({ ...p, outline: val }))} />
                                        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedPanel === 'outline' ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>
                            </div>

                            {/* Reflection */}
                            <div className="rounded-lg overflow-hidden mb-0.5">
                                <div onClick={() => togglePanel('reflection')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer">
                                    <span className="text-sm text-gray-900">Reflection</span>
                                    <div className="flex items-center gap-1.5">
                                        <Toggle enabled={toggles.reflection} onChange={val => setToggles(p => ({ ...p, reflection: val }))} />
                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Adjust */}
                            <div className="rounded-lg overflow-hidden mb-0.5">
                                <button onClick={() => togglePanel('adjust')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 transition-colors">
                                    <span className="text-sm text-gray-900">Adjust</span>
                                    <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedPanel === 'adjust' ? 'rotate-90' : ''}`} />
                                </button>
                                {expandedPanel === 'adjust' && (
                                    <div className="px-3 pb-3 bg-gray-100">
                                        <Slider label="Brightness" value={brightness} min={0} max={200} onChange={setBrightness} unit="%" />
                                        <Slider label="Contrast" value={contrast} min={0} max={200} onChange={setContrast} unit="%" />
                                        <Slider label="Saturation" value={saturation} min={0} max={200} onChange={setSaturation} unit="%" />
                                        <button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}
                                            className="mt-2 text-xs text-blue-600 hover:text-blue-700">Reset adjustments</button>
                                    </div>
                                )}
                            </div>

                            {/* Blend */}
                            <div className="rounded-lg overflow-hidden mb-0.5">
                                <button className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 transition-colors">
                                    <span className="text-sm text-gray-900">Blend</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-gray-500">Normal</span>
                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                    </div>
                                </button>
                            </div>

                            {/* Transform */}
                            <div className="rounded-lg overflow-hidden mb-0.5">
                                <button onClick={() => togglePanel('transform')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 transition-colors">
                                    <span className="text-sm text-gray-900">Transform</span>
                                    <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedPanel === 'transform' ? 'rotate-90' : ''}`} />
                                </button>
                                {expandedPanel === 'transform' && (
                                    <div className="px-3 pb-3 bg-gray-100">
                                        <Slider label="Rotation" value={rotation} min={-180} max={180} onChange={setRotation} unit="°" />
                                        <Slider label="Scale" value={scale} min={20} max={200} onChange={setBaseScale} unit="%" />
                                        <button onClick={() => setFlipH(f => !f)}
                                            className="mt-2 flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700">
                                            <FlipHorizontal className="w-3.5 h-3.5" /> Flip horizontal
                                        </button>
                                        <button onClick={() => { setRotation(0); setBaseScale(100); setFlipH(false); }}
                                            className="mt-1 text-xs text-gray-500 hover:text-gray-500">Reset transform</button>
                                    </div>
                                )}
                            </div>

                            {/* Position */}
                            <div className="rounded-lg overflow-hidden mb-0.5">
                                <button className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 transition-colors">
                                    <span className="text-sm text-gray-900">Position</span>
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            {/* Blur */}
                            <div className="rounded-lg overflow-hidden mb-0.5">
                                <div onClick={() => togglePanel('blur')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer">
                                    <span className="text-sm text-gray-900">Blur</span>
                                    <div className="flex items-center gap-1.5">
                                        <Toggle enabled={toggles.blur} onChange={val => setToggles(p => ({ ...p, blur: val }))} />
                                        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedPanel === 'blur' ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>
                                {expandedPanel === 'blur' && toggles.blur && (
                                    <div className="px-3 pb-3 bg-gray-100">
                                        <Slider label="Amount" value={blurAmount} min={0} max={20} onChange={setBlurAmount} unit="px" />
                                    </div>
                                )}
                            </div>

                            {/* Filter */}
                            <div className="rounded-lg overflow-hidden mb-0.5">
                                <div onClick={() => togglePanel('filter')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer">
                                    <span className="text-sm text-gray-900">Filter</span>
                                    <div className="flex items-center gap-1.5">
                                        <Toggle enabled={toggles.filter} onChange={val => { setToggles(p => ({ ...p, filter: val })); if (!val) setSelectedFilter('none'); }} />
                                        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedPanel === 'filter' ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>
                                {expandedPanel === 'filter' && toggles.filter && (
                                    <div className="px-3 pb-3 bg-gray-100">
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {filters.map(f => (
                                                <button key={f} onClick={() => setSelectedFilter(f)}
                                                    className={`px-2.5 py-1 rounded-md text-xs capitalize border transition-all ${selectedFilter === f ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                                                    {f === 'none' ? 'None' : f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Bottom tools — act on the selected overlay layer */}
                        <div className="border-t border-gray-200 grid grid-cols-3 divide-x divide-gray-100">
                            {[
                                { id: 'front', label: 'Front', icon: '⬆' },
                                { id: 'back', label: 'Back', icon: '⬇' },
                                { id: 'dup', label: 'Duplicate', icon: '❐' },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        if (!selectedLayerId) { toast.info('Select an inserted element first.'); return; }
                                        if (t.id === 'front') reorderLayer(selectedLayerId, 'front');
                                        else if (t.id === 'back') reorderLayer(selectedLayerId, 'back');
                                        else duplicateLayer(selectedLayerId);
                                    }}
                                    className="flex flex-col items-center gap-1 py-3 hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <span className="text-sm">{t.icon}</span>
                                    <span className="text-xs text-gray-500">{t.label}</span>
                                </button>
                            ))}
                        </div>
                        </>
                        )}
                    </div>
                </div>
            </div>

            {cutoutOpen && (
                <div className="fixed inset-0 z-[140] bg-black/70 flex flex-col items-center justify-center gap-4 p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 bg-surface rounded-xl px-4 py-2 shadow">
                        <span className="text-sm font-semibold text-gray-800">Edit Cutout — brush to erase</span>
                        <span className="text-xs text-gray-500">Brush</span>
                        <input type="range" min={8} max={120} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-32 accent-blue-600" />
                        <span className="text-xs text-gray-500 w-8">{brushSize}</span>
                    </div>
                    <div className="rounded-lg overflow-hidden" style={{ backgroundImage: 'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0,0 10px,10px -10px,-10px 0', backgroundColor: '#f0f0f0' }}>
                        <canvas
                            ref={cutoutCanvasRef}
                            className="block max-w-[78vw] max-h-[62vh] cursor-crosshair touch-none"
                            onPointerDown={(e) => { cutoutDrawing.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); eraseAt(e); }}
                            onPointerMove={(e) => { if (cutoutDrawing.current) eraseAt(e); }}
                            onPointerUp={(e) => { cutoutDrawing.current = false; e.currentTarget.releasePointerCapture?.(e.pointerId); }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={drawCutoutBase} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-surface hover:bg-gray-100 cursor-pointer">Reset</button>
                        <button onClick={() => setCutoutOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-surface hover:bg-gray-100 cursor-pointer">Cancel</button>
                        <button onClick={applyCutout} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 cursor-pointer">Apply</button>
                    </div>
                </div>
            )}
        </div>
    );
}