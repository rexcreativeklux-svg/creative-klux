// Main-thread client for the sketch worker (dodge pencil + line-art model).

import { createWorkerClient } from "../core/workerRpc";
import { sourceToBitmap } from "../core/imageSource";

const client = createWorkerClient(
  () =>
    new Worker(new URL("../workers/sketch.worker.js", import.meta.url), {
      type: "module",
    }),
  "sketch",
);

/** Free the worker and its model — call when leaving the tool. */
export function disposeSketchWorker() {
  client.dispose();
}

/**
 * Turn a photo into a sketch, fully on-device. Style ids come from
 * {@link module:sketchStyles.SKETCH_STYLES}; dodge styles are instant, the
 * line-art styles download their 17 MB model once, then come from cache.
 *
 * @param {File|Blob|string} source Upload, blob, or (CORS-enabled) image URL.
 * @param {{ style?: string, params?: object, onProgress?: Function }} [opts]
 *   `params` overrides individual style parameters (e.g. `{ keepChroma: 0.85 }`
 *   to keep the photo's colour in the strokes of ANY dodge style) without
 *   inventing a registry entry per combination.
 * @returns {Promise<{blob: Blob, width: number, height: number, ep: string}>}
 */
export async function sketchImage(source, { style, params, onProgress } = {}) {
  const bitmap = await sourceToBitmap(source);
  return client.call({ task: "sketch", bitmap, styleId: style, params }, [bitmap], onProgress);
}

/**
 * Fast path: re-render the LAST photo in a different style (the worker keeps
 * the source — and the model's line map — cached, so this is near-instant).
 */
export async function resketchImage({ style, params, onProgress } = {}) {
  return client.call({ task: "resketch", styleId: style, params }, [], onProgress);
}
