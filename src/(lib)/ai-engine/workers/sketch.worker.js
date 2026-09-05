// Photo to Sketch worker — two engines behind one protocol:
//
//   dodge   — the classic pencil pipeline, pure canvas math: grayscale →
//             invert → blur → COLOR-DODGE blend, then a tone pass (gamma,
//             paper grain, optional duotone ink/paper or the photo's own
//             chroma). Instant — no model.
//   lineart — informative-drawings ONNX (MIT, 17 MB): real artist-style line
//             drawings, post-processed per style (contrast/threshold, ink
//             tint, thickening, tonal wash, manga halftone). WebGPU when
//             available, WASM fallback.
//
// The source (and the model's line map) are CACHED per image, so switching
// styles re-renders instantly without re-running the model.
//
// Protocol (postMessage):
//   in : { id, task: "sketch",   bitmap (transferred), styleId }
//        { id, task: "resketch", styleId }              // fast style switch
//   out: { id, type: "progress", pct, stage, downloading }
//        { id, type: "done", blob, width, height, ep }
//        { id, type: "error", message }

import * as ort from "onnxruntime-web";
import { SKETCH_MODEL, modelUrl } from "../models";
import { getSketchStyle } from "../sketchStyles";
import { loadModelBytes } from "../core/modelLoader";
import { pickExecutionProviders } from "../core/device";

// The ORT runtime (.wasm/.mjs) is copied to public/ort/ by `npm run models`.
ort.env.wasm.wasmPaths = "/ort/";
if (!self.crossOriginIsolated) ort.env.wasm.numThreads = 1;

// Output cap (long edge) — sketches don't need more, and it keeps RAM flat.
const MAX_EDGE = 2048;
// The line-art model runs on a smaller copy (fully convolutional, so any
// size works; 768 is the sweet spot of line quality vs. WASM speed).
const MODEL_MAX_EDGE = 768;
// Tone passes walk the image in strips so only a sliver is in JS memory.
const STRIP_ROWS = 256;

let live = { session: null, ep: null };
let modelBytes = null;
let webgpuBlocked = false;

// Per-image caches (cleared when a new bitmap arrives).
let src = null; // { canvas, ctx, W, H }
let lineMap = null; // { data: Float32Array, w, h } — raw model output

self.onmessage = async (event) => {
  // `params` (optional) overrides individual style parameters — the caller-side
  // modifiers, e.g. Sketchify's "Colored pencil" switch sending { keepChroma }.
  // Merged over the registry defaults so a style stays its style.
  const { id, task, bitmap, styleId, params: overrides } = event.data;
  const progress = (pct, stage, downloading = false) =>
    self.postMessage({ id, type: "progress", pct, stage, downloading });

  try {
    if (task === "sketch") {
      if (!bitmap) throw new Error("No image received.");
      cacheSource(bitmap);
    } else if (task === "resketch") {
      if (!src) throw new Error("Nothing to restyle yet — upload a photo first.");
    } else {
      throw new Error(`Unknown task "${task}"`);
    }

    const style = getSketchStyle(styleId);
    const params = { ...style.params, ...(overrides || {}) };
    const result =
      style.engine === "lineart"
        ? await renderLineart(params, progress)
        : await renderDodge(params, progress);
    self.postMessage({ id, type: "done", ...result, ep: live.ep || "canvas" });
  } catch (err) {
    console.error("❌ AI engine sketch worker failed:", err);
    self.postMessage({ id, type: "error", message: err?.message || "Sketch failed." });
  }
};

/** Cap + cache the working copy of the photo; invalidates the line map. */
function cacheSource(bitmap) {
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const W = Math.max(1, Math.round(bitmap.width * scale));
  const H = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, W, H);
  bitmap.close();
  src = { canvas, ctx, W, H };
  lineMap = null;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

/** Parse "#rrggbb" once per render. */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* ── Engine 1: color-dodge pencil pipeline ──────────────────────────── */

