"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  isGroup,
  makeGroup,
  absoluteChildren,
  resizeGroupPatch,
  scaleChildren,
} from "@/(lib)/design/groups";

/**
 * useDesignEditor — the single source of truth for the design editor.
 *
 * A "design" is `{ canvas, elements }` where:
 *   canvas   = { width, height, background }
 *   elements = [{ id, type: 'text'|'shape'|'image', x, y, width, height, rotation, opacity, ...typeProps }]
 *
 * A `group` element carries its members in `children` (see lib/design/groups.js).
 *
 * Selection is an ARRAY (`selectedIds`). `selectedId` / `selectedElement` remain
 * exported as the FIRST of the selection: every contextual panel is written
 * against a single element, and the first one is the one their controls apply
 * to — the same convention the canvas editor uses.
 *
 * This hook owns the mutable editor state + an undo/redo history and exposes
 * granular actions. It is intentionally UI-agnostic so any chrome can drive it.
 */

const MAX_HISTORY = 60;

// Stable id generator (avoids Math.random collisions across re-renders).
let __uid = 0;
export function nextElementId() {
  __uid += 1;
  return `el_${__uid}_${Date.now().toString(36)}`;
}

const DEFAULT_CANVAS = { width: 1080, height: 1080, background: "#ffffff" };

/**
 * Merge a patch into an element.
 *
 * Resizing a GROUP has to carry its children with it — the group's box is only
 * a frame around them, so changing it without rescaling what's inside would
 * leave the contents at their old size, spilling out of (or rattling around in)
 * the box the user just dragged. A patch that already names `children` is
 * trusted as-is: that is the caller doing the arithmetic itself.
 */
function patched(el, patch) {
  if (!isGroup(el) || patch.children) return { ...el, ...patch };
  const width = patch.width ?? el.width;
  const height = patch.height ?? el.height;
  if (width === el.width && height === el.height) return { ...el, ...patch };
  return { ...el, ...patch, ...resizeGroupPatch(el, width, height) };
}

/** A copy with fresh ids all the way down, safe to add alongside the original. */
function cloneElement(el) {
  const copy = { ...el, id: nextElementId() };
  if (isGroup(copy)) copy.children = (el.children || []).map(cloneElement);
  return copy;
}

/**
 * Scale one element to a canvas resize. Most elements scale per-axis (sx, sy)
 * so the layout stays proportional; scalar typographic props (font size,
 * tracking, stroke, radius) scale by a single uniform factor so text and shapes
 * don't distort. Images are special-cased: they scale UNIFORMLY (preserving
 * their own aspect ratio) and stay centred on their proportionally-moved
 * centre, so pictures never stretch.
 */
function refitElement(el, sx, sy, uni) {
  const next = { ...el };

  if (
    el.type === "image" &&
    typeof el.width === "number" &&
    typeof el.height === "number"
  ) {
    // Preserve aspect: keep the image's centre in the same relative spot and
    // scale both dimensions by the uniform factor.
    const cx = (Number(el.x) || 0) + el.width / 2;
    const cy = (Number(el.y) || 0) + el.height / 2;
    next.width = el.width * uni;
    next.height = el.height * uni;
    next.x = cx * sx - next.width / 2;
    next.y = cy * sy - next.height / 2;
  } else {
    if (typeof el.x === "number") next.x = el.x * sx;
    if (typeof el.y === "number") next.y = el.y * sy;
    if (typeof el.width === "number") next.width = el.width * sx;
    if (typeof el.height === "number") next.height = el.height * sy;
  }

  if (typeof el.fontSize === "number") next.fontSize = el.fontSize * uni;
  if (typeof el.letterSpacing === "number") next.letterSpacing = el.letterSpacing * uni;
  if (typeof el.strokeWidth === "number") next.strokeWidth = el.strokeWidth * uni;
  if (typeof el.borderRadius === "number") next.borderRadius = el.borderRadius * uni;
  // A group's box was just rescaled; its contents have to follow, or the
  // members keep their old size inside a box that no longer fits them.
  if (isGroup(el)) next.children = scaleChildren(el.children, sx, sy);
  return next;
}

