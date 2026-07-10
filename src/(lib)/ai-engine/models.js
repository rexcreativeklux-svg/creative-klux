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

/** URL a model file is fetched from (same-origin by default). */
export function modelUrl(model) {
  return `${MODEL_BASE_PATH}/${model.file}`;
}
