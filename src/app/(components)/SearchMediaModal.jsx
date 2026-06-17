import React, { useState, useEffect, useCallback } from 'react';
import { FileSearch, Loader2, MoreVertical, Download, Plus, Trash2, PlusCircleIcon } from 'lucide-react';
import Toast from './Toast';

export default function SearchMediaModal({
  isOpen,
  onClose,
  selectedImages = [],
  onSelectImage,
  onApply,
  onCancel,
  onAddImageUrl,
  postData,
  activeBrand,
  onAddToBrand,        // ← new: function to save image to user's brand assets
  myImages = [],       // ← optional: to check if image is already in brand
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedImages, setDisplayedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null); // for 3-dot menu
  const [toast, setToast] = useState({ isOpen: false, message: '' });

  const showToast = (message) => {
    setToast({ isOpen: true, message });
  };

  const closeToast = () => {
    setToast({ isOpen: false, message: '' });
  };

  const currentBrandName = postData?.brandName?.trim()
    ? postData.brandName.trim()
    : activeBrand?.name?.trim()
    ? activeBrand.name.trim()
    : "premium marketing lifestyle";

  const fetchImages = useCallback(async (query) => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=60`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const images = (data.photos || []).map(photo => ({
        id: photo.id,
        src: photo.src.medium,
        large: photo.src.large2x || photo.src.large,
        alt: photo.alt || query,
      }));
      setDisplayedImages(images);
    } catch (err) {
      showToast('Failed to load images. Please try again.');
      setDisplayedImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecommended = useCallback(() => {
    const brandQuery = !currentBrandName || currentBrandName.includes("your brand")
      ? "premium marketing ad lifestyle business creative"
      : `${currentBrandName} marketing ad lifestyle premium elegant professional`;
    fetchImages(brandQuery);
  }, [currentBrandName, fetchImages]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setMenuOpen(null);
      loadRecommended();
    }
  }, [isOpen, loadRecommended]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      searchQuery.trim() ? fetchImages(searchQuery) : loadRecommended();
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchImages, loadRecommended, isOpen]);

  const handleSelectImage = (src) => {
    if (selectedImages.includes(src)) {
      onSelectImage(src);
    } else if (selectedImages.length >= 5) {
      showToast("You can only select up to 5 images");
    } else {
      onSelectImage(src);
    }
  };

  const handleDownload = async (img) => {
    showToast("Downloading...");
    try {
      const url = img.large || img.src;
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `pexels-${img.id}.${blob.type.split('/')[1] || 'jpg'}`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Downloaded!");
    } catch {
      showToast("Download failed");
    }
    setMenuOpen(null);
  };

  const isInMyBrand = (img) => myImages.some(i => 
    (typeof i === 'string' ? i : i.src || i.url || i.image_url) === img.src
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-lg p-6 w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
              <FileSearch className="w-7 h-7 text-blue-600" />
              Search Images
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-600 text-3xl font-light transition cursor-pointer">
              ×
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden mb-6 shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for images... (e.g., puppy, office, food)"
              className="flex-1 px-4 py-3 text-sm focus:outline-none"
              autoFocus
            />
            <button className="px-8 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
            </button>
          </div>

          {/* Masonry Grid */}
          <div className="flex-1 overflow-y-auto pb-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
            ) : displayedImages.length === 0 ? (
              <p className="text-center text-gray-500 py-20 text-lg">
                {searchQuery ? "No images found." : `Finding images for "${currentBrandName}"...`}
              </p>
            ) : (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-5 space-y-5">
                {displayedImages.map((img) => {
                  const isSelected = selectedImages.includes(img.src);
                  const inBrand = isInMyBrand(img);

                  return (
                    <div
                      key={img.id}
                      className="relative group break-inside-avoid mb-5 cursor-pointer"
                      onClick={() => handleSelectImage(img.src)}
                    >
                      <div className="relative overflow-hidden rounded-xl shadow-md">
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="w-full h-auto rounded-lg group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {/* Selected Indicator */}
                        {isSelected && (
                          <>
                            <div className="absolute inset-0 rounded-xl ring-4 ring-blue-600 ring-inset pointer-events-none shadow-lg" />
                            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg z-10">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </>
                        )}

                        {/* 3-dot Menu */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === img.id ? null : img.id);
                          }}
                          className="absolute top-2 cursor-pointer right-2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen === img.id && (
                          <div className="absolute top-10 right-2 bg-surface rounded-lg shadow-2xl border border-gray-200 py-2 z-20 min-w-[180px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(img);
                              }}
                              className="w-full flex text-medium cursor-pointer items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 text-sm"
                            >
                              <Download size={16} /> Download
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToBrand?.(img);
                                showToast("Added to your brand assets!");
                                setMenuOpen(null);
                              }}
                              className="w-full text-medium flex cursor-pointer items-center gap-3 px-4 py-2 text-left hover:bg-blue-50 text-blue-600 text-sm"
                            >
                              <PlusCircleIcon size={16} /> Add to Brand
                            </button>
                            {inBrand && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showToast("Removed from brand");
                                  setMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-red-50 text-red-600 text-sm"
                              >
                                <Trash2 size={16} /> Remove
                              </button>
                            )}
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition-all flex items-center justify-center pointer-events-none">
                          <div className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium">
                            {isSelected ? "Selected" : "Click to select"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-200 gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:max-w-md">
              <input
                id="imageUrlInput"
                type="text"
                placeholder="Paste image URL..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={onAddImageUrl}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer font-medium text-sm whitespace-nowrap"
              >
                Add URL
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel || onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onApply}
                disabled={selectedImages.length === 0}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition cursor-pointer font-medium shadow-md min-w-[120px]"
              >
                Apply ({selectedImages.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast isOpen={toast.isOpen} message={toast.message} onClose={closeToast} duration={2500} />
    </>
  );
}