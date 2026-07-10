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
 * the shared-hook `resultImage` (so download/save/skeleton work), while the raw
 * cutout + depth blobs are exposed for the interactive WebGL 2.5D "3D Preview"
 * that the modal's custom result renderer mounts (see mannequin3D.js).
 *
 * The photoreal worn render stays the paid backend "Generate" — this is the
 * instant, on-device 3D preview.
 *
 * @param {(blob: Blob) => (boolean|Promise<boolean>)} [onSave]
 */
export default function useGhostMannequin(onSave) {
  // Blobs the WebGL renderer needs, kept alongside the shared hook's result.
  const [cutoutUrl, setCutoutUrl] = useState(null);
  const [depthUrl, setDepthUrl] = useState(null);
  const cacheRef = useRef({ cutoutBlob: null, params: null });

  const setPair = useCallback((cutoutBlob, depthBlob) => {
    setCutoutUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return cutoutBlob ? URL.createObjectURL(cutoutBlob) : null; });
    setDepthUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return depthBlob ? URL.createObjectURL(depthBlob) : null; });
  }, []);

  const dispose = useCallback(() => {
    disposeSegmentationWorker();
    disposeDepthWorker();
    setPair(null, null);
    cacheRef.current = { cutoutBlob: null, params: null };
  }, [setPair]);

  const run = useCallback(async (source, params, onProgress) => {
    const { sizeId, quality } = params;
    const ratio = SIZE_RATIOS[sizeId] || SIZE_RATIOS.square;

    // 1) garment cutout — 0→40%
    const { blob: cutout } = await removeBackground(source, {
      modelKey: qualityToModelKey(quality),
      onProgress: ({ pct }) => onProgress({ pct: Math.round((pct || 0) * 0.4) }),
    });

    // 2) depth map — 40→85% (the worker reports its own 0→100)
    let depth = null;
    try {
      const { depthBlob } = await estimateDepth(cutout, {
        onProgress: ({ pct }) => onProgress({ pct: 40 + Math.round((pct || 0) * 0.45) }),
      });
      depth = depthBlob;
    } catch (err) {
      // Depth is what makes it 3D, but a failure shouldn't block the cutout —
      // fall back to a flat preview (the renderer detects the missing depth).
      console.warn("⚠️ mannequin: depth failed, showing flat cutout:", err?.message);
    }

    setPair(cutout, depth);
    cacheRef.current = { cutoutBlob: cutout, params };

    // 3) flat framed result for the shared hook — 85→100%
    const { blob } = await fitToSize(cutout, { ratio, quality, background: "#ffffff", align: "center" });
    onProgress({ pct: 100 });
    return { blob };
  }, [setPair]);

  // Re-frame on size/quality change (no AI re-run); depth/cutout stay valid.
  const update = useCallback(async (params) => {
    const cutout = cacheRef.current.cutoutBlob;
    if (!cutout) throw new Error("Nothing to re-frame yet.");
    const ratio = SIZE_RATIOS[params.sizeId] || SIZE_RATIOS.square;
    const { blob } = await fitToSize(cutout, { ratio, quality: params.quality, background: "#ffffff", align: "center" });
    return { blob };
  }, []);

  const tool = useAiTool({
    run,
    update,
    dispose,
    onSave,
    filePrefix: "klux-mannequin",
    emptyMessage: "Nothing to download yet — create a 3D preview first.",
    downloadToast: "Preparing the AI engine — a one-time download, then it's instant.",
  });

  // Expose the extra 3D blobs alongside the standard tool shape.
  return { ...tool, cutoutUrl, depthUrl };
}
