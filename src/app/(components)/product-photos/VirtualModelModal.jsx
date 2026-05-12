import { useState, useRef, useEffect } from 'react';
import { generateImage, uploadFile } from '@/(lib)/ai-helpers';
import { X, Plus, Upload, Download, Copy, Loader2, MoreHorizontal, ThumbsUp, ThumbsDown, Trash2, Video, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const MODELS = [
    { id: 'avery', name: 'Avery', emoji: '👩', desc: 'Woman, straight hair, jeans' },
    { id: 'sam', name: 'Sam', emoji: '👨', desc: 'Man, black tee, grey pants' },
    { id: 'taylor', name: 'Taylor', emoji: '👨', desc: 'Man, white tee, khaki' },
    { id: 'kendall', name: 'Kendall', emoji: '👩', desc: 'Woman, white tee, jeans' },
    { id: 'jordan', name: 'Jordan', emoji: '👨', desc: 'Man, beige outfit' },
    { id: 'casey', name: 'Casey', emoji: '👩', desc: 'Woman, all white' },
    { id: 'alex', name: 'Alex', emoji: '👩', desc: 'Woman, beige set' },
    { id: 'maya', name: 'Maya', emoji: '👩', desc: 'Woman, black outfit' },
    { id: 'reece', name: 'Reece', emoji: '👨', desc: 'Man, casual jeans' },
    { id: 'lara', name: 'Lara', emoji: '👩', desc: 'Woman, blue jeans' },
    { id: 'julia', name: 'Julia', emoji: '👩', desc: 'Woman, light jeans' },
];

const POSES = [
    { id: 'random', name: 'Random' },
    { id: 'standing', name: 'Standing' },
    { id: '3_4_turn', name: '3/4 Turn' },
    { id: 'power_stance', name: 'Power Stance' },
    { id: 'walking', name: 'Walking Forward' },
    { id: 'hand_pocket', name: 'Hand in Pocket' },
    { id: 'crossed_arms', name: 'Crossed Arms' },
    { id: 'back', name: 'Back' },
    { id: 'over_shoulder', name: 'Over-the-Shoulder' },
    { id: 'seated', name: 'Seated Casual' },
    { id: 'adjusting', name: 'Adjusting Clothing' },
    { id: 'playful', name: 'Playful Spin' },
];

const BACKGROUNDS = [
    { id: 'custom', name: 'Custom', color: '#e0e0e0' },
    { id: 'random', name: 'Random', color: '#c8d8c8' },
    { id: 'street', name: 'Street', color: '#d0c8b8' },
    { id: 'bedroom', name: 'Bedroom', color: '#e8d8c8' },
    { id: 'sunset', name: 'Sunset', color: '#f0c060' },
    { id: 'factory', name: 'Factory', color: '#888' },
    { id: 'studio', name: 'Studio', color: '#f0f0f0' },
    { id: 'colored_studio', name: 'Colored Studio', color: '#a0c0e0' },
    { id: 'concrete_studio', name: 'Concrete Studio', color: '#b0b0b0' },
    { id: 'beach', name: 'Beach', color: '#70b8e0' },
    { id: 'tropical', name: 'Tropical', color: '#40a860' },
    { id: 'library', name: 'Library', color: '#c8a870' },
    { id: 'forest', name: 'Forest', color: '#508040' },
    { id: 'business', name: 'Business District', color: '#708090' },
    { id: 'countryside', name: 'Countryside', color: '#90b860' },
    { id: 'flowers', name: 'Flowers', color: '#e080a0' },
    { id: 'golden_light', name: 'Golden Light', color: '#e0a840' },
    { id: 'mountain', name: 'Mountain', color: '#8090a8' },
    { id: 'pool', name: 'Pool', color: '#40a8d0' },
    { id: 'latin_city', name: 'Latin City', color: '#c09060' },
    { id: 'cafe', name: 'Cafe', color: '#a07850' },
    { id: 'asian_city', name: 'Asian City', color: '#f060a0' },
    { id: 'night_lights', name: 'Night Lights', color: '#2030a0' },
    { id: 'desert', name: 'Desert', color: '#d0a860' },
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

// Floating panel rendered at fixed position to escape sidebar overflow clipping
function FloatingPanel({ anchorRef, children, width = 320 }) {
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (anchorRef?.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPos({ top: rect.top, left: rect.right + 4 });
        }
    }, [anchorRef]);

    return (
        <div
            className="fixed z-[200] bg-white rounded-xl shadow-2xl border border-gray-100 max-h-[480px] overflow-y-auto"
            style={{ top: pos.top, left: pos.left, width }}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    );
}

