// /api/linkedin-ads/list/route.js
//
// List recent LinkedIn Ads campaigns for the connected ad account (for the ads calendar /
// publishing pages). Server-side (no browser CORS, needs the versioned headers).

import { LINKEDIN_API_VERSION } from "@/(lib)/linkedinConfig";

const REST_BASE = "https://api.linkedin.com/rest";

export async function POST(req) {
  try {
    const { access_token, ad_account_id } = await req.json();
    if (!access_token) return Response.json({ error: "Missing LinkedIn token — reconnect LinkedIn Ads." }, { status: 401 });
    if (!ad_account_id) return Response.json({ error: "Missing LinkedIn ad account id." }, { status: 400 });

    const res = await fetch(
      `${REST_BASE}/adAccounts/${ad_account_id}/adCampaigns?q=search&pageSize=50`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "LinkedIn-Version": LINKEDIN_API_VERSION,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: data.message || "LinkedIn Ads list failed", details: data }, { status: 400 });
    }

    const campaigns = (data.elements || []).map((c) => ({
      id: String(c.id),
      name: c.name,
      status: c.status, // ACTIVE | PAUSED | DRAFT | …
      // changeAuditStamps.created.time is epoch ms.
      created_time: c.changeAuditStamps?.created?.time || null,
    }));

    return Response.json({ campaigns });
  } catch (err) {
    return Response.json({ error: err.message || "LinkedIn Ads list failed" }, { status: 500 });
  }
}
