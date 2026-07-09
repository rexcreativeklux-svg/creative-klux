/**
 * Freehand-draw helpers shared by the on-canvas element, the live preview, and
 * the PNG export so a stroke looks identical everywhere.
 *
 * A `draw` element is:
 *   { type:'draw', x, y, width, height, vbW, vbH, points:[{x,y}...],
 *     stroke, strokeWidth, opacity, cap, blend }
 * where `points` are in the element's own coordinate space (0..vbW, 0..vbH).
 */

/** Build an SVG path `d` from a list of points (polyline). */
export function pointsToPath(points) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) {
    // a dot — tiny line so round caps render it as a circle
    const p = points[0];
    return `M${p.x} ${p.y} L${p.x + 0.01} ${p.y}`;
  }
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`)
    .join(" ");
}

const round = (n) => Math.round(n * 100) / 100;

/** Turn a set of absolute canvas points into a normalized draw element. */
export function strokeToElement(points, { color, size, opacity, cap, blend }) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const pad = size; // leave room for the stroke width around the bbox
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const maxX = Math.max(...xs) + pad;
  const maxY = Math.max(...ys) + pad;
  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);

  return {
    type: "draw",
    x: minX,
    y: minY,
    width: w,
    height: h,
    vbW: w,
    vbH: h,
    points: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
    stroke: color,
    strokeWidth: size,
    opacity,
    cap: cap || "round",
    blend: blend || undefined,
  };
}
