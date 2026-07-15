import { useState } from "react";
import {
  Trash2,
  MoreHorizontal,
  CopyPlus,
  Layers,
  ChevronRight,
  ArrowLeftRight,
  Scissors,
  Wand2,
} from "lucide-react";

// Floating toolbar shown above the selected image: a Delete button + a "⋯"
// dropdown (Duplicate / Delete / Layers order / Replace / Edit Cutout / Retouch).
// Rendered by PhotoEditor OUTSIDE the canvas' overflow-hidden box (positioned via
// `style`) and at a high z-index, so it stays visible even when the image fills
// or overflows the canvas corners.
export default function ImageToolbar({
  style,
  onDelete,
  onDuplicate,
  onLayersOrder,
  onReplace,
  onEditCutout,
  onRetouch,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const items = [
    { id: "duplicate", label: "Duplicate", icon: CopyPlus, onClick: onDuplicate },
    { id: "delete", label: "Delete", icon: Trash2, onClick: onDelete },
    {
      id: "layers",
      label: "Layers order",
      icon: Layers,
      onClick: onLayersOrder,
      chevron: true,
      divider: true,
    },
    { id: "replace", label: "Replace", icon: ArrowLeftRight, onClick: onReplace, divider: true },
    { id: "cutout", label: "Edit Cutout", icon: Scissors, onClick: onEditCutout },
    { id: "retouch", label: "Retouch", icon: Wand2, onClick: onRetouch },
  ];

  return (
    <div
      className="absolute z-[80]"
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toolbar row */}
      <div className="flex items-center gap-1 bg-surface rounded-xl shadow-lg border border-gray-100 px-1.5 py-1">
        <button
          onClick={onDelete}
          title="Delete"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          title="More"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-[85]"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 mt-1 w-52 bg-surface border border-gray-200 rounded-xl shadow-2xl py-1.5 z-[90]">
            {items.map(({ id, label, icon: Icon, onClick, chevron, divider }) => (
              <button
                key={id}
                onClick={() => {
                  setMenuOpen(false);
                  onClick?.();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer ${
                  divider ? "border-t border-gray-100 mt-1 pt-2.5" : ""
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {chevron && <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
