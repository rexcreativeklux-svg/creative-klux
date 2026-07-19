/**
 * Corner-radius helpers. An element's `borderRadius` may be either a single
 * number (uniform) or a per-corner object { topLeft, topRight, bottomRight,
 * bottomLeft } (e.g. from imported designs). These normalize that shape for the
 * three consumers: a slider value, a CSS string, and a canvas roundRect arg.
 */

const corner = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// The four corners in CSS / canvas order: TL, TR, BR, BL.
export function radiusCorners(r) {
  if (typeof r === "number") return [corner(r), corner(r), corner(r), corner(r)];
  if (r && typeof r === "object") {
    return [
      corner(r.topLeft),
      corner(r.topRight),
      corner(r.bottomRight),
      corner(r.bottomLeft),
    ];
  }
  return [0, 0, 0, 0];
}

// A single representative number (max corner) — used for the slider readout.
export function radiusToNumber(r) {
  if (typeof r === "number") return corner(r);
  return Math.max(...radiusCorners(r));
}

// CSS `border-radius` value (shorthand handles both uniform and per-corner).
export function radiusToCss(r) {
  const [tl, tr, br, bl] = radiusCorners(r);
  return `${tl}px ${tr}px ${br}px ${bl}px`;
}

// True when any corner is rounded.
export function hasRadius(r) {
  return radiusCorners(r).some((c) => c > 0);
}
