"use client";

import { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import PhotoEditor from '@/app/(components)/product-photos/PhotoEditor';
import VirtualModelModal from '@/app/(components)/product-photos/VirtualModelModal';
import BgRemoverModal from '@/app/(components)/product-photos/BgRemoverModal';
import ProductStagingModal from '@/app/(components)/product-photos/ProductStagingModal';

const tools = [
    { id: 'start', label: 'Start from a photo', icon: '🖼️', primary: true },
    { id: 'bgremove', label: 'Background Remover', icon: '✂️' },
    { id: 'virtual', label: 'Virtual Model', icon: '🧍' },
    { id: 'staging', label: 'Product Staging', icon: '📦' },
    { id: 'mannequin', label: 'Ghost Mannequin', icon: '👕' },
    { id: 'beautifier', label: 'Product Beautifier', icon: '✨' },
    { id: 'flatlay', label: 'Flat lay', icon: '📐' },
    { id: 'video', label: 'Video Generator', icon: '🎬', badge: 'Max' },
    { id: 'batch', label: 'Batch', icon: '⚡' },
    { id: 'all', label: 'See all tools...', icon: '⊞' },
];

const getStarted = [
    { label: 'Remove a background', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
    { label: 'Generate AI backgrounds', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80' },
    { label: 'Edit hundreds of images at once', img: 'https://images.unsplash.com/photo-1588453383063-02b7a759e7ff?w=400&q=80' },
    { label: 'Retouch an image', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80' },
];

const classics = [
    { label: 'White', bg: 'bg-white border border-gray-200' },
    { label: 'Black', bg: 'bg-black', active: true },
    { label: 'Transparent', bg: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%2210%22%3E%3Crect%20width%3D%225%22%20height%3D%225%22%20fill%3D%22%23ccc%22/%3E%3Crect%20x%3D%225%22%20y%3D%225%22%20width%3D%225%22%20height%3D%225%22%20fill%3D%22%23ccc%22/%3E%3C/svg%3E")]' },
    { label: 'Original Image', bg: 'bg-[#f5f0e8]' },
];

const studioColors = ['#f5f0e0', '#ede8d8', '#e0dbd0', '#f0ede0', '#f5e8e0', '#e8f0e0', '#e0eef5', '#f5e0ed'];

export default function ProductPhotos() {
    const [search, setSearch] = useState('');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorMode, setEditorMode] = useState('start');
    const [virtualModelOpen, setVirtualModelOpen] = useState(false);
    const [bgRemoverOpen, setBgRemoverOpen] = useState(false);
    const [bgRemoverFile, setBgRemoverFile] = useState(null);
    const [stagingOpen, setStagingOpen] = useState(false);
    const bgFileInputRef = useRef(null);

    const openEditor = (mode = 'start') => {
        setEditorMode(mode);
        setEditorOpen(true);
    };

    const openBgRemover = () => {
        // trigger file picker first, then open modal with file
        setBgRemoverFile(null);
        bgFileInputRef.current?.click();
    };

    const handleBgFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setBgRemoverFile(file);
        setBgRemoverOpen(true);
        e.target.value = '';
    };

    if (editorOpen) {
        return <PhotoEditor mode={editorMode} onClose={() => setEditorOpen(false)} />;
    }

    return (
        <div className="">
            {/* Hidden file input for bg remover */}
            <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgFileSelect} />

            {virtualModelOpen && <VirtualModelModal onClose={() => setVirtualModelOpen(false)} />}
            {bgRemoverOpen && <BgRemoverModal onClose={() => setBgRemoverOpen(false)} initialFile={bgRemoverFile} />}
            {stagingOpen && <ProductStagingModal onClose={() => setStagingOpen(false)} />}
            {/* Header */}
            <div className="flex items-center justify-between ">
                <h1 className="text-2xl font-bold text-gray-900">Home</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search a template"
                        className="pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 outline-none focus:border-blue-400 w-64 bg-gray-50"
                    />
                </div>
            </div>

            <div className=" py-6">
                {/* Tool Grid */}
                <div className="grid grid-cols-5 gap-2 mb-8">
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => {
                                if (tool.id === 'virtual') { setVirtualModelOpen(true); return; }
                                if (tool.id === 'bgremove') { openBgRemover(); return; }
                                if (tool.id === 'staging') { setStagingOpen(true); return; }
                                if (tool.id === 'start') { openEditor('start'); return; }
                                openEditor('start');
                            }}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium border transition-all hover:border-blue-400 hover:bg-blue-50 ${tool.primary
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 bg-white text-gray-700'
                                }`}
                        >
                            <span className="text-base">{tool.icon}</span>
                            <span className="text-left leading-tight flex-1">{tool.label}</span>
                            {tool.badge && (
                                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">{tool.badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Get Started */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">Get started</h2>
                    <button className="text-sm text-gray-400 hover:text-gray-600">Dismiss</button>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-10">
                    {getStarted.map((item, i) => (
                        <motion.button
                            key={i}
                            onClick={() => openEditor('start')}
                            whileHover={{ scale: 1.02 }}
                            className="relative rounded-2xl overflow-hidden aspect-[4/3] group"
                        >
                            <img src={item.img} alt={item.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-4 flex items-end justify-between w-full">
                                <p className="text-white text-sm font-semibold leading-tight text-left">{item.label}</p>
                              
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Classics */}
                <h2 className="text-base font-semibold text-gray-900 mb-4">Classics</h2>
                <div className="flex gap-3 mb-8">
                    {classics.map((c, i) => (
                        <button
                            key={i}
                            onClick={() => openEditor('start')}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className={`w-20 h-20 rounded-xl border-2 ${c.active ? 'border-blue-500' : 'border-gray-200'} flex items-center justify-center overflow-hidden ${c.bg}`}>
                                <span className="text-3xl">🧸</span>
                            </div>
                            <span className="text-xs text-gray-600">{c.label}</span>
                        </button>
                    ))}
                </div>

                {/* Studio */}
                <h2 className="text-base font-semibold text-gray-900 mb-4">Studio</h2>
                <div className="flex gap-2">
                    {studioColors.map((color, i) => (
                        <button
                            key={i}
                            onClick={() => openEditor('start')}
                            className="w-20 h-20 rounded-xl border border-gray-200 flex items-center justify-center text-2xl hover:border-blue-400 transition-all"
                            style={{ backgroundColor: color }}
                        >
                            👟
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}