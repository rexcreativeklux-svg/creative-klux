// Speech-to-text worker — Whisper Base (multilingual) through transformers.js,
// on its own ONNX runtime. Runs on WASM: onnxruntime-web's WebGPU backend
// miscomputes this q8 model on many drivers — it doesn't error (so a warmup
// can't catch it), it just feeds the decoder garbage encoder features and
// Whisper hallucinates repeated word-salad. The depth worker hit the same class
// of WebGPU issue and made the same call. whisper-base q8 is small enough that
// WASM stays responsive, and long audio is chunked with per-window progress.
// Fully self-hosted, like the depth + Kokoro workers: model + tokenizer from
// /models/whisper-base/, runtime .wasm from /ort-hf/ — nothing leaves our origin.
//
// PREMIUM PIPELINE (what makes this the "advanced" engine):
//   1. Input     — the audio is decoded + resampled to 16 kHz mono ON THE MAIN
//                  THREAD (AudioContext isn't available in workers) and handed
//                  here as a Float32Array, so the worker only does inference.
//   2. Long form — Whisper natively handles 30 s at a time; the pipeline chunks
//                  long audio (30 s window, 5 s stride) and stitches the overlap,
//                  so multi-minute files transcribe fully instead of truncating.
//   3. Quality   — tiered decoding on ONE model: fast/balanced = greedy (the
//                  reliable default), accurate = beam search (best precision).
//   4. Format    — Whisper already punctuates + cases; formatTranscript shapes
//                  its output into plain / punctuated / paragraphs / timestamped.
//
// Protocol (postMessage):
//   in : { id, task: "stt", samples (Float32Array, transferred), sampleRate,
//          durationSec, language, format, quality }
//   out: { id, type: "progress", pct, stage, downloading }
//        { id, type: "done", text, words, durationSec, language }
//        { id, type: "error", message }

import { env, pipeline } from "@huggingface/transformers";
import { WHISPER_STT } from "../models";
import { formatTranscript, countWords } from "../tasks/formatTranscript";

// Self-host: resolve the model id against /models/ (never hit huggingface.co),
// and load transformers.js's OWN onnxruntime-web wasm from /ort-hf/.
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = WHISPER_STT.localModelPath; // "/models"
env.backends.onnx.wasm.wasmPaths = WHISPER_STT.wasmPaths; // "/ort-hf/"
if (!self.crossOriginIsolated) env.backends.onnx.wasm.numThreads = 1;

// ── Tunables ─────────────────────────────────────────────────────────────────
const CHUNK_LENGTH_S = 30; // Whisper's native window
const STRIDE_LENGTH_S = 5; // overlap between windows (must be < CHUNK_LENGTH_S)
// Formats that need segment-level timestamps from the model.
const NEEDS_TIMESTAMPS = new Set(["paragraphs", "timestamped"]);
// Beam width per quality tier. Greedy (1) is the rock-solid default; beam search
// is the opt-in "accurate" tier. One model — a real speed/accuracy tradeoff.
const BEAMS = { fast: 1, balanced: 1, accurate: 5 };

let transcriberPromise = null;

self.onmessage = async (event) => {
  const { id, task, samples, sampleRate, durationSec, language, format, quality } = event.data;
  const progress = (pct, stage, downloading = false) =>
    self.postMessage({ id, type: "progress", pct, stage, downloading });

  try {
    if (task !== "stt") throw new Error(`Unknown task "${task}"`);
    const result = await transcribe(
      { samples, sampleRate, durationSec, language, format, quality },
      progress,
    );
    self.postMessage({ id, type: "done", ...result });
  } catch (err) {
    console.error("❌ AI engine STT worker failed:", err);
    // Some ORT/WASM aborts surface as a raw value, not an Error — give the UI a
    // human message either way.
    const message = err?.message || (typeof err === "string" ? err : "Transcription failed.");
    self.postMessage({ id, type: "error", message });
  }
};

/** Load the ASR pipeline once per worker life (WASM); a failed load doesn't poison retries. */
function getTranscriber(progress) {
  if (transcriberPromise) return transcriberPromise;

  // transformers.js streams file download/load events — map onto our bar.
  const onProgress = (p) => {
    if (p.status === "progress" && typeof p.progress === "number") {
      progress(Math.round((p.progress || 0) * 0.6), "model", true); // 0→60% while weights download
    }
  };

  transcriberPromise = pipeline("automatic-speech-recognition", WHISPER_STT.modelId, {
    dtype: WHISPER_STT.dtype,
    device: "wasm",
    progress_callback: onProgress,
  })
    .then((transcriber) => {
      console.log("✅ AI engine: Whisper STT ready on wasm");
      return transcriber;
    })
    .catch((err) => {
      transcriberPromise = null;
      throw err;
    });
  return transcriberPromise;
}

/**
 * Ease the progress bar from `from`→`to` while Whisper decodes. The pipeline
 * runs its 30 s windows internally with no per-window hook, so we tick a smooth
 * asymptotic climb (never reaching `to`) until generation returns.
 * @returns {() => void} Stop function.
 */
function startProgressTicker(progress, from = 62, to = 92) {
  let shown = from;
  let alive = true;
  const tick = () => {
    if (!alive) return;
    shown += Math.max(0.3, (to - shown) * 0.05);
    if (shown > to) shown = to;
    progress(Math.round(shown), "transcribe");
    setTimeout(tick, 450);
  };
  progress(from, "transcribe");
  setTimeout(tick, 450);
  return () => {
    alive = false;
  };
}

/** Transcribe 16 kHz mono samples → clean, formatted transcript + meta. */
async function transcribe({ samples, sampleRate, durationSec, language, format, quality }, progress) {
  if (!samples || samples.length === 0) throw new Error("The audio was empty — nothing to transcribe.");

  const tier = ["fast", "balanced", "accurate"].includes(quality) ? quality : "balanced";
  const wantTimestamps = NEEDS_TIMESTAMPS.has(format);
  // Multilingual model: a 2-letter code forces that language; null → auto-detect.
  const lang = language && language !== "auto" ? language : null;
  const durationSecs = durationSec || samples.length / (sampleRate || WHISPER_STT.sampleRate);

  console.log(
    `🎧 AI engine STT: received ${samples.length} samples @ ${sampleRate || WHISPER_STT.sampleRate} Hz ` +
      `(~${durationSecs.toFixed(1)}s), lang=${lang || "auto"}, quality=${tier}, format=${format}`,
  );

  const transcriber = await getTranscriber(progress);

  const options = {
    task: "transcribe",
    chunk_length_s: CHUNK_LENGTH_S,
    stride_length_s: STRIDE_LENGTH_S,
    return_timestamps: wantTimestamps,
    num_beams: BEAMS[tier],
  };
  if (lang) options.language = lang;

  const stopTicker = startProgressTicker(progress);
  let output;
  try {
    output = await transcriber(samples, options);
  } finally {
    stopTicker();
  }

  progress(95, "format");
  const rawText = String(output?.text || "").trim();
  console.log(`🎧 AI engine STT: whisper raw output (${rawText.length} chars) → "${rawText.slice(0, 300)}"`);
  const text = formatTranscript(rawText, { format, chunks: output?.chunks || null });
  progress(100, "done");

  return {
    text,
    words: countWords(rawText),
    durationSec: durationSecs,
    language: lang || "auto",
  };
}