/** Assign ids/defaults to one element, and to a group's children recursively. */
function normalizeElement(el) {
  const next = {
    id: el.id || nextElementId(),
    type: el.type || "text",
    x: Number(el.x) || 0,
    y: Number(el.y) || 0,
    width: Number(el.width) || 120,
    height: Number(el.height) || 40,
    rotation: Number(el.rotation) || 0,
    opacity: el.opacity ?? 1,
    ...el,
  };
  // A saved group's children are ordinary elements one level down — they need
  // the same defaults, or a design saved by an older build comes back with
  // children the renderer can't measure.
  if (isGroup(next)) next.children = (next.children || []).map(normalizeElement);
  return next;
}

/** Normalize an incoming design into editor shape (assign ids, defaults). */
export function normalizeForEditor(design) {
  const canvas = {
    width: design?.canvas?.width || DEFAULT_CANVAS.width,
    height: design?.canvas?.height || DEFAULT_CANVAS.height,
    background: design?.canvas?.background || DEFAULT_CANVAS.background,
  };

  const elements = (design?.elements || []).map(normalizeElement);

  return { canvas, elements };
}

export default function useDesignEditor(initialDesign) {
  const seed = useMemo(() => normalizeForEditor(initialDesign), [initialDesign]);

  const [canvas, setCanvasState] = useState(seed.canvas);
  const [elements, setElementsState] = useState(seed.elements);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dirty, setDirty] = useState(false);
  // Bumped on every whole-design replace (template / Klux AI apply) so the
  // stage can flash a brief "applied" confirmation.
  const [replaceToken, setReplaceToken] = useState(0);

  // History as snapshots. `past`/`future` hold {canvas, elements} clones.
  const past = useRef([]);
  const future = useRef([]);
  const [, forceHistoryTick] = useState(0);

  const snapshot = useCallback(
    () => ({
      canvas: { ...canvas },
      elements: elements.map((e) => ({ ...e })),
    }),
    [canvas, elements],
  );

  /** Push current state onto the undo stack before a mutation. */
  const commit = useCallback(() => {
    past.current.push(snapshot());
    if (past.current.length > MAX_HISTORY) past.current.shift();
    future.current = [];
    setDirty(true);
    forceHistoryTick((t) => t + 1);
  }, [snapshot]);

  const restore = useCallback((snap) => {
    setCanvasState(snap.canvas);
    setElementsState(snap.elements);
  }, []);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    const prev = past.current.pop();
    future.current.push(snapshot());
    restore(prev);
    setDirty(true);
    forceHistoryTick((t) => t + 1);
  }, [snapshot, restore]);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    const next = future.current.pop();
    past.current.push(snapshot());
    restore(next);
    setDirty(true);
    forceHistoryTick((t) => t + 1);
  }, [snapshot, restore]);

  // ── Element mutations ────────────────────────────────────────────────
  const updateElement = useCallback((id, patch, { record = true } = {}) => {
    if (record) commit();
    setElementsState((prev) =>
      prev.map((el) => (el.id === id ? patched(el, patch) : el)),
    );
    setDirty(true);
  }, [commit]);

  /**
   * Apply many patches — `[{ id, ...patch }]` — in ONE state update.
   *
   * Dragging a multi-selection would otherwise call updateElement per element
   * per frame, re-mapping the array and re-rendering the whole stage once for
   * every member of the selection on a single pointer move.
   */
  const updateElements = useCallback((patches, { record = true } = {}) => {
    if (!patches?.length) return;
    if (record) commit();
    const byId = new Map(patches.map(({ id, ...patch }) => [id, patch]));
    setElementsState((prev) =>
      prev.map((el) => (byId.has(el.id) ? patched(el, byId.get(el.id)) : el)),
    );
    setDirty(true);
  }, [commit]);

  const addElement = useCallback((el) => {
    commit();
    const withId = { id: nextElementId(), rotation: 0, opacity: 1, ...el };
    setElementsState((prev) => [...prev, withId]);
    setSelectedIds([withId.id]);
    setDirty(true);
    return withId.id;
  }, [commit]);

  /**
   * Delete elements as ONE undo step. Locked elements are left alone — a lock
   * means "don't touch this", and a selection that happens to include one must
   * not take it down with the rest.
   */
  const removeElements = useCallback((ids) => {
    const doomed = new Set(ids || []);
    if (!doomed.size) return;
    commit();
    setElementsState((prev) =>
      prev.filter((el) => !(doomed.has(el.id) && !el.locked)),
    );
    setSelectedIds((cur) => cur.filter((id) => !doomed.has(id)));
    setDirty(true);
  }, [commit]);

  const removeElement = useCallback((id) => removeElements([id]), [removeElements]);

  /**
   * Copy elements, offset by a shared step so a duplicated selection keeps its
   * layout instead of collapsing toward one point. The copies become the
   * selection, which is what makes "duplicate then drag" work.
   */
  const duplicateElements = useCallback((ids) => {
    const wanted = new Set(ids || []);
    if (!wanted.size) return;
    // Built outside the state updater: it mints fresh ids, and React may invoke
    // an updater more than once — which would hand the selection ids that no
    // element ended up carrying.
    const copies = elements
      .filter((el) => wanted.has(el.id))
      .map((src) => ({ ...cloneElement(src), x: src.x + 24, y: src.y + 24 }));
    if (!copies.length) return;

    commit();
    setElementsState((prev) => [...prev, ...copies]);
    setSelectedIds(copies.map((el) => el.id));
    setDirty(true);
  }, [commit, elements]);

  const duplicateElement = useCallback(
    (id) => duplicateElements([id]),
    [duplicateElements],
  );

  /** Reorder z-index. dir: 'front' | 'back' | 'forward' | 'backward'. */
  const moveLayer = useCallback((id, dir) => {
    commit();
    setElementsState((prev) => {
      const idx = prev.findIndex((el) => el.id === id);
      if (idx === -1) return prev;
      const arr = [...prev];
      const [item] = arr.splice(idx, 1);
      if (dir === "front") arr.push(item);
      else if (dir === "back") arr.unshift(item);
      else if (dir === "forward")
        arr.splice(Math.min(idx + 1, arr.length), 0, item);
      else arr.splice(Math.max(idx - 1, 0), 0, item);
      return arr;
    });
    setDirty(true);
  }, [commit]);

  const setBackground = useCallback((background) => {
    commit();
    setCanvasState((prev) => ({ ...prev, background }));
    setDirty(true);
  }, [commit]);

  /** Replace the whole design (e.g. applying a template). Undoable. */
  const replaceDesign = useCallback(
    (design) => {
      commit();
      const next = normalizeForEditor(design);
      setCanvasState(next.canvas);
      setElementsState(next.elements);
      setSelectedIds([]);
      setDirty(true);
      setReplaceToken((t) => t + 1);
    },
    [commit],
  );

  const setCanvasSize = useCallback((width, height) => {
    commit();
    setCanvasState((prev) => ({ ...prev, width, height }));
    setDirty(true);
  }, [commit]);

  /**
   * Resize the canvas AND re-fit every element proportionally, as one undoable
   * step. Pass { refit: false } to only change the canvas dimensions.
   */
  const resizeCanvas = useCallback(
    (width, height, { refit = true } = {}) => {
      if (!width || !height) return;
      commit();
      const ow = canvas.width || width;
      const oh = canvas.height || height;
      const sx = width / ow;
      const sy = height / oh;
      if (refit && (sx !== 1 || sy !== 1)) {
        const uni = Math.sqrt(sx * sy) || 1;
        setElementsState((prev) =>
          prev.map((el) => refitElement(el, sx, sy, uni)),
        );
      }
      // Force a white background so any margin left when aspect-preserved images
      // no longer cover the new canvas shows white (not the old background).
      setCanvasState((prev) => ({ ...prev, width, height, background: "#ffffff" }));
      setDirty(true);
    },
    [commit, canvas.width, canvas.height],
  );

  const markSaved = useCallback(() => setDirty(false), []);

  // ── Selection ────────────────────────────────────────────────────────
  /** Replace the selection. `null` clears it — the old single-select signature. */
  const selectElement = useCallback((id) => {
    setSelectedIds(id == null ? [] : [id]);
  }, []);

  const setSelection = useCallback((ids) => {
    setSelectedIds(Array.isArray(ids) ? [...new Set(ids)] : []);
  }, []);

  /** Shift-click: add the element to the selection, or drop it if it's in. */
  const toggleSelection = useCallback((id) => {
    if (id == null) return;
    setSelectedIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }, []);

  // Hidden and locked elements stay out: selecting what you can't see or move
  // only makes the next action surprising.
  const selectAll = useCallback(() => {
    setSelectedIds(
      elements.filter((el) => !el.hidden && !el.locked).map((el) => el.id),
    );
  }, [elements]);

  // ── Grouping ─────────────────────────────────────────────────────────
  /**
   * Fold two or more elements into a group, in place of the FRONT-MOST member —
   * so a group lands in the stack where its contents already were rather than
   * jumping to the top of the design.
   *
   * Members keep their relative stacking order inside the group. Locked members
   * are skipped, which can leave fewer than two to group; that's a no-op.
   */
  const groupElements = useCallback((ids) => {
    const wanted = new Set(ids || []);
    const members = elements.filter((el) => wanted.has(el.id) && !el.locked);
    if (members.length < 2) return;

    const memberIds = new Set(members.map((el) => el.id));
    const frontIndex = elements.reduce(
      (acc, el, i) => (memberIds.has(el.id) ? i : acc),
      -1,
    );
    const group = makeGroup(members, nextElementId());

    commit();
    setElementsState((prev) => {
      const rest = prev.filter((el) => !memberIds.has(el.id));
      // How many of the elements ahead of the front-most member survived tells
      // us where that member sat in the *remaining* array.
      const insertAt = prev
        .slice(0, frontIndex)
        .filter((el) => !memberIds.has(el.id)).length;
      rest.splice(insertAt, 0, group);
      return rest;
    });
    setSelectedIds([group.id]);
    setDirty(true);
  }, [commit, elements]);

  /** Unfold a group back into its members, at the group's current position. */
  const ungroupElement = useCallback((id) => {
    const group = elements.find((el) => el.id === id);
    if (!isGroup(group) || group.locked) return;
    const restored = absoluteChildren(group);
    if (!restored.length) return;

    commit();
    setElementsState((prev) => {
      const idx = prev.findIndex((el) => el.id === id);
      if (idx === -1) return prev;
      const arr = [...prev];
      // Spliced back in at the group's own index, so the members return to the
      // depth the group occupied instead of on top of everything.
      arr.splice(idx, 1, ...restored);
      return arr;
    });
    setSelectedIds(restored.map((el) => el.id));
    setDirty(true);
  }, [commit, elements]);

  const selectedElements = useMemo(() => {
    const wanted = new Set(selectedIds);
    // Element order, not click order: the group / align / layer actions all read
    // better when the selection walks the stack the way the design does.
    return elements.filter((el) => wanted.has(el.id));
  }, [elements, selectedIds]);

  // The contextual panels are written against ONE element — the first of the
  // selection is the one their controls apply to.
  const selectedElement = selectedElements[0] || null;
  const selectedId = selectedElement?.id ?? null;

  return {
    // state
    canvas,
    elements,
    selectedId,
    selectedIds,
    selectedElement,
    selectedElements,
    dirty,
    replaceToken,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    // selection
    selectElement,
    setSelection,
    toggleSelection,
    selectAll,
    // mutations
    updateElement,
    updateElements,
    addElement,
    removeElement,
    removeElements,
    duplicateElement,
    duplicateElements,
    groupElements,
    ungroupElement,
    moveLayer,
    setBackground,
    setCanvasSize,
    resizeCanvas,
    replaceDesign,
    // history
    undo,
    redo,
    commit,
    // persistence helpers
    markSaved,
    toDesign: () => ({ canvas, elements }),
  };
}
