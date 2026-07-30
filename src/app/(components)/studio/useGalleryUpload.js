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
import { FILE_LIMITS, getFileCategory, describeSupportedTypes } from "@/utils/helpers";

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
 * Pull the uploaded record out of an upload response.
 *
 * POST /gallery answers with the record nested under `file`:
 *
 *   {
 *     "success": true,
 *     "message": "File uploaded successfully",
 *     "file": {
 *       "id": 2294,
 *       "type": "image",
 *       "image_url": "https://d3r8chxzp8ea06.cloudfront.net/creativeklux/…webp",
 *       "image_name": "perspective sight of 2 paper bags mockup on wooden table",
 *       "s3_key": "creativeklux/…webp",
 *       "size_mb": 0.3,
 *       …
 *     }
 *   }
 *
 * `data` and the bare root are also accepted, because AuthContext's uploadMedia
 * returns whatever the route hands back and other gallery surfaces in this app
 * read `data.image_url` / `image_url` directly.
 *
 * @param {unknown} response
 * @returns {{url: string, id: string|number|null, name: string|null, type: string|null}|null}
 */
function extractUploadedFile(response) {
  if (!response) return null;
  if (typeof response === "string") return { url: response, id: null, name: null, type: null };

  // Ordered by how the API actually answers: `file` is the real shape today.
  const containers = [response.file, response.data?.file, response.data, response];

  for (const container of containers) {
    if (!container || typeof container !== "object") continue;
    const url = container.image_url || container.url || container.file_url;
    if (typeof url === "string" && url) {
      return {
        url,
        id: container.id ?? null,
        name: container.image_name ?? null,
        type: typeof container.type === "string" && container.type ? container.type : null,
      };
    }
  }
  return null;
}

/**
 * @typedef {object} Attachment
 * @property {string} id        Stable key for React lists — the gallery record id when the API sends one.
 * @property {string} url       Hosted gallery URL — what gets sent with the prompt.
 * @property {string} name      File name (the backend's `image_name`, else the local one).
 * @property {string} category  "image" | "video" | "audio" | "document".
 * @property {string|null} previewUrl Local object URL, images only (revoked on remove).
 */

/**
 * Upload-to-gallery for the prompt composer.
 *
 * @param {object} [options]
 * @param {string[]} [options.allowedCategories] Restrict to these categories
 *   ("image" | "video" | "audio" | "document"). Omit to accept everything the
 *   gallery accepts. The chat surfaces pass ["image"] because the AI chat API
 *   only carries an `images` array — see creativeAiChat.
 * @param {number} [options.maxFiles] Hard cap on how many attachments may be
 *   held at once. The chat surfaces pass 10 to match the API's `max:10`, so an
 *   over-limit send is stopped here with a clear message instead of 422-ing.
 * @returns {{
 *   attachments: Attachment[], uploading: boolean,
 *   addFiles: (files: FileList|File[]) => Promise<void>,
 *   removeAttachment: (id: string) => void,
 *   clearAttachments: () => void,
 * }}
 */
export default function useGalleryUpload({
  allowedCategories,
  maxFiles,
} = {}) {
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
          toast.error(
            `${file.name} isn't a supported file type. Supported: ${describeSupportedTypes(allowedCategories)}.`,
          );
          continue;
        }
        // Surface-level restriction (the chat surfaces are images-only). The
        // file picker's `accept` already steers the dialog, but a drag-drop or
        // an "All files" override can still land anything here.
        if (allowedCategories && !allowedCategories.includes(category)) {
          console.warn(
            `⚠️ [composer-upload] ${file.name} is a ${category}; this surface accepts ${allowedCategories.join(", ")} only`,
          );
          toast.error(
            allowedCategories.length === 1 && allowedCategories[0] === "image"
              ? `${file.name} isn't an image — only images can be attached here.`
              : `${file.name} isn't a supported file type here.`,
          );
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

      // 2. Enforce the attachment cap against what's ALREADY attached, so two
      //    separate picks can't add up past the limit. Anything over the line is
      //    dropped here rather than being uploaded and then rejected on send.
      let accepted = valid;
      if (maxFiles) {
        const room = Math.max(0, maxFiles - attachmentsRef.current.length);
        if (valid.length > room) {
          console.warn(
            `⚠️ [composer-upload] ${valid.length} file(s) picked but only ${room} slot(s) left of ${maxFiles}`,
          );
          toast.error(
            room === 0
              ? `You can attach up to ${maxFiles} files — remove one to add another.`
              : `Only ${room} more file${room === 1 ? "" : "s"} can be attached (limit ${maxFiles}).`,
          );
          accepted = valid.slice(0, room);
        }
        if (!accepted.length) return;
      }

      // 3. Upload sequentially so one failure can't cancel the rest, and the
      //    progress toast stays truthful about which file is in flight.
      setUploading(true);
      const toastId = toast.loading(
        accepted.length === 1
          ? `Uploading ${accepted[0].file.name}…`
          : `Uploading ${accepted.length} files…`,
      );

      const uploaded = [];
      let storageBlocked = false;
      let lastError = null;

      for (const { file, category } of accepted) {
        try {
          console.log(`💾 [composer-upload] uploading ${file.name} (${asMB(file.size)}, ${category})`);
          const response = await uploadMedia(file);
          const record = extractUploadedFile(response);

          if (!record) {
            console.error(
              "❌ [composer-upload] upload succeeded but no URL in response:",
              response,
            );
            lastError = { message: "The file uploaded but we didn't get a link back." };
            continue;
          }

          uploaded.push({
            // Prefer the gallery record's own id so the key is stable and the
            // attachment can be traced back to the row it created.
            id: record.id != null ? String(record.id) : `${Date.now()}-${uploaded.length}`,
            url: record.url,
            name: record.name || file.name,
            category: record.type || category,
            previewUrl: category === "image" ? URL.createObjectURL(file) : null,
          });
          console.log(`✅ [composer-upload] ${file.name} → ${record.url}`);
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

      // 4. Resolve the one toast with an outcome the user can act on.
      if (storageBlocked) {
        const stalled = accepted.length - uploaded.length;
        toast.error(
          uploaded.length
            ? `Your storage is full — ${uploaded.length} file(s) made it, ${stalled} couldn't. Free up space or upgrade your plan to add the rest.`
            : "Your storage is full — free up space in your gallery or upgrade your plan to attach files.",
          { id: toastId, duration: 7000 },
        );
        return;
      }

      if (uploaded.length === accepted.length) {
        toast.success(
          uploaded.length === 1 ? "File attached" : `${uploaded.length} files attached`,
          { id: toastId },
        );
        return;
      }

      if (uploaded.length) {
        toast.warning(
          `${uploaded.length} of ${accepted.length} files attached — ${lastError?.message || "the rest failed"}`,
          { id: toastId, duration: 6000 },
        );
        return;
      }

      toast.error(lastError?.message || "We couldn't attach those files. Please try again.", {
        id: toastId,
        duration: 6000,
      });
    },
    [uploadMedia, allowedCategories, maxFiles],
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