async function renderDodge(params, progress) {
  const { blur = 14, grain = 0.1, gamma = 1, paper, ink, keepChroma = 0 } = params;
  const { canvas, ctx, W, H } = src;
  progress(30, "prepare");

  // Grayscale base…
  const out = new OffscreenCanvas(W, H);
  const outCtx = out.getContext("2d", { willReadFrequently: true });
  outCtx.filter = "grayscale(1)";
  outCtx.drawImage(canvas, 0, 0);
  outCtx.filter = "none";

  // …color-dodged by its inverted blur — the pencil-shading trick. The blur
  // radius scales with the working size so styles look the same at any input.
  const radius = (blur * Math.max(W, H)) / MAX_EDGE;
  outCtx.globalCompositeOperation = "color-dodge";
  outCtx.filter = `grayscale(1) invert(1) blur(${radius.toFixed(1)}px)`;
  outCtx.drawImage(canvas, 0, 0);
  outCtx.globalCompositeOperation = "source-over";
  outCtx.filter = "none";
  progress(60, "sketch");

  // Tone pass (strips): gamma, paper grain, then duotone or the photo's own
  // chroma (colored-pencil family).
  const inkRgb = ink ? hexToRgb(ink) : null;
  const paperRgb = paper ? hexToRgb(paper) : [255, 255, 255];
  const exponent = 1 / (gamma || 1);
  const strips = Math.ceil(H / STRIP_ROWS);
  for (let s = 0; s < strips; s += 1) {
    const y0 = s * STRIP_ROWS;
    const rows = Math.min(STRIP_ROWS, H - y0);
    const img = outCtx.getImageData(0, y0, W, rows);
    const d = img.data;
    const srcImg = keepChroma ? ctx.getImageData(0, y0, W, rows).data : null;
    for (let i = 0; i < d.length; i += 4) {
      let v = d[i] / 255; // gray, so R carries the value
      v = Math.pow(v, exponent);
      if (grain) v *= 1 - grain * Math.random();
      if (inkRgb) {
        // Duotone: strokes in ink color on paper color.
        d[i] = clamp255(Math.round(inkRgb[0] + (paperRgb[0] - inkRgb[0]) * v));
        d[i + 1] = clamp255(Math.round(inkRgb[1] + (paperRgb[1] - inkRgb[1]) * v));
        d[i + 2] = clamp255(Math.round(inkRgb[2] + (paperRgb[2] - inkRgb[2]) * v));
      } else if (srcImg) {
        // Colored pencil: sketch luminance + the photo's chroma (BT.601).
        const cb =
          (-0.168736 * srcImg[i] - 0.331264 * srcImg[i + 1] + 0.5 * srcImg[i + 2]) * keepChroma;
        const cr =
          (0.5 * srcImg[i] - 0.418688 * srcImg[i + 1] - 0.081312 * srcImg[i + 2]) * keepChroma;
        const luma = v * 255;
        d[i] = clamp255(Math.round(luma + 1.402 * cr));
        d[i + 1] = clamp255(Math.round(luma - 0.344136 * cb - 0.714136 * cr));
        d[i + 2] = clamp255(Math.round(luma + 1.772 * cb));
      } else {
        const g = clamp255(Math.round(v * 255));
        d[i] = g;
        d[i + 1] = g;
        d[i + 2] = g;
      }
      d[i + 3] = 255;
    }
    outCtx.putImageData(img, 0, y0);
    progress(60 + Math.round(((s + 1) / strips) * 38), "tone");
  }

  const blob = await out.convertToBlob({ type: "image/png" });
  progress(100, "done");
  return { blob, width: W, height: H };
}

/* ── Engine 2: informative-drawings line art ────────────────────────── */

async function releaseLive() {
  if (live.session) {
    try {
      await live.session.release();
    } catch {
      /* releasing is best-effort */
    }
  }
  live = { session: null, ep: null };
}

