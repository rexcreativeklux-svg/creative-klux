/**
 * Grid geometry — the "grid" element type: a rows × cols layout of image cells
 * (Canva-style photo grids). Each cell is an independent image drop-zone.
 *
 * ONE source of truth used by:
 *   - GridsLibrary  (panel presets + previews)
 *   - EditorElement (on-canvas cell layout)
 *   - renderDesign  (PNG export — cell rects)
 *
 * Cells are laid out row-major with a uniform `gap`. Unlike frames (shape-masked
 * single images), a grid holds N rectangular cells, so no SVG path is needed —
 * cell rects are pure arithmetic.
 */

/** Common layouts offered in the Frames/Grids panel (rows × cols). */
export const GRID_PRESETS = [
  { rows: 1, cols: 2 },
  { rows: 2, cols: 1 },
  { rows: 2, cols: 2 },
  { rows: 1, cols: 3 },
  { rows: 3, cols: 1 },
  { rows: 2, cols: 3 },
  { rows: 3, cols: 2 },
  { rows: 3, cols: 3 },
];

/** Normalize a weight array to length `n` summing to 1; falls back to equal
 *  weights when missing or the wrong length (e.g. after a rows/cols change). */
export function normFractions(fr, n) {
  if (!Array.isArray(fr) || fr.length !== n) {
    return Array.from({ length: n }, () => 1 / n);
  }
  const sum = fr.reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  return fr.map((f) => (Number(f) || 0) / sum);
}

/**
 * Cell rectangles for a grid element, in element-local coordinates (origin at
 * the element's top-left). Honors optional per-column/row weights (colFr/rowFr)
 * so dividers can be dragged; defaults to equal tracks. Returns
 * [{ x, y, w, h, index, row, col }] row-major.
 */
export function gridCellRects({
  width,
  height,
  rows = 1,
  cols = 1,
  gap = 0,
  colFr,
  rowFr,
}) {
  const r = Math.max(1, rows);
  const c = Math.max(1, cols);
  const contentW = width - gap * (c - 1);
  const contentH = height - gap * (r - 1);
  const cwFr = normFractions(colFr, c);
  const rhFr = normFractions(rowFr, r);

  const colW = cwFr.map((f) => f * contentW);
  const rowH = rhFr.map((f) => f * contentH);
  const colX = [];
  const rowY = [];
  let ax = 0;
  for (let i = 0; i < c; i++) {
    colX.push(ax);
    ax += colW[i] + gap;
  }
  let ay = 0;
  for (let i = 0; i < r; i++) {
    rowY.push(ay);
    ay += rowH[i] + gap;
  }

  const rects = [];
  for (let row = 0; row < r; row++) {
    for (let col = 0; col < c; col++) {
      rects.push({
        x: colX[col],
        y: rowY[row],
        w: colW[col],
        h: rowH[row],
        index: row * c + col,
        row,
        col,
      });
    }
  }
  return rects;
}

/** Fresh empty-cell array for a rows × cols grid. */
export const makeGridCells = (rows, cols) =>
  Array.from({ length: Math.max(1, rows) * Math.max(1, cols) }, () => ({
    src: null,
  }));

/** Resize a grid's cell array to rows × cols, keeping filled cells by index. */
export const resizeGridCells = (cells = [], rows, cols) =>
  Array.from({ length: Math.max(1, rows) * Math.max(1, cols) }, (_, i) =>
    cells[i] ? { ...cells[i] } : { src: null },
  );
