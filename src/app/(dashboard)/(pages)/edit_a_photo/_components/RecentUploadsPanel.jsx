import { ArrowLeft } from "lucide-react";

// Full "Recent uploads" browser — opened from the carousel's "See all" link.
// Shows every upload in a scrollable grid with a filter box. Back arrow returns
// to whichever panel opened it.
//   images     — [{ id, src, alt, filename }]
//   selectedSrc— currently-applied src (ring highlight), optional
//   onSelect   — (src) => void
//   onBack     — () => void
export default function RecentUploadsPanel({
  images = [],
  selectedSrc = null,
  onSelect,
  onBack,
}) {
  return (
    <div className="flex flex-col max-h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h3 className="font-semibold text-lg text-gray-900 truncate">
          Recent uploads
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {images.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No uploads yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => {
              const active = selectedSrc && selectedSrc === img.src;
              return (
                <button
                  key={img.id}
                  onClick={() => onSelect?.(img.src)}
                  className={`aspect-square rounded-lg overflow-hidden border cursor-pointer bg-gray-100 ${
                    active
                      ? "ring-2 ring-blue-500 border-transparent"
                      : "border-gray-200 hover:border-blue-400"
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.alt || ""}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
