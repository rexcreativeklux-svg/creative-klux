"use client";

/**
 * Turning a picked picture into a File the Ad Intelligence endpoints accept.
 *
 * ⚠️ THESE ENDPOINTS ONLY TAKE FILES. A Magic Studio result is a hosted URL, so
 * it is fetched and sent like an upload. Anything over the 2MB upload limit is
 * re-encoded just under it. Used by Creative Comparison and Ad Guard AI.
 */

import { fetchHostedBlob } from "@/app/(components)/product-studio/saveToGallery";

// The endpoints reject images over 2MB ("The uploaded image exceeds 2MB").
// Magic Studio renders and phone photos are routinely bigger, so a file over the
// line is re-encoded here — just under it, to leave room for headers.
const UPLOAD_LIMIT = 2 * 1024 * 1024;
const TARGET = UPLOAD_LIMIT * 0.95;
const MAX_SIDE = 2048; // plenty for scoring a creative

/**
 * A file the endpoint will accept: unchanged when already under the limit,
 * otherwise scaled to at most MAX_SIDE and re-encoded as JPEG at the highest
 * quality that fits.
 */
export async function fitUploadLimit(file, base) {
  if (file.size <= TARGET) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  // JPEG has no alpha — a transparent PNG would otherwise go black behind it.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  for (const quality of [0.92, 0.85, 0.75, 0.6, 0.45]) {
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && blob.size <= TARGET) {
      console.log(
        `🗜️ [ad-intelligence] ${base}: ${(file.size / 1048576).toFixed(1)}MB → ${(blob.size / 1048576).toFixed(1)}MB`,
      );
      return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
    }
  }
  throw new Error("That image is too large to check, even after compressing it.");
}

/** A hosted picture (e.g. a Magic Studio result) as an upload-ready File. */
export async function hostedImageToFile(url, label = "creative") {
  const base = (label || "creative").replace(/\W+/g, "-");
  const blob = await fetchHostedBlob(url);
  const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
  const file = new File([blob], `${base}.${ext}`, {
    type: blob.type || "image/png",
  });
  return fitUploadLimit(file, base);
}
