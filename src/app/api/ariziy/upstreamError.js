/**
 * The most useful `detail` available from a failed Ariziy response.
 *
 * Ariziy's own errors are JSON with a `detail` — a missing field, an unknown
 * voice, an unsupported audio type — and those are worth forwarding verbatim,
 * because they name the thing to fix.
 *
 * ⚠️ A 502 IS NOT ONE OF THOSE. It never reaches the app: Cloudflare answers it,
 * and what Cloudflare sends depends on who asked. curl gets `error code: 502` as
 * plain text; a browser gets a full HTML error page, so forwarding the first 200
 * characters of the body puts `<!DOCTYPE html>` and a run of IE6 conditional
 * comments in the response where the reason should be. That is not truncation
 * losing detail — there was never any detail in it to lose.
 *
 * So: JSON detail wins, an HTML body is named for what it is, and anything else
 * is passed through trimmed.
 *
 * @param {string} raw The upstream response body.
 * @param {number} status Its HTTP status.
 * @returns {string|object|Array|null}
 */
export function upstreamDetail(raw, status) {
  try {
    const detail = JSON.parse(raw)?.detail;
    if (detail) return detail;
  } catch {
    // Not JSON — handled below.
  }

  if (/^\s*<(!doctype|html)/i.test(raw || "")) {
    return `Upstream returned an HTML error page (HTTP ${status}) — the request never reached the Ariziy application.`;
  }

  const trimmed = raw?.trim().slice(0, 200);
  return trimmed || null;
}
