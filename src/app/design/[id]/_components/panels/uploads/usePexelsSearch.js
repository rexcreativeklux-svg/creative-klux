"use client";

import { useEffect, useRef, useState } from "react";

// Pexels serves photos and videos only — there is no stock audio or documents,
// so those tabs have no stock source and report nothing found.
const PEXELS_KIND = { image: "photos", video: "videos" };

/** Does the stock library cover this media type at all? */
export const stockSupports = (typeId) => Boolean(PEXELS_KIND[typeId]);

const normalizePhotos = (photos = []) =>
  photos.map((p) => ({
    id: p.id,
    thumb: p.src?.medium || p.src?.small || p.src?.original,
    // large2x is what gets placed — medium is thumbnail-resolution and would
    // look soft once scaled up on the canvas.
    full: p.src?.large2x || p.src?.large || p.src?.original,
    alt: p.alt || "Pexels photo",
  }));

const normalizeVideos = (videos = []) =>
  videos.map((v) => ({
    id: v.id,
    thumb: v.image,
    full: v.video_files?.[0]?.link,
    alt: v.user?.name ? `Video by ${v.user.name}` : "Pexels video",
  }));

/**
 * usePexelsSearch — debounced stock search against /api/pexels.
 *
 * Returns { results, loading, error, supported }. `supported` is false for audio
 * and documents, which the caller renders as "nothing found" rather than as a
 * failure — there's nothing to search, it isn't broken.
 *
 * State is tagged with the query it belongs to, so "no query" and "results are
 * for an older query" are derived during render rather than cleared from the
 * effect. That keeps the debounce window showing a spinner instead of the
 * previous search's results.
 */
export default function usePexelsSearch({ query, type }) {
  const [state, setState] = useState({
    key: "",
    results: [],
    loading: false,
    error: null,
  });

  // Guards against a slow earlier request landing after a newer one and
  // overwriting its results.
  const reqId = useRef(0);

  const kind = PEXELS_KIND[type];
  const q = (query || "").trim();
  const active = Boolean(q && kind);
  const key = active ? `${kind}:${q}` : "";

  useEffect(() => {
    if (!active) return;

    const id = ++reqId.current;

    // Debounced so typing doesn't fire a request per keystroke. Every setState
    // below runs from this callback, never synchronously during the effect.
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/pexels?query=${encodeURIComponent(q)}&type=${kind}&per_page=30`,
        );
        if (!res.ok) throw new Error("Stock search failed");
        const data = await res.json();
        if (id !== reqId.current) return;
        setState({
          key,
          results:
            kind === "videos"
              ? normalizeVideos(data.videos)
              : normalizePhotos(data.photos),
          loading: false,
          error: null,
        });
      } catch (err) {
        if (id !== reqId.current) return;
        setState({
          key,
          results: [],
          loading: false,
          error: err.message || "Stock search failed",
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [q, kind, active, key]);

  if (!active) {
    return { results: [], loading: false, error: null, supported: Boolean(kind) };
  }

  // Debouncing, or state still belongs to the previous query.
  if (state.key !== key) {
    return { results: [], loading: true, error: null, supported: true };
  }

  // Returned field by field, not spread: `state.key` is internal bookkeeping,
  // and `key` is reserved by React the moment a caller spreads this onto JSX.
  return {
    results: state.results,
    loading: state.loading,
    error: state.error,
    supported: true,
  };
}
