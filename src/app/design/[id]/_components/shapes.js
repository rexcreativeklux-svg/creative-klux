/**
 * Shared shape library for the editor.
 *
 * ONE source of truth used by three places so they can't drift:
 *   - ElementsPanel  (category rows + previews)
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

  // ── Lines ──────────────────────────────────────────────────────────────
  "line-solid": { label: "Line", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M2 6 H98", strokeW: 3 },
  "line-dashed": { label: "Dashed", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M2 6 H98", strokeW: 3, dash: [12, 8] },
  "line-dotted": { label: "Dotted", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M2 6 H98", strokeW: 3, dash: [0.5, 8], cap: "round" },
  "line-arrow": { label: "Arrow line", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M2 6 H90 M90 6 L82 2.5 M90 6 L82 9.5", strokeW: 3, cap: "round" },
  "line-arrow-both": { label: "Double arrow line", category: "lines", render: "line", kind: "stroke", viewBox: [100, 12], path: "M10 6 H90 M90 6 L82 2.5 M90 6 L82 9.5 M10 6 L18 2.5 M10 6 L18 9.5", strokeW: 3, cap: "round" },

  // ── Polygons ───────────────────────────────────────────────────────────
  pentagon: { label: "Pentagon", category: "polygons", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L94 37 L77 92 L23 92 L6 37 Z" },
  hexagon: { label: "Hexagon", category: "polygons", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z" },
  heptagon: { label: "Heptagon", category: "polygons", render: "path", kind: "fill", viewBox: [100, 100], path: "M50 4 L85.96 21.32 L94.85 60.24 L69.97 91.44 L30.03 91.44 L5.15 60.24 L14.04 21.32 Z" },
  octagon: { label: "Octagon", category: "polygons", render: "path", kind: "fill", viewBox: [100, 100], path: "M31 4 H69 L96 31 V69 L69 96 H31 L4 69 V31 Z" },

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

  // ── Speech bubbles ─────────────────────────────────────────────────────
  bubble: { label: "Speech bubble", category: "speech", render: "path", kind: "fill", viewBox: [100, 90], path: "M12 8 H88 A8 8 0 0 1 96 16 V60 A8 8 0 0 1 88 68 H44 L28 86 L31 68 H12 A8 8 0 0 1 4 60 V16 A8 8 0 0 1 12 8 Z" },
  "bubble-round": { label: "Oval bubble", category: "speech", render: "path", kind: "fill", viewBox: [100, 90], path: "M50 6 C22 6 4 22 4 42 C4 60 20 75 44 77 L40 90 L60 76 C80 72 96 58 96 42 C96 22 78 6 50 6 Z" },

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

/** Ordered categories for the Elements panel (mirrors Canva's grouping). */
export const SHAPE_CATEGORIES = [
  { id: "lines", label: "Lines" },
  { id: "basic", label: "Basic shapes" },
  { id: "polygons", label: "Polygons" },
  { id: "stars", label: "Stars" },
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

export const aspectOf = (key) => {
  const vb = SHAPES[key]?.viewBox || [1, 1];
  return vb[0] / vb[1];
};
