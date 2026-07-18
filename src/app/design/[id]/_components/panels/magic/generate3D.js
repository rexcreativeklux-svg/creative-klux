import { MagicNotConnectedError } from "./magicErrors";

/**
 * generate3D — integration seam for Magic Studio text-to-3D. Replace the body
 * with the real call when ready.
 *
 * Contract:
 *   input : { prompt: string, count: number }
 *   output: Promise<Array<{ id: string, url: string, prompt: string }>>
 *
 * `url` is expected to be a rendered preview image the panel can show and drop
 * onto the canvas; carry any model/scene reference alongside it when wiring.
 */
export async function generate3D({ prompt, count } = {}) {
  // TODO: paste the real 3D call here and return the array shape above.
  //   const res = await fetch("/api/magic-media/3d", { method: "POST", ... });
  //   const data = await res.json();
  //   return data.renders.map((r) => ({ id: r.id, url: r.previewUrl, prompt }));
  throw new MagicNotConnectedError("3D generation");
}
