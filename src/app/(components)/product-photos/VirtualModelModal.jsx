import { useState, useRef, useEffect } from 'react';
import { generateProductPhoto, TOOL_ENUM, QUALITY_ENUM } from '@/(lib)/product-photos-api';
import MediaPickerModal from '@/app/(components)/MediaPickerModal';
import { useAuth } from '@/context/AuthContext';
import { X, Plus, Upload, Download, Copy, Loader2, MoreHorizontal, ThumbsUp, ThumbsDown, Trash2, Video, RefreshCw, ChevronDown, User, Package, Image as ImageIcon, Scissors, Layers, Shirt, Sparkles, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

// Tool list for the header switcher (mirrors the product-photos page tools).
// `img` is a real thumbnail; if it fails to load the card falls back to the colored icon tile.
const TOOL_LIST = [
    { id: 'virtual', name: 'Virtual Model', Icon: User, color: 'bg-pink-100 text-pink-600', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=240&q=80' },
    { id: 'staging', name: 'Product Staging', Icon: Package, color: 'bg-amber-100 text-amber-600', img: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=240&q=80' },
    { id: 'bgremove', name: 'Background Remover', Icon: Scissors, color: 'bg-red-100 text-red-600', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=240&q=80' },
    { id: 'beautifier', name: 'Product Beautifier', Icon: Sparkles, color: 'bg-yellow-100 text-yellow-600', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=240&q=80' },
    { id: 'start', name: 'Edit with AI', Icon: ImageIcon, color: 'bg-blue-100 text-blue-600', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=240&q=80' },
    { id: 'flatlay', name: 'Flat Lay', Icon: LayoutGrid, color: 'bg-cyan-100 text-cyan-600', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=240&q=80' },
    { id: 'mannequin', name: 'Ghost Mannequin', Icon: Shirt, color: 'bg-emerald-100 text-emerald-600', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=240&q=80' },
    { id: 'batch', name: 'Batch', Icon: Layers, color: 'bg-purple-100 text-purple-600', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=240&q=80' },
    { id: 'video', name: 'Video Generator', Icon: Video, color: 'bg-indigo-100 text-indigo-600', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=240&q=80' },
];

const RECENT_TOOL_IDS = ['virtual', 'staging'];

// A single tool card — name on the left, real thumbnail on the right (falls back to icon tile).
function ToolCard({ tool, active, onClick }) {
    const [imgOk, setImgOk] = useState(true);
    const { Icon } = tool;
    return (
        <button
            onClick={() => onClick(tool.id)}
            className={`flex items-stretch justify-between gap-2 rounded-xl overflow-hidden h-16 text-left transition-colors ${active ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-100 hover:bg-gray-100'}`}
        >
            <span className="text-sm font-semibold text-gray-900 leading-tight self-center pl-3.5 flex-1">{tool.name}</span>
            <div className={`w-20 shrink-0 flex items-center justify-center ${tool.color}`}>
                {imgOk
                    ? <img src={tool.img} alt={tool.name} className="w-full h-full object-cover" onError={() => setImgOk(false)} />
                    : <Icon className="w-6 h-6" />}
            </div>
        </button>
    );
}

// Floating panel anchored BELOW its anchor (header dropdown).
function DropdownBelow({ anchorRef, children, width = 460 }) {
    const [pos, setPos] = useState({ top: 0, left: 0 });
    useEffect(() => {
        if (anchorRef?.current) {
            const r = anchorRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 6, left: r.left });
        }
    }, [anchorRef]);
    return (
        <div
            className="fixed z-210 bg-surface rounded-2xl shadow-2xl border border-gray-200 p-3 max-h-[80vh] overflow-y-auto"
            style={{ top: pos.top, left: pos.left, width }}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    );
}

// Real model/pose reference photos from Pexels (free license, stable CDN URLs).
// No fit=crop — resize by height only so the full figure (head included) is preserved.
const px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=600`;
// Landscape thumbnails for background swatches.
const pxbg = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=320&h=240&fit=crop`;
const CLOTHING_IMG =
  "https://d3r8chxzp8ea06.cloudfront.net/creativeklux/creativeklux-file-1783763628-6a5212ac83271.webp";

const MODELS = [
  {
    id: "avery",
    name: "Avery",
    emoji: "👩",
    desc: "Woman, straight hair, jeans",
    img: px(6780091),
  },
  {
    id: "sam",
    name: "Sam",
    emoji: "👨",
    desc: "Man, black tee, grey pants",
    img: px(29727777),
  },
  {
    id: "taylor",
    name: "Taylor",
    emoji: "👨",
    desc: "Man, white tee, khaki",
    img: px(37741914),
  },
  {
    id: "kendall",
    name: "Kendall",
    emoji: "👩",
    desc: "Woman, white tee, jeans",
    img: px(6780038),
  },
  {
    id: "jordan",
    name: "Jordan",
    emoji: "👨",
    desc: "Man, beige outfit",
    img: "https://d3r8chxzp8ea06.cloudfront.net/creativeklux/creativeklux-file-1783764125-6a52149db8770.webp",
  },
  {
    id: "casey",
    name: "Casey",
    emoji: "👩",
    desc: "Woman, all white",
    img: px(31215272),
  },
  {
    id: "alex",
    name: "Alex",
    emoji: "👩",
    desc: "Woman, beige set",
    img: px(6780036),
  },
  {
    id: "maya",
    name: "Maya",
    emoji: "👩",
    desc: "Woman, black outfit",
    img: px(5421296),
  },
  {
    id: "reece",
    name: "Reece",
    emoji: "👨",
    desc: "Man, casual jeans",
    img: px(18516993),
  },
  {
    id: "lara",
    name: "Lara",
    emoji: "👩",
    desc: "Woman, blue jeans",
    img: px(5112737),
  },
  {
    id: "julia",
    name: "Julia",
    emoji: "👩",
    desc: "Woman, light jeans",
    img: px(31042871),
  },
];

const POSES = [
    { id: 'random', name: 'Random', img: px(31046827) },
    { id: 'standing', name: 'Standing', img: px(27542891) },
    { id: '3_4_turn', name: '3/4 Turn', img: px(31046829) },
    { id: 'power_stance', name: 'Power Stance', img: px(32325987) },
    { id: 'walking', name: 'Walking Forward', img: px(1803779) },
    { id: 'hand_pocket', name: 'Hand in Pocket', img: px(36759684) },
    { id: 'crossed_arms', name: 'Crossed Arms', img: px(33821631) },
    { id: 'back', name: 'Back', img: px(31894858) },
    { id: 'over_shoulder', name: 'Over-the-Shoulder', img: px(5413902) },
    { id: 'seated', name: 'Seated Casual', img: px(5412379) },
    { id: 'adjusting', name: 'Adjusting Clothing', img: px(36322478) },
    { id: 'playful', name: 'Playful Spin', img: px(7209534) },
];

const BACKGROUNDS = [
    { id: 'custom', name: 'Custom', color: '#e0e0e0' }, // no image — shows a "+" tile
    { id: 'random', name: 'Random', color: '#c8d8c8', img: pxbg(20002520) },
    { id: 'street', name: 'Street', color: '#d0c8b8', img: pxbg(12497049) },
    { id: 'bedroom', name: 'Bedroom', color: '#e8d8c8', img: pxbg(31488380) },
    { id: 'sunset', name: 'Sunset', color: '#f0c060', img: pxbg(709573) },
    { id: 'factory', name: 'Factory', color: '#888', img: pxbg(236709) },
    { id: 'studio', name: 'Studio', color: '#f0f0f0', img: pxbg(1932666) },
    { id: 'colored_studio', name: 'Colored Studio', color: '#a0c0e0', img: pxbg(36789468) },
    { id: 'concrete_studio', name: 'Concrete Studio', color: '#b0b0b0', img: pxbg(2463329) },
    { id: 'beach', name: 'Beach', color: '#70b8e0', img: pxbg(5232809) },
    { id: 'tropical', name: 'Tropical', color: '#40a860', img: pxbg(6910147) },
    { id: 'library', name: 'Library', color: '#c8a870', img: pxbg(5225982) },
    { id: 'forest', name: 'Forest', color: '#508040', img: pxbg(1437601) },
    { id: 'business', name: 'Business District', color: '#708090', img: pxbg(13012283) },
    { id: 'countryside', name: 'Countryside', color: '#90b860', img: pxbg(4268073) },
    { id: 'flowers', name: 'Flowers', color: '#e080a0', img: pxbg(16563299) },
    { id: 'golden_light', name: 'Golden Light', color: '#e0a840', img: pxbg(30608651) },
    { id: 'mountain', name: 'Mountain', color: '#8090a8', img: pxbg(2734347) },
    { id: 'pool', name: 'Pool', color: '#40a8d0', img: pxbg(10739637) },
    { id: 'latin_city', name: 'Latin City', color: '#c09060', img: pxbg(16215575) },
    { id: 'cafe', name: 'Cafe', color: '#a07850', img: pxbg(17104305) },
    { id: 'asian_city', name: 'Asian City', color: '#f060a0', img: pxbg(33901684) },
    { id: 'night_lights', name: 'Night Lights', color: '#2030a0', img: pxbg(18462155) },
    { id: 'desert', name: 'Desert', color: '#d0a860', img: pxbg(8869381) },
];

const SIZES = [
    { id: 'original', name: 'Original', w: 1, h: 1 },
    { id: 'portrait_9_16', name: 'Portrait (9:16)', w: 9, h: 16 },
    { id: 'portrait_3_4', name: 'Portrait (3:4)', w: 3, h: 4 },
    { id: 'portrait_2_3', name: 'Portrait (2:3)', w: 2, h: 3 },
    { id: 'square', name: 'Square', w: 1, h: 1 },
    { id: 'landscape_3_2', name: 'Landscape (3:2)', w: 3, h: 2 },
    { id: 'landscape_4_3', name: 'Landscape (4:3)', w: 4, h: 3 },
    { id: 'landscape_16_9', name: 'Landscape (16:9)', w: 16, h: 9 },
];

// Resolution badge shown next to the selected quality (matches Photoroom's 1K/2K/4K chip)
const QUALITY_RES = { Standard: '1K', High: '2K', Ultra: '4K' };

// Quality tiers shown as rich cards in the Quality dropdown (id matches the `quality` state).
const QUALITY_TIERS = [
    {
        id: 'Ultra', name: 'Premium', tag: 'Ultra', tagColor: 'bg-blue-100 text-blue-700',
        img: px(6780091),
        features: ['4k+ resolution', 'Best product accuracy', 'Most realistic models', 'Highest quality', 'Consumes most credits'],
    },
    {
        id: 'High', name: 'Advanced', tag: 'Max', tagColor: 'bg-indigo-100 text-indigo-700',
        img: px(6780038),
        features: ['2k resolution', 'Better product accuracy', 'Realistic models', 'High quality', 'Consumes more credits'],
    },
    {
        id: 'Standard', name: 'Standard', tag: 'Pro', tagColor: 'bg-emerald-100 text-emerald-700',
        img: px(6780036),
        features: ['1k resolution', 'Good product accuracy', 'Fast generations', 'Consumes less credits'],
    },
];

// Floating panel rendered at fixed position to escape sidebar overflow clipping.
// Anchors to the right of the trigger, then clamps into the viewport so it never
// runs off the bottom/right edge (flips to the left side if there's no room).
function FloatingPanel({ anchorRef, children, width = 320 }) {
    const panelRef = useRef(null);
    const [pos, setPos] = useState({ top: -9999, left: -9999 });

    useEffect(() => {
        const a = anchorRef?.current;
        const p = panelRef.current;
        if (!a || !p) return;
        const r = a.getBoundingClientRect();
        const pw = p.offsetWidth || width;
        const ph = p.offsetHeight;
        const margin = 12;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let left = r.right + 4;
        if (left + pw > vw - margin) left = r.left - pw - 4;      // flip to the left of the trigger
        if (left < margin) left = vw - pw - margin;               // last resort: pin to right edge
        left = Math.max(margin, left);

        let top = r.top;
        if (top + ph > vh - margin) top = vh - ph - margin;       // lift up so the bottom stays visible
        top = Math.max(margin, top);

        setPos({ top, left });
    }, [anchorRef, width]);

    return (
        <div
            ref={panelRef}
            className="fixed z-200 bg-surface rounded-xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto"
            style={{ top: pos.top, left: pos.left, width }}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    );
}

export default function VirtualModelModal({ onClose, onSwitchTool }) {
    const { activeBrand, uploadImage } = useAuth();
    const qualityRef = useRef(null);
    const backgroundRef = useRef(null);
    const sizeRef = useRef(null);
    const modelRef = useRef(null);
    const poseRef = useRef(null);
    const headerRef = useRef(null);

    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [selectedModel, setSelectedModel] = useState('jordan');
    const [selectedPose, setSelectedPose] = useState('3_4_turn');
    const [quality, setQuality] = useState('Standard');
    const [background, setBackground] = useState('concrete_studio');
    const [size, setSize] = useState('portrait_2_3');
    const [applyBrandStyle, setApplyBrandStyle] = useState(true);
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [imageMenu, setImageMenu] = useState(null); // { idx, x, y }
    const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // gallery/cloud URL of the picked image
    const [toolMenuOpen, setToolMenuOpen] = useState(false); // header tool switcher
    const [pickerOpen, setPickerOpen] = useState(false); // gallery media picker

    // Header tool switcher: clicking the current tool just closes; any other tool
    // tells the parent to swap modals (parent opens the right one + closes this).
    const handleToolClick = (id) => {
        setToolMenuOpen(false);
        if (id === 'virtual') return; // already here
        onSwitchTool?.(id);
    };

    // Image comes from the gallery picker (My Library / Search / Upload). We only
    // use ONE image. A fresh desktop upload carries a File + a LOCAL blob: URL
    // (not sendable to the backend), so we keep the File and leave the hosted URL
    // null — it's uploaded on generate to get a real URL. A library/search pick
    // already has a hosted URL we can send straight through.
    const handleApplyFromPicker = (images = []) => {
        const item = images[0];
        if (!item) return;
        if (item.file instanceof File) {
            setUploadedFile(item.file);
            setUploadedImage(item.src || URL.createObjectURL(item.file));
            setUploadedFileUrl(null); // resolve a hosted URL on generate
        } else {
            const url = item.large || item.src || null;
            if (!url) return;
            setUploadedFile(null);
            setUploadedImage(url);
            setUploadedFileUrl(url); // already hosted
        }
        setPickerOpen(false);
    };

    const handleGenerate = async () => {
        if (!uploadedFile && !uploadedImage) { toast.error('Please select a product image first'); return; }
        setGenerating(true);
        setOpenDropdown(null);
        try {
            // Resolve the ONE image URL to send. Picks from the gallery already have
            // a hosted URL; a fresh local upload gets uploaded here to obtain one.
            let imageUrl = uploadedFileUrl;
            if (!imageUrl && uploadedFile) {
                const uploaded = await uploadImage(uploadedFile);
                console.log('🖼️ [virtual-model] upload response ←', uploaded);
                imageUrl = uploaded?.url || uploaded?.image_url || uploaded?.file_url || uploaded?.data?.url;
                setUploadedFileUrl(imageUrl || null);
            }
            if (!imageUrl) { toast.error('Please select a product image'); setGenerating(false); return; }

            // Backend contract: POST /product-photos/generate
            const payload = {
                tool: TOOL_ENUM.virtual_model,          // "virtual_model"
                image_url: imageUrl,                        // single image URL
                model_name: selectedModel,              // model id, e.g. "jordan"
                model_image_url: MODELS[selectedModel.toLocaleLowerCase()],
                pose: selectedPose,                     // pose id, e.g. "3_4_turn"
                quality: QUALITY_ENUM[quality] || 'standard',
                size,                                   // aspect-ratio id
                apply_brand_style: applyBrandStyle,
                prompt: prompt || '',
                // workspace_id omitted for now (confirm source with backend).
            };

            const result = await generateProductPhoto(payload);

            // Log the raw return so we can see its exact shape while consuming it.
            console.log('🎨 [virtual-model] generate result ←', result);

            const resultUrl = result?.url || result?.image_url || result?.data?.url;
            if (resultUrl) {
                setGeneratedImages(prev => [resultUrl, ...prev]);
                toast.success('Image generated!');
            } else {
                toast('Generated — check the console for the response shape.');
            }
        } catch (err) {
            // generateProductPhoto already toasts a friendly error; log for debugging.
            console.error('❌ [virtual-model] generate failed:', err);
        } finally {
            setGenerating(false);
        }
    };

    const toggle = (key) => setOpenDropdown(p => p === key ? null : key);

    const modelObj = MODELS.find(m => m.id === selectedModel);
    const poseObj = POSES.find(p => p.id === selectedPose);
    const bgObj = BACKGROUNDS.find(b => b.id === background);
    const sizeObj = SIZES.find(s => s.id === size);

    const closeAll = () => { setOpenDropdown(null); setImageMenu(null); setToolMenuOpen(false); };

    const handleDownload = (url) => {
        const a = document.createElement('a');
        a.href = url; a.download = 'virtual-model.png'; a.target = '_blank'; a.click();
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40" onClick={closeAll}>
            <div
                className="bg-surface rounded-2xl shadow-2xl flex overflow-hidden"
                style={{ width: '95vw', height: '92vh', maxWidth: '1400px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Left sidebar ── */}
                {/* Column with a scrollable body and a pinned Generate footer. */}
                <div className="w-84 border-r border-gray-200 flex flex-col shrink-0">

                    {/* Scrollable content (Generate button stays pinned below) */}
                    <div className="flex-1 overflow-y-auto min-h-0">

                    {/* Header — click the title to open the tool switcher */}
                    <div className="px-5 pt-5 pb-1">
                        <button
                            ref={headerRef}
                            onClick={() => setToolMenuOpen(o => !o)}
                            className="flex items-center gap-2 font-bold text-2xl text-gray-900 hover:opacity-70 transition-opacity"
                        >
                            Virtual Model
                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${toolMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Upload — opens the gallery picker (My Library / Search / Upload) */}
                    <div className="px-4 pt-4">
                        <button
                            onClick={() => setPickerOpen(true)}
                            className="w-full border border-dashed border-gray-200 rounded-2xl py-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="text-blue-600 font-semibold">Select from gallery</span>
                        </button>
                    </div>

                    {/* Uploaded thumb */}
                    {uploadedImage && (
                        <div className="px-4 pt-3">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500">
                                <img src={uploadedImage} alt="product" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}

                    {/* Model & Pose */}
                    <div className="px-4 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Model button */}
                            <button
                                ref={modelRef}
                                onClick={() => toggle('model')}
                                className={`w-full flex flex-col items-center p-2.5 rounded-2xl transition-all ${openDropdown === 'model' ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-100/70 hover:bg-gray-100'}`}
                            >
                                <div className="w-full h-40 rounded-xl overflow-hidden mb-2.5 bg-surface">
                                    <img src={modelObj?.img} alt={modelObj?.name} className="w-full h-full object-contain" />
                                </div>
                                <span className="text-[11px] text-gray-500">Model</span>
                                <span className="text-sm font-semibold text-gray-900">{modelObj?.name}</span>
                            </button>

                            {/* Pose button */}
                            <button
                                ref={poseRef}
                                onClick={() => toggle('pose')}
                                className={`w-full flex flex-col items-center p-2.5 rounded-2xl transition-all ${openDropdown === 'pose' ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-100/70 hover:bg-gray-100'}`}
                            >
                                <div className="w-full h-40 rounded-xl overflow-hidden mb-2.5 bg-surface">
                                    <img src={poseObj?.img} alt={poseObj?.name} className="w-full h-full object-contain" />
                                </div>
                                <span className="text-[11px] text-gray-500">Pose</span>
                                <span className="text-sm font-semibold text-gray-900">{poseObj?.name}</span>
                            </button>
                        </div>
                    </div>

                    {/* Option rows — light gray cards (Photoroom style) */}
                    <div className="px-4 pt-3 pb-3 space-y-2.5">
                        {/* Quality */}
                        <button ref={qualityRef} onClick={() => toggle('quality')}
                            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors">
                            <span className="text-gray-900 font-medium">Quality</span>
                            <span className="text-gray-500 flex items-center gap-2">
                                {quality}
                                <span className="text-[11px] font-bold text-gray-900 bg-surface border border-gray-200 shadow-sm rounded-md px-1.5 py-0.5">{QUALITY_RES[quality]}</span>
                            </span>
                        </button>

                        {/* Background */}
                        <button ref={backgroundRef} onClick={() => toggle('background')}
                            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors">
                            <span className="text-gray-900 font-medium">Background</span>
                            <span className="flex items-center gap-2 text-gray-500">
                                {bgObj?.name}
                                <div className="w-7 h-7 rounded-md border border-gray-200" style={{ backgroundColor: bgObj?.color }} />
                            </span>
                        </button>

                        {/* Size */}
                        <button ref={sizeRef} onClick={() => toggle('size')}
                            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors">
                            <span className="text-gray-900 font-medium">Size</span>
                            <span className="text-gray-500">{sizeObj?.name}</span>
                        </button>

                        {/* Brand style */}
                        <button onClick={() => setApplyBrandStyle(p => !p)}
                            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors">
                            <span className="text-gray-900 font-medium">Apply brand style</span>
                            <span className={applyBrandStyle ? 'text-blue-600 font-semibold' : 'text-gray-500'}>{applyBrandStyle ? 'On' : 'Off'}</span>
                        </button>

                        {/* Prompt */}
                        <div className="rounded-2xl bg-gray-100 px-4 py-3">
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="Describe the image you want (optional)"
                                className="w-full text-sm text-gray-500 placeholder:text-gray-500 bg-transparent outline-none resize-none leading-relaxed"
                                rows={4}
                            />
                        </div>
                    </div>
                    {/* end scrollable content */}
                    </div>

                    {/* Generate — pinned to the bottom of the sidebar */}
                    <div className="px-4 pb-5 pt-3 border-t border-gray-200 bg-surface">
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className={`
    w-full py-3.5 rounded-2xl text-sm cursor-pointer font-semibold text-white
    transition-all flex items-center justify-center gap-2
    disabled:opacity-60
    ${generating
                                    ? 'bg-gray-400'
                                    : 'bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                                }
  `}
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating…
                                </>
                            ) : (
                                'Generate 1 image'
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Right content ── */}
                <div className="flex-1 flex flex-col relative bg-[#f8f8f8] dark:bg-canvas">
                    <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 bg-surface rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 shadow-sm cursor-pointer">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>

                    {generatedImages.length === 0 && !generating ? (
                        <div className="flex-1 flex flex-col items-center justify-center px-6">
                            <div className="flex items-center gap-3 mb-9">
                                <div className="w-44 h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-lg -rotate-3">
                                    <img
                                        src={uploadedImage || CLOTHING_IMG}
                                        alt="product"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* stylish curved arrow */}
                                <svg width="72" height="60" viewBox="0 0 72 60" fill="none" className="text-blue-500 shrink-0 -mt-6">
                                    <path d="M6 44 C 24 8, 50 8, 62 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    <path d="M62 32 L51 28 M62 32 L55 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="w-44 h-56 bg-surface rounded-2xl shadow-lg overflow-hidden border border-gray-200 rotate-3">
                                    <img src={modelObj?.img} alt={modelObj?.name} className="w-full h-full object-cover object-top" />
                                </div>
                            </div>
                            <h3 className="text-gray-900 text-center text-lg font-semibold max-w-sm leading-snug">
                                Visualize your product on a real-looking model
                            </h3>
                            <p className="text-gray-500 text-center text-sm mt-2 max-w-xs leading-relaxed">
                                Upload a product photo and watch it come to life on the model and pose you choose.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto p-6">
                            {generating && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                        <p className="text-gray-500 text-sm">Generating your virtual model…</p>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-4 gap-3">
                                {generatedImages.map((url, idx) => (
                                    <div key={idx} className="relative rounded-xl overflow-hidden group aspect-2/3 bg-gray-100">
                                        <img src={url} alt={`result ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setImageMenu(p => p?.idx === idx ? null : { idx, x: e.clientX, y: e.clientY });
                                            }}
                                            className="absolute top-2 right-2 w-8 h-8 bg-surface/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button className="absolute bottom-2 right-2 w-7 h-7 bg-surface/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-gray-500">⊞</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {generatedImages.length > 0 && (
                        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-surface rounded-full shadow border border-gray-200 px-2 py-1">
                            <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500">−</button>
                            <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500">+</button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tool switcher (header dropdown) ── */}
            {toolMenuOpen && (
                <>
                    {/* transparent backdrop to close on outside click */}
                    <div className="fixed inset-0 z-205" onClick={() => setToolMenuOpen(false)} />
                    <DropdownBelow anchorRef={headerRef} width={460}>
                        <p className="text-xs font-semibold text-gray-500 px-1 mb-2">Recently used</p>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {RECENT_TOOL_IDS.map(id => {
                                const tool = TOOL_LIST.find(t => t.id === id);
                                if (!tool) return null;
                                return <ToolCard key={`recent-${tool.id}`} tool={tool} active={tool.id === 'virtual'} onClick={handleToolClick} />;
                            })}
                        </div>
                        <p className="text-xs font-semibold text-gray-500 px-1 mb-2">All tools</p>
                        <div className="grid grid-cols-2 gap-2">
                            {TOOL_LIST.map(tool => (
                                <ToolCard key={tool.id} tool={tool} active={tool.id === 'virtual'} onClick={handleToolClick} />
                            ))}
                        </div>
                    </DropdownBelow>
                </>
            )}

            {/* ── Floating dropdowns (fixed, above everything) ── */}
            {/* transparent backdrop closes whichever picker is open on outside click */}
            {openDropdown && (
                <div className="fixed inset-0 z-195" onClick={() => setOpenDropdown(null)} />
            )}
            {openDropdown === 'model' && (
                <FloatingPanel anchorRef={modelRef} width={310}>
                    <div className="grid grid-cols-4 gap-2 p-3">
                        <button className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg h-24 text-gray-500 hover:border-blue-400 transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                        {MODELS.map(m => (
                            <button key={m.id} onClick={() => { setSelectedModel(m.id); setOpenDropdown(null); }}
                                className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-colors ${selectedModel === m.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
                                <div className="w-14 h-20 bg-gray-100 rounded-lg overflow-hidden relative mb-1">
                                    <img src={m.img} alt={m.name} className="w-full h-full object-cover object-top" />
                                    {selectedModel === m.id && <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">✓</span></div>}
                                </div>
                                <span className="text-[10px] text-gray-500">{m.name}</span>
                            </button>
                        ))}
                    </div>
                </FloatingPanel>
            )}

            {openDropdown === 'pose' && (
                <FloatingPanel anchorRef={poseRef} width={310}>
                    <div className="grid grid-cols-4 gap-2 p-3">
                        {POSES.map(p => (
                            <button key={p.id} onClick={() => { setSelectedPose(p.id); setOpenDropdown(null); }}
                                className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-colors ${selectedPose === p.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
                                <div className="w-14 h-20 bg-gray-100 rounded-lg overflow-hidden relative mb-1">
                                    <img src={p.img} alt={p.name} className="w-full h-full object-cover object-top" />
                                    {selectedPose === p.id && <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">✓</span></div>}
                                </div>
                                <span className="text-[10px] text-gray-500 text-center leading-tight">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </FloatingPanel>
            )}

            {openDropdown === 'quality' && (
                <FloatingPanel anchorRef={qualityRef} width={380}>
                    <div className="p-2 space-y-2">
                        {QUALITY_TIERS.map(t => {
                            const active = quality === t.id;
                            return (
                                <button key={t.id} onClick={() => { setQuality(t.id); setOpenDropdown(null); }}
                                    className={`w-full flex items-stretch gap-3 p-2.5 rounded-2xl border-2 text-left transition-colors ${active ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 hover:border-gray-200 bg-surface'}`}>
                                    <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                        <img src={t.img} alt={t.name} className="w-full h-full object-cover object-top" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-gray-900">{t.name}</span>
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${t.tagColor}`}>{t.tag}</span>
                                            </div>
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-blue-600' : 'border-2 border-gray-200'}`}>
                                                {active && <span className="text-white text-[10px]">✓</span>}
                                            </span>
                                        </div>
                                        <ul className="mt-1.5 space-y-0.5">
                                            {t.features.map(f => (
                                                <li key={f} className="text-[11px] text-gray-500 leading-snug">{f}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </FloatingPanel>
            )}

            {openDropdown === 'background' && (
                <FloatingPanel anchorRef={backgroundRef} width={470}>
                    <div className="grid grid-cols-4 gap-2.5 p-3">
                        {BACKGROUNDS.map(b => {
                            const active = background === b.id;
                            return (
                                <button key={b.id} onClick={() => { setBackground(b.id); setOpenDropdown(null); }}
                                    className="flex flex-col items-center gap-1.5">
                                    <div className={`w-full h-20 rounded-xl overflow-hidden relative border-2 transition-colors ${active ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
                                        {b.img
                                            ? <img src={b.img} alt={b.name} className="w-full h-full object-cover" />
                                            : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Plus className="w-6 h-6 text-gray-500" /></div>}
                                        {active && <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">✓</span></div>}
                                    </div>
                                    <span className="text-[10px] text-gray-500 text-center leading-tight">{b.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </FloatingPanel>
            )}

            {/* Image context menu */}
            {imageMenu && (
                <div
                    className="fixed z-200 bg-surface rounded-xl shadow-2xl border border-gray-200 w-48 py-1"
                    style={{ top: imageMenu.y, left: imageMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    {[
                        { label: 'Change something', icon: RefreshCw, action: () => { handleGenerate(); setImageMenu(null); } },
                        { label: 'Other angles', icon: RefreshCw, action: () => { handleGenerate(); setImageMenu(null); } },
                        { label: 'Generate video', icon: Video },
                        { label: 'Delete', icon: Trash2, red: true, action: () => { setGeneratedImages(p => p.filter((_, i) => i !== imageMenu.idx)); setImageMenu(null); } },
                        { label: 'Download', icon: Download, action: () => { handleDownload(generatedImages[imageMenu.idx]); setImageMenu(null); } },
                        { label: 'Copy link', icon: Copy, action: () => { navigator.clipboard.writeText(generatedImages[imageMenu.idx]); toast.success('Link copied!'); setImageMenu(null); } },
                        { label: 'Good result', icon: ThumbsUp, action: () => setImageMenu(null) },
                        { label: 'Bad result', icon: ThumbsDown, action: () => setImageMenu(null) },
                    ].map(item => (
                        <button key={item.label}
                            onClick={() => { if (item.action) item.action(); else setImageMenu(null); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${item.red ? 'text-red-500' : 'text-gray-900'}`}>
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.label}
                        </button>
                    ))}
                </div>
            )}

            {openDropdown === 'size' && (
                <FloatingPanel anchorRef={sizeRef} width={380}>
                    <div className="grid grid-cols-3 gap-2.5 p-3">
                        {SIZES.map(s => {
                            const active = size === s.id;
                            const maxDim = 64;
                            const bw = s.w >= s.h ? maxDim : Math.round(maxDim * s.w / s.h);
                            const bh = s.h >= s.w ? maxDim : Math.round(maxDim * s.h / s.w);
                            return (
                                <button key={s.id} onClick={() => { setSize(s.id); setOpenDropdown(null); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-colors ${active ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 hover:border-gray-200'}`}>
                                    <div className="flex items-center justify-center h-20 relative w-full">
                                        <div className={`rounded-md ${active ? 'bg-blue-300' : 'bg-gray-100'}`} style={{ width: bw, height: bh }} />
                                        {active && <div className="absolute top-0 right-0 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">✓</span></div>}
                                    </div>
                                    <span className="text-[10px] text-gray-500 text-center leading-tight">{s.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </FloatingPanel>
            )}

            {/* Gallery media picker — pick ONE image (My Library / Search / Upload) */}
            <MediaPickerModal
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onCancel={() => setPickerOpen(false)}
                onApply={handleApplyFromPicker}
                activeBrand={activeBrand}
            />
        </div>
    );
}