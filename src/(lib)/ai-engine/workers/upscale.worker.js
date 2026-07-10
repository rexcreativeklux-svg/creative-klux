// Photo enhance/upscale worker — TWO Real-ESRGAN tiers (both BSD-3-Clause):
//   standard — "general x4v3" (SRVGGNetCompact, 4.9 MB): fast everywhere.
//   hd       — "x4plus" (full RRDBNet, 67 MB): the HD tier, much richer texture
//              but ~40× the compute, so it runs on WebGPU ONLY — without WebGPU
//              the worker AUTO-FALLS-BACK to the standard model and reports
//              `tier: "standard"` so the UI can say so.
// The image is processed in overlapping TILES, so peak RAM stays constant no
// matter the photo size, and every finished tile advances a real progress bar.
//
// Protocol (postMessage):
//   in : { id, task: "upscale", bitmap (transferred), tier? ("standard"|"hd") }
//   out: { id, type: "progress", pct, stage, downloading }
//        { id, type: "done", blob, width, height, ep, tier }
//        { id, type: "error", message }

import * as ort from "onnxruntime-web";
import { UPSCALE_MODEL, UPSCALE_HD_MODEL, modelUrl } from "../models";
import { loadModelBytes } from "../core/modelLoader";
import { pickExecutionProviders } from "../core/device";

// The ORT runtime (.wasm/.mjs) is copied to public/ort/ by `npm run models`.
ort.env.wasm.wasmPaths = "/ort/";
if (!self.crossOriginIsolated) ort.env.wasm.numThreads = 1;

const SCALE = UPSCALE_MODEL.scale; // 4× (both tiers)
// Tile geometry: neighbors overlap; each tile "owns" the region ≥ OVERLAP/2
// from its edges, so seams land where both tiles agree. The HD net is far
// heavier per pixel, so its tiles are smaller to keep GPU memory in check.
const TILE_BY_TIER = { standard: 256, hd: 192 };
const OVERLAP = 16;
// Input cap (long edge): 1024 in → 4096 out ≈ 16 MP, the same RAM ceiling as
// the other workers. Bigger sources are downscaled first (and still come out
// far larger than they went in).
const MAX_INPUT_EDGE = 1024;

let live = { session: null, ep: null, tier: null };
const modelBytesByTier = { standard: null, hd: null };
let webgpuBlocked = false;

self.onmessage = async (event) => {
  const { id, task, bitmap, tier = "standard" } = event.data;
  const progress = (pct, stage, downloading = false) =>
    self.postMessage({ id, type: "progress", pct, stage, downloading });

  try {
    if (task !== "upscale") throw new Error(`Unknown task "${task}"`);
    // The HD net is unusable on WASM (minutes per photo) — fall back early.
    let useTier = tier;
    if (tier === "hd") {
      const providers = webgpuBlocked ? ["wasm"] : await pickExecutionProviders();
      if (!providers.includes("webgpu")) {
        console.warn("⚠️ AI engine: no WebGPU — HD tier falls back to the standard enhancer");
        useTier = "standard";
      }
    }
    const result = await upscale(bitmap, useTier, progress);
    self.postMessage({ id, type: "done", ...result, ep: live.ep, tier: useTier });
  } catch (err) {
    console.error("❌ AI engine upscale worker failed:", err);
    self.postMessage({ id, type: "error", message: err?.message || "Enhancement failed." });
  }
};

async function releaseLive() {
  if (live.session) {
    try {
      await live.session.release();
    } catch {
      /* releasing is best-effort */
    }
  }
  live = { session: null, ep: null, tier: null };
}

/** Download (once) + init the tier's session, WebGPU first unless blocked.
 *  One live session max (LRU of 1) — switching tiers releases the other. */
async function getSession(tier, progress) {
  if (live.session && live.tier === tier) return live.session;
  await releaseLive();

  const model = tier === "hd" ? UPSCALE_HD_MODEL : UPSCALE_MODEL;
  if (!modelBytesByTier[tier]) {
    modelBytesByTier[tier] = await loadModelBytes(modelUrl(model), {
      onProgress: ({ loaded, total, cached }) => {
        if (cached) return progress(20, "model");
        progress(total ? Math.round((loaded / total) * 20) : 5, "model", true);
      },
    });
  } else {
    progress(20, "model");
  }

  progress(22, "init");
  const providers = webgpuBlocked ? ["wasm"] : await pickExecutionProviders();
  for (const provider of providers) {
    if (tier === "hd" && provider !== "webgpu") break; // HD is WebGPU-only
    try {
      const session = await ort.InferenceSession.create(modelBytesByTier[tier], {
        executionProviders: [provider],
        graphOptimizationLevel: "all",
      });
      console.log(`✅ AI engine: Real-ESRGAN (${tier}) ready on ${provider}`);
      live = { session, ep: provider, tier };
      return session;
    } catch (err) {
      console.warn(`⚠️ AI engine: Real-ESRGAN ${tier} ${provider} session failed:`, err?.message);
    }
  }
  if (tier === "hd") {
    // WebGPU adapter exists but the big net wouldn't build — use standard.
    console.warn("⚠️ AI engine: HD session failed — falling back to the standard enhancer");
    return getSession("standard", progress);
  }
  throw new Error("Couldn't initialize the enhancer AI on this device.");
}

