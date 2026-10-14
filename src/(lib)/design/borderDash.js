/**
 * Border styles for media elements — Canva's border picker: none, solid, long
 * dash, short dash, dotted. Stored as `el.borderDash`; the weight stays in
 * `borderWidth`, the colour in `borderColor`.
 *
 * Dash lengths scale with the weight, as Canva's do, so a heavier border keeps
 * the same rhythm. The SAME arrays drive the stage (an SVG stroke) and the PNG
 * export (`ctx.setLineDash`) — that shared source is the whole point of the
 * module; CSS `border-style: dashed` lets the browser pick its own lengths and
 * would never match the export.
 */

export const BORDER_DASHES = [
  { id: "none", label: "No border" },
  { id: "solid", label: "Solid" },
  { id: "long", label: "Long dash" },
  { id: "dashed", label: "Short dash" },
  { id: "dotted", label: "Dotted" },
];

/** Dash pattern for a stroke of width `w` — [] means solid. */
export function borderDashArray(style, w) {
  const u = Math.max(1, Number(w) || 1);
  if (style === "long") return [u * 4, u * 2];
  if (style === "dashed") return [u * 1.8, u * 1.5];
  // A zero-length dash with round caps is a dot exactly the width of the line.
  if (style === "dotted") return [0, u * 2];
  return [];
}

export const borderLineCap = (style) => (style === "dotted" ? "round" : "butt");
