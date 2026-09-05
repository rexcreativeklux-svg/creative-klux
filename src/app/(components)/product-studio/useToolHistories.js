"use client";

/**
 * useToolHistories — every Product Studio tool's past work, in one pass, for the
 * landing page's history shelves.
 *
 * ⚠️ NOT A REPLACEMENT FOR {@link useProductHistory}, and the difference is the
 * surface. That hook watches ONE tool for a modal that is actively generating:
 * it splits finished results from runs still in flight and polls while anything
 * is pending, because a tile has to turn into a result while you are looking at
 * it. This page generates nothing. It is a shelf of what you have already made,
 * so it fetches once and stops — nine tools each polling on their own escalating
 * schedule would be nine timers and a request every few seconds for a page whose
 * content cannot change while you sit on it.
 *
 * ⚠️ ONE REQUEST PER TOOL, IN PARALLEL, BECAUSE THE API HAS NO OTHER SHAPE.
 * `POST /product-studio/history` takes a `tool` and answers for that tool alone,
 * so "everything I have made" is N requests however it is asked. They go out
 * together rather than in sequence, and one failing is not allowed to take the
 * others with it — a tool that errors simply has no row (see allSettled below).
 *
 * ⚠️ PENDING RUNS ARE DROPPED HERE, unlike in the modal hook. A row of finished
 * pictures is not the place to discover that something is still rendering: the
 * tile would have no image, and this page has no way to show progress or to tell
 * you when it lands. Open the tool to watch a run.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  deleteProductHistoryItem,
  getProductHistory,
} from "@/(lib)/product-studio-api";

/**
 * @param {Array<{id: string, tool: string}>} tools Which tools to load — the
 *   page passes HISTORY_TOOLS.
 * @param {object} [opts]
 * @param {boolean} [opts.enabled=true] Only fetch when true (i.e. logged in);
 *   history is an authenticated endpoint and answers 401 to a stranger.
 * @returns {{
 *   byTool: Record<string, Array>,
 *   loading: boolean,
 *   isEmpty: boolean,
 *   refresh: () => Promise<void>,
 *   remove: (tool: string, id: string|number) => Promise<void>,
 * }}
 */
/** The shelves for a logged-out visitor. A module constant so the identity is
 *  stable — a fresh `{}` per render would re-run every consumer's memo. */
const NOTHING = {};

export default function useToolHistories(tools, { enabled = true } = {}) {
  const [byTool, setByTool] = useState({});
  /**
   * Whether a load has finished — and the reason `loading` below is DERIVED from
   * it rather than being state of its own.
   *
   * ⚠️ NO setState RUNS SYNCHRONOUSLY IN THIS HOOK'S EFFECT PATH. Raising a
   * `loading` flag at the top of the fetch is the obvious way to write this, and
   * it is exactly what `react-hooks/set-state-in-effect` refuses: the effect
   * calls refresh, refresh sets state before its first await, and the render it
   * schedules cascades straight out of the one that mounted us. Everything here
   * is written after the network answers instead.
   */
  const [loaded, setLoaded] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Only the newest load may commit — a refresh fired while one is in flight
  // must not be overwritten by the slower answer it raced.
  const fetchTokenRef = useRef(0);

  // The dependency is the LIST OF ENUMS, not the array. `tools` is a module
  // constant today, but keying on identity would make this hook quietly
  // re-fetch nine times a second for any caller that built its list inline.
  const toolKey = useMemo(
    () => (tools || []).map((t) => t.tool).join(","),
    [tools],
  );

  const refresh = useCallback(async () => {
    const list = toolKey ? toolKey.split(",") : [];
    // Nothing to ask for. Whatever is already held stops being SHOWN either way
    // — see the derived `visible` below — so there is no state to clear here,
    // which is also what keeps this path free of a synchronous setState.
    if (!enabled || list.length === 0) return;

    const token = ++fetchTokenRef.current;

    // allSettled, not all: one tool answering 500 must not blank the other
    // eight. A rejected entry becomes an empty list, which renders as no row —
    // the same as a tool you have never used, which is the honest thing to show
    // when we genuinely don't know what is in there.
    const results = await Promise.allSettled(
      list.map((tool) => getProductHistory(tool)),
    );
    if (token !== fetchTokenRef.current || !mountedRef.current) return;

    const next = {};
    results.forEach((result, i) => {
      const items =
        result.status === "fulfilled" && Array.isArray(result.value)
          ? result.value.filter((item) => !item.pending && item.url)
          : [];
      next[list[i]] = items;
    });

    const total = Object.values(next).reduce((n, items) => n + items.length, 0);
    console.log(
      `🗂️ [product-studio] history loaded — ${total} item(s) across ${list.length} tool(s)`,
    );

    setByTool(next);
    setLoaded(true);
  }, [toolKey, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Delete one item. Optimistic — it disappears from its row immediately, and
   * a failure puts it back (the api layer has already said why).
   */
  const remove = useCallback(
    async (tool, id) => {
      if (!tool || id == null) return;
      const previous = byTool[tool] || [];
      setByTool((prev) => ({
        ...prev,
        [tool]: (prev[tool] || []).filter((item) => item.id !== id),
      }));
      try {
        await deleteProductHistoryItem(id);
        toast.success("Deleted");
      } catch {
        if (mountedRef.current) {
          setByTool((prev) => ({ ...prev, [tool]: previous }));
        }
      }
    },
    [byTool],
  );

  // A logged-out visitor shows nothing without anything having to be cleared —
  // and logging back in reveals what was already fetched rather than refetching.
  const visible = enabled ? byTool : NOTHING;

  // "Nothing anywhere" — the whole section hides on this, rather than each row
  // hiding itself and leaving a lone heading behind.
  //
  // ⚠️ TRUE WHILE THE FIRST LOAD IS STILL RUNNING, which is what stops the
  // section flashing an empty "Your work" heading on every page load. It turns
  // false only when something has actually come back.
  const isEmpty = useMemo(
    () => Object.values(visible).every((items) => items.length === 0),
    [visible],
  );

  return { byTool: visible, loading: enabled && !loaded, isEmpty, refresh, remove };
}
