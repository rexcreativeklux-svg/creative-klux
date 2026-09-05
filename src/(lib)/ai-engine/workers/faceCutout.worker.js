// Face Cutout worker (MediaPipe tasks-vision): face detection + multiclass
// portrait segmentation, off the main thread. Models are tiny (0.2 MB / 16 MB)
// and cached like every other engine model, running on the GPU delegate when
// available (CPU fallback).
//
// Trimmed from the design editor's mediapipe.worker.js, which also drives
// Blur Background, Passport Photo and face analysis off the same file —
// none of those are wired up here, so this worker only carries what Face
// Cutout needs: a face detector and the multiclass segmenter.
//
// Protocol (postMessage):
//   in : { id, task: "faceCutout", bitmap (transferred) }
//   out: { id, type: "progress", pct, stage, downloading }
//        { id, type: "done", blob, width, height }
//        { id, type: "error", message }

import { FilesetResolver, ImageSegmenter, FaceDetector } from "@mediapipe/tasks-vision";
import { MEDIAPIPE_MODELS, MEDIAPIPE_WASM_PATH, modelUrl } from "../models";
import { loadModelBytes } from "../core/modelLoader";

// Cutout work happens on a face crop, so detection size is enough RAM budget.
const CUTOUT_MAX_EDGE = 2048;

// Cached MediaPipe instances (created once per worker lifetime).
let filesetPromise = null;
let multiclassSegmenter = null;
let faceDetector = null;

self.onmessage = async (event) => {
  const { id, task, bitmap } = event.data;
  const progress = (pct, stage, downloading = false) =>
    self.postMessage({ id, type: "progress", pct, stage, downloading });

  try {
    if (task !== "faceCutout") throw new Error(`Unknown task "${task}"`);
    if (!bitmap) throw new Error("No image received.");

    const result = await faceCutout(bitmap, progress);
    const blob = await result.canvas.convertToBlob({ type: "image/png" });
    progress(100, "done");
    self.postMessage({
      id,
      type: "done",
      blob,
      width: result.canvas.width,
      height: result.canvas.height,
    });
  } catch (err) {
    console.error("❌ AI engine face-cutout worker failed:", err);
    self.postMessage({ id, type: "error", message: err?.message || "Processing failed." });
  }
};

/* ── MediaPipe setup ─────────────────────────────────────────────── */

function getFileset() {
  // The vision WASM runtime is copied to public/mediapipe/wasm by `npm run models`.
  if (!filesetPromise) filesetPromise = FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
  return filesetPromise;
}

/** Create a MediaPipe task on the GPU delegate, falling back to CPU. */
async function createTask(TaskClass, model, extraOptions, progress) {
  const bytes = await loadModelBytes(modelUrl(model), {
    onProgress: ({ cached }) => progress(8, "model", !cached),
  });
  const fileset = await getFileset();
  for (const delegate of ["GPU", "CPU"]) {
    try {
      const instance = await TaskClass.createFromOptions(fileset, {
        baseOptions: { modelAssetBuffer: new Uint8Array(bytes), delegate },
        runningMode: "IMAGE",
        ...extraOptions,
      });
      console.log(`✅ AI engine: ${model.file} ready on ${delegate}`);
      return instance;
    } catch (err) {
      console.warn(`⚠️ AI engine: ${model.file} failed on ${delegate}:`, err?.message);
    }
  }
  throw new Error("Couldn't initialize the face AI on this device.");
}

async function getMulticlassSegmenter(progress) {
  if (!multiclassSegmenter) {
    multiclassSegmenter = await createTask(
      ImageSegmenter,
      MEDIAPIPE_MODELS.multiclassSegmenter,
      { outputConfidenceMasks: true, outputCategoryMask: false },
      progress,
    );
  }
  return multiclassSegmenter;
}

async function getFaceDetector(progress) {
  if (!faceDetector) {
    faceDetector = await createTask(FaceDetector, MEDIAPIPE_MODELS.faceDetector, {}, progress);
  }
  return faceDetector;
}

/* ── Shared pixel helpers ────────────────────────────────────────── */

