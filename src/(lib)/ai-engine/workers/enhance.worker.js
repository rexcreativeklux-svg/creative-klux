// Auto-enhance worker — the Product Beautifier's "smart color" stage. Pure
// typed-array math (NO model): the same multi-stage pipeline commercial
// auto-enhance tools run, tuned per quality tier. Commercially safe (the
// trained enhancement nets — Zero-DCE etc. — are all non-commercial licenses)
// and tiny on RAM, so it runs everywhere, even 2 GB devices.
//
// Stages (in the order pro pipelines apply them), all ALPHA-AWARE — only the
// product's opaque pixels are measured and modified, so cutout edges stay clean:
//   1. auto exposure   — histogram percentile stretch (black/white point)
//   2. white balance   — bounded gray-world (won't neutralize colored products)
//   3. CLAHE           — clip-limited adaptive local contrast on luminance
//   4. vibrance        — boosts dull colors, protects already-rich ones
//   5. tone curve      — shadow lift + soft S-curve (single LUT)
//   6. unsharp mask    — separable box-blur based sharpening
//
// Message contract (matches workerRpc):
//   in : { id, task: "enhance", bitmap, tier, maxEdge }
//   out: { id, type: "progress", pct } | { id, type: "done", blob, width, height }
//        | { id, type: "error", message }

/** Per-tier stage strengths — ONE place to tune after visual review. */
const TIER_PRESETS = {
  Standard: { wb: 0.5, claheClip: 0, vibrance: 0, shadowLift: 0.02, sCurve: 0.06, sharpen: 0.25 },
  High: { wb: 0.7, claheClip: 1.8, vibrance: 0.18, shadowLift: 0.03, sCurve: 0.09, sharpen: 0.45 },
  Ultra: { wb: 0.85, claheClip: 2.4, vibrance: 0.26, shadowLift: 0.04, sCurve: 0.12, sharpen: 0.6 },
};

const ALPHA_MIN = 16; // below this a pixel is "background" — never touched
const CLAHE_GRID = 8; // 8×8 tile grid, the standard CLAHE layout

/** Rec.601 luma of one pixel (0–255). */
function lumaOf(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 1+2 — auto exposure (percentile stretch) + bounded gray-world white balance,
 * both computed over opaque pixels only and applied in one pass.
 */
function autoExposureWhiteBalance(data, wbStrength) {
  const hist = new Uint32Array(256);
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_MIN) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    hist[Math.round(lumaOf(r, g, b))] += 1;
    sumR += r;
    sumG += g;
    sumB += b;
    count += 1;
  }
  if (count === 0) return;

  // Black/white points at the 0.5% / 99.5% luma percentiles.
  const lowTarget = count * 0.005;
  const highTarget = count * 0.995;
  let acc = 0;
  let low = 0;
  let high = 255;
  for (let v = 0; v < 256; v += 1) {
    acc += hist[v];
    if (acc <= lowTarget) low = v;
    if (acc <= highTarget) high = v;
  }
  const range = Math.max(24, high - low); // never explode a near-flat image
  const stretch = 255 / range;

  // Bounded gray-world gains — clamped so a genuinely red product stays red.
  const meanR = sumR / count;
  const meanG = sumG / count;
  const meanB = sumB / count;
  const gray = (meanR + meanG + meanB) / 3;
  const clampGain = (x) => Math.min(1.25, Math.max(0.85, x));
  const gainR = 1 + (clampGain(gray / (meanR || 1)) - 1) * wbStrength;
  const gainG = 1 + (clampGain(gray / (meanG || 1)) - 1) * wbStrength;
  const gainB = 1 + (clampGain(gray / (meanB || 1)) - 1) * wbStrength;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_MIN) continue;
    data[i] = (data[i] - low) * stretch * gainR;
    data[i + 1] = (data[i + 1] - low) * stretch * gainG;
    data[i + 2] = (data[i + 2] - low) * stretch * gainB;
  }
}

/**
 * 3 — CLAHE on the luminance channel. Per-tile clipped histograms → CDF LUTs,
 * bilinearly interpolated between tile centers; RGB scaled by newLuma/oldLuma
 * so hue and saturation are preserved.
 */
