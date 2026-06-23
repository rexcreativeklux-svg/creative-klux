// app/api/linkedin-ads/publish/route.js
//
// Server-side LinkedIn Ads publish (no browser CORS + needs versioned headers, like the
// organic LinkedIn post route). Creates a single-image Sponsored Content ad as a chain:
//
//   ad account → (resolve owning Company Page) → upload image → Direct Sponsored Content
//   post (by the org) → campaign group → campaign → creative
//
// Everything is created in a NON-LIVE state (campaign group/campaign DRAFT, creative PAUSED)
// so nothing spends until you review + activate it in LinkedIn Campaign Manager — same
// "created paused" posture as the Google/TikTok/Pinterest ad publishers.
//
// ⚠️ UNTESTED WIRING. Big real-world prerequisites:
//   1. Marketing Developer Platform (Advertising API) approved on the app (r_ads/rw_ads).
//   2. The ad account MUST be owned by a Company Page (organization) — LinkedIn sponsored
//      content runs as an org, not a person. A member-only connect with no org → we can't
//      build the post; the route returns a clear error.
//   3. Targeting geo URNs are versioned; we map a few countries and default to the US.

import { LINKEDIN_API_VERSION } from "@/(lib)/linkedinConfig";

const REST_BASE = "https://api.linkedin.com/rest";

function liHeaders(access_token) {
  return {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": LINKEDIN_API_VERSION,
  };
}

// LinkedIn geo URNs (urn:li:geo:<id>) for common targets. Default to the US.
const GEO_URNS = {
  US: "urn:li:geo:103644278",
  GB: "urn:li:geo:101165590",
  UK: "urn:li:geo:101165590",
  CA: "urn:li:geo:101174742",
  AU: "urn:li:geo:101452733",
  NG: "urn:li:geo:105365761",
  IN: "urn:li:geo:102713980",
  DE: "urn:li:geo:101282230",
  FR: "urn:li:geo:105015875",
  ZA: "urn:li:geo:104035573",
};

function liError(status, data, fallback) {
  const base = data?.message || fallback || `LinkedIn request failed (${status}).`;
  const code = data?.serviceErrorCode ? `/${data.serviceErrorCode}` : "";
  if (status === 401 || status === 403) {
    return `${base} — the token is missing the LinkedIn Advertising API permissions (r_ads/rw_ads). Get the Marketing Developer Platform approved on the app, then DISCONNECT and RECONNECT LinkedIn Ads. [HTTP ${status}${code}]`;
  }
  return `${base} [HTTP ${status}${code}]`;
}

// The numeric id LinkedIn returns for a created entity lives in the x-restli-id header.
function createdId(res) {
  return res.headers.get("x-restli-id") || res.headers.get("x-linkedin-id") || null;
}

