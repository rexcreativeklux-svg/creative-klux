// /api/pinterest-ads/list/route.js
//
// List recent Pinterest Ads campaigns for the connected ad account (for the ads calendar /
// publishing pages). Server-side (no browser CORS). Reuses the long-lived Pinterest token.

export async function POST(req) {
  try {
    const { access_token, ad_account_id } = await req.json();
    if (!access_token) return Response.json({ error: "Missing Pinterest token — reconnect Pinterest Ads." }, { status: 401 });
    if (!ad_account_id) return Response.json({ error: "Missing Pinterest ad account id." }, { status: 400 });

    const res = await fetch(
      `https://api.pinterest.com/v5/ad_accounts/${encodeURIComponent(ad_account_id)}/campaigns?page_size=50`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: data.message || "Pinterest Ads list failed", details: data }, { status: 400 });
    }

    const campaigns = (data.items || []).map((c) => ({
      id: String(c.id),
      name: c.name,
      status: c.status, // ACTIVE | PAUSED | ARCHIVED
      created_time: c.created_time || null, // unix seconds
    }));

    return Response.json({ campaigns });
  } catch (err) {
    return Response.json({ error: err.message || "Pinterest Ads list failed" }, { status: 500 });
  }
}
