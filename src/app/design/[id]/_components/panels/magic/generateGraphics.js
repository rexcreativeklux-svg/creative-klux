import { MagicNotConnectedError } from "./magicErrors";

/**
 * generateGraphics — integration seam for Magic Studio graphics (stickers /
 * illustrations, typically transparent PNGs). Separate from images because it
 * usually hits a different endpoint and has no aspect ratio. Replace the body
 * with the real call when ready.
 *
 * Contract:
 *   input : { prompt: string, style: string, count: number }
 *   output: Promise<Array<{ id: string, url: string, prompt: string }>>
 */
export async function generateGraphics({ prompt, style, count } = {}) {
  // TODO: paste the real graphics call here and return the array shape above.
  //   const res = await fetch("/api/magic-media/graphics", { method: "POST", ... });
  //   const data = await res.json();
  //   return data.graphics.map((g) => ({ id: g.id, url: g.url, prompt }));
  throw new MagicNotConnectedError("graphics generation");
}
