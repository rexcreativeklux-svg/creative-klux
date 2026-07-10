// Main-thread client for the background-removal worker. Decodes the image,
// hands it to the worker (zero-copy transfer) and returns a promise:
//
//   const { blob, width, height } = await removeBackground(fileOrUrl, {
//     onProgress: ({ pct, stage, downloading }) => …,
//   });

import { createWorkerClient } from "../core/workerRpc";
import { defaultSegmentationModelKey } from "../core/device";
import { sourceToBitmap } from "../core/imageSource";

const client = createWorkerClient(
  () =>
    new Worker(new URL("../workers/segmentation.worker.js", import.meta.url), {
      type: "module",
    }),
  "segmentation",
);

/**
 * Free the worker and the model session it holds. Call when leaving the tool
 * page — keeps background RAM at zero when no AI tool is in use.
 */
export function disposeSegmentationWorker() {
  client.dispose();
}

/**
 * Remove the background from an image, fully on-device.
 *
 * @param {File|Blob|string} source Upload, blob, or (CORS-enabled) image URL.
 * @param {object} [opts]
 * @param {"u2netp"|"silueta"} [opts.modelKey] Model tier; defaults per device RAM.
 * @param {(p: {pct:number, stage:string, downloading?:boolean}) => void} [opts.onProgress]
 * @returns {Promise<{blob: Blob, width: number, height: number, ep: string}>}
 *   `blob` is a transparent PNG cutout at the source resolution (RAM-capped).
 */
export async function removeBackground(source, { modelKey, onProgress } = {}) {
  const bitmap = await sourceToBitmap(source);
  return client.call(
    {
      task: "removeBackground",
      modelKey: modelKey || defaultSegmentationModelKey(),
      bitmap,
    },
    [bitmap],
    onProgress,
  );
}
