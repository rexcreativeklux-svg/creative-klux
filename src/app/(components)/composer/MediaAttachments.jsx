"use client";

// app/(components)/composer/MediaAttachments.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The composer's attached media, after Metricool's:
//
//   MediaStrip     the thumbnails under the text: an ⋯ menu on each (View,
//                  Edit alt text, Remove), an ALT badge, a spinner while it
//                  uploads, and a "Manage ›" tile once there are two or more
//   ManageFiles    the full-column view "Manage files": numbered in posting
//                  order, drag to reorder, click to select, Select all, Delete,
//                  and "+ Add files" (the same media menu as the toolbar)
//   MediaViewer    the file, full size
//   AltTextDialog  the description screen readers read for an image
//
// Items are { id, type: "image"|"video", url, previewUrl?, name?, alt?, uploading? }.

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Eye, LayoutGrid, Loader2, MoreHorizontal, Trash2, Type, X } from "lucide-react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import FloatingPanel from "./FloatingPanel";

const BRAND = "#003dda";
const srcOf = (item) => item.previewUrl || item.url;

/** The file itself, filling its box — a still frame for a video. */
function Thumb({ item, className = "" }) {
  return item.type === "video" ? (
    <video src={srcOf(item)} className={`bg-black object-cover ${className}`} muted playsInline preload="metadata" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={srcOf(item)} alt={item.alt || ""} className={`object-cover ${className}`} />
  );
}

/** The ⋯ menu on one file: View, Edit alt text (images), Remove. */
function ItemMenu({ item, onView, onAlt, onRemove, disabled, light = false }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!anchorRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const row = (Icon, label, onClick, danger = false) => (
    <button
      key={label}
      type="button"
      onClick={() => {
        setOpen(false);
        onClick();
      }}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );

  return (
    <span ref={anchorRef} className="inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        disabled={disabled}
        aria-label="File options"
        className={`flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed ${
          light ? "bg-white/90 text-gray-800 hover:bg-white" : "bg-gray-900 text-white hover:bg-gray-700"
        }`}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <FloatingPanel
          anchorRef={anchorRef}
          panelRef={panelRef}
          className="w-52 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-xl"
        >
          {row(Eye, item.type === "video" ? "View video" : "View image", onView)}
          {item.type === "image" && row(Type, "Edit alt text", onAlt)}
          <div className="my-1 border-t border-gray-100" />
          {row(Trash2, "Remove", onRemove, true)}
        </FloatingPanel>
      )}
    </span>
  );
}

/** The ALT badge — set alt text reads as filled; clicking it edits. */
function AltBadge({ item, onAlt, disabled }) {
  if (item.type !== "image") return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onAlt();
      }}
      disabled={disabled}
      title={item.alt ? `Alt text: ${item.alt}` : "Add alt text"}
      className={`rounded px-1 py-0.5 text-[9px] font-bold tracking-wide transition-colors ${
        item.alt ? "bg-gray-900 text-white" : "bg-black/55 text-white/85 hover:bg-black/75"
      }`}
    >
      ALT
    </button>
  );
}

/**
 * @param {object} props
 * @param {object[]} props.items
 * @param {(item) => void} props.onView
 * @param {(item) => void} props.onAlt
 * @param {(id: string) => void} props.onRemove
 * @param {() => void} props.onManage
 * @param {boolean} [props.disabled]
 */
