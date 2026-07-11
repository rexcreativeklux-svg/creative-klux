// Text-to-speech worker — Kokoro-82M (Apache-2.0) through kokoro-js, running
// on transformers.js's own ONNX runtime (WASM — reliable everywhere at this
// model's q8 size). Everything is served from OUR origin:
//   /models/kokoro/…  model + tokenizer (transformers.js localModelPath)
//   /ort-hf/…         transformers.js's runtime .wasm (its own ort version)
//   voices            kokoro-js hard-codes huggingface.co URLs but checks the
//                     "kokoro-voices" CacheStorage first — we pre-seed that
//                     cache from /models/kokoro/voices/, so nothing ever
//                     leaves our origin.
// Text is synthesized sentence-by-sentence (streaming), which both gives a
// real progress bar and avoids the model's per-utterance token limit.
//
// Protocol (postMessage):
//   in : { id, task: "tts", text, voice, speed }
//   out: { id, type: "progress", pct, stage, downloading }
//        { id, type: "done", blob, duration, sampleRate, voice }
//        { id, type: "error", message }

import { KokoroTTS, TextSplitterStream } from "kokoro-js";
import { env, RawAudio } from "@huggingface/transformers";
import { KOKORO_TTS, kokoroVoiceUrl } from "../models";

// Self-hosted everything: no requests to huggingface.co for model/tokenizer,
// and the runtime .wasm comes from our public folder (version-matched to the
// transformers.js bundle by `npm run models`).
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = KOKORO_TTS.localModelPath;
env.backends.onnx.wasm.wasmPaths = KOKORO_TTS.wasmPaths;
if (!self.crossOriginIsolated) env.backends.onnx.wasm.numThreads = 1;

let ttsPromise = null;

self.onmessage = async (event) => {
  const { id, task, text, voice, speed } = event.data;
  const progress = (pct, stage, downloading = false) =>
    self.postMessage({ id, type: "progress", pct, stage, downloading });

  try {
    if (task !== "tts") throw new Error(`Unknown task "${task}"`);
    const result = await synthesize(text, voice, speed, progress);
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

/** Sentence-streamed synthesis → one merged WAV blob. */
async function synthesize(rawText, voiceId, speed = 1, progress) {
  const text = String(rawText || "").trim();
  if (!text) throw new Error("Enter some text to convert to speech.");
  const voice = KOKORO_TTS.voices.some((v) => v.id === voiceId)
    ? voiceId
    : KOKORO_TTS.voices[0].id;

  const tts = await getTts(progress);
  progress(72, "voice");
  await ensureVoiceCached(voice);
  progress(75, "speak");

  // Feed the whole text; kokoro-js splits it into sentences and yields audio
  // per sentence — progress advances by characters spoken.
  const splitter = new TextSplitterStream();
  splitter.push(text);
  splitter.close();

  const chunks = [];
  let sampleRate = 24000;
  let spokenChars = 0;
  for await (const { text: sentence, audio } of tts.stream(splitter, { voice, speed })) {
    chunks.push(audio.audio);
    sampleRate = audio.sampling_rate;
    spokenChars += sentence.length;
    progress(75 + Math.round(Math.min(1, spokenChars / text.length) * 24), "speak");
  }
  if (chunks.length === 0) throw new Error("Nothing speakable in that text.");

  // Merge the per-sentence Float32Array waveforms into one WAV.
  const totalSamples = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Float32Array(totalSamples);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const blob = new RawAudio(merged, sampleRate).toBlob();
  progress(100, "done");
  return { blob, duration: totalSamples / sampleRate, sampleRate, voice };
}
