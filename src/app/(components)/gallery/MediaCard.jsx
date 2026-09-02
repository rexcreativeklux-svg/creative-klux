"use client";

// components/gallery/MediaCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// One card that renders any gallery item by its media type — image, video,
// audio (via the shared AudioCard player) or document — with an optional
// selection affordance and a unified 3-dot actions menu (download / copy link /
// delete). Used by the gallery page (view/download/delete) and the
// MediaPickerModal library (selectable). Keeping every type in one component is
// what lets both surfaces look identical without duplicating markup.

import { useEffect, useRef, useState } from "react";
import {
  Download,
  Link2,
  Trash2,
  MoreVertical,
  Check,
  FileText,
  ImageOff,
} from "lucide-react";
import AudioCard from "./AudioCard";
import { classifyMediaType } from "./mediaTypes";

// Pull a short extension badge out of a filename/url (e.g. "PDF").
function extBadge(item) {
  const name = (item?.filename || item?.alt || item?.src || "").toLowerCase();
  const ext = name.split("?")[0].split("#")[0].split(".").pop();
  return ext && ext.length <= 5 && ext !== name ? ext.toUpperCase() : "FILE";
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors cursor-pointer ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" /> {label}
    </button>
  );
}

/**
 * @param {object} props
 * @param {{id: any, type?: string, src: string, alt?: string, filename?: string}} props.item
 * @param {number} [props.index]          Position (audio fallback title).
 * @param {boolean} [props.selectable]    Show the select affordance.
 * @param {boolean} [props.selected]      Whether this item is selected.
 * @param {(item: object) => void} [props.onToggleSelect]
 * @param {(item: object) => void} [props.onDownload]
 * @param {(item: object) => void} [props.onCopyLink]
 * @param {(item: object) => void} [props.onDelete]
 * @param {{icon: React.ComponentType<{className?: string}>, label: string, onClick: (item: object) => void, danger?: boolean}[]} [props.extraActions]
 *   Extra menu items rendered above the standard download/copy/delete set
 *   (e.g. "Save to gallery" for external search results).
 */
