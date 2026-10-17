"use client";

import { EDITOR_FONTS } from "@/(lib)/design/fonts";
import { resolveTextEffect } from "@/(lib)/design/textEffects";

/**
 * Design-Editor's text styling → this editor's text fields.
 *
 * The Text panel's templates and effects are Design-Editor's data, which
 * describes text in its own vocabulary: a shadow, an outline, a background
 * plate, a stack of outlines, a 3D extrude — all at once. A text element here
 * has ONE `textEffect` (see (lib)/design/textEffects.js), so the most defining
 * one wins: a plate changes the whole block, an extrude or an outline changes
 * every glyph, a shadow is the subtlest. Params are back-solved from
 * textEffects.js's size-relative formulas, so they scale with the text.
 *
 * Nothing here changes how text is drawn — it only writes fields the editor
 * already reads.
 */

/** Families that should fall back to a script face rather than a sans. */
const SCRIPT_FAMILIES = new Set([
  "Alex Brush", "Allura", "Great Vibes", "Kaushan Script", "Pacifico", "Parisienne",
  "Pinyon Script", "Sacramento", "Satisfy", "Yellowtail", "Caveat", "Kalam",
  "Patrick Hand", "Permanent Marker", "Rock Salt", "Shadows Into Light",
]);
const SERIF_FAMILIES = new Set([
  "Bodoni Moda", "Cormorant Garamond", "DM Serif Display", "Libre Baskerville", "Lora",
  "Playfair Display", "Prata", "Marcellus", "Italiana", "Abril Fatface", "Bevan", "Alfa Slab One",
]);

/**
 * "Anton" → "'Anton', sans-serif" — the CSS family string a text element
 * stores. A family the font list knows uses its exact string, so the Fonts
 * dropdown shows it as the active font.
 */
export function kluxFamily(name) {
  if (!name) return undefined;
  const known = EDITOR_FONTS.find((f) => f.name === name);
  if (known) return known.family;
  const generic = SCRIPT_FAMILIES.has(name) ? "cursive" : SERIF_FAMILIES.has(name) ? "serif" : "sans-serif";
  return `'${name}', ${generic}`;
}

/** "'Anton', sans-serif" → "Anton". */
export const familyName = (family) => family?.match(/'([^']+)'/)?.[1] || family;

/** Neither renderer here has a text case — it's baked into the words. */
export function transformed(content, mode) {
  if (typeof content !== "string" || !mode || mode === "none") return content;
  if (mode === "uppercase") return content.toUpperCase();
  if (mode === "lowercase") return content.toLowerCase();
  if (mode === "capitalize") return content.replace(/\b\w/g, (c) => c.toUpperCase());
  return content;
}

const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(n)));
const isClear = (c) => !c || c === "transparent" || c === "none";

/** A CSS colour as a hex and an alpha — textEffects takes them separately. */
export function splitColor(color) {
  const c = String(color || "#000000").trim();
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (hex) {
    const a = hex[2] ? parseInt(hex[2], 16) / 255 : 1;
    return { hex: `#${hex[1]}`, alpha: a };
  }
  const rgb = c.match(/^rgba?\(([^)]+)\)/i)?.[1]?.split(",").map((s) => parseFloat(s));
  if (rgb?.length >= 3) {
    const h = rgb
      .slice(0, 3)
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("");
    return { hex: `#${h}`, alpha: rgb[3] ?? 1 };
  }
  return { hex: c, alpha: 1 };
}

/** A pixel shadow → the "shadow" effect's direction / offset / blur params. */
function shadowParams(shadow, size) {
  const dx = shadow.offsetX || 0;
  const dy = shadow.offsetY ?? 4;
  const { hex, alpha } = splitColor(shadow.color || "rgba(0,0,0,0.25)");
  return {
    color: hex,
    direction: Math.round((Math.atan2(dy, dx) * 180) / Math.PI),
    offset: clamp100((Math.hypot(dx, dy) / (size * 0.5)) * 100),
    blur: clamp100(((shadow.blur ?? 4) / (size * 0.8)) * 100),
    transparency: clamp100((1 - alpha) * 100),
  };
}

/**
 * The one `textEffect` that best stands for a Design-Editor style, and the fill
 * to go with it (hollow text keeps its outline colour as its fill, since that's
 * what textEffects strokes hollow text with).
 *
 * @param {object} s  { fontSize, fill, textShadow, textStroke, backgroundColor,
 *                     cornerRadius, padding, outlines, extrude, plate } — px at fontSize
 * @returns {{ textEffect: object|null, fill: string }}
 */
