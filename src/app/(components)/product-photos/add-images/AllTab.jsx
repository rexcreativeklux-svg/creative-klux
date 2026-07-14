import UploadDropzone from "./UploadDropzone";
import UploadsGallery from "./UploadsGallery";

// "All" tab content = the upload drop zone + the recent Uploads gallery.
// Composes the two building blocks; all state is threaded down from the modal.
export default function AllTab({
  uploads,
  loading,
  isSelected,
  onToggle,
  onFiles,
  onSeeAllUploads,
}) {
  return (
    <div>
      <UploadDropzone onFiles={onFiles} />
      <UploadsGallery
        items={uploads}
        loading={loading}
        isSelected={isSelected}
        onToggle={onToggle}
        onSeeAll={onSeeAllUploads}
      />
    </div>
  );
}
