// components/ImportedBrandImagesSection.jsx
import MasonryImageGrid from './MasonryImageGrid';
import { Image as ImageIcon } from 'lucide-react';

const ImportedBrandImagesSection = ({
  importedImages = [],
  selectedImages = [],
  setSelectedImages,
  menuOpen,
  setMenuOpen,
  showToast,
}) => {
  const normalizedImages = importedImages
    .slice(0, 10)
    .map((img, index) => {
      const url = typeof img === 'string' ? img : (img.url || img.src || '');
      if (!url) return null;

      return {
        id: `imported-${index}`,
        src: `/api/proxy-image?url=${encodeURIComponent(url)}`, // PROXY ALL
        large: `/api/proxy-image?url=${encodeURIComponent(url)}`,
        originalUrl: url, // for debugging if needed
        alt: typeof img === 'object' ? img.alt || `Imported image ${index + 1}` : `Imported image ${index + 1}`,
      };
    })
    .filter(Boolean);

  const handleDownload = async (img) => {
    showToast("Downloading...");
    try {
      const res = await fetch(img.large);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `imported-brand-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Downloaded!");
    } catch {
      showToast("Download failed");
    }
  };

  if (normalizedImages.length === 0) return null;

  return (
    <div className="border-b border-b-gray-200 pb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-green-600" />
        <span>Images from Imported Brand</span>
        {/* <span className="text-xs font-normal text-gray-500">({normalizedImages.length} shown)</span> */}
      </h3>

      <MasonryImageGrid
        images={normalizedImages}
        selectedImages={selectedImages}
        onToggleSelect={setSelectedImages}
        menuOpen={menuOpen}
        onMenuToggle={setMenuOpen}
        onDownload={handleDownload}
        showToast={showToast}
        getImageUrl={(img) => img.src}
        getImageId={(img) => img.id}
      />
    </div>
  );
};

export default ImportedBrandImagesSection;