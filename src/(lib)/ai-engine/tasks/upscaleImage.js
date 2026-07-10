// Main-thread client for the upscale worker (Real-ESRGAN 4×, tiled).

import { createWorkerClient } from "../core/workerRpc";
import { sourceToBitmap } from "../core/imageSource";

const client = createWorkerClient(
  () =>
    new Worker(new URL("../workers/upscale.worker.js", import.meta.url), {
      type: "module",
    }),
  "upscale",
);

/** Free the worker and its model — call when leaving the tool page. */
export function disposeUpscaleWorker() {
  client.dispose();
}

/**
 * Enhance + 4× upscale an image, fully on-device (tiled, constant RAM).
 *
 * @param {File|Blob|string} source Upload, blob, or (CORS-enabled) image URL.
 * @param {{ tier?: "standard"|"hd", onProgress?: Function }} [opts]
 *   `tier: "hd"` runs the 67 MB Real-ESRGAN x4plus (WebGPU only — the worker
 *   auto-falls-back to standard and reports the tier it actually used).
 * @returns {Promise<{blob: Blob, width: number, height: number, ep: string, tier: string}>}
 */
export async function upscaleImage(source, { tier = "standard", onProgress } = {}) {
  const bitmap = await sourceToBitmap(source);
  return client.call({ task: "upscale", bitmap, tier }, [bitmap], onProgress);
}
