// Pre-generate a short spoken sample for every Text-to-Audio voice, saved as
// small MP3s in public/voice-samples/ (run: `npm run voice-samples`).
//
// The Magic Studio voice picker plays these INSTANTLY when you tap ▶ — no 93 MB
// engine download for a quick audition. If a file is missing the picker quietly
// falls back to synthesizing the sample on-device, so this script is optional
// but recommended. Unlike the model binaries, the MP3s are tiny (~40 KB each,
// ~1.3 MB total) and are COMMITTED to git — regenerate only when the voice list
// or the intro line changes.
//
// Synthesis uses the same Kokoro-82M model as the app, via kokoro-js in Node.
// The model is downloaded from Hugging Face into the transformers.js cache on
// first run (~92 MB, cached after), just like `npm run models` fetches the
// browser copies. MP3 encoding reuses @breezystack/lamejs (already a dep).
//
// Flags: --force  regenerate every sample even if it already exists.
// Node 18+ only. No new dependencies.

import {
  mkdirSync,
  existsSync,
  writeFileSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KokoroTTS } from "kokoro-js";
import { Mp3Encoder } from "@breezystack/lamejs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(root, "public", "voice-samples");
const FORCE = process.argv.includes("--force");

// onnx-community's official ONNX export — the same weights the browser loads.
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const DTYPE = "q8"; // matches KOKORO_TTS.dtype (browser-friendly ~92 MB tier)
const MP3_KBPS = 128;

// All 28 English voices, ids only. src/(lib)/ai-engine/models.js uses ESM
// `export` and the package is CommonJS, so a Node script can't import it — keep
// this list in sync with KOKORO_TTS.voices there (and KOKORO_VOICES in
// download-models.mjs). The display name is derived from the id suffix
// (af_heart → "Heart"), which matches each voice's `name` field.
const VOICE_IDS = [
  // US female
  "af_heart", "af_bella", "af_nicole", "af_aoede", "af_kore", "af_sarah",
  "af_alloy", "af_nova", "af_sky", "af_jessica", "af_river",
  // US male
  "am_fenrir", "am_michael", "am_puck", "am_echo", "am_eric", "am_liam",
  "am_onyx", "am_santa", "am_adam",
  // British female
  "bf_emma", "bf_isabella", "bf_alice", "bf_lily",
  // British male
  "bm_george", "bm_fable", "bm_lewis", "bm_daniel",
];

const displayName = (id) => {
  const suffix = id.split("_").pop();
  return suffix.charAt(0).toUpperCase() + suffix.slice(1);
};

// The line each voice "introduces itself" with. Keep in sync with
// voicePreviewLine() in MagicStudioModal.jsx.
const sampleLine = (name) =>
  `Hi, I'm ${name}. This is how I sound. Let's make something great together.`;

// Scale so the loudest sample sits near 0 dBFS — keeps voices at a comparable
// loudness in the picker (mirrors the "high" tier in the TTS worker).
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

// Encode mono float32 samples to an MP3 buffer (same approach as the TTS worker).
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
    const chunk = encoder.encodeBuffer(int16.subarray(0, len));
    if (chunk.length > 0) parts.push(Buffer.from(chunk));
  }
  const tail = encoder.flush();
  if (tail.length > 0) parts.push(Buffer.from(tail));
  return Buffer.concat(parts);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const pending = VOICE_IDS.filter(
    (id) => FORCE || !existsSync(path.join(OUT_DIR, `${id}.mp3`)),
  );
  if (pending.length === 0) {
    console.log(
      `✅ All ${VOICE_IDS.length} voice samples already present — nothing to do (use --force to rebuild).`,
    );
    return;
  }

  console.log(
    `📡 Loading Kokoro-82M (${DTYPE})… first run downloads ~92 MB from Hugging Face, cached after.`,
  );
  const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: DTYPE });
  console.log(`✅ Model ready. Generating ${pending.length} sample(s)…`);

  for (const id of pending) {
    const dest = path.join(OUT_DIR, `${id}.mp3`);
    const audio = await tts.generate(sampleLine(displayName(id)), {
      voice: id,
      speed: 1,
    });
    const samples = new Float32Array(audio.audio);
    peakNormalize(samples);
    writeFileSync(dest, encodeMp3(samples, audio.sampling_rate, MP3_KBPS));
    console.log(
      `✅ ${id.padEnd(12)} ${displayName(id).padEnd(10)} ${(statSync(dest).size / 1024).toFixed(0)} KB`,
    );
  }

  console.log(
    `🎉 Voice samples ready in public/voice-samples/ (${pending.length} generated, ${VOICE_IDS.length} total). Commit them so previews are instant for everyone.`,
  );
}

main().catch((err) => {
  console.error(`❌ Voice sample generation failed: ${err?.message || err}`);
  process.exit(1);
});
