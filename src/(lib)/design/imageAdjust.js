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

// Drop-shadow presets (design-editor "Shadows" strip). Each is a CSS
// drop-shadow defined by offset (x, y), blur, and opacity (0–100, black).
// `none` clears the shadow. `drop`/`glow` keep their original look so existing
// designs are unchanged; the rest are ported from the design editor (its
// `floor`-mode presets need a baked sprite and are intentionally omitted).
export const IMAGE_SHADOWS = [
  { id: "none", label: "None" },
  { id: "drop", label: "Drop", x: 0, y: 10, blur: 14, opacity: 40 },
  { id: "glow", label: "Glow", x: 0, y: 0, blur: 14, opacity: 50 },
  { id: "soft", label: "Soft", x: 0, y: 9, blur: 14, opacity: 35 },
  { id: "hard", label: "Hard", x: 6, y: 6, blur: 4, opacity: 55 },
  { id: "bottom", label: "Bottom", x: 0, y: 18, blur: 22, opacity: 42 },
  { id: "angled", label: "Angled", x: 14, y: 14, blur: 16, opacity: 38 },
  { id: "left", label: "Left", x: -14, y: 10, blur: 16, opacity: 38 },
  { id: "right", label: "Right", x: 16, y: 10, blur: 16, opacity: 38 },
  { id: "top", label: "Top", x: 0, y: -14, blur: 16, opacity: 34 },
  { id: "long", label: "Long", x: 0, y: 30, blur: 30, opacity: 28 },
  { id: "subtle", label: "Subtle", x: 0, y: 4, blur: 8, opacity: 22 },
  { id: "contact", label: "Contact", x: 0, y: 3, blur: 3, opacity: 52 },
  { id: "diffuse", label: "Diffuse", x: 0, y: 12, blur: 34, opacity: 30 },
  { id: "haze", label: "Haze", x: 0, y: 0, blur: 42, opacity: 22 },
  { id: "drama", label: "Drama", x: 10, y: 20, blur: 10, opacity: 65 },
  { id: "bottomRight", label: "Bottom R", x: 18, y: 18, blur: 18, opacity: 40 },
  { id: "bottomLeft", label: "Bottom L", x: -18, y: 18, blur: 18, opacity: 40 },
  { id: "topRight", label: "Top R", x: 18, y: -16, blur: 18, opacity: 36 },
  { id: "topLeft", label: "Top L", x: -18, y: -16, blur: 18, opacity: 36 },
  { id: "hardBottom", label: "Hard btm", x: 0, y: 8, blur: 2, opacity: 60 },
  { id: "hardRight", label: "Hard R", x: 10, y: 6, blur: 2, opacity: 58 },
  { id: "hardLeft", label: "Hard L", x: -10, y: 6, blur: 2, opacity: 58 },
  { id: "block", label: "Block", x: 8, y: 8, blur: 0, opacity: 65 },
  { id: "deep", label: "Deep", x: 8, y: 16, blur: 6, opacity: 72 },
  { id: "longRight", label: "Long R", x: 34, y: 12, blur: 24, opacity: 26 },
  { id: "longLeft", label: "Long L", x: -34, y: 12, blur: 24, opacity: 26 },
  { id: "longTop", label: "Long top", x: 0, y: -32, blur: 24, opacity: 26 },
  { id: "tall", label: "Tall", x: 0, y: 44, blur: 16, opacity: 30 },
  { id: "stretch", label: "Stretch", x: 40, y: 40, blur: 20, opacity: 24 },
  { id: "feather", label: "Feather", x: 0, y: 10, blur: 38, opacity: 24 },
  { id: "mist", label: "Mist", x: 0, y: 6, blur: 46, opacity: 18 },
  { id: "cloud", label: "Cloud", x: 0, y: 14, blur: 50, opacity: 20 },
  { id: "lift", label: "Lift", x: 0, y: -4, blur: 24, opacity: 32 },
  { id: "pillow", label: "Pillow", x: 0, y: 0, blur: 30, opacity: 26 },
  { id: "glowSoft", label: "Glow soft", x: 0, y: 0, blur: 34, opacity: 38 },
  { id: "glowStrong", label: "Glow +", x: 0, y: 0, blur: 20, opacity: 62 },
  { id: "halo", label: "Halo", x: 0, y: 0, blur: 44, opacity: 30 },
  { id: "card", label: "Card", x: 0, y: 6, blur: 12, opacity: 28 },
  { id: "cardSoft", label: "Card soft", x: 0, y: 10, blur: 20, opacity: 22 },
  { id: "sticker", label: "Sticker", x: 3, y: 4, blur: 6, opacity: 40 },
  { id: "spotlight", label: "Spotlight", x: 0, y: 10, blur: 14, opacity: 50 },
];

/** Look up a shadow preset by id. */
export function shadowById(id) {
  return IMAGE_SHADOWS.find((s) => s.id === id) || null;
}

/** Default shadow params, used to seed the fine controls when none is set. */
export const DEFAULT_SHADOW = { x: 0, y: 10, blur: 14, opacity: 40, color: "#000000" };

/** #rgb / #rrggbb → rgba() at the given alpha (for the shadow colour). */
export function hexToRgba(hex, alpha = 1) {
  let h = String(hex || "#000000").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return `rgba(0,0,0,${r3(alpha)})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${r3(alpha)})`;
}

/** CSS drop-shadow for a shadow preset/params object ({x,y,blur,opacity,color}).
 *  `scale` shrinks it for small previews (offsets × scale, blur × 0.35 with a
 *  floor) so a tile mirrors the live look. */
export function shadowDropCss(sh, scale = 1) {
  if (!sh || sh.blur === undefined) return "";
  const x = r3(sh.x * scale);
  const y = r3(sh.y * scale);
  const b = scale < 1 ? Math.max(0.5, sh.blur * 0.35) : sh.blur;
  return `drop-shadow(${x}px ${y}px ${r3(b)}px ${hexToRgba(sh.color || "#000000", sh.opacity / 100)})`;
}

/** Resolve the effective shadow params for an element: custom params win, else
 *  the named preset's params. Returns null when there's no shadow. */
export function resolveShadow(el) {
  if (!el?.imgShadow || el.imgShadow === "none") return null;
  if (el.imgShadowParams) return el.imgShadowParams;
  const sh = shadowById(el.imgShadow);
  return sh && sh.blur !== undefined ? sh : null;
}

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

  const sp = resolveShadow(el);
  if (sp) parts.push(shadowDropCss(sp));

  return parts.join(" ");
}
