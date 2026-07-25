"use client";

// app/(components)/studio/useGalleryUpload.js
// ─────────────────────────────────────────────────────────────────────────────
// The "+" button's engine: take files off the user's desktop, push them into the
// user's gallery via the shared AuthContext uploader, and hand back hosted URLs
// the composer can attach to a prompt.
//
// It reuses the app's existing upload pipeline rather than inventing one:
//   • getFileCategory + FILE_LIMITS (utils/helpers) → the same type/size rules
//     the gallery page enforces, so a file accepted here is accepted there.
//   • uploadMedia (AuthContext) → POST multipart /gallery, which throws errors
//     already classified into { message, source, messageForDevs }.
//
// FEEDBACK CONTRACT — every failure tells the user something they can act on
// while the real cause goes to the console for debugging:
//   • storage/quota exhausted → names the limit and points at upgrading
//   • file too large / wrong type → names the file and the actual limit
//   • auth lapse → tells them to sign in again
//   • network → tells them it's the connection
// The console always carries `messageForDevs` (the backend's exact words), which
// the user-facing copy deliberately hides.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { FILE_LIMITS, getFileCategory } from "@/utils/helpers";

/** Friendly megabyte label for a byte limit (5242880 → "5MB"). */
const asMB = (bytes) => `${Math.round(bytes / (1024 * 1024))}MB`;

/**
 * Detect a storage/quota rejection. The backend surfaces these inconsistently —
 * a real 429, a 403/422 with a message, or a 5xx wrapping an upstream quota
 * error — so we check the classified `source` first, then sniff the wording.
 *
 * @param {{source?: string, message?: string, messageForDevs?: string}} err
 * @returns {boolean}
 */
function isStorageOrQuotaError(err) {
  if (err?.source === "rate_limit") return true;
  const haystack = `${err?.message || ""} ${err?.messageForDevs || ""}`.toLowerCase();
  return (
    haystack.includes("storage") ||
    haystack.includes("quota") ||
    haystack.includes("space") ||
    haystack.includes("plan limit") ||
    haystack.includes("exceeded")
  );
}

/**
 * Pull the hosted URL out of an upload response. `uploadMedia` returns the raw
 * body, whose shape varies by route — check every field the API is known to use
 * before giving up.
 *
 * @param {unknown} response
 * @returns {string|null}
 */
function extractUrl(response) {
  if (!response) return null;
  if (typeof response === "string") return response;

  const body = response?.data && typeof response.data === "object" ? response.data : response;
  const candidates = [
    body?.image_url,
    body?.url,
    body?.file_url,
    body?.media_url,
    body?.src,
    body?.path,
    response?.image_url,
    response?.url,
  ];
  return candidates.find((value) => typeof value === "string" && value) || null;
}

/**
 * @typedef {object} Attachment
 * @property {string} id        Stable key for React lists.
 * @property {string} url       Hosted gallery URL — what gets sent with the prompt.
 * @property {string} name      Original file name.
 * @property {string} category  "image" | "video" | "audio" | "document".
 * @property {string|null} previewUrl Local object URL, images only (revoked on remove).
 */

/**
 * Upload-to-gallery for the prompt composer.
 *
 * @returns {{
 *   attachments: Attachment[], uploading: boolean,
 *   addFiles: (files: FileList|File[]) => Promise<void>,
 *   removeAttachment: (id: string) => void,
 *   clearAttachments: () => void,
 * }}
 */