/** Draw the bitmap onto a canvas capped at `maxEdge`, then free the bitmap. */
function bitmapToCanvas(bitmap, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = new OffscreenCanvas(
    Math.max(1, Math.round(bitmap.width * scale)),
    Math.max(1, Math.round(bitmap.height * scale)),
  );
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

/** Detect the most confident face; returns its pixel bounding box. */
async function detectFace(sourceCanvas, progress) {
  const detector = await getFaceDetector(progress);
  progress(30, "detect");
  const { detections } = detector.detect(sourceCanvas);
  if (!detections?.length) {
    throw new Error("No face detected — try a clearer, front-facing photo.");
  }
  const best = detections.reduce((a, b) =>
    (b.categories?.[0]?.score || 0) > (a.categories?.[0]?.score || 0) ? b : a,
  );
  return best.boundingBox; // { originX, originY, width, height } in pixels
}

/* ── Face Cutout ─────────────────────────────────────────────────── */

// Multiclass segmenter category indices (per the MediaPipe model card).
const MC_HAIR = 1;
const MC_FACE_SKIN = 3;
const MC_ACCESSORIES = 5; // "others" — headbands, glasses, hats…

/**
 * Face Cutout: a HEAD-ONLY sticker — face + hair (+ headwear), cut at the
 * jaw/neck, tightly framed. Not a passport-style head-and-shoulders crop.
 *
 * How: detect the face, crop a head-sized region (so the face fills the
 * segmenter's 256×256 input for maximum edge quality), then run the
 * MULTICLASS portrait segmenter and keep only the hair / face-skin /
 * accessory classes — body skin (the neck) and clothes drop away.
 */
async function faceCutout(bitmap, progress) {
  progress(15, "prepare");
  const full = bitmapToCanvas(bitmap, CUTOUT_MAX_EDGE);
  const box = await detectFace(full, progress);

  // Head-only framing: generous hair headroom, just below the chin at the
  // bottom, a little air on the sides.
  const x = Math.max(0, Math.round(box.originX - box.width * 0.45));
  const y = Math.max(0, Math.round(box.originY - box.height * 0.75));
  const w = Math.min(full.width - x, Math.round(box.width * 1.9));
  const h = Math.min(full.height - y, Math.round(box.height * 2.1));

  const crop = new OffscreenCanvas(w, h);
  const cropCtx = crop.getContext("2d");
  cropCtx.drawImage(full, x, y, w, h, 0, 0, w, h);

  const alphaMask = await headAlphaMask(crop, progress);
  progress(85, "compose");
  cropCtx.globalCompositeOperation = "destination-in";
  cropCtx.drawImage(alphaMask, 0, 0);
  return { canvas: crop };
}

/**
 * Segment a head crop with the multiclass model and return a canvas the size
 * of `sourceCanvas` whose ALPHA is hair + face-skin + accessories combined —
 * i.e. the head, without neck (body-skin) or clothes.
 */
async function headAlphaMask(sourceCanvas, progress) {
  const seg = await getMulticlassSegmenter(progress);
  progress(45, "segment");

  const result = seg.segment(sourceCanvas);
  try {
    const masks = result.confidenceMasks;
    if (!masks || masks.length <= MC_FACE_SKIN) {
      throw new Error("Couldn't segment the face in this photo.");
    }
    const hair = masks[MC_HAIR].getAsFloat32Array();
    const face = masks[MC_FACE_SKIN].getAsFloat32Array();
    const extras = masks[MC_ACCESSORIES]?.getAsFloat32Array();
    const { width, height } = masks[MC_FACE_SKIN];

    const maskCanvas = new OffscreenCanvas(width, height);
    const maskCtx = maskCanvas.getContext("2d");
    const image = maskCtx.createImageData(width, height);
    for (let i = 0; i < face.length; i += 1) {
      const value = Math.min(1, hair[i] + face[i] + (extras ? extras[i] : 0));
      image.data[i * 4 + 3] = Math.round(value * 255);
    }
    maskCtx.putImageData(image, 0, 0);

    // Upscale the mask to the crop's resolution (smooth interpolation).
    const fullSize = new OffscreenCanvas(sourceCanvas.width, sourceCanvas.height);
    const ctx = fullSize.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(maskCanvas, 0, 0, fullSize.width, fullSize.height);
    return fullSize;
  } finally {
    result.close(); // frees the MPMask GPU/CPU buffers
  }
}
