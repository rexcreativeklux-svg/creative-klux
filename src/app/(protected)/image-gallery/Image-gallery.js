"use client";

import { useState, useCallback } from "react";
import {
    Search,
    Image as ImageIcon,
    Upload,
    MoreVertical,
    FolderOpen,
    CloudUpload,
    Loader2,
    Download,
    Link2,
    ExternalLink,
    FolderPlus,
} from "lucide-react";

export default function ImageGallery() {
    const [activeTab, setActiveTab] = useState("search");
    const [searchQuery, setSearchQuery] = useState("");
    const [mediaType, setMediaType] = useState("Images");
    const [searchResults, setSearchResults] = useState([]);
    const [myImages, setMyImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);

    const getVideoUrl = (videoFiles) => {
        if (!videoFiles || videoFiles.length === 0) return null;
        const hd = videoFiles.find(f => f.quality === "hd");
        return (hd || videoFiles[0]).link;
    };

    const downloadMedia = (url, filename) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "download";
        a.click();
    };

    const copyLink = (url) => {
        navigator.clipboard.writeText(url);
        alert("Link copied!");
        setOpenMenu(null);
    };

    const searchPexels = async () => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        try {
            const type = mediaType === "Images" ? "photos" : "videos";
            const res = await fetch(`/api/pexels?query=${encodeURIComponent(searchQuery)}&type=${type}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSearchResults(mediaType === "Images" ? data.photos || [] : data.videos || []);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const saveToMyImages = (item) => {
        const isVid = "video_files" in item;
        const newImage = {
            id: `pexels-${item.id}`,
            src: isVid ? item.image : item.src.medium,
            videoUrl: isVid ? getVideoUrl(item.video_files) : null,
            alt: isVid ? item.user.name : item.alt || "Pexels media",
            isVideo: isVid,
        };
        if (!myImages.some(img => img.id === newImage.id)) {
            setMyImages(prev => [newImage, ...prev]);
        }
        setOpenMenu(null);
    };

    const handleFileUpload = (files) => {
        if (!files) return;
        Array.from(files).forEach((file) => {
            if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const newImg = {
                    id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    src: e.target.result,
                    alt: file.name,
                    isVideo: false,
                };
                setMyImages(prev => {
                    if (prev.some(img => img.src === newImg.src)) return prev;
                    return [newImg, ...prev];
                });
            };
            reader.readAsDataURL(file);
        });
        setActiveTab("myImages");
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    }, []);

    const removeFromMyImages = (id) => {
        setMyImages(prev => prev.filter(img => img.id !== id));
        setOpenMenu(null);
    };

    const tabs = [
        { id: "search", label: "Search Results", icon: Search },
        { id: "myImages", label: "My Images", icon: FolderOpen },
        { id: "upload", label: "Upload", icon: Upload },
    ];

    const isSearchTab = activeTab === "search";
    const currentItems = isSearchTab ? searchResults : myImages;

    return (
        <div className="min-h-screen px-12 py-6">
            <header className="bg-[#155dfc] text-white px-8 py-6 rounded-md shadow-lg mb-8">
                <div className="flex items-center gap-3">
                    <ImageIcon size={32} />
                    <h1 className="text-2xl font-bold">Image Library</h1>
                </div>
            </header>

            <div className=" mx-auto">
                <div className="bg-white rounded-md p-6 shadow mb-8">
                    <div className="flex flex-wrap gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Search millions of free images & videos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && searchPexels()}
                            className="flex-1 min-w-[300px] px-5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155dfc]/30"
                        />
                        <select
                            value={mediaType}
                            onChange={(e) => setMediaType(e.target.value)}
                            className="px-3 py-2 border cursor-pointer border-gray-200 rounded-lg"
                        >
                            <option value="Images">Images</option>
                            <option value="Videos">Videos</option>
                        </select>
                        <button
                            onClick={searchPexels}
                            disabled={isLoading}
                            className="px-8 py-2 bg-[#155dfc] cursor-pointer hover:bg-[#155dfc]/90 text-white rounded-lg flex items-center gap-2 transition-all shadow-md"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={22} /> : <Search size={22} />}
                            Search
                        </button>
                    </div>
                </div>

                <div className="flex gap-10 mb-8 border-b-2 border-gray-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 px-2 cursor-pointer flex items-center gap-3 font-medium transition-all duration-200 border-b-2 -mb-[2px] ${
                                activeTab === tab.id
                                    ? "border-[#155dfc] text-[#155dfc]"
                                    : "border-transparent text-gray-600 hover:text-[#155dfc]"
                            }`}
                        >
                            <tab.icon size={22} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {(activeTab === "search" || activeTab === "myImages") && (
                    <>
                        {currentItems.length === 0 ? (
                            <div className="text-center py-32 text-gray-500 text-xl">
                                {isSearchTab
                                    ? "Search for images or videos to see results"
                                    : "No images yet. Upload or save from search!"}
                            </div>
                        ) : (
                            <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                                {currentItems.map((item) => {
                                    const isVid = isSearchTab ? "video_files" in item : !!item.isVideo;
                                    const id = isSearchTab ? `s-${item.id}` : item.id;
                                    const src = isSearchTab
                                        ? (isVid ? item.image : item.src.medium)
                                        : (isVid ? item.src : item.src);
                                    const videoUrl = isVid
                                        ? (isSearchTab ? getVideoUrl(item.video_files) : item.videoUrl)
                                        : null;

                                    return (
                                        <div
                                            key={id}
                                            className="relative group break-inside-avoid mb-6 rounded-xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all"
                                        >
                                            {isVid ? (
                                                <div className="aspect-[4/3] bg-black">
                                                    <video
                                                        src={videoUrl}
                                                        poster={src}
                                                        className="w-full h-full object-cover"
                                                        controls
                                                        controlsList="nodownload"
                                                        preload="metadata"
                                                        playsInline
                                                    />
                                                </div>
                                            ) : (
                                                <img
                                                    src={src}
                                                    alt={item.alt || "Image"}
                                                    className="w-full h-auto rounded-xl"
                                                    loading="lazy"
                                                />
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenu(openMenu === id ? null : id);
                                                }}
                                                className="absolute cursor-pointer top-4 right-4 p-2.5 hover:bg-gray-200 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg z-10"
                                            >
                                                <MoreVertical size={22} />
                                            </button>

                                            {openMenu === id && (
                                                <div className="absolute top-14 right-4 bg-white rounded-xl shadow-2xl py-3 z-30 min-w-[210px] border border-gray-200">
                                                    {isSearchTab ? (
                                                        <>
                                                            {!isVid && (
                                                                <button
                                                                    onClick={() => { saveToMyImages(item); setOpenMenu(null); }}
                                                                    className="w-full cursor-pointer flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium"
                                                                >
                                                                    <FolderPlus size={18} /> Save to My Images
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => { downloadMedia(isVid ? videoUrl : item.src.original, `pexels-${item.id}`); setOpenMenu(null); }}
                                                                className="w-full cursor-pointer flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium"
                                                            >
                                                                <Download size={18} /> Download
                                                            </button>
                                                            <button
                                                                onClick={() => { copyLink(isVid ? videoUrl : item.src.original); }}
                                                                className="w-full cursor-pointer flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium"
                                                            >
                                                                <Link2 size={18} /> Copy Link
                                                            </button>
                                                            <a
                                                                href={item.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-full flex cursor-pointer items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium"
                                                            >
                                                                <ExternalLink size={18} /> View on Pexels
                                                            </a>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => { downloadMedia(isVid ? item.videoUrl : item.src, item.alt || "my-image"); setOpenMenu(null); }}
                                                                className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium"
                                                            >
                                                                <Download size={18} /> Download
                                                            </button>
                                                            <button
                                                                onClick={() => { removeFromMyImages(item.id); setOpenMenu(null); }}
                                                                className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium text-red-600"
                                                            >
                                                                Remove
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {!isSearchTab && (
                                                <div className="absolute bottom-4 left-4">
                                                    <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur">
                                                        {isVid ? "My Video" : "My Image"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {activeTab === "upload" && (
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onClick={() => document.getElementById("file-input")?.click()}
                        className={`border-4 border-dashed rounded-3xl p-32 text-center cursor-pointer transition-all ${
                            isDragging ? "border-[#155dfc] bg-blue-50" : "border-gray-300 hover:border-gray-400"
                        }`}
                    >
                        <input
                            id="file-input"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e.target.files)}
                            className="hidden"
                        />
                        <CloudUpload size={80} className="mx-auto mb-6 text-gray-400" />
                        <p className="text-2xl font-bold text-gray-700 mb-3">Drop images here or click to upload</p>
                        <p className="text-gray-500">JPG, PNG, GIF • Max 5MB each</p>
                    </div>
                )}
            </div>

            {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}
        </div>
    );
}