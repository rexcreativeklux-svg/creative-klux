import { ArrowLeft } from "lucide-react";
import InfinitePexelsGrid from "./InfinitePexelsGrid";

// Dedicated panel for a single background category (e.g. "Wood"). Opened from a
// CategoryCard; the back arrow returns to the library. The grid endlessly loads
// more of that category as you scroll.
//   category   — { label, query }
//   onBack     — () => void
//   onApply    — (largeUrl) => void
//   selectedSrc— currently-applied src, optional
export default function BackgroundCategoryPanel({
  category,
  onBack,
  onApply,
  selectedSrc = null,
}) {
  return (
    <div className="flex flex-col max-h-full">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h3 className="font-semibold text-lg text-gray-900 truncate">
          {category.label}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <InfinitePexelsGrid
          key={category.query}
          query={category.query}
          onApply={onApply}
          selectedSrc={selectedSrc}
        />
      </div>
    </div>
  );
}
