"use client";

/**
 * useMagicGenerate — generate orchestration for a Magic Studio tab embedded in
 * the media picker. Wraps the shared config machine's generate flow so the panel
 * only has to supply the current inputs:
 *
 *   validate → config.generate({ input, values, activeBrand, tts, stt })
 *     • async video jobs ({ pending, jobId }) → poll status until done
 *     • backend tools (usesHistory) → refresh history (new item appears on top)
 *     • on-device / logged-out → hand the session result back via onResult
 *
 * Mirrors handleGenerate in the standalone MagicStudioModal (the machine is
 * reused; only the surrounding layout differs). The on-device engines (tts/stt)
 * are passed straight through to config.generate — same engines the standalone
 * modal uses.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getVideoError,
  getVideoStatus,
  normalizeVideoResult,
} from "@/app/(dashboard)/(pages)/magic-studio/magicStudioConfigs";
import { checkVideoGenerationStatus } from "@/(lib)/magic-studio-api";

const VIDEO_POLL_INTERVAL_MS = 15000;
const VIDEO_POLL_MAX_ATTEMPTS = 20; // 20 × 15s ≈ 5 minutes

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

  // Holds the in-flight video status poll so it can be cancelled on unmount.
  const pollRef = useRef({ cancelled: false, timer: null });
  useEffect(
    () => () => {
      pollRef.current.cancelled = true;
      if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    },
    [],
  );

  // Poll a pending video job until it completes. Resolves with the final status
  // payload; rejects on backend failure or after ~5 minutes.
  const pollVideoJob = useCallback(
    (jobId) =>
      new Promise((resolve, reject) => {
        pollRef.current = { cancelled: false, timer: null };
        let attempts = 0;
        const tick = async () => {
          if (pollRef.current.cancelled) return;
          attempts += 1;
          try {
            const data = await checkVideoGenerationStatus(jobId);
            if (pollRef.current.cancelled) return;
            const status = getVideoStatus(data);
            if (status === "completed") return resolve(data);
            if (status === "failed") {
              // The record's own `error` where there is one. "Please try again"
              // is the wrong advice for a rejected input — the same request
              // fails the same way forever — and the backend usually says
              // exactly which field the provider refused.
              const reason = getVideoError(data);
              if (reason) {
                console.error(
                  `❌ [magic-studio] video job ${jobId} failed:`,
                  reason,
                );
              }
              return reject(
                new Error(reason || "Video generation failed. Please try again."),
              );
            }
            if (attempts >= VIDEO_POLL_MAX_ATTEMPTS) {
              toast.error(
                "Your video is taking longer than expected. Check your history shortly for the video.",
              );
              return reject(
                new Error(
                  "Your video is taking longer than expected. Check your gallery shortly.",
                ),
              );
            }
            pollRef.current.timer = setTimeout(tick, VIDEO_POLL_INTERVAL_MS);
          } catch (err) {
            if (pollRef.current.cancelled) return;
            reject(err);
          }
        };
        pollRef.current.timer = setTimeout(tick, VIDEO_POLL_INTERVAL_MS);
      }),
    [],
  );

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
      try {
        // ⚠️ CLAMPED ON THE WAY IN, not trusted from the caller. `variations`
        // reaches the API from here, and the composer's own list of choices is
        // a UI affordance rather than a guarantee about what arrives.
        const requested = Number(values?.variations);
        const variations = Number.isFinite(requested)
          ? Math.max(1, Math.min(MAX_VARIATIONS, Math.floor(requested)))
          : 1;

        const res = await config.generate({
          input: primaryInput,
          values: { ...values, variations },
          activeBrand,
          tts,
          stt,
        });

        // Async video jobs come back as { pending, jobId } — poll until done.
        if (res?.pending) {
          if (!res.jobId) {
            throw new Error("Video started but no job id was returned.");
          }
          toast("Your video is generating — this can take a minute…");
          const finalData = await pollVideoJob(res.jobId);
          if (usesHistory) {
            await history?.refresh();
            toast.success("Your video is ready!");
          } else {
            const finalResult = normalizeVideoResult(finalData);
            onResult(finalResult);
            toast.success(
              finalResult.assets?.length
                ? "Your video is ready!"
                : "Video finished but no file came back.",
            );
          }
        } else if (usesHistory) {
          // Backend tools persist the result — refresh history rather than
          // keeping a session-only list.
          await history?.refresh();
          // ⚠️ COUNTED OFF THE RESPONSE, NOT OFF `variations`. Asking for four
          // is not the same as getting four — the backend may cap, dedupe or
          // partially fail — and a toast that reports the request rather than
          // the result would claim four images on a canvas showing two.
          const made = res?.assets?.length || 0;
          toast.success(
            made > 1 ? `${made} generated successfully!` : "Generated successfully!",
          );
        } else {
          onResult(res);
          if (res?.assets?.length || res?.text) {
            toast.success("Generated successfully!");
          } else {
            toast("Nothing came back — try adjusting your inputs.");
          }
        }
      } catch (e) {
        // generateMagicStudio already surfaces a friendly toast; keep an in-panel
        // banner for context and log for debugging.
        console.error(`❌ [magic-studio:${config.id}] generate failed:`, e);
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Generation failed. Please try again.";
        setError(msg);
      } finally {
        setGenerating(false);
      }
    },
    [config, usesHistory, history, tts, stt, onResult, beforeGenerate, pollVideoJob],
  );

  return { generating, error, setError, generate };
}
