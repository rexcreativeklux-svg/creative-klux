"use client";

import { useCallback, useRef, useState } from "react";
import useAiTool from "./useAiTool";
import { removeBackground, disposeSegmentationWorker } from "../tasks/removeBackground";
import { estimateDepth, disposeDepthWorker } from "../tasks/estimateDepth";
import { fitToSize } from "../compose/fitToSize";
import { SIZE_RATIOS, qualityToModelKey } from "./toolParams";

/**
 * Ghost Mannequin (on-device): remove the garment's background, estimate a depth
 * map (Depth Anything V2 Small), and frame it to size. The flat framed image is
 * the shared-hook `resultImage` (so download/save work), while the raw cutout +
 * depth blobs are exposed for the interactive WebGL 2.5D "3D Preview" the modal's
 * custom result renderer mounts (see mannequin3D.js). Photoreal worn render stays
 * the paid backend "Generate".
 *
 * Caching: cutout+depth are cached per quality tier, so a size-only change just
 * re-frames; a quality change re-runs the AI.
 *
 * @param {(blob: Blob) => (boolean|Promise<boolean>)} [onSave]
 */
export default function useGhostMannequin(onSave) {
  const [cutoutUrl, setCutoutUrl] = useState(null);
  const [depthUrl, setDepthUrl] = useState(null);
  // { cutoutBlob, depthBlob } cached per quality tier.
  const byQuality = useRef(new Map());

  const setPair = useCallback((cutoutBlob, depthBlob) => {
    setCutoutUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return cutoutBlob ? URL.createObjectURL(cutoutBlob) : null; });
    setDepthUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return depthBlob ? URL.createObjectURL(depthBlob) : null; });
  }, []);

  const dispose = useCallback(() => {
    disposeSegmentationWorker();
    disposeDepthWorker();
    setPair(null, null);
    byQuality.current.clear();
  }, [setPair]);

  const run = useCallback(async (source, params, onProgress) => {
    const { sizeId, quality, onCache } = params;
    const ratio = SIZE_RATIOS[sizeId] || SIZE_RATIOS.square;

    let entry = byQuality.current.get(quality);
    if (!entry) {
      // 1) garment cutout — 0→40%
      const { blob: cutout } = await removeBackground(source, {
        modelKey: qualityToModelKey(quality),
        onProgress: ({ pct }) => onProgress({ pct: Math.round((pct || 0) * 0.4) }),
      });

      // 2) depth map — 40→85%
      let depth = null;
      try {
        const { depthBlob } = await estimateDepth(cutout, {
          onProgress: ({ pct }) => onProgress({ pct: 40 + Math.round((pct || 0) * 0.45) }),
        });
        depth = depthBlob;
      } catch (err) {
        console.warn("⚠️ mannequin: depth failed, showing flat cutout:", err?.message);
      }
      entry = { cutoutBlob: cutout, depthBlob: depth };
      byQuality.current.set(quality, entry);
    } else {
      onProgress({ pct: 85 });
    }

    setPair(entry.cutoutBlob, entry.depthBlob);

    // 3) flat framed result for the shared hook (white bg) — 85→100%
    const { blob } = await fitToSize(entry.cutoutBlob, { ratio, quality, background: "#ffffff", align: "center" });
    onProgress({ pct: 100 });
    onCache?.(blob);
    return { blob };
  }, [setPair]);

  const tool = useAiTool({
    run,
    dispose,
    onSave,
    filePrefix: "klux-mannequin",
    emptyMessage: "Nothing to download yet — create a 3D preview first.",
    downloadToast: "Preparing the AI engine — a one-time download, then it's instant.",
  });

  return { ...tool, cutoutUrl, depthUrl };
}
