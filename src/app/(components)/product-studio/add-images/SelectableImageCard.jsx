import { Check, Loader2 } from "lucide-react";

// A single square thumbnail with a Photoroom-style checkbox in the top-left.
// `item` = { id, url, name }. Selection state + toggling live in the parent so
// the same card works across every tab (All / Uploads / Shopify / …).
export default function SelectableImageCard({ item, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item)}
      className="relative group aspect-square w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer"
    >
      <img
        src={item.url}
        alt={item.name || "image"}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => (e.currentTarget.style.opacity = "0")}
      />

      {/* Checkbox */}
      <span
        className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
          selected
            ? "bg-gray-900 border-gray-900 text-gray-50"
            : "bg-white/90 border-gray-300 text-transparent group-hover:border-gray-400"
        }`}
      >
        <Check className="w-4 h-4" strokeWidth={3} />
      </span>

      {/* Selected ring */}
      {selected && (
        <span className="absolute inset-0 rounded-xl ring-2 ring-gray-900 pointer-events-none" />
      )}

      {/* Uploading overlay (while the file saves to the gallery) */}
      {item.uploading && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        </span>
      )}
    </button>
  );
}
