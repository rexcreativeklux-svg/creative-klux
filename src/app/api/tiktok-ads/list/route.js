// /api/tiktok-ads/list/route.js
//
// List recent TikTok Ads campaigns for the connected advertiser (for the ads calendar /
// publishing pages). Server-side (no browser CORS). TikTok Marketing API tokens are
// long-lived (no rotation), so we use the access token directly.

const ADS_BASE = "https://business-api.tiktok.com/open_api/v1.3";

export async function POST(req) {
  try {
    const { access_token, advertiser_id } = await req.json();
    if (!access_token) return Response.json({ error: "Missing TikTok Ads token — reconnect." }, { status: 401 });
    if (!advertiser_id) return Response.json({ error: "Missing TikTok advertiser id." }, { status: 400 });

    const url =
      `${ADS_BASE}/campaign/get/?advertiser_id=${encodeURIComponent(advertiser_id)}` +
      `&page_size=50`;
    const res = await fetch(url, { headers: { "Access-Token": access_token } });
    const data = await res.json().catch(() => ({}));

    // TikTok wraps everything: { code, message, data: { list: [...] } }. code 0 = success.
    if (data.code !== 0) {
      return Response.json({ error: data.message || "TikTok Ads list failed", details: data }, { status: 400 });
    }

    const campaigns = (data.data?.list || []).map((c) => ({
      id: String(c.campaign_id),
      name: c.campaign_name,
      status: c.operation_status, // ENABLE | DISABLE
      create_time: c.create_time || null, // "YYYY-MM-DD HH:mm:ss"
    }));

    return Response.json({ campaigns });
  } catch (err) {
    return Response.json({ error: err.message || "TikTok Ads list failed" }, { status: 500 });
  }
}