function clahe(data, width, height, clipLimit) {
  const tilesX = CLAHE_GRID;
  const tilesY = CLAHE_GRID;
  const tileW = Math.ceil(width / tilesX);
  const tileH = Math.ceil(height / tilesY);
  const luts = []; // per-tile 256-entry LUT

  for (let ty = 0; ty < tilesY; ty += 1) {
    for (let tx = 0; tx < tilesX; tx += 1) {
      const hist = new Uint32Array(256);
      let count = 0;
      const x0 = tx * tileW;
      const y0 = ty * tileH;
      const x1 = Math.min(width, x0 + tileW);
      const y1 = Math.min(height, y0 + tileH);
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const i = (y * width + x) * 4;
          if (data[i + 3] < ALPHA_MIN) continue;
          hist[Math.round(lumaOf(data[i], data[i + 1], data[i + 2]))] += 1;
          count += 1;
        }
      }
      const lut = new Uint8Array(256);
      if (count === 0) {
        for (let v = 0; v < 256; v += 1) lut[v] = v; // empty tile → identity
      } else {
        // Clip histogram peaks and redistribute — this is the "CL" in CLAHE.
        const clip = Math.max(1, (clipLimit * count) / 256);
        let excess = 0;
        for (let v = 0; v < 256; v += 1) {
          if (hist[v] > clip) {
            excess += hist[v] - clip;
            hist[v] = clip;
          }
        }
        const bonus = excess / 256;
        let cdf = 0;
        for (let v = 0; v < 256; v += 1) {
          cdf += hist[v] + bonus;
          lut[v] = Math.round((cdf / count) * 255);
        }
      }
      luts.push(lut);
    }
  }

  // Apply with bilinear interpolation between the four surrounding tile LUTs.
  for (let y = 0; y < height; y += 1) {
    const gy = Math.min(tilesY - 1, Math.max(0, y / tileH - 0.5));
    const ty0 = Math.floor(gy);
    const ty1 = Math.min(tilesY - 1, ty0 + 1);
    const fy = gy - ty0;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < ALPHA_MIN) continue;
      const gx = Math.min(tilesX - 1, Math.max(0, x / tileW - 0.5));
      const tx0 = Math.floor(gx);
      const tx1 = Math.min(tilesX - 1, tx0 + 1);
      const fx = gx - tx0;

      const l = Math.round(lumaOf(data[i], data[i + 1], data[i + 2]));
      const v00 = luts[ty0 * tilesX + tx0][l];
      const v01 = luts[ty0 * tilesX + tx1][l];
      const v10 = luts[ty1 * tilesX + tx0][l];
      const v11 = luts[ty1 * tilesX + tx1][l];
      const newL = (v00 * (1 - fx) + v01 * fx) * (1 - fy) + (v10 * (1 - fx) + v11 * fx) * fy;

      // Blend halfway toward the equalized luma (full CLAHE looks HDR-fake),
      // then scale RGB together so the pixel's color is untouched.
      const target = (l + newL) / 2;
      const scale = l > 0 ? target / l : 1;
      data[i] *= scale;
      data[i + 1] *= scale;
      data[i + 2] *= scale;
    }
  }
}

/**
 * 4 — vibrance: saturation boost weighted toward under-saturated pixels, with a
 * skin-tone damp so garments shot on models don't get orange skin.
 */
function vibrance(data, amount) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_MIN) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === 0) continue;
    const sat = (max - min) / max;
    // Quadratic falloff — already-rich colors are protected (barely change).
    let boost = amount * (1 - sat) * (1 - sat);
    // Skin guard: warm, moderately saturated r>g>b pixels get half the boost.
    if (r > g && g > b && r - b > 20 && r - b < 130) boost *= 0.5;
    const l = lumaOf(r, g, b);
    data[i] = l + (r - l) * (1 + boost);
    data[i + 1] = l + (g - l) * (1 + boost);
    data[i + 2] = l + (b - l) * (1 + boost);
  }
}

