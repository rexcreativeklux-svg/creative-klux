// /api/tiktok-ads/exchange/route.js
//
// TikTok ADS = the TikTok Marketing API (business-api.tiktok.com), a SEPARATE app from
// the organic TikTok Login Kit. Runs server-side (needs the app secret). Turns the portal
// `auth_code` into a long-lived access token + the list of advertiser (ad) accounts.
//
// ⚠️ Needs a TikTok for Business app with Marketing API access:
//   NEXT_PUBLIC_TIKTOK_ADS_APP_ID + TIKTOK_ADS_APP_SECRET in .env.
// Marketing API access tokens are long-lived (no refresh dance like the organic API).

import { NextResponse } from "next/server";

const BASE = "https://business-api.tiktok.com/open_api/v1.3";

export async function POST(req) {
    try {
        const { auth_code } = await req.json();
        const app_id = process.env.NEXT_PUBLIC_TIKTOK_ADS_APP_ID;
        const secret = process.env.TIKTOK_ADS_APP_SECRET;

        if (!app_id || !secret)
            return NextResponse.json({ error: "TikTok Ads app not configured (NEXT_PUBLIC_TIKTOK_ADS_APP_ID / TIKTOK_ADS_APP_SECRET)." }, { status: 500 });
        if (!auth_code)
            return NextResponse.json({ error: "Missing auth_code from TikTok." }, { status: 400 });

        // 1. auth_code → access token (+ advertiser_ids)
        const tokRes = await fetch(`${BASE}/oauth2/access_token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ app_id, secret, auth_code }),
        });
        const tok = await tokRes.json();
        if (tok.code !== 0) {
            console.error("tiktok-ads/exchange token error:", JSON.stringify(tok));
            return NextResponse.json({ error: tok.message || "TikTok token exchange failed" }, { status: 400 });
        }
        const access_token = tok.data?.access_token;

        // 2. Resolve advertiser (ad-account) names for the picker.
        let advertisers = [];
        try {
            const advRes = await fetch(
                `${BASE}/oauth2/advertiser/get/?app_id=${app_id}&secret=${secret}`,
                { headers: { "Access-Token": access_token } }
            );
            const adv = await advRes.json();
            if (adv.code === 0) {
                advertisers = (adv.data?.list || []).map((a) => ({
                    id: a.advertiser_id,
                    name: a.advertiser_name || `Advertiser ${a.advertiser_id}`,
                }));
            }
        } catch (e) {
            console.warn("tiktok-ads advertiser/get failed:", e);
        }

        return NextResponse.json({ access_token, advertisers });
    } catch (err) {
        console.error("tiktok-ads/exchange exception:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
