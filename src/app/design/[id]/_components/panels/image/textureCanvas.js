/**
 * textureCanvas — per-pixel look effects a CSS filter can't express (line
 * hatching, posterizing, saturation-by-luma), for the Quick Tools "Texture"
 * tile.
 *
 * Ported from the design editor's `imageBake.js`, texture piece only: that
 * module chains perspective → blur → texture into one bake because its
 * element model keeps all three as live, re-adjustable properties resolved at
 * render time. Ours doesn't — Perspective there is our own `el.perspective`
 * (already rendered live by PerspectiveImage/renderDesign) and Blur is our
 * `adjust.blur` (already a live CSS filter, see imageAdjust.js) — so porting
 * their bake for those two would fight machinery we already have. Texture has
 * no live equivalent here, so it stays what it is upstream: a one-shot bake
 * into `src`, the same shape Enhance and Bg Scene already use in this editor
 * (see TextureSection.jsx).
 *
 * The maths itself is unchanged from upstream — colocated here because
 * TextureSection.jsx is its only caller.
 */

export const TEXTURE_PRESETS = [
  { id: "posterize", label: "Posterize", ops: [{ type: "posterize", amt: 10 }] },
  { id: "line", label: "Line", ops: [{ type: "line", amt: 50 }] },
  { id: "color", label: "Color", ops: [{ type: "color", amt: 50 }] },
  { id: "sketch", label: "Sketch", ops: [{ type: "line", amt: 22 }] },
  { id: "comic", label: "Comic", ops: [{ type: "posterize", amt: 6 }, { type: "line", amt: 42 }] },
  { id: "ink", label: "Ink", ops: [{ type: "line", amt: 65 }, { type: "posterize", amt: 4 }] },
  { id: "woodcut", label: "Woodcut", ops: [{ type: "posterize", amt: 4 }, { type: "line", amt: 70 }] },
  { id: "popart", label: "Pop art", ops: [{ type: "color", amt: 72 }, { type: "posterize", amt: 8 }] },
  { id: "riso", label: "Riso", ops: [{ type: "posterize", amt: 5 }, { type: "color", amt: 58 }] },
  { id: "halftone", label: "Halftone", ops: [{ type: "line", amt: 30 }, { type: "color", amt: 55 }] },
  { id: "neon", label: "Neon", ops: [{ type: "color", amt: 90 }, { type: "line", amt: 20 }] },
];

export const getTexturePreset = (id) => TEXTURE_PRESETS.find((p) => p.id === id) || null;

// Working resolution cap — texture reads pixels back with getImageData, and a
// full-size photo would make every preset tap (and every strength commit) a
// noticeable pause for detail the final element box doesn't show anyway.
export const TEXTURE_MAX_EDGE = 1400;

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * One in-place pass over an RGBA buffer. Transparent pixels are skipped so a
 * cut-out keeps its silhouette instead of gaining a rectangle of texture.
 */
function texturePass(d, w, h, type, amt) {
  if (!amt || amt <= 0) return;

  if (type === "line") {
    const period = Math.max(2, Math.round(60 / (amt / 10 + 1)));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] === 0) continue;
        const luma = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        // Darker pixels get a wider bar, so the hatching reads as shading.
        const v = (x % period) / period < 1 - luma ? 0 : 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      }
    }
    return;
  }

  if (type === "color") {
    const levels = Math.max(2, Math.min(8, 2 + Math.round(((100 - amt) / 100) * 6)));
    const step = 255 / (levels - 1);
    const sat = 1 + amt / 100;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const r = Math.round(d[i] / step) * step;
      const g = Math.round(d[i + 1] / step) * step;
      const b = Math.round(d[i + 2] / step) * step;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = clamp255(luma + (r - luma) * sat);
      d[i + 1] = clamp255(luma + (g - luma) * sat);
      d[i + 2] = clamp255(luma + (b - luma) * sat);
    }
    return;
  }

  // posterize
  const levels = Math.max(2, Math.min(32, Math.round(amt)));
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    d[i] = clamp255(Math.round(d[i] / step) * step);
    d[i + 1] = clamp255(Math.round(d[i + 1] / step) * step);
    d[i + 2] = clamp255(Math.round(d[i + 2] / step) * step);
  }
}

/**
 * Apply a texture preset at `amount`% strength to an already-drawn canvas.
 * Each pass runs in order, then the textured result is alpha-composited over
 * the untouched original — what makes the strength slider continuous rather
 * than on/off. Returns a NEW canvas; `src` is read, never mutated.
 */
export function textureCanvas(src, presetId, amount = 100) {
  const preset = getTexturePreset(presetId);
  const w = src.width;
  const h = src.height;
  if (!preset || amount <= 0) {
    const flat = document.createElement("canvas");
    flat.width = w;
    flat.height = h;
    flat.getContext("2d").drawImage(src, 0, 0);
    return flat;
  }

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  ctx.drawImage(src, 0, 0);

  const id = ctx.getImageData(0, 0, w, h);
  for (const op of preset.ops) texturePass(id.data, w, h, op.type, op.amt);
  ctx.putImageData(id, 0, 0);

  if (amount >= 100) return out;

  const faded = document.createElement("canvas");
  faded.width = w;
  faded.height = h;
  const fctx = faded.getContext("2d");
  fctx.drawImage(src, 0, 0); // original underneath
  fctx.globalAlpha = amount / 100;
  fctx.drawImage(out, 0, 0); // textured layer faded in on top
  fctx.globalAlpha = 1;
  return faded;
}
