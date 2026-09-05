/**
 * providerErrors.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Turning a model provider's raw error dump into one line a user can act on —
 * and recognising the class of failure that must NEVER be shown to them.
 *
 * A generation record that failed carries the provider's own message on `error`,
 * and it is frequently something the user can fix ("duration: Input should be
 * '5' or '10'"). Replacing that with "please try again" doesn't just lose detail,
 * it gives the wrong instruction — the same request fails the same way forever.
 *
 * ⚠️ MAGIC STUDIO STILL CARRIES ITS OWN COPY of this logic, in
 * magicStudioConfigs.jsx (readableProviderError). This module was extracted for
 * Product Studio's video poller, which needs exactly the same handling; pointing
 * Magic Studio at it is a one-import change that has not been made yet, so if
 * you fix a case here, fix it there too until it is.
 */

/**
 * Provider failures that are about OUR account rather than the user's request.
 *
 * ⚠️ THESE MUST NEVER REACH THE USER VERBATIM. When the provider's balance runs
 * out it answers with an instruction addressed to the account holder —
 *
 *   {"detail":"User is locked. Reason: Exhausted balance. Top up your balance
 *   at fal.ai/dashboard/billing."}
 *
 * — which, shown in a modal, names our vendor, exposes our billing state, and
 * tells a paying customer to go top up somebody else's account. It is also the
 * one failure they can do nothing about, so detail buys them nothing.
 *
 * Matched against the WHOLE raw string rather than a parsed field: the wording
 * and the shape both move between providers, and this only has to RECOGNISE the
 * class of failure, not parse it.
 */
const PROVIDER_ACCOUNT_ERROR =
  /exhausted balance|top up|user is locked|insufficient (?:funds|balance|credits?)|quota exceeded|out of credits?|billing/i;

/** What we say instead — deliberately silent about whose problem it is. */
const PROVIDER_ACCOUNT_MESSAGE =
  "This tool is temporarily unavailable. Please try again shortly.";

/**
 * Turn a provider's error dump into one readable line.
 *
 *   fal.ai queue result error (fal-ai/kling-video): {"detail":[{"type":
 *   "literal_error","loc":["body","duration"],"msg":"Input should be '5' or
 *   '10'","input":"3", …}]}
 *     → duration: Input should be '5' or '10'
 *
 *   fal.ai queue submit error: {"detail":"User is locked. Reason: Exhausted
 *   balance. Top up your balance at …"}
 *     → This tool is temporarily unavailable. Please try again shortly.
 *
 * Best-effort by design: anything it doesn't recognise comes back untouched, so
 * a change in the provider's error shape costs detail, never the message. Log
 * the raw string at the call site either way.
 *
 * @param {string} raw The recorded error, as the backend stored it.
 * @returns {string}
 */
export function readableProviderError(raw) {
  if (typeof raw !== "string" || !raw.trim()) return "";
  const text = raw.trim();

  // Tested before anything is parsed. An account lock is not a shape worth
  // depending on recognising, and the answer is the same whatever shape it took.
  if (PROVIDER_ACCOUNT_ERROR.test(text)) return PROVIDER_ACCOUNT_MESSAGE;

  const start = text.indexOf("{");
  if (start === -1) return text;
  try {
    const detail = JSON.parse(text.slice(start))?.detail;

    // One provider-level sentence, rather than the per-field array below. Worth
    // returning on its own: the prefix it arrives wrapped in names the vendor
    // and an internal model id, neither of which means anything to the user.
    if (typeof detail === "string" && detail.trim()) return detail.trim();

    if (!Array.isArray(detail) || detail.length === 0) return text;
    const lines = detail
      .map((entry) => {
        if (!entry?.msg) return null;
        // `loc` is the path to the offending field — its last segment is the
        // field name the user actually chose ("duration"), where the earlier
        // ones are envelope ("body").
        const field = Array.isArray(entry.loc) ? entry.loc.at(-1) : null;
        return field ? `${field}: ${entry.msg}` : entry.msg;
      })
      .filter(Boolean);
    return lines.length > 0 ? lines.join(" · ") : text;
  } catch {
    return text;
  }
}
