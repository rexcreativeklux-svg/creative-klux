// Registry of the self-hosted ONNX models the AI engine can run in the browser.
// Files live in public/models/ (git-ignored — fetched by `npm run models`) and
// are downloaded by the browser ONCE on first use, then served from
// CacheStorage, so repeat runs are instant and fully offline.
//
// Every entry is commercially safe (Apache-2.0 / MIT / BSD-3 — never AGPL, never
// the non-commercial BRIA RMBG models). Keep licenses documented here.

/** Where the model files are served from. Later this can point at a CDN
 *  (e.g. files.creativeklux.com) without touching any engine code. */
export const MODEL_BASE_PATH = "/models";

/** Bump to invalidate every browser-side cached model after replacing files. */
export const MODEL_CACHE_NAME = "klux-ai-models-v1";

/**
 * Background-removal (salient-object segmentation) models, smallest first.
 * Each entry declares its own input size + normalization; the worker reads
 * everything from here (stretch-resize to `inputSize`, normalize with
 * mean/std, first output = the saliency map used as the alpha mask).
 *
 * @type {Record<string, {
 *   file: string, sizeMB: number, license: string, label: string,
 *   inputSize: number, mean: [number,number,number], std: [number,number,number],
 * }>}
 */
export const SEGMENTATION_MODELS = {
  // Fast tier — tiny; used automatically on very low-memory devices.
  u2netp: {
    file: "u2netp.onnx",
    sizeMB: 4.6,
    license: "Apache-2.0",
    label: "Fast (4.6 MB)",
    inputSize: 320,
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
  },
  // Default tier — compressed U²-Net, much better edges (hair, fur, straps).
  silueta: {
    file: "silueta.onnx",
    sizeMB: 43,
    license: "MIT",
    label: "Quality (43 MB)",
    inputSize: 320,
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
  },
  // Premium tier — IS-Net (DIS, ECCV 2022): best-in-class edges on hair,
  // straps and fine detail, thanks to its native 1024px input. Big and heavy,
  // so `qualityToModelKey` only offers it on capable devices (WebGPU, >4 GB)
  // and quietly downgrades to silueta elsewhere. rembg's official ONNX export
  // (same release that hosts u2netp/silueta); normalization per rembg's
  // DisSession: ImageNet mean, std 1.0.
  isnet: {
    file: "isnet-general-use.onnx",
    sizeMB: 178.6,
    license: "Apache-2.0",
    label: "Premium (179 MB)",
    inputSize: 1024,
    mean: [0.485, 0.456, 0.406],
    std: [1, 1, 1],
  },
};

/**
 * Real-ESRGAN "general x4v3" super-resolution model (SRVGGNetCompact,
 * BSD-3-Clause, from xinntao's official Real-ESRGAN release). Tiny and fast —
 * runs tiled in the upscale worker: float32 RGB in [0,1], 4× output.
 */
export const UPSCALE_MODEL = {
  file: "realesr-general-x4v3.onnx",
  sizeMB: 4.9,
  license: "BSD-3-Clause",
  scale: 4,
};

/**
 * Real-ESRGAN x4plus — the full 23-block RRDBNet (BSD-3-Clause, xinntao's
 * official weights). The HD enhance tier: much richer texture than the compact
 * model, but ~40× the compute — the upscale worker only offers it on WebGPU
 * (WASM would take minutes) and silently uses the standard model otherwise.
 * Same tensor protocol as UPSCALE_MODEL (float32 RGB [0,1], 4×).
 */
export const UPSCALE_HD_MODEL = {
  file: "realesrgan-x4plus.onnx",
  sizeMB: 67.1,
  license: "BSD-3-Clause",
  scale: 4,
};

/**
 * Depth Anything V2 Small (Apache-2.0) for the Ghost Mannequin 3D preview,
 * run through transformers.js. Fully self-hosted like the other models:
 * transformers.js resolves the model id against `localModelPath` (→ /models/…),
 * and its OWN onnxruntime-web build loads from /ort-hf/ (that runtime must match
 * transformers.js's bundled version, NOT our top-level onnxruntime-web in /ort/).
 * We use the q8 (`quantized`) variant — smallest that keeps quality (~25 MB).
 */
export const DEPTH_MODEL = {
  modelId: "depth-anything-v2-small", // folder name under localModelPath
  localModelPath: MODEL_BASE_PATH,
  dtype: "q8", // → onnx/model_quantized.onnx
  sizeMB: 25,
  license: "Apache-2.0",
  wasmPaths: "/ort-hf/",
};

/**
 * Kokoro-82M text-to-speech (Apache-2.0), run through kokoro-js on
 * transformers.js. Fully self-hosted: the model id resolves against
 * `localModelPath` (→ /models/kokoro/…), transformers.js's own ONNX runtime
 * files live in /ort-hf/ (they must match ITS bundled onnxruntime-web
 * version, not ours), and the voice embeddings are served from
 * /models/kokoro/voices/. English only (American + British accents).
 */
