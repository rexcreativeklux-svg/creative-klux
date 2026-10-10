// serverOAuth.js
// ─────────────────────────────────────────────────────────────────────────────
// The connect flow. Every platform's OAuth is run by the BACKEND: the browser
// asks the API for a consent URL, opens it in a new tab, and the API's callback
// page posts the outcome back to us and closes itself. No code or token is ever
// handled here.
//
// The tab is opened BEFORE the API call, synchronously inside the click, so
// popup blockers still count it as user-initiated; it is pointed at the consent
// URL once that arrives. Tab mechanics live in (lib)/oauth/authTab.js.

import { openAuthTab, watchAuthTabClosed } from "@/(lib)/oauth/authTab";

// The callback page is served from the API, so its messages come from here.
export const API_ORIGIN = "https://api.creativeklux.com";

// The callback's message name. The first connect doc called it
// "creativeklux-oauth"; both are accepted so a rollback on either side still works.
const MESSAGE_SOURCES = ["creativeklux-integrations", "creativeklux-oauth"];

/**
 * Run one connect.
 *
 * @param {() => Promise<{ok: boolean, authorize_url?: string, message?: string}>} getConsentUrl
 *   Calls POST /integrations/{platform}/connect.
 * @returns {Promise<
 *   | { status: "success", message: string, accountLabel?: string,
 *       needsSelection: boolean }   // needsSelection → show the account chooser
 *   | { status: "error", message: string }
 *   | { status: "closed" }          // tab shut without finishing — not a fault
 *   | { status: "blocked" }         // the browser refused to open the tab
 * >}
 */
export async function runServerOAuth(getConsentUrl) {
  const tab = openAuthTab("ck-connect");
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
  tab.location.href = started.authorize_url;

  return new Promise((resolve) => {
    const onMessage = (event) => {
      // The origin check is what stops any other page that can post to this
      // window from claiming a connection succeeded.
      if (event.origin !== API_ORIGIN) return;
      if (!MESSAGE_SOURCES.includes(event.data?.source)) return;

      cleanup();
      resolve(
        event.data.success
          ? {
              status: "success",
              message: event.data.message,
              accountLabel: event.data.account_label,
              needsSelection: !!event.data.needs_selection,
            }
          : {
              status: "error",
              message: event.data.message || "Connection failed.",
            },
      );
    };

    // The user can close the tab without finishing — no message ever arrives,
    // so without this the promise would hang forever.
    const stopWatching = watchAuthTabClosed(tab, () => {
      cleanup();
      resolve({ status: "closed" });
    });

    // The listener is always removed: left attached, the next connect would
    // resolve against this stale promise.
    function cleanup() {
      stopWatching();
      window.removeEventListener("message", onMessage);
      if (!tab.closed) tab.close();
    }

    window.addEventListener("message", onMessage);
  });
}
