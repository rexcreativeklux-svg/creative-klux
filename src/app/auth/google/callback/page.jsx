"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { reportToOpener } from "@/(lib)/oauth/authTab";

// Google's OAuth client is registered with /auth/google/callback (not /oauth-callback),
// so Google redirects here after consent. This page does exactly what /oauth-callback does:
// hand the code back to the Integrations page that opened this tab, then close.
export default function GoogleOAuthCallback() {
  const params = useSearchParams();
  const [done, setDone] = useState(false);

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

      reportToOpener({
        type: "OAUTH_CALLBACK",
        platform,
        access_token,
        code,
        error,
      });
    } catch (err) {
      console.error("Google OAuth callback error:", err);
    }
    // Still here a moment later → the browser kept the tab open.
    const id = setTimeout(() => setDone(true), 800);
    return () => clearTimeout(id);
  }, [params]);

  return (
    <div style={{ padding: 20 }}>
      {done
        ? "All set — you can close this tab and go back to Creative Klux."
        : "Connecting account..."}
    </div>
  );
}
