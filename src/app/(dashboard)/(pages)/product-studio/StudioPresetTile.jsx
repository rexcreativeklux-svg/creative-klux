"use client";

// One tile on the Product Studio landing page, drawn from its preset
// (studioPresets.js) — the same background, product slot, shadow and text the
// editor will build, over the template's sample product. So the tile is a
// small copy of what opens.

import { useEffect } from "react";
import { FilterTile } from "./PresetStrip";
import { PRESET_PORTRAIT, px } from "./presetSections";
import { PRESET_FONTS, SAMPLES } from "./studioPresets";

/** Tile height in px; width follows the template's aspect. */
const TILE_H = 128;

const CHECKER = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0,0 6px,6px -6px,-6px 0",
};

/** The photo the Original Image tile shows — a product shot on its own set. */
const ORIGINAL_PHOTO = px(9244881, 400);

/** Load the designs' Google Fonts once for the whole page. */
export function useStudioPresetFonts() {
  useEffect(() => {
    const id = "ck-studio-preset-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${PRESET_FONTS.map(
      (f) => `family=${f.replace(/ /g, "+")}:wght@400;500;700`,
    ).join("&")}&display=swap`;
    document.head.appendChild(link);
  }, []);
}

function backgroundStyle(bg, thumb) {
  if (!bg || bg.type === "none") return CHECKER;
  if (bg.type === "color") return { background: bg.value };
  if (bg.type === "image") {
    return {
      backgroundImage: `url("${thumb || bg.src}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { background: "#f3f4f6" };
}

/** A template rendered small: backdrop, product in its slot, shadow, text. */
function TemplatePreview({ preset, height, photo }) {
  const { w: cw, h: ch } = preset.canvas;
  const width = Math.round((height * cw) / ch);
  const slot = preset.slot;
  const sh = preset.shadow;
  const shadow = sh
    ? sh.mode === "floor"
      ? "drop-shadow(0 3px 3px rgba(0,0,0,0.28))"
      : `drop-shadow(${(sh.x || 0) * width}px ${(sh.y || 0) * width}px ${Math.max(1, (sh.blur || 8) * 0.3)}px rgba(0,0,0,${(sh.opacity ?? 50) / 100}))`
    : undefined;

  return (
    <div
      className={`relative overflow-hidden ${preset.round ? "rounded-full" : ""}`}
      style={{ width, height, ...backgroundStyle(preset.bg, preset.thumb) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo?.cutout || preset.sample}
        alt=""
        loading="lazy"
        draggable={false}
        className="absolute object-contain"
        style={{
          width: slot.s * width,
          height: slot.s * height,
          left: slot.cx * width - (slot.s * width) / 2,
          top: slot.cy * height - (slot.s * height) / 2,
          filter: shadow,
        }}
      />
      {(preset.texts || []).map((t, i) => (
        <div
          key={i}
          className="absolute leading-tight"
          style={{
            left: t.cx * width,
            top: t.cy * height,
            width: (t.w || 0.86) * width,
            transform: "translate(-50%, -50%)",
            fontSize: Math.max(4, t.size * height),
            fontFamily: t.font ? `'${t.font}', sans-serif` : undefined,
            fontWeight: t.weight,
            color: t.color,
            textAlign: t.align || "center",
            letterSpacing: t.spacing ? `${(t.spacing * height) / 1080}px` : undefined,
            ...(t.bg
              ? { background: t.bg, borderRadius: 999, padding: "1px 4px" }
              : null),
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** A photo-first tile: the look over a sample product (or photo). */
function PhotoPresetPreview({ preset, height, photo }) {
  if (preset.preview) {
    // Photo Editing Classics — the treatment shown on a portrait.
    const kind = { splash: "splash", motion: "motion" }[preset.preview];
    const filter = {
      blur: "blur(2px)",
      lowkey: "grayscale(1) brightness(0.5) contrast(1.4)",
      highkey: "grayscale(1) brightness(1.35) contrast(0.8)",
      sepia: "sepia(0.85) contrast(1.05)",
      bw: "grayscale(1) contrast(1.1)",
    }[preset.preview];
    return (
      // h-32 = TILE_H.
      <FilterTile
        img={photo?.original || PRESET_PORTRAIT}
        filter={filter}
        kind={kind}
        className="h-32 w-32"
      />
    );
  }
  const original = preset.removeBg === false;
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{ width: height, height, ...(original ? null : backgroundStyle(preset.bg)) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          original
            ? photo?.original || ORIGINAL_PHOTO
            : photo?.cutout || SAMPLES.sneaker
        }
        alt=""
        loading="lazy"
        draggable={false}
        className={original ? "h-full w-full object-cover" : "w-[86%] object-contain"}
      />
    </div>
  );
}

/** A size tile: the target's aspect as a white card, with the platform's mark. */
function SizePreview({ preset, height }) {
  const ratio = preset.custom ? 1 : preset.w / preset.h;
  const card =
    ratio >= 1
      ? { width: height * 0.76, height: (height * 0.76) / ratio }
      : { width: height * 0.76 * ratio, height: height * 0.76 };
  return (
    <div className="flex items-center justify-center bg-gray-100" style={{ width: height, height }}>
      <div
        className="flex items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-black/5"
        style={card}
      >
        {preset.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preset.icon} alt="" className="h-6 w-6 rounded object-contain" />
        ) : (
          <span className="text-sm font-semibold text-gray-400">
            {preset.custom ? "+" : preset.label.slice(0, 1)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.preset  an entry from STUDIO_SECTIONS (with `mode`)
 * @param {boolean} [props.showLabel]
 * @param {{original: string, cutout: string}} [props.photo] the user's own
 *   photo and its cutout — "Pick a style" previews every tile with it in place
 *   of the sample product
 * @param {() => void} props.onClick
 */
export default function StudioPresetTile({ preset, showLabel, photo, onClick }) {
  const height = TILE_H;
  const preview =
    preset.mode === "template" ? (
      <TemplatePreview preset={preset} height={height} photo={photo} />
    ) : preset.mode === "size" ? (
      <SizePreview preset={preset} height={height} />
    ) : (
      <PhotoPresetPreview preset={preset} height={height} photo={photo} />
    );

  return (
    <button
      type="button"
      onClick={onClick}
      title={preset.label}
      className="group flex shrink-0 flex-col gap-2 text-left cursor-pointer"
    >
      <div
        className={`overflow-hidden border border-gray-200 transition-all group-hover:border-blue-400 group-hover:shadow-md ${
          preset.round ? "rounded-full" : "rounded-xl"
        }`}
      >
        {preview}
      </div>
      {showLabel && (
        <span className="max-w-32 truncate text-xs text-gray-600 sm:text-sm">
          {preset.label}
        </span>
      )}
    </button>
  );
}
