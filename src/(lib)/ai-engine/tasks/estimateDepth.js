// Main-thread client for the depth worker (Depth Anything V2 Small via
// transformers.js). Decodes the image and returns a grayscale depth-map blob.

import { createWorkerClient } from "../core/workerRpc";
import { sourceToBitmap } from "../core/imageSource";

const client = createWorkerClient(
  () =>
    new Worker(new URL("../workers/depth.worker.js", import.meta.url), {
      type: "module",
    }),
  "depth",
);

/** Free the worker and its model — call when leaving the tool. */
export function disposeDepthWorker() {
  client.dispose();
}

/**
 * Estimate a depth map for an image, fully on-device.
 *
 * @param {File|Blob|string} source Upload, blob, or (CORS-enabled) image URL.
 * @param {{ onProgress?: Function }} [opts]
 * @returns {Promise<{depthBlob: Blob, width: number, height: number}>}
 *   `depthBlob` is a grayscale PNG (near = bright, far = dark).
 */
export async function estimateDepth(source, { onProgress } = {}) {
  const bitmap = await sourceToBitmap(source);
  return client.call({ task: "estimateDepth", bitmap }, [bitmap], onProgress);
}
