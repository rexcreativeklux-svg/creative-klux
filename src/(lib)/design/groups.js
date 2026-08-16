/**
 * groups.js — the group element model, shared by the editor and the exporter.
 *
 * A group is an ordinary element:
 *
 *   { id, type: 'group', x, y, width, height, rotation, opacity, children: [...] }
 *
 * `children` holds REAL elements whose x/y are relative to the group's top-left
 * corner. That is the only copy of them — they are not duplicated anywhere else,
 * so a child can still be read, scaled and (later) edited in place, and ungroup
 * can never hand back stale data.
 *
 * Everything that consumes a design flat — the PNG exporter, hit-testing, the
 * thumbnail renderer — calls flattenGroups() and never has to know groups exist.
 */

export const GROUP_TYPE = "group";

export const isGroup = (el) => el?.type === GROUP_TYPE;

/** Rotate (px,py) by `deg` around (cx,cy). */
function rotatePoint(px, py, cx, cy, deg) {
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const dx = px - cx;
  const dy = py - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

/**
 * Axis-aligned union box of a set of elements. Rotation is deliberately ignored
 * (the same convention the marquee and the layers list use): the box frames the
 * elements' own boxes, which is what a selection outline is expected to hug.
 */
export function boundsOf(elements) {
  const list = (elements || []).filter(Boolean);
  if (!list.length) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of list) {
    const x = Number(el.x) || 0;
    const y = Number(el.y) || 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + (Number(el.width) || 0));
    maxY = Math.max(maxY, y + (Number(el.height) || 0));
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Build a group from elements given in ABSOLUTE coordinates. The members keep
 * every property they had; only x/y are rebased onto the group's corner.
 *
 * Members must be passed in stacking order (their order in the design's element
 * array) — that order is preserved inside the group, and restored around the
 * group's own position on ungroup.
 */
export function makeGroup(members, id) {
  const box = boundsOf(members);
  return {
    id,
    type: GROUP_TYPE,
    ...box,
    rotation: 0,
    opacity: 1,
    children: members.map((el) => ({
      ...el,
      x: (Number(el.x) || 0) - box.x,
      y: (Number(el.y) || 0) - box.y,
    })),
  };
}

/**
 * The group's children in absolute canvas coordinates.
 *
 * A rotated group rotates its children AROUND ITS OWN CENTRE — which is what
 * the DOM does when the wrapper carries the transform, so flattening has to
 * reproduce it or an exported PNG would disagree with the stage: each child's
 * centre is swept by the group's angle, and the angle is added to the child's
 * own. Opacity multiplies through for the same reason.
 */
export function absoluteChildren(group) {
  if (!isGroup(group)) return [];
  const angle = group.rotation || 0;
  const gAlpha = group.opacity ?? 1;
  const cx = group.x + (group.width || 0) / 2;
  const cy = group.y + (group.height || 0) / 2;

  return (group.children || []).map((child) => {
    const w = Number(child.width) || 0;
    const h = Number(child.height) || 0;
    let x = group.x + (Number(child.x) || 0);
    let y = group.y + (Number(child.y) || 0);

    if (angle) {
      const c = rotatePoint(x + w / 2, y + h / 2, cx, cy, angle);
      x = c.x - w / 2;
      y = c.y - h / 2;
    }

    return {
      ...child,
      x,
      y,
      rotation: (child.rotation || 0) + angle,
      opacity: (child.opacity ?? 1) * gAlpha,
      hidden: child.hidden || group.hidden || undefined,
    };
  });
}

/**
 * Expand every group into its children, recursively. Element order is preserved,
 * so the stacking order of a flattened design matches what the stage shows.
 */
export function flattenGroups(elements) {
  const out = [];
  for (const el of elements || []) {
    if (isGroup(el)) out.push(...flattenGroups(absoluteChildren(el)));
    else out.push(el);
  }
  return out;
}

// Scalar properties that must NOT be scaled per-axis, or type and strokes
// distort when a group is resized non-uniformly.
const UNIFORM_PROPS = ["fontSize", "letterSpacing", "strokeWidth", "borderRadius"];

/**
 * Children rescaled for a new group size. Positions and boxes scale per-axis so
 * the layout inside the group is preserved exactly; typographic scalars scale by
 * the geometric mean so text grows without stretching.
 */
export function scaleChildren(children, sx, sy) {
  if (sx === 1 && sy === 1) return children;
  const uni = Math.sqrt(Math.abs(sx * sy)) || 1;

  return (children || []).map((child) => {
    const next = {
      ...child,
      x: (Number(child.x) || 0) * sx,
      y: (Number(child.y) || 0) * sy,
      width: (Number(child.width) || 0) * sx,
      height: (Number(child.height) || 0) * sy,
    };
    for (const key of UNIFORM_PROPS) {
      if (typeof child[key] === "number") next[key] = child[key] * uni;
    }
    // A nested group scales its own children too, or the inner layout drifts
    // out of the box that was just resized around it.
    if (isGroup(child)) next.children = scaleChildren(child.children, sx, sy);
    return next;
  });
}

/**
 * Apply a size patch to a group: the new box plus children rescaled to fit it.
 * Returns the patch to merge, so callers stay a one-liner.
 */
export function resizeGroupPatch(group, width, height) {
  const sx = group.width ? width / group.width : 1;
  const sy = group.height ? height / group.height : 1;
  return { width, height, children: scaleChildren(group.children, sx, sy) };
}
