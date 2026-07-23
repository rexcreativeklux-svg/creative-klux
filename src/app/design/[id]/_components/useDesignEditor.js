"use client";

import { useCallback, useMemo, useRef, useState } from "react";

/**
 * useDesignEditor — the single source of truth for the design editor.
 *
 * A "design" is `{ canvas, elements }` where:
 *   canvas   = { width, height, background }
 *   elements = [{ id, type: 'text'|'shape'|'image', x, y, width, height, rotation, opacity, ...typeProps }]
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
  return next;
}

/** Normalize an incoming design into editor shape (assign ids, defaults). */
export function normalizeForEditor(design) {
  const canvas = {
    width: design?.canvas?.width || DEFAULT_CANVAS.width,
    height: design?.canvas?.height || DEFAULT_CANVAS.height,
    background: design?.canvas?.background || DEFAULT_CANVAS.background,
  };

  const elements = (design?.elements || []).map((el) => ({
    id: el.id || nextElementId(),
    type: el.type || "text",
    x: Number(el.x) || 0,
    y: Number(el.y) || 0,
    width: Number(el.width) || 120,
    height: Number(el.height) || 40,
    rotation: Number(el.rotation) || 0,
    opacity: el.opacity ?? 1,
    ...el,
  }));

  return { canvas, elements };
}

export default function useDesignEditor(initialDesign) {
  const seed = useMemo(() => normalizeForEditor(initialDesign), [initialDesign]);

  const [canvas, setCanvasState] = useState(seed.canvas);
  const [elements, setElementsState] = useState(seed.elements);
  const [selectedId, setSelectedId] = useState(null);
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
      prev.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    );
    setDirty(true);
  }, [commit]);

  const addElement = useCallback((el) => {
    commit();
    const withId = { id: nextElementId(), rotation: 0, opacity: 1, ...el };
    setElementsState((prev) => [...prev, withId]);
    setSelectedId(withId.id);
    setDirty(true);
    return withId.id;
  }, [commit]);

  const removeElement = useCallback((id) => {
    commit();
    setElementsState((prev) => prev.filter((el) => el.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    setDirty(true);
  }, [commit]);

  const duplicateElement = useCallback((id) => {
    commit();
    setElementsState((prev) => {
      const src = prev.find((el) => el.id === id);
      if (!src) return prev;
      const copy = { ...src, id: nextElementId(), x: src.x + 24, y: src.y + 24 };
      return [...prev, copy];
    });
    setDirty(true);
  }, [commit]);

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
      setSelectedId(null);
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

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedId) || null,
    [elements, selectedId],
  );

  return {
    // state
    canvas,
    elements,
    selectedId,
    selectedElement,
    dirty,
    replaceToken,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    // selection
    selectElement: setSelectedId,
    // mutations
    updateElement,
    addElement,
    removeElement,
    duplicateElement,
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
