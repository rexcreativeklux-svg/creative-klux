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

import { scaledProps } from "./scaleProps";
import { isClipped, scaledClip } from "./clip";

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
/**
 * Where a group's contents START, which is not always the group's own corner.
 *
 * Dragging a side handle CROPS a group, the same promise the side handles make
 * on an image: the contents don't move or rescale, the box just shows less of
 * them. So the box becomes a window, and the crop offset is how far that window's
 * corner sits inside the contents. Children keep the offsets they were grouped
 * at; only this origin moves.
 */
export function groupOrigin(group) {
  const win = isClipped(group?.clip) ? group.clip : null;
  return {
    x: (group?.x || 0) - (win?.offsetX || 0),
    y: (group?.y || 0) - (win?.offsetY || 0),
  };
}

/**
 * Where a child really sits on the page, and how far it is really turned.
 *
 * The stored position is relative to the group's UNROTATED box, so a rotated
 * group needs its child's centre swung around the group's centre — the same
 * thing the DOM does when the wrapper carries the transform. Both the flatten
 * path and the editor's child-selection path go through this, so a selection
 * box can't land somewhere the artwork isn't.
 */
function childPlacement(group, child) {
  const w = Number(child.width) || 0;
  const h = Number(child.height) || 0;
  const angle = group.rotation || 0;
  const origin = groupOrigin(group);

  let x = origin.x + (Number(child.x) || 0);
  let y = origin.y + (Number(child.y) || 0);

  if (angle) {
    const c = rotatePoint(
      x + w / 2,
      y + h / 2,
      group.x + (group.width || 0) / 2,
      group.y + (group.height || 0) / 2,
      angle,
    );
    x = c.x - w / 2;
    y = c.y - h / 2;
  }

  return { x, y, rotation: (child.rotation || 0) + angle };
}

export function absoluteChildren(group) {
  if (!isGroup(group)) return [];
  const angle = group.rotation || 0;
  const gAlpha = group.opacity ?? 1;
  const cx = group.x + (group.width || 0) / 2;
  const cy = group.y + (group.height || 0) / 2;

  // A cropped group is a WINDOW onto its contents (see clip.js): the members
  // stay exactly where they were arranged and the box shows less of them. So
  // they are laid out from an origin BEHIND the box, and the box itself becomes
  // a mask the painter has to apply.
  const win = isClipped(group.clip) ? group.clip : null;

  // The mask, pre-rotated into absolute canvas space. A polygon rather than a
  // rect because a rotated group's window is not axis-aligned, and carrying it
  // already-transformed means the painter needs no transform bookkeeping —
  // successive clips simply intersect. Nested groups append, outermost first.
  const polys = group.__clip ? [...group.__clip] : [];
  if (win) {
    polys.push(
      [
        [group.x, group.y],
        [group.x + (group.width || 0), group.y],
        [group.x + (group.width || 0), group.y + (group.height || 0)],
        [group.x, group.y + (group.height || 0)],
      ].map(([px, py]) => (angle ? rotatePoint(px, py, cx, cy, angle) : { x: px, y: py })),
    );
  }

  return (group.children || []).map((child) => ({
    ...child,
    ...childPlacement(group, child),
    opacity: (child.opacity ?? 1) * gAlpha,
    hidden: child.hidden || group.hidden || undefined,
    ...(polys.length ? { __clip: polys } : null),
  }));
}

// ── Reaching a single child ──────────────────────────────────────────────────
//
// A group's members live in `group.children` and are NOT in the elements array,
// which is what makes a group one thing to drag and one thing to stack — and
// also why nothing that looks an element up by id can see them. Clicking INTO a
// group selects one anyway, so every question the editor asks about a child goes
// through the four functions below.

/**
 * Memo for childAsElement, keyed on the stored child.
 *
 * Not an optimisation — it is what makes the result usable as the selection.
 * `selectedElement` is read every render, and a function that mints a new object
 * each time would hand React a new element identity on every pass, re-running
 * every memo and effect keyed on it (and restarting any gesture measuring
 * against it). Top-level elements come straight out of the array and are stable
 * for free; this is the one place that has to earn it.
 *
 * The group is part of the cache entry because a child's absolute position
 * depends on where the group is and how far it is turned. Both objects are
 * replaced whenever anything about them changes, so identity is the whole test.
 */
