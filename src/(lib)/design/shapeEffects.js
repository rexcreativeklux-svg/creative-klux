/**
 * shapeEffects.js — shadow, echo and glow for shapes.
 *
 * The text equivalent of this (textEffects.js) has existed for a while; shapes
 * had nothing, so a rectangle could be any colour but could never sit above the
 * page. Deliberately modelled on that file — same `{ type, ...params, color }`
 * shape stored on the element, same 0–100 sliders — so the two panels behave
 * identically and neither has to be learned twice.
 *
 * ── What is NOT here, and why ─────────────────────────────────────────────
 *
 * The reference implementation also ships Outline, Retro, Chroma, Midnight and
 * Malibu. Those write `fill` and `stroke` directly, so picking "Retro" silently
 * repaints your shape amber with a red border — an "effect" that throws away the
 * colour you chose. Shapes already have first-class fill and outline controls in
 * the toolbar, and an effect that fights them is a worse version of both.
 *
 * What is left is the part shapes genuinely lack: light and depth.
 *
 * ── Why filter, not box-shadow ────────────────────────────────────────────
 *
 * `box-shadow` shadows the element's BOX. A star, an arrow or a speech bubble
 * would get a rectangular shadow floating behind it. `filter: drop-shadow()`
 * follows the actual alpha silhouette, so the shadow is the shape's own outline
 * — and it works the same on our SVG paths and our plain divs.
 */

import { rgba } from "./textEffects";

const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
const round = (n) => Math.round(n * 100) / 100;

export const SHAPE_EFFECTS = [
  { id: "none", label: "None" },
  { id: "drop", label: "Drop" },
  { id: "echo", label: "Echo" },
  { id: "glow", label: "Glow" },
];

/** Sliders each effect exposes. `def` is the default 0–100 value. */
export const SHAPE_EFFECT_CONTROLS = {
  drop: [
    { key: "offset", label: "Offset", min: 0, max: 100, def: 40 },
    { key: "direction", label: "Direction", min: -180, max: 180, def: 45 },
    { key: "blur", label: "Blur", min: 0, max: 100, def: 30 },
    { key: "transparency", label: "Transparency", min: 0, max: 100, def: 60 },
  ],
  echo: [
    { key: "offset", label: "Offset", min: 0, max: 100, def: 50 },
    { key: "direction", label: "Direction", min: -180, max: 180, def: 45 },
  ],
  glow: [{ key: "intensity", label: "Intensity", min: 0, max: 100, def: 50 }],
};

/** Effects that expose a colour control, with the default colour. */
export const SHAPE_EFFECT_COLOR = {
  drop: "#000000",
  echo: "#b1b1b1",
  glow: "#8b5cf6",
};

/** The default param set for an effect, used when it is first picked. */
export function defaultShapeEffectParams(type) {
  const params = { type };
  for (const c of SHAPE_EFFECT_CONTROLS[type] || []) params[c.key] = c.def;
  if (SHAPE_EFFECT_COLOR[type]) params.color = SHAPE_EFFECT_COLOR[type];
  return params;
}

/**
 * An effect → the shadow layers that draw it.
 *
 * Distances scale with the SHAPE's own size rather than being absolute pixels,
 * so the same settings read the same on a 40px icon and a 400px banner — the
 * same reason the text version scales with font size. Null when there is no
 * effect, so every caller has one thing to check.
 */
export function resolveShapeEffect(el) {
  const e = el?.shapeEffect;
  if (!e || !e.type || e.type === "none") return null;

  // The smaller side: on a long thin bar, scaling by the width would throw the
  // shadow far past the shape.
  const size = Math.max(8, Math.min(el.width || 0, el.height || 0));
  const color = e.color || SHAPE_EFFECT_COLOR[e.type] || "#000000";
  const vec = (deg, dist) => {
    const rad = (deg * Math.PI) / 180;
    return { dx: Math.cos(rad) * dist, dy: Math.sin(rad) * dist };
  };

  switch (e.type) {
    case "drop": {
      const { dx, dy } = vec(
        num(e.direction, 45),
        (num(e.offset, 40) / 100) * size * 0.25,
      );
      const blur = (num(e.blur, 30) / 100) * size * 0.4;
      const alpha = 1 - num(e.transparency, 60) / 100;
      return { shadows: [{ dx, dy, blur, color: rgba(color, alpha) }] };
    }
    case "echo": {
      // Two hard copies at decreasing opacity — the look comes from the
      // repetition, so these are 0-blur on purpose.
      const dist = (num(e.offset, 50) / 100) * size * 0.3;
      const a = vec(num(e.direction, 45), dist);
      const b = vec(num(e.direction, 45), dist * 2);
      return {
        shadows: [
          { dx: a.dx, dy: a.dy, blur: 0, color: rgba(color, 0.5) },
          { dx: b.dx, dy: b.dy, blur: 0, color: rgba(color, 0.25) },
        ],
      };
    }
    case "glow": {
      const i = num(e.intensity, 50) / 100;
      const blur = size * (0.06 + 0.34 * i);
      // Two centred layers: one tight and bright, one wide and soft. A single
      // layer reads as a blurry duplicate rather than as light.
      return {
        shadows: [
          { dx: 0, dy: 0, blur: blur * 0.5, color: rgba(color, 0.3 + 0.5 * i) },
          { dx: 0, dy: 0, blur, color: rgba(color, 0.2 + 0.4 * i) },
        ],
      };
    }
    default:
      return null;
  }
}

/**
 * CSS for the on-canvas element: a `filter` of stacked drop-shadows.
 *
 * Returns null when there is no effect, so the caller can leave `filter`
 * untouched — an empty filter string still creates a containing block and would
 * change how children position themselves.
 */
export function shapeEffectCss(el) {
  const d = resolveShapeEffect(el);
  if (!d?.shadows?.length) return null;
  return {
    filter: d.shadows
      .map(
        (s) =>
          `drop-shadow(${round(s.dx)}px ${round(s.dy)}px ${round(s.blur)}px ${s.color})`,
      )
      .join(" "),
  };
}

/**
 * Paint an element's effect into a canvas, then draw it.
 *
 * Canvas has ONE shadow, not a list, so each layer is a separate pass: set the
 * shadow, run `draw`, repeat — then a final pass with no shadow for the shape
 * itself. Painting back-to-front means the softest layer ends up furthest down,
 * and the shape lands on top of all of them.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} el
 * @param {Function} draw called once per pass; must paint the shape at its
 *   normal position, since the shadow is what gets offset, not the drawing.
 */
export function drawWithShapeEffect(ctx, el, draw) {
  const d = resolveShapeEffect(el);
  if (!d?.shadows?.length) {
    draw();
    return;
  }

  for (const s of d.shadows) {
    ctx.save();
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.blur;
    ctx.shadowOffsetX = s.dx;
    ctx.shadowOffsetY = s.dy;
    draw();
    ctx.restore();
  }

  // The shape itself, unshadowed and last, so no layer sits over it.
  draw();
}
