"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Longest edge of the free "preview" download; "hd" is the full resolution. */
const PREVIEW_MAX_PX = 1200;

/**
 * The shared engine-hook every on-device AI tool builds on. Owns ALL the state
 * a production tool needs — result object URL, progress, a dirty flag, local
 * downloads with the background baked in, and a pluggable "save" — while the
 * tool supplies only its processing functions.
 *
 * Saving is intentionally injected (not hard-wired to auth here) so the shared
 * engine stays app-agnostic: a tool passes `onSave(blob)` that persists the blob
 * however the app wants (e.g. `useAuth().uploadImage`), and owns the logged-out
 * redirect-and-return flow. The panel/tool awaits `saveToGallery()`.
 *
 * @param {object} processor
 * @param {(source: File|Blob|string, params: object, onProgress: Function) => Promise<{blob: Blob}>} processor.run
 *   Full processing of a new source image.
 * @param {(params: object, onProgress: Function) => Promise<{blob: Blob}>} [processor.update]
 *   Optional fast re-process of the LAST source with new params. Keeps the
 *   current result visible until the new one lands.
 * @param {() => void} processor.dispose Frees the tool's worker on unmount.
 * @param {string} processor.filePrefix Download/save file-name prefix.
 * @param {string} processor.emptyMessage Toast when downloading with no result.
 * @param {string|null} [processor.downloadToast] One-time "model downloading" toast.
 * @param {(blob: Blob) => (boolean|Promise<boolean>)} [processor.onSave]
 *   Persist the result blob. Resolve `false` to signal "not saved" (e.g. a guest
 *   was redirected to log in) so the caller skips the success toast; `true` on save.
 * @param {(err: Error) => void} [processor.onError]
 */
