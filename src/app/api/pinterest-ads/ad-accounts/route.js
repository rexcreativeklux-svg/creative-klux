// app/api/pinterest-ads/ad-accounts/route.js
//
// List the connected Pinterest account's ad accounts (for the Pinterest Ads ad-account
// picker). Server-side: api.pinterest.com has no browser CORS. Reuses the Pinterest token
// (the pinterest_ads OAuth scope already includes ads:read/ads:write).

export async function POST(req) {
  try {
    const { access_token } = await req.json();
    if (!access_token) {
      return Response.json({ error: "Missing Pinterest token — reconnect Pinterest Ads." }, { status: 400 });
    }

    const res = await fetch("https://api.pinterest.com/v5/ad_accounts?page_size=100", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.code) {
      // A 401/403 here usually means the token lacks the ads scope — i.e. it was connected
      // via the organic Pinterest card (no ads:read/ads:write), not the Pinterest Ads card.
      return Response.json(
        { error: data.message || "Failed to load Pinterest ad accounts", details: data },
        { status: res.status || 400 }
      );
    }

    const adAccounts = (data.items || []).map((acc) => ({
      id: String(acc.id),
      name: acc.name || `Ad Account ${acc.id}`,
    }));

    if (!adAccounts.length) {
      return Response.json(
        { error: "No Pinterest ad accounts found for this account." },
        { status: 404 }
      );
    }

    return Response.json({ adAccounts });
  } catch (err) {
    return Response.json({ error: err.message || "Pinterest ad accounts fetch failed" }, { status: 500 });
  }
}
