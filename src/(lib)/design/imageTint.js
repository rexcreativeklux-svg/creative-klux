/**
 * imageTint.js — colouring a photo.
 *
 * An image element has one colour, `backgroundColor`, and it does two jobs: it
 * fills the element's box, and it tints the photo on top of that. Both, because
 * a `cover` photo covers its whole box — colouring only what sits behind it
 * would look like the picker had done nothing at all. The box fill is what shows
 * through a `contain` fit's letterboxing, and through the transparent parts of a
 * BG Remover cutout.
 *
 * ── Why `color` and not `multiply` ────────────────────────────────────────
 *
 * `multiply` is the obvious blend and it is not a tint: it only ever darkens, so
 * a pale colour does almost nothing and a dark one turns the photo to mud. The
 * `color` blend keeps each pixel's LUMINANCE and replaces its hue and
 * saturation, which is what "make this photo blue" means — the detail survives
 * and only the colour changes.
 *
 * CSS spells it `mix-blend-mode: color` and canvas spells it
 * `globalCompositeOperation = "color"`. The two are the same operation, which is
 * the only reason the editor and the export can agree.
 */

/** How much colour lands on the photo when no strength has been set. */
export const DEFAULT_TINT_STRENGTH = 0.5;

/**
 * Is this a real colour, rather than one of the several ways of saying "none"?
 * The picker can write any of them, and each would otherwise paint a tint.
 */
export const isColourValue = (value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  value !== "transparent" &&
  value !== "none";

/** An element's tint strength, 0–1. */
export const tintStrength = (el) =>
  Math.min(1, Math.max(0, Number(el?.tintStrength ?? DEFAULT_TINT_STRENGTH)));

/**
 * Would a tint actually show on the pixels?
 *
 * Separate from "does it have a colour": a colour with the strength dialled to
 * zero still fills the box behind the photo, it just doesn't touch it. Treating
 * those as one question made turning the strength down look like it had cleared
 * the colour.
 */
export const hasTint = (el) =>
  isColourValue(el?.backgroundColor) && tintStrength(el) > 0;

/** The overlay that does the tinting, as inline style. Null when there is none. */
export function tintOverlayStyle(el) {
  if (!hasTint(el)) return null;
  return {
    position: "absolute",
    inset: 0,
    background: el.backgroundColor,
    opacity: tintStrength(el),
    mixBlendMode: "color",
    pointerEvents: "none",
  };
}

/**
 * Paint an image's tint on a canvas, returning a bitmap to draw.
 *
 * The work happens on an OFFSCREEN canvas rather than on the page context, and
 * that is the whole point of this function. Compositing the colour straight onto
 * the main context is one line and wrong: a blend applies to everything already
 * drawn in that area, so tinting a photo would also tint whatever elements sit
 * beneath it. Isolating it means only this image is affected.
 *
 * @param {object} el the image element
 * @param {number} width in device pixels
 * @param {number} height
 * @param {Function} paint draws the untinted image into the offscreen context,
 *   in a box of (width, height) at the origin
 * @returns {HTMLCanvasElement|null} null when there is nothing to tint, so the
 *   caller can draw normally
 */
export function tintedImageCanvas(el, width, height, paint) {
  if (!hasTint(el) || width <= 0 || height <= 0) return null;

  const off = document.createElement("canvas");
  off.width = Math.ceil(width);
  off.height = Math.ceil(height);
  const octx = off.getContext("2d");
  if (!octx) return null;

  paint(octx);

  octx.globalCompositeOperation = "color";
  octx.globalAlpha = tintStrength(el);
  octx.fillStyle = el.backgroundColor;
  octx.fillRect(0, 0, off.width, off.height);

  // The colour fill just painted over the transparent regions too. Clipping back
  // to the image's own alpha restores them — without this, a cutout's removed
  // background comes back as a solid rectangle of the tint colour.
  octx.globalCompositeOperation = "destination-in";
  octx.globalAlpha = 1;
  paint(octx);

  return off;
}
