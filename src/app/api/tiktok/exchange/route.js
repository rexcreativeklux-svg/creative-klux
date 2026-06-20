// app/api/tiktok/exchange/route.js
//
// Server-side TikTok OAuth code → token exchange. Must run server-side: it needs the
// client secret, and open.tiktokapis.com has no browser CORS. TikTok uses a code flow
// (the popup/redirect returns a `code`).
//
// Returns the access token (~24h), the refresh token (~365d — used to mint new access
// tokens; it can rotate, so the caller persists whatever comes back), and the user's
// open_id + display name for int_id / int_name.

const CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = "https://app.creativeklux.com/oauth-callback";

const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USER_URL =
  "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name";

export async function POST(req) {
  try {
    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: "Missing authorization code" }, { status: 400 });
    }
    if (!CLIENT_SECRET) {
      return Response.json(
        { error: "TikTok isn't configured — TIKTOK_CLIENT_SECRET is missing on the server." },
        { status: 500 }
      );
    }

    // ── 1. Exchange the code for tokens ──────────────────────────
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });

    // The v2 oauth/token response is flat (no `data` wrapper); errors come as `error` +
    // `error_description`.
    const tokenData = await tokenRes.json().catch(() => ({}));

    if (!tokenRes.ok || tokenData.error) {
      console.error("TikTok token exchange error:", tokenData);
      return Response.json(
        {
          error:
            tokenData.error_description ||
            tokenData.error ||
            "TikTok token exchange failed",
          details: tokenData,
        },
        { status: 400 }
      );
    }

    const { access_token, refresh_token, open_id, expires_in } = tokenData;

    // ── 2. Resolve the display name (open_id already came back above) ──
    let display_name = null;
    try {
      const userRes = await fetch(USER_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userData = await userRes.json().catch(() => ({}));
      display_name = userData.data?.user?.display_name || null;
    } catch {
      /* non-fatal — fall back to open_id for the name */
    }

    return Response.json({
      access_token,
      refresh_token, // persist — mints new 24h access tokens
      expires_in,
      int_id: open_id,
      name: display_name,
    });
  } catch (err) {
    return Response.json({ error: err.message || "TikTok exchange failed" }, { status: 500 });
  }
}
