/**
 * numberInput.js — turning what someone typed into a number a control can use.
 *
 * Every typeable numeric field in the editor asks the same two questions — what
 * does this text mean, and what should an arrow key do — and both have edges
 * that are easy to get wrong in a component and almost impossible to notice
 * afterwards: an empty box, a lone minus sign halfway through typing "-20", a
 * value outside the range, float noise like 1.2000000000000002 arriving from a
 * 0.1 step.
 *
 * Kept apart from the fields so those cases are settled once rather than
 * re-decided, differently, in each of the seven places we have a number box.
 */

/** How many decimals a control with this step can express. 0.5 → 1, 1 → 0. */
export const decimalsOf = (step) => String(step).split(".")[1]?.length || 0;

/** Trim float noise to what the control can actually express. */
export const toPrecision = (n, decimals) => Number(Number(n).toFixed(decimals));

/** In range, and no more precise than the step allows. Null if unreadable. */
export function clampToStep(n, { min, max, step = 1 } = {}) {
  let value = Number(n);
  if (!Number.isFinite(value)) return null;
  if (Number.isFinite(min)) value = Math.max(min, value);
  if (Number.isFinite(max)) value = Math.min(max, value);
  return toPrecision(value, decimalsOf(step));
}

/**
 * What a typed string means for this control, or null when it means nothing.
 *
 * Null is the important half. An empty box, a lone "-" partway through typing
 * "-20", or a stray letter must leave the committed value ALONE. Reading them as
 * 0 — or as the minimum — silently rewrites a number the user is in the middle
 * of changing their mind about, and the field fights back as they type.
 *
 * @returns {number|null} clamped to the range, rounded to the step's precision
 */
export function parseNumber(text, { min, max, step = 1 } = {}) {
  const parsed = Number.parseFloat(text);
  if (!Number.isFinite(parsed)) return null;
  return clampToStep(parsed, { min, max, step });
}

/**
 * One arrow-key press: a step up or down, ten with Shift.
 *
 * `from` may be a committed value or a half-typed draft. Anything unreadable
 * starts from the range's floor rather than from zero, which may not even be a
 * value the control allows — a line-height field starts at 0.8, and stepping up
 * from 0 there would jump somewhere the user never asked to go.
 */
export function nudgeNumber(
  from,
  direction,
  { min, max, step = 1, multiplier = 1 } = {},
) {
  const base = Number.parseFloat(from);
  const start = Number.isFinite(base)
    ? base
    : Number.isFinite(min)
      ? min
      : 0;
  return clampToStep(start + direction * step * multiplier, { min, max, step });
}

/**
 * The keydown handler shared by every numeric field: ↑/↓ step, Shift for ten.
 *
 * Returns true when it handled the key, so the caller knows whether to
 * preventDefault — the browser's own number-input stepping would otherwise fire
 * as well and move by two.
 */
export function handleNumberKey(e, value, opts, onChange) {
  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return false;
  const next = nudgeNumber(value, e.key === "ArrowUp" ? 1 : -1, {
    ...opts,
    multiplier: e.shiftKey ? 10 : 1,
  });
  if (next === null) return false;
  e.preventDefault();
  onChange(next);
  return true;
}
