"use client";

import { useEffect, useRef, useState } from "react";
import { proxiedSrc } from "@/(lib)/design/renderDesign";

/**
 * usePreviewBakes — tiny REAL previews for a baked effect (Texture's
 * presets): run `render(canvas, item) → canvas` for each item against one
 * small copy of the image, and hand back data URLs keyed by item id.
 *
 * Previews bake at thumbnail size — eleven texture presets at 72px is ~57k
 * pixels of work total, cheap enough to run the moment the tool opens — and
 * the whole point is that the tile shows the REAL effect rather than a CSS
 * lookalike that disagrees with what tapping it actually produces.
 *
 * Colocated under panels/image: TextureSection.jsx is its only caller.
 *
 * @param {string} src The image to preview.
 * @param {Array<{id: string}>} items
 * @param {(base: HTMLCanvasElement, item: object) => HTMLCanvasElement} render
 * @returns {Record<string, string>} id → data URL (empty until baked)
 */
const PREVIEW_SIZE = 72;

export default function usePreviewBakes(src, items, render) {
  const [previews, setPreviews] = useState({});
  const renderRef = useRef(render);
  // Kept current via an effect (refs can't be written during render) — this
  // is what lets `render` be a fresh inline function every call without the
  // main effect below re-running (and re-baking) on every parent render.
  useEffect(() => {
    renderRef.current = render;
  });

  // Item identity, so a stable list doesn't rebake on every render.
  const key = items.map((i) => i.id).join(",");

  // A cleared source resets previews during render (React's own pattern for
  // state that tracks a prop) rather than in the effect below — the effect
  // stays purely about the async bake, with no synchronous setState call to
  // trigger a cascading re-render for.
  const sourceless = !src;
  const [wasSourceless, setWasSourceless] = useState(sourceless);
  if (sourceless !== wasSourceless) {
    setWasSourceless(sourceless);
    if (sourceless && Object.keys(previews).length) setPreviews({});
  }

  useEffect(() => {
    if (!src) return undefined;

    let cancelled = false;
    const img = new Image();
    const isData = src.startsWith("data:");
    if (!isData) img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;

      // Square, centre-cropped — a preview tile is square, and letterboxing
      // would waste the pixels that show the effect.
      const side = Math.min(img.naturalWidth, img.naturalHeight) || 1;
      const base = document.createElement("canvas");
      base.width = PREVIEW_SIZE;
      base.height = PREVIEW_SIZE;
      base
        .getContext("2d")
        .drawImage(
          img,
          (img.naturalWidth - side) / 2,
          (img.naturalHeight - side) / 2,
          side,
          side,
          0,
          0,
          PREVIEW_SIZE,
          PREVIEW_SIZE,
        );

      const out = {};
      for (const item of items) {
        try {
          out[item.id] = renderRef.current(base, item).toDataURL("image/png");
        } catch {
          // One preset failing must not blank the whole strip — that tile
          // just falls back to the plain thumbnail.
          out[item.id] = "";
        }
      }
      if (!cancelled) setPreviews(out);
    };

    img.onerror = () => {
      if (!cancelled) setPreviews({});
    };
    img.src = isData ? src : proxiedSrc(src);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, key]);

  return previews;
}
