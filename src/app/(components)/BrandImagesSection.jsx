
import MasonryImageGrid from './MasonryImageGrid';

const BrandImagesSection = ({
  // importedImages prop is now ignored — kept only for backward compatibility
  importedImages = [],
  myImages = [],
  selectedImages,
  setSelectedImages,
  menuOpen,
  setMenuOpen,
  showToast,
  deleteImage,
  fetchMyImages,
}) => {
  // Always use myImages — importedImages are fully ignored
  const images = myImages;
  const displayImages = images.slice(0, 10);

  const handleDownload = async (img, url) => {
    showToast("Downloading...");
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `brand-image-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Downloaded!");
    } catch {
      showToast("Download failed");
    }
  };

  const handleDelete = async (img) => {
    if (!confirm("Delete this image permanently?")) return;
    showToast("Deleting...");
    try {
      await deleteImage(img.id);
      await fetchMyImages();
      showToast("Deleted successfully");
    } catch (err) {
      showToast(err.message || "Delete failed");
    }
  };

  return (
    <div className="pb-4 border-b border-b-gray-200">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Your Brand Images</h3>
      
      {displayImages.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">
          No brand images yet. Upload some in your Library!
        </p>
      ) : (
        <MasonryImageGrid
          images={displayImages}
          selectedImages={selectedImages}
          onToggleSelect={setSelectedImages}
          menuOpen={menuOpen}
          onMenuToggle={setMenuOpen}
          onDownload={handleDownload}
          onDelete={handleDelete}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default BrandImagesSection;