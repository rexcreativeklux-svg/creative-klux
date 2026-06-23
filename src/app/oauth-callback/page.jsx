"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function OAuthCallback() {
  const params = useSearchParams();

  useEffect(() => {
    try {
      const hash = new URLSearchParams(window.location.hash.replace("#", ""));
      const access_token = hash.get("access_token");
      // TikTok's Marketing API (business-api portal) returns `auth_code`, not `code`.
      const code = params.get("code") || params.get("auth_code");

      const rawState =
        hash.get("state") ||
        params.get("state") ||
        params.get("platform");

      // Strip the _timestamp suffix added in buildAuthUrl (e.g. "facebook_1234567890" → "facebook")
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
        // Full-page redirect flow (no popup): forward to /integrations to finish the
        // connect. rawState carries the platform (e.g. "twitter_1700000000").
        const qs = new URLSearchParams();
        if (code) qs.set("oauth_code", code);
        if (access_token) qs.set("oauth_token", access_token);
        if (rawState) qs.set("oauth_state", rawState);
        if (error) qs.set("oauth_error", error);
        window.location.replace(`/integrations?${qs.toString()}`);
      }
    } catch (err) {
      console.error("OAuth callback error:", err);
    }
  }, [params]);

  return <div style={{ padding: 20 }}>Connecting account...</div>;
}