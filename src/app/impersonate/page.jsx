"use client";

/**
 * Impersonation hand-off page — "Login as User", arriving from the admin app.
 *
 * The admin app mints a *user* session token via
 * `GET {USER_API_URL}/admin/impersonate/{id}` (→ { message, token, user }) and opens a NEW
 * tab at `{USER_WEB_URL}/impersonate#token=<token>`. This page is the only thing on this
 * side that consumes that hand-off.
 *
 * Why the token arrives in the URL *fragment* rather than a query string: fragments are
 * never sent to a server, so the token stays out of access logs, referrer headers and any
 * proxy in between. It is readable only here, in the browser.
 *
 * This route sits at the top level — outside (dashboard), so it is not wrapped in
 * ProtectedRoute, and outside (auth), so it does not get the auth frame. It is reachable
 * without a session because it is what CREATES the session. Holding a valid token is the
 * whole authorisation story; the backend restricts minting one to admins.
 *
 * The token is stored exactly as a normal login stores it (localStorage "token", see
 * saveAuth in AuthContext), so every existing request, guard and hook keeps working with
 * no changes anywhere else in the app.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ImpersonatePage() {
  const [error, setError] = useState("");

  // React runs effects twice in dev (Strict Mode). The first run strips the token from the
  // URL, so a second run would see an empty fragment and wrongly report a broken link.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // window.location only exists on the client, so the hand-off has to run after mount —
    // reading it during render would either crash SSR or produce markup the client
    // immediately contradicts.
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const token = new URLSearchParams(hash).get("token");

    // Strip the token from the address bar and from this history entry immediately —
    // valid or not — so it cannot be re-read, shoulder-surfed or replayed via Back.
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      console.error("❌ Impersonation: no token found in the URL fragment");
      setError(
        "This sign-in link is missing its access token. Please start again from the admin dashboard.",
      );
      return;
    }

    // Clear the previous session on this origin BEFORE storing the new token — the same
    // two keys logout() clears. Dropping the cached "user" matters: AuthProvider renders it
    // straight from localStorage on mount, and fetchProfile deliberately does NOT log out
    // when it fails, so a leftover profile could sit on screen next to someone else's
    // session.
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    console.log("💾 Impersonation: storing session token");
    localStorage.setItem("token", token);

    console.log("✅ Impersonation: signing in and opening the dashboard");

    // Full navigation on purpose. AuthProvider picks the token up in its mount effect,
    // which triggers the usual init() chain (fetchProfile → fetchBrands → teams/images),
    // so a fresh load follows the exact same path a returning user takes — no duplicate
    // /profile call, and no race with the provider already mounted above this page. An
    // expired or invalid token is then handled by the existing flow: authFetch sees the
    // 401, clears the session, and ProtectedRoute sends the tab to /login.
    window.location.replace("/");
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-page px-5">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-surface p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <ShieldAlert className="h-6 w-6 text-red-500" />
          </div>

          <h1 className="text-[17px] font-semibold text-gray-900 sm:text-lg">
            Unable to sign in
          </h1>

          <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
            {error}
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#1447e6] px-4 py-3 text-[13.5px] font-semibold text-white no-underline shadow-[0_4px_14px_rgba(20,71,230,0.28)] transition-colors hover:bg-[#0f3bbf]"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  // Mirrors the auth layout's loading state so the hand-off looks like the rest of the app.
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-page">
      <img src="/logoblue.svg" alt="Creative Klux" className="h-8 w-8" />

      <div className="h-10 w-10 animate-spin rounded-full border-3 border-gray-200 border-t-[#1447e6]" />

      <p className="text-[13px] text-gray-500">Signing you in…</p>
    </div>
  );
}
