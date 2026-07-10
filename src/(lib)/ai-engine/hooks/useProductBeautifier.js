"use client";

import { useCallback, useRef } from "react";
import useAiTool from "./useAiTool";
import { removeBackground, disposeSegmentationWorker } from "../tasks/removeBackground";
import { upscaleImage, disposeUpscaleWorker } from "../tasks/upscaleImage";
import { fitToSize } from "../compose/fitToSize";
import { SIZE_RATIOS, qualityToModelKey } from "./toolParams";

/**
 * Product Beautifier (on-device): remove the background, upscale/enhance the
 * product (Real-ESRGAN, tiled), then frame it to the chosen size on a clean
 * background. No colorizing — the product's true colors are preserved.
 *
 * The heavy cutout+enhance is cached so changing size/quality only re-runs the
 * cheap `fitToSize` compose (via the shared hook's `update`).
 *
 * @param {(blob: Blob) => (boolean|Promise<boolean>)} [onSave]
 */
export default function useProductBeautifier(onSave) {
  // Cache of the last full run, so size/quality tweaks skip the AI passes.
  const cacheRef = useRef({ enhancedBlob: null, params: null });

  const dispose = useCallback(() => {
    disposeSegmentationWorker();
    disposeUpscaleWorker();
    cacheRef.current = { enhancedBlob: null, params: null };
  }, []);

  const run = useCallback(async (source, params, onProgress) => {
    const { sizeId, quality } = params;
    const ratio = SIZE_RATIOS[sizeId] || SIZE_RATIOS.square;

    // 1) cutout — 0→45% of the bar
    const { blob: cutout } = await removeBackground(source, {
      modelKey: qualityToModelKey(quality),
      onProgress: ({ pct }) => onProgress({ pct: Math.round((pct || 0) * 0.45) }),
    });

    // 2) enhance/upscale the product — 45→85%
    let enhanced = cutout;
    try {
      const { blob } = await upscaleImage(cutout, {
        tier: quality === "Ultra" ? "hd" : "standard",
        onProgress: ({ pct }) => onProgress({ pct: 45 + Math.round((pct || 0) * 0.4) }),
      });
      enhanced = blob;
    } catch (err) {
      console.warn("⚠️ beautifier: upscale failed, using cutout:", err?.message);
    }
    cacheRef.current = { enhancedBlob: enhanced, params };

    // 3) frame to size — 85→100%
    const { blob } = await fitToSize(enhanced, { ratio, quality, background: "transparent" });
    onProgress({ pct: 100 });
    return { blob };
  }, []);

  // Fast re-frame when only size/quality changed (no AI re-run).
  const update = useCallback(async (params, onProgress) => {
    const enhanced = cacheRef.current.enhancedBlob;
    if (!enhanced) throw new Error("Nothing to re-frame yet.");
    const { sizeId, quality } = params;
    const ratio = SIZE_RATIOS[sizeId] || SIZE_RATIOS.square;
    const { blob } = await fitToSize(enhanced, {
      ratio,
      quality,
      background: "transparent",
      onProgress: ({ pct }) => onProgress?.({ pct }),
    });
    return { blob };
  }, []);

  return useAiTool({
    run,
    update,
    dispose,
    onSave,
    filePrefix: "klux-beautified",
    emptyMessage: "Nothing to download yet — beautify a product first.",
    downloadToast: "Preparing the AI engine — a one-time download, then it's instant.",
  });
}
