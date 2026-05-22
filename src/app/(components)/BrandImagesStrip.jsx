// components/BrandImagesStrip.jsx
//
// Reusable strip showing the first N images from the user's brand library.
// Supports MULTI-SELECT with a 5-image cap.
//
// Interaction model:
//   • Click image (or checkbox) → toggle into local selection set
//   • Bulk action bar appears when ≥ 1 image is selected
//       "Use X"  → calls onSelect for each selected image, clears selection
//       "Crop X" → calls onCrop for each selected image, clears selection
//   • Hover still shows quick "Use" / "Crop" single-image buttons
//   • When 5 images are already selected externally (selectedUrls), further
//     selection is blocked and a pill shows "5 / 5 selected"
//
// Props
// ──────
// onSelect(imageObj[])   called with array of imageObjs when "Use" is confirmed
// onCrop(imageObj[])     called with array of imageObjs when "Crop" is confirmed
// selectedUrls           string[]  already-selected originalUrls (for ring + cap)
// maxImages              number    how many library images to show  (default 8)
// maxSelect              number    hard cap on total selected images (default 5)
// className              string    extra wrapper classes

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2, ImageIcon, Crop, CheckCircle2,
  MousePointerClick, X, Images,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const CAP = 5;

export default function BrandImagesStrip({
  onSelect,
  onCrop,
  selectedUrls = [],
  maxImages = 8,
  maxSelect = CAP,
  className = "",
  images: imagesProp,        // optional: if provided, use this list instead of myImages
  label,                     // optional: header label override (default "Your brand images")
}) {
  const { fetchMyImages, myImages = [], myImagesLoading, token } = useAuth();

  // local selection state (URLs of images checked in THIS strip)
  const [localSelected, setLocalSelected] = useState(new Set());

  // Only fetch user's library when we're falling back to it.
  useEffect(() => {
    if (token && imagesProp === undefined) fetchMyImages();
  }, [token, fetchMyImages, imagesProp]);

  // Trim local selections if external count grows past the cap (e.g., MediaPicker added items).
  useEffect(() => {
    setLocalSelected((prev) => {
      const allowed = Math.max(0, maxSelect - selectedUrls.length);
      if (prev.size <= allowed) return prev;
      return new Set(Array.from(prev).slice(0, allowed));
    });
  }, [selectedUrls.length, maxSelect]);

  // Normalize an incoming entry — accepts either a URL string or an object { src/url/image_url, alt, id }.
  const normalize = (entry, i) => {
    if (entry == null) return null;
    if (typeof entry === "string") {
      return { id: `img-${i}`, src: entry, alt: `Image ${i + 1}`, filename: null };
    }
    const src = entry.src || entry.url || entry.image_url;
    if (!src) return null;
    return {
      id: entry.id ?? `img-${i}`,
      src,
      alt: entry.alt ?? entry.filename ?? `Image ${i + 1}`,
      filename: entry.filename ?? null,
    };
  };

  const source = imagesProp !== undefined ? imagesProp : myImages;
  const seenSrc = new Set();
  const images = (Array.isArray(source) ? source : [])
    .map(normalize)
    .filter(Boolean)
    .filter((img) => {
      // Dedupe by src — backend sometimes returns duplicates.
      if (seenSrc.has(img.src)) return false;
      seenSrc.add(img.src);
      return true;
    })
    .slice(0, maxImages);

  // How many slots are still open? (cap - already used externally)
  const externalCount = selectedUrls.length;
  const remaining = Math.max(0, maxSelect - externalCount - localSelected.size);
  const atCap = remaining === 0;

  // ── toggle a single image in/out of localSelected ──────────────────────
  const toggleSelect = useCallback((url) => {
    setLocalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        if (next.size + externalCount >= maxSelect) return prev; // cap
        next.add(url);
      }
      return next;
    });
  }, [externalCount, maxSelect]);

  // ── build imageObj from raw library item ──────────────────────────────
  const toImageObj = (img, i) => ({
    id:         img.id,
    src:        img.src,
    large:      img.src,
    previewUrl: img.src,
    alt:        img.alt || img.filename || `Brand image ${i + 1}`,
  });

  // ── bulk actions ──────────────────────────────────────────────────────
  const getSelectedObjs = () =>
    images
      .filter((img) => localSelected.has(img.src))
      .map((img, i) => toImageObj(img, i));

  const handleBulkUse = () => {
    const objs = getSelectedObjs();
    if (objs.length) onSelect?.(objs);
    setLocalSelected(new Set());
  };

  const handleBulkCrop = () => {
    const objs = getSelectedObjs();
    if (objs.length) onCrop?.(objs);
    setLocalSelected(new Set());
  };

  // ── single-image quick actions (hover buttons) ────────────────────────
  const handleQuickUse = (e, imageObj) => {
    e.stopPropagation();
    onSelect?.([imageObj]);
  };

  const handleQuickCrop = (e, imageObj) => {
    e.stopPropagation();
    onCrop?.([imageObj]);
  };

  // ─────────────────────────────────────────────────────────────────────
  if (!token) return null;

  // Only show the "loading user library" state when we're actually using the user library.
  if (imagesProp === undefined && myImagesLoading) {
    return (
      <div className={`flex items-center gap-2 py-3 text-xs text-gray-400 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading your images…
      </div>
    );
  }

  if (images.length === 0) return null;

  const localCount  = localSelected.size;
  const totalPicked = externalCount + localCount;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>

      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs font-medium text-gray-500">{label ?? "Your brand images"}</span>

        {/* cap pill */}
        <span
          className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
            atCap
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {totalPicked} / {maxSelect} selected
        </span>

        {(() => {
          const total = imagesProp !== undefined
            ? (Array.isArray(imagesProp) ? imagesProp.length : 0)
            : myImages.length;
          if (total > maxImages) {
            return (
              <span className="text-[10px] text-gray-400">
                Showing {maxImages} of {total}
              </span>
            );
          }
          return null;
        })()}
      </div>

      {/* ── Bulk action bar (visible when ≥1 locally selected) ─────────── */}
      {localCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-xs font-semibold text-blue-700 flex-1">
            {localCount} image{localCount > 1 ? "s" : ""} selected
          </span>

          {/* Clear */}
          <button
            onClick={() => setLocalSelected(new Set())}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition cursor-pointer"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Crop selected */}
          <button
            onClick={handleBulkCrop}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-700 transition cursor-pointer"
          >
            <Crop className="w-3 h-3" />
            Crop {localCount > 1 ? `${localCount}` : ""}
          </button>

          {/* Use selected */}
          <button
            onClick={handleBulkUse}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
          >
            <MousePointerClick className="w-3 h-3" />
            Use {localCount > 1 ? `${localCount}` : ""}
          </button>
        </div>
      )}

      {/* ── Cap warning ─────────────────────────────────────────────────── */}
      {atCap && localCount === 0 && (
        <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          Maximum of {maxSelect} images reached. Remove an image to add more.
        </p>
      )}

      {/* ── Image grid ──────────────────────────────────────────────────── */}
      <div className="columns-4 gap-2 space-y-2">
        {images.map((img, i) => {
          const originalUrl  = img.src;
          const isExtSelected = selectedUrls.includes(originalUrl);
          const isLocalSel   = localSelected.has(originalUrl);
          const isAnySelected = isExtSelected || isLocalSel;
          const isDisabled   = atCap && !isLocalSel && !isExtSelected;
          const imageObj     = toImageObj(img, i);

          return (
            <div
              key={img.id ?? i}
              role="checkbox"
              aria-checked={isAnySelected}
              aria-disabled={isDisabled}
              tabIndex={0}
              onClick={() => !isExtSelected && toggleSelect(originalUrl)}
              onKeyDown={(e) => e.key === " " && !isExtSelected && toggleSelect(originalUrl)}
              className={`
                relative group break-inside-avoid rounded-xl overflow-hidden
                border shadow-sm select-none transition-all duration-150
                ${isDisabled
                  ? "opacity-40 cursor-not-allowed"
                  : "cursor-pointer"
                }
                ${isLocalSel
                  ? "border-blue-500 ring-2 ring-blue-400 ring-offset-1"
                  : isExtSelected
                    ? "border-blue-400 ring-2 ring-blue-300 ring-offset-1"
                    : "border-gray-100 hover:border-blue-300"
                }
              `}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <img
                src={originalUrl}
                alt={imageObj.alt}
                className={`w-full h-auto block object-cover transition-transform duration-300 ${
                  !isDisabled ? "group-hover:scale-105" : ""
                }`}
                loading="lazy"
                onError={(e) => (e.currentTarget.parentElement.style.display = "none")}
              />

              {/* ── Checkbox indicator (top-left) ── */}
              <div
                className={`
                  absolute top-1.5 left-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center
                  transition-all duration-150 shadow-sm
                  ${isLocalSel
                    ? "bg-blue-500 border-blue-500 opacity-100"
                    : isExtSelected
                      ? "bg-blue-400 border-blue-400 opacity-100"
                      : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
                  }
                `}
              >
                {isAnySelected && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>

              {/* ── Hover overlay with quick single-image actions ── */}
              {!isDisabled && (
                <div className="
                  absolute inset-0 bg-black/0 group-hover:bg-black/45
                  transition-all duration-200 rounded-xl
                  flex flex-col px-5 justify-end pb-5 gap-1
                  pointer-events-none group-hover:pointer-events-auto
                ">
                    <div className="flex justify-between">
                  {/* Quick Use */}
                  <button
                    onClick={(e) => handleQuickUse(e, imageObj)}
                    className="
                      flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold
                      bg-white text-gray-800 hover:bg-blue-600 hover:text-white
                      transition-all duration-150 cursor-pointer shadow
                      opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
                    "
                    style={{ transitionDelay: "20ms" }}
                    title="Use this image only"
                  >
                    <MousePointerClick className="w-2.5 h-2.5" /> Use
                  </button>

                  {/* Quick Crop */}
                  <button
                    onClick={(e) => handleQuickCrop(e, imageObj)}
                    className="
                      flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold
                      bg-white/20 text-white border border-white/40 hover:bg-white hover:text-gray-800
                      transition-all duration-150 cursor-pointer shadow
                      opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
                    "
                    style={{ transitionDelay: "45ms" }}
                    title="Crop this image only"
                  >
                    <Crop className="w-2.5 h-2.5" /> Crop
                  </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Helper hint ─────────────────────────────────────────────────── */}
      {localCount === 0 && !atCap && (
        <p className="text-[10px] text-gray-400 text-center pt-0.5">
          Click images to select multiple · hover for quick actions
        </p>
      )}
    </div>
  );
}