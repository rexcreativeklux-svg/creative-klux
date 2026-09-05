/**
 * gradient.js — one definition of what a gradient fill means.
 *
 * A gradient is stored exactly as it would be written in CSS —
 * `linear-gradient(135deg, #f0a 0%, #05f 100%)` — in the same `fill` property
 * that otherwise holds `#ff00aa`. Nothing gains a new field, and every control
 * that already reads a colour keeps working; the ones that need to tell the
 * difference ask `isGradient`.
 *
 * That choice costs something, and this file is the cost: a CSS string is not a
 * paint any of our four render paths understand.
 *
 *   • a div background  — takes the string as-is, free
 *   • text              — needs background-clip, because `color` has no gradient
 *   • an SVG shape      — needs a <linearGradient> def and `fill="url(#id)"`
 *   • the PNG exporter  — needs a real CanvasGradient; assigning the string to
 *                         ctx.fillStyle is SILENTLY IGNORED, and the shape keeps
 *                         whatever colour was set before it
 *
 * The last one is the trap: no error, no warning, just a shape that exports in
 * the wrong colour. Everything here exists so all four agree.
 */

/** Is this value a gradient rather than a plain colour? */
export function isGradient(value) {
  return (
    typeof value === "string" &&
    /^\s*(linear|radial)-gradient\s*\(/i.test(value)
  );
}

/**
 * Split a gradient's arguments on the commas BETWEEN stops.
 * Splitting on every comma would tear `rgba(0, 0, 0, .5)` into four arguments.
 */
function splitArgs(body) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of body) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const ANGLE_KEYWORDS = {
  "to top": 0,
  "to right": 90,
  "to bottom": 180,
  "to left": 270,
  "to top right": 45,
  "to right top": 45,
  "to bottom right": 135,
  "to right bottom": 135,
  "to bottom left": 225,
  "to left bottom": 225,
  "to top left": 315,
  "to left top": 315,
};

/** A leading `45deg` / `to bottom right` → degrees. Null when it is neither. */
function angleOf(token) {
  const text = (token || "").trim().toLowerCase();
  const deg = text.match(/^(-?[\d.]+)deg$/);
  if (deg) return parseFloat(deg[1]);
  return text in ANGLE_KEYWORDS ? ANGLE_KEYWORDS[text] : null;
}

/** `#abc 40%` → { color, offset }. Offset is null when the stop sets none. */
function parseStop(token) {
  const match = token.match(/^(.*?)\s+([\d.]+)%$/);
  if (match) {
    return { color: match[1].trim(), offset: parseFloat(match[2]) / 100 };
  }
  return { color: token.trim(), offset: null };
}

/**
 * A gradient string → `{ kind, angle, stops }`, or null if it isn't one we can
 * read. Every stop comes back with a real offset: CSS spreads the unpositioned
 * ones evenly, and so do we, so consumers never have to.
 */
export function parseGradient(value) {
  if (!isGradient(value)) return null;

  const open = value.indexOf("(");
  const kind = value.slice(0, open).trim().toLowerCase().startsWith("radial")
    ? "radial"
    : "linear";
  const args = splitArgs(value.slice(open + 1, value.lastIndexOf(")")));
  if (!args.length) return null;

  // The angle is optional. CSS defaults to `to bottom` without one.
  const leading = angleOf(args[0]);
  const angle = leading === null ? 180 : leading;
  const tokens = leading === null ? args : args.slice(1);

  const parsed = tokens.map(parseStop).filter((s) => s.color);
  if (parsed.length < 2) return null;

  const stops = parsed.map((stop, i) => ({
    color: stop.color,
    offset: Math.min(1, Math.max(0, stop.offset ?? i / (parsed.length - 1))),
  }));

  return { kind, angle, stops };
}

