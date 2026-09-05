/**
 * scaleProps.js — which of an element's numbers are CANVAS UNITS, and therefore
 * have to grow when the element does.
 *
 * Scaling a box is the easy half. The half that gets forgotten is everything
 * measured in canvas pixels *inside* it: a font size, a stroke, a corner radius,
 * a grid gap. Left alone, a headline scaled to twice the size comes back as the
 * same type in a bigger box, and a group scaled up comes back with hairline
 * strokes.
 *
 * This module is the single answer to "what scales". It replaced three
 * divergent copies of the same list — `UNIFORM_PROPS` in groups.js, the inline
 * block in `refitElement` (useDesignEditor.js), and the resize path — which had
 * drifted apart and shared one bug: they all scaled `strokeWidth`
 * unconditionally, which is wrong for more than half the elements that have one.
 *
 * ── The traps this encodes ────────────────────────────────────────────────
 *
 * `strokeWidth` is NOT one unit. On a primitive shape (rect / circle /
 * triangle) it is canvas pixels — a CSS `border` width on the stage, an
 * unscaled `ctx.lineWidth` in the export. But a library shape, a `draw` and a
 * `curve` are all rendered inside a viewBox mapping
 * (`ctx.scale(el.width / vw, el.height / vh)`, or SVG's own
 * `preserveAspectRatio="none"`), so their `strokeWidth` is in viewBox units and
 * ALREADY scales with the box. Multiplying it there scales it twice.
 *
 * `bend` is canvas units but is consumed as `24 * bend / height`, so it tracks
 * the HEIGHT factor, not the uniform one — otherwise a bent line straightens
 * out as it grows.
 *
 * `borderRadius` may be a per-corner object (see radius.js). Every previous
 * copy of this list guarded with `typeof === "number"` and so silently skipped
 * those, leaving imported designs with unscaled corners.
 *
 * `lineHeight` is a multiplier, `textEffect.*` values are normalized 0–100 and
 * resolved against `fontSize` at render time, and crop rects / track fractions
 * are fractions. None of them scale — they follow whatever they are relative to.
 *
 * A sticky note's `fontSize` is owned by its auto-fit effect (EditorElement),
 * which refits the type whenever the box changes. Writing a scaled size here
 * would be overwritten a frame later, so it is skipped and auto-fit is left to
 * do its job.
 */

import { PRIMITIVE_SHAPES, SHAPES } from "./shapes";

/**
 * Canvas-unit scalars that scale by the uniform factor on every element that
 * has them. `strokeWidth` is deliberately absent — it is decided per type below.
 */
const UNIFORM_KEYS = [
  "fontSize",
  "letterSpacing",
  "padding",
  "borderWidth", // table rules, and an image's border
  "gap", // grid gutters
  "cellRadius", // grid cells
];

/**
 * True when this element's `strokeWidth` is canvas pixels rather than viewBox
 * units — which is to say, when it renders through the primitive path.
 *
 * The condition mirrors the renderers' own dispatch rather than restating it,
 * because the two are not the same test. Both `renderDesign` and `renderInner`
 * take the library-shape branch only for a shape that is BOTH non-primitive and
 * actually present in SHAPES; anything else falls through to the primitive
 * `div` / `roundRect`. Real designs rely on that fallback — saved elements use
 * `shape: "rectangle"`, which is not in PRIMITIVE_SHAPES and not a SHAPES key,
 * so it draws as a primitive and its stroke is canvas pixels.
 */
function strokeIsCanvasUnits(el) {
  if (el?.type !== "shape") return false;
  return PRIMITIVE_SHAPES.has(el.shape) || !SHAPES[el.shape];
}

/** A sticky note's type size belongs to its auto-fit effect, not to us. */
function fontIsAutoFitted(el) {
  return el?.type === "text" && !!el.sticky && el.autoFit !== false;
}

/** Scale a `borderRadius`, preserving the per-corner object form when present. */
function scaleRadius(r, factor) {
  if (typeof r === "number") return r * factor;
  if (r && typeof r === "object") {
    const out = {};
    for (const key of ["topLeft", "topRight", "bottomRight", "bottomLeft"]) {
      const n = Number(r[key]);
      out[key] = Number.isFinite(n) ? n * factor : r[key];
    }
    return out;
  }
  return r;
}

/**
 * The canvas-unit properties of `el`, scaled — the part of a resize that isn't
 * the box. Returns a patch to merge; keys the element doesn't have are absent,
 * so it is safe to spread onto anything.
 *
 * @param {object} el      the element being scaled (read, never mutated)
 * @param {number} factor  the uniform scale factor
 * @param {object} [opts]
 * @param {number} [opts.heightFactor=factor] the vertical factor, for the one
 *   property (`bend`) that tracks height rather than the uniform mean. Pass it
 *   when a resize is non-uniform; omit it when it isn't.
 * @returns {object} a patch
 */
export function scaledProps(el, factor, { heightFactor = factor } = {}) {
  const patch = {};
  if (!el || !Number.isFinite(factor) || factor === 1) return patch;

  for (const key of UNIFORM_KEYS) {
    if (key === "fontSize" && fontIsAutoFitted(el)) continue;
    const value = Number(el[key]);
    if (Number.isFinite(value) && value !== 0) patch[key] = value * factor;
  }

  if (el.borderRadius != null) {
    const scaled = scaleRadius(el.borderRadius, factor);
    if (scaled !== el.borderRadius) patch.borderRadius = scaled;
  }

  if (strokeIsCanvasUnits(el)) {
    const stroke = Number(el.strokeWidth);
    if (Number.isFinite(stroke) && stroke !== 0) patch.strokeWidth = stroke * factor;
  }

  // Consumed as `24 * bend / height`, so it has to track the height exactly or
  // the curvature changes as the line grows.
  const bend = Number(el.bend);
  if (Number.isFinite(bend) && bend !== 0) patch.bend = bend * heightFactor;

  return patch;
}

export default scaledProps;
