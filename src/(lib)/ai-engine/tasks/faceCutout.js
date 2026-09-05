// Main-thread client for the face-cutout worker (MediaPipe).

import { createWorkerClient } from "../core/workerRpc";
import { sourceToBitmap } from "../core/imageSource";

const client = createWorkerClient(
  () =>
    new Worker(new URL("../workers/faceCutout.worker.js", import.meta.url), {
      type: "module",
    }),
  "faceCutout",
);

/** Free the worker and its models — call when leaving the tool. */
export function disposeFaceCutoutWorker() {
  client.dispose();
}

/**
 * Face Cutout — a transparent PNG of the head/shoulders around the face
 * (hair + face-skin + headwear; neck and clothes drop away), fully on-device.
 *
 * @param {File|Blob|string} source Upload, blob, or (CORS-enabled) image URL.
 * @param {{ onProgress?: Function }} [opts]
 * @returns {Promise<{blob: Blob, width: number, height: number}>}
 */
export async function cutoutFace(source, { onProgress } = {}) {
  const bitmap = await sourceToBitmap(source);
  return client.call({ task: "faceCutout", bitmap }, [bitmap], onProgress);
}
