/**
 * Tone adjustments that CSS filter functions can't express — Canva's Tint,
 * Highlights, Shadows, Whites, Blacks and Vibrance — as a generated SVG filter.
 *
 * CSS has brightness and contrast, which move EVERY tone; "lift the shadows"
 * means moving the darks and leaving the lights alone, which takes a tone
 * curve. An SVG <feComponentTransfer> is exactly that, and `filter: url(#id)`
 * applies it both to a DOM node and — the reason this approach was chosen — to
 * a canvas through `ctx.filter`, so the PNG export paints what the stage shows.
 *
 * Each distinct set of values gets one <filter>, keyed by those values, in a
 * single hidden <svg> on the page. It is created on first use from whichever
 * side asks first (the stage or the exporter), so neither depends on the other
 * having rendered.
 *
 * All inputs are on Canva's −100…100 scale.
 */

export const TONE_KEYS = ["tint", "highlights", "shadows", "whites", "blacks", "vibrance"];

const SAMPLES = 17;
const HOST_ID = "ck-tone-filters";

/** Bumps shaped to the part of the range each control owns, peaking at 1. */
const shadowsBand = (x) => 6.75 * x * (1 - x) * (1 - x); // peak at 1/3
const highlightsBand = (x) => 6.75 * x * x * (1 - x); // peak at 2/3
const whitesBand = (x) => x * x * x; // the top end
const blacksBand = (x) => (1 - x) * (1 - x) * (1 - x); // the bottom end

function curveTable({ highlights = 0, shadows = 0, whites = 0, blacks = 0 }) {
  const values = [];
  for (let i = 0; i < SAMPLES; i += 1) {
    const x = i / (SAMPLES - 1);
    const y =
      x +
      (shadows / 100) * 0.22 * shadowsBand(x) +
      (highlights / 100) * 0.22 * highlightsBand(x) +
      (whites / 100) * 0.18 * whitesBand(x) +
      (blacks / 100) * 0.18 * blacksBand(x);
    values.push(Math.min(1, Math.max(0, y)).toFixed(4));
  }
  return values.join(" ");
}

const active = (a) => TONE_KEYS.some((k) => Number(a?.[k]));

/** A stable id for a set of values — equal settings share one filter. */
const idFor = (a) =>
  "ck-tone-" + TONE_KEYS.map((k) => Math.round(Number(a?.[k]) || 0)).join("_").replace(/-/g, "m");

function markup(id, a) {
  const tint = (Number(a.tint) || 0) / 100;
  const vib = 1 + ((Number(a.vibrance) || 0) / 100) * 0.6;
  // Tint: + pushes toward magenta (less green), − toward green. Offsets in the
  // matrix's last column, so the cast is added rather than hues rotated.
  const k = tint * 0.06;
  const table = curveTable(a);
  return (
    `<filter id="${id}" color-interpolation-filters="sRGB">` +
    `<feComponentTransfer>` +
    `<feFuncR type="table" tableValues="${table}"/>` +
    `<feFuncG type="table" tableValues="${table}"/>` +
    `<feFuncB type="table" tableValues="${table}"/>` +
    `</feComponentTransfer>` +
    `<feColorMatrix type="matrix" values="1 0 0 0 ${k} 0 1 0 0 ${-k} 0 0 1 0 ${k} 0 0 0 1 0"/>` +
    `<feColorMatrix type="saturate" values="${vib}"/>` +
    `</filter>`
  );
}

/**
 * The `url(#…)` for these adjustments, installing the filter on the page the
 * first time it's needed — or "" when none of the tone keys are set (or there
 * is no page, during server rendering).
 */
export function toneFilterUrl(adjust) {
  if (!active(adjust) || typeof document === "undefined") return "";
  const id = idFor(adjust);
  if (!document.getElementById(id)) {
    let host = document.getElementById(HOST_ID);
    if (!host) {
      host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      host.setAttribute("id", HOST_ID);
      host.setAttribute("width", "0");
      host.setAttribute("height", "0");
      host.setAttribute("aria-hidden", "true");
      host.style.position = "absolute";
      host.style.pointerEvents = "none";
      host.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "defs"));
      document.body.appendChild(host);
    }
    // Parsed as SVG, not HTML, so the filter primitives land in the SVG
    // namespace — an HTML parse of this string makes inert unknown elements.
    const doc = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg">${markup(id, adjust)}</svg>`,
      "image/svg+xml",
    );
    host.querySelector("defs").appendChild(document.importNode(doc.documentElement.firstChild, true));
  }
  return `url(#${id})`;
}
