"use client";

import React, { useEffect, useRef, useState } from "react";
import EditorCollaborators from "./collaborators/EditorCollaborators";
import {
  ChevronLeft,
  Undo2,
  Redo2,
  Eye,
  Minus,
  Plus,
  Share2,
  Save,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import ShareModal from "./share/ShareModal";

/**
 * Top chrome: back, editable title, undo/redo, zoom, preview/share.
 *
 * ── WHY THERE ARE TWO ARRANGEMENTS ──────────────────────────────────────────
 * Laid out in a single row this bar needs roughly 600px: back, a 280px title
 * field, undo/redo, a zoom stepper, then Save, Preview and Share. On a 360px
 * screen that overflowed the header and pushed Share — the primary action —
 * off the right edge.
 *
 * From `lg` the row is exactly as it was. Below it, everything that is not
 * back / title / undo / redo moves into an overflow menu, so the two controls
 * a user reaches for constantly stay one tap away and the rest stay reachable.
 *
 * Zoom lives in that menu rather than being dropped, because pinch-to-zoom
 * (see DesignEditor) is a gesture with no discoverable affordance — the
 * stepper is how someone finds out the canvas zooms at all.
 */
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
  onPreview,
  canvas,
  elements,
}) {
  const [showShare, setShowShare] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const shareBtnRef = useRef(null);
  const moreRef = useRef(null);

  // Close the overflow menu on outside click / Escape — same pattern as the
  // brand switcher in the app header.
  useEffect(() => {
    if (!showMore) return;
    const onDown = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
    };
    const onKey = (e) => e.key === "Escape" && setShowMore(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showMore]);

  const zoomPct = Math.round(zoom * 100);

  return (
    <header className="h-14 shrink-0 flex items-center gap-1 px-2 bg-surface border-b border-gray-200 z-30 sm:gap-2 sm:px-3">
      <button
        onClick={onBack}
        className="ck-tap w-9 h-9 shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition cursor-pointer"
        title="Back"
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* min-w-0 + flex-1: the title takes the leftover room and truncates,
          instead of holding a fixed 280px and shoving the actions off screen. */}
      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Untitled design"
        aria-label="Design name"
        className="min-w-0 flex-1 text-sm font-semibold text-gray-800 bg-transparent px-2 py-1 rounded-lg hover:bg-gray-100 focus:bg-gray-100 focus:outline-none truncate lg:flex-none lg:max-w-70"
      />

      <div className="mx-0 flex shrink-0 items-center gap-0.5 sm:mx-1">
        <IconBtn onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo2 className="w-4 h-4" />
        </IconBtn>
        <IconBtn onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo2 className="w-4 h-4" />
        </IconBtn>
      </div>

      {/* Only pushes the actions right once they all fit on one row. */}
      <div className="hidden lg:block lg:flex-1" />

      <div className="hidden lg:flex items-center gap-1 mr-1">
        <IconBtn onClick={onZoomOut} title="Zoom out">
          <Minus className="w-4 h-4" />
        </IconBtn>
        <span className="text-xs font-medium text-gray-500 w-10 text-center tabular-nums">
          {zoomPct}%
        </span>
        <IconBtn onClick={onZoomIn} title="Zoom in">
          <Plus className="w-4 h-4" />
        </IconBtn>
      </div>

      {/* Who else is on the team. Desktop only: below `lg` the bar is already
          fighting for room, and a row of faces is the first thing that can go —
          it informs, it doesn't let you do anything you can't do elsewhere. */}
      <div className="hidden lg:flex">
        <EditorCollaborators />
      </div>

      {/* Save — beside the zoom. Manual click confirms with a toast; the editor
          also autosaves every 30s in the background. */}
      <button
        onClick={() => onSave()}
        disabled={saving}
        className="hidden lg:flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        title="Save design"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        <span>{saving ? "Saving…" : "Save"}</span>
      </button>

      <button
        onClick={onPreview}
        className="hidden lg:flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition cursor-pointer"
        title="Preview design"
      >
        <Eye className="w-4 h-4" />
        <span>Preview</span>
      </button>

      {/* ── Overflow menu (below lg) ──────────────────────────────────────
          Everything the row cannot hold, in one place. Rendered `absolute`
          inside a `relative` wrapper rather than portalled: the header does
          not clip overflow, so there is nothing to escape from. */}
      <div ref={moreRef} className="relative shrink-0 lg:hidden">
        <button
          onClick={() => setShowMore((v) => !v)}
          className="ck-tap w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition cursor-pointer"
          aria-label="More actions"
          aria-expanded={showMore}
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {showMore && (
          <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 bg-surface py-1.5 shadow-xl z-50">
            {/* Zoom stepper — the only discoverable hint that the canvas
                zooms; the pinch gesture advertises nothing. */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-medium text-gray-500">Zoom</span>
              <div className="flex items-center gap-1">
                <IconBtn onClick={onZoomOut} title="Zoom out">
                  <Minus className="w-4 h-4" />
                </IconBtn>
                <span className="w-10 text-center text-xs font-medium tabular-nums text-gray-600">
                  {zoomPct}%
                </span>
                <IconBtn onClick={onZoomIn} title="Zoom in">
                  <Plus className="w-4 h-4" />
                </IconBtn>
              </div>
            </div>

            <div className="my-1 border-t border-gray-100" />

            <MenuItem
              icon={saving ? Loader2 : Save}
              spinning={saving}
              disabled={saving}
              onClick={() => {
                onSave();
                setShowMore(false);
              }}
            >
              {saving ? "Saving…" : "Save"}
            </MenuItem>

            <MenuItem
              icon={Eye}
              onClick={() => {
                setShowMore(false);
                onPreview();
              }}
            >
              Preview
            </MenuItem>
          </div>
        )}
      </div>

      {/* Share stays on the bar at every width — it is the reason most people
          open this screen, so it never hides behind an overflow menu. */}
      <button
        ref={shareBtnRef}
        onClick={() => setShowShare((v) => !v)}
        className="ck-tap flex shrink-0 items-center gap-1.5 px-3 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition cursor-pointer sm:px-4"
        title="Share design"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden xs:inline">Share</span>
      </button>

      {showShare && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowShare(false)} />
          <div className="relative z-50">
            <ShareModal
              isOpen={showShare}
              onClose={() => setShowShare(false)}
              buttonRef={shareBtnRef}
              canvas={canvas}
              elements={elements}
              name={name}
              onSave={onSave}
              saving={saving}
              dirty={dirty}
              onPresent={onPreview}
            />
          </div>
        </>
      )}
    </header>
  );
}

/** A row in the overflow menu. `spinning` animates the icon for in-flight saves. */
function MenuItem({ icon: Icon, children, onClick, disabled, spinning }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <Icon className={`h-4 w-4 shrink-0 text-gray-500 ${spinning ? "animate-spin" : ""}`} />
      {children}
    </button>
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
