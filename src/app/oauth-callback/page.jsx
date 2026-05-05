"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function OAuthCallback() {
  const params = useSearchParams();

  useEffect(() => {
    try {
      const hash = new URLSearchParams(window.location.hash.replace("#", ""));
      const access_token = hash.get("access_token");
      const code = params.get("code");

      // ✅ FIX: state lives in the HASH for implicit flows (Facebook, etc.)
      const platform =
        hash.get("state") ||        // implicit flow: state is in the hash
        params.get("state") ||      // code flow: state is in query params
        params.get("platform");

      const error = params.get("error");

      const payload = {
        type: "OAUTH_CALLBACK",
        platform,
        access_token,
        code,
        error,
      };

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, window.location.origin);
      } else {
        console.warn("No opener window found. OAuth opened directly.");
      }
      window.close();
    } catch (err) {
      console.error("OAuth callback error:", err);
    }
  }, [params]);

  return <div style={{ padding: 20 }}>Connecting account...</div>;
}