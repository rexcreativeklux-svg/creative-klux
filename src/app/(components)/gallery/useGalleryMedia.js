"use client";

// components/gallery/useGalleryMedia.js
// ─────────────────────────────────────────────────────────────────────────────
// The gallery's data + tab brain, shared by the gallery page and the picker.
// Pulls the multi-type gallery (fetchGallery / myGallery) from AuthContext,
// owns the active media-type tab, and hands back the items filtered to that tab
// plus per-type counts. Callers pass `allowedTypes` to restrict which tabs show
// (default: all four). `enabled` gates the auto-fetch so a closed modal doesn't
// hit the network.

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { resolveAllowedTypes, filterMediaByType } from "./mediaTypes";

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
 *   refresh: () => Promise<void> | void,
 * }}
 */
export default function useGalleryMedia({ allowedTypes, enabled = true } = {}) {
  const {
    token,
    myGallery = [],
    myGalleryLoading = false,
    fetchGallery,
  } = useAuth();

  const tabs = useMemo(() => resolveAllowedTypes(allowedTypes), [allowedTypes]);

  const [rawActiveType, setActiveType] = useState(() => tabs[0]?.id || "image");

  // If the chosen tab is no longer in the allowed set (allowedTypes changed),
  // fall back to the first allowed tab — derived during render so we never call
  // setState from an effect.
  const activeType = tabs.some((t) => t.id === rawActiveType)
    ? rawActiveType
    : tabs[0]?.id || "image";

  // Load the gallery once we're enabled and authenticated.
  useEffect(() => {
    if (enabled && token) fetchGallery?.();
  }, [enabled, token, fetchGallery]);

  const items = useMemo(
    () => filterMediaByType(myGallery, activeType),
    [myGallery, activeType],
  );

  const counts = useMemo(() => {
    const c = {};
    for (const t of tabs) c[t.id] = filterMediaByType(myGallery, t.id).length;
    return c;
  }, [myGallery, tabs]);

  return {
    tabs,
    activeType,
    setActiveType,
    items,
    allItems: myGallery,
    counts,
    loading: myGalleryLoading,
    refresh: fetchGallery,
  };
}
