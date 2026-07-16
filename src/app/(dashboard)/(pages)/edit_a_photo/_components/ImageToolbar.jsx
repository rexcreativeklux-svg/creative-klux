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
  Pencil,
  BringToFront,
  SendToBack,
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
  // Move the layer to the front / back (shown as a hover submenu under
  // "Layers order").
  onBringFront,
  onSendBack,
  onReplace,
  onEditCutout,
  onRetouch,
  // Optional: when provided, a pencil "Edit" button appears in the toolbar and an
  // Edit item in the ⋯ menu (used by text layers).
  onEdit,
  // ids to omit from the ⋯ menu (e.g. Edit Cutout / Retouch for image layers
  // until Phase 2 wires per-layer cutout + bg-removal).
  hiddenItems = [],
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);

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
    ...(onEdit
      ? [{ id: "edit", label: "Edit", icon: Pencil, onClick: onEdit, divider: true }]
      : []),
  ].filter((it) => !hiddenItems.includes(it.id));

  return (
    <div
      className="absolute z-[100]"
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toolbar row */}
      <div className="flex items-center gap-1 bg-surface rounded-xl shadow-lg border border-gray-100 px-1.5 py-1">
        {onEdit && (
          <button
            onClick={onEdit}
            title="Edit"
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
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
            {items.map(({ id, label, icon: Icon, onClick, chevron, divider }) => {
              // "Layers order" reveals a Front / Back submenu on hover, wired to
              // move the layer to the front or back of the stack.
              if (id === "layers") {
                return (
                  <div
                    key={id}
                    className="relative group"
                    onMouseEnter={() => setSubmenuOpen(true)}
                    onMouseLeave={() => setSubmenuOpen(false)}
                  >
                    <button
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer ${
                        divider ? "border-t border-gray-100 mt-1 pt-2.5" : ""
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    {submenuOpen && (
                      <div className="absolute left-full top-0 -ml-1 pl-2 w-44">
                        <div className="bg-surface border border-gray-200 rounded-xl shadow-2xl py-1.5">
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setSubmenuOpen(false);
                              onBringFront?.();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            <BringToFront className="w-4 h-4 shrink-0" />
                            <span className="flex-1 text-left">Front</span>
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setSubmenuOpen(false);
                              onSendBack?.();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            <SendToBack className="w-4 h-4 shrink-0" />
                            <span className="flex-1 text-left">Back</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return (
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
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
