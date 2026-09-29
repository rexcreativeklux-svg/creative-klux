// app/api/microsoft/exchange/route.js
// Exchanges a Microsoft identity-platform auth code (Excel connect) for tokens,
// then reads the signed-in user from Microsoft Graph to label the integration.

const CLIENT_ID = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
// Must match the redirect in oauth/page.jsx and the one registered on the Azure app.
const REDIRECT_URI = "https://app.creativeklux.com/oauth-callback";

export async function POST(req) {
  try {
    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: "Missing code" }, { status: 400 });
    }
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return Response.json(
        { error: "Microsoft app is not configured (set NEXT_PUBLIC_MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET)." },
        { status: 500 }
      );
    }

    const tokenRes = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return Response.json(
        { error: tokenData.error_description || "Microsoft token exchange failed" },
        { status: 400 }
      );
    }

    const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    if (!userRes.ok) {
      return Response.json(
        { error: userData.error?.message || "Failed to fetch Microsoft user" },
        { status: 400 }
      );
    }

    return Response.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      int_id: userData.id,
      // Work/school accounts have `mail`; personal accounts often only have the UPN.
      name: userData.mail || userData.userPrincipalName || userData.displayName,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
