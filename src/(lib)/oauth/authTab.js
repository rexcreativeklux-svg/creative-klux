// authTab.js
// ─────────────────────────────────────────────────────────────────────────────
// Every integration connect runs its provider login in a NEW BROWSER TAB. The
// Integrations page stays where it is (its Connect button spinning) and flips
// to Connected / Connect when the tab reports back.
//
// A tab rather than a sized popup window: the login is a normal top-level page,
// so nested sign-ins (an X account that logs in with Google) work there just as
// they did with the old full-page redirect — without navigating our page away.
//
// Two delivery paths, because some providers send Cross-Origin-Opener-Policy
// headers that cut the tab off from `window.opener` mid-flow:
//   • window.opener.postMessage — when the link survives
//   • a BroadcastChannel        — same-origin, needs no opener at all
// Listeners settle on the first one and ignore the duplicate.

export const OAUTH_CHANNEL = "creativeklux-oauth";

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
 * `tab.closed` alone is not proof — when a provider's COOP header severs the
 * opener, the handle reads closed while the login is still running in it. But
 * the user is looking at that tab then, not at ours; so "closed while our page
 * is visible" is what an actual cancel looks like.
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

/**
 * The provider redirected back to one of OUR callback pages: hand the result
 * to the waiting Integrations page over both paths, then close this tab. A
 * browser may refuse the close (a severed tab no longer counts as script-
 * opened), so the callback page also tells the user they can close it.
 */
export function reportToOpener(payload) {
  try {
    const channel = new BroadcastChannel(OAUTH_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch {
    /* BroadcastChannel unsupported — the opener path below still runs */
  }
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
    }
  } catch {
    /* opener severed — the broadcast above carried it */
  }
  window.close();
}
