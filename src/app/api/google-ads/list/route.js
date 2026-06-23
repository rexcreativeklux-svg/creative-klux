// /api/google-ads/list/route.js
//
// List recent Google Ads campaigns for the connected customer (for the ads calendar /
// publishing pages). Server-side: the Google Ads API blocks browser CORS and needs the
// developer token. Refreshes the ~1h access token from the stored refresh token.

import { NextResponse } from "next/server";

const API_VERSION = "v20";
const ADS_BASE = `https://googleads.googleapis.com/${API_VERSION}`;

async function refreshAccessToken(refresh_token) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || "Token refresh failed");
  return data.access_token;
}

export async function POST(req) {
  try {
    const { refresh_token, customer_id } = await req.json();
    if (!refresh_token) return NextResponse.json({ error: "Missing Google refresh token — reconnect Google Ads." }, { status: 401 });
    if (!customer_id) return NextResponse.json({ error: "Missing Google Ads customer id." }, { status: 400 });
    if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN)
      return NextResponse.json({ error: "GOOGLE_ADS_DEVELOPER_TOKEN is not configured." }, { status: 500 });

    const cid = String(customer_id).replace(/-/g, "");
    const access_token = await refreshAccessToken(refresh_token);

    const query =
      "SELECT campaign.id, campaign.name, campaign.status, campaign.start_date " +
      "FROM campaign ORDER BY campaign.id DESC LIMIT 50";

    const res = await fetch(`${ADS_BASE}/customers/${cid}/googleAds:searchStream`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        "login-customer-id": cid,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.[0]?.error?.message || data?.error?.message || "Google Ads list failed";
      return NextResponse.json({ error: msg, details: data }, { status: 400 });
    }

    // searchStream returns an array of batches, each { results: [{ campaign }] }.
    const campaigns = [];
    (Array.isArray(data) ? data : []).forEach((batch) => {
      (batch.results || []).forEach((r) => {
        const c = r.campaign || {};
        campaigns.push({
          id: String(c.id),
          name: c.name,
          status: c.status, // ENABLED | PAUSED | REMOVED
          start_date: c.startDate || c.start_date || null,
        });
      });
    });

    return NextResponse.json({ campaigns });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Google Ads list failed" }, { status: 500 });
  }
}
