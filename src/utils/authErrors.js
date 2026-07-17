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
//   console.error("❌ forgotPassword:", err);            // real error for devs
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
