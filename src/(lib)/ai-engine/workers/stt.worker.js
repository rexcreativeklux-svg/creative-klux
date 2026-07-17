// Speech-to-text worker — Whisper Base (multilingual) through transformers.js,
// on its own ONNX runtime. Runs on WASM: onnxruntime-web's WebGPU backend
// miscomputes this q8 model on many drivers — it doesn't error (so a warmup
// can't catch it), it just feeds the decoder garbage encoder features and
// Whisper hallucinates repeated word-salad. whisper-base q8 is small enough
// that WASM stays responsive, and long audio is chunked with per-window
// progress. Fully self-hosted, like the Kokoro worker: model + tokenizer from
// /models/whisper-base/, runtime .wasm from /ort-hf/ — nothing leaves our origin.
//
// PREMIUM PIPELINE (what makes this the "advanced" engine):
//   1. Input     — the audio is decoded + resampled to 16 kHz mono ON THE MAIN
//                  THREAD (AudioContext isn't available in workers) and handed
//                  here as a Float32Array, so the worker only does inference.
//   2. Detect    — "auto" runs a REAL language-identification pass (one decoder
//                  step on the first 30 s). transformers.js has NO built-in
//                  detection — omitting `language` silently forces English — so
//                  we detect ourselves, then force the detected language for
//                  the whole run (keeps long audio from flip-flopping between
//                  languages across 30 s windows).
//   3. Long form — Whisper natively handles 30 s at a time; the pipeline chunks
//                  long audio (30 s window, 5 s stride) and stitches the overlap,
//                  so multi-minute files transcribe fully instead of truncating.
//   4. Live      — greedy tiers stream the transcript AS IT'S DECODED
//                  (WhisperTextStreamer): the UI shows text appearing live plus
//                  real progress from the audio timestamps being processed.
//   5. Quality   — tiered decoding on ONE model: fast/balanced = greedy (the
//                  reliable default), accurate = beam search (best precision).
//   6. Format    — Whisper already punctuates + cases; formatTranscript shapes
//                  its output into plain / punctuated / paragraphs / timestamped,
//                  and timed segments are always returned for SRT/VTT export.
//
// Protocol (postMessage):
//   in : { id, task: "stt", samples (Float32Array, transferred), sampleRate,
//          durationSec, language, format, quality }
//   out: { id, type: "progress", pct, stage, downloading,
//          detectedLanguage?, partialText? }
//        { id, type: "done", text, words, durationSec, language, detected,
//          segments: [{ text, start, end }] }
//        { id, type: "error", message }

import { env, pipeline, WhisperTextStreamer } from "@huggingface/transformers";
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
// Beam width per quality tier. Greedy (1) is the rock-solid default; beam search
// is the opt-in "accurate" tier. One model — a real speed/accuracy tradeoff.
const BEAMS = { fast: 1, balanced: 1, accurate: 5 };
// Throttle for live-transcript progress posts (~3.5/sec keeps the UI smooth
// without flooding postMessage with ever-growing strings).
const PARTIAL_POST_MS = 280;

let transcriberPromise = null;

