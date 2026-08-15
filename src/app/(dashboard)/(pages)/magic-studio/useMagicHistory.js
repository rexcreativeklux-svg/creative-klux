"use client";

/**
 * useMagicHistory — loads (and lets you refresh / delete from) the generation
 * history for one Magic Studio BACKEND tool. Parallel of the Product Studio
 * `useProductHistory`: surfaces show history in place of a session-only results
 * list, so after a successful generate they call `refresh()` and the new item
 * appears here (newest first, straight from the backend).
 *
 * ⚠️ IT ALSO OWNS RUNS THAT ARE STILL GOING. History contains records the
 * backend hasn't finished — a generation row is written when the request arrives
 * and filled in when the provider answers, and the backend finishes the work
 * whether or not anyone is still watching (verified against the API: a client
 * disconnected 8s in, the record completed 30s later). Those come back as
 * `pending`, which is what lets a tool show a wait it never started: open the
 * page after a reload, or after wandering off mid-generation, and the loading
 * tile is there again — and turns into the result when it lands.
 *
 * So there are two lists, and mixing them would put a tile with no picture in a
 * grid of pictures:
 *
 *   items    finished results, one per generated asset — what the grids render
 *   pending  runs still in flight — what the loading tiles are drawn from
 *
 * While `pending` is non-empty this polls itself on the shared escalating
 * schedule (see pollSchedule) and stops as soon as it empties.
 *
 * Only backend tools have server-side history — the on-device tools
 * (audio_to_text, text_to_audio) never persist anything, so callers pass a null
 * tool / `enabled: false` for them and this hook stays empty and offline.
 * History also requires auth (Bearer token), so pass `enabled` = logged in.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getMagicHistory,
  deleteMagicHistoryItem,
} from "@/(lib)/magic-studio-api";
import {
  STALE_AFTER_MS,
  elapsedSince,
  nextPollDelay,
} from "@/app/(components)/magic-studio/pollSchedule";

/**
 * The generation an item belongs to. Item ids are `<generationId>:<index>`,
 * because one record can produce several assets and each needs its own identity
 * in the grid — but DELETE takes the record.
 *
 * @param {string|number} id
 * @returns {string}
 */
const generationIdOf = (id) => String(id).split(":")[0];

/**
 * @param {string|null} tool Backend tool enum (e.g. "text_to_image"), or null.
 * @param {object} [opts]
 * @param {boolean} [opts.enabled=true] Only fetch when true (logged in + backend tool).
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
export default function useMagicHistory(tool, { enabled = true } = {}) {
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
   *   BELOW, and not an optimisation: this re-fetches every few seconds while a
   *   run is in flight, and flagging each one as "loading" would blink the
   *   History button's spinner and empty-state for the whole wait.
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
        const list = await getMagicHistory(tool);
        if (token !== fetchTokenRef.current || !mountedRef.current) return;
        setRecords(Array.isArray(list) ? list : []);
      } catch (err) {
        if (token !== fetchTokenRef.current || !mountedRef.current) return;
        // A failed load is treated as "no history" for display; keep the error
        // so callers can distinguish if needed.
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
  const pendingKey = pending.map((record) => record.generationId).join(",");
  const oldestStartedAt = pending.reduce((oldest, record) => {
    const started = Date.parse(record.startedAt || record.createdAt || "");
    if (!Number.isFinite(started)) return oldest;
    return oldest === 0 ? started : Math.min(oldest, started);
  }, 0);

  useEffect(() => {
    if (!enabled || !tool || !pendingKey) return undefined;

    console.log(`⏳ [magic-studio] ${tool}: watching ${pendingKey}`);
    let cancelled = false;
    let timer = null;

    const beat = () => {
      // Paced off how long the OLDEST run has been going, not off when this
      // page opened — coming back to a job that started four minutes ago should
      // resume at its unhurried cadence, not hammer it as if it were new.
      const elapsed = oldestStartedAt > 0 ? Date.now() - oldestStartedAt : Infinity;
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
   * Delete one generation early. Optimistically drops it from the list; on
   * failure the api layer toasts and we re-fetch to restore the true state.
   *
   * ⚠️ TAKES AN ITEM ID AND DELETES A RECORD — the two are not the same thing
   * when one generation made four images. All four tiles go at once, because
   * there is one record behind them and the backend has no way to remove a
   * single asset from it.
   */
  const remove = useCallback(
    async (id) => {
      if (id == null || removingId != null) return;
      const generationId = generationIdOf(id);
      setRemovingId(id);
      const prev = records;
      setRecords((list) =>
        list.filter(
          (record) => generationIdOf(record.id) !== generationId,
        ),
      );
      try {
        await deleteMagicHistoryItem(generationId);
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
