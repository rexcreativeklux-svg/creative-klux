// ============================================
// FILE: panels/text/templates/buildCombo.js
// PURPOSE: Turn a Text-panel TEMPLATE (a "combo": a few text boxes, sometimes a
// shape, designed together — see textCombos.js) into this editor's elements.
//
// The combos are Design-Editor's, written in its element vocabulary. Building
// one:
//   1. scales every number by `scale` (a card uses 1; a page insert picks one
//      that suits the page — see comboOnPage);
//   2. dresses a part that names a `look` in that Effects look first, then lays
//      the part's own fields over it;
//   3. translates the result into our own fields — one textEffect, a `shape`
//      key, lines coloured by `fill` (see ../textStyle.js);
//   4. MEASURES each text box in its face, so a box hugs its words — which is
//      why parts are placed by their centres: a measured width differs from
//      font to font, and a centre can't move.
//
// Curved text is Design-Editor's alone: a part on a badge's ring or with a
// `curve` lands straight, inside the ring where the curve would have run.
// ============================================

"use client";

import { SHAPES } from "@/(lib)/design/shapes";
import { effectFrom, kluxFamily, measureTextBox, transformed } from "../textStyle";
import { lookBaseFields, lookById } from "../looks/lookStyle";

/** The text defaults a combo part starts from — centred, tight leading, a small inset. */
const TEXT_DEFAULTS = {
  fontWeight: 400,
  textAlign: "center",
  lineHeight: 1.1,
  padding: 4,
  fill: "#111827",
};

/** Design-Editor shape types our library has under another name. */
const SHAPE_ALIASES = {
  rect: "rect",
  circle: "circle",
  star4: "star4",
  star5: "star5",
  hexagon: "hexagon",
  triangle: "triangle",
  "heart-rounded": "heart",
  "banner-ribbon": "ribbon",
  "cloud-fluffy": "cloud2",
};

/** Design-Editor's rules (drawn from `stroke`) → our line shapes (drawn from `fill`). */
const LINE_ALIASES = {
  straight: "line-solid",
  dashed: "line-dashed",
  dotted: "line-dotted",
  arrow: "line-arrow",
  "line-wavy": "line-wavy",
};

/** Our straight lines are drawn in a 12-unit-tall viewBox (see shapes.js). */
const LINE_VIEWBOX_HEIGHT = 12;

const shapeKeyFor = (type) =>
  SHAPE_ALIASES[type] || (SHAPES[`tt-${type}`] ? `tt-${type}` : null);

/** A text part, scaled, dressed in its look, and translated into our fields. */
function buildText(part, scale) {
  const { at, look: lookId, width, ring, curve, type, ...own } = part;
  const size = (part.fontSize || 24) * scale;
  const look = lookById(lookId);

  // Design-Editor's vocabulary first, at this size: defaults → look → part.
  const s = {
    ...TEXT_DEFAULTS,
    ...(look ? lookBaseFields(look, size) : {}),
    ...own,
    fontSize: size,
  };
  const px = (v) => (Number(v) || 0) * scale;
  if (own.letterSpacing != null) s.letterSpacing = px(own.letterSpacing);
  if (own.padding != null) s.padding = px(own.padding);
  if (own.cornerRadius != null) s.cornerRadius = px(own.cornerRadius);
  if (own.textShadow) {
    s.textShadow = {
      ...own.textShadow,
      offsetX: px(own.textShadow.offsetX),
      offsetY: px(own.textShadow.offsetY ?? 4),
      blur: px(own.textShadow.blur ?? 4),
    };
  }
  if (own.textStroke) s.textStroke = { ...own.textStroke, width: px(own.textStroke.width) };
  // A part's own outline replaces its look's outline stack.
  if (own.textStroke) s.outlines = undefined;

  const { fill, textEffect } = effectFrom(s);
  const content = transformed(s.content, s.textTransform);
  const el = {
    type: "text",
    content,
    text: content,
    fontFamily: kluxFamily(s.fontFamily),
    fontSize: size,
    fontWeight: s.fontWeight,
    fontStyle: s.fontStyle || "normal",
    fill,
    textAlign: s.textAlign,
    lineHeight: s.lineHeight,
    letterSpacing: Math.round((Number(s.letterSpacing) || 0) * 100) / 100,
    ...(textEffect ? { textEffect } : {}),
    ...(typeof s.textDecoration === "string" && s.textDecoration.includes("underline") ? { underline: true } : {}),
    rotation: s.rotation || 0,
    opacity: s.opacity ?? 1,
    basePadding: s.padding,
  };

  let [cx, cy] = at.map((v) => v * scale);
  let fixedWidth = width ? width * scale : undefined;

  // On a ring: straight words inside the circle, where the arc's middle ran.
  if (ring) {
    const radius = ring.radius * scale;
    const inset = radius * 0.72;
    cy += ring.side === "bottom" ? inset : -inset;
    const chord = 2 * Math.sqrt(radius * radius - inset * inset) * 0.95;
    const natural = measureTextBox(el);
    if (natural.width > chord) {
      const k = chord / natural.width;
      el.fontSize = Math.max(6, el.fontSize * k);
      el.letterSpacing = Math.round(el.letterSpacing * k * 100) / 100;
    }
  }

  const box = measureTextBox(el, fixedWidth);
  delete el.basePadding;
  return {
    ...el,
    padding: box.padding,
    width: box.width,
    height: box.height,
    x: cx - box.width / 2,
    y: cy - box.height / 2,
  };
}

