// authTab.js
// ─────────────────────────────────────────────────────────────────────────────
// Every integration connect runs its provider login in a NEW BROWSER TAB. The
// page that started it stays where it is (its Connect button spinning) and
// updates when the tab reports back — see integrations/serverOAuth.js.
//
// A tab rather than a sized popup window: the login is a normal top-level page,
// so nested sign-ins (an X account that logs in with Google) work there, without
// navigating our page away.

/**
 * Open an empty tab synchronously inside the click (so popup blockers treat it
 * as user-initiated), to be pointed at the provider once its URL is known.
 * No window features → the browser opens a tab, not a popup window.
 * @returns {Window|null} null when blocked.
 */
export function openAuthTab(name) {
  return window.open("about:blank", name);
}

/**
 * Call `onCancel` once the user has abandoned the tab: it reports closed AND
 * our page is the one being looked at, for `graceMs`.
 *
 * `tab.closed` alone is not proof — when a provider's Cross-Origin-Opener-Policy
 * header severs the opener, the handle reads closed while the login is still
 * running in it. But the user is looking at that tab then, not at ours; so
 * "closed while our page is visible" is what an actual cancel looks like.
 *
 * @returns {() => void} stop watching.
 */
export function watchAuthTabClosed(tab, onCancel, graceMs = 1500) {
  let closedSince = null;
  const id = setInterval(() => {
    if (!tab.closed || document.visibilityState !== "visible") {
      closedSince = null;
      return;
    }
    closedSince ??= Date.now();
    if (Date.now() - closedSince >= graceMs) {
      clearInterval(id);
      onCancel();
    }
  }, 500);
  return () => clearInterval(id);
}
