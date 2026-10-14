"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import useGalleryMedia from "@/app/(components)/gallery/useGalleryMedia";
import { getMagicHistory } from "@/(lib)/magic-studio-api";
import { getProductHistory, TOOL_ENUM } from "@/(lib)/product-studio-api";
import { normalizeVideos } from "../panels/uploads/usePexelsSearch";

/**
 * useVideoSources — every place a video can be picked FROM, gathered for the
 * Replace panel and shaped alike: `{ id, src, thumb, duration, label }`.
 *
 *   uploads   — the gallery's Videos tab (the user's own uploads)
 *   creatives — video layers inside the brand's other designs, and designs
 *               that ARE a video (a saved Magic Design clip)
 *   ai        — Magic Studio and Product Studio video generations
 *   stock     — a few Pexels shelves (Trending, People, …), Canva's sections
 *
 * Each list loads on its own and fails on its own: a backend that's down
 * leaves its section empty rather than taking the panel with it.
 */

const STOCK_SHELVES = [
  { id: "trending", title: "Trending", query: "trending" },
  { id: "people", title: "People", query: "people" },
  { id: "nature", title: "Nature", query: "nature" },
  { id: "business", title: "Business", query: "business office" },
  { id: "abstract", title: "Abstract", query: "abstract background" },
];

const VIDEO_URL = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

// A thumbnail has to be a picture. Some records put the video's own URL in
// that field — those tiles fall back to showing the video paused instead.
const still = (url) => (url && !VIDEO_URL.test(url) ? url : null);

/** Video layers in a saved design, groups included. */
function videosInDesign(raw) {
  let parsed = raw?.canvas;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }
  const found = [];
  const walk = (list) =>
    (list || []).forEach((el) => {
      if (el?.type === "video" && el.src) found.push(el);
      if (el?.type === "group") walk(el.children);
    });
  walk(parsed?.elements);
  const name = raw?.name || "Untitled design";
  const items = found.map((el) => ({
    id: `design-${raw.id}-${el.id || el.src}`,
    src: el.src,
    thumb: still(el.poster) || still(raw.thumbnail),
    duration: el.duration,
    label: name,
  }));
  // A raster creative whose media IS a video.
  const media = raw?.video_url || raw?.image_url;
  if (!items.length && VIDEO_URL.test(media || "")) {
    items.push({ id: `design-${raw.id}`, src: media, thumb: still(raw.thumbnail), label: name });
  }
  return items;
}

const dedupe = (items) => {
  const seen = new Set();
  return items.filter((it) => it.src && !seen.has(it.src) && seen.add(it.src));
};

const fromHistory = (list, label) =>
  (list || [])
    .filter((h) => h.type === "video" && (h.videoSrc || h.url) && !h.pending)
    .map((h) => ({
      id: `ai-${h.id}`,
      src: h.videoSrc || h.url,
      thumb: still(h.thumbnail),
      label: h.prompt || label,
    }));

export default function useVideoSources() {
  const { fetchDesigns } = useAuth();
  const gallery = useGalleryMedia({ allowedTypes: ["video"] });

  const [creatives, setCreatives] = useState({ items: [], loading: true });
  const [ai, setAi] = useState({ items: [], loading: true });
  const [stock, setStock] = useState(
    STOCK_SHELVES.map((s) => ({ ...s, items: [], loading: true })),
  );

  // Your creatives — one page of the brand's designs, scanned for video.
  useEffect(() => {
    let alive = true;
    fetchDesigns(50)
      .then((res) => {
        if (!alive) return;
        const rows = Array.isArray(res?.data) ? res.data : [];
        setCreatives({ items: dedupe(rows.flatMap(videosInDesign)), loading: false });
      })
      .catch(() => alive && setCreatives({ items: [], loading: false }));
    return () => {
      alive = false;
    };
  }, [fetchDesigns]);

  // AI generations — every video tool, newest first within each.
  useEffect(() => {
    let alive = true;
    const safe = (p) => p.catch(() => []);
    Promise.all([
      safe(getMagicHistory("text_to_video")),
      safe(getMagicHistory("image_to_video")),
      safe(getProductHistory(TOOL_ENUM.product_video)),
    ]).then(([t2v, i2v, product]) => {
      if (!alive) return;
      setAi({
        items: dedupe([
          ...fromHistory(t2v, "Text to video"),
          ...fromHistory(i2v, "Image to video"),
          ...fromHistory(product, "Product video"),
        ]),
        loading: false,
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  // Stock shelves — fetched together, each landing as it arrives.
  useEffect(() => {
    let alive = true;
    STOCK_SHELVES.forEach((shelf, i) => {
      fetch(`/api/pexels?query=${encodeURIComponent(shelf.query)}&type=videos&per_page=12`)
        .then((r) => (r.ok ? r.json() : { videos: [] }))
        .catch(() => ({ videos: [] }))
        .then((data) => {
          if (!alive) return;
          const items = normalizeVideos(data.videos).map((v) => ({
            id: `pexels-${v.id}`,
            src: v.full,
            thumb: v.thumb,
            duration: v.duration,
            label: v.alt,
          }));
          setStock((cur) =>
            cur.map((s, k) => (k === i ? { ...s, items, loading: false } : s)),
          );
        });
    });
    return () => {
      alive = false;
    };
  }, []);

  return {
    uploads: {
      items: gallery.items.map((it) => ({
        id: `upload-${it.id ?? it.src}`,
        src: it.src,
        thumb: still(it.thumbnail || it.thumb),
        duration: it.duration,
        label: it.filename || "Upload",
      })),
      loading: gallery.loading,
      hasMore: gallery.hasMore,
      loadMore: gallery.loadMore,
      refresh: gallery.refresh,
    },
    creatives,
    ai,
    stock,
  };
}
