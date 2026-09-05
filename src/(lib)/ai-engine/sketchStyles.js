// The Photo to Sketch style registry — shared by SketchifySection (labels for
// the style grid) and the sketch worker (the parameters each style actually
// runs with).
//
// Two engines produce every style:
//
//   "dodge"   — the classic pencil-shading pipeline, pure canvas math
//               (grayscale → invert → blur → color-dodge blend), instant, no
//               model download. Params tune blur radius, grain, tone and how
//               much of the photo's own color survives.
//   "lineart" — the informative-drawings ONNX model (MIT, 17 MB): genuine
//               artist-style line drawings. Params post-process the line map
//               (threshold, ink tint, thickening, tonal wash, halftone).
//
// Ported from the design editor's registry: same ids, labels, engines and
// params (so the on-device output is identical), minus its `thumb`/`prompt`
// fields — those exist there only to drive a build-time script that renders
// promotional tile art from that product's own asset host, and SketchifySection
// here never needed stock thumbnails in the first place: it renders every
// tile from the user's OWN photo on-device (see usePreviewBakes usage there,
// mirroring the design editor's useStylePreviews).
//
// @typedef {{ id: string, label: string, engine: "dodge"|"lineart", params: object }} SketchStyle

export const SKETCH_STYLES = [
  // ── Dodge family (instant, no model) ────────────────────────────────
  {
    id: "pencil-sketch",
    label: "Pencil Sketch",
    engine: "dodge",
    // blur = shading softness (px at the 2048 working size); grain = paper
    // noise strength 0–1; gamma darkens (<1) or lifts (>1) the strokes.
    params: { blur: 14, grain: 0.12, gamma: 0.95 },
  },
  {
    id: "fine-detail-sketch",
    label: "Fine Detail Sketch",
    engine: "dodge",
    params: { blur: 6, grain: 0.08, gamma: 0.9 },
  },
  {
    id: "charcoal-sketch",
    label: "Charcoal Sketch",
    engine: "dodge",
    params: { blur: 26, grain: 0.3, gamma: 0.55 },
  },
  {
    id: "da-vinci-manuscript",
    label: "Da Vinci Manuscript",
    engine: "dodge",
    // Duotone: strokes render in ink color on a parchment paper color.
    params: { blur: 12, grain: 0.22, gamma: 0.8, paper: "#f1e4c7", ink: "#5b4326" },
  },
  {
    id: "colored-pencil-sketch",
    label: "Colored Pencil Sketch",
    engine: "dodge",
    // keepChroma = how much of the photo's own color tints the strokes (0–1+).
    params: { blur: 12, grain: 0.12, gamma: 0.92, keepChroma: 0.85 },
  },
  {
    id: "pastel-sketch",
    label: "Pastel Sketch",
    engine: "dodge",
    params: { blur: 22, grain: 0.16, gamma: 1.05, keepChroma: 1.15 },
  },

  // ── Line-art family (informative-drawings model) ────────────────────
  {
    id: "ink-sketch",
    label: "Ink Sketch",
    engine: "lineart",
    // contrast steepens the line map around its midpoint (1 = as-is).
    params: { contrast: 1.6 },
  },
  {
    id: "minimalist-line-sketch",
    label: "Minimalist Line Sketch",
    engine: "lineart",
    // threshold = hard black/white cut on the line map (0–1, higher = fewer lines).
    params: { threshold: 0.62 },
  },
  {
    id: "ballpoint-pen-sketch",
    label: "Ballpoint Pen Sketch",
    engine: "lineart",
    params: { contrast: 1.5, ink: "#1e3a8a" },
  },
  {
    id: "bold-sketch",
    label: "Bold Sketch",
    engine: "lineart",
    // thicken = dilation passes on the lines (each pass ≈ 1px at model size).
    params: { contrast: 1.6, thicken: 1 },
  },
  {
    id: "ink-wash-sketch",
    label: "Ink Wash Sketch",
    engine: "lineart",
    // wash = blend a blurred tonal layer of the photo under the lines (0–1).
    params: { contrast: 1.4, wash: 0.35 },
  },
  {
    id: "manga-sketch",
    label: "Manga Sketch",
    engine: "lineart",
    // halftone = screen-tone dots in the photo's shadow regions (0–1 strength).
    params: { threshold: 0.58, halftone: 0.5 },
  },
];

/** Style lookup with a safe default (the first style). */
export function getSketchStyle(id) {
  return SKETCH_STYLES.find((s) => s.id === id) || SKETCH_STYLES[0];
}
