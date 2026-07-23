/**
 * Image crop geometry for the design editor.
 *
 * A crop is stored on an image element as `el.crop = { x, y, w, h }`, all
 * normalized to the natural image [0..1] — the visible sub-rectangle. It renders
 * non-destructively (a source-rect → box mapping) in both the editor and the PNG
 * export, so cropping never rasterizes or loses quality.
 */

// The natural-image sub-rectangle currently visible for an object-fit: cover
// image in a W×H box — used as the starting point when cropping an uncropped
// image, so switching to the crop renderer looks identical.
export function coverCrop(W, H, nw, nh) {
  if (!nw || !nh) return { x: 0, y: 0, w: 1, h: 1 };
  const scale = Math.max(W / nw, H / nh);
  const dispW = nw * scale;
  const dispH = nh * scale;
  const w = Math.min(1, W / dispW);
  const h = Math.min(1, H / dispH);
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

// Whether a crop actually trims anything (vs. the full image).
export function isCropped(c) {
  return (
    !!c &&
    (c.x > 0.0001 || c.y > 0.0001 || c.w < 0.9999 || c.h < 0.9999)
  );
}
