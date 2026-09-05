/**
 * alignToPage — snap an element to an edge or centre line of the artboard.
 *
 * Shared rather than colocated because two surfaces offer the same six
 * alignments and must agree on what each one means: the Position panel's icon
 * grid and the element pill's "Align to page" submenu. They had drifted the
 * moment there were two of them.
 *
 * Each alignment touches ONE axis. "Centre" moves the element horizontally and
 * leaves its vertical position alone, so centring and then middling an element
 * lands it dead centre — where a combined "centre" would have made the second
 * click a no-op.
 */

/** The six alignments, in the order both surfaces present them. */
export const PAGE_ALIGNMENTS = [
  { key: "left", label: "Left", axis: "x" },
  { key: "center", label: "Center", axis: "x" },
  { key: "right", label: "Right", axis: "x" },
  { key: "top", label: "Top", axis: "y" },
  { key: "middle", label: "Middle", axis: "y" },
  { key: "bottom", label: "Bottom", axis: "y" },
];

/**
 * The patch that puts `el` against `kind` on a `canvasWidth × canvasHeight`
 * page. Returns an empty patch for an unknown alignment, so a caller can apply
 * the result unconditionally.
 *
 * @param {object} el Element with x/y/width/height in canvas units.
 * @param {string} kind One of PAGE_ALIGNMENTS' keys.
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
export function alignToPagePatch(el, kind, canvasWidth, canvasHeight) {
  if (!el) return {};
  const w = Number(el.width) || 0;
  const h = Number(el.height) || 0;

  switch (kind) {
    case "left":
      return { x: 0 };
    case "center":
      return { x: Math.round((canvasWidth - w) / 2) };
    case "right":
      return { x: Math.round(canvasWidth - w) };
    case "top":
      return { y: 0 };
    case "middle":
      return { y: Math.round((canvasHeight - h) / 2) };
    case "bottom":
      return { y: Math.round(canvasHeight - h) };
    default:
      return {};
  }
}