/** The gradient's direction as a unit vector, in screen axes (y grows down). */
function directionOf(angle) {
  const radians = (angle * Math.PI) / 180;
  // CSS angles run CLOCKWISE FROM UP, which is neither of the two conventions
  // Math.sin/cos give you directly — hence the negated cosine.
  return { dx: Math.sin(radians), dy: -Math.cos(radians) };
}

/**
 * A CanvasGradient for `value`, laid across `box`. Null when the value isn't a
 * readable gradient, so callers can treat it as a plain colour.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} value
 * @param {{x:number,y:number,width:number,height:number}} box in the context's
 *   CURRENT user space — a gradient's coordinates go through the live transform,
 *   so a caller that has already translated must pass a translated box.
 */
export function makeCanvasGradient(ctx, value, box) {
  const spec = parseGradient(value);
  if (!spec) return null;

  const { x, y, width, height } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;
  let gradient;

  if (spec.kind === "radial") {
    const radius = Math.max(width, height) / 2;
    gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  } else {
    const { dx, dy } = directionOf(spec.angle);
    // Long enough that the box's corners land on the ends of the gradient line,
    // which is the rule CSS uses — without it a 45° gradient finishes early and
    // the far corner is a flat block of the last colour.
    const length = Math.abs(width * dx) + Math.abs(height * dy);
    gradient = ctx.createLinearGradient(
      cx - (dx * length) / 2,
      cy - (dy * length) / 2,
      cx + (dx * length) / 2,
      cy + (dy * length) / 2,
    );
  }

  for (const stop of spec.stops) {
    try {
      gradient.addColorStop(stop.offset, stop.color);
    } catch {
      // An unreadable colour throws and would lose the whole gradient. Dropping
      // the one stop keeps the rest of it.
    }
  }

  return gradient;
}

/**
 * What to assign to `ctx.fillStyle`: a positioned CanvasGradient, or the value
 * untouched when it is an ordinary colour.
 */
export function fillStyleFor(ctx, value, box) {
  if (!isGradient(value)) return value;
  return makeCanvasGradient(ctx, value, box) || value;
}

/**
 * Endpoints for an SVG <linearGradient> in objectBoundingBox units.
 *
 * Not identical to CSS for diagonals: CSS runs its gradient line corner to
 * corner, while this runs edge to edge through the centre. On the square-ish
 * boxes shapes actually get, the difference is a few percent of the ramp
 * position and invisible; matching it exactly would mean knowing the box's
 * aspect ratio here, which objectBoundingBox deliberately hides.
 */
export function svgLinearEndpoints(angle) {
  const { dx, dy } = directionOf(angle);
  return {
    x1: 0.5 - dx / 2,
    y1: 0.5 - dy / 2,
    x2: 0.5 + dx / 2,
    y2: 0.5 + dy / 2,
  };
}

/**
 * Style props that paint TEXT with a gradient.
 *
 * `color` cannot hold one, so the gradient is painted as a background and then
 * clipped to the glyphs. The transparent fill is what lets the background show
 * through; without it the text paints over its own gradient in solid colour.
 */
export function gradientTextStyle(value) {
  if (!isGradient(value)) return null;
  return {
    backgroundImage: value,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    // Safari needs this spelled out, and it is what actually reveals the
    // background on the glyphs rather than around them.
    WebkitTextFillColor: "transparent",
  };
}

/**
 * Ready-made gradients for the colour picker.
 *
 * Deliberately short. A picker is for choosing, and forty tiles is a search
 * problem — these span the useful range of temperature and contrast, and the
 * custom pair below covers anything else.
 */
export const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)",
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  "linear-gradient(135deg, #232526 0%, #414345 100%)",
  "radial-gradient(circle, #ffffff 0%, #cfd9df 100%)",
];

/** A gradient between two colours, at an angle — what the custom controls build. */
export function buildGradient(from, to, angle = 135, kind = "linear") {
  return kind === "radial"
    ? `radial-gradient(circle, ${from} 0%, ${to} 100%)`
    : `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
}
