"use client";

import { toast } from "sonner";

/**
 * persistBlob — the two-step dance every AI tool in this editor follows for a
 * locally-produced image: show a `URL.createObjectURL` blob URL instantly
 * (undoable, on-screen the moment the model finishes), then upload it and swap
 * in whatever durable URL comes back.
 *
 * A blob: URL only exists in this tab. Left as the element's `src`, the picture
 * a background-removal, an enhance or a lift produced would render fine right
 * now and then quietly vanish on reload or on another device — this is what
 * DesignEditor's own crop/erase/BG-remover handlers do to avoid that, pulled
 * out so the new AI tool panels can follow the same rule instead of each
 * reinventing it.
 *
 * Colocated under panels/image: every caller is one of that folder's tool
 * sections.
 */

/**
 * Upload a blob and return the durable URL, or null on failure (toasts once).
 * Does not touch element state — callers decide what to do with the URL.
 *
 * @param {(file: File) => Promise<any>} uploadMedia from useAuth()
 * @param {Blob} blob
 * @param {string} filename
 * @param {string} [failMessage]
 */
export async function uploadDurableUrl(uploadMedia, blob, filename, failMessage) {
  try {
    const file = new File([blob], filename, { type: blob.type || "image/png" });
    const res = await uploadMedia(file);
    return (
      res?.url || res?.data?.url || res?.image_url || res?.data?.image_url || null
    );
  } catch {
    toast.error(failMessage || "Upload failed — it won't persist after save.");
    return null;
  }
}

/**
 * The full dance for a tool that overwrites the SELECTED element's own `src`
 * (BG Remover, Enhance): show the blob locally as one undo step, then replace
 * it with the durable URL as a second, non-recorded step so undo doesn't have
 * to know the swap happened.
 *
 * @param {object} editor           the useDesignEditor() return value
 * @param {string} id               element id to patch
 * @param {Blob} blob
 * @param {(url: string) => void} uploadMedia
 * @param {string} filename
 * @param {object} [localPatch]     extra fields to set alongside `src` locally
 *   (merged into both the local and the durable patch)
 */
export async function commitBlobToElement(
  editor,
  id,
  blob,
  uploadMedia,
  filename,
  localPatch = {},
) {
  const localUrl = URL.createObjectURL(blob);
  editor.updateElement(id, { ...localPatch, src: localUrl }, { record: true });
  const url = await uploadDurableUrl(uploadMedia, blob, filename);
  if (url) editor.updateElement(id, { ...localPatch, src: url }, { record: false });
  return url || localUrl;
}
