// Text-to-speech worker — Kokoro-82M (Apache-2.0) through kokoro-js, running
// on transformers.js's own ONNX runtime (WASM — reliable everywhere at this
// model's q8 size). Everything is served from OUR origin:
//   /models/kokoro/…  model + tokenizer (transformers.js localModelPath)
//   /ort-hf/…         transformers.js's runtime .wasm (its own ort version)
//   voices            kokoro-js hard-codes huggingface.co URLs but checks the
//                     "kokoro-voices" CacheStorage first — we pre-seed that
//                     cache from /models/kokoro/voices/, so nothing ever
//                     leaves our origin.
//
// PREMIUM PIPELINE (what makes this the "advanced" engine):
//   1. Chunker    — text is pre-split at sentence → clause → word boundaries
//                   so no chunk ever exceeds Kokoro's ~510-phoneme utterance
//                   limit. Long scripts (2000 chars) never cut off mid-speech.
//   2. Pauses     — natural silence is stitched between sentences (120 ms) and
//                   paragraphs (400 ms), scaled by speaking speed.
//   3. Quality    — "standard" = raw model output (fastest);
//                   "high"     = de-clicked chunk joins + peak normalization;
//                   "studio"   = high + loudness normalization, silence trim,
//                                gentle fade-in/out, top MP3 bitrate.
//   4. Format     — WAV (lossless) or real MP3 via @breezystack/lamejs
//                   (NOTE: lamejs is LGPL-3.0 — the one non-Apache/MIT/BSD dep
//                   in the engine; acceptable as a bundled library, flag to
//                   legal if policy tightens). 24 kHz mono → MPEG-2 Layer III,
//                   so bitrates cap at 160 kbps (transparent for mono speech).
//
// Protocol (postMessage):
//   in : { id, task: "tts", text, voice, speed, format, quality }
//   out: { id, type: "progress", pct, stage, downloading }
//        { id, type: "done", blob, duration, sampleRate, voice, format }
//        { id, type: "error", message }

import { KokoroTTS } from "kokoro-js";
import { env, RawAudio } from "@huggingface/transformers";
import { Mp3Encoder } from "@breezystack/lamejs";
import { KOKORO_TTS, kokoroVoiceUrl } from "../models";

// Self-hosted everything: no requests to huggingface.co for model/tokenizer,
// and the runtime .wasm comes from our public folder (version-matched to the
// transformers.js bundle by `npm run models`).
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = KOKORO_TTS.localModelPath;
env.backends.onnx.wasm.wasmPaths = KOKORO_TTS.wasmPaths;
if (!self.crossOriginIsolated) env.backends.onnx.wasm.numThreads = 1;

// ── Tunables ─────────────────────────────────────────────────────────────────
// Kokoro truncates any single utterance past ~510 phoneme tokens; ~330 chars of
// English stays comfortably below that with margin for phoneme-dense words.
const MAX_CHUNK_CHARS = 330;
const SENTENCE_PAUSE_MS = 120;
const PARAGRAPH_PAUSE_MS = 400;

// MP3 bitrate per quality tier. 24 kHz mono is MPEG-2 Layer III whose max is
// 160 kbps — already transparent for speech, so "studio" gets the ceiling.
const MP3_KBPS = { standard: 96, high: 128, studio: 160 };

let ttsPromise = null;

self.onmessage = async (event) => {
  const { id, task, text, voice, speed, format, quality } = event.data;
  const progress = (pct, stage, downloading = false) =>
    self.postMessage({ id, type: "progress", pct, stage, downloading });

  try {
    if (task !== "tts") throw new Error(`Unknown task "${task}"`);
    const result = await synthesize({ text, voice, speed, format, quality }, progress);
    self.postMessage({ id, type: "done", ...result });
  } catch (err) {
    console.error("❌ AI engine TTS worker failed:", err);
    ttsPromise = null; // a failed load shouldn't poison later attempts
    self.postMessage({ id, type: "error", message: err?.message || "Speech generation failed." });
  }
};

/** Load Kokoro once per worker life; downloads report a real progress bar. */
function getTts(progress) {
  if (ttsPromise) return ttsPromise;
  ttsPromise = KokoroTTS.from_pretrained(KOKORO_TTS.modelId, {
    dtype: KOKORO_TTS.dtype,
    device: "wasm",
    progress_callback: (info) => {
      // Only the ~92 MB weights file moves the bar; the rest is instant.
      if (info.status === "progress" && info.file?.endsWith(".onnx")) {
        progress(Math.round((info.progress || 0) * 0.7), "model", true);
      }
    },
  }).then((tts) => {
    console.log("✅ AI engine: Kokoro TTS ready (wasm)");
    return tts;
  });
  return ttsPromise;
}

/**
 * kokoro-js fetches voice embeddings from a hard-coded huggingface.co URL,
 * but looks in the "kokoro-voices" CacheStorage first. Seed that cache from
 * our self-hosted copy so the fetch never happens. If CacheStorage is
 * unavailable (rare — insecure context), kokoro-js falls back to the real
 * Hugging Face download and everything still works.
 */
