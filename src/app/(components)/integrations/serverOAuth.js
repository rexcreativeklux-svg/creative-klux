// serverOAuth.js
// ─────────────────────────────────────────────────────────────────────────────
// Popup flow for providers whose OAuth the BACKEND owns (Google Workspace,
// Outlook). The browser never sees a code or a token: it asks the API for a
// consent URL, opens it in a popup, and the API's callback page posts the
// outcome back to us and closes itself.
//
// The popup is opened BEFORE the API call, synchronously inside the click, so
// popup blockers still count it as user-initiated; it is pointed at the consent
// URL once that arrives.

// The callback page is served from the API, so its messages come from here.
export const API_ORIGIN = "https://api.creativeklux.com";

const POPUP_FEATURES = "width=520,height=680,menubar=no,toolbar=no";

/**
 * Run one server-owned connect.
 *
 * @param {() => Promise<{ok: boolean, redirect_url?: string, message?: string}>} getConsentUrl
 *   Calls POST /integrations/{platform}/connect.
 * @returns {Promise<
 *   | { status: "success", message: string, accountLabel?: string }
 *   | { status: "error", message: string }
 *   | { status: "closed" }
 *   | { status: "blocked" }
 * >}
 */
export async function runServerOAuth(getConsentUrl) {
  const popup = window.open("", "ck-oauth", POPUP_FEATURES);
  if (!popup) return { status: "blocked" };

  const started = await getConsentUrl();
  if (!started.ok) {
    popup.close();
    return {
      status: "error",
      message: started.message || "Couldn't start the connection.",
    };
  }
  // Single-use, signed URL — opened exactly as given.
  popup.location.href = started.redirect_url;

  return new Promise((resolve) => {
    const onMessage = (event) => {
      // The callback posts with '*' as its target, so the origin check is what
      // stops any other page from faking a success.
      if (event.origin !== API_ORIGIN) return;
      if (event.data?.source !== "creativeklux-oauth") return;

      cleanup();
      resolve(
        event.data.success
          ? {
              status: "success",
              message: event.data.message,
              accountLabel: event.data.account_label,
            }
          : {
              status: "error",
              message: event.data.message || "Connection failed.",
            },
      );
    };

    // The user can close the popup without finishing — no message arrives.
    const poll = setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve({ status: "closed" });
      }
    }, 500);

    function cleanup() {
      clearInterval(poll);
      window.removeEventListener("message", onMessage);
      if (!popup.closed) popup.close();
    }

    window.addEventListener("message", onMessage);
  });
}
