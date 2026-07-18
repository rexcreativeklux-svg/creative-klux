"use client";

// components/gallery/useGalleryMedia.js
// ─────────────────────────────────────────────────────────────────────────────
// The gallery's data + tab brain, shared by the gallery page, the editor's
// Uploads panel and the MediaPickerModal.
//
// Pagination model — the backend paginates PER media type
// (GET /gallery?type=image&per_page=30&page=N, Laravel-standard `meta`). This
// hook owns that pagination:
//   • It keeps each visited tab's accumulated items + page cursor, so switching
//     tabs never refetches what's already loaded and cross-tab selections still
//     resolve (see `allItems`).
//   • `loadMore()` fetches the next page for the active tab and appends it — the
//     UI drives this from an infinite-scroll sentinel (see useInfiniteScroll).
//   • Per-tab `counts` come from each type's `meta.total`, fetched cheaply
//     up-front so every tab badge is accurate from the first render.
//
// Callers pass `allowedTypes` to restrict which tabs show (default: all four).
// `enabled` gates all network activity so a closed modal / hidden tab never
// hits the network.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { resolveAllowedTypes } from "./mediaTypes";

/** How many items to request per page — matches the backend default. */
const PER_PAGE = 30;

/** A never-yet-loaded tab. */
const EMPTY_ENTRY = { items: [], page: 0, lastPage: 1, total: 0, status: "idle" };

/**
 * @param {object} [opts]
 * @param {string[]} [opts.allowedTypes]  Subset of ["image","video","audio","document"].
 * @param {boolean} [opts.enabled]        Auto-fetch when a token exists (default true).
 * @returns {{
 *   tabs: typeof import("./mediaTypes").MEDIA_TYPES,
 *   activeType: string,
 *   setActiveType: (id: string) => void,
 *   items: object[],
 *   allItems: object[],
 *   counts: Record<string, number>,
 *   loading: boolean,
 *   loadingMore: boolean,
 *   hasMore: boolean,
 *   loadMore: () => void,
 *   refresh: () => Promise<void>,
 * }}
 */
export default function useGalleryMedia({ allowedTypes, enabled = true } = {}) {
  const { token, fetchGalleryPage } = useAuth();

  // `allowedTypes` is often a fresh array literal each render (e.g. ["image"]),
  // so key derived state on its stable string form to avoid churn / refetch loops.
  const allowedKey = Array.isArray(allowedTypes) ? allowedTypes.join(",") : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tabs = useMemo(() => resolveAllowedTypes(allowedTypes), [allowedKey]);

  const [rawActiveType, setActiveType] = useState(() => tabs[0]?.id || "image");

  // If the chosen tab is no longer in the allowed set (allowedTypes changed),
  // fall back to the first allowed tab — derived during render so we never call
  // setState from an effect.
  const activeType = tabs.some((t) => t.id === rawActiveType)
    ? rawActiveType
    : tabs[0]?.id || "image";

  // Per-type pagination state, keyed by type id → EMPTY_ENTRY-shaped record.
  const [byType, setByType] = useState({});
  const [counts, setCounts] = useState({});

  // Mirror of `byType` for reading current state inside callbacks without stale
  // closures, plus an in-flight guard keyed by `type:page` so a burst of
  // scroll events / re-renders can't fire the same page fetch twice.
  const byTypeRef = useRef(byType);
  byTypeRef.current = byType;
  const inFlight = useRef({});

  // ── Fetch a single page for a type and merge it in ─────────────────────────
  const loadPage = useCallback(
    async (type, page) => {
      const key = `${type}:${page}`;
      if (inFlight.current[key]) return;
      inFlight.current[key] = true;

      // Flag this type as loading (drives the initial spinner / load-more skeleton).
      setByType((prev) => {
        const cur = prev[type] || EMPTY_ENTRY;
        return { ...prev, [type]: { ...cur, status: "loading" } };
      });

      const { items, meta } = await fetchGalleryPage({
        type,
        page,
        perPage: PER_PAGE,
      });

      setByType((prev) => {
        const cur = prev[type] || EMPTY_ENTRY;
        // Page 1 replaces (a refresh); later pages append. De-dupe by id in case
        // a new upload shifts items across the page boundary.
        const base = page === 1 ? [] : cur.items;
        const seen = new Set(base.map((it) => it.id));
        const merged = [...base, ...items.filter((it) => !seen.has(it.id))];

        return {
          ...prev,
          [type]: {
            items: merged,
            page: meta?.current_page ?? page,
            // Without meta, infer there's more only if we got a full page.
            lastPage:
              meta?.last_page ?? (items.length < PER_PAGE ? page : page + 1),
            total: meta?.total ?? merged.length,
            status: "loaded",
          },
        };
      });

      if (meta?.total != null) {
        setCounts((c) => ({ ...c, [type]: meta.total }));
      }

      inFlight.current[key] = false;
    },
    [fetchGalleryPage],
  );

  // ── Per-tab counts (badge totals) ──────────────────────────────────────────
  // One tiny request per allowed type reads `meta.total`, so every tab shows an
  // accurate count from the first render without loading its full contents.
  const refreshCounts = useCallback(async () => {
    if (!token) return;
    const results = await Promise.all(
      tabs.map(async (t) => {
        const { meta } = await fetchGalleryPage({
          type: t.id,
          page: 1,
          perPage: 1,
        });
        return [t.id, meta?.total ?? 0];
      }),
    );
    setCounts(Object.fromEntries(results));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, allowedKey, fetchGalleryPage]);

  // Load the first page of the active tab once enabled + authenticated. Guarded
  // by status so re-renders (byType changes) never refetch a loaded/loading tab.
  useEffect(() => {
    if (!enabled || !token) return;
    const entry = byType[activeType];
    if (!entry || entry.status === "idle") loadPage(activeType, 1);
  }, [enabled, token, activeType, byType, loadPage]);

  // Fetch all tab counts once we're enabled + authenticated.
  useEffect(() => {
    if (enabled && token) refreshCounts();
  }, [enabled, token, refreshCounts]);

  // ── Derived view state for the active tab ──────────────────────────────────
  const active = byType[activeType];
  const items = active?.items || [];
  const hasMore = active ? active.page < active.lastPage : true;
  // Initial load = fetching with nothing shown yet; load-more = fetching with
  // items already on screen (drives the skeleton appended to the grid).
  const loading = !active || (active.status === "loading" && items.length === 0);
  const loadingMore =
    !!active && active.status === "loading" && items.length > 0;

  // Union of every loaded item across all visited tabs — the picker resolves a
  // selected `src` back to its full gallery item against this, so a selection
  // made on one tab survives switching to another.
  const allItems = useMemo(
    () => Object.values(byType).flatMap((e) => e.items),
    [byType],
  );

  const loadMore = useCallback(() => {
    const cur = byTypeRef.current[activeType];
    if (!cur || cur.status === "loading" || cur.page >= cur.lastPage) return;
    loadPage(activeType, cur.page + 1);
  }, [activeType, loadPage]);

  // Reload from scratch — used after an upload/delete changes the library. Clears
  // every tab (so counts + lists re-fetch on next view) and reloads the active
  // tab + counts immediately.
  const refresh = useCallback(async () => {
    inFlight.current = {};
    setByType({});
    await Promise.all([loadPage(activeType, 1), refreshCounts()]);
  }, [activeType, loadPage, refreshCounts]);

  return {
    tabs,
    activeType,
    setActiveType,
    items,
    allItems,
    counts,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  };
}