export const KOKORO_TTS = {
  modelId: "kokoro", // folder name under localModelPath
  localModelPath: MODEL_BASE_PATH,
  dtype: "q8", // → onnx/model_quantized.onnx (~92 MB, the browser-friendly tier)
  sizeMB: 93,
  license: "Apache-2.0",
  wasmPaths: "/ort-hf/",
  // kokoro-js hard-codes its voice downloads to huggingface.co but checks the
  // "kokoro-voices" CacheStorage first — the worker pre-seeds that cache from
  // our own files so voices never leave our origin.
  voiceCacheName: "kokoro-voices",
  hfVoiceUrlBase: "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices",
  // ALL 28 voices kokoro-js accepts (its validator + phonemizer are
  // English-only — the ja/zh/… bins in the package can't be used without
  // forking the library). Ordered best-graded first within each accent/gender
  // group (`grade` is from the Kokoro voice card). Keep in sync with
  // KOKORO_VOICES in scripts/download-models.mjs. `label` is the full display
  // string; `name`/`gender`/`accent` let UIs group voices and show gender icons.
  voices: [
    // US female
    { id: "af_heart", name: "Heart", gender: "female", accent: "US", grade: "A", label: "Heart · US female" },
    { id: "af_bella", name: "Bella", gender: "female", accent: "US", grade: "A-", label: "Bella · US female" },
    { id: "af_nicole", name: "Nicole", gender: "female", accent: "US", grade: "B-", label: "Nicole · US female" },
    { id: "af_aoede", name: "Aoede", gender: "female", accent: "US", grade: "C+", label: "Aoede · US female" },
    { id: "af_kore", name: "Kore", gender: "female", accent: "US", grade: "C+", label: "Kore · US female" },
    { id: "af_sarah", name: "Sarah", gender: "female", accent: "US", grade: "C+", label: "Sarah · US female" },
    { id: "af_alloy", name: "Alloy", gender: "female", accent: "US", grade: "C", label: "Alloy · US female" },
    { id: "af_nova", name: "Nova", gender: "female", accent: "US", grade: "C", label: "Nova · US female" },
    { id: "af_sky", name: "Sky", gender: "female", accent: "US", grade: "C-", label: "Sky · US female" },
    { id: "af_jessica", name: "Jessica", gender: "female", accent: "US", grade: "D", label: "Jessica · US female" },
    { id: "af_river", name: "River", gender: "female", accent: "US", grade: "D", label: "River · US female" },
    // US male
    { id: "am_fenrir", name: "Fenrir", gender: "male", accent: "US", grade: "C+", label: "Fenrir · US male" },
    { id: "am_michael", name: "Michael", gender: "male", accent: "US", grade: "C+", label: "Michael · US male" },
    { id: "am_puck", name: "Puck", gender: "male", accent: "US", grade: "C+", label: "Puck · US male" },
    { id: "am_echo", name: "Echo", gender: "male", accent: "US", grade: "D", label: "Echo · US male" },
    { id: "am_eric", name: "Eric", gender: "male", accent: "US", grade: "D", label: "Eric · US male" },
    { id: "am_liam", name: "Liam", gender: "male", accent: "US", grade: "D", label: "Liam · US male" },
    { id: "am_onyx", name: "Onyx", gender: "male", accent: "US", grade: "D", label: "Onyx · US male" },
    { id: "am_santa", name: "Santa", gender: "male", accent: "US", grade: "D-", label: "Santa · US male" },
    { id: "am_adam", name: "Adam", gender: "male", accent: "US", grade: "F+", label: "Adam · US male" },
    // British female
    { id: "bf_emma", name: "Emma", gender: "female", accent: "British", grade: "B-", label: "Emma · British female" },
    { id: "bf_isabella", name: "Isabella", gender: "female", accent: "British", grade: "C", label: "Isabella · British female" },
    { id: "bf_alice", name: "Alice", gender: "female", accent: "British", grade: "D", label: "Alice · British female" },
    { id: "bf_lily", name: "Lily", gender: "female", accent: "British", grade: "D", label: "Lily · British female" },
    // British male
    { id: "bm_george", name: "George", gender: "male", accent: "British", grade: "C", label: "George · British male" },
    { id: "bm_fable", name: "Fable", gender: "male", accent: "British", grade: "C", label: "Fable · British male" },
    { id: "bm_lewis", name: "Lewis", gender: "male", accent: "British", grade: "D+", label: "Lewis · British male" },
    { id: "bm_daniel", name: "Daniel", gender: "male", accent: "British", grade: "D", label: "Daniel · British male" },
  ],
};

/** Same-origin URL a Kokoro voice embedding is served from. */
export function kokoroVoiceUrl(voiceId) {
  return `${MODEL_BASE_PATH}/kokoro/voices/${voiceId}.bin`;
}

/** URL a model file is fetched from (same-origin by default). */
export function modelUrl(model) {
  return `${MODEL_BASE_PATH}/${model.file}`;
}
