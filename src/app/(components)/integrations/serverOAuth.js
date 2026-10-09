// serverOAuth.js
// ─────────────────────────────────────────────────────────────────────────────
// Connect flow for providers whose OAuth the BACKEND owns (Google Workspace,
// Outlook). The browser never sees a code or a token: it asks the API for a
// consent URL, opens it in a new tab, and the API's callback page posts the
// outcome back to us and closes itself.
//
// The tab is opened BEFORE the API call, synchronously inside the click, so
// popup blockers still count it as user-initiated; it is pointed at the consent
// URL once that arrives. Same tab mechanics as every other connect — see
// (lib)/oauth/authTab.js.

import { openAuthTab, watchAuthTabClosed } from "@/(lib)/oauth/authTab";

// The callback page is served from the API, so its messages come from here.
export const API_ORIGIN = "https://api.creativeklux.com";

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
  const tab = openAuthTab("ck-oauth");
  if (!tab) return { status: "blocked" };

  const started = await getConsentUrl();
  if (!started.ok) {
    tab.close();
    return {
      status: "error",
      message: started.message || "Couldn't start the connection.",
    };
  }
  // Single-use, signed URL — opened exactly as given.
  tab.location.href = started.redirect_url;

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

    // The user can close the tab without finishing — no message arrives.
    const stopWatching = watchAuthTabClosed(tab, () => {
      cleanup();
      resolve({ status: "closed" });
    });

    function cleanup() {
      stopWatching();
      window.removeEventListener("message", onMessage);
      if (!tab.closed) tab.close();
    }

    window.addEventListener("message", onMessage);
  });
}
