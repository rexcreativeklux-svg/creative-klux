import { MagicNotConnectedError } from "./magicErrors";

/**
 * generateImages — integration seam for Magic Studio text-to-image. The panel
 * above it is UI-only and already works; when the image service is ready,
 * replace the body with the real call.
 *
 * Contract:
 *   input : { prompt: string, style: string, aspect: {id,w,h,ratio}, count: number }
 *   output: Promise<Array<{ id: string, url: string, prompt: string }>>
 */
export async function generateImages({ prompt, style, aspect, count } = {}) {
  // TODO: paste the real image call here and return the array shape above.
  //   const res = await fetch("/api/magic-media/images", { method: "POST", ... });
  //   const data = await res.json();
  //   return data.images.map((img) => ({ id: img.id, url: img.url, prompt }));
  throw new MagicNotConnectedError("image generation");
}
