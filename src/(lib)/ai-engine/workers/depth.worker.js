// Depth-estimation worker for the Ghost Mannequin 3D preview. Runs Depth
// Anything V2 Small (Apache-2.0) through transformers.js — WebGPU when
// available, WASM otherwise — fully self-hosted (model + runtime served from
// our own origin). Returns a normalized grayscale depth map (near = bright,
// far = dark) at the source aspect ratio, which the WebGL renderer displaces.
//
// Protocol (postMessage):
//   in : { id, task: "estimateDepth", bitmap (transferred) }
//   out: { id, type: "progress", pct, stage, downloading }
//        { id, type: "done", depthBlob, width, height }
//        { id, type: "error", message }

import { env, pipeline, RawImage } from "@huggingface/transformers";
import { DEPTH_MODEL } from "../models";

// Self-host: resolve the model id against /models/ (never hit huggingface.co),
// and load transformers.js's OWN onnxruntime-web wasm from /ort-hf/.
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = DEPTH_MODEL.localModelPath; // "/models"
env.backends.onnx.wasm.wasmPaths = DEPTH_MODEL.wasmPaths; // "/ort-hf/"
if (!self.crossOriginIsolated) env.backends.onnx.wasm.numThreads = 1;

// Cap the long edge so a huge photo can't blow the RAM budget — depth maps are
// smooth, so a modest resolution is plenty for the displacement effect.
const MAX_EDGE = 1024;

let depthEstimator = null;

self.onmessage = async (event) => {
  const { id, task, bitmap } = event.data;
  const progress = (pct, stage, downloading = false) =>
    self.postMessage({ id, type: "progress", pct, stage, downloading });

  try {
    if (task !== "estimateDepth") throw new Error(`Unknown task "${task}"`);
    const result = await estimateDepth(bitmap, progress);
    self.postMessage({ id, type: "done", ...result });
  } catch (err) {
    console.error("❌ AI engine depth worker failed:", err);
    // Some ORT/WASM aborts surface as a raw number, not an Error — give the UI
    // a human message either way.
    const message = err?.message || (typeof err === "string" ? err : "Depth estimation failed.");
    self.postMessage({ id, type: "error", message });
  }
};

/** Load (once) the depth-estimation pipeline, WebGPU first then WASM. */
async function getEstimator(progress) {
  if (depthEstimator) return depthEstimator;

  // transformers.js streams download/load events — map them onto our bar.
  const onProgress = (p) => {
    if (p.status === "progress" && typeof p.progress === "number") {
      progress(Math.round(p.progress * 0.4), "model", true); // 0→40% while loading
    }
  };

  // Depth runs on WASM: the q8 model is small and fast enough there, and the
  // WebGPU path aborts on some of this model's ops (Clip/interpolate) on Windows.
  // WASM is the reliable choice and keeps peak RAM low.
  depthEstimator = await pipeline("depth-estimation", DEPTH_MODEL.modelId, {
    dtype: DEPTH_MODEL.dtype,
    device: "wasm",
    progress_callback: onProgress,
  });
  console.log("✅ AI engine: depth model ready on wasm");
  return depthEstimator;
}

async function estimateDepth(bitmap, progress) {
  const estimator = await getEstimator(progress);
  progress(45, "prepare");

  // RAM-cap the input.
  let W = bitmap.width;
  let H = bitmap.height;
  const scale = Math.min(1, MAX_EDGE / Math.max(W, H));
  W = Math.max(1, Math.round(W * scale));
  H = Math.max(1, Math.round(H * scale));

  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, W, H);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, W, H);

  // The depth model/processor expects an RGB image. Build a RawImage from the
  // canvas RGBA and drop the alpha to 3 channels (a 4-channel input trips the
  // preprocessor on some builds).
  const image = new RawImage(imageData.data, W, H, 4).rgb();

  progress(60, "inference");
  const output = await estimator(image);
  // `depth` is a RawImage in [0,255]; already interpolated back to (W,H) by the
  // pipeline. It may be 1- or 3-channel depending on the build — normalize to a
  // grayscale value per pixel.
  const depth = output?.depth;
  if (!depth?.data) throw new Error("Depth model returned no depth map.");
  const src = depth.data;
  const ch = depth.channels || 1;

  const out = new OffscreenCanvas(W, H);
  const outCtx = out.getContext("2d");
  const rgba = outCtx.createImageData(W, H);
  for (let i = 0; i < W * H; i += 1) {
    const v = src[i * ch]; // first channel holds the depth value
    const o = i * 4;
    rgba.data[o] = v;
    rgba.data[o + 1] = v;
    rgba.data[o + 2] = v;
    rgba.data[o + 3] = 255;
  }
  outCtx.putImageData(rgba, 0, 0);

  progress(95, "compose");
  const depthBlob = await out.convertToBlob({ type: "image/png" });
  progress(100, "done");
  return { depthBlob, width: W, height: H };
}
