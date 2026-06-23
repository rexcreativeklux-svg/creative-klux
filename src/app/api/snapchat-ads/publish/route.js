// app/api/snapchat-ads/publish/route.js
//
// Server-side Snapchat Ads publish (Marketing API — needs the client secret to refresh the
// ~1h access token, and no browser CORS). Builds a single-image Snap ad as a chain:
//
//   refresh token → media (IMAGE) → upload bytes → creative (SNAP_AD) →
//   campaign (PAUSED) → ad squad (PAUSED, geo-targeted, micro-currency budget) → ad (PAUSED)
//
// Everything is PAUSED so nothing spends until you review + activate it in Snapchat Ads
// Manager — same "created paused" posture as the other ad publishers.
//
// ⚠️ UNTESTED WIRING. Caveats:
//   - Snapchat ads are full-screen VERTICAL (9:16). A square/landscape creative may be
//     rejected or letterboxed — real fix is a 1080x1920 crop.
//   - Budgets/bids are micro-currency (×1,000,000); Snapchat enforces a per-currency daily
//     minimum (often ~$20/day) — currency-naïve here.
//   - Needs the Snapchat Marketing API approved on the app + a funded ad account.

const ADS_BASE = "https://adsapi.snapchat.com/v1";

// Pull the first entity out of a Snapchat batch response, checking its sub_request_status.
// Snapchat wraps creates as { <plural>: [{ sub_request_status, <singular>: {...} }] }.
function unwrap(data, plural, singular) {
  const row = (data?.[plural] || [])[0];
  if (!row || row.sub_request_status !== "SUCCESS") {
    const reason = row?.errors?.[0]?.message || data?.request_status || "unknown error";
    throw new Error(`Snapchat ${singular} creation failed: ${reason}`);
  }
  return row[singular];
}

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
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || "Snapchat token refresh failed — reconnect Snapchat Ads.");
  }
  return data.access_token;
}

