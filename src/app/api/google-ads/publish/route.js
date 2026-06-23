// /api/google-ads/publish/route.js
//
// Creates a real Google Ads Display campaign + Responsive Display Ad in ONE batch
// (googleAds:mutate with temp resource names). MUST run server-side: the Google Ads
// API blocks browser CORS and needs the developer token (a server secret).
//
// ⚠️ UNTESTED WIRING. Prerequisites that are NOT in this code:
//   - GOOGLE_ADS_DEVELOPER_TOKEN approved (Basic/Standard access — Test access can't touch
//     a real billing account).
//   - The ad account has a payment method and is in good standing.
//   - If the customer is under a manager (MCC), `login-customer-id` should be the MANAGER id,
//     not the client id. We send the client id (works for direct accounts only).
//   - A Responsive Display Ad needs BOTH a 1.91:1 marketing image AND a 1:1 square image.
//     We only have one creative, so we send it to both slots — Google will REJECT if the
//     aspect ratios don't match. Real fix: generate a landscape + square crop.
//
// Campaign is created PAUSED so it does NOT spend money until reviewed in Ads Manager.

import { NextResponse } from "next/server";

const API_VERSION = "v20";
const ADS_BASE = `https://googleads.googleapis.com/${API_VERSION}`;

// refresh_token → fresh access_token
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

// Download a public image URL → base64 (Google Ads ImageAsset wants raw bytes, not a URL)
async function imageUrlToBase64(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not fetch image (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.toString("base64");
}

export async function POST(req) {
    try {
        const {
            refresh_token,
            customer_id,
            image_url,
            final_url,
            headline,
            long_headline,
            description,
            business_name,
            daily_budget,        // in account-currency units (e.g. 2000 = ₦2000)
            campaign_name = "Creative Klux Campaign",
        } = await req.json();

        if (!refresh_token) return NextResponse.json({ error: "Missing Google refresh token — reconnect Google Ads." }, { status: 401 });
        if (!customer_id)   return NextResponse.json({ error: "Missing Google Ads customer id." }, { status: 400 });
        if (!image_url)     return NextResponse.json({ error: "Missing creative image." }, { status: 400 });
        if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN)
            return NextResponse.json({ error: "GOOGLE_ADS_DEVELOPER_TOKEN is not configured on the server." }, { status: 500 });

        const cid = String(customer_id).replace(/-/g, "");
        const access_token = await refreshAccessToken(refresh_token);
        const imageData = await imageUrlToBase64(image_url);

        // Unique-ish suffix so re-runs don't collide on names. (Date is fine in a route handler.)
        const tag = Date.now().toString(36);
        const budgetMicros = String(Math.round((Number(daily_budget) || 2000) * 1_000_000));

        const r = (entity, id) => `customers/${cid}/${entity}/-${id}`;

        const mutateOperations = [
            { campaignBudgetOperation: { create: {
                resourceName: r("campaignBudgets", 1),
                name: `${campaign_name} Budget ${tag}`,
                amountMicros: budgetMicros,
                deliveryMethod: "STANDARD",
                explicitlyShared: false,
            } } },
            { campaignOperation: { create: {
                resourceName: r("campaigns", 2),
                name: `${campaign_name} ${tag}`,
                status: "PAUSED",
                advertisingChannelType: "DISPLAY",
                campaignBudget: r("campaignBudgets", 1),
                manualCpc: {},
                networkSettings: {
                    targetGoogleSearch: false,
                    targetSearchNetwork: false,
                    targetContentNetwork: true,
                    targetPartnerSearchNetwork: false,
                },
            } } },
            { adGroupOperation: { create: {
                resourceName: r("adGroups", 3),
                name: `${campaign_name} Ad Group ${tag}`,
                campaign: r("campaigns", 2),
                status: "ENABLED",
                type: "DISPLAY_STANDARD",
            } } },
            { assetOperation: { create: {
                resourceName: r("assets", 4),
                name: `${campaign_name} Image ${tag}`,
                imageAsset: { data: imageData },
            } } },
            { adGroupAdOperation: { create: {
                adGroup: r("adGroups", 3),
                status: "PAUSED",
                ad: {
                    finalUrls: [final_url || "https://example.com"],
                    responsiveDisplayAd: {
                        marketingImages: [{ asset: r("assets", 4) }],
                        squareMarketingImages: [{ asset: r("assets", 4) }],
                        headlines: [{ text: (headline || campaign_name).slice(0, 30) }],
                        longHeadline: { text: (long_headline || headline || campaign_name).slice(0, 90) },
                        descriptions: [{ text: (description || "Learn more.").slice(0, 90) }],
                        businessName: (business_name || campaign_name).slice(0, 25),
                    },
                },
            } } },
        ];

        const res = await fetch(`${ADS_BASE}/customers/${cid}/googleAds:mutate`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
                "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
                "login-customer-id": cid,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ mutateOperations }),
        });

        const data = await res.json();
        if (!res.ok) {
            // Google Ads errors are deeply nested — surface the most useful message.
            const ge = data.error;
            const detail =
                ge?.details?.[0]?.errors?.[0]?.message ||
                ge?.message ||
                "Google Ads campaign creation failed";
            console.error("google-ads/publish error:", JSON.stringify(data));
            const status = res.status === 401 ? 401 : 400;
            return NextResponse.json({ error: detail }, { status });
        }

        // Pull the campaign resource name out of the batch responses for reference.
        const campaign = (data.mutateOperationResponses || [])
            .map((o) => o.campaignResult?.resourceName)
            .find(Boolean) || null;

        return NextResponse.json({ ok: true, campaign, responses: data.mutateOperationResponses });
    } catch (err) {
        console.error("google-ads/publish exception:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
