/**
 * clip.js — an element's box as a WINDOW onto its own contents.
 *
 * Dragging a mid-edge handle crops rather than squashes: the content keeps the
 * size and position it already had, and the box simply shows less of it.
 * Dragging back out uncovers it again. That needs two boxes where there was one
 * — the box the content is LAID OUT in, and the box you can SEE through:
 *
 *   el.clip = { offsetX, offsetY, contentW, contentH }   // canvas units
 *
 * The element's own `x, y, width, height` is the window. The content is laid
 * out at `contentW × contentH` with its top-left at `(x - offsetX, y - offsetY)`
 * and clipped to the window.
 *
 * Canvas units, not the normalized fractions an image `crop` uses: there is no
 * natural source size for a table or a paragraph to be a fraction of, and a
 * window that stays put while the content changes underneath is exactly what
 * makes this a crop rather than a re-layout.
 *
 * ── Why one field covers every element type ───────────────────────────────
 *
 * Both renderers — the DOM one in EditorElement and the canvas one in
 * renderDesign — read `x / y / width / height` off the element in every branch.
 * So neither needs to learn about windows: clip to the real box, then hand the
 * branch a substituted element whose box IS the content box, and every type
 * crops correctly with no per-type code. Text wraps at the content width and
 * centres in the content height; a grid lays its cells out at content size; a
 * frame scales its clip path to it. See `windowed`.
 *
 * Images window the same way as everything else. They also have `crop`
 * (imageCrop.js), but that is a different operation and stays the Crop tool's:
 * `crop` maps a source sub-rectangle onto the WHOLE box, so it stretches, which
 * is the one thing a crop-by-dragging must not do. The two compose without
 * knowing about each other — `crop` stretches the source into the content box,
 * then the window cuts it.
 */

/** True when a clip actually hides something (vs. an absent or empty one). */
export function isClipped(c) {
  return (
    !!c &&
    Number.isFinite(c.contentW) &&
    Number.isFinite(c.contentH) &&
    c.contentW > 0 &&
    c.contentH > 0
  );
}

/**
 * The element a renderer should actually draw: same element, but its box is the
 * CONTENT box rather than the window. Returns the element itself when there is
 * no clip, so callers can use it unconditionally and pay nothing.
 *
 * The caller is responsible for clipping to the real box first — this only
 * moves the content; it does not hide the overflow.
 */
export function windowed(el) {
  const c = el?.clip;
  if (!isClipped(c)) return el;
  return {
    ...el,
    x: (Number(el.x) || 0) - (c.offsetX || 0),
    y: (Number(el.y) || 0) - (c.offsetY || 0),
    width: c.contentW,
    height: c.contentH,
    // Dropped, not kept: the DOM renderer recurses through this to draw the
    // contents, and an element that still claimed a window would window itself
    // forever.
    clip: undefined,
  };
}

/**
 * A window that hides nothing — the starting point for a crop gesture on an
 * element that has never been cropped.
 */
export function seedClip(el) {
  return {
    offsetX: 0,
    offsetY: 0,
    contentW: Number(el?.width) || 0,
    contentH: Number(el?.height) || 0,
  };
}

/**
 * A clip reduced to `null` once it stops hiding anything, so an element dragged
 * back out to its full contents is genuinely uncropped again rather than
 * carrying a no-op window forever (and taking the slow path in both renderers).
 */
export function normalizeClip(clip, box) {
  if (!isClipped(clip)) return null;
  const flush =
    Math.abs(clip.offsetX || 0) < 0.5 &&
    Math.abs(clip.offsetY || 0) < 0.5 &&
    Math.abs(clip.contentW - (Number(box?.width) || 0)) < 0.5 &&
    Math.abs(clip.contentH - (Number(box?.height) || 0)) < 0.5;
  return flush ? null : clip;
}

/**
 * A clip scaled for a resize, as a patch to merge (empty when there is none).
 *
 * Everything in a clip is canvas units, so all four numbers travel with the box
 * — left alone, the same window would expose a different amount of a
 * differently-sized layout. Offsets and sizes scale per-axis, because a window
 * is a rectangle and has no reason to stay square.
 */
export function scaledClip(el, sx, sy = sx) {
  const c = el?.clip;
  if (!isClipped(c)) return {};
  return {
    clip: {
      offsetX: (c.offsetX || 0) * sx,
      offsetY: (c.offsetY || 0) * sy,
      contentW: c.contentW * sx,
      contentH: c.contentH * sy,
    },
  };
}

/** A detached copy, so a duplicated element never shares its window. */
export function cloneClip(c) {
  return isClipped(c) ? { ...c } : c;
}
