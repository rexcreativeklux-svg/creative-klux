// Main-thread client for the TTS worker (Kokoro-82M via kokoro-js).

import { createWorkerClient } from "../core/workerRpc";

const client = createWorkerClient(
  () =>
    new Worker(new URL("../workers/tts.worker.js", import.meta.url), {
      type: "module",
    }),
  "tts",
);

/** Free the worker and its model — call when leaving the tool page. */
export function disposeTtsWorker() {
  client.dispose();
}

/**
 * Turn text into speech, fully on-device. First-ever run downloads the voice
 * engine once (~93 MB, then cached offline); after that it's local and free.
 * Long text is chunked at sentence/clause boundaries in the worker, so scripts
 * up to the UI's 2000-char limit never cut off.
 *
 * @param {string} text What to say (English).
 * @param {{
 *   voice?: string, speed?: number,
 *   format?: "mp3"|"wav", quality?: "standard"|"high"|"studio",
 *   onProgress?: Function,
 * }} [opts]
 *   `voice` is a Kokoro voice id from KOKORO_TTS.voices (e.g. "af_heart").
 * @returns {Promise<{blob: Blob, duration: number, sampleRate: number, voice: string, format: string}>}
 *   `blob` is an MP3 or WAV file; `duration` is in seconds.
 */
export async function synthesizeSpeech(
  text,
  { voice, speed = 1, format = "mp3", quality = "high", onProgress } = {},
) {
  return client.call({ task: "tts", text, voice, speed, format, quality }, [], onProgress);
}
