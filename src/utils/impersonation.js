/**
 * impersonation.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Marks the current browser session as an admin impersonation ("Login as User").
 *
 * The admin app mints a *user* token and hands it to /impersonate, which stores it
 * exactly like a normal login (see src/app/impersonate/page.jsx). That is deliberate —
 * every request, guard and hook then works unchanged — but it also means nothing in
 * the app can tell an impersonated session apart from a real one, and the backend
 * does not stamp the token either.
 *
 * So the flag is set here, on this side. /impersonate is a dedicated route that is
 * reached for nothing else, so arriving there IS the signal; no marker has to travel
 * from the admin app and no two repos have to stay in sync.
 *
 * What it's for: the email-verification gate in the dashboard layout. An admin
 * logging in as a user with an unverified email would otherwise be bounced straight
 * to /verify-email — a code sent to an address the admin cannot read — making those
 * accounts impossible to inspect. See src/app/(dashboard)/layout.js.
 *
 * The flag lives in localStorage so its lifetime matches the token's exactly: written
 * beside it, and cleared in the same three places the token is (the hand-off page's
 * pre-clear, logout, and a normal login). There is no state where a valid token is
 * still present but the flag has silently vanished.
 *
 * ⚠️ This is a UX gate, not a security boundary. Being client-side it can be set by
 * hand in devtools, exactly like the verification redirect it relaxes — which is
 * itself only a client-side `router.replace`. Anything that must actually be denied
 * to an unverified user has to be enforced by the API.
 */

// localStorage key flagging the stored token as an impersonation hand-off.
export const IMPERSONATION_KEY = "ck_impersonating";

/** Flag the session that is about to be stored as an admin impersonation. */
export const markImpersonating = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(IMPERSONATION_KEY, "1");
  } catch (err) {
    // Non-fatal: the sign-in still works, the admin just hits the verification
    // gate if this user's email is unverified.
    console.warn(
      "⚠️ Couldn't flag the session as impersonated:",
      err?.message || err,
    );
  }
};

/** True when the token in this browser came from an admin impersonation hand-off. */
export const isImpersonating = () => {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(IMPERSONATION_KEY) === "1";
  } catch {
    return false;
  }
};

/** Drop the flag. Called wherever the session token itself is cleared or replaced. */
export const clearImpersonating = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(IMPERSONATION_KEY);
  } catch {
    /* no-op */
  }
};
