"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Calendar, Download, MoreVertical, Play, Pause } from 'lucide-react';

const ResultsGrid = ({
    title = "Generated Results",
    assets = [],
    selectedAssets = [],
    onToggleSelection,
    onBulkPost,
    onBulkSchedule,
    onBulkDownload,
    onBack,
    caption = "",
    hashtags = [],
    size = "1/1", // e.g., "1/1", "9/16", "1200x627"
    processedAssets = {},
    onPostNow,
    onSchedule,
    onDownload,
}) => {
    const [menuOpen, setMenuOpen] = useState(null);
    
    const aspectRatio = size.includes('x')
        ? `${parseInt(size.split('x')[0]) / parseInt(size.split('x')[1])}`
        : size.replace(':', '/');

    // Check if we're in single or multi-select mode
    const isSingleSelect = selectedAssets.length <= 1;
    const selectedAsset = isSingleSelect && selectedAssets.length === 1 ? selectedAssets[0] : null;

    const handleDownload = (asset) => {
        if (onDownload) {
            onDownload(asset);
        }
        setMenuOpen(null);
    };

    const handlePostNow = (asset) => {
        if (onPostNow) {
            onPostNow(asset);
        }
        setMenuOpen(null);
    };

    const handleSchedule = (asset) => {
        if (onSchedule) {
            onSchedule(asset);
        }
        setMenuOpen(null);
    };

    return (
        <div className="flex flex-col overflow-hidden w-full mt-3 justify-between gap-6 bg-surface rounded-lg py-4">
            <div className='flex flex-row justify-between'>
                <div className="font-medium text-lg text-blue-700 flex justify-center items-center">{title}</div>

                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
                >
                    Back
                </button>
            </div>

            {/* Bulk Actions - Show when items are selected */}
            {selectedAsset !== null && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-2 mb-4"
                >
                    <button
                        onClick={() => onBulkPost && onBulkPost()}
                        className="px-5 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition duration-300 flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" /> Create Ad
                    </button>
                    <button
                        onClick={() => onBulkSchedule && onBulkSchedule()}
                        className="px-4 py-2 bg-surface text-gray-900 hover:text-blue-700 rounded-md cursor-pointer border hover:bg-gray-50 hover:border-blue-700 transition duration-300 flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4" /> Schedule Ad
                    </button>
                    <button
                        onClick={() => {
                            const asset = assets.find(a => a.id === selectedAsset);
                            if (asset) handleDownload(asset);
                        }}
                        className="px-4 py-2 bg-black text-white rounded-md cursor-pointer hover:bg-surface hover:border hover:border-blue-700 hover:text-blue-700 transition duration-300 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Download Ad
                    </button>
                </motion.div>
            )}

            {/* Masonry Grid */}
            <div className="border border-gray-200 p-4 rounded-lg">
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
                    {assets.map((asset) => {
                        // Check if it's a video using multiple indicators
                        const isVideo = asset.isVideo || 
                                       asset.type === 'video' || 
                                       asset.videoSrc || 
                                       asset.src?.includes('.mp4');
                        
                        const previewSrc = isVideo 
                            ? (asset.preview || asset.thumbnail || asset.src) 
                            : (asset.preview || asset.src);
                        
                        const videoSrc = isVideo 
                            ? (asset.videoSrc || asset.preview || asset.src)
                            : null;
                        
                        const isSelected = selectedAssets.includes(asset.id);

                        return (
                            <div
                                key={asset.id}
                                onClick={() => onToggleSelection(asset.id)}
                                className={`relative border rounded-lg overflow-hidden cursor-pointer transition duration-300 mb-6 break-inside-avoid ${
                                    isSelected 
                                        ? 'border-blue-700 ring-2 ring-blue-700' 
                                        : 'border-gray-200 hover:border-blue-500'
                                }`}
                            >
                                {/* Rating */}
                                {asset.rating !== undefined && (
                                    <div className="py-3 px-2 bg-surface">
                                        <p className="text-sm text-gray-800 font-medium">Rating: {asset.rating}/100</p>
                                    </div>
                                )}

                                {/* Radio Button for Single Selection */}
                                <div className="absolute top-16 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="radio"
                                        name="assetSelection"
                                        checked={isSelected}
                                        onChange={() => onToggleSelection(asset.id)}
                                        className="w-5 h-5 rounded-full border-gray-200 text-blue-600 focus:ring-blue-500 cursor-pointer transition duration-300"
                                    />
                                </div>

                                {/* Media (Image or Video) */}
                                <div className="relative bg-black group" style={{ aspectRatio: aspectRatio || '1/1' }}>
                                    {isVideo ? (
                                        videoSrc ? (
                                            <>
                                                <video
                                                    src={videoSrc}
                                                    poster={asset.thumbnail || previewSrc}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                    loop
                                                    playsInline
                                                    preload="metadata"
                                                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.pause();
                                                        e.currentTarget.currentTime = 0;
                                                    }}
                                                />
                                                {/* Play/Pause icon overlay for videos */}
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="bg-black/50 rounded-full p-3 transition-opacity group-hover:opacity-100 opacity-100">
                                                        <Play className="w-8 h-8 text-white block group-hover:hidden" />
                                                        <Pause className="w-8 h-8 text-white hidden group-hover:block" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            // Fallback: Show image with play icon overlay if no video URL
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={previewSrc}
                                                    alt={asset.alt || 'Video placeholder'}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                    <div className="bg-surface/90 rounded-full p-4">
                                                        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <img
                                            src={previewSrc}
                                            alt={asset.alt || 'Generated'}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>

                                {/* Caption & Brand Name */}
                                <div className="py-4 px-2 bg-surface">
                                    {caption && (
                                        <p className="text-sm text-gray-800 truncate">Caption: {caption}</p>
                                    )}
                                    {asset.projectName && (
                                        <p className="text-sm text-gray-800 truncate">Brand Name: {asset.projectName}</p>
                                    )}
                                    {hashtags && hashtags.length > 0 && (
                                        <p className="text-sm text-gray-500 mt-1 truncate">Hashtags: {hashtags.join(' ')}</p>
                                    )}
                                </div>

                                {/* Three Dots Menu */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(menuOpen === asset.id ? null : asset.id);
                                    }}
                                    className="absolute top-16 right-2 p-1 bg-surface rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer transition duration-300 shadow-md z-10"
                                >
                                    <MoreVertical className="w-4 h-4 text-gray-600" />
                                </button>

                                {/* Dropdown Menu */}
                                {menuOpen === asset.id && (
                                    <div 
                                        onClick={(e) => e.stopPropagation()} 
                                        className="absolute top-24 right-2 bg-surface border border-gray-200 rounded-md shadow-lg z-20 min-w-[140px]"
                                    >
                                        <button 
                                            onClick={() => handlePostNow(asset)} 
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300"
                                        >
                                            Post Now
                                        </button>
                                        <button 
                                            onClick={() => handleSchedule(asset)} 
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300"
                                        >
                                            Schedule
                                        </button>
                                        <button 
                                            onClick={() => handleDownload(asset)} 
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition duration-300"
                                        >
                                            Download
                                        </button>
                                    </div>
                                )}

                                {/* Processed Assets Status */}
                                {processedAssets && processedAssets[asset.id] && (
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        {processedAssets[asset.id].type === 'download' && (
                                            <p className="text-green-600 text-sm">
                                                {isVideo ? 'Video' : 'Image'} Exported! <a 
                                                    href={processedAssets[asset.id].data} 
                                                    download={`creative_${asset.id}.${isVideo ? 'mp4' : 'png'}`} 
                                                    className="text-blue-700 underline cursor-pointer"
                                                >
                                                    Download
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ResultsGrid;