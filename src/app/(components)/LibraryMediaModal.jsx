// components/LibraryMediaModal.jsx — ONLY shows images from fetchMyImages()
import {
  FolderOpen,
  FileUp,
  MoreVertical,
  Download,
  Trash2,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Toast from "./Toast";

const MAX_IMAGES = 5;

export default function LibraryMediaModal({
  isOpen,
  onClose,
  selectedImages = [],
  onSelectImage,
  onApply,
  onCancel,
  // importedImages prop is still accepted but completely ignored now
  importedImages = [],
}) {
  const {
    token,
    uploadMedia,
    fetchMyImages,
    deleteImage,
    myImages = [],
    myImagesLoading,
  } = useAuth();
  const [localSelected, setLocalSelected] = useState(selectedImages);
  const [menuOpen, setMenuOpen] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: "" });
  const fileInputRef = useRef(null);

  useEffect(() => setLocalSelected(selectedImages), [selectedImages]);

  // Always fetch my images when modal opens (if we have a token)
  useEffect(() => {
    if (isOpen && token) {
      fetchMyImages();
    }
  }, [isOpen, token, fetchMyImages]);

  const showToast = (message) => setToast({ isOpen: true, message });
  const closeToast = () => setToast({ isOpen: false, message: "" });

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      showToast("Please select image files only");
      e.target.value = "";
      return;
    }

    showToast(
      `Uploading ${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""}...`,
    );

    let uploaded = 0;
    let firstError = null;

    for (const file of imageFiles) {
      try {
        await uploadMedia(file);
        uploaded++;
      } catch (err) {
        firstError = err;
        break;
      }
    }

    if (uploaded > 0) {
      showToast(
        `${uploaded} image${uploaded > 1 ? "s" : ""} uploaded successfully!`,
      );
      await fetchMyImages();
    } else if (firstError) {
      showToast(`failed: ${firstError.message}`);
    } else {
      showToast("Upload failed");
    }

    e.target.value = "";
  };

  const handleImageSelect = (src) => {
    if (localSelected.includes(src)) {
      setLocalSelected((prev) => prev.filter((s) => s !== src));
      onSelectImage(src);
    } else if (localSelected.length >= MAX_IMAGES) {
      showToast("You can only select up to 5 images");
    } else {
      setLocalSelected((prev) => [...prev, src]);
      onSelectImage(src);
    }
  };

  if (!isOpen) return null;

  // ALWAYS use myImages from AuthContext — importedImages are ignored
  const imagesToShow = myImages;
  const isLoading = myImagesLoading;

  return (
    <>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        onClose={closeToast}
        duration={2500}
      />

      {/* `w-[80%] h-[85%]` left 20% of a 360px screen as dead margin and gave
          the grid ~288px to work with. Full-bleed sheet below `sm`, the old
          proportional dialog above it. */}
      <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 sm:items-center">
        <div className="bg-surface rounded-t-2xl p-card w-full h-[92dvh] flex flex-col sm:rounded-lg sm:p-6 sm:w-[80%] sm:h-[85%]">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-3">
              <FolderOpen className="w-6 h-6 text-blue-600" />
              Your Library
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 text-2xl font-medium transition cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Upload Button */}
          <div className="mb-6 border-b border-b-gray-200 pb-4">
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer shadow"
            >
              <FileUp className="w-5 h-5" />
              Upload New Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {/* Image Grid */}
          <div className="flex-1 overflow-y-auto px-2">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : imagesToShow.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FolderOpen className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">
                  No images in your library
                </p>
                <p className="text-sm">Upload images to get started</p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
                {imagesToShow.map((img, i) => {
                  const url =
                    typeof img === "string"
                      ? img
                      : img.src || img.image_url || img.url;
                  const hasId = typeof img === "object" && img.id;
                  const isSelected = localSelected.includes(url);
                  const menuId = `lib-${hasId ? img.id : i}`;

                  return (
                    <div
                      key={menuId}
                      className="relative group break-inside-avoid mb-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageSelect(url);
                      }}
                    >
                      <div className="relative overflow-visible rounded-lg shadow-sm border border-gray-300">
                        <img
                          src={url}
                          alt={`Library image ${i + 1}`}
                          className="w-full h-auto block rounded-lg"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />

                        {isSelected && (
                          <div className="absolute inset-0 border-4 border-blue-600 rounded-lg pointer-events-none" />
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === menuId ? null : menuId);
                          }}
                          className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {menuOpen === menuId && (
                          <div className="absolute top-10 right-2 bg-surface rounded-lg shadow-2xl border border-gray-200 py-2 z-20 min-w-45">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                showToast("Downloading...");

                                try {
                                  const res = await fetch(
                                    `/api/proxy-image?url=${encodeURIComponent(url)}`,
                                  );
                                  if (!res.ok) throw new Error();
                                  const blob = await res.blob();
                                  const blobUrl = URL.createObjectURL(blob);

                                  const a = document.createElement("a");
                                  a.href = blobUrl;
                                  a.download = `image-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(blobUrl);

                                  showToast("Downloaded!");
                                } catch {
                                  showToast("Download failed");
                                }

                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 text-sm cursor-pointer"
                            >
                              <Download size={16} /> Download
                            </button>

                            {hasId && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (
                                    !confirm("Delete this image permanently?")
                                  ) {
                                    setMenuOpen(null);
                                    return;
                                  }
                                  showToast("Deleting image...");
                                  try {
                                    await deleteImage(img.id);
                                    showToast("Image deleted successfully");
                                    await fetchMyImages();
                                  } catch (err) {
                                    showToast(
                                      err.message || "Failed to delete image",
                                    );
                                  } finally {
                                    setMenuOpen(null);
                                  }
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-red-50 text-red-600 text-sm cursor-pointer"
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            )}
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg transition-all flex items-center justify-center pointer-events-none">
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
            <button
              onClick={onApply}
              disabled={localSelected.length === 0}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition cursor-pointer shadow-sm font-medium"
            >
              Apply ({localSelected.length})
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition cursor-pointer shadow-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
