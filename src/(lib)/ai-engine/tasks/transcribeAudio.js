// Main-thread client for the STT worker (Whisper Base via transformers.js).
//
// Whisper wants 16 kHz mono audio, and the Web Audio API used to decode/resample
// it (AudioContext / OfflineAudioContext) exists ONLY on the main thread — so we
// do that here and hand the worker a ready Float32Array (transferred, zero-copy),
// exactly like the depth client decodes an image to a bitmap before inference.

import { createWorkerClient } from "../core/workerRpc";
import { WHISPER_STT } from "../models";

const client = createWorkerClient(
  () =>
    new Worker(new URL("../workers/stt.worker.js", import.meta.url), {
      type: "module",
    }),
  "stt",
);

/** Free the worker and its model — call when leaving the tool page. */
export function disposeSttWorker() {
  client.dispose();
}

const TARGET_RATE = WHISPER_STT.sampleRate; // 16000 — Whisper's expected rate
// Soft cap: a multi-hour upload could lock a device up for many minutes on WASM.
// Generous for narration / voice notes; raise here if longer clips are needed.
const MAX_DURATION_S = 30 * 60; // 30 minutes

const getAudioCtx = () =>
  (typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext)) || null;
const getOfflineCtx = () =>
  (typeof window !== "undefined" &&
    (window.OfflineAudioContext || window.webkitOfflineAudioContext)) ||
  null;

/** Promise wrapper around decodeAudioData (callback form → widest browser support). */
function decodeAudioData(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => ctx.decodeAudioData(arrayBuffer, resolve, reject));
}

/**
 * Decode an audio File/Blob and resample to 16 kHz mono Float32 samples.
 * @returns {Promise<{samples: Float32Array, durationSec: number}>}
 */
async function decodeToMono16k(fileOrBlob) {
  const AudioCtx = getAudioCtx();
  const OfflineCtx = getOfflineCtx();
  if (!AudioCtx || !OfflineCtx) {
    throw new Error("This browser can't decode audio for on-device transcription.");
  }

  const arrayBuffer = await fileOrBlob.arrayBuffer();
  if (!arrayBuffer.byteLength) throw new Error("That audio file is empty.");

  // A throwaway context just to turn compressed bytes into samples (no playback).
  const decodeCtx = new AudioCtx();
  let audioBuffer;
  try {
    audioBuffer = await decodeAudioData(decodeCtx, arrayBuffer);
  } catch {
    throw new Error(
      "Couldn't read that audio — it may be corrupt or in a format this browser can't decode.",
    );
  } finally {
    decodeCtx.close?.();
  }

  const durationSec = audioBuffer.duration;
  if (!durationSec || durationSec < 0.05) throw new Error("That audio is too short to transcribe.");
  if (durationSec > MAX_DURATION_S) {
    throw new Error(
      `That audio is about ${Math.round(durationSec / 60)} minutes long — please use a clip under ` +
        `${MAX_DURATION_S / 60} minutes for on-device transcription.`,
    );
  }

  // Already 16 kHz mono → use the samples as-is (transfer the buffer straight out).
  if (audioBuffer.sampleRate === TARGET_RATE && audioBuffer.numberOfChannels === 1) {
    return { samples: audioBuffer.getChannelData(0), durationSec };
  }

  // Otherwise render through an OfflineAudioContext, which resamples to 16 kHz and
  // downmixes to mono (1-channel destination) in a single pass.
  const frames = Math.max(1, Math.ceil(durationSec * TARGET_RATE));
  const offline = new OfflineCtx(1, frames, TARGET_RATE);
  const source = offline.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  return { samples: rendered.getChannelData(0), durationSec };
}

/**
 * Diagnostic: summarize the samples actually being fed to Whisper. Correct input
 * is 16 kHz mono Float32 in [-1, 1] with real energy (rms well above 0). Silent
 * or wrongly-scaled input is the #1 cause of Whisper hallucinating repeated
 * multilingual gibberish, so we log it and hard-fail on true silence.
 * @returns {number} rms
 */
function summarizeSamples(samples) {
  let min = Infinity;
  let max = -Infinity;
  let sumSq = 0;
  const n = samples.length;
  for (let i = 0; i < n; i++) {
    const v = samples[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sumSq += v * v;
  }
  const rms = Math.sqrt(sumSq / (n || 1));
  const first = Array.from(samples.slice(0, 8)).map((v) => v.toFixed(4));
  console.log(
    `🎧 klux-stt input: ${n} samples (~${(n / TARGET_RATE).toFixed(2)}s @ ${TARGET_RATE} Hz) · ` +
      `range=[${min.toFixed(4)}, ${max.toFixed(4)}] · rms=${rms.toFixed(4)} · first8=[${first.join(", ")}]`,
  );
  return rms;
}

/**
 * Transcribe an audio File/Blob fully on-device. First-ever run downloads the
 * Whisper engine once (~77 MB, then cached offline); after that it's local.
 *
 * @param {File|Blob} fileOrBlob The audio to transcribe.
 * @param {{
 *   language?: string, format?: "plain"|"punctuated"|"paragraphs"|"timestamped",
 *   quality?: "fast"|"balanced"|"accurate", onProgress?: Function,
 * }} [opts] `language` is a 2-letter code or "auto" (detect).
 * @returns {Promise<{text: string, words: number, durationSec: number, language: string}>}
 */
export async function transcribeAudio(
  fileOrBlob,
  { language = "auto", format = "punctuated", quality = "balanced", onProgress } = {},
) {
  if (!fileOrBlob) throw new Error("No audio provided.");

  onProgress?.({ pct: 2, stage: "prepare" });
  const { samples, durationSec } = await decodeToMono16k(fileOrBlob);

  // Verify we actually have real audio before spending time in the model.
  const rms = summarizeSamples(samples);
  if (rms < 1e-5) {
    throw new Error(
      "The audio decoded to silence — nothing to transcribe. If the file clearly has sound, this is a decoding problem, not your file.",
    );
  }
  onProgress?.({ pct: 8, stage: "prepare" });

  // Decode already ate 0→8%; compress the worker's own 0→100 into the rest.
  const relay = (p) => {
    if (!onProgress) return;
    const pct = typeof p.pct === "number" ? 8 + Math.round(p.pct * 0.92) : p.pct;
    onProgress({ ...p, pct });
  };

  return client.call(
    { task: "stt", samples, sampleRate: TARGET_RATE, durationSec, language, format, quality },
    [samples.buffer],
    relay,
  );
}
