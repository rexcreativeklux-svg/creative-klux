"use client";

/**
 * useMagicGenerate — generate orchestration for every Magic Studio surface: the
 * /magic-studio composer, the Add Media picker's Magic Studio tab, and the
 * editor's Magic Studio panel. All three drive this one machine, so the wait
 * behaves identically wherever a tool is used.
 *
 *   validate → config.generate({ input, values, activeBrand, tts, stt })
 *     • backend tools → WATCH the run to completion, then hand it over
 *     • on-device (tts/stt) → the engine resolves with the result directly
 *
 * ⚠️ THE RUN IS WATCHED, NOT AWAITED. `POST /magic-studio/generate` does not
 * reliably answer with the result: today it blocks for the whole job and then
 * returns it (measured 46s for one image, 106s for two, 240s for four), and the
 * response already carries a `queued` flag for the day that work moves onto a
 * queue and comes back as `{ status: "processing" }` instead. Waiting on that
 * request alone means the loading state is only as good as a four-minute XHR
 * that a proxy, a flaky connection or a backgrounded tab can end at any point —
 * and when it does, the user is told nothing came back while the backend
 * happily finishes and files the result in history.
 *
 * So the request is fired and, in parallel, the RUN is followed through
 * `GET /magic-studio/generations/{id}/status`. Whichever gets there first
 * settles it. That makes the wait survive the request, and means nothing here
 * changes on the day the backend starts queueing — the poll is already the
 * primary path and the response is the shortcut.
 *
 * The request is still awaited for its ERRORS, which the poll cannot see: a
 * rejected input (422), an expired token (401) and the credits limit (402) all
 * live on that response and never become a record to poll.
 *
 * ⚠️ WHAT THIS DOES *NOT* DO IS RESUME. Watching stops when the surface
 * unmounts — leaving the page cancels the poll, not the generation. Picking a
 * run back up on return belongs to useMagicHistory, which finds it still
 * "processing" in history; see the pending list there.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getGenerationError,
  getGenerationStatus,
  normalizeStatusResult,
} from "@/app/(dashboard)/(pages)/magic-studio/magicStudioConfigs";
import {
  checkGenerationStatus,
  getMagicHistory,
} from "@/(lib)/magic-studio-api";
import { POLL_CEILING_MS, nextPollDelay } from "./pollSchedule";

/**
 * Ceiling on the composer's variations slider — the top of its 1–30 range, and
 * the last word on what may reach the API.
 *
 * ⚠️ EXPORTED SO THE SLIDER AND THE CLAMP CANNOT DRIFT. The composer imports
 * this for its `max`; hard-coding 30 in both is how a widened slider silently
 * starts sending values this hook quietly cuts back down.
 *
 * ⚠️ IT IS THE BACKEND THAT FANS OUT — `values.variations` rides in the payload
 * and one request comes back with that many assets. The clamp is still real
 * money: 30 is thirty billed generations from one press of Enter, and on the
 * video tools that is thirty renders. It is enforced here rather than trusted
 * from the caller, because the slider is a UI affordance and not a guarantee.
 */
export const MAX_VARIATIONS = 30;

/**
 * A run is only recognised as "the one we just started" if its record was
 * created no earlier than this before we pressed go. Guards the case where the
 * id snapshot below couldn't be taken (a failed history call) — without it,
 * some unrelated older record could be adopted and watched instead.
 */
const CLOCK_SLACK_MS = 10 * 1000;

/**
 * The highest generation id this tool has right now — the line between "already
 * existed" and "this is mine".
 *
 * ⚠️ TAKEN BEFORE THE REQUEST IS FIRED, which costs one extra round trip on the
 * way in. That is the price of being able to watch a run without having its id:
 * the id only exists in the response, and the whole point here is not to depend
 * on that response arriving. Ids are a single ascending sequence, so "greater
 * than everything that was here a moment ago" identifies the new record exactly.
 *
 * @param {string} tool Backend tool enum.
 * @returns {Promise<number|null>} null when history couldn't be read — the watch
 *   still works, it just leans on the timestamp check instead.
 */
async function latestGenerationId(tool) {
  try {
    const items = await getMagicHistory(tool);
    const ids = items
      .map((item) => Number(item.generationId))
      .filter((id) => Number.isFinite(id));
    return ids.length > 0 ? Math.max(...ids) : 0;
  } catch (err) {
    console.warn(
      "⚠️ [magic-studio] couldn't snapshot history before generating:",
      err?.message,
    );
    return null;
  }
}

