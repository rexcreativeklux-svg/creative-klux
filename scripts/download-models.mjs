// One-time setup for the self-hosted AI engine (run: `npm run models`).
//
// Downloads the ONNX model files into public/models/ and copies the ONNX
// Runtime WASM/WebGPU runtime files into public/ort/. Both folders are
// git-ignored (models are big binaries), so every dev — and every deploy —
// runs this once after `npm install`. No dependencies, Node 18+ only.
//
// This is the trimmed registry for the Product Photos on-device tools
// (Beautifier, Ghost Mannequin, Flat Lay). Only commercially-safe licenses:
//   u2netp               4.6 MB  Apache-2.0   — bg cutout, fast tier (low-RAM devices)
//   silueta              43 MB   MIT          — bg cutout, default tier (better edges)
//   isnet-general-use    179 MB  Apache-2.0   — bg cutout, Premium tier (best edges;
//                                               browser-gated to WebGPU + >4 GB RAM)
//   realesr-general-x4v3 4.9 MB  BSD-3-Clause — 4x upscale/enhance (standard)
//   realesrgan-x4plus    67 MB   BSD-3-Clause — 4x upscale HD tier (WebGPU only)
// The Ghost Mannequin depth model (Depth Anything V2 Small, Apache-2.0) runs
// through transformers.js and is added in that tool's phase — not here.

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  statSync,
  copyFileSync,
  readdirSync,
} from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODELS_DIR = path.join(root, "public", "models");
const ORT_DIR = path.join(root, "public", "ort");
// transformers.js (Ghost Mannequin depth model) bundles its OWN onnxruntime-web,
// whose .wasm files must match ITS version — copied to a separate /ort-hf/ folder.
const ORT_HF_DIR = path.join(root, "public", "ort-hf");

const MODELS = [
  // Background-removal cutout (U²-Net family). Hosted on the rembg project's
  // GitHub release assets (stable since 2022).
  {
    file: "u2netp.onnx",
    bytes: 4574861,
    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx",
  },
  {
    file: "silueta.onnx",
    bytes: 44173029,
    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/silueta.onnx",
  },
  // IS-Net (DIS) — the Premium cutout tier. Only downloaded by the browser when
  // a capable device actually runs Premium; this script still fetches it so
  // every deploy can serve it.
  {
    file: "isnet-general-use.onnx",
    bytes: 178648008,
    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx",
  },
  // Real-ESRGAN "general x4v3" (SRVGGNetCompact, BSD-3-Clause weights from
  // xinntao's official release) — the standard community ONNX conversion.
  {
    file: "realesr-general-x4v3.onnx",
    bytes: 4871181,
    url: "https://huggingface.co/OwlMaster/AllFilesRope/resolve/main/realesr-general-x4v3.onnx",
  },
  // Real-ESRGAN x4plus (RRDBNet, BSD-3-Clause official weights) — the HD
  // enhance tier (WebGPU only). Community ONNX export.
  {
    file: "realesrgan-x4plus.onnx",
    bytes: 67132609,
    url: "https://huggingface.co/fernandotonon/QtMeshEditor-models/resolve/main/RealESRGAN_x4plus.onnx",
  },
  // Depth Anything V2 Small (Apache-2.0) for the Ghost Mannequin 3D preview,
  // run through transformers.js. Laid out how transformers.js resolves a local
  // model id ("depth-anything-v2-small" + localModelPath = /models): config +
  // preprocessor_config at the root, q8 weights under onnx/ (the tiny .onnx
  // graph + its companion .onnx_data holding the ~38 MB of weights). `bytes:
  // null` = tiny JSON whose size may drift upstream; presence is enough.
  {
    file: "depth-anything-v2-small/config.json",
    bytes: null,
    url: "https://huggingface.co/onnx-community/depth-anything-v2-small-ONNX/resolve/main/config.json",
  },
  {
    file: "depth-anything-v2-small/preprocessor_config.json",
    bytes: null,
    url: "https://huggingface.co/onnx-community/depth-anything-v2-small-ONNX/resolve/main/preprocessor_config.json",
  },
  {
    file: "depth-anything-v2-small/onnx/model_quantized.onnx",
    bytes: null, // ~162 KB graph; exact size drifts, presence is enough
    url: "https://huggingface.co/onnx-community/depth-anything-v2-small-ONNX/resolve/main/onnx/model_quantized.onnx",
  },
  {
    file: "depth-anything-v2-small/onnx/model_quantized.onnx_data",
    bytes: null, // ~38 MB weights; presence is enough
    url: "https://huggingface.co/onnx-community/depth-anything-v2-small-ONNX/resolve/main/onnx/model_quantized.onnx_data",
  },

  // Kokoro-82M text-to-speech (Apache-2.0, onnx-community's official ONNX
  // export). Laid out exactly how transformers.js resolves a local model id
  // ("kokoro" + env.localModelPath = /models): config + tokenizer + the q8
  // weights under onnx/. The `bytes: null` entries are tiny JSON files whose
  // size may drift with upstream metadata edits — download is still verified
  // to be non-empty.
  {
    file: "kokoro/config.json",
    bytes: null,
    url: "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/config.json",
  },
  {
    file: "kokoro/tokenizer.json",
    bytes: null,
    url: "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/tokenizer.json",
  },
  {
    file: "kokoro/tokenizer_config.json",
    bytes: null,
    url: "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/tokenizer_config.json",
  },
  {
    file: "kokoro/onnx/model_quantized.onnx",
    bytes: 92361116,
    url: "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_quantized.onnx",
  },
];

