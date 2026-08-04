"use client";

import { useState, useEffect } from "react";
import { Play, Search, Clock, Eye, Video } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/app/(components)/Toast";
import Skeleton from "@/app/(components)/skeletons/Skeleton";
import { SkeletonCardGrid } from "@/app/(components)/skeletons/PageSkeleton";

export default function TutorialVideos() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [toast, setToast] = useState({ isOpen: false, message: "" });
    
    const { 
        tutorialVideos, 
        tutorialVideosLoading, 
        tutorialVideosError,
        fetchTutorialVideos 
    } = useAuth();

    useEffect(() => {
        // Fetch videos on mount if not already loaded
        if (tutorialVideos.length === 0 && !tutorialVideosLoading) {
            fetchTutorialVideos();
        }
    }, []);

    // Show error toast when error occurs
    useEffect(() => {
        if (tutorialVideosError) {
            setToast({ 
                isOpen: true, 
                message: tutorialVideosError,
                type: "error"
            });
        }
    }, [tutorialVideosError]);

    const handleRetry = async () => {
        try {
            await fetchTutorialVideos();
            setToast({ 
                isOpen: true, 
                message: "Tutorials loaded successfully!",
                type: "success"
            });
        } catch (err) {
            setToast({ 
                isOpen: true, 
                message: "Failed to load tutorials. Please try again.",
                type: "error"
            });
        }
    };

    const filteredTutorials = tutorialVideos.filter((tutorial) => {
        const matchesSearch = tutorial.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tutorial.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case "Beginner": return "bg-green-100 text-green-700";
            case "Intermediate": return "bg-blue-100 text-blue-700";
            case "Advanced": return "bg-purple-100 text-purple-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    // Generate thumbnail URL based on source
    const getThumbnail = (tutorial) => {
        if (tutorial.thumbnail) return tutorial.thumbnail;
        
        // Extract YouTube video ID and get thumbnail
        if (tutorial.source === "youtube" && tutorial.video_link) {
            const videoId = tutorial.video_link.split('/embed/')[1]?.split('?')[0];
            if (videoId) {
                return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }
        }
        
        // Default fallback
        return "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop";
    };

    // Heading, search and the video grid are all known before the fetch returns
    // — only the tutorials themselves are pending — so the page draws itself and
    // greys out just the thumbnails, rather than replacing everything with a
    // spinner and then re-laying the whole screen out.
    if (tutorialVideosLoading) {
        return (
            <div className="min-h-screen px-12 py-4">
                <div className="mb-8 flex flex-col gap-3">
                    <Skeleton className="h-8 w-64 max-w-full rounded-lg" />
                    <Skeleton className="h-3.5 w-96 max-w-full" tone="soft" />
                </div>
                <div className="mb-8">
                    <Skeleton className="h-12 w-full rounded-lg" tone="soft" />
                </div>
                <Skeleton className="mb-6 h-4 w-40" />
                <SkeletonCardGrid
                    count={8}
                    aspect="aspect-video"
                    columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    gap="gap-6"
                />
            </div>
        );
    }

    if (tutorialVideosError) {
        return (
            <>
                <div className="min-h-screen px-12 py-4">
                    <div className="text-center py-12 bg-surface rounded-xl border border-gray-200">
                        <Video className="w-16 h-16 text-red-300 mx-auto mb-4" />
                        <p className="text-red-500 text-lg mb-2">{tutorialVideosError}</p>
                        <button
                            onClick={handleRetry}
                            className="mt-4 px-6 py-2 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
                <Toast 
                    message={toast.message}
                    isOpen={toast.isOpen}
                    onClose={() => setToast({ ...toast, isOpen: false })}
                    type={toast.type}
                />
            </>
        );
    }

    return (
        <>
            <div className="min-h-screen relative px-12 py-4">
                <div className="">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-3xl font-bold text-gray-900">Tutorial Videos</h1>
                        </div>
                        <p className="text-gray-600">Master Creative Klux with step-by-step video guides</p>
                    </div>

                    {/* Search */}
                    <div className="mb-8">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tutorials..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* All Tutorials */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-6">
                            All Tutorials ({filteredTutorials.length})
                        </h2>
                        {filteredTutorials.length === 0 ? (
                            <div className="text-center py-12 bg-surface rounded-xl border border-gray-200">
                                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No tutorials found</p>
                                <p className="text-gray-400 text-sm mt-2">
                                    {tutorialVideos.length === 0 ? "No tutorials available yet" : "Try adjusting your search"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredTutorials.map((tutorial) => (
                                    <div
                                        key={tutorial.id}
                                        onClick={() => setSelectedVideo(tutorial)}
                                        className="group cursor-pointer bg-surface rounded-xl overflow-hidden shadow hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                                    >
                                        <div className="relative aspect-video bg-gray-900">
                                            <img
                                                src={getThumbnail(tutorial)}
                                                alt={tutorial.title}
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            />
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                                <div className="w-14 h-14 bg-black/70 hover:bg-blue-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                                                    <Play className="w-7 h-7 text-white ml-1" fill="white" />
                                                </div>
                                            </div>
                                            {tutorial.difficulty && (
                                                <div className="absolute top-2 left-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getDifficultyColor(tutorial.difficulty)}`}>
                                                        {tutorial.difficulty}
                                                    </span>
                                                </div>
                                            )}
                                            {tutorial.duration && (
                                                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs font-medium flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {tutorial.duration}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-base text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                {tutorial.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {tutorial.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                {tutorial.views && (
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" />
                                                        {tutorial.views}
                                                    </div>
                                                )}
                                                {tutorial.feature && (
                                                    <span className="text-blue-600 font-medium">{tutorial.feature}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Video Modal */}
                {selectedVideo && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedVideo(null)}
                    >
                        <div
                            className="bg-black relative rounded-lg max-w-5xl w-full overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative aspect-video bg-black">
                                <iframe
                                    src={selectedVideo.video_link}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={selectedVideo.title}
                                />
                            </div>
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-gray-50 mb-2">{selectedVideo.title}</h2>
                                        <p className="text-gray-50 mb-4">{selectedVideo.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-50 flex-wrap">
                                            {selectedVideo.duration && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {selectedVideo.duration}
                                                </div>
                                            )}
                                            {selectedVideo.views && (
                                                <div className="flex items-center gap-1">
                                                    <Eye className="w-4 h-4" />
                                                    {selectedVideo.views} views
                                                </div>
                                            )}
                                            {selectedVideo.difficulty && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(selectedVideo.difficulty)}`}>
                                                    {selectedVideo.difficulty}
                                                </span>
                                            )}
                                            {selectedVideo.feature && (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-blue-700">
                                                    {selectedVideo.feature}
                                                </span>
                                            )}
                                            {selectedVideo.source && (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-900 capitalize">
                                                    {selectedVideo.source}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                 
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast Component */}
            <Toast 
                message={toast.message}
                isOpen={toast.isOpen}
                onClose={() => setToast({ ...toast, isOpen: false })}
                type={toast.type}
            />
        </>
    );
}