async function ensureVoiceCached(voiceId) {
  const hfUrl = `${KOKORO_TTS.hfVoiceUrlBase}/${voiceId}.bin`;
  try {
    const cache = await caches.open(KOKORO_TTS.voiceCacheName);
    if (await cache.match(hfUrl)) return;
    const res = await fetch(kokoroVoiceUrl(voiceId));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} — run \`npm run models\` if developing locally.`);
    }
    await cache.put(
      hfUrl,
      new Response(await res.arrayBuffer(), {
        headers: { "Content-Type": "application/octet-stream" },
      }),
    );
    console.log(`✅ AI engine: voice ${voiceId} seeded from self-hosted files`);
  } catch (err) {
    console.warn(
      `⚠️ AI engine: couldn't pre-seed voice ${voiceId} (kokoro-js will try Hugging Face):`,
      err?.message,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chunker — sentence → clause → word splitting, so nothing ever truncates
// ─────────────────────────────────────────────────────────────────────────────

/** Split a paragraph into sentences (keeps the terminating punctuation). */
function splitSentences(paragraph) {
  const matches = paragraph.match(/[^.!?…]+[.!?…]+["')\]]*\s*|[^.!?…]+$/g);
  return (matches || [paragraph]).map((s) => s.trim()).filter(Boolean);
}

/** Break one over-long sentence at clause boundaries, then hard word wraps. */
function splitLongSentence(sentence) {
  const parts = [];
  // Clause-level pieces (keep the separator with the left piece).
  const clauses = sentence.match(/[^,;:—–]+[,;:—–]+\s*|[^,;:—–]+$/g) || [sentence];
  let current = "";
  const flush = () => {
    if (current.trim()) parts.push(current.trim());
    current = "";
  };
  for (const clause of clauses) {
    if (clause.length > MAX_CHUNK_CHARS) {
      // A single monster clause — wrap at word boundaries.
      flush();
      let piece = "";
      for (const word of clause.split(/\s+/)) {
        if (piece && piece.length + word.length + 1 > MAX_CHUNK_CHARS) {
          parts.push(piece);
          piece = word;
        } else {
          piece = piece ? `${piece} ${word}` : word;
        }
      }
      if (piece.trim()) parts.push(piece.trim());
    } else if (current.length + clause.length > MAX_CHUNK_CHARS) {
      flush();
      current = clause;
    } else {
      current += clause;
    }
  }
  flush();
  return parts;
}

/**
 * Turn raw input into speakable chunks with the silence to insert AFTER each:
 * sentence ends get a breath, paragraph ends a longer beat, and intra-sentence
 * splits (clause/word wraps) get none so the join stays seamless.
 * @returns {{ text: string, pauseMs: number }[]}
 */
function chunkText(rawText) {
  const chunks = [];
  const paragraphs = rawText.replace(/\r\n/g, "\n").split(/\n{2,}/);
  for (const paragraph of paragraphs) {
    const flat = paragraph.replace(/\s+/g, " ").trim();
    if (!flat) continue;
    for (const sentence of splitSentences(flat)) {
      const pieces =
        sentence.length > MAX_CHUNK_CHARS ? splitLongSentence(sentence) : [sentence];
      pieces.forEach((piece, i) => {
        const isSentenceEnd = i === pieces.length - 1;
        chunks.push({ text: piece, pauseMs: isSentenceEnd ? SENTENCE_PAUSE_MS : 0 });
      });
    }
    if (chunks.length > 0) chunks[chunks.length - 1].pauseMs = PARAGRAPH_PAUSE_MS;
  }
  if (chunks.length > 0) chunks[chunks.length - 1].pauseMs = 0; // no trailing gap
  return chunks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio post-processing (quality tiers)
// ─────────────────────────────────────────────────────────────────────────────

/** 3 ms linear fade on both edges of a chunk — removes joint clicks. */
function declick(samples, sampleRate) {
  const n = Math.min(Math.floor(sampleRate * 0.003), Math.floor(samples.length / 2));
  for (let i = 0; i < n; i++) {
    const g = i / n;
    samples[i] *= g;
    samples[samples.length - 1 - i] *= g;
  }
}

/** Scale so the peak sits at `ceiling` (skip silent/already-quiet-safe audio). */
function peakNormalize(samples, ceiling = 0.95) {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
  }
  if (peak < 1e-4) return;
  const gain = ceiling / peak;
  for (let i = 0; i < samples.length; i++) samples[i] *= gain;
}

/** RMS-based loudness normalization toward ~-20 dBFS, peak-limited. */
function loudnessNormalize(samples, targetRms = 0.1, ceiling = 0.95) {
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    sum += s * s;
    const a = Math.abs(s);
    if (a > peak) peak = a;
  }
  const rms = Math.sqrt(sum / samples.length);
  if (rms < 1e-5 || peak < 1e-4) return;
  const gain = Math.min(targetRms / rms, ceiling / peak);
  for (let i = 0; i < samples.length; i++) samples[i] *= gain;
}

/** Trim leading/trailing near-silence, keeping a short natural pad. */
function trimSilence(samples, sampleRate, threshold = 0.004, padMs = 60) {
  const pad = Math.floor((sampleRate * padMs) / 1000);
  let start = 0;
  while (start < samples.length && Math.abs(samples[start]) < threshold) start++;
  let end = samples.length - 1;
  while (end > start && Math.abs(samples[end]) < threshold) end--;
  start = Math.max(0, start - pad);
  end = Math.min(samples.length, end + 1 + pad);
  return start === 0 && end === samples.length ? samples : samples.slice(start, end);
}

/** Gentle fade-in/out so playback starts and ends silk-smooth. */
function applyFades(samples, sampleRate, inMs = 20, outMs = 90) {
  const nIn = Math.min(Math.floor((sampleRate * inMs) / 1000), samples.length);
  for (let i = 0; i < nIn; i++) samples[i] *= i / nIn;
  const nOut = Math.min(Math.floor((sampleRate * outMs) / 1000), samples.length);
  for (let i = 0; i < nOut; i++) samples[samples.length - 1 - i] *= i / nOut;
}

// ─────────────────────────────────────────────────────────────────────────────
// Encoding
// ─────────────────────────────────────────────────────────────────────────────

/** Encode mono float32 samples to an MP3 blob with lamejs. */
function encodeMp3(samples, sampleRate, kbps) {
  const encoder = new Mp3Encoder(1, sampleRate, kbps);
  const FRAME = 1152;
  const int16 = new Int16Array(FRAME);
  const parts = [];
  for (let offset = 0; offset < samples.length; offset += FRAME) {
    const len = Math.min(FRAME, samples.length - offset);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, samples[offset + i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const encoded = encoder.encodeBuffer(int16.subarray(0, len));
    if (encoded.length > 0) parts.push(encoded);
  }
  const tail = encoder.flush();
  if (tail.length > 0) parts.push(tail);
  return new Blob(parts, { type: "audio/mpeg" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Synthesis pipeline
// ─────────────────────────────────────────────────────────────────────────────

/** Chunked synthesis → stitched, polished, encoded audio blob. */
async function synthesize({ text: rawText, voice: voiceId, speed = 1, format, quality }, progress) {
  const text = String(rawText || "").trim();
  if (!text) throw new Error("Enter some text to convert to speech.");
  const voice = KOKORO_TTS.voices.some((v) => v.id === voiceId)
    ? voiceId
    : KOKORO_TTS.voices[0].id;
  const tier = ["standard", "high", "studio"].includes(quality) ? quality : "high";
  const outFormat = format === "wav" ? "wav" : "mp3";
  const rate = Math.min(2, Math.max(0.5, Number(speed) || 1));

  const chunks = chunkText(text);
  if (chunks.length === 0) throw new Error("Nothing speakable in that text.");
  console.log(
    `🎙️ AI engine TTS: ${text.length} chars → ${chunks.length} chunk(s), voice=${voice}, speed=${rate}, quality=${tier}, format=${outFormat}`,
  );

  const tts = await getTts(progress);
  progress(72, "voice");
  await ensureVoiceCached(voice);
  progress(75, "speak");

  // Speak each chunk on its own — every utterance stays under Kokoro's token
  // limit, so long scripts come out complete. Progress advances by characters.
  const totalChars = chunks.reduce((sum, c) => sum + c.text.length, 0);
  const waveforms = [];
  let sampleRate = 24000;
  let spokenChars = 0;
  for (const chunk of chunks) {
    const audio = await tts.generate(chunk.text, { voice, speed: rate });
    sampleRate = audio.sampling_rate;
    // Copy so post-processing never mutates kokoro-js internals.
    const samples = new Float32Array(audio.audio);
    if (tier !== "standard") declick(samples, sampleRate);
    // Natural pause after the chunk, scaled with speaking speed.
    const pauseSamples = Math.floor((sampleRate * (chunk.pauseMs / 1000)) / rate);
    waveforms.push({ samples, pauseSamples });
    spokenChars += chunk.text.length;
    progress(75 + Math.round((spokenChars / totalChars) * 22), "speak");
  }

  // Stitch chunks + pauses into one waveform.
  const totalSamples = waveforms.reduce((sum, w) => sum + w.samples.length + w.pauseSamples, 0);
  let merged = new Float32Array(totalSamples);
  let offset = 0;
  for (const { samples, pauseSamples } of waveforms) {
    merged.set(samples, offset);
    offset += samples.length + pauseSamples; // gap stays zeroed = silence
  }

  // Quality polish.
  progress(98, "finalize");
  if (tier === "high") {
    peakNormalize(merged);
  } else if (tier === "studio") {
    merged = trimSilence(merged, sampleRate);
    loudnessNormalize(merged);
    applyFades(merged, sampleRate);
  }

  const blob =
    outFormat === "mp3"
      ? encodeMp3(merged, sampleRate, MP3_KBPS[tier])
      : new RawAudio(merged, sampleRate).toBlob();

  progress(100, "done");
  return {
    blob,
    duration: merged.length / sampleRate,
    sampleRate,
    voice,
    format: outFormat,
  };
}
