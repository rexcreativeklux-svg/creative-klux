/**
 * scraiveCompat.js — read designs authored in Scraive (../Design-Editor).
 *
 * Scraive and this editor share most of an element format, but not the part
 * that matters most: Scraive stores a shape AS its type (`{type: "rectangle"}`,
 * `{type: "hexagon"}`), where we store `{type: "shape", shape: "rect"}`. Both
 * renderers skip a type they don't know without a word, so a Scraive template
 * painted here kept its background and text and silently lost every band, card,
 * badge and corner shape.
 *
 * Everything here is a pure translation into our own shape, applied at the two
 * doors a design comes in through — renderDesignToCanvas and
 * normalizeForEditor. Elements already in our format pass through untouched, and
 * every translated field is removed as it's consumed, so running it twice (or on
 * our own designs) changes nothing.
 */

import { PRIMITIVE_SHAPES, SHAPES } from "./shapes";

/** Scraive shape type → our `shape` key, where the names differ. */
const SHAPE_ALIASES = {
  rectangle: "rect",
  oval: "circle",
  star7: "star6",
  "speech-bubble-round": "bubble-round",
  "speech-bubble-square": "bubble-square",
  "thought-bubble": "bubble",
  "cloud-basic": "cloud",
  "cloud-fluffy": "cloud2",
  "heart-classic": "heart",
  "heart-rounded": "heart",
  "banner-ribbon": "ribbon",
  "teardrop-classic": "teardrop",
  "teardrop-rounded": "teardrop",
  "blob-1": "blob",
  "blob-2": "blob2",
  "flowchart-process": "rect",
  "flowchart-decision": "diamond",
  "flowchart-terminator": "stadium",
  "flowchart-document": "document",
  "gradient-box": "rect",
  badge: "rect",
};

/**
 * Scraive lines are drawn from `stroke`; our line shapes take their colour from
 * `fill` (see renderDesign's stroke-kind branch), so these swap the two.
 */
const LINE_ALIASES = {
  straight: "line-solid",
  dashed: "line-dashed",
  dotted: "line-dotted",
  arrow: "line-arrow",
  "double-arrow": "line-arrow-both",
};

const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Scraive's opacities are 0–100 (occasionally 0–1). Folded into the colour,
 * since our shapes have no separate fill/stroke opacity.
 */
function withOpacity(color, opacity) {
  if (typeof color !== "string" || opacity == null) return color;
  const a = opacity > 1 ? opacity / 100 : opacity;
  if (a >= 1) return color;
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)/i)?.[1]?.split(",");
  if (rgb?.length >= 3) return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
  return color;
}

/** Scraive paints nothing for "none"; assigned to fillStyle it would be ignored. */
const paint = (c) => (!c || c === "none" ? "transparent" : c);

/** Pull the colours out of a CSS gradient, for `gradient-box`'s two-stop fill. */
function gradientBoxFill(el) {
  const colours = String(el.gradient || "").match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) || [];
  return `linear-gradient(135deg, ${colours[0] || "#3B82F6"} 0%, ${colours[1] || "#1D4ED8"} 100%)`;
}

function toShape(el, shapeKey) {
  const { type, fillOpacity, strokeOpacity, cornerRadius, strokeStyle, shadow, gradient, ...rest } = el;
  const next = {
    ...rest,
    type: "shape",
    shape: shapeKey,
    fill: paint(withOpacity(el.fill, fillOpacity)),
    stroke: el.stroke && el.stroke !== "none" ? withOpacity(el.stroke, strokeOpacity) : undefined,
  };

  // Scraive's `rectangle` drawer ignores cornerRadius; `rect` and `badge` round.
  if (type === "rect") next.borderRadius = cornerRadius ?? 12;
  else if (type === "badge") next.borderRadius = 8;
  else if (type === "gradient-box") {
    next.fill = gradientBoxFill(el);
    next.borderRadius = el.borderRadius ?? 12;
  }

  if (strokeStyle === "dashed" || strokeStyle === "dotted") next.strokeDash = strokeStyle;

  if (shadow?.enabled) {
    const dx = shadow.offsetX || 0;
    const dy = shadow.offsetY ?? 10;
    next.shapeEffect = {
      type: "drop",
      color: shadow.color || "#000000",
      direction: Math.round((Math.atan2(dy, dx) * 180) / Math.PI),
      offset: 40,
      blur: 30,
      transparency: 60,
    };
  }
  return next;
}