export function MediaStrip({ items, onView, onAlt, onRemove, onManage, disabled }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2.5 px-4 pb-3 pt-1">
      {items.map((item) => (
        <div key={item.id} className="relative h-18 w-18 shrink-0">
          <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <Thumb item={item} className="h-full w-full" />
            {item.uploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </span>
            )}
          </div>
          {!item.uploading && (
            <>
              <span className="absolute -right-1.5 -top-1.5">
                <ItemMenu
                  item={item}
                  disabled={disabled}
                  onView={() => onView(item)}
                  onAlt={() => onAlt(item)}
                  onRemove={() => onRemove(item.id)}
                />
              </span>
              <span className="absolute bottom-1 left-1">
                <AltBadge item={item} disabled={disabled} onAlt={() => onAlt(item)} />
              </span>
            </>
          )}
        </div>
      ))}
      {items.length > 1 && (
        <button
          type="button"
          onClick={onManage}
          className="flex h-18 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="flex items-center">
            Manage <ChevronRight className="h-3 w-3" />
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object[]} props.items
 * @param {() => void} props.onBack
 * @param {(from: number, to: number) => void} props.onMove
 * @param {(ids: string[]) => void} props.onRemoveMany
 * @param {React.ReactNode} props.addMenu  The "+ Add files" control.
 */
export function ManageFiles({ items, onBack, onMove, onRemoveMany, onView, onAlt, addMenu, disabled }) {
  const [selected, setSelected] = useState([]);
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  // Only ids still attached count as selected.
  const chosen = selected.filter((id) => items.some((i) => i.id === id));
  const allChosen = items.length > 0 && chosen.length === items.length;
  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the post"
          className="cursor-pointer rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">Manage files</h3>
        <span className="text-xs text-gray-500">
          {items.length} file{items.length === 1 ? "" : "s"}
        </span>
        <div className="ml-auto">{addMenu}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <p className="mb-3 text-xs text-gray-500">
          Drag to change the order they&apos;re posted in. Click to select.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item, index) => {
            const isChosen = chosen.includes(item.id);
            return (
              <div
                key={item.id}
                draggable={!disabled && !item.uploading}
                onDragStart={() => setDragFrom(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(index);
                }}
                onDragLeave={() => setDragOver((o) => (o === index ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom != null && dragFrom !== index) onMove(dragFrom, index);
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onClick={() => toggle(item.id)}
                className={`relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl transition-all ${
                  isChosen ? "ring-3 ring-[#003dda]" : ""
                } ${dragOver === index && dragFrom !== index ? "scale-[1.03] ring-2 ring-blue-300" : ""} ${
                  dragFrom === index ? "opacity-50" : ""
                }`}
              >
                <Thumb item={item} className="h-full w-full" />
                {item.uploading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </span>
                )}
                {/* Its place in the post */}
                <span
                  className={`absolute left-2.5 top-2.5 flex h-5.5 w-5.5 items-center justify-center rounded-full text-[11px] font-bold ${
                    isChosen ? "bg-[#003dda] text-white" : "bg-white/90 text-gray-800"
                  }`}
                >
                  {index + 1}
                </span>
                {!item.uploading && (
                  <>
                    <span className="absolute right-2.5 top-2.5" onClick={(e) => e.stopPropagation()}>
                      <ItemMenu
                        item={item}
                        light
                        disabled={disabled}
                        onView={() => onView(item)}
                        onAlt={() => onAlt(item)}
                        onRemove={() => onRemoveMany([item.id])}
                      />
                    </span>
                    <span className="absolute bottom-2.5 left-2.5">
                      <AltBadge item={item} disabled={disabled} onAlt={() => onAlt(item)} />
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3.5">
        <button
          type="button"
          onClick={() => setSelected(allChosen ? [] : items.map((i) => i.id))}
          disabled={!items.length}
          className="cursor-pointer text-sm font-medium text-[#003dda] hover:underline disabled:cursor-default disabled:opacity-40"
        >
          {allChosen ? "Clear selection" : "Select all"}
        </button>
        <button
          type="button"
          onClick={() => {
            onRemoveMany(chosen);
            setSelected([]);
          }}
          disabled={!chosen.length || disabled}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          Delete{chosen.length ? ` (${chosen.length})` : ""}
        </button>
      </div>
    </div>
  );
}

/** The file full size, over everything. */
export function MediaViewer({ item, onClose }) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [item, onClose]);

  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center bg-black/85 p-6"
      onClick={onClose}
      role="dialog"
      aria-label="View file"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <div onClick={(e) => e.stopPropagation()} className="max-h-full max-w-5xl">
        {item.type === "video" ? (
          <video src={srcOf(item)} controls autoPlay className="max-h-[85vh] max-w-full rounded-lg" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={srcOf(item)} alt={item.alt || ""} className="max-h-[85vh] max-w-full rounded-lg object-contain" />
        )}
      </div>
    </div>
  );
}

/**
 * Alt text for one image.
 *
 * ⚠️ Kept with the draft and shown in the previews, but NOT sent when
 * publishing: the publish API takes an image_url and has no field for alt text.
 */
export function AltTextDialog({ item, onSave, onClose }) {
  const [value, setValue] = useState(item?.alt || "");
  return (
    <ResponsiveModal
      isOpen={!!item}
      onClose={onClose}
      title="Edit alt text"
      icon={Type}
      size="lg"
      zIndex={120}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(value.trim())}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            style={{ background: BRAND }}
          >
            Save
          </button>
        </>
      }
    >
      {item && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="h-36 w-36 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <Thumb item={item} className="h-full w-full" />
          </div>
          <div className="flex-1">
            <textarea
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, 1000))}
              rows={5}
              placeholder="Describe the image for people who can't see it"
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#003dda]"
            />
            <p className="mt-1 flex justify-between text-[11px] text-gray-400">
              <span>Kept with this draft. Publishing doesn&apos;t send it yet.</span>
              <span>{value.length}/1000</span>
            </p>
          </div>
        </div>
      )}
    </ResponsiveModal>
  );
}
