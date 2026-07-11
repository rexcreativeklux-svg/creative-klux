"use client";

import { useCallback, useRef, useState } from "react";
import useAiTool from "./useAiTool";
import { removeBackground, disposeSegmentationWorker } from "../tasks/removeBackground";
import { upscaleImage, disposeUpscaleWorker } from "../tasks/upscaleImage";
import { enhanceImage, disposeEnhanceWorker } from "../tasks/enhanceImage";
import { fitToSize, frameToRatio } from "../compose/fitToSize";
import { extractProductColor, deriveBackgrounds } from "../compose/productPalette";
import { createSourceCache } from "./sourceCache";
import { SIZE_RATIOS, qualityToModelKey } from "./toolParams";

/**
 * Product Beautifier (on-device) — enhances the product photo WITHOUT removing
 * its background by default:
 *   1. auto-enhance the WHOLE photo — exposure, white balance, adaptive
 *      contrast, vibrance, tone curve, sharpening (strengths scale with the
 *      quality tier, so Standard → Advanced → Premium is a visible upgrade)
 *   2. upscale the whole photo (Real-ESRGAN, tiled; HD model on Premium)
 *   3. cutout — ONLY to power the background swatches: the product's dominant
 *      color (matched studio palette) + the color/transparent options
 *   4. compose: "Original" (default) keeps the photo's background, framed to
 *      the chosen ratio with a blurred cover-fill when ratios differ; a color/
 *      transparent swatch composes the cutout instead. Switching swatches is a
 *      cheap re-compose — no AI re-run.
 *
 * Caching: the enhanced+upscaled photo, its cutout and the color analysis are
 * cached per (sourceKey, quality) — see sourceCache.js. Within the same source
 * image, size/background/quality switches are instant; when the working image
 * changes (new pick, adopted AI render) the caller bumps `params.sourceKey` and
 * everything correctly re-runs. `peekCached({sourceKey, quality})` lets the
 * caller know a re-run will be instant (so it can skip the processing skeleton).
 *
 * Extra state over the shared hook: `backgrounds` ({auto, swatches}),
 * `background` ("original" | "auto" | "transparent" | css color) and
 * `setBackground(next)`.
 *
 * @param {(blob: Blob) => (boolean|Promise<boolean>)} [onSave]
 */