function toLine(el, shapeKey) {
  const { type, strokeOpacity, strokeStyle, ...rest } = el;
  return {
    ...rest,
    type: "shape",
    shape: shapeKey,
    fill: withOpacity(el.stroke || "#000000", strokeOpacity),
    strokeWidth: el.strokeWidth || 2,
  };
}

/** Scraive's textTransform, baked into the content — neither renderer here has one. */
function transformed(content, mode) {
  if (typeof content !== "string") return content;
  if (mode === "uppercase") return content.toUpperCase();
  if (mode === "lowercase") return content.toLowerCase();
  if (mode === "capitalize") {
    return content
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return content;
}

/**
 * Scraive text carries three separate looks — a background box, an outline and
 * a shadow. Ours has ONE `textEffect` slot, so the most visible one wins: a
 * background changes the whole block, an outline changes every glyph, a shadow
 * is the subtlest. Params are back-solved from textEffects.js's size-relative
 * formulas so the result lands near Scraive's pixel values.
 */
function textEffectFrom(el) {
  const size = el.fontSize || 16;
  const bg = el.backgroundColor;
  if (bg && bg !== "transparent" && bg !== "none") {
    return {
      type: "background",
      color: bg,
      transparency: 0,
      roundness: clamp100(((el.cornerRadius || 0) / (size * 0.6)) * 100),
      spread: 0,
    };
  }
  const stroke = el.textStroke;
  if (stroke?.enabled && stroke.width > 0) {
    return {
      type: "outline",
      color: stroke.color || "#000000",
      thickness: clamp100((stroke.width / (size * 0.07)) * 100),
    };
  }
  const shadow = el.textShadow;
  if (shadow?.enabled) {
    const dx = shadow.offsetX || 0;
    const dy = shadow.offsetY ?? 4;
    return {
      type: "shadow",
      color: shadow.color || "#000000",
      direction: Math.round((Math.atan2(dy, dx) * 180) / Math.PI),
      offset: clamp100((Math.hypot(dx, dy) / (size * 0.5)) * 100),
      blur: clamp100(((shadow.blur ?? 4) / (size * 0.8)) * 100),
      transparency: 40,
    };
  }
  return null;
}

function toText(el, layout) {
  const {
    textTransform,
    textDecoration,
    textShadow,
    textStroke,
    backgroundColor,
    cornerRadius,
    ...rest
  } = el;
  const next = { ...rest, type: "text" };

  if (textTransform && textTransform !== "none") next.content = transformed(el.content, textTransform);
  if (typeof textDecoration === "string" && textDecoration.includes("underline")) next.underline = true;
  if (!el.textEffect) {
    const effect = textEffectFrom(el);
    if (effect) next.textEffect = effect;
  }

  // Scraive lays text out from the top of the box, 5px in, at 1.2 and in black —
  // ours centres it at 1.3 with 2px in #111. Without these every line lands
  // lower. Only on request: see fromScraiveElement.
  if (layout && !el.verticalAlign) {
    next.verticalAlign = "top";
    next.padding = el.padding ?? 5;
    next.lineHeight = el.lineHeight || 1.2;
    if (!el.fill && !el.color) next.fill = "#000000";
  }
  return next;
}

function toImage(el) {
  const { fitMode, flipHorizontal, flipVertical, cornerRadius, border, ...rest } = el;
  const next = { ...rest };
  if (fitMode && !el.objectFit) next.objectFit = fitMode;
  if (flipHorizontal && el.flipH == null) next.flipH = true;
  if (flipVertical && el.flipV == null) next.flipV = true;
  if (cornerRadius != null && el.borderRadius == null) next.borderRadius = cornerRadius;
  if (border?.enabled && border.width > 0 && el.borderWidth == null) {
    next.borderWidth = border.width;
    next.borderColor = border.color || "#ffffff";
  }
  return next;
}

const SCRAIVE_IMAGE_KEYS = ["fitMode", "flipHorizontal", "flipVertical", "cornerRadius", "border"];
const SCRAIVE_TEXT_KEYS = ["textTransform", "textDecoration", "textShadow", "textStroke", "backgroundColor", "cornerRadius"];

/**
 * Translate one Scraive element into our format; ours come back as-is.
 *
 * `text` opts into Scraive's text LAYOUT (top-aligned, its padding and line
 * height). It has to be asked for: a plain `{type: "text"}` looks identical in
 * both formats, and ours are meant to stay vertically centred — so only a caller
 * that KNOWS the design came from Scraive (a fetched template, a redesign
 * result) sets it. Everything else — shape types, Scraive-only property names —
 * is unambiguous and always translated.
 */
export function fromScraiveElement(el, { text = false } = {}) {
  if (!el || typeof el !== "object") return el;

  // Scraive hides with `visible: false`; we hide with `hidden`.
  if (el.visible === false && el.hidden == null) {
    const { visible, ...rest } = el;
    el = { ...rest, hidden: true };
  }
  const { type } = el;

  // `{type:"shape", shape:"rectangle"}` — Scraive's wrapped spelling.
  if (type === "shape") {
    const alias = SHAPE_ALIASES[el.shape];
    return alias ? { ...el, shape: alias } : el;
  }

  // Scraive's text presets (text-title, text-body, …) are plain text with a
  // default style; the style is already on the element.
  if (typeof type === "string" && type.startsWith("text")) {
    const needs =
      type !== "text" ||
      (text && !el.verticalAlign) ||
      SCRAIVE_TEXT_KEYS.some((k) => el[k] != null);
    return needs ? toText(el, text) : el;
  }

  if (type === "image") {
    return SCRAIVE_IMAGE_KEYS.some((k) => el[k] != null) ? toImage(el) : el;
  }

  // Scraive keeps a group's members as { originalElement, relativeX, relativeY };
  // ours are plain elements positioned relative to the group's corner.
  if (type === "group" && Array.isArray(el.childrenData) && !el.children) {
    const { childrenData, ...rest } = el;
    return {
      ...rest,
      children: childrenData.map((c) =>
        fromScraiveElement(
          { ...(c.originalElement || c), x: c.relativeX ?? 0, y: c.relativeY ?? 0 },
          { text },
        ),
      ),
    };
  }

  if (LINE_ALIASES[type]) return toLine(el, LINE_ALIASES[type]);
  const shapeKey = SHAPE_ALIASES[type] ?? (PRIMITIVE_SHAPES.has(type) || SHAPES[type] ? type : null);
  if (shapeKey) return toShape(el, shapeKey);

  return el;
}

/**
 * Translate a whole element list. Also puts it in stacking order first: older
 * Scraive designs carry a `zIndex`, and array order is the only stacking we read.
 */
export function fromScraiveElements(elements, options) {
  if (!Array.isArray(elements)) return [];
  const ordered = elements.some((e) => e?.zIndex != null)
    ? elements
        .map((element, index) => ({ element, index }))
        .sort((a, b) => {
          const az = a.element?.zIndex ?? a.index;
          const bz = b.element?.zIndex ?? b.index;
          return az === bz ? a.index - b.index : az - bz;
        })
        .map(({ element }) => {
          const { zIndex, ...rest } = element;
          return rest;
        })
    : elements;
  return ordered.map((el) => fromScraiveElement(el, options));
}
