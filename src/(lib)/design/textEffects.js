/**
 * Text effects (Canva-style) for text elements.
 *
 * An effect is stored on a text element as `el.textEffect = { type, ...params }`.
 * `resolveTextEffect(el)` turns that into a rendering-agnostic descriptor that
 * BOTH the on-canvas editor (via CSS, see textEffectCss) and the PNG export
 * renderer (via the 2D canvas, see renderDesign.js) consume — so what you see on
 * the stage is what you get in the export.
 */

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const round = (n) => Math.round(n * 100) / 100;
const num = (v, d) => (typeof v === "number" && !Number.isNaN(v) ? v : d);

function hexToRgb(hex) {
  const h = String(hex || "#000000").replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v || "000000", 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(a)})`;
}

// The effects offered in the panel, in display order.
export const TEXT_EFFECTS = [
  { id: "none", label: "None" },
  { id: "shadow", label: "Shadow" },
  { id: "lift", label: "Lift" },
  { id: "hollow", label: "Hollow" },
  { id: "splice", label: "Splice" },
  { id: "outline", label: "Outline" },
  { id: "echo", label: "Echo" },
  { id: "glow", label: "Glow" },
  { id: "neon", label: "Neon" },
  { id: "background", label: "Background" },
];

// Sliders each effect exposes in the panel. `def` is the default 0–100 value.
export const EFFECT_CONTROLS = {
  shadow: [
    { key: "offset", label: "Offset", min: 0, max: 100, def: 50 },
    { key: "direction", label: "Direction", min: -180, max: 180, def: -45 },
    { key: "blur", label: "Blur", min: 0, max: 100, def: 20 },
    { key: "transparency", label: "Transparency", min: 0, max: 100, def: 40 },
  ],
  lift: [{ key: "intensity", label: "Intensity", min: 0, max: 100, def: 50 }],
  hollow: [{ key: "thickness", label: "Thickness", min: 0, max: 100, def: 50 }],
  splice: [
    { key: "thickness", label: "Thickness", min: 0, max: 100, def: 50 },
    { key: "offset", label: "Offset", min: 0, max: 100, def: 50 },
    { key: "direction", label: "Direction", min: -180, max: 180, def: -45 },
  ],
  outline: [{ key: "thickness", label: "Thickness", min: 0, max: 100, def: 50 }],
  echo: [
    { key: "offset", label: "Offset", min: 0, max: 100, def: 50 },
    { key: "direction", label: "Direction", min: -180, max: 180, def: -45 },
  ],
  glow: [{ key: "intensity", label: "Intensity", min: 0, max: 100, def: 50 }],
  neon: [{ key: "intensity", label: "Intensity", min: 0, max: 100, def: 50 }],
  background: [
    { key: "roundness", label: "Roundness", min: 0, max: 100, def: 50 },
    { key: "spread", label: "Spread", min: 0, max: 100, def: 30 },
    { key: "transparency", label: "Transparency", min: 0, max: 100, def: 0 },
  ],
};

// Effects that expose a colour control, with the default colour.
export const EFFECT_COLOR = {
  shadow: "#000000",
  splice: "#8b5cf6",
  outline: "#000000",
  echo: "#b1b1b1",
  glow: "#ffffff",
  background: "#000000",
};

// Build the default param set for an effect (used when it's first selected).
export function defaultEffectParams(type) {
  const params = { type };
  for (const c of EFFECT_CONTROLS[type] || []) params[c.key] = c.def;
  if (EFFECT_COLOR[type]) params.color = EFFECT_COLOR[type];
  return params;
}

/**
 * One-click curated looks (like Canva's named presets). Each bundles a base
 * effect + tuned params/colour; applying one stores { ...config, preset: id }.
 * `resolveTextEffect` reads only `type` + params, so presets render for free;
 * the `preset` id is just used by the panel to highlight the active tile.
 */
export const EFFECT_PRESETS = [
  { id: "pop", label: "Pop", config: { type: "shadow", offset: 72, direction: 45, blur: 0, transparency: 0, color: "#111111" } },
  { id: "retro", label: "Retro", config: { type: "echo", offset: 72, direction: 40, color: "#ff5c8a" } },
  { id: "extrude", label: "3D", config: { type: "echo", offset: 58, direction: 45, color: "#6b7280" } },
  { id: "soft", label: "Soft", config: { type: "shadow", offset: 32, direction: 90, blur: 62, transparency: 45, color: "#000000" } },
  { id: "cyber", label: "Cyber", config: { type: "glow", intensity: 70, color: "#22d3ee" } },
  { id: "neon", label: "Neon", config: { type: "neon", intensity: 78 } },
  { id: "sticker", label: "Sticker", config: { type: "outline", thickness: 82, color: "#ffffff" } },
  { id: "marker", label: "Marker", config: { type: "background", roundness: 28, spread: 22, transparency: 0, color: "#fde047" } },
];

/**
 * resolveTextEffect(el) → normalized descriptor, or null when no effect.
 * {
 *   shadows: [{ dx, dy, blur, color }],   // painted behind the glyphs
 *   stroke: { width, color } | null,      // glyph outline
 *   fillOverride: "transparent" | null,   // hollow → no fill, stroke only
 *   background: { color, radius, padX, padY } | null,
 * }
 * All sizes are in px, already scaled to the element's font size.
 */
export function resolveTextEffect(el) {
  const e = el?.textEffect;
  if (!e || !e.type || e.type === "none") return null;

  const size = el.fontSize || 16;
  const fill = el.fill || el.color || "#111111";
  const color = e.color || EFFECT_COLOR[e.type] || "#000000";
  const rad = (deg) => (deg * Math.PI) / 180;
  const vec = (deg, dist) => ({
    dx: Math.cos(rad(deg)) * dist,
    dy: Math.sin(rad(deg)) * dist,
  });

  switch (e.type) {
    case "shadow": {
      const { dx, dy } = vec(num(e.direction, -45), (num(e.offset, 50) / 100) * size * 0.5);
      const blur = (num(e.blur, 20) / 100) * size * 0.8;
      const a = 1 - num(e.transparency, 40) / 100;
      return { shadows: [{ dx, dy, blur, color: rgba(color, a) }] };
    }
    case "lift": {
      const i = num(e.intensity, 50) / 100;
      return {
        shadows: [
          {
            dx: 0,
            dy: size * 0.06 * (0.6 + i),
            blur: size * (0.14 + 0.3 * i),
            color: `rgba(0,0,0,${round(0.18 + 0.32 * i)})`,
          },
        ],
      };
    }
    case "hollow": {
      const width = Math.max(0.5, (num(e.thickness, 50) / 100) * size * 0.06);
      return { stroke: { width, color: fill }, fillOverride: "transparent" };
    }
    case "splice": {
      // Outlined (hollow) front + a solid, offset copy behind in the effect colour.
      const width = Math.max(0.5, (num(e.thickness, 50) / 100) * size * 0.06);
      const { dx, dy } = vec(num(e.direction, -45), (num(e.offset, 50) / 100) * size * 0.5);
      return {
        stroke: { width, color: fill },
        fillOverride: "transparent",
        back: { dx, dy, color },
      };
    }
    case "outline": {
      const width = Math.max(0.5, (num(e.thickness, 50) / 100) * size * 0.07);
      return { stroke: { width, color } };
    }
    case "echo": {
      const { dx, dy } = vec(num(e.direction, -45), (num(e.offset, 50) / 100) * size * 0.5);
      return {
        shadows: [
          { dx: dx * 0.5, dy: dy * 0.5, blur: 0, color: rgba(color, 0.5) },
          { dx, dy, blur: 0, color: rgba(color, 0.3) },
        ],
      };
    }
    case "glow": {
      const b = size * (0.15 + 0.5 * (num(e.intensity, 50) / 100));
      return {
        shadows: [
          { dx: 0, dy: 0, blur: b, color: rgba(color, 0.9) },
          { dx: 0, dy: 0, blur: b * 2, color: rgba(color, 0.6) },
        ],
      };
    }
    case "neon": {
      const b = size * (0.15 + 0.5 * (num(e.intensity, 50) / 100));
      return {
        shadows: [
          { dx: 0, dy: 0, blur: b, color: rgba(fill, 0.9) },
          { dx: 0, dy: 0, blur: b * 2.2, color: rgba(fill, 0.55) },
        ],
      };
    }
    case "background": {
      const a = 1 - num(e.transparency, 0) / 100;
      return {
        background: {
          color: rgba(color, a),
          radius: (num(e.roundness, 50) / 100) * size * 0.6,
          padX: (num(e.spread, 30) / 100) * size * 0.5 + size * 0.18,
          padY: (num(e.spread, 30) / 100) * size * 0.5 + size * 0.05,
        },
      };
    }
    default:
      return null;
  }
}

/**
 * textEffectCss(el) → { css, background } for the on-canvas DOM text node, or
 * null when the element has no effect. `css` merges straight onto the text
 * node's inline style; `background` (when present) is applied as a filled,
 * rounded, padded backing box.
 */
export function textEffectCss(el) {
  const d = resolveTextEffect(el);
  if (!d) return null;
  const css = {};
  // Shadow / echo / glow layers, plus a splice "back" copy (a solid 0-blur
  // shadow — visible even when the glyph fill is transparent).
  const parts = (d.shadows || []).map(
    (s) => `${round(s.dx)}px ${round(s.dy)}px ${round(s.blur)}px ${s.color}`,
  );
  if (d.back) parts.push(`${round(d.back.dx)}px ${round(d.back.dy)}px 0px ${d.back.color}`);
  if (parts.length) css.textShadow = parts.join(", ");
  if (d.stroke) {
    css.WebkitTextStroke = `${round(d.stroke.width)}px ${d.stroke.color}`;
    if (d.fillOverride) css.WebkitTextFillColor = d.fillOverride;
  }
  return { css, background: d.background || null };
}
