// Object grabber for the Flat Lay tool. Takes a transparent cutout (the whole
// photo with its background removed → alpha marks all the product items) and
// separates it into individual items via connected-components labeling on the
// alpha mask. Each item is cropped to its own transparent blob + bounding box,
// so the Flat Lay UI can arrange them freely on a clean canvas.
//
// Pure JS/canvas — no model. The cutout it operates on comes from the segmentation
// worker (removeBackground); this just partitions that mask.

/**
 * @param {Blob} cutoutBlob Transparent PNG (all items, background removed).
 * @param {object} [opts]
 * @param {number} [opts.alphaThreshold=24] Alpha ≥ this counts as "foreground".
 * @param {number} [opts.minAreaFrac=0.004] Drop blobs smaller than this fraction
 *   of the image area (noise / stray speckles).
 * @param {number} [opts.maxItems=20] Safety cap on how many items to return.
 * @param {number} [opts.padding=6] Transparent px padding around each cropped item.
 * @returns {Promise<Array<{blob: Blob, x: number, y: number, w: number, h: number}>>}
 *   Items sorted largest-first. `x,y,w,h` are the item's bbox in the source image.
 */
export async function grabObjects(cutoutBlob, {
  alphaThreshold = 24,
  minAreaFrac = 0.004,
  maxItems = 20,
  padding = 6,
} = {}) {
  const bitmap = await createImageBitmap(cutoutBlob);
  const W = bitmap.width;
  const H = bitmap.height;
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, W, H);

  // Label connected foreground pixels with iterative flood fill (8-neighbour).
  // labels: 0 = unvisited/background, ≥1 = component id.
  const labels = new Int32Array(W * H);
  const components = []; // { id, minX, minY, maxX, maxY, area }
  const stack = [];
  let nextId = 0;

  const isFg = (i) => data[i * 4 + 3] >= alphaThreshold;

  for (let start = 0; start < W * H; start += 1) {
    if (labels[start] !== 0 || !isFg(start)) continue;
    nextId += 1;
    const comp = { id: nextId, minX: W, minY: H, maxX: 0, maxY: 0, area: 0 };
    stack.length = 0;
    stack.push(start);
    labels[start] = nextId;

    while (stack.length) {
      const p = stack.pop();
      const x = p % W;
      const y = (p / W) | 0;
      comp.area += 1;
      if (x < comp.minX) comp.minX = x;
      if (y < comp.minY) comp.minY = y;
      if (x > comp.maxX) comp.maxX = x;
      if (y > comp.maxY) comp.maxY = y;

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const np = ny * W + nx;
          if (labels[np] === 0 && isFg(np)) {
            labels[np] = nextId;
            stack.push(np);
          }
        }
      }
    }
    components.push(comp);
  }

  // Keep only meaningful blobs, largest first, capped.
  const minArea = W * H * minAreaFrac;
  const kept = components
    .filter((c) => c.area >= minArea)
    .sort((a, b) => b.area - a.area)
    .slice(0, maxItems);

  // If nothing survived (e.g. one solid item), fall back to the whole cutout.
  if (kept.length === 0) {
    return [{ blob: cutoutBlob, x: 0, y: 0, w: W, h: H }];
  }

  // Crop each kept component to its own transparent PNG, masking out pixels that
  // belong to OTHER components (so touching items don't bleed into each other).
  const items = [];
  for (const comp of kept) {
    const bw = comp.maxX - comp.minX + 1;
    const bh = comp.maxY - comp.minY + 1;
    const cw = bw + padding * 2;
    const ch = bh + padding * 2;
    const itemCanvas = new OffscreenCanvas(cw, ch);
    const ictx = itemCanvas.getContext("2d");
    const out = ictx.createImageData(cw, ch);
    for (let y = 0; y < bh; y += 1) {
      for (let x = 0; x < bw; x += 1) {
        const sx = comp.minX + x;
        const sy = comp.minY + y;
        const sIdx = sy * W + sx;
        if (labels[sIdx] !== comp.id) continue; // not this item's pixel
        const s = sIdx * 4;
        const d = ((y + padding) * cw + (x + padding)) * 4;
        out.data[d] = data[s];
        out.data[d + 1] = data[s + 1];
        out.data[d + 2] = data[s + 2];
        out.data[d + 3] = data[s + 3];
      }
    }
    ictx.putImageData(out, 0, 0);
    const blob = await itemCanvas.convertToBlob({ type: "image/png" });
    items.push({ blob, x: comp.minX - padding, y: comp.minY - padding, w: cw, h: ch });
  }
  return items;
}
