"use client";

import React from "react";
import { Copy, Group, Lock, Trash2, Unlock } from "lucide-react";

// Rough on-screen size of the pill, in CSS pixels. Only used to keep it inside
// the artboard — the stage clips, so a pill placed past an edge is a control the
// user cannot reach. Measuring it for real would cost a layout pass per render
// and buy nothing: an over-estimate simply keeps a little more margin.
const PILL_W = 240;
const PILL_H = 44;
const GAP = 10;

/**
 * SelectionOverlay — the chrome for a selection of MORE THAN ONE element.
 *
 * Rendered inside the scaled stage in canvas coordinates: a dashed box hugging
 * the union of the selected elements, and one action pill for the selection as
 * a whole. The pill is counter-scaled by 1/zoom so it stays a constant size on
 * screen, the same way EditorElementMenu does for a single element.
 *
 * The per-element pills are suppressed while this is up (see EditorElement's
 * `multiSelected`), so the selection has exactly one set of controls. A single
 * selected GROUP is not this: it is one element, and it keeps its own pill —
 * with an Ungroup button added.
 */
export default function SelectionOverlay({
  bounds,
  count,
  zoom = 1,
  canvasWidth = 0,
  canvasHeight = 0,
  anyLocked = false,
  allLocked = false,
  onGroup,
  onDuplicate,
  onRemove,
  onToggleLock,
}) {
  if (!bounds || !count) return null;

  // Handles must not start a drag on whatever sits under the pill, nor bubble a
  // fresh selection that would replace the one they act on.
  const stop = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const act = (fn) => (e) => {
    stop(e);
    fn?.();
  };

  // ── Placement ────────────────────────────────────────────────────────
  // Canvas units, because that is the space this is rendered in: the pill's
  // pixel sizes are divided by the zoom to get there.
  const pillH = PILL_H / zoom;
  const pillW = PILL_W / zoom;
  const gap = GAP / zoom;

  // Below the selection by default. Above it when there is no room — a
  // selection that reaches the bottom of the page is exactly the case where the
  // pill would otherwise be clipped away by the stage, and "select everything"
  // produces it every time. Failing both, it sits just inside the bottom edge.
  let top = bounds.y + bounds.height + gap;
  if (canvasHeight && top + pillH > canvasHeight) {
    const above = bounds.y - gap - pillH;
    top = above >= 0 ? above : Math.max(0, canvasHeight - pillH - gap);
  }

  const centerX = bounds.x + bounds.width / 2;
  const left = canvasWidth
    ? Math.min(Math.max(centerX, pillW / 2), Math.max(pillW / 2, canvasWidth - pillW / 2))
    : centerX;

  const outline = 2 / zoom;

  return (
    <>
      {/* Union box. Pointer-transparent: clicks belong to the elements under
          it, so dragging any member still moves the whole selection. */}
      <div
        style={{
          position: "absolute",
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
          border: `${outline}px dashed #6366f1`,
          borderRadius: 2 / zoom,
          pointerEvents: "none",
          zIndex: 39,
        }}
      />

      <div
        onMouseDown={stop}
        style={{
          position: "absolute",
          left,
          top,
          transform: `translateX(-50%) scale(${1 / (zoom || 1)})`,
          transformOrigin: "top center",
          zIndex: 41,
        }}
      >
        <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-surface px-1.5 py-1 shadow-lg">
          <span className="mr-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600 whitespace-nowrap">
            {count} selected
          </span>

          {/* A selection holding a locked element can't be folded into a group —
              the group would move members the lock is there to hold still. */}
          <Btn title="Group (Ctrl+G)" onClick={act(onGroup)} disabled={anyLocked}>
            <Group className="h-4 w-4" />
          </Btn>

          <Btn title="Duplicate (Ctrl+D)" onClick={act(onDuplicate)} disabled={allLocked}>
            <Copy className="h-4 w-4" />
          </Btn>

          <Btn title={anyLocked ? "Unlock all" : "Lock all"} onClick={act(onToggleLock)}>
            {anyLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Btn>

          <Btn title="Delete" danger onClick={act(onRemove)} disabled={allLocked}>
            <Trash2 className="h-4 w-4" />
          </Btn>
        </div>
      </div>
    </>
  );
}

function Btn({ children, onClick, title, danger, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "text-gray-500 hover:bg-red-50 hover:text-red-600"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}
