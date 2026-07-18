/**
 * tableUtils — pure helpers for the "table" design element.
 *
 * A table element stores its text as a row-major 2D array of strings:
 *   cells = [ ["A1","B1"], ["A2","B2"], ... ]   // cells[row][col]
 * plus `rows`/`cols` counts kept in sync with that array. Keeping the geometry
 * (x/y/width/height) on the element and the grid purely as data lets the editor
 * render, resize and export a table the same way it does every other element.
 */

export const TABLE_DEFAULTS = {
  borderColor: "#d1d5db",
  borderWidth: 1,
  headerRow: true,
  headerFill: "#f3f4f6",
  cellFill: "#ffffff",
  textColor: "#111827",
  fontSize: 16,
  align: "left",
};

/** Build a rows×cols grid of empty strings. */
export function makeCells(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ""),
  );
}

/**
 * Column/row sizes are stored as relative weights (`colFractions`/`rowFractions`),
 * so they scale with the element box and survive a whole-table resize. When a
 * table has never been hand-resized the arrays are absent and every track is
 * equal — these getters return a normalized weight array either way.
 */
export function getColFractions(el) {
  const f = el?.colFractions;
  return Array.isArray(f) && f.length === el.cols
    ? f
    : Array.from({ length: el.cols }, () => 1);
}

export function getRowFractions(el) {
  const f = el?.rowFractions;
  return Array.isArray(f) && f.length === el.rows
    ? f
    : Array.from({ length: el.rows }, () => 1);
}

/** Normalize a cells array to exactly rows×cols (pads/truncates, never mutates). */
export function normalizeCells(cells, rows, cols) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => cells?.[r]?.[c] ?? ""),
  );
}

// Splice `value` into a copy of `arr` at `index` (no mutation).
const insertAt = (arr, index, value) => [
  ...arr.slice(0, index),
  value,
  ...arr.slice(index),
];

/** Return a patch that inserts a blank row after `at` (defaults to the last row). */
export function addRow(el, at) {
  const cells = normalizeCells(el.cells, el.rows, el.cols);
  const index = at == null ? cells.length : Math.min(at + 1, cells.length);
  const blank = Array.from({ length: el.cols }, () => "");
  const next = insertAt(cells, index, blank);
  const patch = { cells: next, rows: next.length };
  // Give the new row the median weight of its neighbours so the table doesn't
  // visibly jump. Only tracked once the table has been hand-resized.
  if (Array.isArray(el.rowFractions)) {
    patch.rowFractions = insertAt(getRowFractions(el), index, 1);
  }
  return patch;
}

/** Return a patch that inserts a blank column after `at` (defaults to the last). */
export function addCol(el, at) {
  const cells = normalizeCells(el.cells, el.rows, el.cols);
  const index = at == null ? el.cols : Math.min(at + 1, el.cols);
  const next = cells.map((row) => insertAt(row, index, ""));
  const patch = { cells: next, cols: el.cols + 1 };
  if (Array.isArray(el.colFractions)) {
    patch.colFractions = insertAt(getColFractions(el), index, 1);
  }
  return patch;
}

/** Return a patch that removes row `at` (keeps at least one row). */
export function removeRow(el, at) {
  if (el.rows <= 1) return {};
  const cells = normalizeCells(el.cells, el.rows, el.cols);
  const index = at == null ? cells.length - 1 : at;
  const next = cells.filter((_, r) => r !== index);
  const patch = { cells: next, rows: next.length };
  if (Array.isArray(el.rowFractions)) {
    patch.rowFractions = getRowFractions(el).filter((_, r) => r !== index);
  }
  return patch;
}

/** Return a patch that removes column `at` (keeps at least one column). */
export function removeCol(el, at) {
  if (el.cols <= 1) return {};
  const cells = normalizeCells(el.cells, el.rows, el.cols);
  const index = at == null ? el.cols - 1 : at;
  const next = cells.map((row) => row.filter((_, c) => c !== index));
  const patch = { cells: next, cols: el.cols - 1 };
  if (Array.isArray(el.colFractions)) {
    patch.colFractions = getColFractions(el).filter((_, c) => c !== index);
  }
  return patch;
}

/**
 * Return a patch that resizes track `index` on `axis` ("col"|"row") by `deltaFr`
 * relative weight, taking it from the following track so the total stays fixed.
 * Both tracks are floored so neither can collapse. Returns {} if there is no
 * neighbour to trade with or the move is a no-op.
 */
export function resizeTrack(el, axis, index, deltaFr) {
  const MIN = 0.15;
  const fractions =
    axis === "col" ? [...getColFractions(el)] : [...getRowFractions(el)];
  const a = index;
  const b = index + 1;
  if (b >= fractions.length) return {};
  let delta = deltaFr;
  // Clamp so neither the shrinking nor the growing neighbour drops below MIN.
  delta = Math.max(delta, MIN - fractions[a]);
  delta = Math.min(delta, fractions[b] - MIN);
  if (Math.abs(delta) < 1e-4) return {};
  fractions[a] += delta;
  fractions[b] -= delta;
  return axis === "col"
    ? { colFractions: fractions }
    : { rowFractions: fractions };
}

/** Return a patch that writes `value` into cell (r, c). */
export function setCell(el, r, c, value) {
  const cells = normalizeCells(el.cells, el.rows, el.cols);
  const next = cells.map((row) => [...row]);
  if (next[r]) next[r][c] = value;
  return { cells: next };
}
