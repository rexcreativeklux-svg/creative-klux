// Background-removal worker. Everything heavy happens here — model download,
// ONNX inference (WebGPU when available, WASM otherwise), mask compositing —
// so the page thread never blocks and the UI stays perfectly smooth, even on
// low-RAM machines.
//
// Protocol (postMessage):
//   in : { id, task: "removeBackground", modelKey, bitmap (transferred) }
//   out: { id, type: "progress", pct, stage, downloading }
//        { id, type: "done", blob, width, height, ep }
//        { id, type: "error", message }

import * as ort from "onnxruntime-web";
import { SEGMENTATION_MODELS, modelUrl } from "../models";
import { loadModelBytes } from "../core/modelLoader";
import { pickExecutionProviders } from "../core/device";

// The ORT runtime (.wasm/.mjs) is copied to public/ort/ by `npm run models`.
ort.env.wasm.wasmPaths = "/ort/";
// Without cross-origin isolation multi-threading is unavailable; saying so
// explicitly avoids a noisy runtime warning. Single-thread SIMD is plenty
// for these model sizes.
if (!self.crossOriginIsolated) ort.env.wasm.numThreads = 1;

// Composite at most ~16.7 MP (4096²) so a huge phone photo can't blow the
// RAM budget — beyond that the cutout is delivered proportionally smaller.
const MAX_PIXELS = 4096 * 4096;

// One live session at a time (LRU of 1): switching models frees the old one.
let live = { key: null, session: null, ep: null };

// The U²-Net family uses MaxPool with ceil_mode, which ORT's WebGPU provider
// can't execute yet — the session CREATES fine but run() throws. Once we've
// seen that happen, stop offering WebGPU in this worker and stay on WASM.
let webgpuBlocked = false;

self.onmessage = async (event) => {
  const { id, task, modelKey, bitmap } = event.data;
  const progress = (pct, stage, downloading = false) =>
    self.postMessage({ id, type: "progress", pct, stage, downloading });

  try {
    if (task !== "removeBackground") throw new Error(`Unknown task "${task}"`);
    const model = SEGMENTATION_MODELS[modelKey];
    if (!model) throw new Error(`Unknown model "${modelKey}"`);

    const result = await removeBackground(modelKey, model, bitmap, progress);

    self.postMessage({ id, type: "done", ...result, ep: live.ep });
  } catch (err) {
    console.error("❌ AI engine worker failed:", err);
    self.postMessage({ id, type: "error", message: err?.message || "Processing failed." });
  }
};

/** Release the current session (best-effort) and clear the slot. */
async function releaseLive() {
  if (live.session) {
    try {
      await live.session.release();
    } catch {
      /* releasing is best-effort */
    }
  }
  live = { key: null, session: null, ep: null };
}

/**
 * Run the model, falling back to a fresh WASM session when WebGPU turns out
 * not to support one of the model's ops at execution time (see webgpuBlocked).
 * `feeds` are plain CPU tensors, so they can be re-run against a new session.
 */
async function runInference(modelKey, model, feeds, progress) {
  const session = await getSession(modelKey, model, progress);
  try {
    return { outputs: await session.run(feeds), session };
  } catch (err) {
    if (live.ep !== "webgpu") throw err;
    console.warn(
      "⚠️ AI engine: WebGPU can't execute this model — rebuilding on WASM:",
      err?.message,
    );
    webgpuBlocked = true;
    await releaseLive();
    const wasmSession = await getSession(modelKey, model, progress);
    return { outputs: await wasmSession.run(feeds), session: wasmSession };
  }
}

/** Load (download → cache → init) the model session, reusing it across runs. */
async function getSession(key, model, progress) {
  if (live.key === key && live.session) return live.session;

  // Free the previous model before loading another (keeps peak RAM low).
  await releaseLive();

  // Model download: 0 → 70% of the bar (skipped instantly when cached).
  const bytes = await loadModelBytes(modelUrl(model), {
    onProgress: ({ loaded, total, cached }) => {
      if (cached) return progress(70, "model");
      const pct = total ? Math.round((loaded / total) * 70) : 5;
      progress(pct, "model", true);
    },
  });

  progress(72, "init");
  const providers = webgpuBlocked ? ["wasm"] : await pickExecutionProviders();

  // Try WebGPU first, drop to WASM if session creation fails on this device.
  let session = null;
  let ep = null;
  for (const provider of providers) {
    try {
      session = await ort.InferenceSession.create(bytes, {
        executionProviders: [provider],
        graphOptimizationLevel: "all",
      });
      ep = provider;
      break;
    } catch (err) {
      console.warn(`⚠️ AI engine: ${provider} session failed, trying next:`, err?.message);
    }
  }
  if (!session) throw new Error("Couldn't initialize the AI model on this device.");

  console.log(`✅ AI engine: ${key} ready on ${ep}`);
  live = { key, session, ep };
  return session;
}

