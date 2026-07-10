// Main-thread client for the auto-enhance worker (Product Beautifier's smart
// color stage — pure math, no model, alpha-aware).

import { createWorkerClient } from "../core/workerRpc";
import { sourceToBitmap } from "../core/imageSource";

const client = createWorkerClient(
  () =>
    new Worker(new URL("../workers/enhance.worker.js", import.meta.url), {
      type: "module",
    }),
  "enhance",
);

/** Free the worker — call when leaving the tool page. */
export function disposeEnhanceWorker() {
  client.dispose();
}

/**
 * Auto-enhance an image on-device: exposure, white balance, adaptive contrast,
 * vibrance, tone curve and sharpening — strengths picked by quality tier.
 * Transparent pixels are never touched, so cutout edges stay clean.
 *
 * @param {File|Blob|string} source Upload, blob, or (CORS-enabled) image URL.
 * @param {object} [opts]
 * @param {"Standard"|"High"|"Ultra"} [opts.tier="High"] Stage strengths.
 * @param {number} [opts.maxEdge=0] Optional long-edge cap — pass the next
 *   stage's input budget (e.g. the upscaler's 1024) to skip wasted pixels.
 * @param {(p:{pct:number}) => void} [opts.onProgress]
 * @returns {Promise<{blob: Blob, width: number, height: number}>}
 */
export async function enhanceImage(source, { tier = "High", maxEdge = 0, onProgress } = {}) {
  const bitmap = await sourceToBitmap(source);
  return client.call({ task: "enhance", bitmap, tier, maxEdge }, [bitmap], onProgress);
}
