"use client";

import { useState, useCallback, useEffect } from "react";
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
    Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import NotificationModal from "@/app/(components)/NotificationModal";
import { toast } from "sonner";

export default function ImageGallery() {
    const {
        token,
        myImages,
        myImagesLoading,
        fetchMyImages,
        uploadImage,
        deleteImage
    } = useAuth();

    const [activeTab, setActiveTab] = useState("myImages");
    const [searchQuery, setSearchQuery] = useState("");
    const [mediaType, setMediaType] = useState("Images");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (token) fetchMyImages();
    }, [token, fetchMyImages]);

    const showNotification = (title, message, type = "info") => {
        setNotification({ title, message, type });
    };

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
        showNotification("Download started", `${filename || "Media"} is downloading`, "success");
    };

    const copyLink = (url) => {
        navigator.clipboard.writeText(url);
        toast.success("URL copied to clipboard");
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
            showNotification("Search failed", err.message || "Try again later", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const saveToMyImages = (item) => {
        // In future: save to backend
        setOpenMenu(null);
    };

    const handleFileUpload = async (files) => {
        if (!files) return;

        const validFiles = Array.from(files).filter((file) => {
            if (!file.type.startsWith("image/")) {
                showNotification("Invalid file", `${file.name} is not an image`, "error");
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                showNotification("File too large", `${file.name} exceeds 5MB limit`, "error");
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        // THIS IS THE KEY LINE → Show uploading modal immediately
        showNotification("Uploading Images...", `Processing ${validFiles.length} file(s)`, "info");

        setIsLoading(true);
        let successCount = 0;
        let failureCount = 0;

        let lastError = null;

        try {
            for (const file of validFiles) {
                try {
                    await uploadImage(file);
                    successCount++;
                } catch (err) {
                    console.error(`Failed to upload ${file.name}:`, err);
                    failureCount++;
                    lastError = err; // Store the last error to show user
                }
            }

            // Clear the "Uploading..." modal by replacing it
            if (successCount > 0) {
                showNotification(
                    "Upload Complete!",
                    `${successCount} image(s) uploaded successfully`,
                    "success"
                );
                setActiveTab("myImages");
            }

            if (failureCount > 0) {
                // Show the actual error message from the last failed upload
                showNotification(
                    "Upload Failed",
                    lastError?.message || `${failureCount} image(s) could not be uploaded`,
                    "error"
                );
            }

            if (successCount === 0 && failureCount === 0) {
                showNotification("No Changes", "Nothing was uploaded", "warning");
            }

        } catch (err) {
            showNotification("Upload Failed", err.message || "Unknown error occurred", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    }, [handleFileUpload]);

    const tabs = [
        { id: "search", label: "Search Results", icon: Search },
        { id: "myImages", label: "My Images", icon: FolderOpen },
        { id: "upload", label: "Upload", icon: Upload },
    ];

    const isSearchTab = activeTab === "search";
    const currentItems = isSearchTab ? searchResults : myImages;

    return (
        <>
            <div className="min-h-screen px-12 py-6">
                <header className="bg-[#155dfc] text-white px-8 py-6 rounded-md shadow-lg mb-8">
                    <div className="flex items-center gap-3">
                        <ImageIcon size={32} />
                        <h1 className="text-2xl font-bold">Image Library</h1>
                    </div>
                </header>

                <div className="mx-auto">
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
                                className={`pb-4 px-2 cursor-pointer flex items-center gap-3 font-medium transition-all duration-200 border-b-2 -mb-[2px] ${activeTab === tab.id
                                    ? "border-[#155dfc] text-[#155dfc]"
                                    : "border-transparent text-gray-600 hover:text-[#155dfc]"
                                    }`}
                            >
                                <tab.icon size={22} />
                                {tab.label}
                                {tab.id === "myImages" && myImagesLoading && (
                                    <Loader2 className="animate-spin ml-2" size={18} />
                                )}
                            </button>
                        ))}
                    </div>

                    {(activeTab === "search" || activeTab === "myImages") && (
                        <>
                            {myImagesLoading && activeTab === "myImages" ? (
                                <div className="text-center py-32">
                                    <Loader2 className="mx-auto animate-spin" size={48} />
                                    <p className="mt-4 text-gray-500">Loading your images...</p>
                                </div>
                            ) : currentItems.length === 0 ? (
                                <div className="text-center py-32 text-gray-500 text-xl">
                                    {isSearchTab
                                        ? "Search for images or videos to see results"
                                        : "No images yet. Upload or save from search!"}
                                </div>
                            ) : (
                                <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                                    {currentItems.map((item) => {
                                        const isVid = item.isVideo || "video_files" in item;
                                        const id = item.id || `s-${item.id}`;
                                        const src = isVid ? item.image || item.src : item.src?.medium || item.src;
                                        const videoUrl = isVid ? (item.videoUrl || getVideoUrl(item.video_files)) : null;

                                        return (
                                            <div
                                                key={id}
                                                className={`relative group break-inside-avoid mb-6 rounded-lg cursor-pointer overflow-visible border border-gray-100 transition duration-200 shadow ${openMenu === id ? "" : "hover:scale-105"}`}
                                            >
                                                {isVid ? (
                                                    <div className="aspect-[4/3]  bg-black">
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
                                                        className="w-full h-auto  rounded-lg"
                                                        loading="lazy"
                                                    />
                                                )}

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenu(openMenu === id ? null : id);
                                                    }}
                                                    className="absolute cursor-pointer top-2 text-white hover:text-black right-2 p-2 hover:bg-black/40 bg-black/60 backdrop-blur-sm rounded-full  transition-all duration-200 shadow z-10"
                                                >
                                                    <MoreVertical size={12} />
                                                </button>

                                                {openMenu === id && (
                                                    <div className="absolute top-12 right-0 bg-white rounded-xl shadow-2xl py-3 z-50 min-w-[210px] border border-gray-200">
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
                                                                    onClick={() => { downloadMedia(isVid ? videoUrl : item.src?.original || src, `pexels-${item.id}`); setOpenMenu(null); }}
                                                                    className="w-full cursor-pointer flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium"
                                                                >
                                                                    <Download size={18} /> Download
                                                                </button>
                                                                <button
                                                                    onClick={() => { copyLink(isVid ? videoUrl : item.src?.original || src); }}
                                                                    className="w-full cursor-pointer flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium"
                                                                >
                                                                    <Link2 size={18} /> Copy Link
                                                                </button>
                                                                {item.url && (
                                                                    <a
                                                                        href={item.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="w-full flex cursor-pointer items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium"
                                                                    >
                                                                        <ExternalLink size={18} /> View on Pexels
                                                                    </a>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => { downloadMedia(isVid ? videoUrl : src, item.filename || item.alt); setOpenMenu(null); }}
                                                                    className="w-full cursor-pointer flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium"
                                                                >
                                                                    <Download size={18} /> Download
                                                                </button>
                                                                <button
                                                                    onClick={() => { copyLink(isVid ? videoUrl : src); }}
                                                                    className="w-full cursor-pointer flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-100 text-sm font-medium"
                                                                >
                                                                    <Link2 size={18} /> Copy URL
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!confirm("Delete this image permanently? This cannot be undone.")) {
                                                                            setOpenMenu(null);
                                                                            return;
                                                                        }

                                                                        // ← SHOW FEEDBACK INSTANTLY
                                                                        showNotification("Deleting Image...", "Please wait", "info");

                                                                        try {
                                                                            await deleteImage(item.id);


                                                                            showNotification("Deleted!", "Image permanently removed", "success");
                                                                        } catch (err) {
                                                                            showNotification(
                                                                                "Delete Failed",
                                                                                err.message || "Could not delete the image",
                                                                                "error"
                                                                            );
                                                                        } finally {
                                                                            setOpenMenu(null);
                                                                        }
                                                                    }}
                                                                    className="w-full flex items-center cursor-pointer gap-3 px-5 py-2.5 text-left hover:bg-red-50 text-sm font-medium text-red-600 transition-colors"
                                                                >
                                                                    <Trash2 size={18} />
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* {!isSearchTab && (
                                                    <div className="absolute bottom-2 left-2">
                                                        <span className="bg-black/70 text-white px-1 py-1 rounded-lg text-xs backdrop-blur">
                                                            {isVid ? "My Video" : "My Image"}
                                                        </span>
                                                    </div>
                                                )} */}
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
                            className={`border-4 border-dashed rounded-3xl p-32 text-center cursor-pointer transition-all ${isDragging ? "border-[#155dfc] bg-blue-50" : "border-gray-300 hover:border-gray-400"
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

            {/* Notification Modal */}
            <NotificationModal
                isOpen={!!notification}
                onClose={() => setNotification(null)}
                title={notification?.title}
                message={notification?.message}
                type={notification?.type || "info"}
                duration={3000}
            />
        </>
    );
}