export default function useProductBeautifier(onSave) {
  // (sourceKey, quality) → { full, cutout, colorInfo } — full = enhanced+
  // upscaled photo (background kept), cutout = same pixels with the mask applied.
  const cacheRef = useRef(createSourceCache());
  const backgroundRef = useRef("original");
  const lastParamsRef = useRef(null); // { sizeId, quality, sourceKey }
  const refitTokenRef = useRef(0); // discard superseded background re-composes
  const [background, setBackgroundState] = useState("original");
  const [backgrounds, setBackgrounds] = useState(null); // { auto, swatches }

  const dispose = useCallback(() => {
    disposeSegmentationWorker();
    disposeUpscaleWorker();
    disposeEnhanceWorker();
    cacheRef.current.clear();
  }, []);

  const run = useCallback(async (source, params, onProgress) => {
    const { sizeId, quality, onCache, sourceKey = "default" } = params;
    lastParamsRef.current = { sizeId, quality, sourceKey };

    let cached = cacheRef.current.get(sourceKey, quality);
    if (!cached) {
      // 1) smart color enhance on the ORIGINAL photo (background kept) — 0→25%.
      //    Capped at the upscaler's 1024px input budget (see enhanceImage docs).
      let enhanced = source;
      try {
        const { blob } = await enhanceImage(source, {
          tier: quality,
          maxEdge: 1024,
          onProgress: ({ pct }) => onProgress({ pct: Math.round((pct || 0) * 0.25) }),
        });
        enhanced = blob;
      } catch (err) {
        console.warn("⚠️ beautifier: auto-enhance failed, using the original:", err?.message);
      }

      // 2) upscale the whole photo — 25→60% (HD Real-ESRGAN on Premium)
      let full = enhanced;
      try {
        const { blob } = await upscaleImage(enhanced, {
          tier: quality === "Ultra" ? "hd" : "standard",
          onProgress: ({ pct, downloading }) =>
            onProgress({ pct: 25 + Math.round((pct || 0) * 0.35), downloading }),
        });
        full = blob;
      } catch (err) {
        console.warn("⚠️ beautifier: upscale failed, using the enhanced photo:", err?.message);
      }

      // 3) cutout — powers the matched palette + color/transparent swatches.
      //    A failure here just hides the swatches; "Original" still works.
      let cutout = null;
      let colorInfo = null;
      try {
        const { blob: maskSource } = await removeBackground(enhanced, {
          modelKey: await qualityToModelKey(quality),
          onProgress: ({ pct, downloading }) =>
            onProgress({ pct: 60 + Math.round((pct || 0) * 0.25), downloading }),
        });
        cutout = await applyCutoutMask(full, maskSource);
        colorInfo = await extractProductColor(maskSource);
      } catch (err) {
        console.warn("⚠️ beautifier: cutout failed — color swatches disabled:", err?.message);
      }

      cached = { full, cutout, colorInfo };
      cacheRef.current.set(sourceKey, quality, cached);
    } else {
      onProgress({ pct: 85 }); // reused the enhanced photo — jump ahead
    }

    setBackgrounds(cached.cutout ? deriveBackgrounds(cached.colorInfo) : null);

    // 4) compose for the current selection — 85→100%
    const selection = cached.cutout ? backgroundRef.current : "original";
    const { blob } = await composeResult(cached, selection, sizeId, quality, ({ pct }) =>
      onProgress({ pct: 85 + Math.round((pct || 0) * 0.15) }),
    );
    onProgress({ pct: 100 });
    onCache?.(blob);
    return { blob };
  }, []);

  const tool = useAiTool({
    run,
    dispose,
    onSave,
    filePrefix: "klux-beautified",
    emptyMessage: "Nothing to download yet — beautify a product first.",
    downloadToast: "Preparing the AI engine — a one-time download, then it's instant.",
  });
  const { setResultBlob } = tool;

  // True when a run for (sourceKey, quality) would restore from cache — the
  // caller uses this to run "soft" (no processing skeleton, instant feel).
  const peekCached = useCallback(
    ({ sourceKey = "default", quality }) => cacheRef.current.has(sourceKey, quality),
    [],
  );

  // Swatch click: re-compose from the cached enhanced photo/cutout — instant.
  const setBackground = useCallback(
    async (next) => {
      backgroundRef.current = next;
      setBackgroundState(next);
      const params = lastParamsRef.current;
      const cached = params && cacheRef.current.get(params.sourceKey, params.quality);
      if (!cached) return;
      if (next !== "original" && !cached.cutout) return; // swatches need the cutout
      const token = (refitTokenRef.current += 1);
      try {
        const { blob } = await composeResult(cached, next, params.sizeId, params.quality);
        if (token !== refitTokenRef.current) return; // a newer swatch click won
        setResultBlob(blob);
        console.log(`🎨 beautifier: background → ${next}`);
      } catch (err) {
        console.error("❌ beautifier: background re-compose failed:", err);
      }
    },
    [setResultBlob],
  );

  return { ...tool, background, backgrounds, setBackground, peekCached };
}

/**
 * Compose the visible result for a background selection: "original" frames the
 * full photo (blur-extended to the ratio); anything else composes the cutout
 * onto that color ("auto" resolves to the matched pick, "transparent" keeps alpha).
 */
function composeResult(cached, selection, sizeId, quality, onProgress) {
  const ratio = SIZE_RATIOS[sizeId] || SIZE_RATIOS.square;
  if (selection === "original" || !cached.cutout) {
    return frameToRatio(cached.full, {
      ratio,
      quality,
      originalSize: sizeId === "original",
      onProgress,
    });
  }
  const color =
    selection === "auto" ? deriveBackgrounds(cached.colorInfo).auto : selection;
  return fitToSize(cached.cutout, { ratio, quality, background: color, onProgress });
}

/**
 * Apply a cutout's alpha mask to the (larger) upscaled photo: draw the photo,
 * then destination-in the mask scaled up to it — one canvas op instead of a
 * second Real-ESRGAN pass over the cutout.
 */
async function applyCutoutMask(fullBlob, maskBlob) {
  const [fullBmp, maskBmp] = await Promise.all([
    createImageBitmap(fullBlob),
    createImageBitmap(maskBlob),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = fullBmp.width;
  canvas.height = fullBmp.height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fullBmp, 0, 0);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(maskBmp, 0, 0, fullBmp.width, fullBmp.height);
  fullBmp.close();
  maskBmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Mask compose failed"))), "image/png"),
  );
}