export default function MediaCard({
  item,
  index = 0,
  selectable = false,
  selected = false,
  onToggleSelect,
  onDownload,
  onCopyLink,
  onDelete,
  extraActions = [],
}) {
  const type = classifyMediaType(item);
  const [menuOpen, setMenuOpen] = useState(false);
  // Set when the image 404s or is CORS-blocked — see the placeholder below.
  const [failed, setFailed] = useState(false);
  const menuRef = useRef(null);

  // Close the menu on any outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const hasMenu = !!(onDownload || onCopyLink || onDelete || extraActions.length);
  const toggleSelect = (e) => {
    e?.stopPropagation?.();
    onToggleSelect?.(item);
  };

  // Image & document cards select on whole-card click; audio & video keep their
  // controls clickable, so those only toggle via the corner checkbox.
  const clickToSelect = selectable && (type === "image" || type === "document");
  const onCardClick = clickToSelect
    ? toggleSelect
    : !selectable && type === "document"
      ? () => window.open(item.src, "_blank", "noopener,noreferrer")
      : undefined;

  // ── Shared overlay controls (rendered on top of every media body) ──
  const selectControl = selectable && (
    <button
      onClick={toggleSelect}
      aria-label={selected ? "Deselect" : "Select"}
      className={`absolute top-2 left-2 z-20 w-6 h-6 rounded-full flex items-center justify-center shadow transition-all cursor-pointer ${
        selected
          ? "bg-blue-600 text-white"
          : "bg-white/85 text-transparent border border-white/70 opacity-0 group-hover:opacity-100"
      }`}
    >
      <Check className="w-4 h-4" />
    </button>
  );

  const menuControl = hasMenu && (
    <div className="absolute top-2 right-2 z-50" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((o) => !o);
        }}
        aria-label="Actions"
        className="w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center shadow transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {menuOpen && (
        <div
          className="absolute top-9 right-0 bg-surface rounded-xl shadow-2xl border border-gray-100 py-1.5 z-30 min-w-40"
          onClick={(e) => e.stopPropagation()}
        >
          {extraActions.map((a, i) => (
            <MenuItem
              key={i}
              icon={a.icon}
              label={a.label}
              danger={a.danger}
              onClick={() => {
                a.onClick(item);
                setMenuOpen(false);
              }}
            />
          ))}
          {onDownload && (
            <MenuItem
              icon={Download}
              label="Download"
              onClick={() => {
                onDownload(item);
                setMenuOpen(false);
              }}
            />
          )}
          {onCopyLink && (
            <MenuItem
              icon={Link2}
              label="Copy link"
              onClick={() => {
                onCopyLink(item);
                setMenuOpen(false);
              }}
            />
          )}
          {onDelete && (
            <MenuItem
              icon={Trash2}
              label="Delete"
              danger
              onClick={() => {
                onDelete(item);
                setMenuOpen(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );

  const selectionRing = selected && (
    <div className="absolute inset-0 ring-2 ring-blue-600 ring-inset rounded-2xl pointer-events-none z-10" />
  );

  // ── Audio → delegate playback to the shared AudioCard, wrap with controls ──
  if (type === "audio") {
    return (
      <div className="relative group">
        <div className={selected ? "rounded-2xl ring-2 ring-blue-600" : ""}>
          <AudioCard
            asset={{ ...item, title: item.filename || item.alt }}
            index={index}
          />
        </div>
        {selectControl}
        {menuControl}
      </div>
    );
  }

  // ── Video ──
  if (type === "video") {
    return (
      <div className="relative group rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="relative aspect-video bg-black">
          <video
            src={item.src}
            controls
            controlsList="nodownload"
            preload="metadata"
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
        {selectionRing}
        {selectControl}
        {menuControl}
      </div>
    );
  }

  // ── Document ──
  if (type === "document") {
    return (
      <div
        onClick={onCardClick}
        className={`relative group rounded-2xl overflow-hidden border border-gray-200 shadow-sm ${
          onCardClick ? "cursor-pointer" : ""
        }`}
      >
        <div className="aspect-square bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
          <FileText className="w-10 h-10 text-blue-500 mb-2 shrink-0" />
          <p className="text-xs font-medium text-gray-700 truncate max-w-full w-full px-1">
            {item.filename || item.alt || "Document"}
          </p>
          <span className="mt-1 text-[10px] font-bold tracking-wider text-gray-400">
            {extBadge(item)}
          </span>
        </div>
        {selectionRing}
        {selectControl}
        {menuControl}
      </div>
    );
  }

  // ── Image (default) ──
  return (
    <div
      onClick={onCardClick}
      className={`relative group rounded-2xl border border-gray-100 shadow-sm bg-gray-100 ${
        onCardClick ? "cursor-pointer" : ""
      }`}
    >
      {/* A dead src used to just get `opacity: 0.3`, which left the <img> at its
          broken-image intrinsic size — a few pixels tall. In the masonry that
          reads as a blank column, i.e. an upload that looks like it was never
          fetched. A square placeholder keeps the tile the size of a real photo,
          keeps it selectable, and says plainly that the file didn't load. */}
      {failed ? (
        <div className="rounded-2xl w-full aspect-square flex flex-col items-center justify-center gap-1.5 text-gray-400">
          <ImageOff className="w-6 h-6 shrink-0" />
          <span className="text-[10px] px-2 text-center leading-tight line-clamp-2">
            {item.filename || item.alt || "Image unavailable"}
          </span>
        </div>
      ) : (
        <img
          src={item.src}
          alt={item.alt || "Image"}
          loading="lazy"
          className="rounded-2xl w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setFailed(true)}
        />
      )}
      {selectionRing}
      {selectControl}
      {menuControl}
    </div>
  );
}
