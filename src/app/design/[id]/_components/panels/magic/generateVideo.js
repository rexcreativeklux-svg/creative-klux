import { MagicNotConnectedError } from "./magicErrors";

/**
 * generateVideo — integration seam for Magic Studio text-to-video. Replace the
 * body with the real call when ready.
 *
 * Contract:
 *   input : { prompt: string, count: number }
 *   output: Promise<Array<{ id: string, url: string, poster?: string, prompt: string }>>
 *
 * Note: the editor composes designs to a static image and has no video element
 * yet, so decide at wire-up time what dropping a video result should do (e.g.
 * insert its poster frame). Until then this stays a clean stub.
 */
export async function generateVideo({ prompt, count } = {}) {
  // TODO: paste the real video call here and return the array shape above.
  //   const res = await fetch("/api/magic-media/video", { method: "POST", ... });
  //   const data = await res.json();
  //   return data.videos.map((v) => ({ id: v.id, url: v.url, poster: v.poster, prompt }));
  throw new MagicNotConnectedError("video generation");
}
