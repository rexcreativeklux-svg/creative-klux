/**
 * Curve helpers — a "curve" element is a multi-node spline the user can reshape
 * by dragging each point freely in 2D (unlike a bendable line's single
 * perpendicular bend).
 *
 * Model (box-relative, mirrors the `draw` element so it drags/exports the same):
 *   { type:"curve", x, y, width, height, vbW, vbH, points:[{x,y}…], stroke, strokeWidth, cap }
 * `points` live in a vbW×vbH coordinate space that stretches to fill the box.
 */

/**
 * smoothPath — a Catmull-Rom spline through `points`, emitted as cubic béziers
 * so the curve passes smoothly through every node.
 */
export function smoothPath(points) {
  const pts = points || [];
  if (pts.length < 2) return "";
  if (pts.length === 2) {
    return `M${pts[0].x} ${pts[0].y} L${pts[1].x} ${pts[1].y}`;
  }
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Straight-segment path through the nodes (for elbow / multi-segment lines). */
export function polyPath(points) {
  const pts = points || [];
  if (!pts.length) return "";
  return "M" + pts.map((p) => `${p.x} ${p.y}`).join(" L");
}

/** Path through the nodes: sharp = straight segments, else smooth spline. */
export function curvePath(points, sharp) {
  return sharp ? polyPath(points) : smoothPath(points);
}

/** Default 3-node arc (start, raised middle, end) sized to w×h. */
export function defaultCurvePoints(w, h) {
  return [
    { x: 0, y: h },
    { x: w / 2, y: 0 },
    { x: w, y: h },
  ];
}

/** Default 3-node right-angle elbow (down, then across) sized to w×h. */
export function elbowPoints(w, h) {
  return [
    { x: 0, y: 0 },
    { x: 0, y: h },
    { x: w, y: h },
  ];
}

/** Add a node at (x,y) [vb coords] into the segment nearest the click. */
export function insertCurvePoint(points, x, y) {
  if (points.length < 2) return [...points, { x, y }];
  let bestI = 0;
  let bestD = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const d = (mx - x) ** 2 + (my - y) ** 2;
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
  }
  const next = [...points];
  next.splice(bestI + 1, 0, { x, y });
  return next;
}
