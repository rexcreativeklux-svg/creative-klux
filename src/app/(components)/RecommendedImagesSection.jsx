// components/RecommendedImagesSection.jsx
import MasonryImageGrid from './MasonryImageGrid';
import { Loader2 } from 'lucide-react';

const RecommendedImagesSection = ({
  brand, // Expecting brand object with .industry
  recommendedImages,
  isLoadingRecommended,
  selectedImages,
  setSelectedImages,
  menuOpen,
  setMenuOpen,
  showToast,
}) => {
  const industry = brand?.industry || 'your brand';

  const handleDownload = async (img) => {
    showToast("Downloading...");
    try {
      const url = img.large || img.src || img.url;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch image");
      const blob = await res.blob();
      const extension = blob.type.split('/')[1] || 'jpg';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${industry.toLowerCase().replace(/\s+/g, '-')}-pexels-${img.id}.${extension}`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Downloaded!");
    } catch (err) {
      console.error(err);
      showToast("Download failed");
    }
  };

  // Loading
  if (isLoadingRecommended) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">
          Finding stunning images for <span className="font-medium">{industry}</span> brands...
        </p>
      </div>
    );
  }

  // Empty
  if (!recommendedImages || recommendedImages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">
          No recommendations available for <span className="font-medium">{industry}</span>
        </p>
        <p className="text-xs text-gray-400 mt-2">Try again in a moment.</p>
      </div>
    );
  }

  return (
    <div className="border-b border-b-gray-200 py-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-5">
        Recommended for <span className="text-blue-600">{industry}</span>
      </h3>

      <MasonryImageGrid
        images={recommendedImages.slice(0, 10)}
        selectedImages={selectedImages}
        onToggleSelect={setSelectedImages}
        menuOpen={menuOpen}
        onMenuToggle={setMenuOpen}
        onDownload={handleDownload}
        showToast={showToast}
        getImageUrl={(img) => img.large || img.src || img.url}
        getImageId={(img) => `rec-${img.id}`}
      />

    </div>
  );
};

export default RecommendedImagesSection;