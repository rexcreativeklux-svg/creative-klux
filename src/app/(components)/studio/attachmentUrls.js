// app/(components)/studio/attachmentUrls.js
// ─────────────────────────────────────────────────────────────────────────────
// The chat surfaces' attachment contract, in one place.
//
// HISTORY — worth knowing before changing anything here. Attachments used to be
// folded INTO the message string (text, a blank line, then one bare URL per
// line) because the chat API had no field for them. The API now takes a real
// `images` array, so that encoding is gone: images travel as their own list from
// the composer all the way to the request body, and the message carries only
// what the user actually typed. If you find a stray URL appended to a message,
// it is a leftover from the old scheme, not the current design.
//
// The API's shape (see creativeAiChat in AuthContext) is what drives the limits:
//
//   'message'  => 'required|string|max:2000',
//   'images'   => 'nullable|array|max:10',
//   'images.*' => 'nullable|string|url|max:2048',
//
// …so the composers enforce all four of those up front. A send that would 422 is
// stopped at the button with a message naming the limit, rather than costing a
// round trip to find out.

import { buildAcceptList } from "@/utils/helpers";

/**
 * Categories the chat surfaces accept. The API carries images and nothing else,
 * so a video or PDF has nowhere to go — the pickers restrict to images and
 * useGalleryUpload rejects anything else that slips through (drag-drop, or an
 * "All files" override in the OS dialog).
 */
export const CHAT_ATTACHMENT_CATEGORIES = ["image"];

/**
 * `accept` for the chat surfaces' file inputs — the image extensions the
 * BACKEND accepts, built from the same list every other upload path uses.
 * Not "image/*": that offers .svg/.heic/.tiff, which the API rejects.
 */
export const CHAT_ATTACHMENT_ACCEPT = buildAcceptList(CHAT_ATTACHMENT_CATEGORIES);

/** API `images` cap (`max:10`). Enforced while attaching, not on send. */
export const MAX_CHAT_IMAGES = 10;

/** API `message` cap (`max:2000`), enforced as the composer's maxLength. */
export const MAX_CHAT_MESSAGE = 2000;

/** API `images.*` per-URL cap (`max:2048`). */
const MAX_IMAGE_URL = 2048;

/**
 * Normalise a composer's attachment list into the `images` array the API takes:
 * plain URL strings, nothing longer than the column allows, capped at the limit.
 *
 * Accepts either raw URL strings or the {url} objects useGalleryUpload holds, so
 * both composers can hand their state straight in.
 *
 * @param {(string|{url?: string})[]} attachments
 * @returns {string[]} Hosted image URLs, ready to send.
 */
export function toImagePayload(attachments) {
  const urls = (attachments || [])
    .map((entry) => (typeof entry === "string" ? entry : entry?.url))
    .filter((url) => typeof url === "string" && url.length > 0);

  const withinLength = urls.filter((url) => {
    if (url.length <= MAX_IMAGE_URL) return true;
    console.warn(
      `⚠️ [chat-attachments] dropping an image URL of ${url.length} chars — the API caps them at ${MAX_IMAGE_URL}`,
    );
    return false;
  });

  if (withinLength.length > MAX_CHAT_IMAGES) {
    console.warn(
      `⚠️ [chat-attachments] ${withinLength.length} images given, sending the first ${MAX_CHAT_IMAGES}`,
    );
  }
  return withinLength.slice(0, MAX_CHAT_IMAGES);
}
