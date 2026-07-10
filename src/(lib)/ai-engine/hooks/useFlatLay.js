"use client";

import { useCallback, useRef, useState } from "react";
import useAiTool from "./useAiTool";
import { removeBackground, disposeSegmentationWorker } from "../tasks/removeBackground";
import { disposeUpscaleWorker } from "../tasks/upscaleImage";
import { grabObjects } from "../tasks/grabObjects";
import { targetDimensions } from "../compose/fitToSize";
import { SIZE_RATIOS, qualityToModelKey } from "./toolParams";

/**
 * Flat Lay (on-device object grabber): remove the photo's background, split the
 * result into individual product items (connected-components), and auto-arrange
 * them on a clean white canvas. The user then drags/scales each item freely; the
 * arrange UI flattens the current layout back into the shared hook via
 * `setFlattened` so Download/Save always export exactly what's on screen.
 *
 * @param {(blob: Blob) => (boolean|Promise<boolean>)} [onSave]
 */
export default function useFlatLay(onSave) {
  const [items, setItems] = useState([]); // [{ id, blob, url, x, y, w, h }]
  const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024 });

  const dispose = useCallback(() => {
    disposeSegmentationWorker();
    disposeUpscaleWorker();
    setItems((prev) => { prev.forEach((it) => URL.revokeObjectURL(it.url)); return []; });
  }, []);

  const run = useCallback(async (source, params, onProgress) => {
    const { sizeId, quality } = params;
    const ratio = SIZE_RATIOS[sizeId] || SIZE_RATIOS.square;
    const { width, height } = targetDimensions(ratio, quality);
    setCanvasSize({ width, height });

    // 1) full-photo cutout — 0→55%
    const { blob: cutout } = await removeBackground(source, {
      modelKey: qualityToModelKey(quality),
      onProgress: ({ pct }) => onProgress({ pct: Math.round((pct || 0) * 0.55) }),
    });

    // 2) split into items — 55→80%
    onProgress({ pct: 60 });
    const grabbed = await grabObjects(cutout);
    onProgress({ pct: 80 });

    // 3) auto-arrange into a simple centered grid on the white canvas — 80→100%
    const arranged = autoArrange(grabbed, width, height);
    setItems((prev) => { prev.forEach((it) => URL.revokeObjectURL(it.url)); return arranged; });

    const blob = await flattenItems(arranged, width, height);
    onProgress({ pct: 100 });
    return { blob };
  }, []);

  const tool = useAiTool({
    run,
    dispose,
    onSave,
    filePrefix: "klux-flatlay",
    emptyMessage: "Nothing to download yet — create a flat lay first.",
    downloadToast: "Preparing the AI engine — a one-time download, then it's instant.",
  });

  // The arrange UI calls this after every drag/resize so the shared hook's
  // result blob (used by Download/Save) matches the on-screen layout.
  const setFlattened = useCallback((blob) => {
    tool.setResultBlob?.(blob);
  }, [tool]);

  return { ...tool, items, setItems, canvasSize, setFlattened };
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

/** Flatten the current items onto a white canvas → PNG blob. */
export async function flattenItems(items, W, H) {
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  for (const it of items) {
    const bmp = await createImageBitmap(it.blob);
    ctx.drawImage(bmp, it.x, it.y, it.w, it.h);
    bmp.close();
  }
  return canvas.convertToBlob({ type: "image/png" });
}
