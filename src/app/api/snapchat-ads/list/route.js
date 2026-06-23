// /api/snapchat-ads/list/route.js
//
// List recent Snapchat Ads campaigns for the connected ad account (for the ads calendar /
// publishing pages). Server-side (needs the client secret to refresh the ~1h token).

const ADS_BASE = "https://adsapi.snapchat.com/v1";

async function refreshAccessToken(refresh_token) {
  const res = await fetch("https://accounts.snapchat.com/login/oauth2/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
      client_id: process.env.NEXT_PUBLIC_SNAPCHAT_CLIENT_ID,
      client_secret: process.env.SNAPCHAT_CLIENT_SECRET,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error("Snapchat token refresh failed — reconnect Snapchat Ads.");
  return data.access_token;
}

export async function POST(req) {
  try {
    const { access_token: tokenIn, refresh_token, ad_account_id } = await req.json();
    if (!ad_account_id) return Response.json({ error: "Missing Snapchat ad account id." }, { status: 400 });

    let access_token = tokenIn;
    if (refresh_token) {
      try { access_token = await refreshAccessToken(refresh_token); } catch (e) {
        if (!access_token) throw e;
      }
    }
    if (!access_token) return Response.json({ error: "No Snapchat token — reconnect Snapchat Ads." }, { status: 401 });

    const res = await fetch(`${ADS_BASE}/adaccounts/${ad_account_id}/campaigns`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: data.request_status || "Snapchat Ads list failed", details: data }, { status: 400 });
    }

    const campaigns = (data.campaigns || [])
      .map((row) => row.campaign)
      .filter(Boolean)
      .map((c) => ({
        id: String(c.id),
        name: c.name,
        status: c.status, // ACTIVE | PAUSED
        created_at: c.created_at || null, // ISO
      }));

    return Response.json({ campaigns });
  } catch (err) {
    return Response.json({ error: err.message || "Snapchat Ads list failed" }, { status: 500 });
  }
}
