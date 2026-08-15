/**
 * pollSchedule.js
 * ─────────────────────────────────────────────────────────────────────────────
 * How often a Magic Studio generation is checked on, and when to stop checking.
 *
 * ONE module because two different watchers ask the same question and must not
 * answer it differently: `useMagicGenerate` polls the run the user just started,
 * and `useMagicHistory` polls the runs it found still in flight when the tool was
 * opened (a job the user walked away from). A slider that got wider in one place
 * and not the other is exactly the kind of drift this file exists to prevent.
 *
 * ⚠️ THE CADENCE ESCALATES, AND THE NUMBERS COME FROM MEASUREMENT, not taste.
 * Timed against the real API on 2026-08-15:
 *
 *     text_to_image        1x   ~46s
 *     image_to_variations  2x  ~106s
 *     text_to_image        4x  ~240s
 *     worst run in history      ~356s
 *
 * So: tight at the start, where a 1x image can already be done; slack later,
 * where a 4x batch is still minutes from finishing and a 3-second poll would be
 * a hundred wasted requests. A fixed interval is either rude to the server or
 * slow to show a result that has been sitting ready — this is neither.
 */

/** 0–30s: a single image can land inside this window. */
const FAST_UNTIL_MS = 30 * 1000;
/** 30s–2m: multi-image batches live here. */
const MEDIUM_UNTIL_MS = 2 * 60 * 1000;

/**
 * Stop polling a run we are actively watching. Past this the result is not lost
 * — it lands in history whenever the backend finishes — so the wait ends with
 * "check back shortly" rather than an error.
 *
 * Set beyond the worst measured run (~6 min) with room to spare.
 */
export const POLL_CEILING_MS = 10 * 60 * 1000;

/**
 * When a record still saying "processing" is treated as abandoned.
 *
 * ⚠️ THIS IS WHAT STOPS A CRASHED JOB FROM SPINNING FOREVER. A generation row is
 * written before the work starts, so a backend that dies mid-run leaves a row
 * that will never move off "processing". Without a cutoff the tool would show a
 * loading tile for it on every visit, for the life of the account.
 *
 * Longer than {@link POLL_CEILING_MS}: the ceiling only ends OUR watching, where
 * this decides the record is never coming — that call deserves the wider margin.
 */
export const STALE_AFTER_MS = 15 * 60 * 1000;

/**
 * How long to wait before the next check, given how long this run has been going.
 *
 * @param {number} elapsedMs Milliseconds since the run started.
 * @returns {number} Delay in milliseconds.
 */
export function nextPollDelay(elapsedMs) {
  if (elapsedMs < FAST_UNTIL_MS) return 3000;
  if (elapsedMs < MEDIUM_UNTIL_MS) return 5000;
  return 10000;
}

/**
 * Milliseconds since an API timestamp, or 0 when it can't be read.
 *
 * ⚠️ 0 IS THE SAFE ANSWER for an unparseable date — it reads as "this only just
 * started", which keeps an in-flight run on screen. Returning something large
 * would have the opposite effect: a timestamp in a format we didn't expect would
 * silently mark every pending run stale and hide the loading state entirely.
 *
 * @param {string|null|undefined} isoDate e.g. "2026-08-15T09:29:51.000000Z"
 * @returns {number}
 */
export function elapsedSince(isoDate) {
  if (!isoDate) return 0;
  const started = Date.parse(isoDate);
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Date.now() - started);
}
