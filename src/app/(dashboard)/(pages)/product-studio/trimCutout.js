// Crop a background-removed cutout to the product itself. Background removal
// returns the photo's full frame with a transparent margin around the product;
// left in, that margin counts toward a template's slot and the product comes
// out small. Shared by the "Pick a style" window and the photo editor's slot
// fill, so both frame a product the same way.

/** Alpha above this counts as product (drops faint halo pixels). */
const ALPHA_FLOOR = 24;

/**
 * Bounds of the opaque pixels in an image, padded a little. Null when nothing
 * is opaque (the model kept nothing).
 *
 * @param {ImageBitmap|HTMLImageElement} img
 * @returns {{left:number, top:number, w:number, h:number, W:number, H:number}|null}
 */
export function productBounds(img) {
  const W = img.width || img.naturalWidth;
  const H = img.height || img.naturalHeight;
  const scan = document.createElement("canvas");
  scan.width = W;
  scan.height = H;
  const ctx = scan.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  // Every other pixel is plenty for a bounding box and halves the scan.
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > ALPHA_FLOOR) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  const pad = 4;
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  return {
    left,
    top,
    w: Math.min(W, x1 + pad + 1) - left,
    h: Math.min(H, y1 + pad + 1) - top,
    W,
    H,
  };
}

/**
 * The window `b` cut out of `img` as a PNG blob URL. `scale` maps the bounds
 * onto an image of a different size (the original photo can be larger than
 * the cutout, which is RAM-capped).
 */
export async function cropToBounds(img, b, scale = 1) {
  const c = document.createElement("canvas");
  c.width = b.w;
  c.height = b.h;
  c.getContext("2d").drawImage(img, b.left * scale, b.top * scale, b.w * scale, b.h * scale, 0, 0, b.w, b.h);
  const blob = await new Promise((resolve) => c.toBlob(resolve, "image/png"));
  return URL.createObjectURL(blob);
}
