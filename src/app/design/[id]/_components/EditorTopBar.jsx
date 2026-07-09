"use client";

import React from "react";
import {
  ChevronLeft,
  Undo2,
  Redo2,
  Download,
  Loader2,
  Minus,
  Plus,
  Check,
} from "lucide-react";

/** Top chrome: back, editable title, undo/redo, zoom, save/download. */
export default function EditorTopBar({
  name,
  onNameChange,
  onBack,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  dirty,
  saving,
  onSave,
  onDownload,
}) {
  return (
    <header className="h-14 shrink-0 flex items-center gap-2 px-3 bg-surface border-b border-gray-200 z-30">
      <button
        onClick={onBack}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition cursor-pointer"
        title="Back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Untitled design"
        className="max-w-[280px] text-sm font-semibold text-gray-800 bg-transparent px-2 py-1 rounded-lg hover:bg-gray-100 focus:bg-gray-100 focus:outline-none truncate"
      />

      <div className="mx-1 flex items-center gap-0.5">
        <IconBtn onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo2 className="w-4 h-4" />
        </IconBtn>
        <IconBtn onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo2 className="w-4 h-4" />
        </IconBtn>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1 mr-1">
        <IconBtn onClick={onZoomOut} title="Zoom out">
          <Minus className="w-4 h-4" />
        </IconBtn>
        <span className="text-xs font-medium text-gray-500 w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <IconBtn onClick={onZoomIn} title="Zoom in">
          <Plus className="w-4 h-4" />
        </IconBtn>
      </div>

      <button
        onClick={onDownload}
        className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition cursor-pointer"
        title="Download PNG"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download</span>
      </button>

      <button
        onClick={onSave}
        disabled={saving || !dirty}
        className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition cursor-pointer"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : dirty ? null : (
          <Check className="w-4 h-4" />
        )}
        {saving ? "Saving…" : dirty ? "Save" : "Saved"}
      </button>
    </header>
  );
}

function IconBtn({ children, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
    >
      {children}
    </button>
  );
}
