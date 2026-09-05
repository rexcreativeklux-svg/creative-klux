"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { sketchImage } from "@/(lib)/ai-engine/tasks/sketchImage";
import { sourceToBitmap } from "@/(lib)/ai-engine/core/imageSource";

/**
 * useStylePreviews — thumbnails for the Sketchify style grid, rendered from
 * the user's OWN photo rather than shipped sample images.
 *
 * There are no sample renders to ship, and a grid of stock faces would be a
 * worse answer anyway: what matters is how YOUR photo looks in each style.
 * Since every style runs on-device, they can just be rendered.
 *
 * Two things keep that affordable:
 *   • The source is downscaled to ~200px ONCE, and every style renders from
 *     that copy. A full-size pass per style would take minutes.
 *   • Styles render one at a time, cached by (source, style), and the loop
 *     stands down while a real Sketchify run is in flight — the worker keeps
 *     one cached working image, so overlapping calls would fight over it.
 *
 * Colocated under panels/image: SketchifySection.jsx is its only caller. Not
 * usePreviewBakes (Texture's own preview hook) because these previews are
 * ASYNC — sketchImage runs through a worker — where Texture's are synchronous
 * canvas math; the two can't share one shape.
 *
 * @param {File|Blob|string|null} source
 * @param {Array<{id: string}>} styles
 * @param {{ enabled?: boolean }} [opts] enabled=false parks the loop (e.g.
 *   while the panel's main run is working).
 * @returns {{ previews: Record<string,string>, rendering: string|null }}
 */
const PREVIEW_EDGE = 200;

/** Shrink any source (File / Blob / URL) to a small blob for preview renders. */
async function downscale(source, maxEdge = PREVIEW_EDGE) {
  const bitmap = await sourceToBitmap(source);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not prepare a preview."))),
      "image/png",
    );
  });
}

export default function useStylePreviews(source, styles, { enabled = true } = {}) {
  const [previews, setPreviews] = useState({});
  const [rendering, setRendering] = useState(null);

  // Cache + object-URL registry survive re-runs of the effect so pausing and
  // resuming doesn't re-render styles that are already done.
  const cacheRef = useRef({});
  const urlsRef = useRef([]);

  // A new source invalidates everything, split across two mechanisms because
  // refs and setState each have their own place they're allowed to happen:
  //
  // Ref bookkeeping — revoke the old preview URLs, clear the cache — runs in a
  // LAYOUT effect (not the async effect below, and not render itself: refs can
  // only be touched from an effect or a handler). Layout, not passive, so it's
  // done before the browser paints the next frame.
  const sourceKey = source instanceof Blob ? `${source.size}:${source.type}` : source || "";
  useLayoutEffect(() => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
    cacheRef.current = {};
  }, [sourceKey]);

  // The STATE reset happens during render instead — React's own pattern for
  // state that tracks a prop. Doing it from an effect would let one frame of
  // the OLD photo's previews commit against the NEW photo first (a layout
  // effect avoids that for the DOM, but the state update itself still isn't
  // meant to run from an effect body).
  const [seenSourceKey, setSeenSourceKey] = useState(sourceKey);
  if (seenSourceKey !== sourceKey) {
    setSeenSourceKey(sourceKey);
    if (Object.keys(previews).length) setPreviews({});
  }

  useEffect(() => {
    if (!source || !enabled) return;

    let cancelled = false;

    (async () => {
      try {
        const small = await downscale(source);
        if (cancelled) return;

        for (const style of styles) {
          if (cancelled || cacheRef.current[style.id]) continue;

          setRendering(style.id);
          try {
            const { blob } = await sketchImage(small, { style: style.id });
            if (cancelled) return;

            const url = URL.createObjectURL(blob);
            urlsRef.current.push(url);
            cacheRef.current[style.id] = url;
            setPreviews({ ...cacheRef.current });
          } catch {
            // One style failing (a model that won't load, say) shouldn't stop
            // the rest — that tile just stays a plain label.
          }
        }
      } catch {
        // Unreadable source: no previews, but the panel still works.
      } finally {
        if (!cancelled) setRendering(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, enabled, styles]);

  // Only on unmount: mid-life revocation would blank thumbnails still on screen.
  useEffect(() => () => urlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  return { previews: source ? previews : {}, rendering };
}
