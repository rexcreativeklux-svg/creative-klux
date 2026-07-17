"use client";

import { useCallback, useState } from "react";

/**
 * usePanelStack — drill-down navigation for a sidebar panel. Views are pushed
 * as you go deeper (categories → Shapes → Square stars) and `back` pops one
 * level, so every view returns to wherever it was opened from rather than
 * jumping to a hardcoded parent.
 *
 * Returns { view, push, back, depth } — `view` is the deepest view, or null at
 * the root.
 */
export default function usePanelStack() {
  const [stack, setStack] = useState([]);

  const push = useCallback((view) => setStack((s) => [...s, view]), []);
  const back = useCallback(() => setStack((s) => s.slice(0, -1)), []);

  return {
    view: stack[stack.length - 1] || null,
    push,
    back,
    depth: stack.length,
  };
}
