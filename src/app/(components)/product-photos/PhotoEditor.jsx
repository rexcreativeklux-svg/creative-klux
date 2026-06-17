import { useState, useRef, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import {
    X, Undo, Redo, Plus, Download, Share2, ChevronRight,
    AlignCenter, AlignVerticalJustifyCenter,
    Scissors, Pencil, Sun, Layers, Box,
    Sparkles, SlidersHorizontal, ImageIcon, Type, Loader2,
    FlipHorizontal, Upload, Trash2, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const topTools = [
    { id: 'insert', label: 'Insert', icon: Plus },
    { id: 'brandit', label: 'Brand it', icon: ImageIcon },
    { id: 'addtext', label: 'Add text', icon: Type },
    { id: 'templates', label: 'Templates', icon: Layers },
    { id: 'backgrounds', label: 'Backgrounds', icon: Box },
    { id: 'aishadows', label: 'AI Shadows', icon: Sun },
    { id: 'resize', label: 'Resize', icon: SlidersHorizontal },
];

// Logical design-canvas size (matches the preview box). Exports render at 2×.
const CANVAS_W = 520;
const CANVAS_H = 440;
const EXPORT_SCALE = 2;

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
    const { uploadImage, myImages = [] } = useAuth();
    const fileInputRef = useRef(null);
    const imgRef = useRef(null);
    const insertFileRef = useRef(null);
    const [saving, setSaving] = useState(false);

    // ── Layer system (overlay elements on top of the base image) ──────────
    const [layers, setLayers] = useState([]);
    const [selectedLayerId, setSelectedLayerId] = useState(null);
    const [activeTool, setActiveTool] = useState(null); // null = image-edit panel; 'insert' = Insert panel
    const [insertCat, setInsertCat] = useState(null); // open category id within the Insert panel
    const [shapeColor, setShapeColor] = useState(SHAPE_COLORS[0]);
    const layerDragRef = useRef(null);
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
        posX, posY, toggles, layers,
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
    };

    const canUndo = histIndex > 0;
    const canRedo = histIndex >= 0 && histIndex < history.length - 1;
    const handleUndo = () => { if (!canUndo) return; const i = histIndex - 1; applySnapshot(history[i]); setHistIndex(i); };
    const handleRedo = () => { if (!canRedo) return; const i = histIndex + 1; applySnapshot(history[i]); setHistIndex(i); };

    // ── Drag to move (powers Align) ───────────────────────────────────────
    const onImgPointerDown = (e) => {
        e.stopPropagation();
        setSelected(true);
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
        if (id === 'aishadows') {
            setActiveTool(null);
            setToggles((p) => ({ ...p, shadows: true }));
            setExpandedPanel('shadows');
            return;
        }
        toast.info('This tool is coming soon.');
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
        addLayer({ ...spec, x: CANVAS_W / 2, y: CANVAS_H / 2, w: spec.w || d, h: spec.h || d });
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
    const deleteLayer = (id) => { setLayers((prev) => prev.filter((l) => l.id !== id)); setSelectedLayerId((s) => (s === id ? null : s)); };
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
    // Resize a layer (bottom-right handle)
    const onResizePointerDown = (e, layer) => {
        e.stopPropagation();
        layerDragRef.current = { id: layer.id, mode: 'resize', sx: e.clientX, sy: e.clientY, bw: layer.w, bh: layer.h };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const onResizePointerMove = (e) => {
        const d = layerDragRef.current;
        if (!d || d.mode !== 'resize') return;
        updateLayer(d.id, {
            w: Math.max(20, d.bw + (e.clientX - d.sx)),
            h: Math.max(20, d.bh + (e.clientY - d.sy)),
        });
    };

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
        const sc = EXPORT_SCALE;
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_W * sc;
        canvas.height = CANVAS_H * sc;
        const ctx = canvas.getContext('2d');

        // Base image, placed where it appears in the preview.
        if (displayImage && imgRef.current) {
            const im = await loadImageEl(displayImage);
            const lw = imgRef.current.offsetWidth || im.naturalWidth;
            const lh = imgRef.current.offsetHeight || im.naturalHeight;
            const s = scale / 100;
            const dw = lw * sc * s, dh = lh * sc * s;
            ctx.save();
            ctx.translate((CANVAS_W / 2 + posX) * sc, (CANVAS_H / 2 + posY) * sc);
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
            // eslint-disable-next-line no-await-in-loop
            await drawLayer(ctx, layer, sc);
        }
        return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    };

    // Pick the right exporter: frame (with layers) vs. tight product crop.
    const exportBlob = async () => (layers.length > 0 ? renderFrameToCanvas() : renderToCanvas());

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
                                    ) : displayImage && (
                                        <div
                                            className={`relative cursor-move ${selected ? 'outline outline-2 outline-blue-500' : ''}`}
                                            onClick={e => { e.stopPropagation(); setSelected(true); }}
                                            onPointerDown={onImgPointerDown}
                                            onPointerMove={onImgPointerMove}
                                            onPointerUp={onImgPointerUp}
                                            style={{ maxWidth: '78%', maxHeight: '82%', position: 'relative', touchAction: 'none' }}
                                        >
                                            {selected && (
                                                <>
                                                    {[[-1, -1, 'tl'], ['50%', -1, 'tc'], ['100%', -1, 'tr'], [-1, '50%', 'ml'], ['100%', '50%', 'mr'], [-1, '100%', 'bl'], ['50%', '100%', 'bc'], ['100%', '100%', 'br']].map(([l, t, k]) => (
                                                        <div key={k} className="absolute w-3 h-3 bg-surface border-2 border-blue-500 rounded-sm z-10"
                                                            style={{ left: typeof l === 'number' ? `${l}px` : l, top: typeof t === 'number' ? `${t}px` : t, transform: 'translate(-50%,-50%)' }} />
                                                    ))}
                                                    <div className="absolute -top-10 left-0 flex items-center gap-1 bg-surface rounded-lg shadow px-2 py-1 z-10">
                                                        <button onClick={e => { e.stopPropagation(); setOriginalUrl(null); setProcessedUrl(null); setSelected(false); setRemoveBg(false); }}
                                                            className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">🗑</button>
                                                        <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                            className="p-1 hover:bg-gray-100 rounded text-gray-500 text-xs font-medium">Replace</button>
                                                        <button className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">···</button>
                                                    </div>
                                                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface border-2 border-blue-500 rounded-full z-10 flex items-center justify-center cursor-e-resize">
                                                        <div className="w-1 h-1 rounded-full bg-blue-500" />
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

                            {/* Overlay layers (Insert) */}
                            {layers.map((layer) => {
                                const isSel = layer.id === selectedLayerId;
                                return (
                                    <div
                                        key={layer.id}
                                        onPointerDown={(e) => onLayerPointerDown(e, layer)}
                                        onPointerMove={onLayerPointerMove}
                                        onPointerUp={onLayerPointerUp}
                                        onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                                        className={`absolute select-none ${isSel ? 'outline outline-2 outline-blue-500' : ''}`}
                                        style={{
                                            left: layer.x - layer.w / 2,
                                            top: layer.y - layer.h / 2,
                                            width: layer.w,
                                            height: layer.h,
                                            transform: `rotate(${layer.rotation || 0}deg)`,
                                            cursor: 'move',
                                            touchAction: 'none',
                                            zIndex: 5,
                                        }}
                                    >
                                        <VisualSVG spec={layer} />
                                        {isSel && (
                                            <>
                                                <div className="absolute -top-9 left-0 flex items-center gap-1 bg-surface rounded-lg shadow px-1.5 py-1" onPointerDown={(e) => e.stopPropagation()}>
                                                    <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} className="p-1 hover:bg-gray-100 rounded text-gray-500 cursor-pointer" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} className="p-1 hover:bg-gray-100 rounded text-red-500 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <div
                                                    onPointerDown={(e) => onResizePointerDown(e, layer)}
                                                    onPointerMove={onResizePointerMove}
                                                    onPointerUp={onLayerPointerUp}
                                                    className="absolute w-3 h-3 bg-surface border-2 border-blue-500 rounded-sm cursor-se-resize"
                                                    style={{ right: -6, bottom: -6, touchAction: 'none' }}
                                                />
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
                        {activeTool === 'insert' ? (
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

                            <button onClick={() => toast.info('Edit Cutout is coming soon.')} className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-400 transition-colors cursor-pointer">
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
                                        <Slider label="Scale" value={scale} min={20} max={200} onChange={setScale} unit="%" />
                                        <button onClick={() => setFlipH(f => !f)}
                                            className="mt-2 flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700">
                                            <FlipHorizontal className="w-3.5 h-3.5" /> Flip horizontal
                                        </button>
                                        <button onClick={() => { setRotation(0); setScale(100); setFlipH(false); }}
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
        </div>
    );
}