"use client";

import { LOOKS, LOOK_ROWS, LOOK_SAMPLE } from "./lookData";
import { effectFrom, kluxFamily, measureTextBox, transformed } from "../textStyle";

/** How many looks a category row shows before "See all". */
export const LOOK_ROW_COUNT = 8;

/** What a new text box wearing an EFFECT says (templates bring their own words). */
const EFFECT_CONTENT = "Your text";

/** A look by id, with its id on it — or null. */
export const lookById = (id) => (id && LOOKS[id] ? { id, ...LOOKS[id] } : null);

/** The Effects tab's category rows, each with its looks. */
export const LOOK_ROW_GROUPS = LOOK_ROWS.map((row) => ({
  id: row.id,
  label: row.label,
  items: row.items.map(lookById).filter(Boolean),
}));

/** The words a card previews: effects all say the same word, templates say their own. */
export const lookPreviewText = (look) => look.sample || LOOK_SAMPLE;

/** The words a NEW text box wearing this look lands with. */
export const lookContent = (look) => look.sample || EFFECT_CONTENT;

/** A look's own px values, scaled from the size it was authored at to `fontSize`. */
function scaledLook(look, fontSize) {
  const base = look.base;
  const k = fontSize > 0 && base.fontSize > 0 ? fontSize / base.fontSize : 1;
  const px = (v) => (Number(v) || 0) * k;
  return {
    k,
    style: {
      fontSize,
      fill: base.fill,
      textShadow: base.textShadow && {
        ...base.textShadow,
        offsetX: px(base.textShadow.offsetX),
        offsetY: px(base.textShadow.offsetY),
        blur: px(base.textShadow.blur),
      },
      textStroke: base.textStroke && { ...base.textStroke, width: px(base.textStroke.width) },
      backgroundColor: base.textBackground?.enabled ? base.textBackground.color : undefined,
      cornerRadius: px(base.textBackground?.cornerRadius),
      outlines: look.outlines?.map((o) => ({ ...o, width: px(o.width) })),
      extrude: look.extrude && { ...look.extrude, depth: px(look.extrude.depth) },
      plate: look.plate,
    },
  };
}

/**
 * Design-Editor's still styling for a look at a size — the shape a template
 * part is written in, so a part naming a `look` can lay its own fields over it.
 */
export function lookBaseFields(look, fontSize) {
  const { k, style } = scaledLook(look, fontSize);
  const base = look.base;
  return {
    ...style,
    fontFamily: base.fontFamily,
    fontWeight: base.fontWeight,
    fontStyle: base.fontStyle,
    lineHeight: base.lineHeight,
    letterSpacing: (Number(base.letterSpacing) || 0) * k,
    textTransform: base.textTransform,
  };
}

/**
 * The element fields that dress text in a look. Content, box and position are
 * the element's own — a look decides how text looks, never what it says or
 * where it sits (case aside: there is no text case here, so it's in the words).
 *
 * @param {object} look
 * @param {number} fontSize
 * @param {string} content  the words, so the look's case can be applied
 */
export function lookPatch(look, fontSize, content) {
  const s = lookBaseFields(look, fontSize);
  const { fill, textEffect } = effectFrom(s);
  return {
    textLook: { id: look.id },
    content: transformed(content, s.textTransform),
    fontFamily: kluxFamily(s.fontFamily),
    fontWeight: s.fontWeight,
    fontStyle: s.fontStyle || "normal",
    fill,
    lineHeight: s.lineHeight,
    letterSpacing: Math.round(s.letterSpacing * 100) / 100,
    textEffect,
  };
}

/**
 * A whole text element wearing a look, centred on (cx, cy) — what a card
 * previews and what a pick drops on the page.
 */
export function lookElement(look, { content, fontSize, cx = 0, cy = 0 }) {
  const fields = lookPatch(look, fontSize, content);
  const el = { type: "text", textAlign: "center", fontSize, ...fields };
  const box = measureTextBox(el);
  return {
    ...el,
    text: el.content,
    padding: box.padding,
    width: box.width,
    height: box.height,
    x: cx - box.width / 2,
    y: cy - box.height / 2,
    rotation: 0,
    opacity: 1,
  };
}
