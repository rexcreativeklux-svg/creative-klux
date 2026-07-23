/**
 * Frame geometry — the shape masks used by the "Frames" element type (an image
 * clipped to a shape, Canva-style).
 *
 * ONE source of truth used by four places so they can't drift:
 *   - FramesLibrary (panel previews + insert)
 *   - EditorElement (on-canvas clip via CSS clip-path)
 *   - renderDesign  (PNG export via Path2D clip)
 *   - DesignEditor  (insert sizing by aspect)
 *
 * Each frame is a filled `path` normalized to a `viewBox`, drawn stretched to
 * fill its element box (same convention as shapes.js). Path shapes are reused
 * from the shape library where one already exists; the primitives (square /
 * rounded / circle / triangle) render without a path in shapes.js, so their
 * paths are defined here.
 */

import { SHAPES } from "./shapes";

// Primitive frame geometries (shapes.js renders these as rect/ellipse/triangle,
// not paths, so a frame-ready path is defined here).
const PRIMITIVES = {
  "frame-square": { label: "Square", viewBox: [100, 100], path: "M0 0 H100 V100 H0 Z" },
  "frame-rounded": {
    label: "Rounded",
    viewBox: [100, 100],
    path: "M16 0 H84 A16 16 0 0 1 100 16 V84 A16 16 0 0 1 84 100 H16 A16 16 0 0 1 0 84 V16 A16 16 0 0 1 16 0 Z",
  },
  "frame-circle": {
    label: "Circle",
    viewBox: [100, 100],
    path: "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z",
  },
  "frame-triangle": { label: "Triangle", viewBox: [100, 100], path: "M50 2 L98 98 L2 98 Z" },
};

// Frames borrowed from the shape library — [shapeKey, label].
const FROM_SHAPES = [
  ["heart", "Heart"],
  ["star5", "Star"],
  ["pentagon", "Pentagon"],
  ["hexagon", "Hexagon"],
  ["diamond", "Diamond"],
  ["teardrop", "Teardrop"],
  ["arch", "Arch"],
  ["blob", "Blob"],
];

export const FRAMES = [
  ...Object.entries(PRIMITIVES).map(([key, v]) => ({ key, ...v })),
  ...FROM_SHAPES.map(([shapeKey, label]) => ({
    key: `frame-${shapeKey}`,
    label,
    viewBox: SHAPES[shapeKey].viewBox,
    path: SHAPES[shapeKey].path,
  })),
];

const FRAME_MAP = Object.fromEntries(FRAMES.map((f) => [f.key, f]));

/** Geometry ({ key, label, viewBox, path }) for a frame key; falls back to the
 *  first frame so a stale/unknown key still renders something sane. */
export const frameGeo = (key) => FRAME_MAP[key] || FRAMES[0];

/** True when an element key names a frame. */
export const isFrame = (key) => typeof key === "string" && key.startsWith("frame-");