export default function VirtualModelModal({ onClose }) {
    const fileInputRef = useRef(null);
    const qualityRef = useRef(null);
    const backgroundRef = useRef(null);
    const sizeRef = useRef(null);
    const modelRef = useRef(null);
    const poseRef = useRef(null);

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
    const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // cached cloud URL

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadedFile(file);
        setUploadedImage(URL.createObjectURL(file));
        setUploadedFileUrl(null); // reset cached url when new file selected
    };

    const handleGenerate = async () => {
        if (!uploadedFile && !uploadedImage) { toast.error('Please upload a product image first'); return; }
        setGenerating(true);
        setOpenDropdown(null);
        try {
            const modelObj = MODELS.find(m => m.id === selectedModel);
            const poseObj = POSES.find(p => p.id === selectedPose);
            const bgObj = BACKGROUNDS.find(b => b.id === background);

            // Upload once and cache the cloud URL
            let fileUrl = uploadedFileUrl;
            if (!fileUrl && uploadedFile) {
                const { file_url } = await uploadFile({ file: uploadedFile });
                fileUrl = file_url;
                setUploadedFileUrl(fileUrl);
            }
            if (!fileUrl) { toast.error('Please upload a product image'); setGenerating(false); return; }

            const generationPrompt = `Virtual try-on fashion photography. The exact clothing item shown in the reference image must be worn by a ${modelObj?.desc || 'fashion model'}. Do NOT change the garment design, color, pattern or style — keep it identical to the reference. Pose: ${poseObj?.name || 'standing'}. Background: ${bgObj?.name || 'studio'}. ${prompt ? 'Note: ' + prompt + '.' : ''} Photorealistic, commercial fashion shoot, high resolution.`;

            const result = await generateImage({
                prompt: generationPrompt,
                existing_image_urls: [fileUrl],
            });

            setGeneratedImages(prev => [result.url, ...prev]);
            toast.success('Image generated!');
        } catch {
            // error already shown by generateImage helper
        } finally {
            setGenerating(false);
        }
    };

    const toggle = (key) => setOpenDropdown(p => p === key ? null : key);

    const modelObj = MODELS.find(m => m.id === selectedModel);
    const poseObj = POSES.find(p => p.id === selectedPose);
    const bgObj = BACKGROUNDS.find(b => b.id === background);
    const sizeObj = SIZES.find(s => s.id === size);

    const closeAll = () => { setOpenDropdown(null); setImageMenu(null); };

    const handleDownload = (url) => {
        const a = document.createElement('a');
        a.href = url; a.download = 'virtual-model.png'; a.target = '_blank'; a.click();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={closeAll}>
            <div
                className="bg-white rounded-2xl shadow-2xl flex overflow-hidden"
                style={{ width: '95vw', height: '92vh', maxWidth: '1400px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Left sidebar ── */}
                {/* overflow-visible so floating panels escape; use a relative wrapper for internal layout */}
                <div className="w-84 border-r border-gray-100 flex flex-col flex-shrink-0 overflow-y-auto overflow-x-visible" style={{ position: 'relative' }}>

                    {/* Header */}
                    <div className="flex items-center px-4 py-3 border-b border-gray-100">
                        <span className="flex items-center gap-1.5 font-semibold text-sm text-gray-800">
                            Virtual Model <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        </span>
                    </div>

                    {/* Upload */}
                    <div className="px-3 py-3 border-b border-gray-100">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border border-dashed border-gray-300 rounded-lg py-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Drop files or <span className="text-blue-600 font-medium">select images</span>
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>

                    {/* Uploaded thumb */}
                    {uploadedImage && (
                        <div className="px-3 py-2 border-b border-gray-100">
                            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500">
                                <img src={uploadedImage} alt="product" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}

                    {/* Model & Pose */}
                    <div className="px-3 py-3 border-b border-gray-100">
                        <div className="grid grid-cols-2 gap-2">
                            {/* Model button */}
                            <button
                                ref={modelRef}
                                onClick={() => toggle('model')}
                                className={`w-full flex flex-col items-center p-2 rounded-xl border-2 transition-colors ${openDropdown === 'model' ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
                            >
                                <div className="w-14 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl mb-1">
                                    {modelObj?.emoji}
                                </div>
                                <span className="text-[10px] text-gray-400">Model</span>
                                <span className="text-xs font-semibold text-gray-700">{modelObj?.name}</span>
                            </button>

                            {/* Pose button */}
                            <button
                                ref={poseRef}
                                onClick={() => toggle('pose')}
                                className={`w-full flex flex-col items-center p-2 rounded-xl border-2 transition-colors ${openDropdown === 'pose' ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
                            >
                                <div className="w-14 h-16 bg-amber-50 rounded-lg flex items-center justify-center text-3xl mb-1">🪆</div>
                                <span className="text-[10px] text-gray-400">Pose</span>
                                <span className="text-xs font-semibold text-gray-700">{poseObj?.name}</span>
                            </button>
                        </div>
                    </div>

                    {/* Option rows */}
                    <div className="flex-1">
                        {/* Quality */}
                        <button ref={qualityRef} onClick={() => toggle('quality')}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 text-sm transition-colors">
                            <span className="text-gray-600">Quality</span>
                            <span className="text-gray-400 flex items-center gap-1">{quality} <ChevronDown className="w-3 h-3" /></span>
                        </button>

                        {/* Background */}
                        <button ref={backgroundRef} onClick={() => toggle('background')}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 text-sm transition-colors">
                            <span className="text-gray-600">Background</span>
                            <span className="flex items-center gap-1.5 text-gray-400">
                                {bgObj?.name}
                                <div className="w-5 h-5 rounded-sm border border-gray-200" style={{ backgroundColor: bgObj?.color }} />
                            </span>
                        </button>

                        {/* Size */}
                        <button ref={sizeRef} onClick={() => toggle('size')}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 text-sm transition-colors">
                            <span className="text-gray-600">Size</span>
                            <span className="text-gray-400 flex items-center gap-1">{sizeObj?.name} <ChevronDown className="w-3 h-3" /></span>
                        </button>

                        {/* Brand style toggle */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 text-sm">
                            <span className="text-gray-600">Apply brand style</span>
                            <button onClick={() => setApplyBrandStyle(p => !p)}
                                className={`relative w-10 h-5 rounded-full transition-all ${applyBrandStyle ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${applyBrandStyle ? 'left-5' : 'left-0.5'}`} />
                            </button>
                        </div>

                        {/* Prompt */}
                        <div className="px-4 py-3">
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="Describe the image you want (optional)"
                                className="w-full text-xs text-gray-600 placeholder:text-gray-400 bg-transparent outline-none resize-none leading-relaxed"
                                rows={3}
                            />
                            <div className="h-px bg-gray-200 mt-2" />
                        </div>
                    </div>

                    {/* Generate */}
                    <div className="px-3 pb-4">
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className={`
    w-full py-2.5 rounded-xl text-sm cursor-pointer font-semibold text-white
    transition-all flex items-center justify-center gap-2
    disabled:opacity-60
    ${generating
                                    ? 'bg-gray-400'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
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
                <div className="flex-1 flex flex-col relative bg-[#f8f8f8]">
                    <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 shadow-sm">
                        <X className="w-4 h-4 text-gray-600" />
                    </button>

                    {generatedImages.length === 0 && !generating ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-32 h-40 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center shadow">
                                    {uploadedImage
                                        ? <img src={uploadedImage} alt="product" className="w-full h-full object-cover" />
                                        : <span className="text-5xl">👕</span>
                                    }
                                </div>
                                <div className="text-gray-300 text-3xl">→</div>
                                <div className="w-32 h-40 bg-white rounded-2xl shadow flex items-center justify-center text-5xl border border-gray-100">
                                    🧍‍♀️
                                </div>
                            </div>
                            <p className="text-gray-500 text-center text-sm leading-relaxed max-w-xs">
                                Visualize your product on a real-looking mannequin and<br />
                                see your product come to life
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
                                    <div key={idx} className="relative rounded-xl overflow-hidden group aspect-[2/3] bg-gray-100">
                                        <img src={url} alt={`result ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setImageMenu(p => p?.idx === idx ? null : { idx, x: e.clientX, y: e.clientY });
                                            }}
                                            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreHorizontal className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button className="absolute bottom-2 right-2 w-7 h-7 bg-white/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-gray-500">⊞</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {generatedImages.length > 0 && (
                        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white rounded-full shadow border border-gray-200 px-2 py-1">
                            <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500">−</button>
                            <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500">+</button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Floating dropdowns (fixed, above everything) ── */}
            {openDropdown === 'model' && (
                <FloatingPanel anchorRef={modelRef} width={310}>
                    <div className="grid grid-cols-4 gap-2 p-3">
                        <button className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg h-24 text-gray-400 hover:border-blue-400 transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                        {MODELS.map(m => (
                            <button key={m.id} onClick={() => { setSelectedModel(m.id); setOpenDropdown(null); }}
                                className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-colors ${selectedModel === m.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
                                <div className="w-14 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl relative mb-1">
                                    {m.emoji}
                                    {selectedModel === m.id && <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">✓</span></div>}
                                </div>
                                <span className="text-[10px] text-gray-600">{m.name}</span>
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
                                <div className="w-14 h-20 bg-amber-50 rounded-lg flex items-center justify-center text-3xl relative mb-1">
                                    🪆
                                    {selectedPose === p.id && <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">✓</span></div>}
                                </div>
                                <span className="text-[10px] text-gray-600 text-center leading-tight">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </FloatingPanel>
            )}

            {openDropdown === 'quality' && (
                <FloatingPanel anchorRef={qualityRef} width={180}>
                    {['Standard', 'High', 'Ultra'].map(q => (
                        <button key={q} onClick={() => { setQuality(q); setOpenDropdown(null); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${quality === q ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                            {q}
                        </button>
                    ))}
                </FloatingPanel>
            )}

            {openDropdown === 'background' && (
                <FloatingPanel anchorRef={backgroundRef} width={330}>
                    <div className="grid grid-cols-4 gap-2 p-3">
                        {BACKGROUNDS.map(b => (
                            <button key={b.id} onClick={() => { setBackground(b.id); setOpenDropdown(null); }}
                                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-colors ${background === b.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
                                <div className="w-14 h-12 rounded-lg relative" style={{ backgroundColor: b.color }}>
                                    {background === b.id && <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">✓</span></div>}
                                </div>
                                <span className="text-[9px] text-gray-600 text-center leading-tight">{b.name}</span>
                            </button>
                        ))}
                    </div>
                </FloatingPanel>
            )}

            {/* Image context menu */}
            {imageMenu && (
                <div
                    className="fixed z-[200] bg-white rounded-xl shadow-2xl border border-gray-100 w-48 py-1"
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
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${item.red ? 'text-red-500' : 'text-gray-700'}`}>
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            {item.label}
                        </button>
                    ))}
                </div>
            )}

            {openDropdown === 'size' && (
                <FloatingPanel anchorRef={sizeRef} width={300}>
                    <div className="grid grid-cols-3 gap-3 p-3">
                        {SIZES.map(s => {
                            const maxDim = 56;
                            const bw = s.w >= s.h ? maxDim : Math.round(maxDim * s.w / s.h);
                            const bh = s.h >= s.w ? maxDim : Math.round(maxDim * s.h / s.w);
                            return (
                                <button key={s.id} onClick={() => { setSize(s.id); setOpenDropdown(null); }}
                                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-colors ${size === s.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
                                    <div className="flex items-center justify-center h-16">
                                        <div className="border-2 border-gray-300 rounded relative" style={{ width: bw, height: bh }}>
                                            {size === s.id && <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[7px]">✓</span></div>}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-600 text-center">{s.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </FloatingPanel>
            )}
        </div>
    );
}