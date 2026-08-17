"use client";

/**
 * ResultActionsMenu — the single, reusable action popover shown for a generated
 * result across the product-studio AI modals (Virtual Model, Product Staging) and
 * Magic Studio. Extracted from the per-modal context menus so every surface uses
 * the exact same look + behavior.
 *
 * Behavior: opens anchored at (x, y) — usually the ⋯ click's clientX/clientY —
 * clamps itself into the viewport, and closes on an outside click (transparent
 * backdrop) or Escape. Each action runs then closes the menu.
 *
 * Each surface opts in to exactly the actions it supports by passing only the
 * relevant callbacks to {@link buildResultActions} (e.g. Magic Studio omits
 * "Change something"/"Other angles"; a video asset omits "Generate video"). The
 * order + icons live here so the menu is identical everywhere.
 *
 * `actions` is a plain array, so a surface with a menu of its own shape can
 * build one instead of calling {@link buildResultActions} — the Copilot cards do
 * (see copilot/_components/copilotActions.js). A `{ separator: true }` entry
 * draws a divider rather than a row, which is what lets a longer menu group
 * itself; the result menus above pass none and are unaffected.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Pencil,
  RefreshCw,
  Video,
  Send,
  Download,
  Copy,
  Bookmark,
  Trash2,
} from "lucide-react";

const MENU_WIDTH = 208; // matches w-52

/**
 * Build the ordered action list for a result menu. Only actions whose callback
 * is provided are included, so callers declare support by presence.
 *
 * @param {object} cb
 * @param {() => void} [cb.onChangeSomething] Focus the prompt to describe a change.
 * @param {() => void} [cb.onOtherAngles]     Regenerate from a different angle.
 * @param {() => void} [cb.onGenerateVideo]   Send this image to the video tool.
 * @param {() => void} [cb.onPublish]         Publish the asset to a platform.
 * @param {() => void} [cb.onDownload]        Download the asset.
 * @param {() => void} [cb.onCopyLink]        Copy the asset's hosted URL.
 * @param {() => void} [cb.onCopy]            Copy the asset's text content.
 * @param {() => void} [cb.onSaveToGallery]   Save the asset to the user's gallery.
 * @param {() => void} [cb.onDelete]          Remove the asset from the results.
 * @returns {Array<{ label: string, icon: object, onClick: () => void, danger?: boolean }>}
 */
export function buildResultActions({
  onChangeSomething,
  onOtherAngles,
  onGenerateVideo,
  onPublish,
  onDownload,
  onCopyLink,
  onCopy,
  onSaveToGallery,
  onDelete,
} = {}) {
  const items = [];
  if (onChangeSomething)
    items.push({
      label: "Change something",
      icon: Pencil,
      onClick: onChangeSomething,
    });
  if (onOtherAngles)
    items.push({
      label: "Other angles",
      icon: RefreshCw,
      onClick: onOtherAngles,
    });
  if (onGenerateVideo)
    items.push({
      label: "Generate video",
      icon: Video,
      onClick: onGenerateVideo,
    });
  if (onPublish)
    items.push({ label: "Publish", icon: Send, onClick: onPublish });
  if (onDownload)
    items.push({ label: "Download", icon: Download, onClick: onDownload });
  if (onCopyLink)
    items.push({ label: "Copy link", icon: Copy, onClick: onCopyLink });
  if (onCopy) items.push({ label: "Copy", icon: Copy, onClick: onCopy });
  if (onSaveToGallery)
    items.push({
      label: "Save to gallery",
      icon: Bookmark,
      onClick: onSaveToGallery,
    });
  if (onDelete)
    items.push({
      label: "Delete",
      icon: Trash2,
      onClick: onDelete,
      danger: true,
    });
  return items;
}

/**
 * @param {object} props
 * @param {number} props.x        Viewport x (usually the ⋯ click's clientX).
 * @param {number} props.y        Viewport y (usually the ⋯ click's clientY).
 * @param {Array}  props.actions  From {@link buildResultActions}.
 * @param {() => void} props.onClose Close the menu (clears the caller's open state).
 */
export default function ResultActionsMenu({ x, y, actions, onClose }) {
  const menuRef = useRef(null);
  // Start at the anchor point, hidden, until measured + clamped into view.
  const [pos, setPos] = useState({ top: y, left: x, ready: false });

  // Clamp into the viewport once the menu's real size is known.
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const margin = 8;
    const w = el.offsetWidth || MENU_WIDTH;
    const h = el.offsetHeight;
    let left = x;
    let top = y;
    if (left + w > window.innerWidth - margin)
      left = window.innerWidth - w - margin;
    if (top + h > window.innerHeight - margin)
      top = window.innerHeight - h - margin;
    setPos({
      top: Math.max(margin, top),
      left: Math.max(margin, left),
      ready: true,
    });
  }, [x, y, actions]);

  // Escape closes (matches the other dropdowns in these modals).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!actions?.length) return null;

  return (
    <>
      {/* Transparent backdrop — a click anywhere outside the menu closes it. */}
      <div className="fixed inset-0 z-215" onClick={onClose} />
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-216 bg-surface rounded-xl shadow-2xl border border-gray-200 w-52 py-1"
        style={{
          top: pos.top,
          left: pos.left,
          visibility: pos.ready ? "visible" : "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((item, index) => {
          if (item.separator)
            return (
              <div
                key={`sep-${index}`}
                role="separator"
                className="my-1 border-t border-gray-200"
              />
            );
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => {
                item.onClick?.();
                onClose?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer ${item.danger ? "text-red-500" : "text-gray-900"}`}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
