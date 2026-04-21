// components/MasonryImageGrid.jsx
import { MoreVertical, Download, Trash2 } from 'lucide-react';

const MasonryImageGrid = ({
  images = [],
  selectedImages = [],
  onToggleSelect,
  menuOpen,
  onMenuToggle,
  onDownload,
  onDelete, // optional — only for user images
  maxSelect = 5,
  showToast,
  getImageUrl = (img) => (typeof img === 'string' ? img : img.src || img.url || img.image_url),
  getImageId = (img, i) => (typeof img === 'object' && img.id ? img.id : `img-${i}`),
}) => {
  const handleSelect = (url) => {
    const isSelected = selectedImages.includes(url);
    if (isSelected) {
      onToggleSelect(selectedImages.filter(s => s !== url));
    } else {
      if (selectedImages.length >= maxSelect) {
        showToast(`You can only select up to ${maxSelect} images`);
        return;
      }
      onToggleSelect([...selectedImages, url]);
    }
  };

  return (
    <div className="columns-3 sm:columns-4 md:columns-4 gap-3 space-y-3">
      {images.map((img, i) => {
        const url = getImageUrl(img);
        const id = getImageId(img, i);
        const isSelected = selectedImages.includes(url);

        return (
          <div
            key={id}
            className="relative group break-inside-avoid mb-3 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(url);
            }}
          >
            <div className="relative overflow-visible rounded-lg shadow-sm border border-gray-300">
              <img
                src={url}
                alt={`Image ${i + 1}`}
                className="w-full h-auto block rounded-lg"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />

              {/* Selected Border */}
              {isSelected && (
                <div className="absolute inset-0 border-4 border-blue-700 rounded-lg pointer-events-none" />
              )}

              {/* 3-dot Menu */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuToggle(menuOpen === id ? null : id);
                }}
                className="absolute top-2 cursor-pointer right-1 p-1 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <MoreVertical size={14} />
              </button>

              {/* Dropdown */}
              {menuOpen === id && (
                <div className="absolute top-10 right-2 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-20 min-w-[180px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(img, url);
                      onMenuToggle(null);
                    }}
                    className="w-full flex cursor-pointer items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 text-sm"
                  >
                    <Download size={16} /> Download
                  </button>

                  {onDelete && typeof img === 'object' && img.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(img);
                        onMenuToggle(null);
                      }}
                      className="w-full flex cursor-pointer items-center gap-3 px-4 py-2 text-left hover:bg-red-50 text-red-600 text-sm"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>
              )}

              {/* Hover Text */}
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
  );
};

export default MasonryImageGrid;