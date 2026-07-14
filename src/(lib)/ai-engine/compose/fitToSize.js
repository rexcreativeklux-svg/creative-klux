// Pure-canvas compositor shared by the on-device Product Studio tools. Places a
// transparent product cutout onto a target-size canvas (aspect ratio + quality
// resolution), centered with padding, on a chosen background. If the product is
// small relative to the target slot, it's upscaled first (via the engine's
// tiled Real-ESRGAN) so it fills the frame crisply instead of pixelating.
//
// No model of its own — it just arranges pixels, so it's instant.

import { upscaleImage } from "../tasks/upscaleImage";

/**
 * Long-edge pixel budget per quality tier. Standard≈1K, High≈2K, Ultra≈4K —
 * matches the QUALITY_RES map the modals already show (1K/2K/4K).
 */
export const QUALITY_LONG_EDGE = {
  Standard: 1024,
  High: 2048,
  Ultra: 4096,
};

/** Upscale tier used when the product must be enlarged to fill the slot. */
const QUALITY_UPSCALE_TIER = {
  Standard: "standard",
  High: "standard",
  Ultra: "hd",
};

/**
 * Target output pixel dimensions for a {w,h} aspect ratio at a quality tier.
 * The long edge hits the tier budget; the short edge follows the ratio.
 */
export function targetDimensions({ w, h }, quality) {
  const longEdge = QUALITY_LONG_EDGE[quality] || QUALITY_LONG_EDGE.High;
  if (w >= h)
    return { width: longEdge, height: Math.round((longEdge * h) / w) };
  return { width: Math.round((longEdge * w) / h), height: longEdge };
}

/**
 * Frame a FULL photo (background kept) onto a target-ratio canvas — used by the
 * Beautifier's default "Original background" mode. When the photo's ratio
 * doesn't match the target, the gap is filled with a blurred cover-scaled copy
 * of the photo (the pro "blur-extend" look) instead of hard bars.
 *
 * @param {Blob} imageBlob The enhanced/upscaled photo, background and all.
 * @param {object} opts
 * @param {{w:number,h:number}} opts.ratio Output aspect ratio.
 * @param {"Standard"|"High"|"Ultra"} opts.quality Output resolution tier.
 * @param {boolean} [opts.originalSize=false] Keep the photo's OWN ratio (the
 *   "Original" size id) — no reframing, just capped to the tier's long edge.
 * @param {(p:{pct:number}) => void} [opts.onProgress]
 * @returns {Promise<{blob: Blob, width: number, height: number}>}
 */
export async function frameToRatio(
  imageBlob,
  { ratio, quality, originalSize = false, onProgress } = {},
) {
  const bitmap = await createImageBitmap(imageBlob);
  onProgress?.({ pct: 20 });

  let width;
  let height;
  if (originalSize) {
    const budget = QUALITY_LONG_EDGE[quality] || QUALITY_LONG_EDGE.High;
    const scale = Math.min(1, budget / Math.max(bitmap.width, bitmap.height));
    width = Math.max(1, Math.round(bitmap.width * scale));
    height = Math.max(1, Math.round(bitmap.height * scale));
  } else {
    ({ width, height } = targetDimensions(ratio, quality));
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const contain = Math.min(width / bitmap.width, height / bitmap.height);
  const cw = bitmap.width * contain;
  const ch = bitmap.height * contain;

  // Ratio mismatch → blurred cover fill behind the sharp photo (no hard bars).
  if (Math.abs(cw - width) > 1 || Math.abs(ch - height) > 1) {
    const cover = Math.max(width / bitmap.width, height / bitmap.height);
    const vw = bitmap.width * cover;
    const vh = bitmap.height * cover;
    ctx.filter = `blur(${Math.max(12, Math.round(Math.max(width, height) / 40))}px)`;
    ctx.drawImage(bitmap, (width - vw) / 2, (height - vh) / 2, vw, vh);
    ctx.filter = "none";
  }

  ctx.drawImage(bitmap, (width - cw) / 2, (height - ch) / 2, cw, ch);
  bitmap.close();
  onProgress?.({ pct: 90 });

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compose failed"))),
      "image/png",
    ),
  );
  return { blob, width, height };
}

/**
 * Compose a cutout onto a sized canvas.
 *
 * @param {Blob} cutoutBlob Transparent PNG cutout (product only).
 * @param {object} opts
 * @param {{w:number,h:number}} opts.ratio Output aspect ratio (e.g. {w:1,h:1}).
 * @param {"Standard"|"High"|"Ultra"} opts.quality Output resolution tier.
 * @param {number} [opts.padding=0.08] Fraction of the slot kept as margin (0–0.4).
 * @param {string} [opts.background="transparent"] "transparent" or a CSS color.
 * @param {"center"|"bottom"} [opts.align="center"] Vertical placement.
 * @param {(p:{pct:number}) => void} [opts.onProgress] Progress for the upscale step.
 * @returns {Promise<{blob: Blob, width: number, height: number}>} Composited PNG.
 */
export async function fitToSize(
  cutoutBlob,
  {
    ratio,
    quality,
    padding = 0.08,
    background = "transparent",
    align = "center",
    onProgress,
  } = {},
) {
  const { width, height } = targetDimensions(ratio, quality);
  const pad = Math.max(0, Math.min(0.4, padding));
  // The area the product may occupy inside the padded slot.
  const slotW = width * (1 - pad * 2);
  const slotH = height * (1 - pad * 2);

  let bitmap = await createImageBitmap(cutoutBlob);

  // If the product is smaller than the slot it must fill, enlarge it FIRST with
  // the AI upscaler (so edges stay sharp), then draw. We only bother when the
  // shortfall is meaningful — a 4× tiled pass is not free.
  const fitScale = Math.min(slotW / bitmap.width, slotH / bitmap.height);
  if (fitScale > 1.15) {
    console.log(
      `🔎 fitToSize: product small for slot (×${fitScale.toFixed(2)}) — upscaling to fit`,
    );
    try {
      const { blob: upBlob } = await upscaleImage(cutoutBlob, {
        tier: QUALITY_UPSCALE_TIER[quality] || "standard",
        onProgress,
      });
      bitmap.close();
      bitmap = await createImageBitmap(upBlob);
    } catch (err) {
      // Upscaling is an enhancement, not a requirement — if it fails we still
      // compose with the original cutout (canvas will bilinear-scale it).
      console.warn(
        "⚠️ fitToSize: upscale-to-fit failed, composing original:",
        err?.message,
      );
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (background && background !== "transparent") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }

  // Contain the (possibly upscaled) product within the slot, preserving ratio.
  const drawScale = Math.min(slotW / bitmap.width, slotH / bitmap.height);
  const dw = bitmap.width * drawScale;
  const dh = bitmap.height * drawScale;
  const dx = (width - dw) / 2;
  const dy = align === "bottom" ? height * (1 - pad) - dh : (height - dh) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, dx, dy, dw, dh);
  bitmap.close();

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compose failed"))),
      "image/png",
    ),
  );
  return { blob, width, height };
}
