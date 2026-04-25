"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function OAuthCallback() {
  const params = useSearchParams();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));

    const access_token = hash.get("access_token");
    const code = params.get("code");
    const platform = params.get("state") || params.get("platform");
    const error = params.get("error");

    window.opener.postMessage(
      {
        type: "OAUTH_CALLBACK",
        platform,
        access_token,
        code,
        error,
      },
      window.location.origin
    );

    window.close();
  }, []);

  return <p>Connecting...</p>;
}