/** Run one tile with the WebGPU→WASM runtime fallback. */
async function runTile(tier, feeds, progress) {
  const session = await getSession(tier, progress);
  try {
    return { outputs: await session.run(feeds), session };
  } catch (err) {
    if (live.ep !== "webgpu") throw err;
    console.warn("⚠️ AI engine: WebGPU can't run Real-ESRGAN — rebuilding on WASM:", err?.message);
    webgpuBlocked = true;
    await releaseLive();
    // WASM can only carry the standard tier — re-key the feeds in case the
    // two exports name their input tensor differently.
    const wasmSession = await getSession("standard", progress);
    const remapped = { [wasmSession.inputNames[0]]: Object.values(feeds)[0] };
    return { outputs: await wasmSession.run(remapped), session: wasmSession };
  }
}

/** Clamped tile start positions covering `len` (single tile when it fits). */
function tilePositions(len, TILE) {
  if (len <= TILE) return [0];
  const step = TILE - OVERLAP;
  const positions = [];
  for (let x = 0; ; x += step) {
    if (x + TILE >= len) {
      positions.push(len - TILE);
      break;
    }
    positions.push(x);
  }
  return positions;
}

/** The tile's "owned" span along one axis (overlap split between neighbors). */
function ownedSpan(positions, index, len, TILE) {
  const start = index === 0 ? 0 : positions[index] + OVERLAP / 2;
  const end = index === positions.length - 1 ? len : positions[index] + TILE - OVERLAP / 2;
  return [start, end];
}

/** Full pipeline: cap → tile → infer each tile → stitch → PNG. */
async function upscale(bitmap, tier, progress) {
  const TILE = TILE_BY_TIER[tier] || TILE_BY_TIER.standard;
  const firstSession = await getSession(tier, progress);
  progress(25, "prepare");

  // RAM-cap the input (output is SCALE× in each dimension).
  const scale = Math.min(1, MAX_INPUT_EDGE / Math.max(bitmap.width, bitmap.height));
  const W = Math.max(1, Math.round(bitmap.width * scale));
  const H = Math.max(1, Math.round(bitmap.height * scale));
  if (scale < 1) console.log(`📉 AI engine: large photo — enhancing at ${W}×${H} before 4×`);

  const source = new OffscreenCanvas(W, H);
  const sourceCtx = source.getContext("2d", { willReadFrequently: true });
  sourceCtx.drawImage(bitmap, 0, 0, W, H);
  bitmap.close();

  const out = new OffscreenCanvas(W * SCALE, H * SCALE);
  const outCtx = out.getContext("2d");

  const xs = tilePositions(W, TILE);
  const ys = tilePositions(H, TILE);
  const totalTiles = xs.length * ys.length;
  let doneTiles = 0;

  // Reused buffers — one tile in flight at a time keeps RAM flat.
  const tileCanvas = new OffscreenCanvas(TILE, TILE);
  const tileCtx = tileCanvas.getContext("2d", { willReadFrequently: true });
  const plane = TILE * TILE;
  const input = new Float32Array(3 * plane);
  const inputName = firstSession.inputNames[0];

  const scratch = new OffscreenCanvas(TILE * SCALE, TILE * SCALE);
  const scratchCtx = scratch.getContext("2d");
  const outImage = scratchCtx.createImageData(TILE * SCALE, TILE * SCALE);

  for (let iy = 0; iy < ys.length; iy += 1) {
    for (let ix = 0; ix < xs.length; ix += 1) {
      const sx = xs[ix];
      const sy = ys[iy];

      // Tile pixels → float32 CHW in [0,1]. Images smaller than TILE leave
      // black padding, cropped away by the owned-region paste below.
      tileCtx.clearRect(0, 0, TILE, TILE);
      tileCtx.drawImage(source, sx, sy, TILE, TILE, 0, 0, TILE, TILE);
      const rgba = tileCtx.getImageData(0, 0, TILE, TILE).data;
      for (let i = 0; i < plane; i += 1) {
        const o = i * 4;
        input[i] = rgba[o] / 255;
        input[plane + i] = rgba[o + 1] / 255;
        input[2 * plane + i] = rgba[o + 2] / 255;
      }

      const feeds = { [inputName]: new ort.Tensor("float32", input, [1, 3, TILE, TILE]) };
      const { outputs, session } = await runTile(tier, feeds, progress);
      const outTensor = outputs[session.outputNames[0]];
      const data = await outTensor.getData();
      outTensor.dispose?.();

      // float [0,1] CHW → RGBA (clamped).
      const outPlane = TILE * SCALE * (TILE * SCALE);
      for (let i = 0; i < outPlane; i += 1) {
        const o = i * 4;
        outImage.data[o] = Math.max(0, Math.min(255, Math.round(data[i] * 255)));
        outImage.data[o + 1] = Math.max(0, Math.min(255, Math.round(data[outPlane + i] * 255)));
        outImage.data[o + 2] = Math.max(0, Math.min(255, Math.round(data[2 * outPlane + i] * 255)));
        outImage.data[o + 3] = 255;
      }
      scratchCtx.putImageData(outImage, 0, 0);

      // Paste only the region this tile owns (seams land mid-overlap).
      const [oxFrom, oxTo] = ownedSpan(xs, ix, W, TILE);
      const [oyFrom, oyTo] = ownedSpan(ys, iy, H, TILE);
      outCtx.drawImage(
        scratch,
        (oxFrom - sx) * SCALE,
        (oyFrom - sy) * SCALE,
        (oxTo - oxFrom) * SCALE,
        (oyTo - oyFrom) * SCALE,
        oxFrom * SCALE,
        oyFrom * SCALE,
        (oxTo - oxFrom) * SCALE,
        (oyTo - oyFrom) * SCALE,
      );

      doneTiles += 1;
      progress(25 + Math.round((doneTiles / totalTiles) * 72), "enhance");
    }
  }

  const blob = await out.convertToBlob({ type: "image/png" });
  progress(100, "done");
  return { blob, width: W * SCALE, height: H * SCALE };
}
