/**
 * resizeElement.js — what a resize handle MEANS.
 *
 * The two gestures on a selection box do different jobs, and which one you get
 * is decided by which handle you grabbed:
 *
 *   · a CORNER scales — the box and everything measured in canvas units inside
 *     it grow together, so pulling the corner of a headline gives you a bigger
 *     headline rather than the same type re-wrapped in a wider box;
 *   · an EDGE crops — the contents stay exactly where and what size they were,
 *     and the box becomes a window showing less of them (clip.js).
 *
 * Both are pure functions of a SNAPSHOT taken when the gesture started plus the
 * pointer's total travel since. Never of the element's current state and a
 * per-frame delta: that accumulates rounding error over a drag, and it makes
 * the result depend on how many frames the browser happened to render.
 *
 * Cropping is inward-only and fully reversible. The clamps below stop a window
 * at the edge of its own contents, so you can always drag back out to exactly
 * where you started and never past it into empty space. That is the same
 * promise the modal crop tool makes (ImageCropOverlay).
 */

import { isClipped, seedClip, normalizeClip } from "./clip";
import { scaledProps } from "./scaleProps";
import { isGroup } from "./groups";

/** Smallest box a gesture may leave behind, in canvas units. */
export const MIN_BOX = 10;

/** The four edge handles, and which way each one travels. */
export const EDGES = ["top", "right", "bottom", "left"];

/** The four corner handles. */
export const CORNERS = ["topLeft", "topRight", "bottomRight", "bottomLeft"];

// Which way each corner grows: +1 means "away from the origin on this axis".
// The opposite corner is the anchor, and it is the one that must not move.
const CORNER_GROWTH = {
  topLeft: { sx: -1, sy: -1 },
  topRight: { sx: 1, sy: -1 },
  bottomRight: { sx: 1, sy: 1 },
  bottomLeft: { sx: -1, sy: 1 },
};

const HORIZONTAL = new Set(["left", "right"]);

/** Edges that move the box's own origin as well as its size. */
const MOVES_ORIGIN = new Set(["left", "top"]);

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * CROP: move one edge of the window over the contents.
 *
 * `contentW`/`contentH` are never touched here. That single invariant is the
 * whole feature — it is what makes this a crop rather than a resize.
 *
 * @param {object} snap  the element as it was when the gesture started
 * @param {string} edge  "top" | "right" | "bottom" | "left"
 * @param {number} dx    total pointer travel since the gesture started, canvas units
 * @param {number} dy
 * @returns {object} a patch to merge onto the element
 */
export function cropByEdge(snap, edge, dx, dy) {
  const clip = isClipped(snap.clip) ? snap.clip : seedClip(snap);
  const horizontal = HORIZONTAL.has(edge);

  const size = horizontal ? snap.width : snap.height;
  const offset = horizontal ? clip.offsetX || 0 : clip.offsetY || 0;
  const content = horizontal ? clip.contentW : clip.contentH;
  const travel = horizontal ? dx : dy;

  // How far this edge may move before it either collapses the window or runs
  // off the end of the contents.
  const d = MOVES_ORIGIN.has(edge)
    ? clamp(travel, -offset, size - MIN_BOX)
    : clamp(travel, MIN_BOX - size, content - offset - size);

  // A leading edge takes the origin with it and slides the window over the
  // contents by the same amount; a trailing edge only changes the size.
  const lead = MOVES_ORIGIN.has(edge);
  const next = {
    offsetX: clip.offsetX || 0,
    offsetY: clip.offsetY || 0,
    contentW: clip.contentW,
    contentH: clip.contentH,
  };
  const box = {
    x: snap.x,
    y: snap.y,
    width: snap.width,
    height: snap.height,
  };

  if (horizontal) {
    box.width = lead ? snap.width - d : snap.width + d;
    if (lead) {
      box.x = snap.x + d;
      next.offsetX += d;
    }
  } else {
    box.height = lead ? snap.height - d : snap.height + d;
    if (lead) {
      box.y = snap.y + d;
      next.offsetY += d;
    }
  }

  const patch = {
    ...withRotationHeld(snap, box),
    clip: normalizeClip(next, { width: box.width, height: box.height }),
  };

  // A group's children must be handed back untouched. `patched()` in
  // useDesignEditor rescales a group's contents on ANY width/height patch, and
  // naming `children` is its documented opt-out — without this, cropping a
  // group would squash every member instead of revealing less of them.
  if (isGroup(snap)) patch.children = snap.children;

  return patch;
}

/**
 * STRETCH: the old behaviour, on an edge drag with Shift held.
 *
 * Aspect-locked corners plus cropping edges would otherwise leave no way to
 * deliberately distort an element — to pull a rectangle out into a banner — so
 * this keeps that reachable rather than removing it from the product.
 */