export default function useAiTool({
  run: runTask,
  update: updateTask,
  dispose,
  filePrefix,
  emptyMessage,
  downloadToast,
  onSave,
  onError,
}) {
  const [resultImage, setResultImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  // The full-resolution result blob — source of truth for save/download.
  const resultBlobRef = useRef(null);
  // Rising token so a superseded / cancelled run can't overwrite newer state.
  const tokenRef = useRef(0);
  // Only announce the one-time model download once per mount.
  const toastedDownloadRef = useRef(false);
  // Keep the latest processor fns without re-creating callbacks.
  const processorRef = useRef({ runTask, updateTask, dispose, onSave, onError });
  processorRef.current = { runTask, updateTask, dispose, onSave, onError };

  const markSaved = useCallback(() => setIsDirty(false), []);

  // Swap the visible object URL, revoking the previous one (no leaks).
  const setResultBlob = useCallback((blob) => {
    setResultImage((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return blob ? URL.createObjectURL(blob) : null;
    });
    resultBlobRef.current = blob;
  }, []);

  // Free the tool's worker when leaving the page — the AI engine holds zero
  // RAM while no tool is in use.
  useEffect(() => {
    return () => {
      tokenRef.current += 1;
      setResultBlob(null);
      processorRef.current.dispose?.();
    };
  }, [setResultBlob]);

  const handleProgress = useCallback(
    (isCurrent) =>
      ({ pct, downloading }) => {
        if (!isCurrent()) return;
        if (typeof pct === "number") setUploadProgress(pct);
        if (downloading && downloadToast && !toastedDownloadRef.current) {
          toastedDownloadRef.current = true;
          toast.info(downloadToast);
        }
      },
    [downloadToast],
  );

  const run = useCallback(
    async (source, params = {}) => {
      if (!source) return;
      const token = (tokenRef.current += 1);
      const isCurrent = () => token === tokenRef.current;

      setResultBlob(null);
      setProcessing(true);
      setFailed(false);
      setUploadProgress(0);

      // Watchdog: if the engine makes NO progress for this long, it's hung (a
      // wedged worker, an unsupported device) — fail loudly instead of leaving
      // the user staring at a "Processing…" screen forever. Every progress tick
      // resets it, so a slow-but-advancing run is never killed.
      const STALL_MS = 45000;
      let stallTimer = null;
      const armStall = (reject) => {
        clearTimeout(stallTimer);
        stallTimer = setTimeout(() => {
          reject(new Error("this is taking too long — it may not run on this device"));
        }, STALL_MS);
      };

      try {
        const blob = await new Promise((resolve, reject) => {
          armStall(reject);
          processorRef.current
            .runTask(source, params, (p) => {
              armStall(reject); // progress → the engine is alive; reset watchdog
              handleProgress(isCurrent)(p);
            })
            .then((r) => resolve(r.blob))
            .catch(reject);
        });
        clearTimeout(stallTimer);
        if (!isCurrent()) return; // a newer run / cancel won

        setResultBlob(blob);
        setIsDirty(true); // a fresh result is unsaved work
        console.log(`✅ ${filePrefix}: processed on-device`);
      } catch (err) {
        clearTimeout(stallTimer);
        if (!isCurrent()) return;
        console.error(`❌ ${filePrefix}: processing failed:`, err);
        toast.error(`Failed — ${err?.message || "couldn't process this image"}. Please try another image.`);
        // Flag the failure so the UI shows a recovery state instead of a
        // skeleton that never resolves.
        setFailed(true);
        processorRef.current.onError?.(err);
      } finally {
        if (isCurrent()) setProcessing(false);
      }
    },
    [setResultBlob, handleProgress, filePrefix],
  );

  // Fast re-process with new params (size/quality/preset). The old result stays
  // on screen until the new one is ready — no flicker, no "Processing…" state.
  const update = useCallback(
    async (params = {}) => {
      if (!processorRef.current.updateTask || !resultBlobRef.current) return;
      const token = (tokenRef.current += 1);
      const isCurrent = () => token === tokenRef.current;
      try {
        const { blob } = await processorRef.current.updateTask(
          params,
          handleProgress(isCurrent),
        );
        if (!isCurrent()) return;
        setResultBlob(blob);
        setIsDirty(true);
      } catch (err) {
        if (!isCurrent()) return;
        console.error(`❌ ${filePrefix}: update failed:`, err);
        toast.error(err?.message || "Couldn't apply that adjustment.");
      }
    },
    [setResultBlob, handleProgress, filePrefix],
  );

  // Persist the result via the injected `onSave` (with the chosen background
  // baked in). Returns the handler's result so the caller owns the toast:
  // resolve `false` (no toast) when a guest was redirected to log in, `true`
  // on success. Returns false if there is nothing to save or no handler.
  const saveToGallery = useCallback(
    async (background = "transparent") => {
      const blob = resultBlobRef.current;
      if (!blob) return false;
      const save = processorRef.current.onSave;
      if (!save) {
        console.warn(`⚠️ ${filePrefix}: no onSave handler wired.`);
        return false;
      }
      console.log(`🔖 ${filePrefix}: saving (background: ${background})…`);
      const outBlob = await exportBlob(blob, "hd", "png", background);
      const saved = await save(outBlob);
      if (saved !== false) {
        markSaved();
        console.log(`✅ ${filePrefix}: saved`);
      }
      return saved;
    },
    [filePrefix, markSaved],
  );

  // Download the result at the requested size/format, generated locally — no
  // server round-trip. "hd" = full resolution; "preview" = up to 1200px. The
  // selected background is baked into the file (PNG stays transparent when
  // "transparent"; JPG flattens onto the color, or white when none was picked).
  const download = useCallback(
    (type, format = "png", background = "transparent") => {
      const blob = resultBlobRef.current;
      if (!blob) {
        console.warn(`⚠️ ${filePrefix}: nothing to download yet.`);
        toast.error(emptyMessage || "Nothing to download yet.");
        return;
      }
      const variant = type === "hd" ? "hd" : "preview";
      const fmt = format === "jpg" ? "jpg" : "png";
      console.log(`💾 ${filePrefix}: downloading ${variant} as ${fmt} (background: ${background})`);

      exportBlob(blob, variant, fmt, background)
        .then((outBlob) => {
          const url = URL.createObjectURL(outBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${filePrefix}-${variant}.${fmt}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          // Give the browser a beat to start the download before revoking.
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        })
        .catch((err) => {
          console.error(`❌ ${filePrefix}: download failed:`, err);
          toast.error("Couldn't prepare that download — please try again.");
        });
    },
    [filePrefix, emptyMessage],
  );

  // Cancel the in-flight run: bump the token so its result is discarded, and
  // drop back to the empty state.
  const cancel = useCallback(() => {
    tokenRef.current += 1;
    setResultBlob(null);
    setProcessing(false);
    setFailed(false);
    setUploadProgress(0);
  }, [setResultBlob]);

  const reset = useCallback(() => {
    tokenRef.current += 1; // cancel any in-flight run
    setResultBlob(null);
    setProcessing(false);
    setFailed(false);
    setUploadProgress(0);
    markSaved();
  }, [markSaved, setResultBlob]);

  return {
    resultImage,
    processing,
    failed,
    uploadProgress,
    isDirty,
    markSaved,
    saveToGallery,
    run,
    update,
    download,
    cancel,
    reset,
    // Advanced: let a tool (e.g. Flat Lay) swap the result blob in place after
    // the user edits the on-screen composition, so Download/Save stay in sync.
    setResultBlob,
  };
}

/** Re-encode a full-res PNG result for a size/format/background request. */
export async function exportBlob(blob, variant, fmt, background = "transparent") {
  const hasBackground = background && background !== "transparent";
  // Full-size transparent PNG is exactly the stored blob — no re-encode needed.
  if (variant === "hd" && fmt === "png" && !hasBackground) return blob;

  const bitmap = await createImageBitmap(blob);
  const scale =
    variant === "preview"
      ? Math.min(1, PREVIEW_MAX_PX / Math.max(bitmap.width, bitmap.height))
      : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (hasBackground || fmt === "jpg") {
    // Fill the chosen background under the result. JPG has no alpha, so it
    // always gets one — white unless a swatch was picked.
    ctx.fillStyle = hasBackground ? background : "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (out) => (out ? resolve(out) : reject(new Error("Encoding failed"))),
      fmt === "jpg" ? "image/jpeg" : "image/png",
      0.92,
    );
  });
}
