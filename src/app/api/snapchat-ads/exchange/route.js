// app/api/snapchat-ads/exchange/route.js
//
// Snapchat Ads (Marketing API) uses the OAuth CODE flow + a client secret, so the
// code→token swap MUST run server-side (the popup returns a `code`, not a token — the old
// resolveGenericIntegration path read oauthResult.access_token and silently got nothing,
// same bug YouTube had). After exchanging, we list the member's ad accounts (Organizations
// → Ad Accounts) so the user can pick which one to use.
//
// Env: NEXT_PUBLIC_SNAPCHAT_CLIENT_ID + SNAPCHAT_CLIENT_SECRET. redirect_uri must match the
// one used at auth time (the generic /oauth-callback).

const ADS_BASE = "https://adsapi.snapchat.com/v1";
const REDIRECT_URI =
  process.env.SNAPCHAT_REDIRECT_URI || "https://app.creativeklux.com/oauth-callback";

export async function POST(req) {
  try {
    const { code } = await req.json();
    if (!code) return Response.json({ error: "Missing authorization code." }, { status: 400 });

    const clientId = process.env.NEXT_PUBLIC_SNAPCHAT_CLIENT_ID;
    const clientSecret = process.env.SNAPCHAT_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return Response.json(
        { error: "Snapchat app credentials are not configured (NEXT_PUBLIC_SNAPCHAT_CLIENT_ID / SNAPCHAT_CLIENT_SECRET)." },
        { status: 500 }
      );
    }

    // 1. Exchange the code for tokens.
    const tokenRes = await fetch("https://accounts.snapchat.com/login/oauth2/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Snapchat token exchange failed:", tokenRes.status, tokenData);
      return Response.json(
        { error: tokenData.error_description || tokenData.error || "Snapchat token exchange failed", details: tokenData },
        { status: 400 }
      );
    }
    const access_token = tokenData.access_token;
    const refresh_token = tokenData.refresh_token; // long-lived; required for server-side publish later

    const authHeaders = { Authorization: `Bearer ${access_token}` };

    // 2. Resolve the member's organizations, then ad accounts under each.
    const orgRes = await fetch(`${ADS_BASE}/me/organizations`, { headers: authHeaders });
    const orgData = await orgRes.json().catch(() => ({}));
    if (!orgRes.ok) {
      return Response.json({ error: "Couldn't load Snapchat organizations.", details: orgData }, { status: 400 });
    }
    const organizations = (orgData.organizations || [])
      .map((o) => o.organization)
      .filter(Boolean);

    const adAccounts = [];
    for (const org of organizations) {
      const aaRes = await fetch(`${ADS_BASE}/organizations/${org.id}/adaccounts`, { headers: authHeaders });
      const aaData = await aaRes.json().catch(() => ({}));
      (aaData.adaccounts || []).forEach((entry) => {
        const aa = entry.adaccount;
        if (aa) adAccounts.push({ id: aa.id, name: aa.name || `Ad Account ${aa.id}` });
      });
    }

    if (!adAccounts.length) {
      return Response.json(
        { error: "No Snapchat ad accounts found for this member." },
        { status: 404 }
      );
    }

    return Response.json({ access_token, refresh_token, adAccounts });
  } catch (err) {
    return Response.json({ error: err.message || "Snapchat exchange failed" }, { status: 500 });
  }
}
