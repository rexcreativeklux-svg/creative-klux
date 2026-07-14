import { Loader2 } from "lucide-react";
import UploadDropzone from "./UploadDropzone";
import SelectableImageCard from "./SelectableImageCard";

// "Uploads" tab = the same drop zone as the All tab, followed by the FULL grid
// of the user's uploads (no "See all" cap). Data + selection are owned by the
// modal, so this stays presentational and shares the same building blocks.
export default function UploadsTab({
  uploads,
  loading,
  isSelected,
  onToggle,
  onFiles,
}) {
  return (
    <div>
      <UploadDropzone onFiles={onFiles} />

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : uploads.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No uploads yet. Add images above to get started.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {uploads.map((item) => (
              <SelectableImageCard
                key={item.id}
                item={item}
                selected={isSelected(item.id)}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
