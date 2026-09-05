"use client";

import { useCallback, useState } from "react";

/**
 * useLayerReorder — drag-to-restack for the layers list.
 *
 * The list is rendered front-first (the top of the stack at the top of the
 * list) while the elements array is back-first, so the two run in opposite
 * directions. Everything here therefore works in element IDS and looks indices
 * up in the real array — never in the rendered order — which is what keeps the
 * inversion from mattering. Reordering by rendered index instead would drop a
 * layer at the mirror image of where it was released, and it would look right
 * for a two-element page.
 *
 * @param {Array} elements the full elements array, back-first
 * @param {(next: Array) => void} onReorder
 * @returns {{ draggingId, dropTargetId, handlersFor }}
 */
export default function useLayerReorder(elements, onReorder) {
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const finish = useCallback(() => {
    setDraggingId(null);
    setDropTargetId(null);
  }, []);

  const drop = useCallback(
    (targetId) => {
      if (!draggingId || draggingId === targetId) return finish();

      const from = elements.findIndex((el) => el.id === draggingId);
      const to = elements.findIndex((el) => el.id === targetId);
      if (from === -1 || to === -1) return finish();

      // Array position IS the stacking order, so moving the item is the whole
      // operation — there are no zIndex numbers to renumber afterwards.
      const next = [...elements];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onReorder(next);
      finish();
    },
    [draggingId, elements, onReorder, finish],
  );

  const handlersFor = useCallback(
    (el) => ({
      onDragStart: (e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        // Firefox refuses to start a drag with nothing on the transfer.
        e.dataTransfer.setData("text/plain", el.id);
        setDraggingId(el.id);
      },
      onDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggingId || draggingId === el.id) return;
        setDropTargetId(el.id);
      },
      onDragLeave: (e) => {
        // Moving onto a CHILD of this row still counts as being on the row;
        // clearing the highlight there makes it flicker under the pointer.
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setDropTargetId((cur) => (cur === el.id ? null : cur));
      },
      onDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        drop(el.id);
      },
      onDragEnd: finish,
    }),
    [draggingId, drop, finish],
  );

  return { draggingId, dropTargetId, handlersFor };
}
