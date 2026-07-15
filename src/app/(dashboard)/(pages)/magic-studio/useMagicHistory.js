"use client";

/**
 * useMagicHistory — loads (and lets you refresh / delete from) the generation
 * history for one Magic Studio BACKEND tool. Parallel of the Product Studio
 * `useProductHistory`: the modal shows history in place of a session-only
 * results list, so after a successful generate it calls `refresh()` and the new
 * item appears here (newest first, straight from the backend).
 *
 * Only backend tools have server-side history — the on-device tools
 * (audio_to_text, text_to_audio) never persist anything, so the modal passes a
 * null tool / `enabled: false` for them and this hook stays empty and offline.
 * History also requires auth (Bearer token), so pass `enabled` = logged in.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getMagicHistory,
  deleteMagicHistoryItem,
} from "@/(lib)/magic-studio-api";

/**
 * @param {string|null} tool Backend tool enum (e.g. "text_to_image"), or null.
 * @param {object} [opts]
 * @param {boolean} [opts.enabled=true] Only fetch when true (logged in + backend tool).
 * @returns {{
 *   items: Array,
 *   loading: boolean,
 *   error: unknown,
 *   removingId: (string|number|null),
 *   refresh: () => Promise<void>,
 *   remove: (id: string|number) => Promise<void>,
 * }}
 */
export default function useMagicHistory(tool, { enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Stale-guard: only the latest fetch may commit its result.
  const fetchTokenRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled || !tool) {
      setItems([]);
      setLoading(false);
      return;
    }
    const token = ++fetchTokenRef.current;
    setLoading(true);
    setError(null);
    try {
      const list = await getMagicHistory(tool);
      if (token !== fetchTokenRef.current || !mountedRef.current) return;
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      if (token !== fetchTokenRef.current || !mountedRef.current) return;
      // A failed load is treated as "no history" for display; keep the error so
      // callers can distinguish if needed.
      setError(err);
      setItems([]);
    } finally {
      if (token === fetchTokenRef.current && mountedRef.current) {
        setLoading(false);
      }
    }
  }, [tool, enabled]);

  // Initial load + reload whenever the tool / enabled flag changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Delete one item early. Optimistically drops it from the list; on failure the
   * api layer toasts and we re-fetch to restore the true state.
   */
  const remove = useCallback(
    async (id) => {
      if (id == null || removingId != null) return;
      setRemovingId(id);
      const prev = items;
      setItems((list) => list.filter((it) => it.id !== id));
      try {
        await deleteMagicHistoryItem(id);
        toast.success("Deleted");
      } catch {
        // api layer already toasted a friendly error — restore then re-sync.
        if (mountedRef.current) setItems(prev);
        refresh();
      } finally {
        if (mountedRef.current) setRemovingId(null);
      }
    },
    [items, removingId, refresh],
  );

  return { items, loading, error, removingId, refresh, remove };
}
