"use client";

import { useCallback, useRef } from "react";
import useAiTool from "./useAiTool";
import { removeBackground, disposeSegmentationWorker } from "../tasks/removeBackground";
import { upscaleImage, disposeUpscaleWorker } from "../tasks/upscaleImage";
import { fitToSize } from "../compose/fitToSize";
import { SIZE_RATIOS, qualityToModelKey } from "./toolParams";

/**
 * Product Beautifier (on-device): remove the background, upscale/enhance the
 * product (Real-ESRGAN, tiled), then frame it to the chosen size. The output
 * keeps a TRANSPARENT background — the product's true colors are preserved and
 * nothing is colorized.
 *
 * Caching: the heavy cutout+enhance is cached PER QUALITY tier. Changing only the
 * size re-runs the cheap `fitToSize` (which upscales-to-fit so the product fills
 * the frame — never a plain shrink). Changing quality re-runs the AI. The shell
 * also caches the final framed blob per size+quality via `params.onCache`.
 *
 * @param {(blob: Blob) => (boolean|Promise<boolean>)} [onSave]
 */
export default function useProductBeautifier(onSave) {
  // enhanced cutout cached by quality tier, so a size-only change skips the AI.
  const enhancedByQuality = useRef(new Map());

  const dispose = useCallback(() => {
    disposeSegmentationWorker();
    disposeUpscaleWorker();
    enhancedByQuality.current.clear();
  }, []);

  const run = useCallback(async (source, params, onProgress) => {
    const { sizeId, quality, onCache } = params;
    const ratio = SIZE_RATIOS[sizeId] || SIZE_RATIOS.square;

    let enhanced = enhancedByQuality.current.get(quality);
    if (!enhanced) {
      // 1) cutout — 0→45%
      const { blob: cutout } = await removeBackground(source, {
        modelKey: qualityToModelKey(quality),
        onProgress: ({ pct }) => onProgress({ pct: Math.round((pct || 0) * 0.45) }),
      });

      // 2) enhance/upscale the product — 45→85%
      enhanced = cutout;
      try {
        const { blob } = await upscaleImage(cutout, {
          tier: quality === "Ultra" ? "hd" : "standard",
          onProgress: ({ pct }) => onProgress({ pct: 45 + Math.round((pct || 0) * 0.4) }),
        });
        enhanced = blob;
      } catch (err) {
        console.warn("⚠️ beautifier: upscale failed, using cutout:", err?.message);
      }
      enhancedByQuality.current.set(quality, enhanced);
    } else {
      onProgress({ pct: 85 }); // reused the enhanced cutout — jump ahead
    }

    // 3) frame to the chosen size on a TRANSPARENT background — 85→100%. fitToSize
    //    upscales the product to fill the slot when needed (no shrinking).
    const { blob } = await fitToSize(enhanced, {
      ratio, quality, background: "transparent",
      onProgress: ({ pct }) => onProgress({ pct: 85 + Math.round((pct || 0) * 0.15) }),
    });
    onProgress({ pct: 100 });
    onCache?.(blob);
    return { blob };
  }, []);

  return useAiTool({
    run,
    dispose,
    onSave,
    filePrefix: "klux-beautified",
    emptyMessage: "Nothing to download yet — beautify a product first.",
    downloadToast: "Preparing the AI engine — a one-time download, then it's instant.",
  });
}
