// src/utils/authErrors.js
//
// Turn an auth error into a message that's safe and clear to show a user, while
// the caller logs the real error for debugging.
//
// Backend messages that are already human-readable (e.g. "Invalid credentials",
// "The email has already been taken.") pass through unchanged. Technical / raw
// errors — 404 route messages ("Endpoint not found."), network/CORS failures,
// HTML error pages, JSON parse noise, 5xx text — are masked with a friendly
// fallback so users never see internal plumbing.
//
// Usage (in a catch block):
//   console.error("❌ sendVerificationCode:", err);            // real error for devs
//   toast.error(toUserMessage(err, "Couldn't send the reset link."));

const TECHNICAL_ERROR_PATTERNS = [
  /endpoint not found/i,
  /\bnot\s*found\b/i,
  /failed to fetch/i,
  /load failed/i,
  /network\s*error/i,
  /networkerror/i,
  /\berr_[a-z_]+/i,
  /\bcors\b/i,
  /unexpected token/i,
  /is not valid json/i,
  /invalid response/i,
  /unexpected server response/i,
  /<!doctype/i,
  /<html/i,
  /internal server error/i,
  /bad gateway/i,
  /service unavailable/i,
  /gateway timeout/i,
  /timeout/i,
  /\b(4\d{2}|5\d{2})\b/, // bare HTTP status codes leaking into a message
];

/**
 * @param {unknown} error    The caught error (Error, string, or anything).
 * @param {string}  fallback User-facing message for technical/unknown errors.
 * @returns {string} A message safe to display to the user.
 */
export function toUserMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  const raw =
    typeof error === "string" ? error.trim() : (error?.message || "").trim();

  if (!raw) return fallback;
  if (TECHNICAL_ERROR_PATTERNS.some((re) => re.test(raw))) return fallback;

  // Looks like a human-facing backend message — safe to show as-is.
  return raw;
}

/**
 * Bridge a `classifyResult()` outcome (see utils/errorHelper.js) into a
 * categorized, user-safe Error and throw it — the single failure path shared by
 * every auth function so all sign-in/up pages behave consistently.
 *
 * It does two jobs at once:
 *  1. Logs rich, dev-only diagnostics to the console so the *true* cause is
 *     always visible while debugging — including an explicit CORS / connectivity
 *     hint whenever the request never reached the server (a thrown `fetch` gives
 *     no HTTP status, which is how we tell a transport failure from a real
 *     4xx/5xx). Note: the browser blocks CORS responses before JS can read them,
 *     so `fetch` only ever surfaces an opaque "Failed to fetch" — this hint is
 *     the most JS can know; the actual fix is the server's CORS headers.
 *  2. Throws an `Error` whose `message` is safe to show the user, and never
 *     blames credentials for a network/server fault. The error also carries
 *     `.source`, `.status` and `.messageForDevs` for any caller that wants them.
 *
 * @param {string} context  Short label used in logs, e.g. "login".
 * @param {object} result   The object returned by `classifyResult()`.
 * @param {string} fallback User-facing message for credential / unknown 4xx cases.
 * @throws {Error} Always throws — carries `.source`, `.status`, `.messageForDevs`.
 */
export function throwClassifiedAuthError(context, result = {}, fallback) {
  const status = result.status;
  const devMsg = result.messageForDevs || result.message || "Unknown error";
  // No HTTP status => `fetch` threw before any response arrived =>
  // network / CORS / DNS / timeout (a "transport" failure).
  const isTransport = !status;

  if (isTransport) {
    console.error(
      `❌ ${context} — couldn't reach the server (network / CORS / DNS / timeout).` +
        `\n   ⚠️  Usually a server CORS or connectivity issue — NOT wrong credentials.` +
        `\n   ⚠️  The browser hides CORS details from JS; check the server's` +
        ` Access-Control-Allow-Origin header and the Network tab's preflight (OPTIONS).` +
        `\n   Raw: ${devMsg}`,
    );
  } else {
    console.error(
      `❌ ${context} failed [${result.source}] (HTTP ${status}): ${devMsg}`,
      result.errors ? { fieldErrors: result.errors } : "",
    );
  }

  let userMessage;
  if (isTransport) {
    userMessage =
      "We couldn't reach the server. Please check your connection and try again.";
  } else if (result.source === "rate_limit") {
    // classifyResult already crafted a friendly quota/rate-limit message.
    userMessage = result.message || fallback;
  } else if (status >= 500) {
    userMessage = "Something went wrong on our end. Please try again shortly.";
  } else if (result.source === "validation") {
    // Surface every field error the backend flagged (e.g. "The email has
    // already been taken."), falling back to the first one classifyResult kept.
    const errs =
      result.errors && typeof result.errors === "object" ? result.errors : null;
    const all = errs ? Object.values(errs).flat().filter(Boolean) : [];
    userMessage = all.length ? all.join(", ") : result.message || fallback;
  } else {
    // Other 4xx (401/403/404/400…): the backend's own message is usually the
    // clearest ("Invalid credentials"). Fall back when it's absent or a bare
    // "Unauthorized" placeholder that would confuse a user on a login form.
    const raw = (result.messageForDevs || "").trim();
    userMessage = raw && raw.toLowerCase() !== "unauthorized" ? raw : fallback;
  }

  const err = new Error(userMessage);
  err.source = result.source;
  err.status = status;
  err.messageForDevs = devMsg;
  throw err;
}