/** Download (once) + init the session, WebGPU first unless blocked. */
async function getSession(progress) {
  if (live.session) return live.session;
  if (!modelBytes) {
    modelBytes = await loadModelBytes(modelUrl(SKETCH_MODEL), {
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
    try {
      const session = await ort.InferenceSession.create(modelBytes, {
        executionProviders: [provider],
        graphOptimizationLevel: "all",
      });
      console.log(`✅ AI engine: line-art model ready on ${provider}`);
      live = { session, ep: provider };
      return session;
    } catch (err) {
      console.warn(`⚠️ AI engine: line-art ${provider} session failed:`, err?.message);
    }
  }
  throw new Error("Couldn't initialize the sketch AI on this device.");
}

/** Run the model once per image; cached for instant style switching. */
async function getLineMap(progress) {
  if (lineMap) {
    progress(75, "lines");
    return lineMap;
  }
  const session = await getSession(progress);
  progress(30, "prepare");

  // Model-size copy (multiple-of-8 dims keeps every conv stride happy).
  const scale = Math.min(1, MODEL_MAX_EDGE / Math.max(src.W, src.H));
  const w = Math.max(64, Math.round((src.W * scale) / 8) * 8);
  const h = Math.max(64, Math.round((src.H * scale) / 8) * 8);
  const small = new OffscreenCanvas(w, h);
  const smallCtx = small.getContext("2d", { willReadFrequently: true });
  smallCtx.drawImage(src.canvas, 0, 0, w, h);
  const rgba = smallCtx.getImageData(0, 0, w, h).data;

  const plane = w * h;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i += 1) {
    const o = i * 4;
    input[i] = rgba[o] / 255;
    input[plane + i] = rgba[o + 1] / 255;
    input[2 * plane + i] = rgba[o + 2] / 255;
  }

  progress(35, "lines");
  const feeds = { input: new ort.Tensor("float32", input, [1, 3, h, w]) };
  let outputs;
  try {
    outputs = await session.run(feeds);
  } catch (err) {
    if (live.ep !== "webgpu") throw err;
    console.warn("⚠️ AI engine: WebGPU can't run the line-art model — rebuilding on WASM:", err?.message);
    webgpuBlocked = true;
    await releaseLive();
    outputs = await (await getSession(progress)).run(feeds);
  }
  const tensor = outputs[live.session.outputNames[0]];
  const data = await tensor.getData();
  tensor.dispose?.();
  progress(75, "lines");

  lineMap = { data: Float32Array.from(data), w, h };
  return lineMap;
}

async function renderLineart(params, progress) {
  const {
    contrast = 1, threshold = 0, thicken = 0, ink, wash = 0, halftone = 0,
    // Shared with the dodge engine: how much of the photo's own colour survives.
    // Here it lays a faded colour copy UNDER the lines, so the drawing keeps the
    // subject's hues instead of being pure ink on paper.
    keepChroma = 0,
  } = params;
  const { canvas, ctx, W, H } = src;
  const map = await getLineMap(progress);
  progress(80, "style");

  // Line map → grayscale canvas at model size (contrast/threshold applied).
  const lineCanvas = new OffscreenCanvas(map.w, map.h);
  const lineCtx = lineCanvas.getContext("2d", { willReadFrequently: true });
  const img = lineCtx.createImageData(map.w, map.h);
  for (let i = 0; i < map.data.length; i += 1) {
    let v = clamp01(map.data[i]);
    if (contrast !== 1) v = clamp01((v - 0.5) * contrast + 0.5);
    if (threshold) v = v > threshold ? 1 : 0;
    const g = Math.round(v * 255);
    const o = i * 4;
    img.data[o] = g;
    img.data[o + 1] = g;
    img.data[o + 2] = g;
    img.data[o + 3] = 255;
  }
  lineCtx.putImageData(img, 0, 0);

  // Thicken: stamp the lines over themselves with 1px offsets (darken keeps
  // the darkest of the overlaps — a cheap dilation).
  for (let pass = 0; pass < thicken; pass += 1) {
    lineCtx.globalCompositeOperation = "darken";
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      lineCtx.drawImage(lineCanvas, dx, dy);
    }
    lineCtx.globalCompositeOperation = "source-over";
  }

  // Compose at full output size.
  const out = new OffscreenCanvas(W, H);
  const outCtx = out.getContext("2d", { willReadFrequently: true });
  outCtx.fillStyle = "#ffffff";
  outCtx.fillRect(0, 0, W, H);

  // Optional tonal wash UNDER the lines (blurred photo grays, multiply).
  if (wash) {
    outCtx.globalAlpha = wash;
    outCtx.filter = `grayscale(1) blur(${Math.max(2, W / 80).toFixed(0)}px) brightness(1.25)`;
    outCtx.drawImage(canvas, 0, 0, W, H);
    outCtx.globalAlpha = 1;
    outCtx.filter = "none";
  }

  // Colour under the lines. Brightened so the drawing still reads as a drawing
  // — at full strength it would just be the photo with lines on top.
  if (keepChroma) {
    outCtx.globalAlpha = Math.min(1, keepChroma) * 0.85;
    outCtx.filter = "saturate(1.15) brightness(1.25)";
    outCtx.drawImage(canvas, 0, 0, W, H);
    outCtx.globalAlpha = 1;
    outCtx.filter = "none";
  }

  outCtx.globalCompositeOperation = "multiply";
  outCtx.drawImage(lineCanvas, 0, 0, W, H);
  outCtx.globalCompositeOperation = "source-over";
  progress(88, "style");

  // Manga halftone and/or ink duotone need a pixel pass (strips).
  // A fixed ink colour and the photo's own colour are the same decision made
  // twice, so asking for chroma turns the duotone off rather than painting over
  // the colour that was just laid down.
  const inkRgb = ink && !keepChroma ? hexToRgb(ink) : null;
  if (halftone || inkRgb) {
    const strips = Math.ceil(H / STRIP_ROWS);
    for (let s = 0; s < strips; s += 1) {
      const y0 = s * STRIP_ROWS;
      const rows = Math.min(STRIP_ROWS, H - y0);
      const outImg = outCtx.getImageData(0, y0, W, rows);
      const d = outImg.data;
      const srcImg = halftone ? ctx.getImageData(0, y0, W, rows).data : null;
      for (let i = 0; i < d.length; i += 4) {
        const r0 = d[i] / 255;
        let v = r0;
        if (srcImg) {
          // Screen-tone dots where the photo is dark: a 6px dot lattice whose
          // dot size grows with shadow depth.
          const p = i / 4;
          const x = p % W;
          const y = y0 + Math.floor(p / W);
          const shade =
            1 - (0.299 * srcImg[i] + 0.587 * srcImg[i + 1] + 0.114 * srcImg[i + 2]) / 255;
          if (shade > 0.45) {
            const cx = (x % 6) - 3;
            const cy = (y % 6) - 3;
            const r = (shade - 0.45) * 5 * halftone;
            if (cx * cx + cy * cy < r * r) v = Math.min(v, 0.25);
          }
        }
        if (inkRgb) {
          d[i] = clamp255(Math.round(inkRgb[0] + (255 - inkRgb[0]) * v));
          d[i + 1] = clamp255(Math.round(inkRgb[1] + (255 - inkRgb[1]) * v));
          d[i + 2] = clamp255(Math.round(inkRgb[2] + (255 - inkRgb[2]) * v));
        } else if (keepChroma) {
          // Darken toward the halftone dot by the SAME factor on every channel.
          // Collapsing to grey (the branch below) would throw away the colour
          // this pass is meant to preserve.
          if (v !== r0) {
            const k = r0 > 0 ? v / r0 : 0;
            d[i] = clamp255(Math.round(d[i] * k));
            d[i + 1] = clamp255(Math.round(d[i + 1] * k));
            d[i + 2] = clamp255(Math.round(d[i + 2] * k));
          }
        } else {
          const g = clamp255(Math.round(v * 255));
          d[i] = g;
          d[i + 1] = g;
          d[i + 2] = g;
        }
      }
      outCtx.putImageData(outImg, 0, y0);
      progress(88 + Math.round(((s + 1) / strips) * 10), "style");
    }
  }

  const blob = await out.convertToBlob({ type: "image/png" });
  progress(100, "done");
  return { blob, width: W, height: H };
}
