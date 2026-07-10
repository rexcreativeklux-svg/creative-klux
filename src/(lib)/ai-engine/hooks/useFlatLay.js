"use client";

import { useCallback, useRef, useState } from "react";
import useAiTool from "./useAiTool";
import { removeBackground, disposeSegmentationWorker } from "../tasks/removeBackground";
import { disposeUpscaleWorker } from "../tasks/upscaleImage";
import { grabObjects } from "../tasks/grabObjects";
import { targetDimensions } from "../compose/fitToSize";
import { extractProductColor, deriveBackgrounds } from "../compose/productPalette";
import { SIZE_RATIOS, qualityToModelKey } from "./toolParams";

/** Extra plain studio colors offered for flat lays (beyond the matched set). */
const FLATLAY_EXTRA_SWATCHES = [
  { id: "beige", name: "Beige", color: "#ede5d8" },
  { id: "pink", name: "Pastel Pink", color: "#f7e6ea" },
  { id: "blue", name: "Pastel Blue", color: "#e3edf7" },
  { id: "sage", name: "Sage", color: "#e6ede4" },
];

/**
 * Flat Lay (on-device object grabber): remove the photo's background, split the
 * result into individual product items (connected-components), and auto-arrange
 * them on a clean canvas. The user then drags/scales each item freely; the
 * arrange UI flattens the current layout back into the shared hook via
 * `setFlattened` so Download/Save always export exactly what's on screen.
 *
 * Extra state over the shared hook: `items`/`setItems` (the draggable layers),
 * `canvasSize`, `background` (css color or "transparent") + `setBackground`
 * (re-flattens instantly — no AI re-run) and `backgrounds` (matched + curated
 * swatches derived from the items' dominant color).
 *
 * @param {(blob: Blob) => (boolean|Promise<boolean>)} [onSave]
 */
export default function useFlatLay(onSave) {
  const [items, setItemsState] = useState([]); // [{ id, blob, url, x, y, w, h }]
  const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024 });
  const [background, setBackgroundState] = useState("#ffffff");
  const [backgrounds, setBackgrounds] = useState(null); // { auto, swatches }

  // Refs mirroring the state a background re-flatten needs (so setBackground
  // never works from a stale closure).
  const itemsRef = useRef([]);
  const canvasSizeRef = useRef({ width: 1024, height: 1024 });
  const backgroundRef = useRef("#ffffff");
  const refitTokenRef = useRef(0);

  /** setItems that keeps the ref mirror in sync (accepts value or updater). */
  const setItems = useCallback((updater) => {
    setItemsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      itemsRef.current = next;
      return next;
    });
  }, []);

  const dispose = useCallback(() => {
    disposeSegmentationWorker();
    disposeUpscaleWorker();
    setItems((prev) => {
      prev.forEach((it) => URL.revokeObjectURL(it.url));
      return [];
    });
  }, [setItems]);

  const run = useCallback(async (source, params, onProgress) => {
    const { sizeId, quality, onCache } = params;
    const ratio = SIZE_RATIOS[sizeId] || SIZE_RATIOS.square;
    const { width, height } = targetDimensions(ratio, quality);
    setCanvasSize({ width, height });
    canvasSizeRef.current = { width, height };

    // 1) full-photo cutout — 0→55%
    const { blob: cutout } = await removeBackground(source, {
      modelKey: await qualityToModelKey(quality),
      onProgress: ({ pct, downloading }) =>
        onProgress({ pct: Math.round((pct || 0) * 0.55), downloading }),
    });

    // 2) split into items — 55→80%
    onProgress({ pct: 60 });
    const grabbed = await grabObjects(cutout);
    onProgress({ pct: 80 });

    // Dominant color of the whole item set → matched background swatches.
    try {
      const colorInfo = await extractProductColor(cutout);
      const derived = deriveBackgrounds(colorInfo);
      setBackgrounds({
        auto: derived.auto,
        swatches: [...derived.swatches, ...FLATLAY_EXTRA_SWATCHES],
      });
    } catch (err) {
      console.warn("⚠️ flatlay: color analysis failed:", err?.message);
      setBackgrounds({
        auto: "#ffffff",
        swatches: [
          { id: "white", name: "Studio White", color: "#ffffff" },
          ...FLATLAY_EXTRA_SWATCHES,
        ],
      });
    }

    // 3) auto-arrange into a centered grid that FITS the canvas (every item stays
    //    inside the frame — no need to zoom out to see them all) — 80→100%
    const arranged = autoArrange(grabbed, width, height);
    setItems((prev) => {
      prev.forEach((it) => URL.revokeObjectURL(it.url));
      return arranged;
    });

    const blob = await flattenItems(arranged, width, height, backgroundRef.current);
    onProgress({ pct: 100 });
    onCache?.(blob);
    return { blob };
  }, [setItems]);

  const tool = useAiTool({
    run,
    dispose,
    onSave,
    filePrefix: "klux-flatlay",
    emptyMessage: "Nothing to download yet — create a flat lay first.",
    downloadToast: "Preparing the AI engine — a one-time download, then it's instant.",
  });
  const { setResultBlob } = tool;

  // The arrange UI calls this after every drag/resize so the shared hook's
  // result blob (used by Download/Save) matches the on-screen layout.
  const setFlattened = useCallback(
    (blob) => {
      setResultBlob?.(blob);
    },
    [setResultBlob],
  );

  // Swatch click: re-flatten the current arrangement onto the new background —
  // instant, no AI re-run. "transparent" skips the fill (PNG keeps alpha).
  const setBackground = useCallback(
    async (next) => {
      backgroundRef.current = next;
      setBackgroundState(next);
      const { width, height } = canvasSizeRef.current;
      const token = (refitTokenRef.current += 1);
      try {
        const blob = await flattenItems(itemsRef.current, width, height, next);
        if (token !== refitTokenRef.current) return; // a newer swatch click won
        setResultBlob?.(blob);
        console.log(`🎨 flatlay: background → ${next}`);
      } catch (err) {
        console.error("❌ flatlay: background re-flatten failed:", err);
      }
    },
    [setResultBlob],
  );

  return {
    ...tool,
    items,
    setItems,
    canvasSize,
    setFlattened,
    background,
    backgrounds,
    setBackground,
  };
}

/** Pack items into a centered grid that fits the canvas, largest first. */
function autoArrange(grabbed, W, H) {
  const n = grabbed.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cellW = W / cols;
  const cellH = H / rows;
  const margin = 0.12; // fraction of the cell kept as gap

  return grabbed.map((g, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const maxW = cellW * (1 - margin);
    const maxH = cellH * (1 - margin);
    const scale = Math.min(maxW / g.w, maxH / g.h, 1);
    const w = g.w * scale;
    const h = g.h * scale;
    const x = col * cellW + (cellW - w) / 2;
    const y = row * cellH + (cellH - h) / 2;
    return {
      id: `item-${i}-${Date.now()}`,
      blob: g.blob,
      url: URL.createObjectURL(g.blob),
      x, y, w, h,
    };
  });
}

/**
 * Flatten the current items onto a canvas → PNG blob. Items are drawn in array
 * order, so the LAST item sits on top (matches the DOM stacking in the arrange
 * UI). `background` is a css color, or "transparent" to keep the alpha.
 */
export async function flattenItems(items, W, H, background = "#ffffff") {
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext("2d");
  if (background && background !== "transparent") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, W, H);
  }
  for (const it of items) {
    const bmp = await createImageBitmap(it.blob);
    ctx.drawImage(bmp, it.x, it.y, it.w, it.h);
    bmp.close();
  }
  return canvas.convertToBlob({ type: "image/png" });
}
