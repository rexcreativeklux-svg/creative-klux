/**
 * inviteUrl.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Helpers for the brand-invite flow:
 *
 *   • Building the public, shareable invite link the app displays/copies
 *     (e.g. https://app.creativeklux.com/invites/{token}).
 *   • Persisting a "pending invite" across the login / register → verify → login
 *     hops, so an unauthenticated invitee who has to sign up first still lands
 *     back on their invite page once they're authenticated.
 *
 * The link base comes from NEXT_PUBLIC_APP_URL (set per environment). When that
 * var is empty we fall back to the current browser origin, so local + staging
 * still produce working links without extra config.
 */

// Public invite page route: /invites/{token}
export const INVITE_ROUTE = "/invites";

// localStorage key that carries the invite token through an auth detour.
export const PENDING_INVITE_KEY = "ck_pending_invite";

/**
 * Resolve the front-end origin used to build invite links.
 * Priority: NEXT_PUBLIC_APP_URL → current browser origin → "".
 */
export const getAppOrigin = () => {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured && configured.trim()) {
    // Drop any trailing slash so we don't build "…//invites/…".
    return configured.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "";
};

/** Build the full public invite URL for a bare token. */
export const buildInviteUrl = (token) => {
  if (!token) return "";
  return `${getAppOrigin()}${INVITE_ROUTE}/${token}`;
};

/** Build the in-app relative path for the invite page (used for router / returnTo). */
export const buildInvitePath = (token) => {
  if (!token) return "";
  return `${INVITE_ROUTE}/${token}`;
};

/**
 * Normalize whatever the backend hands back for an invite (a full URL or a bare
 * token) into a full, shareable invite URL. If it's already an http(s) URL we
 * keep it as-is; otherwise we treat the last path segment as the token and build
 * the link ourselves.
 */
export const normalizeInviteUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const token = String(value).split("/").filter(Boolean).pop();
  return buildInviteUrl(token);
};

// ── Pending-invite persistence (survives the auth detour) ─────────────────────
export const getPendingInvite = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PENDING_INVITE_KEY) || null;
  } catch {
    return null;
  }
};

export const setPendingInvite = (token) => {
  if (typeof window === "undefined" || !token) return;
  try {
    localStorage.setItem(PENDING_INVITE_KEY, token);
  } catch (err) {
    console.warn("⚠️ Couldn't persist pending invite:", err?.message || err);
  }
};

export const clearPendingInvite = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    /* no-op */
  }
};