export default function useGalleryUpload() {
  const { uploadMedia } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  // Mirror of attachments so clearAttachments can revoke every object URL
  // without depending on (and being re-created by) the list itself. Synced in an
  // effect rather than during render — a ref write during render is a no-no.
  const attachmentsRef = useRef(attachments);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const addFiles = useCallback(
    async (fileList) => {
      const incoming = Array.from(fileList || []);
      if (!incoming.length) return;

      if (typeof uploadMedia !== "function") {
        console.error("❌ [composer-upload] uploadMedia unavailable — user is not authenticated");
        toast.error("Please sign in again to attach files.");
        return;
      }

      // 1. Validate locally first — a rejection here costs no bandwidth and the
      //    message can name the exact limit that was broken.
      const valid = [];
      for (const file of incoming) {
        const category = getFileCategory(file);
        if (!category) {
          console.warn(`⚠️ [composer-upload] unsupported type "${file.type}" for ${file.name}`);
          toast.error(`${file.name} isn't a supported file type.`);
          continue;
        }
        if (file.size > FILE_LIMITS[category]) {
          console.warn(
            `⚠️ [composer-upload] ${file.name} is ${asMB(file.size)}, over the ${category} limit`,
          );
          toast.error(
            `${file.name} is too large — the limit for ${category}s is ${asMB(FILE_LIMITS[category])}.`,
          );
          continue;
        }
        valid.push({ file, category });
      }
      if (!valid.length) return;

      // 2. Upload sequentially so one failure can't cancel the rest, and the
      //    progress toast stays truthful about which file is in flight.
      setUploading(true);
      const toastId = toast.loading(
        valid.length === 1 ? `Uploading ${valid[0].file.name}…` : `Uploading ${valid.length} files…`,
      );

      const uploaded = [];
      let storageBlocked = false;
      let lastError = null;

      for (const { file, category } of valid) {
        try {
          console.log(`💾 [composer-upload] uploading ${file.name} (${asMB(file.size)}, ${category})`);
          const response = await uploadMedia(file);
          const url = extractUrl(response);

          if (!url) {
            console.error("❌ [composer-upload] upload succeeded but no URL in response:", response);
            lastError = { message: "The file uploaded but we didn't get a link back." };
            continue;
          }

          uploaded.push({
            id: `${Date.now()}-${file.name}-${uploaded.length}`,
            url,
            name: file.name,
            category,
            previewUrl: category === "image" ? URL.createObjectURL(file) : null,
          });
          console.log(`✅ [composer-upload] ${file.name} → ${url}`);
        } catch (err) {
          lastError = err;
          console.error(
            `❌ [composer-upload] ${file.name} failed [${err?.source || "unknown"}]:`,
            err?.messageForDevs || err?.message || err,
          );
          // A storage wall applies to every remaining file — stop early rather
          // than firing doomed requests.
          if (isStorageOrQuotaError(err)) {
            storageBlocked = true;
            break;
          }
        }
      }

      setUploading(false);
      if (uploaded.length) setAttachments((prev) => [...prev, ...uploaded]);

      // 3. Resolve the one toast with an outcome the user can act on.
      if (storageBlocked) {
        const stalled = valid.length - uploaded.length;
        toast.error(
          uploaded.length
            ? `Your storage is full — ${uploaded.length} file(s) made it, ${stalled} couldn't. Free up space or upgrade your plan to add the rest.`
            : "Your storage is full — free up space in your gallery or upgrade your plan to attach files.",
          { id: toastId, duration: 7000 },
        );
        return;
      }

      if (uploaded.length === valid.length) {
        toast.success(
          uploaded.length === 1 ? "File attached" : `${uploaded.length} files attached`,
          { id: toastId },
        );
        return;
      }

      if (uploaded.length) {
        toast.warning(
          `${uploaded.length} of ${valid.length} files attached — ${lastError?.message || "the rest failed"}`,
          { id: toastId, duration: 6000 },
        );
        return;
      }

      toast.error(lastError?.message || "We couldn't attach those files. Please try again.", {
        id: toastId,
        duration: 6000,
      });
    },
    [uploadMedia],
  );

  const removeAttachment = useCallback((id) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    attachmentsRef.current.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setAttachments([]);
  }, []);

  return { attachments, uploading, addFiles, removeAttachment, clearAttachments };
}
