"use client";

/**
 * useProductHistory — loads (and lets you refresh / delete from) the generation
 * history for one Product Studio tool. Shared by the API grid modals (Virtual
 * Model, Product Staging, Ghost Mannequin, the prompt tools and Product Video),
 * which display history in place of a session-only results list: after a
 * successful generate the modal calls `refresh()` and the new item appears here
 * (newest first, straight from the backend).
 *
 * ⚠️ IT ALSO OWNS RUNS THAT ARE STILL GOING. A generation row is written when
 * the request arrives and filled in when the provider answers, and the backend
 * finishes the work whether or not anyone is still watching. Those come back as
 * `pending`, which is what lets a tool show a wait it never started: reopen
 * Product Video after wandering off mid-render and the loading tile is there
 * again — and turns into the result when it lands.
 *
 * So there are two lists, and mixing them would put a tile with no picture in a
 * grid of pictures:
 *
 *   items    finished results — what the grid renders
 *   pending  runs still in flight — what the loading tile is drawn from
 *
 * While `pending` is non-empty this polls itself on the shared escalating
 * schedule (see pollSchedule) and stops as soon as it empties.
 *
 * History requires auth (Bearer token), so pass `enabled` = whether the user is
 * logged in; when disabled it stays empty and never hits the network.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getProductHistory,
  deleteProductHistoryItem,
} from "@/(lib)/product-studio-api";
// The cadence and staleness cutoff are deliberately the SAME ones Magic Studio
// polls on — both studios watch the same backend's generations, and two
// schedules that drifted apart would mean the identical wait behaves differently
// depending on which page it was started from.
import {
  STALE_AFTER_MS,
  elapsedSince,
  nextPollDelay,
} from "@/app/(components)/magic-studio/pollSchedule";

/**
 * @param {string} tool Backend tool enum (e.g. "virtual_model").
 * @param {object} [opts]
 * @param {boolean} [opts.enabled=true] Only fetch when true (e.g. logged in).
 * @returns {{
 *   items: Array,
 *   pending: Array,
 *   loading: boolean,
 *   error: unknown,
 *   removingId: (string|number|null),
 *   refresh: (opts?: {quiet?: boolean}) => Promise<void>,
 *   remove: (id: string|number) => Promise<void>,
 * }}
 */
export default function useProductHistory(tool, { enabled = true } = {}) {
  // Everything the server returned, finished and unfinished alike. The two
  // public lists are derived from this so a delete only has to touch one place.
  const [records, setRecords] = useState([]);
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

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.quiet] Don't raise `loading`. ⚠️ USED BY THE POLL
   *   BELOW, and not an optimisation: it re-fetches every few seconds while a
   *   run is in flight, and flagging each one as "loading" would blink the
   *   grid's spinner and empty state for the whole wait.
   */
  const refresh = useCallback(
    async ({ quiet = false } = {}) => {
      if (!enabled || !tool) {
        setRecords([]);
        setLoading(false);
        return;
      }
      const token = ++fetchTokenRef.current;
      if (!quiet) setLoading(true);
      setError(null);
      try {
        const list = await getProductHistory(tool);
        if (token !== fetchTokenRef.current || !mountedRef.current) return;
        setRecords(Array.isArray(list) ? list : []);
      } catch (err) {
        if (token !== fetchTokenRef.current || !mountedRef.current) return;
        // A failed load is treated as "no history" for display; keep the error so
        // callers can distinguish if needed.
        setError(err);
        setRecords([]);
      } finally {
        if (token === fetchTokenRef.current && mountedRef.current && !quiet) {
          setLoading(false);
        }
      }
    },
    [tool, enabled],
  );

  // Initial load + reload whenever the tool / enabled flag changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const items = useMemo(
    () => records.filter((record) => !record.pending),
    [records],
  );

  /**
   * Runs still in flight — and recent enough to still be believed.
   *
   * ⚠️ THE AGE CHECK IS WHAT STOPS A DEAD JOB HAUNTING THE TOOL. A backend that
   * crashes mid-run leaves a row stuck on "processing" forever; without a cutoff
   * every visit would open on a loading tile for a generation that is never
   * coming, and the poll below would never stop.
   */
  const pending = useMemo(
    () =>
      records.filter(
        (record) =>
          record.pending &&
          elapsedSince(record.startedAt || record.createdAt) < STALE_AFTER_MS,
      ),
    [records],
  );

  // ── Polling, while anything is still running ───────────────────────────────
  // Keyed on WHICH runs are pending rather than on the array, so an unchanged
  // set doesn't tear down and restart the timer on every refresh.
  const pendingKey = pending.map((record) => record.id).join(",");
  const oldestStartedAt = pending.reduce((oldest, record) => {
    const started = Date.parse(record.startedAt || record.createdAt || "");
    if (!Number.isFinite(started)) return oldest;
    return oldest === 0 ? started : Math.min(oldest, started);
  }, 0);

  useEffect(() => {
    if (!enabled || !tool || !pendingKey) return undefined;

    console.log(`⏳ [product-studio] ${tool}: watching ${pendingKey}`);
    let cancelled = false;
    let timer = null;

    const beat = () => {
      // Paced off how long the OLDEST run has been going, not off when this
      // modal opened — coming back to a render that started four minutes ago
      // should resume at its unhurried cadence, not hammer it as if it were new.
      const elapsed =
        oldestStartedAt > 0 ? Date.now() - oldestStartedAt : Infinity;
      timer = setTimeout(async () => {
        if (cancelled) return;
        await refresh({ quiet: true });
        if (!cancelled) beat();
      }, nextPollDelay(elapsed));
    };
    beat();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, tool, pendingKey, oldestStartedAt, refresh]);

  /**
   * Delete one item early. Optimistically drops it from the list; on failure the
   * api layer toasts and we re-fetch to restore the true state.
   */
  const remove = useCallback(
    async (id) => {
      if (id == null || removingId != null) return;
      setRemovingId(id);
      const prev = records;
      setRecords((list) => list.filter((it) => it.id !== id));
      try {
        await deleteProductHistoryItem(id);
        toast.success("Deleted");
      } catch {
        // api layer already toasted a friendly error — restore then re-sync.
        if (mountedRef.current) setRecords(prev);
        refresh();
      } finally {
        if (mountedRef.current) setRemovingId(null);
      }
    },
    [records, removingId, refresh],
  );

  return { items, pending, loading, error, removingId, refresh, remove };
}
