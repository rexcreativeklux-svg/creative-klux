// components/BrandImagesStrip.jsx
//
// Reusable strip showing the first N images from the user's brand library (or
// a list passed in, e.g. the images of an imported site), with a 5-image cap.
//
// Interaction model — SELECTING IS USING:
//   • Click an image → it's added to the creative straight away (onSelect).
//   • Click a selected image → it's taken out again (onDeselect).
//   • Hover → "Crop" crops that one image first and adds the crop (onCrop).
//   There is one count — "N / 5 selected" — so it always says how many images
//   the creative will use. (It used to keep a second, local selection that
//   only counted once "Use" was pressed, and the two numbers confused people.)
//
// Props
// ──────
// onSelect(imageObj[])   an image was clicked — add it
// onDeselect(url)        a selected image was clicked — remove it
// onCrop(imageObj[])     "Crop" on an image
// selectedUrls           string[]  the selected images' original URLs
// maxImages              number    how many images to show (default 8)
// maxSelect              number    hard cap on selected images (default 5)
// className              string    extra wrapper classes

import React, { useEffect } from "react";
import { Loader2, ImageIcon, Crop, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const CAP = 5;

export default function BrandImagesStrip({
  onSelect,
  onDeselect,
  onCrop,
  selectedUrls = [],
  maxImages = 8,
  maxSelect = CAP,
  className = "",
  images: imagesProp,        // optional: if provided, use this list instead of myImages
  label,                     // optional: header label override (default "Your brand images")
}) {
  const { fetchMyImages, myImages = [], myImagesLoading, token } = useAuth();

  // Only fetch user's library when we're falling back to it.
  useEffect(() => {
    if (token && imagesProp === undefined) fetchMyImages();
  }, [token, fetchMyImages, imagesProp]);

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

  const picked = selectedUrls.length;
  const atCap = picked >= maxSelect;

  const toImageObj = (img, i) => ({
    id:         img.id,
    src:        img.src,
    large:      img.src,
    previewUrl: img.src,
    alt:        img.alt || img.filename || `Brand image ${i + 1}`,
  });

  // Click: add it, or take it back out.
  const toggle = (imageObj, isSelected) => {
    if (isSelected) onDeselect?.(imageObj.src);
    else if (!atCap) onSelect?.([imageObj]);
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

  return (
    <div className={`flex flex-col gap-2 ${className}`}>

      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs font-medium text-gray-500">{label ?? "Your brand images"}</span>

        {/* The one count: how many images the creative will use */}
        <span
          className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
            atCap
              ? "bg-amber-100 text-amber-700"
              : picked > 0
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-100 text-gray-400"
          }`}
        >
          {picked} / {maxSelect} selected
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

      {/* ── Cap warning ─────────────────────────────────────────────────── */}
      {atCap && (
        <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          Maximum of {maxSelect} images reached. Click a selected image to remove it.
        </p>
      )}

      {/* ── Image grid ──────────────────────────────────────────────────── */}
      <div className="columns-4 gap-2 space-y-2">
        {images.map((img, i) => {
          const originalUrl = img.src;
          const isSelected  = selectedUrls.includes(originalUrl);
          // Without onDeselect a selected image can't be clicked off.
          const locked      = isSelected && !onDeselect;
          const isDisabled  = atCap && !isSelected;
          const imageObj    = toImageObj(img, i);

          return (
            <div
              key={img.id ?? i}
              role="checkbox"
              aria-checked={isSelected}
              aria-disabled={isDisabled || locked}
              aria-label={imageObj.alt}
              tabIndex={0}
              onClick={() => !isDisabled && !locked && toggle(imageObj, isSelected)}
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && !isDisabled && !locked) {
                  e.preventDefault();
                  toggle(imageObj, isSelected);
                }
              }}
              title={isSelected ? (locked ? "Selected" : "Click to remove") : isDisabled ? "Maximum reached" : "Click to use"}
              className={`
                relative group break-inside-avoid rounded-xl overflow-hidden
                border shadow-sm select-none transition-all duration-150
                ${isDisabled ? "opacity-40 cursor-not-allowed" : locked ? "cursor-default" : "cursor-pointer"}
                ${isSelected
                  ? "border-blue-500 ring-2 ring-blue-400 ring-offset-1"
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
                  ${isSelected
                    ? "bg-blue-500 border-blue-500 opacity-100"
                    : "bg-surface/80 border-gray-300 opacity-0 group-hover:opacity-100"
                  }
                `}
              >
                {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>

              {/* ── Hover: crop this image ── */}
              {!isDisabled && onCrop && (
                <div className="
                  absolute inset-0 bg-black/0 group-hover:bg-black/35
                  transition-all duration-200 rounded-xl
                  flex items-end justify-end p-3
                  pointer-events-none group-hover:pointer-events-auto
                ">
                  <button
                    type="button"
                    onClick={(e) => handleQuickCrop(e, imageObj)}
                    className="
                      flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold
                      bg-surface/20 text-white border border-white/40 hover:bg-surface hover:text-gray-800
                      transition-all duration-150 cursor-pointer shadow
                      opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
                    "
                    title="Crop this image first"
                  >
                    <Crop className="w-2.5 h-2.5" /> Crop
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Helper hint ─────────────────────────────────────────────────── */}
      {!atCap && (
        <p className="text-[10px] text-gray-400 text-center pt-0.5">
          Click an image to use it · click again to remove · hover to crop
        </p>
      )}
    </div>
  );
}