async function postJson(url, access_token, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: liHeaders(access_token),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function POST(req) {
  try {
    const {
      access_token,
      ad_account_id,
      image_url,
      text,
      link,
      daily_budget,
      campaign_name,
      country,
    } = await req.json();

    if (!access_token) return Response.json({ error: "Missing access token — reconnect LinkedIn Ads." }, { status: 400 });
    if (!ad_account_id) return Response.json({ error: "Missing LinkedIn ad account id — reconnect LinkedIn Ads." }, { status: 400 });
    if (!image_url) return Response.json({ error: "LinkedIn ads need an image to promote." }, { status: 400 });

    const accountUrn = `urn:li:sponsoredAccount:${ad_account_id}`;

    // 1. Resolve the owning Company Page (organization) + currency from the ad account.
    const acctRes = await fetch(
      `${REST_BASE}/adAccounts/${ad_account_id}?fields=id,name,reference,currency`,
      { headers: liHeaders(access_token) }
    );
    const acct = await acctRes.json().catch(() => ({}));
    if (!acctRes.ok) {
      return Response.json({ error: liError(acctRes.status, acct, "Couldn't load the LinkedIn ad account."), details: acct }, { status: 400 });
    }
    const orgUrn = acct.reference; // urn:li:organization:<id>
    if (!orgUrn || !String(orgUrn).startsWith("urn:li:organization:")) {
      return Response.json(
        { error: "This LinkedIn ad account isn't linked to a Company Page. LinkedIn sponsored ads must run as an organization — associate a Company Page with the ad account, then retry." },
        { status: 400 }
      );
    }
    const currencyCode = acct.currency || "USD";

    // 2. Upload the image, owned by the organization.
    const initRes = await fetch(`${REST_BASE}/images?action=initializeUpload`, {
      method: "POST",
      headers: liHeaders(access_token),
      body: JSON.stringify({ initializeUploadRequest: { owner: orgUrn } }),
    });
    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok) {
      return Response.json({ error: liError(initRes.status, initData, "LinkedIn image init failed."), details: initData }, { status: 400 });
    }
    const uploadUrl = initData.value?.uploadUrl;
    const imageUrn = initData.value?.image;
    if (!uploadUrl || !imageUrn) {
      return Response.json({ error: "LinkedIn did not return an image upload URL." }, { status: 400 });
    }
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) return Response.json({ error: "Couldn't download the image to attach." }, { status: 400 });
    const contentType = imgRes.headers.get("content-type") || "image/png";
    const bytes = Buffer.from(await imgRes.arrayBuffer());
    const upRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": contentType },
      body: bytes,
    });
    if (!upRes.ok) {
      const t = await upRes.text().catch(() => "");
      return Response.json({ error: `LinkedIn image upload failed (${upRes.status}). ${t.slice(0, 200)}` }, { status: 400 });
    }

    // 3. Create the Direct Sponsored Content post (authored by the org; used only in ads).
    const postBody = {
      author: orgUrn,
      commentary: text || "",
      visibility: "PUBLIC",
      distribution: { feedDistribution: "NONE", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
      content: { media: { altText: (text || "").slice(0, 300), id: imageUrn } },
    };
    if (link) {
      // A link share: attach the destination URL as an article so the ad is clickable.
      postBody.content = {
        article: { source: link, title: (text || campaign_name || "Learn more").slice(0, 200), thumbnail: imageUrn },
      };
    }
    const { res: postRes, data: postData } = await postJson(`${REST_BASE}/posts`, access_token, postBody);
    if (!postRes.ok) {
      return Response.json({ error: liError(postRes.status, postData, "LinkedIn ad post creation failed."), details: postData }, { status: 400 });
    }
    const postUrn = createdId(postRes); // urn:li:share:… or urn:li:ugcPost:…
    if (!postUrn) {
      return Response.json({ error: "LinkedIn didn't return a post URN for the ad content." }, { status: 400 });
    }

    // From here on, clean up created entities if a later step fails (best-effort).
    let campaignGroupUrn = null;
    let campaignUrn = null;
    try {
      // 4. Campaign group (DRAFT container).
      const { res: cgRes, data: cgData } = await postJson(
        `${REST_BASE}/adAccounts/${ad_account_id}/adCampaignGroups`,
        access_token,
        {
          account: accountUrn,
          name: (campaign_name || "Creative Klux Ad").slice(0, 100),
          status: "DRAFT",
        }
      );
      if (!cgRes.ok) throw new Error(liError(cgRes.status, cgData, "LinkedIn campaign group failed."));
      const cgId = createdId(cgRes);
      campaignGroupUrn = `urn:li:sponsoredCampaignGroup:${cgId}`;

      // 5. Campaign (DRAFT). Single-image Sponsored Content, geo-targeted.
      const geoUrn = GEO_URNS[(country || "US").toUpperCase()] || GEO_URNS.US;
      const { res: cRes, data: cData } = await postJson(
        `${REST_BASE}/adAccounts/${ad_account_id}/adCampaigns`,
        access_token,
        {
          account: accountUrn,
          campaignGroup: campaignGroupUrn,
          name: (campaign_name || "Creative Klux Ad").slice(0, 100),
          type: "SPONSORED_UPDATES",
          costType: "CPM",
          dailyBudget: { amount: String(daily_budget || 10), currencyCode },
          locale: { country: (country || "US").toUpperCase(), language: "en" },
          runSchedule: { start: Date.now() },
          objectiveType: "BRAND_AWARENESS",
          targetingCriteria: {
            include: {
              and: [
                { or: { "urn:li:adTargetingFacet:locations": [geoUrn] } },
              ],
            },
          },
          offsiteDeliveryEnabled: false,
          status: "DRAFT",
        }
      );
      if (!cRes.ok) throw new Error(liError(cRes.status, cData, "LinkedIn campaign failed."));
      const cId = createdId(cRes);
      campaignUrn = `urn:li:sponsoredCampaign:${cId}`;

      // 6. Creative — references the post, tied to the campaign. Created PAUSED.
      const { res: crRes, data: crData } = await postJson(
        `${REST_BASE}/adAccounts/${ad_account_id}/creatives`,
        access_token,
        {
          campaign: campaignUrn,
          content: { reference: postUrn },
          status: "PAUSED",
        }
      );
      if (!crRes.ok) throw new Error(liError(crRes.status, crData, "LinkedIn creative failed."));
      const creativeId = createdId(crRes);

      return Response.json({
        ok: true,
        post_urn: postUrn,
        campaign_group_urn: campaignGroupUrn,
        campaign_urn: campaignUrn,
        creative_id: creativeId,
      });
    } catch (chainErr) {
      // Best-effort cleanup so we don't leave an orphan DRAFT campaign behind.
      try {
        if (campaignUrn) {
          const cId = campaignUrn.split(":").pop();
          await fetch(`${REST_BASE}/adAccounts/${ad_account_id}/adCampaigns/${cId}`, {
            method: "DELETE",
            headers: liHeaders(access_token),
          });
        }
        if (campaignGroupUrn) {
          const cgId = campaignGroupUrn.split(":").pop();
          await fetch(`${REST_BASE}/adAccounts/${ad_account_id}/adCampaignGroups/${cgId}`, {
            method: "DELETE",
            headers: liHeaders(access_token),
          });
        }
      } catch (cleanupErr) {
        console.error("LinkedIn Ads cleanup failed:", cleanupErr);
      }
      return Response.json({ error: chainErr.message || "LinkedIn Ads publish failed" }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: err.message || "LinkedIn Ads publish failed" }, { status: 500 });
  }
}
