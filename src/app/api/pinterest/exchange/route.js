// app/api/pinterest/exchange/route.js

const CLIENT_ID = process.env.NEXT_PUBLIC_PINTEREST_CLIENT_ID;         // 1568756
const APP_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN; // pina_...
const REDIRECT_URI = "https://app.creativeklux.com/oauth-callback";

export async function POST(req) {
  try {
    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: "Missing code" }, { status: 400 });
    }

    // Pinterest Basic Auth = base64(client_id:app_access_token)
    const credentials = Buffer.from(`${CLIENT_ID}:${APP_ACCESS_TOKEN}`).toString("base64");

    // ─────────────────────────────────────────
    // 1. EXCHANGE CODE FOR TOKENS
    // ─────────────────────────────────────────
    const tokenRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.code) {
      return Response.json(
        { error: tokenData.message || "Pinterest token exchange failed", details: tokenData },
        { status: 400 }
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // ─────────────────────────────────────────
    // 2. REFRESH IMMEDIATELY FOR LONG-LIVED TOKEN
    // Initial access token = ~1 hour
    // After refresh = 30 days access token + new refresh token (1 year)
    // ─────────────────────────────────────────
    const refreshRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
        scope: "boards:read,pins:read,pins:write,user_accounts:read,ads:read,ads:write",
      }),
    });

    const refreshData = await refreshRes.json();

    // Determine which token to use (prefer refreshed long-lived)
    const finalToken = (!refreshRes.ok || refreshData.code)
      ? access_token
      : refreshData.access_token;

    const finalRefreshToken = (!refreshRes.ok || refreshData.code)
      ? refresh_token
      : (refreshData.refresh_token || refresh_token);

    if (!refreshRes.ok || refreshData.code) {
      console.warn("Pinterest refresh failed, using short-lived token:", refreshData);
    }

    // ─────────────────────────────────────────
    // 3. FETCH USER INFO
    // ─────────────────────────────────────────
    const userRes = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${finalToken}` },
    });

    const userData = await userRes.json();

    if (userData.code) {
      return Response.json(
        { error: userData.message || "Failed to fetch Pinterest user" },
        { status: 400 }
      );
    }

    return Response.json({
      access_token: finalToken,
      refresh_token: finalRefreshToken,
      expires_in: refreshData.expires_in || expires_in,
      int_id: userData.username || userData.id,
      name: userData.username,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}