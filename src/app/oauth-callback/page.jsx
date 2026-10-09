"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { reportToOpener } from "@/(lib)/oauth/authTab";

// The provider redirects here inside the connect TAB the Integrations page
// opened (see (lib)/oauth/authTab.js). Hand the code/token back and close.
export default function OAuthCallback() {
  const params = useSearchParams();
  const [done, setDone] = useState(false);

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

      reportToOpener({
        type: "OAUTH_CALLBACK",
        platform,
        access_token,
        code,
        error,
      });
    } catch (err) {
      console.error("OAuth callback error:", err);
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
