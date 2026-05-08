// app/api/twitter/exchange/route.js

const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const REDIRECT_URI = "https://app.creativeklux.com/oauth-callback";

export async function POST(req) {
  try {
    const { code, code_verifier } = await req.json();

    if (!code || !code_verifier) {
      return Response.json(
        { error: "Missing code or code_verifier" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────
    // 1. EXCHANGE CODE FOR TOKENS (PKCE)
    // ─────────────────────────────────────────
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      return Response.json(
        { error: tokenData.error_description || tokenData.error || "Token exchange failed", details: tokenData },
        { status: 400 }
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // ─────────────────────────────────────────
    // 2. FETCH USER INFO
    // Twitter access tokens last 2 hours.
    // The refresh_token is long-lived (offline.access scope required).
    // ─────────────────────────────────────────
    const userRes = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const userData = await userRes.json();

    if (userData.errors) {
      return Response.json(
        { error: userData.errors[0]?.message || "Failed to fetch user" },
        { status: 400 }
      );
    }

    return Response.json({
      access_token,
      refresh_token,  // store this — use it to get new access tokens
      expires_in,
      int_id: userData.data?.id,
      name: userData.data?.name,
      username: userData.data?.username,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}