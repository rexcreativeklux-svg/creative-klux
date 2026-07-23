// Image perspective (keystone) warp for the design editor's image elements.
// A trapezoid taper — the same look the standalone photo editor produces — done
// with thin-strip drawImage so it works identically on the on-screen <canvas>
// and in the PNG export (no CSS 3D, which canvas can't reproduce). `h`/`v` are
// −100…100; 0 = no warp.

// Taper an image canvas along one axis. axis 'v' tapers top↔bottom (vertical
// perspective) via horizontal strips; 'h' tapers left↔right via vertical strips.
// amt is −1…1.
function keystone(srcCanvas, axis, amt) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const o = out.getContext("2d");
  const taper = Math.min(0.85, Math.abs(amt) * 0.85); // max shrink of the far edge
  if (axis === "v") {
    for (let y = 0; y < h; y++) {
      const t = y / (h - 1 || 1); // 0 top → 1 bottom
      const f = amt >= 0 ? 1 - taper * t : 1 - taper * (1 - t);
      const dw = w * f;
      const dx = (w - dw) / 2;
      o.drawImage(srcCanvas, 0, y, w, 1, dx, y, dw, 1);
    }
  } else {
    for (let x = 0; x < w; x++) {
      const t = x / (w - 1 || 1); // 0 left → 1 right
      const f = amt >= 0 ? 1 - taper * t : 1 - taper * (1 - t);
      const dh = h * f;
      const dy = (h - dh) / 2;
      o.drawImage(srcCanvas, x, 0, 1, h, x, dy, 1, dh);
    }
  }
  return out;
}

// Cover-draw an image into a w×h canvas (fills the box, centred, no distortion).
function drawCover(ctx, img, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const ir = iw / ih;
  const br = w / h;
  let dw, dh;
  if (ir > br) {
    dh = h;
    dw = h * ir;
  } else {
    dw = w;
    dh = w / ir;
  }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/**
 * warpPerspective — cover-draw `img` into a w×h canvas (box aspect), then apply
 * horizontal + vertical keystone. Returns the warped canvas. Because the shape
 * only depends on the amounts (not the working resolution), the on-screen and
 * export renders always match.
 */
export function warpPerspective(img, w, h, hAmt = 0, vAmt = 0) {
  const base = document.createElement("canvas");
  base.width = Math.max(1, w);
  base.height = Math.max(1, h);
  drawCover(base.getContext("2d"), img, base.width, base.height);
  let result = base;
  if (vAmt) result = keystone(result, "v", vAmt / 100);
  if (hAmt) result = keystone(result, "h", hAmt / 100);
  return result;
}

/** True when an element has a non-zero perspective. */
export function hasPerspective(el) {
  return !!(el?.perspective && (el.perspective.h || el.perspective.v));
}
