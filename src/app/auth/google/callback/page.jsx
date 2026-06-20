"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Google's OAuth client is registered with /auth/google/callback (not /oauth-callback),
// so Google redirects here after consent. This page does exactly what /oauth-callback does:
// hand the code back to the opener (popup) or forward to /integrations (full-page redirect).
export default function GoogleOAuthCallback() {
  const params = useSearchParams();

  useEffect(() => {
    try {
      const hash = new URLSearchParams(window.location.hash.replace("#", ""));
      const access_token = hash.get("access_token");
      const code = params.get("code");

      const rawState =
        hash.get("state") ||
        params.get("state") ||
        params.get("platform");

      // Strip the _timestamp suffix added in buildAuthUrl (e.g. "youtube_1234567890" → "youtube")
      const platform = rawState?.replace(/_\d+$/, "") ?? null;

      const error = params.get("error");

      const payload = {
        type: "OAUTH_CALLBACK",
        platform,
        access_token,
        code,
        error,
      };

      if (window.opener && !window.opener.closed) {
        // Popup flow: hand the result back to the opener and close.
        window.opener.postMessage(payload, window.location.origin);
        window.close();
      } else {
        // Full-page redirect flow: forward to /integrations to finish the connect.
        const qs = new URLSearchParams();
        if (code) qs.set("oauth_code", code);
        if (access_token) qs.set("oauth_token", access_token);
        if (rawState) qs.set("oauth_state", rawState);
        if (error) qs.set("oauth_error", error);
        window.location.replace(`/integrations?${qs.toString()}`);
      }
    } catch (err) {
      console.error("Google OAuth callback error:", err);
    }
  }, [params]);

  return <div style={{ padding: 20 }}>Connecting account...</div>;
}
