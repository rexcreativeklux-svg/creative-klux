/**
 * watchProductGeneration.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Following a Product Studio generation to its end by polling
 * `GET /product-studio/generations/{id}/status`.
 *
 * ⚠️ THE RUN IS WATCHED, NOT AWAITED. `POST /product-studio/generate` does not
 * reliably answer with the result: on a video it can block for the whole render
 * (minutes) and it can equally come back the moment the record is written, with
 * nothing but `{ generation: { id, status: "processing" } }`. Waiting on that
 * one request means the loading state is only as good as a multi-minute XHR that
 * a proxy, a flaky connection or a backgrounded tab can end at any point — and
 * when it does, the user is told nothing came back while the backend happily
 * finishes and files the clip in history.
 *
 * So the request is fired and, in parallel, the RUN is followed here. Whichever
 * gets there first settles it. The request is still awaited for its ERRORS,
 * which the poll cannot see: a rejected input (422), an expired token (401) and
 * the credits limit (402) all live on that response and never become a record
 * to poll.
 *
 * ⚠️ WHAT THIS DOES *NOT* DO IS RESUME. Watching stops when the modal closes —
 * that cancels the poll, not the generation. Picking a run back up on return
 * belongs to useProductHistory, which finds it still "processing" in history;
 * see the `pending` list there.
 *
 * This is Magic Studio's useMagicGenerate watch, for Product Studio's endpoint —
 * same schedule, same rules, so a wait behaves the same wherever it was started.
 */

import {
  checkProductGenerationStatus,
  extractProductGenerationId,
  getProductGenerationError,
  getProductGenerationStatus,
  getProductHistory,
  productResultUrl,
} from "@/(lib)/product-studio-api";
import {
  POLL_CEILING_MS,
  nextPollDelay,
} from "@/app/(components)/magic-studio/pollSchedule";

/**
 * A run is only recognised as "the one we just started" if its record was
 * created no earlier than this before we pressed go. Guards the case where the
 * id snapshot couldn't be taken (a failed history call) — without it, some
 * unrelated older record could be adopted and watched instead.
 */
const CLOCK_SLACK_MS = 10 * 1000;

/**
 * The highest generation id this tool has right now — the line between "already
 * existed" and "this is mine".
 *
 * ⚠️ TAKEN BEFORE THE REQUEST IS FIRED, which costs one extra round trip on the
 * way in. That is the price of being able to watch a run whose id we never
 * receive: the id normally arrives in the response, and the whole point here is
 * not to depend on that response arriving. Ids are a single ascending sequence,
 * so "greater than everything that was here a moment ago" identifies the new
 * record exactly.
 *
 * @param {string} tool Backend tool enum (e.g. "product_video").
 * @returns {Promise<number|null>} null when history couldn't be read — the watch
 *   still works, it just leans on the timestamp check instead.
 */
export async function latestProductGenerationId(tool) {
  try {
    const items = await getProductHistory(tool);
    const ids = items
      .map((item) => Number(item.id))
      .filter((id) => Number.isFinite(id));
    return ids.length > 0 ? Math.max(...ids) : 0;
  } catch (err) {
    console.warn(
      "⚠️ [product-studio] couldn't snapshot history before generating:",
      err?.message,
    );
    return null;
  }
}

/**
 * Find the record this run created, or null if it hasn't appeared yet. The row
 * is written when the request arrives rather than when it finishes, which is
 * what makes it findable long before there is any result to fetch.
 *
 * @param {string} tool
 * @param {number|null} sinceId Highest id that existed before the run started.
 * @param {number} startedAt Epoch ms when the run started.
 * @returns {Promise<number|null>}
 */
async function findNewProductGenerationId(tool, sinceId, startedAt) {
  const items = await getProductHistory(tool);
  const ids = items
    .filter((item) => {
      const created = Date.parse(item.startedAt || item.createdAt || "");
      if (Number.isFinite(created) && created < startedAt - CLOCK_SLACK_MS) {
        return false;
      }
      const id = Number(item.id);
      if (!Number.isFinite(id)) return false;
      return sinceId == null ? true : id > sinceId;
    })
    .map((item) => Number(item.id));

  return ids.length > 0 ? Math.max(...ids) : null;
}

/**
 * Follow one run to its end.
 *
 * Resolves with exactly one of:
 *   { result: { url, data }, jobId } the finished generation
 *   { failed: true, error, jobId }   the backend recorded a failure
 *   { timedOut: true }               still going after POLL_CEILING_MS
 *   { cancelled: true }              the modal closed / a new run started
 *
 * ⚠️ A FAILED TICK IS NOT A FAILED RUN. One unreachable status check — a dropped
 * connection, a blip — is logged and retried on the next beat. Only the record
 * itself saying "failed" ends the run, because a job that takes four minutes
 * will out-live at least one bad request often enough for the alternative to be
 * a wait that ends in a shrug halfway through.
 *
 * @param {object} args
 * @param {string} args.tool Backend tool enum, for the id fallback.
 * @param {number|null} args.sinceId Snapshot from {@link latestProductGenerationId}.
 * @param {number} args.startedAt Epoch ms when the run started.
 * @param {{cancelled: boolean, timer: *, wake: (() => void)|null,
 *          jobId: (string|number|null)}} args.run Mutable handle the caller
 *   holds so it can cancel this watch — and hand it the id the moment the
 *   generate response reveals one (see `run.jobId`).
 * @returns {Promise<object>}
 */
export async function watchProductGeneration({
  tool,
  sinceId,
  startedAt,
  run,
}) {
  let jobId = run.jobId ?? null;

  while (!run.cancelled) {
    // Wait first: nothing can possibly be ready the instant the request leaves.
    //
    // ⚠️ `run.wake` LETS A CANCEL END THE WAIT IMMEDIATELY. Clearing the timer
    // alone would leave this promise pending forever, and with it everything
    // awaiting the watch — so a run that settled some other way would never
    // reach its own `finally`.
    await new Promise((resolve) => {
      run.wake = resolve;
      run.timer = setTimeout(resolve, nextPollDelay(Date.now() - startedAt));
    });
    if (run.cancelled) return { cancelled: true };
    if (Date.now() - startedAt > POLL_CEILING_MS) return { timedOut: true };

    try {
      // The generate response may have landed while we were sleeping and put
      // the real id here — always prefer it to another history sweep.
      if (jobId == null && run.jobId != null) jobId = run.jobId;

      if (jobId == null) {
        jobId = await findNewProductGenerationId(tool, sinceId, startedAt);
        if (jobId != null) {
          console.log(`👀 [product-studio] watching generation ${jobId}`);
        }
        continue;
      }

      const data = await checkProductGenerationStatus(jobId);
      const status = getProductGenerationStatus(data);
      if (status === "completed") {
        return { result: { url: productResultUrl(data), data }, jobId };
      }
      if (status === "failed") {
        return { failed: true, error: getProductGenerationError(data), jobId };
      }
    } catch (err) {
      console.warn(
        `⚠️ [product-studio] status check failed (retrying): ${err?.message}`,
      );
    }
  }

  return { cancelled: true };
}

/** Re-exported so callers don't need a second import to read a response's id. */
export { extractProductGenerationId };
