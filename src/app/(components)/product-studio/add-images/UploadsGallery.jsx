import { Loader2 } from "lucide-react";
import SelectableImageCard from "./SelectableImageCard";

// The "Uploads" section shown under the drop zone on the All tab: a header with
// a "See all" shortcut (jumps to the Uploads tab) and a grid of selectable
// thumbnails. Pure presentation — data + selection are owned by the modal.
export default function UploadsGallery({
  items,
  loading,
  isSelected,
  onToggle,
  onSeeAll,
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Uploads</h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          See all
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          No uploads yet. Add images above to get started.
        </p>
      ) : (
        <div className="grid grid-cols-6 gap-3">
          {items.map((item) => (
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
  );
}