/**
 * Find the record this run created, or null if it hasn't appeared yet.
 *
 * The row is written when the request arrives rather than when it finishes —
 * measured showing up within ~6s — which is what makes it findable long before
 * there is any result to fetch.
 *
 * @param {string} tool
 * @param {number|null} sinceId Highest id that existed before the run started.
 * @param {number} startedAt Epoch ms when the run started.
 * @returns {Promise<number|null>}
 */
async function findNewGenerationId(tool, sinceId, startedAt) {
  const items = await getMagicHistory(tool);
  const ids = items
    .filter((item) => {
      const created = Date.parse(item.startedAt || item.createdAt || "");
      if (Number.isFinite(created) && created < startedAt - CLOCK_SLACK_MS) {
        return false;
      }
      const id = Number(item.generationId);
      if (!Number.isFinite(id)) return false;
      return sinceId == null ? true : id > sinceId;
    })
    .map((item) => Number(item.generationId));

  return ids.length > 0 ? Math.max(...ids) : null;
}

/**
 * Follow one run to its end.
 *
 * Resolves with exactly one of:
 *   { result }              the finished, normalized result
 *   { failed: true, error } the backend recorded a failure
 *   { timedOut: true }      still going after POLL_CEILING_MS
 *   { cancelled: true }     the surface unmounted / a new run started
 *
 * ⚠️ A FAILED TICK IS NOT A FAILED RUN. One unreachable status check — a dropped
 * connection, a blip — is logged and retried on the next beat. Only the record
 * itself saying "failed" ends the run, because a job that takes four minutes
 * will out-live at least one bad request often enough for the alternative to be
 * a wait that ends in a shrug halfway through.
 */
async function watchRun({ tool, sinceId, startedAt, resultType, run }) {
  let jobId = null;

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
      if (jobId == null) {
        jobId = await findNewGenerationId(tool, sinceId, startedAt);
        if (jobId != null) {
          console.log(`👀 [magic-studio] watching generation ${jobId}`);
        }
        continue;
      }

      const data = await checkGenerationStatus(jobId);
      const status = getGenerationStatus(data);
      if (status === "completed") {
        return { result: normalizeStatusResult(data, resultType), jobId };
      }
      if (status === "failed") {
        return { failed: true, error: getGenerationError(data), jobId };
      }
    } catch (err) {
      console.warn(
        `⚠️ [magic-studio] status check failed (retrying): ${err?.message}`,
      );
    }
  }

  return { cancelled: true };
}

/**
 * @param {object} args
 * @param {object} args.config       Active tool config (getMagicConfig).
 * @param {boolean} args.usesHistory Backend tool + logged in → results live in history.
 * @param {{ refresh: () => Promise<void> }} [args.history] History controller (backend only).
 * @param {object} args.tts          On-device TTS engine (useTextToSpeech).
 * @param {object} args.stt          On-device STT engine (useSpeechToText).
 * @param {(res: object|null) => void} args.onResult Receives a session result (on-device / logged-out).
 * @param {() => void} [args.beforeGenerate] Called before a run starts (e.g. stop voice preview).
 * @returns {{ generating: boolean, error: string, setError: Function, generate: Function }}
 */
