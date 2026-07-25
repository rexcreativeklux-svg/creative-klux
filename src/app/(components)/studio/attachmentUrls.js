// app/(components)/studio/attachmentUrls.js
// ─────────────────────────────────────────────────────────────────────────────
// Attachments travel INSIDE the message string — there is no separate
// `attachments` field on the wire. The chat payload stays exactly:
//
//   { message, creative_type, mode, history }
//
// …with `message` a plain string, so the assistant reads the file URLs as part
// of what the user said.
//
// ENCODING (buildMessageWithAttachments): the text, a blank line, then one bare
// URL per line at the end:
//
//   Make me a summer sale ad from these
//
//   https://d3r8chxzp8ea06.cloudfront.net/creativeklux/…-a.webp
//   https://d3r8chxzp8ea06.cloudfront.net/creativeklux/…-b.webp
//
// DECODING (splitMessageAttachments): walks BACKWARDS from the end, taking only
// trailing lines that are bare media URLs. That precision is the point — a URL
// the user typed mid-sentence ("see https://example.com for the brief") is left
// in the text where it belongs, and only the block we appended is lifted out.
// A message may also be URLs alone, which decodes to empty text plus the files.

/**
 * A line that is nothing but a media URL. Extension-anchored on purpose: a bare
 * link with no file extension is prose, not an attachment, and stays in the text.
 */
const MEDIA_URL_LINE =
  /^https?:\/\/\S+\.(?:jpe?g|png|gif|webp|bmp|svg|avif|heic|mp4|webm|mov|mkv|m4v|ogv|mp3|wav|ogg|m4a|aac|flac|opus|pdf|docx?|xlsx?|pptx?|txt|csv|rtf|md)(?:\?\S*)?$/i;

/**
 * Fold attachment URLs into the message string that gets sent.
 *
 * @param {string} text  What the user typed (may be empty for a files-only send).
 * @param {(string|{url?: string})[]} urls Attachment URLs, or objects carrying one.
 * @returns {string} The message to send.
 */
export function buildMessageWithAttachments(text, urls) {
  const body = (text || "").trim();
  const list = (urls || [])
    .map((entry) => (typeof entry === "string" ? entry : entry?.url))
    .filter(Boolean);

  if (!list.length) return body;
  return body ? `${body}\n\n${list.join("\n")}` : list.join("\n");
}

/**
 * Pull the trailing attachment URLs back out of a message for rendering.
 *
 * @param {string} content The stored message string.
 * @returns {{text: string, urls: string[]}} The prose, and the files it carried.
 */
export function splitMessageAttachments(content) {
  const raw = typeof content === "string" ? content : "";
  if (!raw) return { text: "", urls: [] };

  const lines = raw.split("\n");
  const urls = [];
  // Index where the text ends; everything from here on is blanks + URLs.
  let cut = lines.length;

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index].trim();
    if (!line) {
      cut = index; // trailing blank — keep walking back
      continue;
    }
    if (MEDIA_URL_LINE.test(line)) {
      urls.unshift(line);
      cut = index;
      continue;
    }
    break; // real prose — the attachment block is done
  }

  return { text: lines.slice(0, cut).join("\n").trim(), urls };
}
