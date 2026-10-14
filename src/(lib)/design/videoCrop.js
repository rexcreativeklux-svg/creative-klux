import { isCropped } from "./imageCrop";

/**
 * Video crop — the geometry behind Canva's crop mode for a video.
 *
 * A video can't be baked into new pixels the way a cropped image is, so a crop
 * is kept as `el.crop`, a rect normalized to the SOURCE frame, and the box is
 * sized to it; the renderers stretch exactly that rect onto the box. Because
 * the whole source is still there, crop mode can show all of it behind the
 * frame and the frame can grow back OUT — not only in, as image crop does.
 *
 * `el.cropRotate` (degrees, ±45) straightens the footage inside the frame. It
 * turns about the box centre and scales up just enough that no corner of the
 * box shows past the edge of the footage (coverScale) — what Canva's Rotate
 * slider does.
 *
 * Everything in crop mode is worked in the element's LOCAL frame: origin at
 * its top-left, unrotated, unflipped, in canvas units.
 */

export const CROP_RATIOS = [
  { id: "free", label: "Freeform" },
  { id: "original", label: "Original" },
  { id: "1:1", label: "1:1", r: 1 },
  { id: "16:9", label: "16:9", r: 16 / 9 },
  { id: "9:16", label: "9:16", r: 9 / 16 },
  { id: "5:4", label: "5:4", r: 5 / 4 },
  { id: "4:5", label: "4:5", r: 4 / 5 },
  { id: "4:3", label: "4:3", r: 4 / 3 },
  { id: "3:4", label: "3:4", r: 3 / 4 },
  { id: "3:2", label: "3:2", r: 3 / 2 },
  { id: "2:3", label: "2:3", r: 2 / 3 },
];

export const MAX_CROP_ROTATE = 45;

/** Width ÷ height of the source frame. */
export const sourceAspect = (el) =>
  (Number(el.natW) || el.width) / (Number(el.natH) || el.height);

/** The aspect a ratio id asks for, or null for freeform. */
export function ratioValue(id, el) {
  if (id === "original") return sourceAspect(el);
  return CROP_RATIOS.find((r) => r.id === id)?.r ?? null;
}

/**
 * The part of the source the box shows now, normalized 0–1: the crop rect, or
 * what a cover fit leaves visible.
 */
export function visibleRect(el) {
  if (isCropped(el.crop)) return el.crop;
  const box = el.width / el.height;
  const src = sourceAspect(el);
  if (!Number.isFinite(box) || !Number.isFinite(src)) return { x: 0, y: 0, w: 1, h: 1 };
  if (src > box) {
    const w = box / src;
    return { x: (1 - w) / 2, y: 0, w, h: 1 };
  }
  const h = src / box;
  return { x: 0, y: (1 - h) / 2, w: 1, h };
}

/** The whole source frame, laid out in the element's local frame. */
export function sourceRect(el) {
  const v = visibleRect(el);
  const w = el.width / v.w;
  const h = el.height / v.h;
  return { x: -v.x * w, y: -v.y * h, w, h };
}

/**
 * How much footage turned by `deg` inside a w×h box must be scaled up so the
 * box stays covered. The box's half-extents, turned into the footage's frame,
 * have to fit inside the footage's half-extents on both axes.
 */
export function coverScale(w, h, deg) {
  const t = (Math.abs(Number(deg) || 0) * Math.PI) / 180;
  if (!t || !w || !h) return 1;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return Math.max(c + (h / w) * s, (w / h) * s + c);
}

/**
 * The biggest rect of aspect `r` that fits in the source, centred where `sel`
 * is centred (and slid back inside if that spills over an edge).
 */
export function fitRatio(sel, R, r) {
  if (!r) return sel;
  let w = Math.min(R.w, R.h * r);
  let h = w / r;
  // Keep roughly the size you had rather than jumping to the whole frame.
  const scale = Math.min(1, Math.max(sel.w / w, sel.h / h));
  w *= scale;
  h *= scale;
  const cx = sel.x + sel.w / 2;
  const cy = sel.y + sel.h / 2;
  return {
    x: Math.min(R.x + R.w - w, Math.max(R.x, cx - w / 2)),
    y: Math.min(R.y + R.h - h, Math.max(R.y, cy - h / 2)),
    w,
    h,
  };
}

/**
 * The element patch a finished crop session makes: the new source rect, the
 * new box (moved so it sits where the frame was drawn, rotation and flips
 * included), and the straighten angle.
 */
export function cropSessionPatch(el, sel, rotate) {
  const R = sourceRect(el);
  const crop = {
    x: (sel.x - R.x) / R.w,
    y: (sel.y - R.y) / R.h,
    w: sel.w / R.w,
    h: sel.h / R.h,
  };
  // The frame's centre moved within the local frame; carry that move out to
  // the page through the element's flips and rotation.
  const fx = el.flipH ? -1 : 1;
  const fy = el.flipV ? -1 : 1;
  const dx = (sel.x + sel.w / 2 - el.width / 2) * fx;
  const dy = (sel.y + sel.h / 2 - el.height / 2) * fy;
  const a = ((Number(el.rotation) || 0) * Math.PI) / 180;
  const cx = el.x + el.width / 2 + dx * Math.cos(a) - dy * Math.sin(a);
  const cy = el.y + el.height / 2 + dx * Math.sin(a) + dy * Math.cos(a);
  const full = crop.x <= 0.001 && crop.y <= 0.001 && crop.w >= 0.999 && crop.h >= 0.999;
  return {
    crop: full ? null : crop,
    cropRotate: Math.round(Number(rotate) || 0) || null,
    x: cx - sel.w / 2,
    y: cy - sel.h / 2,
    width: sel.w,
    height: sel.h,
    // A crop fills the box exactly; "fit" letterboxing would fight it.
    objectFit: "cover",
  };
}
