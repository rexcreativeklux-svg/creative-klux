"use client";

/**
 * useProductHistory — loads (and lets you refresh / delete from) the generation
 * history for one Product Studio tool. Shared by the API grid modals (Virtual
 * Model, Product Staging, Ghost Mannequin), which display history in place of a
 * session-only results list: after a successful generate the modal calls
 * `refresh()` and the new item appears here (newest first, straight from the
 * backend).
 *
 * History requires auth (Bearer token), so pass `enabled` = whether the user is
 * logged in; when disabled it stays empty and never hits the network.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getProductHistory,
  deleteProductHistoryItem,
} from "@/(lib)/product-studio-api";

/**
 * @param {string} tool Backend tool enum (e.g. "virtual_model").
 * @param {object} [opts]
 * @param {boolean} [opts.enabled=true] Only fetch when true (e.g. logged in).
 * @returns {{
 *   items: Array,
 *   loading: boolean,
 *   error: unknown,
 *   removingId: (string|number|null),
 *   refresh: () => Promise<void>,
 *   remove: (id: string|number) => Promise<void>,
 * }}
 */
export default function useProductHistory(tool, { enabled = true } = {}) {
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
      const list = await getProductHistory(tool);
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
        await deleteProductHistoryItem(id);
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
