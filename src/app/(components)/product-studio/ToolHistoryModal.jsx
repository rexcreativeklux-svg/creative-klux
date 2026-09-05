"use client";

/**
 * ToolHistoryModal — everything one tool has made, in an overlay, from the
 * landing page's "See more".
 *
 * ⚠️ IT WRAPS {@link ProductHistoryGrid} RATHER THAN DRAWING ITS OWN GRID. That
 * component already is "a wall of this tool's results": the ⋯ menu, Download,
 * Save to gallery, Copy link, Delete, the lightbox, and the video-vs-image tile
 * split that stops an .mp4 being fed to an <img>. A second grid here would be
 * the same picture with half the actions, and every fix to one would have to be
 * remembered for the other. Everything below the header is that component.
 *
 * ⚠️ THE OVERLAY IS THE ONLY THING THIS FILE OWNS — the scrim, the panel, Escape
 * and the scroll lock. Keeping it that thin is what makes it obvious that the
 * page and the tool modals are showing the identical history, because they are
 * running the identical code.
 */

import { useEffect } from "react";
import { X } from "lucide-react";
import ProductHistoryGrid from "./ProductHistoryGrid";

/**
 * @param {object} props
 * @param {{id: string, name: string, Icon: Function, color: string, tool: string}} props.tool
 * @param {Array} props.items Everything this tool has made, newest first.
 * @param {() => void} props.onClose
 * @param {(id: string|number) => void} props.onDelete
 * @param {(file: File) => Promise<unknown>} props.uploadMedia Auth uploader, for
 *   the grid's "Save to gallery".
 * @param {() => void} [props.onOpenTool] Launch the tool from the header.
 */
export default function ToolHistoryModal({
  tool,
  items,
  onClose,
  onDelete,
  uploadMedia,
  onOpenTool,
}) {
  // Escape closes, and the page behind doesn't scroll under the overlay.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const { Icon } = tool;
  const isVideoTool = tool.tool === "product_video";

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm"
      // Only a click on the scrim ITSELF closes. Without the target test, a
      // drag that starts on a tile and ends out here would dismiss the overlay.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="bg-surface w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-5xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-gray-100 shrink-0">
          {Icon && (
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tool.color}`}
            >
              <Icon className="w-4.5 h-4.5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {tool.name}
            </h2>
            <p className="text-xs text-gray-500">
              {items.length} {items.length === 1 ? "result" : "results"}
            </p>
          </div>

          {onOpenTool && (
            <button
              onClick={onOpenTool}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Open {tool.name}
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* `loading={false}`: the page loaded these before the row that opened
            this could be drawn, so there is nothing left to wait for — passing
            true would show a spinner over results already in hand. */}
        <ProductHistoryGrid
          items={items}
          loading={false}
          onDelete={onDelete}
          uploadMedia={uploadMedia}
          filePrefix={tool.id}
          // Video results need the wider tile to stay watchable — the same
          // sizing Product Video's own modal asks for.
          aspectClass={isVideoTool ? "aspect-video" : "aspect-square"}
          gridClass={isVideoTool ? "grid-fluid-[260px]" : "grid-fluid-[150px]"}
        />
      </div>
    </div>
  );
}