/** Full pipeline: resize → normalize → infer → mask → alpha composite → PNG. */
async function removeBackground(modelKey, model, bitmap, progress) {
  // Ensure the model is ready BEFORE touching the image (download progress
  // stays honest), then prep the pixels.
  const firstSession = await getSession(modelKey, model, progress);
  progress(75, "prepare");

  // Output size (RAM-capped). The alpha mask is applied at this resolution.
  let outW = bitmap.width;
  let outH = bitmap.height;
  if (outW * outH > MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / (outW * outH));
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
    console.log(`📉 AI engine: very large image — processing at ${outW}×${outH}`);
  }

  // Draw the source once at output size, then release the bitmap immediately.
  const fullCanvas = new OffscreenCanvas(outW, outH);
  const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true });
  fullCtx.drawImage(bitmap, 0, 0, outW, outH);
  bitmap.close();

  // Model input: stretch-resize to the training size (U²-Net convention).
  const size = model.inputSize;
  const inputCanvas = new OffscreenCanvas(size, size);
  const inputCtx = inputCanvas.getContext("2d", { willReadFrequently: true });
  inputCtx.drawImage(fullCanvas, 0, 0, size, size);
  const { data: rgba } = inputCtx.getImageData(0, 0, size, size);

  // HWC uint8 → CHW float32, normalized with the model's mean/std.
  const [mr, mg, mb] = model.mean;
  const [sr, sg, sb] = model.std;
  const plane = size * size;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i += 1) {
    const o = i * 4;
    input[i] = (rgba[o] / 255 - mr) / sr;
    input[plane + i] = (rgba[o + 1] / 255 - mg) / sg;
    input[2 * plane + i] = (rgba[o + 2] / 255 - mb) / sb;
  }

  progress(80, "inference");
  // Input/output names are identical across sessions of the same model, so
  // the feeds survive a WebGPU→WASM session rebuild inside runInference.
  const feeds = {
    [firstSession.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, size, size]),
  };
  // Keepalive while run() computes: big models (isnet, 1024px input) can spend
  // well over the client's 45s stall watchdog inside a single inference call —
  // a heartbeat tick tells it the engine is alive, not hung.
  const keepalive = setInterval(() => progress(85, "inference"), 10000);
  let inferred;
  try {
    inferred = await runInference(modelKey, model, feeds, progress);
  } finally {
    clearInterval(keepalive);
  }
  const { outputs, session } = inferred;
  // U²-Net returns several side outputs — the first is the fused final map.
  const out = outputs[session.outputNames[0]];
  const mask = await out.getData();
  out.dispose?.();

  progress(92, "compose");

  // Min-max normalize the saliency map to a clean 0–255 alpha ramp.
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < plane; i += 1) {
    if (mask[i] < min) min = mask[i];
    if (mask[i] > max) max = mask[i];
  }
  const range = max - min || 1;

  // Write the mask into the R channel (avoids premultiplied-alpha loss when
  // the browser scales it), then let canvas bilinear-upscale it to full size.
  const maskCanvas = new OffscreenCanvas(size, size);
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  const maskImage = maskCtx.createImageData(size, size);
  for (let i = 0; i < plane; i += 1) {
    const o = i * 4;
    maskImage.data[o] = Math.round(((mask[i] - min) / range) * 255);
    maskImage.data[o + 3] = 255;
  }
  maskCtx.putImageData(maskImage, 0, 0);

  const maskFull = new OffscreenCanvas(outW, outH);
  const maskFullCtx = maskFull.getContext("2d", { willReadFrequently: true });
  maskFullCtx.imageSmoothingEnabled = true;
  maskFullCtx.imageSmoothingQuality = "high";
  maskFullCtx.drawImage(maskCanvas, 0, 0, outW, outH);
  const maskData = maskFullCtx.getImageData(0, 0, outW, outH).data;

  // Apply the mask as the cutout's alpha channel.
  const composite = fullCtx.getImageData(0, 0, outW, outH);
  const pixels = composite.data;
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i + 3] = maskData[i];
  }
  fullCtx.putImageData(composite, 0, 0);

  const blob = await fullCanvas.convertToBlob({ type: "image/png" });
  progress(100, "done");
  return { blob, width: outW, height: outH };
}