export function effectFrom(s) {
  const size = s.fontSize || 16;
  const fill = s.fill;

  // A plate behind the words.
  const plateColor = s.plate?.fill || (!isClear(s.backgroundColor) ? s.backgroundColor : null);
  if (plateColor) {
    const { hex, alpha } = splitColor(plateColor);
    const padX = s.plate ? s.plate.padX ?? 0.3 : (s.padding || 0) / size;
    const roundness = s.plate
      ? s.plate.shape === "pill" ? 100 : 25
      : ((s.cornerRadius || 0) / (size * 0.6)) * 100;
    return {
      fill,
      textEffect: {
        type: "background",
        color: hex,
        transparency: clamp100((1 - alpha) * 100),
        roundness: clamp100(roundness),
        spread: clamp100(((padX - 0.18) / 0.5) * 100),
      },
    };
  }

  // A 3D edge — a hard shadow as deep as the extrude.
  if (s.extrude?.depth) {
    const { hex } = splitColor(s.extrude.color);
    return {
      fill,
      textEffect: {
        type: "shadow",
        color: hex,
        direction: Math.round(s.extrude.angle ?? 45),
        offset: clamp100((s.extrude.depth / (size * 0.5)) * 100),
        blur: 0,
        transparency: 0,
      },
    };
  }

  // An outline — a single stroke, or the outermost of a stack.
  const stroke = s.textStroke?.enabled && s.textStroke.width > 0
    ? { width: s.textStroke.width, color: s.textStroke.color }
    : s.outlines?.length
      ? { width: s.outlines[0].width / 2, color: s.outlines[0].color }
      : null;
  const shadow = s.textShadow?.enabled ? s.textShadow : null;

  if (stroke && isClear(fill)) {
    const strokeHex = splitColor(stroke.color).hex;
    const thickness = clamp100((stroke.width / (size * 0.06)) * 100);
    if (shadow) {
      const p = shadowParams(shadow, size);
      return {
        fill: strokeHex,
        textEffect: { type: "splice", thickness, offset: p.offset, direction: p.direction, color: p.color },
      };
    }
    return { fill: strokeHex, textEffect: { type: "hollow", thickness } };
  }
  if (stroke) {
    return {
      fill,
      textEffect: {
        type: "outline",
        color: splitColor(stroke.color).hex,
        thickness: clamp100((stroke.width / (size * 0.07)) * 100),
      },
    };
  }
  if (shadow) return { fill, textEffect: { type: "shadow", ...shadowParams(shadow, size) } };
  return { fill, textEffect: null };
}

// ── Measuring ──────────────────────────────────────────────────────────────

let measureCtx = null;
const ctx = () => {
  if (!measureCtx && typeof document !== "undefined") {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  return measureCtx;
};

/** A text box hugging its words gets this much slack, so a face a hair wider doesn't wrap. */
const HUG_SLACK = 1.04;

function lineWidth(c, line, letterSpacing) {
  return c.measureText(line).width + (letterSpacing || 0) * [...line].length;
}

/** Word-wrap one paragraph to a width, as the DOM's pre-wrap would. */
function wrap(c, para, maxWidth, letterSpacing) {
  const words = para.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && lineWidth(c, next, letterSpacing) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  lines.push(line);
  return lines;
}

/**
 * How far an effect's ink reaches past the glyphs — a shadow's offset and blur,
 * an outline. The text node clips at its box, so the box has to make room.
 */
function inkReach(el) {
  const d = resolveTextEffect(el);
  if (!d) return 0;
  let reach = 0;
  for (const s of d.shadows || []) reach = Math.max(reach, Math.max(Math.abs(s.dx), Math.abs(s.dy)) + s.blur);
  if (d.back) reach = Math.max(reach, Math.max(Math.abs(d.back.dx), Math.abs(d.back.dy)));
  if (d.stroke) reach = Math.max(reach, d.stroke.width / 2);
  return Math.ceil(reach);
}

/**
 * The box a text element needs for its words, as { width, height, padding } —
 * measured with the face it's set in, grown for its effect's ink and plate.
 *
 * @param {object} el  a text element (content, font fields, textEffect)
 * @param {number} [fixedWidth]  wrap to this width instead of hugging the words
 */
export function measureTextBox(el, fixedWidth) {
  const size = el.fontSize || 16;
  const lh = el.lineHeight || 1.3;
  const c = ctx();
  const paras = String(el.content ?? "").split("\n");
  const basePad = (el.basePadding ?? 4) + inkReach(el);
  const plate = resolveTextEffect(el)?.background;
  const padX = basePad + (plate?.padX || 0);
  const padY = basePad + (plate?.padY || 0);

  let contentWidth;
  let lines = paras.length;
  if (c) {
    c.font = `${el.fontStyle || "normal"} ${el.fontWeight || 400} ${size}px ${el.fontFamily || "sans-serif"}`;
    if (fixedWidth) {
      contentWidth = fixedWidth - padX * 2;
      lines = paras.reduce((n, p) => n + wrap(c, p, contentWidth, el.letterSpacing).length, 0);
    } else {
      contentWidth = Math.max(...paras.map((p) => lineWidth(c, p, el.letterSpacing))) * HUG_SLACK;
    }
  } else {
    contentWidth = fixedWidth ? fixedWidth - padX * 2 : size * 0.6 * Math.max(...paras.map((p) => p.length));
  }

  return {
    width: Math.ceil(contentWidth + padX * 2),
    height: Math.ceil(lines * size * lh + padY * 2),
    padding: basePad,
  };
}
