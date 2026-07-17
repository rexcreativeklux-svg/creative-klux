/**
 * Shared shape library for the editor.
 *
 * ONE source of truth used by three places so they can't drift:
 *   - ShapesBrowser  (category rows + previews)
 *   - EditorElement  (on-canvas rendering, via ShapeSVG)
 *   - renderDesign   (PNG export, via Path2D)
 *
 * Each shape is normalized to a viewBox and drawn with preserveAspectRatio
 * "none" so it stretches to fill its element box (Canva behaviour).
 *
 * render:
 *   'rect'     — primitive box (uses the element's borderRadius); div-rendered on canvas
 *   'ellipse'  — primitive circle/ellipse
 *   'triangle' — primitive triangle
 *   'path'     — filled SVG path
 *   'line'     — stroked SVG path (color comes from the element's `fill`)
 *
 * kind: 'fill' | 'stroke'  (stroke shapes use `fill` as the stroke color)
 */

export const SHAPES = {
  // ── Basic ──────────────────────────────────────────────────────────────
  rect: { label: "Square", category: "basic", render: "rect", kind: "fill", viewBox: [100, 100] },
  rounded: { label: "Rounded", category: "basic", render: "rect", kind: "fill", viewBox: [100, 100], rx: 16 },
  circle: { label: "Circle", category: "basic", render: "ellipse", kind: "fill", viewBox: [100, 100] },
  triangle: { label: "Triangle", category: "basic", render: "triangle", kind: "fill", viewBox: [100, 100] },
  diamond: { label: "Diamond", category: "basic", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L96 50 L50 96 L4 50 Z" },
  "right-triangle": { label: "Right triangle", category: "basic", render: "path", kind: "fill", viewBox: [100, 100], path: "M8 92 L8 8 L92 92 Z" },
  semicircle: { label: "Semicircle", category: "basic", render: "path", kind: "fill", viewBox: [100, 50], path: "M2 48 A48 48 0 0 1 98 48 Z" },
  arch: { label: "Arch", category: "basic", render: "path", kind: "fill", viewBox: [100, 100], path: "M8 96 V44 A42 42 0 0 1 92 44 V96 Z" },
  "quarter-circle": { label: "Quarter circle", category: "basic", render: "path", kind: "fill", viewBox: [100, 100], path: "M8 92 V8 A84 84 0 0 1 92 92 Z" },
  parallelogram: { label: "Parallelogram", category: "basic", render: "path", kind: "fill", viewBox: [100, 60], path: "M26 6 H98 L74 54 H2 Z" },
  trapezoid: { label: "Trapezoid", category: "basic", render: "path", kind: "fill", viewBox: [100, 60], path: "M28 6 H72 L96 54 H4 Z" },
  cross: { label: "Cross", category: "basic", render: "path", kind: "fill", viewBox: [100, 100], path: "M38 4 H62 V38 H96 V62 H62 V96 H38 V62 H4 V38 H38 Z" },
  chevron: { label: "Chevron", category: "basic", render: "path", kind: "fill", viewBox: [100, 70], path: "M4 4 H58 L96 35 L58 66 H4 L40 35 Z" },
  "triangle-down": { label: "Triangle down", category: "basic", render: "path", kind: "fill", viewBox: [100, 100], path: "M4 8 H96 L50 92 Z" },
  "parallelogram-left": { label: "Parallelogram left", category: "basic", render: "path", kind: "fill", viewBox: [100, 60], path: "M2 6 H74 L98 54 H26 Z" },
  "trapezoid-down": { label: "Trapezoid down", category: "basic", render: "path", kind: "fill", viewBox: [100, 60], path: "M4 6 H96 L72 54 H28 Z" },
  tab: { label: "Tab", category: "basic", render: "path", kind: "fill", viewBox: [100, 100], path: "M6 96 V32 Q6 6 30 6 H70 Q94 6 94 32 V96 Z" },
  kite: { label: "Kite", category: "basic", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L88 42 L50 96 L12 42 Z" },
  "l-shape": { label: "L-shape", category: "basic", render: "path", kind: "fill", viewBox: [100, 100], path: "M8 8 H40 V68 H92 V92 H8 Z" },

  // ── Lines ──────────────────────────────────────────────────────────────
  "line-solid": { label: "Line", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M0 6 H100", strokeW: 3, bendable: true, shaftYs: [6] },
  "line-double": { label: "Double line", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M0 3 H100 M0 9 H100", strokeW: 2, bendable: true, shaftYs: [3, 9] },
  "line-dashed": { label: "Dashed", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M0 6 H100", strokeW: 3, dash: [12, 8], bendable: true, shaftYs: [6] },
  "line-long-dash": { label: "Long dash", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M0 6 H100", strokeW: 3, dash: [20, 10], bendable: true, shaftYs: [6] },
  "line-dotted": { label: "Dotted", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M0 6 H100", strokeW: 3, dash: [0.5, 8], cap: "round", bendable: true, shaftYs: [6] },
  "line-dash-dot": { label: "Dash-dot", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M0 6 H100", strokeW: 3, dash: [14, 7, 0.5, 7], cap: "round", bendable: true, shaftYs: [6] },
  "line-wavy": { label: "Wavy", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M2 6 Q8 1 14 6 T26 6 T38 6 T50 6 T62 6 T74 6 T86 6 T98 6", strokeW: 3, cap: "round" },
  "line-zigzag": { label: "Zigzag", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M2 6 L10 2 L18 10 L26 2 L34 10 L42 2 L50 10 L58 2 L66 10 L74 2 L82 10 L90 2 L98 6", strokeW: 3, cap: "round" },
  "line-arrow": { label: "Arrow line", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M2 6 H90 M90 6 L82 2.5 M90 6 L82 9.5", strokeW: 3, cap: "round" },
  "line-arrow-left": { label: "Arrow line left", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M98 6 H10 M10 6 L18 2.5 M10 6 L18 9.5", strokeW: 3, cap: "round" },
  "line-arrow-both": { label: "Double arrow line", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M10 6 H90 M90 6 L82 2.5 M90 6 L82 9.5 M10 6 L18 2.5 M10 6 L18 9.5", strokeW: 3, cap: "round" },
  "line-curved": { label: "Curved line", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M0 6 H100", strokeW: 3, cap: "round", bendable: true, shaftYs: [6], previewBendVB: 16 },
  "line-elbow": { label: "Elbow line", category: "lines", render: "line", kind: "stroke", viewBox: [100, 100], path: "M12 12 V70 A18 18 0 0 0 30 88 H88", strokeW: 4, cap: "round" },

  // ── Polygons ───────────────────────────────────────────────────────────
  pentagon: { label: "Pentagon", category: "polygons", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L94 37 L77 92 L23 92 L6 37 Z" },
  hexagon: { label: "Hexagon", category: "polygons", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z" },
  heptagon: { label: "Heptagon", category: "polygons", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L85.96 21.32 L94.85 60.24 L69.97 91.44 L30.03 91.44 L5.15 60.24 L14.04 21.32 Z" },
  octagon: { label: "Octagon", category: "polygons", render: "path", kind: "fill", viewBox: [100, 100], path: "M31 4 H69 L96 31 V69 L69 96 H31 L4 69 V31 Z" },
  "hexagon-flat": { label: "Hexagon flat", category: "polygons", render: "path", kind: "fill", viewBox: [100, 100], path: "M27 8 H73 L96 50 L73 92 H27 L4 50 Z" },

  // ── Stars ──────────────────────────────────────────────────────────────
  star4: { label: "4-point star", category: "stars", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L60 40 L96 50 L60 60 L50 96 L40 60 L4 50 L40 40 Z" },
  star5: { label: "Star", category: "stars", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L61.8 38.2 L98 38.2 L68.8 59.5 L79.6 94 L50 72.4 L20.4 94 L31.2 59.5 L2 38.2 L38.2 38.2 Z" },
  star6: { label: "6-point star", category: "stars", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L60 32.7 L89.8 27 L70 50 L89.8 73 L60 67.3 L50 96 L40 67.3 L10.2 73 L30 50 L10.2 27 L40 32.7 Z" },
  star8: { label: "8-point star", category: "stars", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L58.4 29.7 L82.5 17.5 L70.3 41.6 L96 50 L70.3 58.4 L82.5 82.5 L58.4 70.3 L50 96 L41.6 70.3 L17.5 82.5 L29.7 58.4 L4 50 L29.7 41.6 L17.5 17.5 L41.6 29.7 Z" },
  sparkle: { label: "Sparkle", category: "stars", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 6 C54 30 70 46 94 50 C70 54 54 70 50 94 C46 70 30 54 6 50 C30 46 46 30 50 6 Z" },

  // ── Arrows ─────────────────────────────────────────────────────────────
  "arrow-right": { label: "Arrow right", category: "arrows", render: "path", kind: "fill", viewBox: [100, 70], path: "M2 22 H58 V4 L98 35 L58 66 V48 H2 Z" },
  "arrow-left": { label: "Arrow left", category: "arrows", render: "path", kind: "fill", viewBox: [100, 70], path: "M98 22 H42 V4 L2 35 L42 66 V48 H98 Z" },
  "arrow-up": { label: "Arrow up", category: "arrows", render: "path", kind: "fill", viewBox: [70, 100], path: "M22 98 V42 H4 L35 2 L66 42 H48 V98 Z" },
  "arrow-down": { label: "Arrow down", category: "arrows", render: "path", kind: "fill", viewBox: [70, 100], path: "M22 2 V58 H4 L35 98 L66 58 H48 V2 Z" },
  "arrow-double-h": { label: "Double arrow", category: "arrows", render: "path", kind: "fill", viewBox: [100, 60], path: "M4 30 L28 8 V20 H72 V8 L96 30 L72 52 V40 H28 V52 Z" },
  "arrow-up-down": { label: "Up-down arrow", category: "arrows", render: "path", kind: "fill", viewBox: [60, 100], path: "M30 4 L52 28 H40 V72 H52 L30 96 L8 72 H20 V28 H8 Z" },
  "chevron-right": { label: "Chevron arrow", category: "arrows", render: "path", kind: "fill", viewBox: [100, 70], path: "M4 4 L40 4 L76 35 L40 66 L4 66 L40 35 Z" },
  "arrow-pentagon": { label: "Pentagon arrow", category: "arrows", render: "path", kind: "fill", viewBox: [100, 70], path: "M2 6 H66 L98 35 L66 64 H2 Z" },
  "arrow-ribbon": { label: "Ribbon arrow", category: "arrows", render: "path", kind: "fill", viewBox: [100, 60], path: "M2 6 H74 L98 30 L74 54 H2 L20 30 Z" },
  "arrow-double-chevron": { label: "Double chevron", category: "arrows", render: "path", kind: "fill", viewBox: [100, 70], path: "M2 6 H34 L58 35 L34 64 H2 L26 35 Z M42 6 H74 L98 35 L74 64 H42 L66 35 Z" },
  "arrow-notched": { label: "Notched arrow", category: "arrows", render: "path", kind: "fill", viewBox: [100, 60], path: "M2 6 H70 L98 30 L70 54 H2 Z" },

  // ── Speech bubbles ─────────────────────────────────────────────────────
  bubble: { label: "Speech bubble", category: "speech", render: "path", kind: "fill", viewBox: [100, 90], path: "M12 8 H88 A8 8 0 0 1 96 16 V60 A8 8 0 0 1 88 68 H44 L28 86 L31 68 H12 A8 8 0 0 1 4 60 V16 A8 8 0 0 1 12 8 Z" },
  "bubble-round": { label: "Oval bubble", category: "speech", render: "path", kind: "fill", viewBox: [100, 90], path: "M50 6 C22 6 4 22 4 42 C4 60 20 75 44 77 L40 90 L60 76 C80 72 96 58 96 42 C96 22 78 6 50 6 Z" },
  "bubble-square": { label: "Square bubble", category: "speech", render: "path", kind: "fill", viewBox: [100, 90], path: "M6 6 H94 V60 H34 L14 84 L18 60 H6 Z" },
  "bubble-tail-right": { label: "Right-tail bubble", category: "speech", render: "path", kind: "fill", viewBox: [100, 90], path: "M12 8 H88 A8 8 0 0 1 96 16 V60 A8 8 0 0 1 88 68 H72 L72 86 L56 68 H12 A8 8 0 0 1 4 60 V16 A8 8 0 0 1 12 8 Z" },

  // ── Clouds ─────────────────────────────────────────────────────────────
  cloud: { label: "Cloud", category: "clouds", render: "path", kind: "fill", viewBox: [100, 70], path: "M26 64 C10 64 4 52 12 44 C6 34 16 22 28 26 C32 12 54 10 60 24 C74 16 90 26 86 40 C98 42 98 62 82 64 Z" },
  cloud2: { label: "Puffy cloud", category: "clouds", render: "path", kind: "fill", viewBox: [100, 64], path: "M24 60 C8 60 2 46 14 40 C8 28 22 18 32 24 C36 8 62 8 66 26 C82 20 96 32 88 46 C98 50 92 62 78 60 Z" },

  // ── Hearts ─────────────────────────────────────────────────────────────
  heart: { label: "Heart", category: "hearts", render: "path", kind: "fill", viewBox: [100, 90], path: "M50 86 C18 62 4 44 4 26 C4 12 16 4 28 8 C38 11 46 20 50 28 C54 20 62 11 72 8 C84 4 96 12 96 26 C96 44 82 62 50 86 Z" },

  // ── Banners ────────────────────────────────────────────────────────────
  bookmark: { label: "Bookmark", category: "banners", render: "path", kind: "fill", viewBox: [70, 100], path: "M12 6 H58 V94 L35 74 L12 94 Z" },
  ribbon: { label: "Ribbon", category: "banners", render: "path", kind: "fill", viewBox: [100, 44], path: "M6 6 H94 L82 22 L94 38 H6 L18 22 Z" },
  "banner-flag": { label: "Banner flag", category: "banners", render: "path", kind: "fill", viewBox: [100, 58], path: "M8 6 H92 V42 L50 58 L8 42 Z" },

  // ── Teardrops ──────────────────────────────────────────────────────────
  teardrop: { label: "Teardrop", category: "teardrops", render: "path", kind: "fill", viewBox: [80, 100], path: "M40 4 C40 4 74 44 74 64 A34 34 0 1 1 6 64 C6 44 40 4 40 4 Z" },

  // ── Flowchart ──────────────────────────────────────────────────────────
  stadium: { label: "Pill", category: "flowchart", render: "path", kind: "fill", viewBox: [100, 56], path: "M28 4 H72 A24 24 0 0 1 72 52 H28 A24 24 0 0 1 28 4 Z" },
  cylinder: { label: "Cylinder", category: "flowchart", render: "path", kind: "fill", viewBox: [100, 100], path: "M10 16 C10 8 90 8 90 16 V84 C90 92 10 92 10 84 Z" },
  document: { label: "Document", category: "flowchart", render: "path", kind: "fill", viewBox: [100, 90], path: "M8 8 H92 V72 C78 86 64 60 50 72 C36 84 22 60 8 72 Z" },

  // ── Organic ────────────────────────────────────────────────────────────
  blob: { label: "Blob", category: "organic", render: "path", kind: "fill", viewBox: [100, 100], path: "M54 8 C74 6 92 24 88 44 C85 60 96 74 78 86 C60 98 34 92 20 74 C8 58 12 32 28 18 C36 12 44 9 54 8 Z" },
  blob2: { label: "Blob 2", category: "organic", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 6 C72 6 94 20 92 44 C90 64 80 78 60 88 C42 96 20 90 12 70 C4 50 10 26 28 14 C36 9 42 6 50 6 Z" },
  blob3: { label: "Blob 3", category: "organic", render: "path", kind: "fill", viewBox: [100, 100], path: "M60 8 C82 12 96 32 90 52 C86 68 94 84 74 90 C56 96 34 94 20 78 C6 62 8 36 24 22 C36 12 46 6 60 8 Z" },
};

// ── Badges & seals (generated) ─────────────────────────────────────────────
// Spiky starbursts and scalloped stamp seals are cleaner to compute than to
// hand-author. Generated once at module load and folded into SHAPES so they
// flow through the panel, canvas and PNG export like every other shape.
function spikePath(points, outer, inner) {
  const cx = 50;
  const cy = 50;
  const start = -Math.PI / 2;
  const step = Math.PI / points;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = start + i * step;
    const x = (cx + r * Math.cos(a)).toFixed(2);
    const y = (cy + r * Math.sin(a)).toFixed(2);
    d += (i === 0 ? "M" : "L") + x + " " + y + " ";
  }
  return d + "Z";
}

function scallopPath(bumps, r) {
  const cx = 50;
  const cy = 50;
  const start = -Math.PI / 2;
  const step = (Math.PI * 2) / bumps;
  const pt = (i) => [cx + r * Math.cos(start + i * step), cy + r * Math.sin(start + i * step)];
  const arcR = (r * Math.sin(step / 2)).toFixed(2);
  const [x0, y0] = pt(0);
  let d = `M${x0.toFixed(2)} ${y0.toFixed(2)} `;
  for (let i = 1; i <= bumps; i++) {
    const [x, y] = pt(i);
    d += `A${arcR} ${arcR} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d + "Z";
}

const BADGES = [
  ["burst6", "6-point burst", spikePath(6, 48, 28)],
  ["burst8", "8-point burst", spikePath(8, 48, 32)],
  ["burst10", "10-point burst", spikePath(10, 48, 35)],
  ["burst12", "12-point burst", spikePath(12, 48, 38)],
  ["burst16", "16-point burst", spikePath(16, 48, 40)],
  ["burst24", "24-point burst", spikePath(24, 48, 43)],
  ["seal10", "Seal", scallopPath(10, 40)],
  ["seal12", "Stamp", scallopPath(12, 41)],
  ["seal16", "Scalloped seal", scallopPath(16, 42)],
];
for (const [key, label, path] of BADGES) {
  SHAPES[key] = { label, category: "badges", render: "path", kind: "fill", viewBox: [100, 100], path };
}

/** Ordered categories for the Elements panel (mirrors Canva's grouping). */
export const SHAPE_CATEGORIES = [
  { id: "lines", label: "Lines" },
  { id: "basic", label: "Basic shapes" },
  { id: "polygons", label: "Polygons" },
  { id: "stars", label: "Stars" },
  { id: "badges", label: "Badges & seals" },
  { id: "arrows", label: "Arrows" },
  { id: "speech", label: "Speech bubbles" },
  { id: "clouds", label: "Clouds" },
  { id: "hearts", label: "Hearts" },
  { id: "banners", label: "Banners" },
  { id: "teardrops", label: "Teardrops" },
  { id: "flowchart", label: "Flowchart" },
  { id: "organic", label: "Organic shapes" },
].map((c) => ({
  ...c,
  keys: Object.keys(SHAPES).filter((k) => SHAPES[k].category === c.id),
}));

/** Keys we render on-canvas as primitives (div/canvas), not via SVG path. */
export const PRIMITIVE_SHAPES = new Set(["rect", "circle", "triangle"]);

/** Any stroke-kind shape (all the `line-*` variants). */
export const isLineShape = (key) => SHAPES[key]?.kind === "stroke";

/**
 * "Straight" lines run horizontally across their box (viewBox height 12), so a
 * single rotation + length fully describes them — that's what makes the two
 * draggable endpoint handles possible. Elbow/curved lines are box-shaped and
 * fall back to normal corner resizing.
 */
export const isStraightLine = (key) =>
  isLineShape(key) && (SHAPES[key]?.viewBox?.[1] ?? 100) <= 12;

/** Straight lines that can be bent into a curve via a mid-point handle. */
export const isBendableLine = (key) => !!SHAPES[key]?.bendable;

/**
 * Build the shaft path for a line at a given bend (in viewBox units). Shared by
 * ShapeSVG (screen) and renderDesign (export) so the curve can't diverge.
 */
export function lineShaftPath(key, bendVB = 0) {
  const def = SHAPES[key];
  if (!def) return "";
  if (!def.bendable || !bendVB) return def.path;
  const ys = def.shaftYs || [6];
  return ys
    .map((y) => `M0 ${y} Q50 ${(y - bendVB).toFixed(2)} 100 ${y}`)
    .join(" ");
}

export const aspectOf = (key) => {
  const vb = SHAPES[key]?.viewBox || [1, 1];
  return vb[0] / vb[1];
};
