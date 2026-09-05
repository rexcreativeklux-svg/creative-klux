/**
 * elementClipboard — copying elements THROUGH the system clipboard rather than
 * beside it.
 *
 * ── Why not just keep an array in state ───────────────────────────────────
 *
 * The obvious design is an in-editor clipboard variable, and it gets the
 * precedence question wrong in a way the user feels immediately: after copying
 * an element, is Ctrl+V "paste my element" or "paste the screenshot I just
 * took"? With two clipboards there is no answer — whichever one the code checks
 * first wins, and the other silently loses, forever.
 *
 * So the element goes INTO the system clipboard, as JSON behind a magic key.
 * Then there is one clipboard, the most recent copy wins because that is what
 * a clipboard is, and pasting a design element into another editor tab works
 * for free. The paste handler reads `text/plain` off the paste event — no
 * permission prompt, no async read.
 *
 * The in-memory mirror kept by the caller is not a second clipboard: it is only
 * there so the pill's Paste button can be enabled/disabled without reading the
 * system clipboard (which is async and permission-gated), and so Paste still
 * works if the async WRITE was refused.
 */

// Versioned: a future shape change must not be silently mis-read by an older
// tab that is still open on the same clipboard contents.
const MAGIC = "creative-klux/design-elements@1";

/** Serialise elements for the clipboard. */
export function encodeElements(elements) {
  return JSON.stringify({ [MAGIC]: elements });
}

/**
 * Elements out of pasted clipboard text, or null when the text is anything
 * else — ordinary text, a URL, another app's JSON. Never throws: unparseable
 * input is simply "not ours", which is the caller's cue to treat the paste as
 * plain text.
 *
 * @param {string} text
 * @returns {object[]|null}
 */
export function decodeElements(text) {
  if (!text || typeof text !== "string") return null;
  // Cheap reject before parsing: most pastes are prose, and JSON.parse on a
  // long document is not free.
  if (!text.includes(MAGIC)) return null;
  try {
    const payload = JSON.parse(text);
    const list = payload?.[MAGIC];
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}

/**
 * Put elements on the system clipboard. Best-effort: the async Clipboard API
 * needs a focused document and a secure context, and refuses often enough that
 * a rejection has to be survivable — the caller's mirror is what keeps Paste
 * working when it is.
 *
 * @returns {Promise<boolean>} whether the system clipboard actually took it.
 */
export async function writeElementsToClipboard(elements) {
  if (!elements?.length) return false;
  try {
    await navigator.clipboard.writeText(encodeElements(elements));
    return true;
  } catch {
    return false;
  }
}
