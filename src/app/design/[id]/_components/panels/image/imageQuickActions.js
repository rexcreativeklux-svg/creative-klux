/**
 * imageQuickActions — the patch each one-tap image tool produces.
 *
 * Colocated beside ImageQuickTools, which is the only caller: these are the
 * tools that need no panel, no model and no overlay, just a property the
 * renderers already read. Kept out of the component so the tile grid stays a
 * list of labels and handlers, and so the geometry decisions below are
 * readable on their own.
 *
 * ── The rule these all obey ───────────────────────────────────────────────
 *
 * Nothing here writes a property no renderer honours. A tile that lights up
 * and changes nothing is worse than a tile that isn't there — so every key
 * below is one that BOTH renderers read: the DOM one in EditorElement (the
 * stage) and the canvas one in renderDesign (the PNG export). If you add a
 * tool here, add it to both first.
 *
 * Honoured today: `flipH`, `flipV`, `rotation`, `borderRadius`, `objectFit`,
 * `borderWidth`/`borderColor`, `adjust`, `filter`, `src`.
 */

import { hasRadius, radiusToNumber } from "@/(lib)/design/radius";

/**
 * Corner rounding cycles through these, as a FRACTION of the shorter side, so
 * one tap does something visible whatever the image's size. The Position panel
 * has the slider; this is the quick version.
 */
export const ROUND_STEPS = [0, 0.06, 0.18, 0.5];

/** What Border turns on when the image has never had one. */
export const DEFAULT_IMAGE_BORDER = { borderWidth: 8, borderColor: "#ffffff" };

/**
 * The next rounding step up, wrapping to none.
 *
 * Read back off the element rather than tracked in the tile, so the cycle
 * continues from whatever is actually set — including a value typed into the
 * slider elsewhere.
 */
export function cycleRoundingPatch(el) {
  const shortest = Math.min(el?.width || 0, el?.height || 0);
  if (!shortest) return null;

  // radiusToNumber, not a raw read: an imported design's radius may be a
  // per-corner object, and reading its largest corner is what makes such a
  // value cycle onward from where it is rather than snapping to none. The
  // cycle itself only ever writes a uniform radius.
  const current = radiusToNumber(el.borderRadius) / shortest;
  const next = ROUND_STEPS.find((step) => step > current + 0.001) ?? ROUND_STEPS[0];
  return { borderRadius: Math.round(next * shortest) };
}

/** Any rounding at all, uniform or per-corner. */
export function isRounded(el) {
  return hasRadius(el?.borderRadius);
}

/** Quarter-turn clockwise, wrapping at a full turn. */
export function rotatePatch(el) {
  return { rotation: ((Number(el?.rotation) || 0) + 90) % 360 };
}

/**
 * Swap which compromise the image makes inside its box: `cover` crops to fill
 * it, `contain` shows the whole picture and letterboxes.
 */
export function fitModePatch(el) {
  return { objectFit: fitMode(el) === "cover" ? "contain" : "cover" };
}

export function fitMode(el) {
  return el?.objectFit === "contain" ? "contain" : "cover";
}

export function hasBorder(el) {
  return (Number(el?.borderWidth) || 0) > 0;
}

/** Toggle the border off by zeroing its width, keeping the colour for next time. */
export function borderPatch(el) {
  if (hasBorder(el)) return { borderWidth: 0 };
  return {
    borderWidth: DEFAULT_IMAGE_BORDER.borderWidth,
    borderColor: el?.borderColor || DEFAULT_IMAGE_BORDER.borderColor,
  };
}

/** Is there any look to reset? Geometry deliberately doesn't count — see below. */
export function hasLook(el) {
  const adjust = el?.adjust || {};
  return Boolean(el?.filter) || Object.values(adjust).some((v) => Number(v) || 0);
}

/**
 * Clears the LOOK, not the geometry.
 *
 * A reset that also un-cropped, un-rotated and un-flipped would throw away work
 * the user never asked it to touch — they tapped a tile in a row of colour
 * tools. Crop has its own Reset inside the crop bar, and rotation/flip are one
 * tap each to undo.
 */
export function resetLookPatch() {
  return { adjust: {}, filter: null };
}

/** True once background removal has left an original worth going back to. */
export function canRestore(el) {
  return Boolean(el?.backgroundRemoved && el?.originalSrc);
}

export function restorePatch(el) {
  return { src: el.originalSrc, backgroundRemoved: false };
}

/**
 * Swapping the source starts a clean slate: the stored original and the
 * background-removed flag describe an image that is no longer here, and the
 * cached natural size would make the crop tool reason about the wrong picture.
 */
export function replaceSrcPatch(dataUrl) {
  return {
    src: dataUrl,
    originalSrc: dataUrl,
    backgroundRemoved: false,
    crop: null,
    natW: undefined,
    natH: undefined,
  };
}