/** 5 — tone curve: shadow lift + soft S-curve, precomputed as one 256-LUT. */
function toneCurve(data, shadowLift, sCurveAmount) {
  const lut = new Uint8Array(256);
  for (let v = 0; v < 256; v += 1) {
    let x = v / 255;
    x += shadowLift * (1 - x) ** 3; // gentle lift that fades out by midtones
    const s = x * x * (3 - 2 * x); // smoothstep = classic soft S shape
    x = x * (1 - sCurveAmount) + s * sCurveAmount;
    lut[v] = Math.round(Math.min(1, Math.max(0, x)) * 255);
  }
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_MIN) continue;
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
}

/**
 * 6 — unsharp mask on luminance: two separable box-blur passes (≈ gaussian),
 * then out = in + amount × (in − blur), pushed back through the RGB channels.
 */
function unsharpMask(data, width, height, amount) {
  const n = width * height;
  const luma = new Float32Array(n);
  for (let p = 0, i = 0; p < n; p += 1, i += 4) {
    luma[p] = lumaOf(data[i], data[i + 1], data[i + 2]);
  }

  const radius = Math.max(1, Math.round(Math.min(width, height) / 400));
  const tmp = new Float32Array(n);
  const blurred = new Float32Array(n);
  const win = radius * 2 + 1;

  // Horizontal then vertical box blur (sliding window, O(n)).
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    let acc = 0;
    for (let x = -radius; x <= radius; x += 1) {
      acc += luma[row + Math.min(width - 1, Math.max(0, x))];
    }
    for (let x = 0; x < width; x += 1) {
      tmp[row + x] = acc / win;
      const outIdx = row + Math.max(0, x - radius);
      const inIdx = row + Math.min(width - 1, x + radius + 1);
      acc += luma[inIdx] - luma[outIdx];
    }
  }
  for (let x = 0; x < width; x += 1) {
    let acc = 0;
    for (let y = -radius; y <= radius; y += 1) {
      acc += tmp[Math.min(height - 1, Math.max(0, y)) * width + x];
    }
    for (let y = 0; y < height; y += 1) {
      blurred[y * width + x] = acc / win;
      const outIdx = Math.max(0, y - radius) * width + x;
      const inIdx = Math.min(height - 1, y + radius + 1) * width + x;
      acc += tmp[inIdx] - tmp[outIdx];
    }
  }

  for (let p = 0, i = 0; p < n; p += 1, i += 4) {
    if (data[i + 3] < ALPHA_MIN) continue;
    const diff = luma[p] - blurred[p];
    if (diff === 0) continue;
    const add = amount * diff;
    data[i] += add;
    data[i + 1] += add;
    data[i + 2] += add;
  }
}

self.onmessage = async (event) => {
  const { id, task, bitmap, tier = "High", maxEdge = 0 } = event.data;
  const post = (msg) => self.postMessage({ id, ...msg });
  const progress = (pct) => post({ type: "progress", pct });

  if (task !== "enhance") {
    post({ type: "error", message: `Unknown task: ${task}` });
    return;
  }

  try {
    const preset = TIER_PRESETS[tier] || TIER_PRESETS.High;

    // Optional input cap (the caller passes the upscaler's input budget so we
    // never enhance pixels the next stage would throw away anyway).
    let width = bitmap.width;
    let height = bitmap.height;
    if (maxEdge > 0 && Math.max(width, height) > maxEdge) {
      const scale = maxEdge / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;
    progress(10);

    autoExposureWhiteBalance(data, preset.wb);
    progress(35);

    if (preset.claheClip > 0) clahe(data, width, height, preset.claheClip);
    progress(60);

    if (preset.vibrance > 0) vibrance(data, preset.vibrance);
    progress(75);

    toneCurve(data, preset.shadowLift, preset.sCurve);
    progress(85);

    if (preset.sharpen > 0) unsharpMask(data, width, height, preset.sharpen);
    progress(95);

    ctx.putImageData(imageData, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    post({ type: "done", blob, width, height });
  } catch (err) {
    post({ type: "error", message: err?.message || "Auto-enhance failed." });
  }
};
