"use client";

/**
 * useBulkSelection — which tiles of a grid are ticked, and the keyboard around
 * it: Shift-click takes a range, Ctrl/⌘+A takes everything, Esc clears.
 *
 * Holds ids rather than items, and reads them against the list it is handed on
 * every render, so a tile that leaves the grid (deleted, or the canvas switched)
 * leaves the selection with it. A count that includes something no longer on
 * screen would make Delete promise the wrong number.
 *
 * @param {Array<{id: string|number}>} items The tiles, in the order they're drawn.
 * @param {object} [opts]
 * @param {boolean} [opts.enabled=true] False drops the selection and the keys.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EMPTY = new Set();

export default function useBulkSelection(items, { enabled = true } = {}) {
  const [selectedIds, setSelectedIds] = useState(EMPTY);
  // The last tile toggled — where a Shift-click's range starts from.
  const anchorRef = useRef(null);

  // ⚠️ DURING RENDER, NOT IN AN EFFECT, so no frame paints a count that's wrong.
  const liveIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
  const hasStale = [...selectedIds].some(
    (id) => !enabled || !liveIds.has(id),
  );
  if (hasStale) {
    setSelectedIds(
      enabled
        ? new Set([...selectedIds].filter((id) => liveIds.has(id)))
        : EMPTY,
    );
  }

  const toggle = useCallback(
    (id, { range = false } = {}) => {
      const from = items.findIndex((item) => item.id === anchorRef.current);
      const to = items.findIndex((item) => item.id === id);
      setSelectedIds((current) => {
        const next = new Set(current);
        if (range && from >= 0 && to >= 0) {
          items
            .slice(Math.min(from, to), Math.max(from, to) + 1)
            .forEach((item) => next.add(item.id));
        } else if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      anchorRef.current = id;
    },
    [items],
  );

  const selectAll = useCallback(
    () => setSelectedIds(new Set(items.map((item) => item.id))),
    [items],
  );
  const clear = useCallback(() => {
    setSelectedIds(EMPTY);
    anchorRef.current = null;
  }, []);

  const count = selectedIds.size;

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (event) => {
      // An open dialog owns the keyboard: Esc on the delete confirmation means
      // "keep them", and shouldn't also throw away what was ticked.
      if (document.querySelector('[role="dialog"]')) return;

      if (event.key === "Escape" && count > 0) {
        clear();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        const active = document.activeElement;
        // Ctrl+A in the composer still means "all of what I typed".
        if (
          active?.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(active?.tagName)
        ) {
          return;
        }
        event.preventDefault();
        selectAll();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled, count, clear, selectAll]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  return {
    selectedIds,
    selectedItems,
    count,
    // Once anything is ticked, a click anywhere on a tile toggles it.
    picking: count > 0,
    allSelected: items.length > 0 && count === items.length,
    isSelected: (id) => selectedIds.has(id),
    toggle,
    selectAll,
    clear,
  };
}