// Kokoro voice embeddings offered in the Text to Speech tool — all 28 English
// voices kokoro-js accepts (0.5 MB each, ~14 MB total). The .bin files ship
// INSIDE the kokoro-js npm package, so they're copied from node_modules — no
// network needed. Keep in sync with KOKORO_TTS.voices in
// src/app/libs/ai-engine/models.js.
const KOKORO_VOICES = [
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

// The runtime files onnxruntime-web loads at ort.env.wasm.wasmPaths ("/ort/"):
// plain WASM (CPU) + .jsep (WebGPU) variants, each with its .mjs loader.
const ORT_FILES = [
  "ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd-threaded.jsep.mjs",
];

async function downloadModel({ file, bytes, url }) {
  const dest = path.join(MODELS_DIR, file);
  // Files may live in subfolders — create them.
  mkdirSync(path.dirname(dest), { recursive: true });
  // `bytes: null` = size not pinned (tiny upstream JSON) — present is enough.
  const isPresent =
    existsSync(dest) &&
    (bytes === null ? statSync(dest).size > 0 : statSync(dest).size === bytes);
  if (isPresent) {
    console.log(`✅ ${file} already present — skipping`);
    return;
  }
  console.log(
    `📡 Downloading ${file}${bytes ? ` (${(bytes / 1e6).toFixed(1)} MB)` : ""}…`,
  );
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed for ${file}: HTTP ${res.status}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  const got = statSync(dest).size;
  if (bytes === null ? got === 0 : got !== bytes) {
    throw new Error(
      `${file} size mismatch: expected ${bytes ?? "> 0"}, got ${got} — retry \`npm run models\``,
    );
  }
  console.log(`✅ ${file} downloaded`);
}

function copyOrtRuntime() {
  const dist = path.join(root, "node_modules", "onnxruntime-web", "dist");
  if (!existsSync(dist)) {
    throw new Error("onnxruntime-web is not installed — run `npm install` first.");
  }
  for (const file of ORT_FILES) {
    const src = path.join(dist, file);
    if (!existsSync(src)) {
      throw new Error(`Missing ${file} in onnxruntime-web/dist — package layout changed?`);
    }
    copyFileSync(src, path.join(ORT_DIR, file));
  }
  console.log(`✅ ONNX Runtime web files copied to public/ort/ (${ORT_FILES.length} files)`);
}

// transformers.js bundles its OWN onnxruntime-web build; its runtime .wasm files
// must match THAT version, so they're copied from the transformers dist into a
// separate public folder (/ort-hf/), never mixed with the /ort/ files above.
function copyTransformersOrtRuntime() {
  const dist = path.join(root, "node_modules", "@huggingface", "transformers", "dist");
  if (!existsSync(dist)) {
    throw new Error("@huggingface/transformers is not installed — run `npm install` first.");
  }
  const files = readdirSync(dist).filter((f) => f.startsWith("ort-") && /\.(wasm|mjs)$/.test(f));
  if (files.length === 0) {
    throw new Error("No ort-*.wasm files in @huggingface/transformers/dist — package layout changed?");
  }
  mkdirSync(ORT_HF_DIR, { recursive: true });
  for (const file of files) {
    copyFileSync(path.join(dist, file), path.join(ORT_HF_DIR, file));
  }
  console.log(`✅ transformers.js ONNX runtime copied to public/ort-hf/ (${files.length} files)`);
}

// The Kokoro voice embeddings (0.5 MB each) ship inside the kokoro-js npm
// package — copy the ones the Text to Speech tool offers into public/models/.
function copyKokoroVoices() {
  const src = path.join(root, "node_modules", "kokoro-js", "voices");
  if (!existsSync(src)) {
    throw new Error("kokoro-js is not installed — run `npm install` first.");
  }
  const dest = path.join(MODELS_DIR, "kokoro", "voices");
  mkdirSync(dest, { recursive: true });
  for (const voice of KOKORO_VOICES) {
    const file = `${voice}.bin`;
    if (!existsSync(path.join(src, file))) {
      throw new Error(`Voice ${file} missing from kokoro-js/voices — package layout changed?`);
    }
    copyFileSync(path.join(src, file), path.join(dest, file));
  }
  console.log(`✅ Kokoro voices copied to public/models/kokoro/voices/ (${KOKORO_VOICES.length} voices)`);
}

try {
  mkdirSync(MODELS_DIR, { recursive: true });
  mkdirSync(ORT_DIR, { recursive: true });
  copyOrtRuntime();
  copyTransformersOrtRuntime();
  for (const model of MODELS) await downloadModel(model);
  console.log("🎉 AI engine assets ready.");
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