/** One shape part (a plate, a ring, an ornament, a rule), centred on its `at`. */
function buildShape(part, scale) {
  const [cx, cy] = part.at.map((v) => v * scale);
  const common = { type: "shape", rotation: part.rotation || 0, opacity: part.opacity ?? 1 };

  const line = LINE_ALIASES[part.type];
  if (line) {
    const weight = (part.strokeWidth || part.height || 2) * scale;
    const w = part.width * scale;
    const h = part.type === "line-wavy" ? Math.max(LINE_VIEWBOX_HEIGHT, part.height * scale) : LINE_VIEWBOX_HEIGHT;
    return {
      ...common,
      shape: line,
      fill: part.stroke || "#111111",
      // A line's stroke is in viewBox units, stretched with the box's height.
      strokeWidth: (weight * LINE_VIEWBOX_HEIGHT) / h,
      width: w,
      height: h,
      x: cx - w / 2,
      y: cy - h / 2,
    };
  }

  const key = shapeKeyFor(part.type);
  if (!key) return null;
  const w = part.width * scale;
  const h = part.height * scale;
  const primitive = key === "rect" || key === "circle" || key === "triangle";
  const strokePx = (part.strokeWidth || 0) * scale;
  const stroked = strokePx > 0 && part.stroke && part.stroke !== "none";
  return {
    ...common,
    shape: key,
    fill: !part.fill || part.fill === "none" ? "transparent" : part.fill,
    ...(stroked
      ? {
          stroke: part.stroke,
          // Primitives draw a CSS border (px); library paths stroke in viewBox units.
          strokeWidth: primitive ? strokePx : (strokePx * 100) / Math.max(1, Math.min(w, h)),
          ...(part.strokeStyle === "dashed" || part.strokeStyle === "dotted" ? { strokeDash: part.strokeStyle } : {}),
        }
      : {}),
    borderRadius: key === "rect" ? (part.cornerRadius || 0) * scale : 0,
    width: w,
    height: h,
    x: cx - w / 2,
    y: cy - h / 2,
  };
}

/** The box around a set of elements, turned boxes included. */
export function elementsBounds(elements) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const el of elements) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const turn = ((el.rotation || 0) * Math.PI) / 180;
    const cos = Math.abs(Math.cos(turn));
    const sin = Math.abs(Math.sin(turn));
    const halfW = (el.width * cos + el.height * sin) / 2;
    const halfH = (el.width * sin + el.height * cos) / 2;
    minX = Math.min(minX, cx - halfW);
    maxX = Math.max(maxX, cx + halfW);
    minY = Math.min(minY, cy - halfH);
    maxY = Math.max(maxY, cy + halfH);
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * A combo's elements, in its own frame, at a scale.
 *
 * @returns {{elements: object[], bounds: {x, y, width, height}}}
 */
export function buildComboElements(combo, { scale = 1 } = {}) {
  const elements = combo.parts
    .map((part) => (part.type === "text" ? buildText(part, scale) : buildShape(part, scale)))
    .filter(Boolean);
  return { elements, bounds: elementsBounds(elements) };
}

/** How much of the page's width a new combo takes, and the limits on its scale. */
const PAGE_SHARE = 0.55;
const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

/**
 * A combo sized for a page and centred on it — what the Text panel inserts.
 * Built once at 1:1 to learn its natural size, then again at the scale that
 * makes it take about half the page's width, measured afresh at that size.
 *
 * @param {object} combo
 * @param {{width: number, height: number}} page
 * @returns {object[]} the elements, in stacking order
 */
export function comboOnPage(combo, page) {
  const natural = buildComboElements(combo).bounds;
  const byWidth = (page.width * PAGE_SHARE) / (natural.width || 1);
  const byHeight = (page.height * 0.8) / (natural.height || 1);
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, byWidth, byHeight));

  const { elements, bounds } = buildComboElements(combo, { scale });
  const dx = page.width / 2 - (bounds.x + bounds.width / 2);
  const dy = page.height / 2 - (bounds.y + bounds.height / 2);
  return elements.map((el) => ({
    ...el,
    x: Math.round((el.x + dx) * 100) / 100,
    y: Math.round((el.y + dy) * 100) / 100,
  }));
}

/** Every face (and cut) a combo is set in, as CSS font shorthands to load. */
export function comboFontQueries(combo) {
  const queries = new Set();
  for (const part of combo.parts) {
    if (part.type !== "text") continue;
    const look = lookById(part.look);
    const family = kluxFamily(part.fontFamily || look?.base.fontFamily);
    if (!family) continue;
    const weight = part.fontWeight ?? look?.base.fontWeight ?? 400;
    const style = part.fontStyle ?? look?.base.fontStyle ?? "normal";
    queries.add(`${style} ${weight} 40px ${family}`);
  }
  return [...queries];
}