export async function POST(req) {
  try {
    const {
      access_token: tokenIn,
      refresh_token,
      ad_account_id,
      image_url,
      headline,
      brand_name,
      link,
      daily_budget,
      country,
      campaign_name,
    } = await req.json();

    if (!ad_account_id) return Response.json({ error: "Missing Snapchat ad account id — reconnect Snapchat Ads." }, { status: 400 });
    if (!image_url) return Response.json({ error: "Snapchat ads need an image to promote." }, { status: 400 });

    // Access tokens die in ~1h; prefer refreshing if we have the refresh token.
    let access_token = tokenIn;
    if (refresh_token) {
      try { access_token = await refreshAccessToken(refresh_token); } catch (e) {
        if (!access_token) throw e; // no fallback token → surface the refresh error
      }
    }
    if (!access_token) return Response.json({ error: "No Snapchat token — reconnect Snapchat Ads." }, { status: 400 });

    const jsonHeaders = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };
    const name = (campaign_name || brand_name || "Creative Klux Ad").slice(0, 100);

    // 1. Create the media entity (IMAGE).
    const mediaRes = await fetch(`${ADS_BASE}/adaccounts/${ad_account_id}/media`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ media: [{ name: `${name} media`, type: "IMAGE", ad_account_id }] }),
    });
    const mediaData = await mediaRes.json().catch(() => ({}));
    if (!mediaRes.ok) return Response.json({ error: "Snapchat media create failed", details: mediaData }, { status: 400 });
    const media = unwrap(mediaData, "media", "media");
    const mediaId = media.id;

    // 2. Upload the image bytes (multipart) to the media entity.
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) return Response.json({ error: "Couldn't download the image to upload." }, { status: 400 });
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const blob = new Blob([await imgRes.arrayBuffer()], { type: contentType });
    const form = new FormData();
    form.append("file", blob, "creative.jpg");
    const upRes = await fetch(`${ADS_BASE}/media/${mediaId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}` }, // let fetch set the multipart boundary
      body: form,
    });
    if (!upRes.ok) {
      const t = await upRes.text().catch(() => "");
      return Response.json({ error: `Snapchat media upload failed (${upRes.status}). ${t.slice(0, 200)}` }, { status: 400 });
    }

    // 3. Create the creative (SNAP_AD using the image as the top snap). Add a web-view
    //    attachment so the ad is clickable when a brand URL is present.
    const creativePayload = {
      name: `${name} creative`,
      ad_account_id,
      type: "SNAP_AD",
      top_snap_media_id: mediaId,
      brand_name: (brand_name || name).slice(0, 32),
      headline: (headline || name).slice(0, 34),
      shareable: true,
    };
    if (link) {
      creativePayload.call_to_action = "LEARN_MORE";
      creativePayload.web_view_properties = { url: link };
    }
    const crRes = await fetch(`${ADS_BASE}/adaccounts/${ad_account_id}/creatives`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ creatives: [creativePayload] }),
    });
    const crData = await crRes.json().catch(() => ({}));
    if (!crRes.ok) return Response.json({ error: "Snapchat creative create failed", details: crData }, { status: 400 });
    const creative = unwrap(crData, "creatives", "creative");
    const creativeId = creative.id;

    // 4. Campaign (PAUSED). From here, clean up on failure.
    const campRes = await fetch(`${ADS_BASE}/adaccounts/${ad_account_id}/campaigns`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        campaigns: [{
          name,
          ad_account_id,
          status: "PAUSED",
          start_time: new Date().toISOString(),
        }],
      }),
    });
    const campData = await campRes.json().catch(() => ({}));
    if (!campRes.ok) return Response.json({ error: "Snapchat campaign create failed", details: campData }, { status: 400 });
    const campaign = unwrap(campData, "campaigns", "campaign");
    const campaignId = campaign.id;

    try {
      // 5. Ad squad (PAUSED) — geo-targeted, auto-bid, micro-currency daily budget.
      const dailyMicro = Math.round((Number(daily_budget) || 20) * 1_000_000);
      const squadRes = await fetch(`${ADS_BASE}/campaigns/${campaignId}/adsquads`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          adsquads: [{
            name: `${name} ad squad`,
            campaign_id: campaignId,
            type: "SNAP_ADS",
            optimization_goal: "IMPRESSIONS",
            billing_event: "IMPRESSION",
            bid_strategy: "AUTO_BID",
            daily_budget_micro: dailyMicro,
            targeting: { geos: [{ country_code: (country || "us").toLowerCase() }] },
            status: "PAUSED",
          }],
        }),
      });
      const squadData = await squadRes.json().catch(() => ({}));
      if (!squadRes.ok) throw new Error(squadData?.adsquads?.[0]?.errors?.[0]?.message || "Snapchat ad squad create failed");
      const adsquad = unwrap(squadData, "adsquads", "adsquad");
      const adSquadId = adsquad.id;

      // 6. Ad (PAUSED) — ties the creative to the ad squad.
      const adRes = await fetch(`${ADS_BASE}/adsquads/${adSquadId}/ads`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          ads: [{ name: `${name} ad`, ad_squad_id: adSquadId, creative_id: creativeId, type: "SNAP_AD", status: "PAUSED" }],
        }),
      });
      const adData = await adRes.json().catch(() => ({}));
      if (!adRes.ok) throw new Error(adData?.ads?.[0]?.errors?.[0]?.message || "Snapchat ad create failed");
      const ad = unwrap(adData, "ads", "ad");

      return Response.json({
        ok: true,
        media_id: mediaId,
        creative_id: creativeId,
        campaign_id: campaignId,
        ad_squad_id: adSquadId,
        ad_id: ad.id,
      });
    } catch (chainErr) {
      // Best-effort cleanup — delete the campaign (cascades to ad squad/ad).
      try {
        await fetch(`${ADS_BASE}/campaigns/${campaignId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${access_token}` },
        });
      } catch (cleanupErr) {
        console.error("Snapchat Ads cleanup failed:", cleanupErr);
      }
      return Response.json({ error: chainErr.message || "Snapchat Ads publish failed" }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: err.message || "Snapchat Ads publish failed" }, { status: 500 });
  }
}
