// Product color analysis for the Beautifier's auto-matched backgrounds.
// Median-cut dominant-color extraction (the Color Thief technique) over the
// cutout's OPAQUE pixels only, then a curated set of professional plain studio
// backgrounds derived from that color in HSL. Pure JS, no dependency, runs in
// a few ms because it samples a ≤160px thumbnail.

const SAMPLE_EDGE = 160; // analysis thumbnail long edge
const ALPHA_MIN = 128; // only solidly-opaque pixels describe the product

/** [r,g,b] 0–255 → {h:0–360, s:0–1, l:0–1} */
function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
}

/** {h:0–360, s:0–1, l:0–1} → "#rrggbb" */
function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb;
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return `#${rgb
    .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Median-cut quantization: buckets of [r,g,b] → the biggest bucket's mean. */
function medianCut(pixels, depth) {
  if (depth === 0 || pixels.length <= 1) return [pixels];
  // Split along the channel with the widest range.
  let channel = 0;
  let widest = -1;
  for (let ch = 0; ch < 3; ch += 1) {
    let min = 255;
    let max = 0;
    for (const p of pixels) {
      if (p[ch] < min) min = p[ch];
      if (p[ch] > max) max = p[ch];
    }
    if (max - min > widest) {
      widest = max - min;
      channel = ch;
    }
  }
  const sorted = [...pixels].sort((a, b) => a[channel] - b[channel]);
  const mid = Math.floor(sorted.length / 2);
  return [
    ...medianCut(sorted.slice(0, mid), depth - 1),
    ...medianCut(sorted.slice(mid), depth - 1),
  ];
}

/**
 * Extract the product's dominant color + a small palette from a cutout blob.
 *
 * @param {Blob} cutoutBlob Transparent PNG (product only).
 * @returns {Promise<{dominant:{r,g,b,hex,hsl}, meanLuma:number}|null>}
 *   null when the image has no opaque pixels (nothing to analyze).
 */
export async function extractProductColor(cutoutBlob) {
  const bitmap = await createImageBitmap(cutoutBlob);
  const scale = Math.min(1, SAMPLE_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, w, h);

  const pixels = [];
  let lumaSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_MIN) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
    lumaSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  if (pixels.length === 0) return null;

  const buckets = medianCut(pixels, 3) // → up to 8 buckets
    .filter((b) => b.length > 0)
    .sort((a, b) => b.length - a.length);

  // Dominant = biggest bucket that isn't near-white/near-black (those are
  // usually highlights/shadows, not the product's color) — else the biggest.
  const bucketMean = (bucket) => {
    let r = 0;
    let g = 0;
    let b = 0;
    for (const p of bucket) {
      r += p[0];
      g += p[1];
      b += p[2];
    }
    return { r: r / bucket.length, g: g / bucket.length, b: b / bucket.length };
  };
  let dominant = bucketMean(buckets[0]);
  for (const bucket of buckets) {
    const mean = bucketMean(bucket);
    const l = rgbToHsl(mean.r, mean.g, mean.b).l;
    if (l > 0.08 && l < 0.92) {
      dominant = mean;
      break;
    }
  }

  const hsl = rgbToHsl(dominant.r, dominant.g, dominant.b);
  return {
    dominant: {
      r: Math.round(dominant.r),
      g: Math.round(dominant.g),
      b: Math.round(dominant.b),
      hex: hslToHex(hsl.h, hsl.s, hsl.l),
      hsl,
    },
    meanLuma: lumaSum / pixels.length / 255,
  };
}

/** Perceived luma (0–1) of a "#rrggbb" color. */
function hexLuma(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Build the curated studio-background swatches for a product color, ranked so
 * `auto` is the best-matched pick (good separation from the product, with a
 * bias toward light studio looks).
 *
 * @param {{dominant:{hsl:object}, meanLuma:number}|null} colorInfo From
 *   {@link extractProductColor}; null falls back to neutral swatches only.
 * @returns {{auto:string, swatches:Array<{id:string,name:string,color:string}>}}
 */
export function deriveBackgrounds(colorInfo) {
  const neutrals = [
    { id: "white", name: "Studio White", color: "#ffffff" },
    { id: "warm", name: "Warm Ivory", color: "#f7f3ec" },
    { id: "cool", name: "Cool Mist", color: "#eef1f6" },
    { id: "charcoal", name: "Deep Charcoal", color: "#1f2226" },
  ];
  if (!colorInfo) return { auto: "#ffffff", swatches: neutrals };

  const { h, s } = colorInfo.dominant.hsl;
  // Achromatic products (grays/blacks/whites) get a warm-hue tint instead of a
  // meaningless gray-tinted-gray.
  const hue = s < 0.08 ? 35 : h;
  const matched = [
    { id: "tint", name: "Matched Tint", color: hslToHex(hue, 0.14, 0.94) },
    { id: "soft", name: "Matched Soft", color: hslToHex(hue, 0.18, 0.86) },
    { id: "complement", name: "Muted Contrast", color: hslToHex(hue + 180, 0.12, 0.92) },
  ];
  const swatches = [...matched, ...neutrals];

  // Auto pick: bg luma should sit far from the product's mean luma so the
  // product pops, with a bonus for light studio backgrounds (the pro default).
  let auto = swatches[0].color;
  let best = -Infinity;
  for (const sw of swatches) {
    const l = hexLuma(sw.color);
    let score = Math.abs(l - colorInfo.meanLuma);
    if (l > 0.82) score += 0.18; // prefer the light studio look…
    if (sw.id === "tint") score += 0.08; // …and the matched tint over plain white
    if (score > best) {
      best = score;
      auto = sw.color;
    }
  }
  return { auto, swatches };
}
