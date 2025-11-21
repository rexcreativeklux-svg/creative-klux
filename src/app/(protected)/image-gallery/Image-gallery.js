"use client";

import { useState, useCallback, useRef } from "react";
import {
    Search,
    Image as ImageIcon,
    Upload,
    MoreVertical,
    FolderOpen,
    CloudUpload,
    Loader2,
    Play,
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
    const [playingVideoId, setPlayingVideoId] = useState(null);
    const videoRefs = useRef({});

    const getVideoUrl = (videoFiles) => {
        if (!videoFiles || videoFiles.length === 0) return null;
        const hd = videoFiles.find(f => f.quality === "hd");
        return (hd || videoFiles[0]).link;
    };

    const downloadMedia = async (url, filename) => {
        try {
            const a = document.createElement("a");
            a.href = url;
            a.download = filename || "download";
            a.click();
        } catch (err) {
            alert("Download failed. Try right-click → Save as.");
        }
    };

    const copyLink = (url) => {
        navigator.clipboard.writeText(url);
        alert("Link copied!");
        setOpenMenu(null);
    };

    const toggleVideo = (id) => {
        const video = videoRefs.current[id];
        if (!video) return;

        if (playingVideoId === id) {
            video.pause();
            setPlayingVideoId(null);
        } else {
            if (playingVideoId && videoRefs.current[playingVideoId]) {
                videoRefs.current[playingVideoId].pause();
            }
            video.play();
            setPlayingVideoId(id);
        }
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

    const handleKeyDown = (e) => {
        if (e.key === "Enter") searchPexels();
    };

    const saveToMyImages = (item) => {
        const isVid = "video_files" in item;
        const newImage = {
            id: `pexels-${item.id}`,
            src: isVid ? item.image : item.src.medium,
            videoUrl: isVid ? getVideoUrl(item.video_files) : null,
            alt: isVid ? item.user.name : item.alt || "Pexels media",
            type: "saved",
            isVideo: isVid,
        };
        if (!myImages.find((img) => img.id === newImage.id)) {
            setMyImages((prev) => [newImage, ...prev]);
        }
        setOpenMenu(null);
    };

    const handleFileUpload = (files) => {
        if (!files) return;
        Array.from(files).forEach((file) => {
            if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                setMyImages((prev) => [{
                    id: `upload-${Date.now()}-${Math.random()}`,
                    src: e.target?.result,
                    alt: file.name,
                    type: "uploaded",
                }, ...prev]);
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
        setMyImages((prev) => prev.filter((img) => img.id !== id));
        setOpenMenu(null);
    };

    const isVideo = (item) => "video_files" in item;

    const tabs = [
        { id: "search", label: "Search Results", icon: Search },
        { id: "myImages", label: "My Images", icon: FolderOpen },
        { id: "upload", label: "Upload", icon: Upload },
    ];

    return (
        <div className="min-h-screen px-12">
            <header className="bg-[#155dfc] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ImageIcon size={24} />
                    <span className="font-semibold text-lg">Image Library</span>
                </div>
            </header>

            <div className="py-6">
                <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                    <h2 className="text-xl font-semibold mb-4">Search Images & Videos</h2>
                    <div className="flex gap-4 flex-wrap">
                        <input
                            type="text"
                            placeholder="Search Pexels for images or videos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 min-w-[300px] px-4 py-2 border border-gray-200 placeholder:text-sm rounded-lg focus:outline-none focus:ring focus:ring-[#155dfc]/30 focus:border-[#155dfc]"
                        />
                        <select
                            value={mediaType}
                            onChange={(e) => setMediaType(e.target.value)}
                            className="px-4 py-2 border text-md cursor-pointer border-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-[#155dfc]/30"
                        >
                            <option value="Images">Images</option>
                            <option value="Videos">Videos</option>
                        </select>
                        <button
                            onClick={searchPexels}
                            disabled={isLoading}
                            className="px-6 py-2 bg-[#155dfc] cursor-pointer hover:bg-[#155dfc]/70 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                            Search
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 mb-6 border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-2 py-3 cursor-pointer flex items-center gap-2 transition-all duration-300 border-b-2 -mb-[2px] ${activeTab === tab.id
                                ? "border-[#155dfc] text-[#155dfc]"
                                : "border-transparent hover:text-[#155dfc]/80"
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "search" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {searchResults.map((item) => {
                            const isVid = isVideo(item);
                            const videoUrl = isVid ? getVideoUrl(item.video_files) : null;

                            return (
                                <div key={item.id} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-[4/3]">
                                    {isVid ? (
                                        <div className="relative w-full h-full bg-black">
                                            <video
                                                ref={(el) => (videoRefs.current[item.id] = el)}
                                                src={videoUrl}
                                                poster={item.image}
                                                className="w-full h-full object-cover"
                                                preload="metadata"
                                                playsInline
                                                controls
                                                controlsList="nodownload nofullscreen" // Optional: cleaner look
                                                onPlay={() => setPlayingVideoId(item.id)}
                                                onPause={() => {
                                                    // Only clear if this was the playing one
                                                    if (playingVideoId === item.id) {
                                                        setPlayingVideoId(null);
                                                    }
                                                }}
                                                // Optional: allow sound
                                                muted={false}
                                            />
                                        </div>
                                    ) : (
                                        <img
                                            src={item.src.medium}
                                            alt={item.alt || "Pexels image"}
                                            className="w-full h-full object-cover"
                                        />
                                    )}

                                    {/* Menu Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenu(openMenu === `s-${item.id}` ? null : `s-${item.id}`);
                                        }}
                                        className="absolute top-2 cursor-pointer right-2 p-1.5 bg-white hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md z-20"
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openMenu === `s-${item.id}` && (
                                        <div className="absolute top-10 right-2 bg-white rounded-lg shadow-lg py-2 z-30 min-w-[180px] border border-gray-200">
                                            <button
                                                onClick={() => saveToMyImages(item)}
                                                className="w-full cursor-pointer flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 text-sm"
                                            >
                                                <FolderPlus size={16} />
                                                Save to My Images
                                            </button>
                                            <button
                                                onClick={() => downloadMedia(isVid ? videoUrl : item.src.original, `pexels-${item.id}`)}
                                                className="w-full cursor-pointer flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 text-sm"
                                            >
                                                <Download size={16} />
                                                Download
                                            </button>
                                            <button
                                                onClick={() => copyLink(isVid ? videoUrl : item.src.original)}
                                                className="w-full cursor-pointer flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 text-sm"
                                            >
                                                <Link2 size={16} />
                                                Copy Link
                                            </button>
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100 text-sm"
                                            >
                                                <ExternalLink size={16} />
                                                View on Pexels
                                            </a>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {searchResults.length === 0 && !isLoading && (
                            <div className="col-span-full text-center py-20 text-gray-500">Search for images or videos to see results</div>
                        )}
                    </div>
                )}

                {/* My Images & Upload tabs unchanged */}
                {activeTab === "myImages" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {myImages.map((img) => (
                            <div key={img.id} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-[4/3]">
                                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setOpenMenu(openMenu === img.id ? null : img.id)}
                                    className="absolute cursor-pointer top-2 right-2 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                >
                                    <MoreVertical size={18} />
                                </button>
                                {openMenu === img.id && (
                                    <div className="absolute top-10 right-2 bg-white rounded-lg shadow-lg py-2 z-10">
                                        <button onClick={() => removeFromMyImages(img.id)} className="px-4 cursor-pointer py-2 hover:bg-gray-100 text-sm text-red-600">
                                            Remove
                                        </button>
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">My Image</span>
                                </div>
                            </div>
                        ))}
                        {myImages.length === 0 && (
                            <div className="col-span-full text-center py-20 text-gray-500">No images yet. Upload or save from search results.</div>
                        )}
                    </div>
                )}

                {activeTab === "upload" && (
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onClick={() => document.getElementById("file-input")?.click()}
                        className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors ${isDragging ? "border-[#155dfc] bg-[#155dfc]/5" : "border-gray-300 hover:border-[#155dfc]/50"
                            }`}
                    >
                        <input id="file-input" type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />
                        <CloudUpload size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium text-gray-700 mb-2">Drop images here or click to upload</p>
                        <p className="text-sm text-gray-500">Supports: JPG, PNG, GIF (Max 5MB)</p>
                    </div>
                )}
            </div>

            {openMenu && <div className="fixed inset-0 z-[-10]" onClick={() => setOpenMenu(null)} />}
        </div>
    );
}