export function stretchByEdge(snap, edge, dx, dy) {
  const horizontal = HORIZONTAL.has(edge);
  const travel = horizontal ? dx : dy;
  const size = horizontal ? snap.width : snap.height;
  const d = MOVES_ORIGIN.has(edge)
    ? clamp(travel, -Infinity, size - MIN_BOX)
    : clamp(travel, MIN_BOX - size, Infinity);

  const lead = MOVES_ORIGIN.has(edge);
  const box = { x: snap.x, y: snap.y, width: snap.width, height: snap.height };

  if (horizontal) {
    box.width = lead ? snap.width - d : snap.width + d;
    if (lead) box.x = snap.x + d;
  } else {
    box.height = lead ? snap.height - d : snap.height + d;
    if (lead) box.y = snap.y + d;
  }

  return withRotationHeld(snap, box);
}

/**
 * SCALE: the contents that go with a corner drag.
 *
 * Only the canvas-unit properties — react-rnd owns the box during a corner
 * gesture and has already sized it correctly, so patching width/height here
 * would fight it (and be ignored mid-drag anyway; re-resizable stops reading
 * the `size` prop while it is resizing).
 *
 * A crop window scales with everything else: it is in canvas units, so a
 * window left at its old size would expose a different amount of a
 * newly-sized layout.
 *
 * @param {object} snap  the element as it was when the gesture started
 * @param {number} k     total scale factor since the gesture started
 */
/**
 * SCALE: a corner drag, box and contents together.
 *
 * The opposite corner is the anchor and stays put. Aspect is locked, because a
 * corner is the gesture that means "same thing, bigger" — the edges are there
 * for changing the shape of the box.
 *
 * The factor is the least-squares fit of the pointer onto the box's own
 * diagonal, so a drag along either axis, or anywhere between, reads naturally.
 * Taking width alone (as the reference implementation does) makes a vertical
 * drag on a corner do nothing at all.
 *
 * @param {object} snap  the element as it was when the gesture started
 * @param {string} corner  "topLeft" | "topRight" | "bottomRight" | "bottomLeft"
 * @param {number} dx  total pointer travel since the gesture started, canvas units
 * @param {number} dy
 */
export function scaleByCorner(snap, corner, dx, dy) {
  const grow = CORNER_GROWTH[corner];
  if (!grow) return {};

  const W = Number(snap.width) || 1;
  const H = Number(snap.height) || 1;

  // Where the dragged corner has been asked to go, in "growth" terms.
  const wantW = W + dx * grow.sx;
  const wantH = H + dy * grow.sy;

  const k = Math.max(
    (W * wantW + H * wantH) / (W * W + H * H),
    Math.max(MIN_BOX / W, MIN_BOX / H),
  );

  const width = W * k;
  const height = H * k;

  // The anchor is the corner NOT being dragged; the box is rebuilt from it.
  const anchorX = grow.sx > 0 ? snap.x : snap.x + W;
  const anchorY = grow.sy > 0 ? snap.y : snap.y + H;

  const box = {
    x: grow.sx > 0 ? anchorX : anchorX - width,
    y: grow.sy > 0 ? anchorY : anchorY - height,
    width,
    height,
  };

  return { ...withRotationHeld(snap, box), ...scaleContents(snap, k) };
}

/**
 * Keep a rotated element's anchor where the user sees it.
 *
 * An element is drawn by rotating around its OWN centre, and resizing moves
 * that centre — so the corner you are not dragging swings away from where you
 * left it, and the shape appears to drift out from under the pointer. Mapping
 * the new centre through the rotation of the OLD one pins it back, which is
 * what a resize is supposed to look like.
 *
 * A no-op for the unrotated case, which is nearly everything.
 */
export function withRotationHeld(snap, box) {
  const deg = snap.rotation || 0;
  if (!deg) return box;

  const cx = snap.x + (Number(snap.width) || 0) / 2;
  const cy = snap.y + (Number(snap.height) || 0) / 2;
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);

  const nx = box.x + box.width / 2 - cx;
  const ny = box.y + box.height / 2 - cy;

  return {
    ...box,
    x: cx + nx * cos - ny * sin - box.width / 2,
    y: cy + nx * sin + ny * cos - box.height / 2,
  };
}

export function scaleContents(snap, k) {
  if (!Number.isFinite(k) || k <= 0 || k === 1) return {};

  const patch = scaledProps(snap, k);

  if (isClipped(snap.clip)) {
    patch.clip = {
      offsetX: (snap.clip.offsetX || 0) * k,
      offsetY: (snap.clip.offsetY || 0) * k,
      contentW: snap.clip.contentW * k,
      contentH: snap.clip.contentH * k,
    };
  }

  return patch;
}