export default function useMagicGenerate({
  config,
  usesHistory,
  history,
  tts,
  stt,
  onResult,
  beforeGenerate,
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // The watch in flight, so it can be called off on unmount or when the run
  // settles some other way.
  const runRef = useRef({ cancelled: true, timer: null, wake: null });
  const cancelWatch = useCallback(() => {
    const run = runRef.current;
    run.cancelled = true;
    if (run.timer) clearTimeout(run.timer);
    run.timer = null;
    // Ends the current wait rather than leaving it pending — see watchRun.
    run.wake?.();
    run.wake = null;
  }, []);
  useEffect(() => cancelWatch, [cancelWatch]);

  const generate = useCallback(
    async ({ primaryInput, values, activeBrand }) => {
      const err = config.validate?.({ input: primaryInput, values });
      if (err) {
        setError(err);
        toast.error(err);
        return;
      }
      setError("");
      beforeGenerate?.();
      setGenerating(true);

      // ⚠️ CLAMPED ON THE WAY IN, not trusted from the caller. `variations`
      // reaches the API from here, and the composer's own list of choices is
      // a UI affordance rather than a guarantee about what arrives.
      const requested = Number(values?.variations);
      const variations = Number.isFinite(requested)
        ? Math.max(1, Math.min(MAX_VARIATIONS, Math.floor(requested)))
        : 1;
      const args = {
        input: primaryInput,
        values: { ...values, variations },
        activeBrand,
        tts,
        stt,
      };

      try {
        // ── On-device tools: nothing to watch ──────────────────────────────
        // Whisper and Kokoro run in a Web Worker on this machine. There is no
        // record, no id and no endpoint — the engine simply resolves.
        if (config.onDevice || !config.historyTool) {
          const res = await config.generate(args);
          await deliver(res);
          return;
        }

        // ── Backend tools: fire, and watch ─────────────────────────────────
        const tool = config.historyTool;
        const sinceId = await latestGenerationId(tool);
        const startedAt = Date.now();

        const request = config.generate(args);
        // The race below handles the rejection; this only keeps Node/the browser
        // from reporting it as unhandled in the window before that happens, and
        // in the case where the watch wins and nobody reads the response at all.
        request.catch(() => {});

        cancelWatch();
        const run = { cancelled: false, timer: null, wake: null };
        runRef.current = run;

        const resultType = config.resultType === "auto" ? null : config.resultType;
        const watch = watchRun({
          tool,
          sinceId,
          startedAt,
          // The persona generator is the one tool whose output type isn't fixed;
          // its own `generate` resolves the choice, so fall back to what the
          // composer asked for rather than mislabelling every asset "auto".
          resultType: resultType || values?.contentType || "image",
          run,
        });

        const outcome = await Promise.race([
          request.then((value) => ({ from: "request", value })),
          watch.then((value) => ({ from: "watch", value })),
        ]);

        // The response beat the watch. Either it carries the finished result —
        // in which case stop watching — or it says the work was queued, and the
        // watch we already have running is exactly what follows it.
        if (outcome.from === "request") {
          if (!outcome.value?.pending) {
            cancelWatch();
            await deliver(outcome.value);
            return;
          }
          toast(
            config.resultType === "video"
              ? "Your video is generating — this can take a minute…"
              : "Your result is generating — this can take a minute…",
          );
          await deliverWatch(await watch);
          return;
        }

        await deliverWatch(outcome.value);
      } catch (e) {
        // generateMagicStudio already surfaces a friendly toast; keep an
        // in-panel banner for context and log for debugging.
        console.error(`❌ [magic-studio:${config.id}] generate failed:`, e);
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Generation failed. Please try again.";
        setError(msg);
      } finally {
        cancelWatch();
        setGenerating(false);
      }

      /** Turn a watch outcome into a delivered result, or the right message. */
      async function deliverWatch(outcome) {
        if (outcome?.cancelled) return;

        if (outcome?.timedOut) {
          // Not an error, and deliberately not a red banner: the run is still
          // going and its result will be waiting in history. Saying "try again"
          // here would charge someone twice for the same picture.
          console.warn(
            `⏳ [magic-studio:${config.id}] still running past the poll ceiling`,
          );
          toast(
            "This is taking longer than usual — it'll be in your history as soon as it's done.",
          );
          history?.refresh?.();
          return;
        }

        if (outcome?.failed) {
          // The record's own `error` where there is one. "Please try again" is
          // the wrong advice for a rejected input — the same request fails the
          // same way forever — and the backend usually says exactly which field
          // the provider refused.
          if (outcome.error) {
            console.error(
              `❌ [magic-studio] generation ${outcome.jobId} failed:`,
              outcome.error,
            );
          }
          throw new Error(outcome.error || "Generation failed. Please try again.");
        }

        await deliver(outcome?.result);
      }

      /** Hand a finished result to whoever is showing results on this surface. */
      async function deliver(res) {
        // ⚠️ COUNTED OFF THE RESULT, NOT OFF `variations`. Asking for four is
        // not the same as getting four — the backend may cap, dedupe or
        // partially fail — and a toast that reports the request rather than the
        // result would claim four images on a canvas showing two.
        const made = res?.assets?.length || 0;
        const done =
          made > 1
            ? `${made} generated successfully!`
            : res?.resultType === "video"
              ? "Your video is ready!"
              : "Generated successfully!";

        if (usesHistory) {
          // Backend tools persist the result — refresh history rather than
          // keeping a session-only list.
          await history?.refresh?.();
          toast.success(done);
          return;
        }

        onResult(res);
        if (made > 0 || res?.text) {
          toast.success(done);
        } else {
          toast("Nothing came back — try adjusting your inputs.");
        }
      }
    },
    [
      config,
      usesHistory,
      history,
      tts,
      stt,
      onResult,
      beforeGenerate,
      cancelWatch,
    ],
  );

  return { generating, error, setError, generate };
}