const childViewCache = new WeakMap();

/**
 * A child as an ordinary element: absolute position, total rotation, and a
 * `groupId` marking it as owned — which is what lets a selected child flow
 * through the rest of the editor untouched. The panels, the context bar and the
 * selection chrome all ask for "the selected element" and get a normal-looking
 * one back; `patchGroupChild` is the way an edit gets home again.
 */
export function childAsElement(group, child) {
  if (!isGroup(group) || !child) return null;

  const cached = childViewCache.get(child);
  if (cached && cached.group === group) return cached.view;

  const view = { ...child, ...childPlacement(group, child), groupId: group.id };
  childViewCache.set(child, { group, view });
  return view;
}

/** The group that owns `id`, or null when the id isn't a group child. */
export function findGroupOf(elements, id) {
  if (!id) return null;
  return (
    (elements || []).find(
      (el) => isGroup(el) && (el.children || []).some((c) => c.id === id),
    ) || null
  );
}

/** Look an element up ANYWHERE — top level first, then one level into groups. */
export function findAnyElement(elements, id) {
  const direct = (elements || []).find((el) => el.id === id);
  if (direct) return direct;

  const group = findGroupOf(elements, id);
  if (!group) return null;
  return childAsElement(
    group,
    group.children.find((c) => c.id === id),
  );
}

/**
 * A group with one child patched.
 *
 * Position in the patch is ABSOLUTE — that is the only kind the rest of the
 * editor deals in — so it is converted back to the group-relative, unrotated
 * form the child is stored in. Rotation likewise: what is stored is the child's
 * own spin, not the group's share of it.
 *
 * Resizing a child does NOT resize the group's box: a group is a frame around
 * where its members were, and re-fitting it on every nudge would make the box
 * creep. The box is the user's to change, with the group's own handles.
 */
export function patchGroupChild(group, childId, patch) {
  const angle = group.rotation || 0;
  const origin = groupOrigin(group);

  return {
    ...group,
    children: (group.children || []).map((child) => {
      if (child.id !== childId) return child;

      // groupId is the marker childAsElement adds; it describes ownership, not
      // the child, and must never be written into the stored member.
      const { x, y, rotation, groupId: _owned, ...rest } = patch;
      const next = { ...child, ...rest };
      if (rotation !== undefined) next.rotation = rotation - angle;

      // A member that is ITSELF a group is only a frame around its own contents:
      // resizing it has to carry them, exactly as it would at the top level.
      if (isGroup(next) && !rest.children) {
        const w = rest.width ?? child.width;
        const h = rest.height ?? child.height;
        if (w !== child.width || h !== child.height)
          Object.assign(next, resizeGroupPatch(child, w, h));
      }

      if (x === undefined && y === undefined) return next;

      // Undo childPlacement: swing the wanted centre back through the group's
      // rotation, then rebase it onto the contents' origin.
      const view = childAsElement(group, child);
      const w = Number(next.width) || 0;
      const h = Number(next.height) || 0;
      const centre = rotatePoint(
        (x ?? view.x) + w / 2,
        (y ?? view.y) + h / 2,
        group.x + (group.width || 0) / 2,
        group.y + (group.height || 0) / 2,
        -angle,
      );

      next.x = centre.x - w / 2 - origin.x;
      next.y = centre.y - h / 2 - origin.y;
      return next;
    }),
  };
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

/**
 * Children rescaled for a new group size. Positions and boxes scale per-axis so
 * the layout inside the group is preserved exactly; canvas-unit scalars scale by
 * the geometric mean so text grows without stretching.
 *
 * Which scalars those are is `scaledProps`' business, not this function's — the
 * list used to live here and had drifted out of step with the two other copies
 * of it.
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
      ...scaledProps(child, uni, { heightFactor: sy }),
      ...scaledClip(child, sx, sy),
    };
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
