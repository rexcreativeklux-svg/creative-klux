import { useState } from "react";
import {
  Home,
  Undo,
  Redo,
  Download,
  ChevronDown,
  Share2,
  MoreHorizontal,
  Columns2,
  Video,
  CopyPlus,
  Zap,
  Trash2,
} from "lucide-react";

// "⋯" menu items (Photoroom parity). Each fires onMenuAction(id) so PhotoEditor
// owns the behavior. `divider` draws a separator above the item.
const MORE_ACTIONS = [
  { id: "video", label: "Generate video", icon: Video },
  { id: "duplicate", label: "Duplicate", icon: CopyPlus },
  { id: "template", label: "Turn into Template", icon: Zap },
  { id: "delete", label: "Delete", icon: Trash2, danger: true, divider: true },
];

// Top bar for the /edit_a_photo editor (Photoroom-style): Home + undo/redo,
// the centered tool row, and the avatar / Download / Share actions.
// Presentational — all state and handlers are owned by PhotoEditor and passed
// in as props.
export default function EditorTopBar({
  onClose,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  tools,
  onToolClick,
  canExport,
  downloadMenuOpen,
  setDownloadMenuOpen,
  onDownload,
  onShare,
  userInitial = "?",
  userEmail,
  userName,
  onMenuAction,
  onTogglePanel,
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div
      className="bg-surface border-b border-gray-200 flex items-center px-4 py-2 gap-4 z-10"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Left: Home + history */}
      <div className="flex items-center gap-1">
        <button
          onClick={onClose}
          title="Home"
          className="p-2 mr-1 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
        >
          <Home className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Undo className="w-4 h-4 text-gray-500" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Redo className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Center: tools */}
      <div className="flex items-center gap-0.5 flex-1 justify-center">
        {tools.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onToolClick(id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <Icon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-500">{label}</span>
          </button>
        ))}
      </div>

      {/* Right: avatar + actions */}
      <div className="flex items-center gap-2">
        {/* Avatar + hover card */}
        <div className="relative group">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold cursor-default">
            {userInitial}
          </div>
          <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-gray-200 rounded-xl shadow-xl p-3 z-50 hidden group-hover:block">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userInitial}
              </div>
              <span
                className="text-sm text-gray-700 truncate flex-1"
                title={userName ? `${userName} · ${userEmail || ""}` : userEmail}
              >
                {userEmail || userName || "You"}
              </span>
              <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded shrink-0">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* "⋯" more menu */}
        <div className="relative">
          <button
            onClick={() => setMoreOpen((o) => !o)}
            title="More"
            className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
          {moreOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMoreOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-52 bg-surface border border-gray-200 rounded-xl shadow-lg py-1.5 z-50">
                {MORE_ACTIONS.map(({ id, label, icon: Icon, danger, divider }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setMoreOpen(false);
                      onMenuAction?.(id);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm cursor-pointer ${
                      divider ? "border-t border-gray-100 mt-1 pt-2.5" : ""
                    } ${
                      danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" /> {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Panels / split view */}
        <button
          onClick={onTogglePanel}
          title="Panels"
          className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
        >
          <Columns2 className="w-5 h-5 text-gray-600" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDownloadMenuOpen((o) => !o)}
            disabled={!canExport}
            className="flex items-center gap-2 border border-blue-500 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Download
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${downloadMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {downloadMenuOpen && (
            <>
              {/* click-away backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDownloadMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-44 bg-surface border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onDownload("png");
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <span className="font-medium">PNG</span>
                </button>
                <button
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onDownload("jpeg");
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <span className="font-medium">JPEG</span>
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onShare}
          disabled={!canExport}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </div>
  );
}