self.onmessage = async (event) => {
  const { id, task, samples, sampleRate, durationSec, language, format, quality } = event.data;
  const progress = (pct, stage, downloading = false, extra = null) =>
    self.postMessage({ id, type: "progress", pct, stage, downloading, ...(extra || {}) });

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
 * REAL language identification. transformers.js 3.x has no built-in detection —
 * when no `language` is passed it warns and forces <|en|> (see models.js
 * `_retrieve_init_tokens`), which mangles non-English audio. Instead we run ONE
 * decoder step on the first 30 s: seeding `decoder_input_ids` with only
 * <|startoftranscript|> bypasses the forced-English init tokens, so the model's
 * first predicted token IS the language token (e.g. <|fr|>) — exactly how
 * OpenAI's own detect_language works.
 * @param {object} transcriber The loaded ASR pipeline (model + processor + tokenizer).
 * @param {Float32Array} samples 16 kHz mono samples (only the head is used).
 * @returns {Promise<string>} Whisper language code (e.g. "fr"); "en" on failure.
 */
async function detectLanguage(transcriber, samples) {
  const windowSamples = CHUNK_LENGTH_S * WHISPER_STT.sampleRate;
  const head = samples.length > windowSamples ? samples.subarray(0, windowSamples) : samples;
  const { input_features } = await transcriber.processor(head);
  const sot = transcriber.model.config.decoder_start_token_id; // <|startoftranscript|>
  const output = await transcriber.model.generate({
    inputs: input_features,
    decoder_input_ids: [sot], // 1-D, mirrors init_tokens' shape — skips forced <|en|>
    max_new_tokens: 1,
  });
  const decoded = transcriber.tokenizer.decode(output.tolist()[0], { skip_special_tokens: false });
  // Language tokens are the only 2-3 lowercase-letter specials in Whisper's
  // vocab (<|en|>, <|fr|>, <|haw|>, …) — longer specials like <|transcribe|>
  // can't match.
  const match = decoded.match(/<\|([a-z]{2,3})\|>/);
  if (!match) {
    console.warn(`⚠️ AI engine STT: language detection got "${decoded}" — falling back to English.`);
    return "en";
  }
  return match[1];
}

/**
 * WhisperTextStreamer wiring for the greedy tiers: live partial transcript +
 * REAL progress from the audio timestamps being decoded. The pipeline generates
 * one 30 s window at a time, each advancing CHUNK_LENGTH_S − 2·STRIDE_LENGTH_S
 * = 20 s, and the streamer's chunk times are RELATIVE to the current window —
 * absolute audio time = windowIndex·jump + chunkTime. `on_finalize` fires once
 * per window (generate() calls streamer.end() after each), which is how windows
 * are counted; one streamer instance is safely reused across all windows.
 *
 * Window overlap means seam text repeats between consecutive windows, so the
 * preview trims each window to the region it "owns" ([stride, chunk − stride],
 * widened at the clip edges). The FINAL text still comes from the pipeline's
 * real overlap merge (`_decode_asr`) — this stream is a live preview only.
 * @returns {WhisperTextStreamer}
 */
function createLiveStreamer(transcriber, { samplesLength, durationSec, progress }) {
  const rate = WHISPER_STT.sampleRate;
  const jumpSec = CHUNK_LENGTH_S - 2 * STRIDE_LENGTH_S; // 20 s per window advance
  const windowSamples = CHUNK_LENGTH_S * rate;
  const jumpSamples = jumpSec * rate;
  // Mirrors the pipeline's own windowing loop (offset += jump until the end).
  const windowCount =
    samplesLength <= windowSamples
      ? 1
      : 1 + Math.ceil((samplesLength - windowSamples) / jumpSamples);
  const timePrecision =
    transcriber.processor.feature_extractor.config.chunk_length /
    transcriber.model.config.max_source_positions; // 30 / 1500 = 0.02 s per token

  let windowIndex = 0;
  let committedText = ""; // finished windows, seam-trimmed
  let windowPieces = []; // [{ text, chunkStart }] for the in-flight window
  let currentChunkStart = 0; // last on_chunk_start time (window-relative seconds)
  let lastPct = 62;
  let lastPostAt = 0;

  // A window "owns" [stride, chunk − stride]; the first/last windows extend to
  // their outer edge. Live view keeps the right overlap too (it's the freshest
  // text) — only the committed text trims both sides.
  const keepLive = (p) => windowIndex === 0 || p.chunkStart >= STRIDE_LENGTH_S;
  const keepCommit = (p) =>
    (windowIndex === 0 || p.chunkStart >= STRIDE_LENGTH_S) &&
    (windowIndex === windowCount - 1 || p.chunkStart < CHUNK_LENGTH_S - STRIDE_LENGTH_S);
  const liveText = () =>
    (committedText + windowPieces.filter(keepLive).map((p) => p.text).join("")).trim();

  const postPartial = (force = false) => {
    const now = Date.now();
    if (!force && now - lastPostAt < PARTIAL_POST_MS) return;
    lastPostAt = now;
    progress(lastPct, "transcribe", false, { partialText: liveText() });
  };
  // Chunk timestamps arrive every few seconds of audio — cheap enough to post
  // unthrottled, and they're what makes the bar move for real.
  const updatePct = (chunkTime) => {
    const absSec = windowIndex * jumpSec + chunkTime;
    lastPct = Math.min(92, 62 + Math.round(30 * Math.min(1, absSec / Math.max(1, durationSec))));
    progress(lastPct, "transcribe");
  };

  const streamer = new WhisperTextStreamer(transcriber.tokenizer, {
    skip_prompt: true,
    time_precision: timePrecision,
    on_chunk_start: (t) => {
      currentChunkStart = t;
      updatePct(t);
    },
    callback_function: (piece) => {
      if (!piece) return;
      windowPieces.push({ text: piece, chunkStart: currentChunkStart });
      postPartial();
    },
    on_chunk_end: (t) => {
      updatePct(t);
    },
    on_finalize: () => {
      // One window finished (its tail piece was flushed by end() just before
      // this) — fold its owned region into the committed text and move on.
      committedText += windowPieces.filter(keepCommit).map((p) => p.text).join("");
      windowPieces = [];
      currentChunkStart = 0;
      // A window can end on an unpaired timestamp, which would flip the
      // streamer's start/end pairing for the NEXT window — re-arm it.
      streamer.waiting_for_timestamp = false;
      if (windowIndex < windowCount - 1) windowIndex += 1;
      postPartial(true);
    },
  });
  return streamer;
}

/** Transcribe 16 kHz mono samples → clean, formatted transcript + timed segments. */
async function transcribe({ samples, sampleRate, durationSec, language, format, quality }, progress) {
  if (!samples || samples.length === 0) throw new Error("The audio was empty — nothing to transcribe.");

  const tier = ["fast", "balanced", "accurate"].includes(quality) ? quality : "balanced";
  // Multilingual model: a 2-letter code forces that language; "auto" triggers
  // our real detection pass below (transformers.js itself can't auto-detect).
  let lang = language && language !== "auto" ? language : null;
  const durationSecs = durationSec || samples.length / (sampleRate || WHISPER_STT.sampleRate);

  console.log(
    `🎧 AI engine STT: received ${samples.length} samples @ ${sampleRate || WHISPER_STT.sampleRate} Hz ` +
      `(~${durationSecs.toFixed(1)}s), lang=${lang || "auto"}, quality=${tier}, format=${format}`,
  );

  const transcriber = await getTranscriber(progress);

  let detected = false;
  if (!lang) {
    progress(61, "detect");
    try {
      lang = await detectLanguage(transcriber, samples);
    } catch (err) {
      console.warn(
        "⚠️ AI engine STT: language detection failed — defaulting to English:",
        err?.message || err,
      );
      lang = "en";
    }
    detected = true;
    console.log(`🌐 AI engine STT: detected language "${lang}"`);
    progress(62, "detect", false, { detectedLanguage: lang });
  }

  // Beam search decodes several hypotheses at once — token streaming is only
  // meaningful (and only supported) for greedy decoding.
  const streaming = BEAMS[tier] === 1;
  const options = {
    task: "transcribe",
    language: lang, // ALWAYS forced now — detected or user-picked
    chunk_length_s: CHUNK_LENGTH_S,
    stride_length_s: STRIDE_LENGTH_S,
    return_timestamps: true, // timed segments for every run (SRT/VTT export)
    num_beams: BEAMS[tier],
  };
  if (streaming) {
    options.streamer = createLiveStreamer(transcriber, {
      samplesLength: samples.length,
      durationSec: durationSecs,
      progress,
    });
  }

  // Greedy tiers get real streamed progress; the beam tier has no per-token
  // hook, so it keeps the smooth synthetic climb.
  const stopTicker = streaming ? null : startProgressTicker(progress);
  let output;
  try {
    output = await transcriber(samples, options);
  } finally {
    stopTicker?.();
  }

  progress(95, "format");
  const rawText = String(output?.text || "").trim();
  console.log(`🎧 AI engine STT: whisper raw output (${rawText.length} chars) → "${rawText.slice(0, 300)}"`);
  const text = formatTranscript(rawText, { format, chunks: output?.chunks || null });
  // Timed segments for SRT/VTT export — the final chunk's end is often null
  // (a known Whisper long-form quirk); transcriptExports resolves it.
  const segments = (output?.chunks || [])
    .map((c) => ({
      text: String(c?.text || "").trim(),
      start: c?.timestamp?.[0] ?? null,
      end: c?.timestamp?.[1] ?? null,
    }))
    .filter((s) => s.text);
  progress(100, "done");

  return {
    text,
    words: countWords(rawText),
    durationSec: durationSecs,
    language: lang,
    detected,
    segments,
  };
}

/**
 * Ease the progress bar from `from`→`to` while Whisper decodes — used only by
 * the beam-search "accurate" tier, which can't stream (greedy tiers get real
 * progress from the streamer's audio timestamps instead).
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
