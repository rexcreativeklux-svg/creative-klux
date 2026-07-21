/**
 * Image adjustments + filters for the design editor's image elements — the
 * "Edit image" model, mirrored from the standalone photo editor
 * (edit_a_photo/_components/editorShared.jsx + PhotoEditor.jsx) so the two
 * features behave the same.
 *
 * Everything resolves to a single CSS `filter` string via buildImageFilter().
 * That string is applied both to the on-canvas <img> (CSS `filter`) and to the
 * PNG export (`ctx.filter`) — the same filter functions work in both, so the
 * download matches the stage.
 *
 * Stored on an image element as:
 *   el.adjust    = { brightness, contrast, saturation, warmth, hue, blur }
 *   el.filter    = <filter id>            (a FILTERS preset)
 *   el.imgShadow = "none" | "glow" | "drop"
 */

// Filter presets — CSS filter strings (mirrors the photo editor's FILTERS).
export const IMAGE_FILTERS = [
  { id: "none", label: "None", css: "" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.45) brightness(0.92)" },
  { id: "fade", label: "Fade", css: "contrast(0.85) brightness(1.12) saturate(0.82) sepia(0.12)" },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.1)" },
  { id: "process", label: "Process", css: "contrast(1.2) saturate(1.55) hue-rotate(-12deg)" },
  { id: "tonal", label: "Tonal", css: "grayscale(1) contrast(1.22) brightness(1.05)" },
  { id: "chrome", label: "Chrome", css: "saturate(1.5) contrast(1.18) brightness(1.05)" },
  { id: "sepia", label: "Sepia", css: "sepia(0.78) contrast(1.05) brightness(1.02)" },
];

// Adjust sliders — CSS-expressible so preview and export always match. Values
// are on a −100…100 scale (blur is 0…40 px), converted to CSS in buildImageFilter.
export const IMAGE_ADJUSTMENTS = [
  { key: "brightness", label: "Brightness", min: -100, max: 100, def: 0 },
  { key: "contrast", label: "Contrast", min: -100, max: 100, def: 0 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, def: 0 },
  { key: "warmth", label: "Warmth", min: -100, max: 100, def: 0 },
  { key: "hue", label: "Hue", min: -180, max: 180, def: 0 },
  { key: "blur", label: "Blur", min: 0, max: 40, def: 0 },
];

// Drop-shadow presets (Canva's image "Shadows" row).
export const IMAGE_SHADOWS = [
  { id: "none", label: "None" },
  { id: "glow", label: "Glow" },
  { id: "drop", label: "Drop" },
];

export function filterCssById(id) {
  const f = IMAGE_FILTERS.find((x) => x.id === id);
  return f ? f.css : "";
}

const r3 = (n) => Math.round(n * 1000) / 1000;

/**
 * buildImageFilter(el) → a CSS filter string for the element's adjust/filter/
 * shadow, usable as both DOM `filter` and canvas `ctx.filter`. Returns "" when
 * nothing is set.
 */
export function buildImageFilter(el) {
  const a = el?.adjust || {};
  const parts = [];

  const preset = filterCssById(el?.filter);
  if (preset) parts.push(preset);

  if (a.brightness) parts.push(`brightness(${r3(1 + a.brightness / 100)})`);
  if (a.contrast) parts.push(`contrast(${r3(1 + a.contrast / 100)})`);
  if (a.saturation) parts.push(`saturate(${r3(1 + a.saturation / 100)})`);
  if (a.warmth) {
    // Approximate warmth with CSS so it survives to the export: warm → sepia +
    // a touch more saturation; cool → a slight blue hue shift.
    if (a.warmth > 0) {
      parts.push(`sepia(${r3((a.warmth / 100) * 0.5)})`);
      parts.push(`saturate(${r3(1 + (a.warmth / 100) * 0.2)})`);
    } else {
      parts.push(`hue-rotate(${Math.round(a.warmth * 0.35)}deg)`);
      parts.push(`saturate(${r3(1 + (a.warmth / 100) * 0.1)})`);
    }
  }
  if (a.hue) parts.push(`hue-rotate(${a.hue}deg)`);
  if (a.blur) parts.push(`blur(${a.blur}px)`);

  if (el?.imgShadow === "drop") {
    parts.push("drop-shadow(0 10px 14px rgba(0,0,0,0.4))");
  } else if (el?.imgShadow === "glow") {
    parts.push("drop-shadow(0 0 14px rgba(0,0,0,0.5))");
  }

  return parts.join(" ");
}
