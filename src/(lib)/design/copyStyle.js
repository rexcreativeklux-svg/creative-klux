/**
 * Copy style (Canva's paint roller): lift the LOOK of one element and lay it on
 * the next one clicked, leaving that element's content, position and size alone.
 *
 * What carries over depends on how alike the two are. Elements of one family
 * trade their whole look; across families only what every element has in
 * common — transparency and animation — makes sense. A photo has no font, and
 * handing a text box a photo's crop would be a mistake, not a style.
 *
 * Keys missing on the source are copied as `undefined` on purpose: copying the
 * style of something WITHOUT a border should take the border off the target.
 */

const COMMON = ["opacity", "animation"];

const FAMILIES = {
  text: [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "underline",
    "color",
    "fill",
    "letterSpacing",
    "lineHeight",
    "textAlign",
    "textEffect",
  ],
  // Photos and videos share their whole visual vocabulary (see video.js).
  media: [
    "adjust",
    "filter",
    "imgShadow",
    "imgShadowParams",
    "borderRadius",
    "borderWidth",
    "borderColor",
    "borderDash",
    "backgroundColor",
    "tintStrength",
  ],
  shape: [
    "fill",
    "stroke",
    "strokeWidth",
    "strokeDash",
    "borderRadius",
    "shapeEffect",
  ],
  curve: ["stroke", "strokeWidth", "dash", "cap"],
};

const familyOf = (type) =>
  type === "image" || type === "video" ? "media" : FAMILIES[type] ? type : null;

/** The brush loaded from `el`: its family and the values to lay down. */
export function styleBrushFrom(el) {
  if (!el) return null;
  const family = familyOf(el.type);
  const keys = [...COMMON, ...(family ? FAMILIES[family] : [])];
  return {
    family,
    values: Object.fromEntries(keys.map((k) => [k, el[k]])),
  };
}

/** The patch the brush makes on `target`, or null when it would change nothing. */
export function styleBrushPatch(brush, target) {
  if (!brush || !target) return null;
  const same = brush.family && brush.family === familyOf(target.type);
  const keys = same ? Object.keys(brush.values) : COMMON;
  const patch = {};
  for (const k of keys) {
    if (target[k] !== brush.values[k]) patch[k] = brush.values[k];
  }
  return Object.keys(patch).length ? patch : null;
}
