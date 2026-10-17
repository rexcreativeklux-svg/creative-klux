// ============================================
// FILE: panels/text/templates/comboParts.js
// PURPOSE: The small helpers every theme file writes its text templates
// ("combos") with — so a combo reads as a design, not as a wall of fields.
//
// They only build plain objects in the shape buildCombo.js reads:
//   text(content, fontFamily, fontSize, [cx, cy], { …element fields, look? })
//   ringText(content, fontFamily, fontSize, [cx, cy], radius, 'top' | 'bottom', { …element fields })
//   rect([cx, cy], width, height, fill, { cornerRadius, stroke, strokeWidth, rotation, opacity })
//   circle([cx, cy], diameter, fill, { stroke, strokeWidth })
//   heart([cx, cy], size, fill)
//   shape(type, [cx, cy], width, height, fill, { stroke, strokeWidth, rotation, opacity })
//     — ANY shape the page draws: 'sparkle', 'star4', 'star5', 'starburst',
//       'banner-ribbon', 'banner-swallowtail', 'crown', 'diamond', 'arch', …
//   line([cx, cy], width, colour, { weight, style: 'straight'|'dashed'|'dotted', rotation })
// and the effect values: shadow / glow / outline, and a linear gradient.
// Every part is placed by its CENTRE in the combo's own frame (0,0 = its
// middle, about 600 units across). See textCombos.js for the rules.
// ============================================

/** A text part. */
export const text = (content, fontFamily, fontSize, at, extra = {}) => ({
  type: 'text',
  content,
  fontFamily,
  fontSize,
  at,
  ...extra,
});

/**
 * Words along a circle — a badge's top or bottom line. Unlike every other part,
 * `centre` is the CIRCLE's centre (the badge's), not the words'; `radius` is
 * where the middle of the letters runs. 'top' arches the words over the centre,
 * 'bottom' runs them upright under it. The builder works out the curve from the
 * measured words, so they follow the ring exactly whatever the font.
 */
export const ringText = (content, fontFamily, fontSize, centre, radius, side, extra = {}) =>
  text(content, fontFamily, fontSize, centre, { ...extra, ring: { radius, side } });

/** A (rounded) rectangle part — a plate, a tag, a pill, a rule. */
export const rect = (at, width, height, fill, extra = {}) => ({
  type: 'rect',
  at,
  width,
  height,
  fill,
  cornerRadius: 0,
  ...extra,
});

/** A circle (a badge, a ring when its fill is 'transparent'). */
export const circle = (at, diameter, fill, extra = {}) => ({
  type: 'circle',
  at,
  width: diameter,
  height: diameter,
  fill,
  ...extra,
});

/** A heart (the renderer's `heart-rounded` shape). */
export const heart = (at, size, fill, extra = {}) => ({
  type: 'heart-rounded',
  at,
  width: size,
  height: size,
  fill,
  ...extra,
});

/**
 * Any shape the page can draw, by its element type — an ornament (sparkle,
 * star, starburst, crown, diamond), a banner or ribbon behind words, an arch,
 * a speech bubble. It lands as its own editable shape, like the plates do.
 */
export const shape = (type, at, width, height, fill, extra = {}) => ({
  type,
  at,
  width,
  height,
  fill,
  ...extra,
});

/**
 * A rule: a straight, dashed or dotted line `width` long — a divider between
 * lines of type. Drawn by the page's own line shapes, so it stays editable.
 */
export const line = (at, width, colour, { weight = 2, style = 'straight', ...extra } = {}) => ({
  type: style,
  at,
  width,
  height: weight,
  fill: 'transparent',
  stroke: colour,
  strokeWidth: weight,
  ...extra,
});

/** A text shadow — `blur` 0 for a hard, printed offset. */
export const shadow = (offsetX, offsetY, blur, color) => ({ enabled: true, offsetX, offsetY, blur, color });

/** A glow: a shadow that sits right under the letters. */
export const glow = (blur, color) => shadow(0, 0, blur, color);

/** A text outline. */
export const outline = (width, color) => ({ enabled: true, width, color });

/** A linear gradient fill. */
export const gradient = (angle, ...stops) => `linear-gradient(${angle}deg, ${stops.join(', ')})`;
