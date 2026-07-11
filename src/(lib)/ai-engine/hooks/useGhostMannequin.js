"use client";

import { useCallback, useRef, useState } from "react";
import useAiTool from "./useAiTool";
import { removeBackground, disposeSegmentationWorker } from "../tasks/removeBackground";
import { estimateDepth, disposeDepthWorker } from "../tasks/estimateDepth";
import { fitToSize } from "../compose/fitToSize";
import { createSourceCache } from "./sourceCache";
import { SIZE_RATIOS, qualityToModelKey } from "./toolParams";

/**
 * Ghost Mannequin (on-device): remove the garment's background, estimate a depth
 * map (Depth Anything V2 Small), and frame it to size. The flat framed image is
 * the shared-hook `resultImage` (so download/save work), while the raw cutout +
 * depth blobs are exposed for the interactive WebGL 3D view the modal's custom
 * result renderer mounts (see mannequin3D.js). Photoreal worn render stays the
 * paid backend "Generate".
 *
 * While the 3D view is active it registers an exporter on `angleExportRef`;
 * Download/Save then capture the CURRENT 3D ANGLE instead of the flat frame
 * (this hook wraps the shared download/saveToGallery to check the ref first).
 *
 * Caching: cutout+depth are cached per (sourceKey, quality) — see
 * sourceCache.js — so within the same source image a size-only change just
 * re-frames and a cached quality restores instantly (rebuilding the 3D pair
 * too); when the working image changes the caller bumps `params.sourceKey`
 * and the AI correctly re-runs. `peekCached` lets the caller skip the skeleton.
 *
 * @param {(blob: Blob) => (boolean|Promise<boolean>)} [onSave]
 */
export default function useGhostMannequin(onSave) {
  const [cutoutUrl, setCutoutUrl] = useState(null);
  const [depthUrl, setDepthUrl] = useState(null);
  // (sourceKey, quality) → { cutoutBlob, depthBlob }.
  const cacheRef = useRef(createSourceCache());
  // Set by Mannequin3DView while 3D is on: () => Promise<Blob> of the current angle.
  const angleExportRef = useRef(null);
  const setAngleExporter = useCallback((fn) => {
    angleExportRef.current = fn;
  }, []);

  const setPair = useCallback((cutoutBlob, depthBlob) => {
    setCutoutUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return cutoutBlob ? URL.createObjectURL(cutoutBlob) : null; });
    setDepthUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return depthBlob ? URL.createObjectURL(depthBlob) : null; });
  }, []);

  const dispose = useCallback(() => {
    disposeSegmentationWorker();
    disposeDepthWorker();
    setPair(null, null);
    cacheRef.current.clear();
  }, [setPair]);

  const run = useCallback(async (source, params, onProgress) => {
    const { sizeId, quality, onCache, sourceKey = "default" } = params;
    const ratio = SIZE_RATIOS[sizeId] || SIZE_RATIOS.square;

    let entry = cacheRef.current.get(sourceKey, quality);
    if (!entry) {
      // 1) garment cutout — 0→40%
      const { blob: cutout } = await removeBackground(source, {
        modelKey: await qualityToModelKey(quality),
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
      cacheRef.current.set(sourceKey, quality, entry);
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
  const { download: baseDownload, saveToGallery: baseSave, markSaved } = tool;

  // True when a run for (sourceKey, quality) would restore from cache — the
  // caller uses this to run "soft" (no processing skeleton, instant feel).
  const peekCached = useCallback(
    ({ sourceKey = "default", quality }) => cacheRef.current.has(sourceKey, quality),
    [],
  );

  // Download: the current 3D angle when the 3D view is live, else the flat result.
  const download = useCallback(
    async (type, format, background) => {
      const exportAngle = angleExportRef.current;
      if (exportAngle) {
        try {
          console.log("💾 klux-mannequin: downloading the current 3D angle");
          const blob = await exportAngle();
          if (!blob) throw new Error("empty export");
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "klux-mannequin-3d-angle.png";
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          return;
        } catch (err) {
          console.warn("⚠️ mannequin: 3D angle export failed, downloading flat result:", err?.message);
        }
      }
      baseDownload(type, format, background);
    },
    [baseDownload],
  );

  // Save: same rule — the visible 3D angle wins over the flat frame.
  const saveToGallery = useCallback(
    async (background) => {
      const exportAngle = angleExportRef.current;
      if (exportAngle && onSave) {
        try {
          console.log("🔖 klux-mannequin: saving the current 3D angle…");
          const blob = await exportAngle();
          if (!blob) throw new Error("empty export");
          const saved = await onSave(blob);
          if (saved !== false) markSaved();
          return saved;
        } catch (err) {
          console.warn("⚠️ mannequin: 3D angle save failed, saving flat result:", err?.message);
        }
      }
      return baseSave(background);
    },
    [onSave, baseSave, markSaved],
  );

  return { ...tool, download, saveToGallery, cutoutUrl, depthUrl, setAngleExporter, peekCached };
}
