// Magic Eraser: content-aware fill (in-browser inpainting).
// Ported for creative-klux's photo editor. Removes the masked region and
// reconstructs the background beneath it in two stages: (1) boundary-inward BFS
// propagation — every masked pixel is filled with the average colour of its
// already-filled neighbours, spreading from the edge of the mask toward its
// centre (fast, structure-following, no smearing at the seam); (2) a few
// smoothing passes over the filled region to blend it into the surrounding
// pixels. Good on small/medium objects over fairly uniform backgrounds; softer
// on busy textures — the trade-off of a fast, no-API fill.

// Cap the working resolution so the fill stays responsive.
export const INPAINT_MAXD = 1200;

// data: Uint8ClampedArray RGBA (mutated in place). mask: Uint8Array (1 = remove/fill).
export const inpaintMasked = (data, w, h, mask) => {
  const N = w * h;
  const filled = new Uint8Array(N); // 1 = known pixel (usable as a source)
  let toFill = 0;
  for (let i = 0; i < N; i++) {
    filled[i] = mask[i] ? 0 : 1;
    if (mask[i]) toFill++;
  }
  if (toFill === 0 || toFill === N) return; // nothing to do / nothing to sample from

  const queue = new Int32Array(N); // each pixel is enqueued at most once
  const queued = new Uint8Array(N);
  let qh = 0,
    qt = 0;

  // Seed: masked pixels touching a known pixel (4-connected).
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (filled[idx]) continue;
      if (
        (x > 0 && filled[idx - 1]) ||
        (x < w - 1 && filled[idx + 1]) ||
        (y > 0 && filled[idx - w]) ||
        (y < h - 1 && filled[idx + w])
      ) {
        queue[qt++] = idx;
        queued[idx] = 1;
      }
    }
  }

  // BFS boundary-inward fill (8-neighbour average of filled sources).
  while (qh < qt) {
    const idx = queue[qh++];
    const x = idx % w,
      y = (idx / w) | 0;
    let r = 0,
      g = 0,
      b = 0,
      cnt = 0;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        if (nx < 0 || nx >= w) continue;
        const nidx = ny * w + nx;
        if (filled[nidx]) {
          const p = nidx * 4;
          r += data[p];
          g += data[p + 1];
          b += data[p + 2];
          cnt++;
        }
      }
    }
    if (cnt) {
      const p = idx * 4;
      data[p] = r / cnt;
      data[p + 1] = g / cnt;
      data[p + 2] = b / cnt;
      data[p + 3] = 255;
    }
    filled[idx] = 1;
    // Enqueue still-unfilled 4-neighbours.
    if (x > 0 && !filled[idx - 1] && !queued[idx - 1]) {
      queue[qt++] = idx - 1;
      queued[idx - 1] = 1;
    }
    if (x < w - 1 && !filled[idx + 1] && !queued[idx + 1]) {
      queue[qt++] = idx + 1;
      queued[idx + 1] = 1;
    }
    if (y > 0 && !filled[idx - w] && !queued[idx - w]) {
      queue[qt++] = idx - w;
      queued[idx - w] = 1;
    }
    if (y < h - 1 && !filled[idx + w] && !queued[idx + w]) {
      queue[qt++] = idx + w;
      queued[idx + w] = 1;
    }
  }

  // Smoothing: blend the filled region with a small box blur (masked pixels only).
  for (let pass = 0; pass < 4; pass++) {
    const copy = new Uint8ClampedArray(data);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (!mask[idx]) continue;
        let r = 0,
          g = 0,
          b = 0,
          cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            const p = (ny * w + nx) * 4;
            r += copy[p];
            g += copy[p + 1];
            b += copy[p + 2];
            cnt++;
          }
        }
        const p = idx * 4;
        data[p] = r / cnt;
        data[p + 1] = g / cnt;
        data[p + 2] = b / cnt;
      }
    }
  }
};
