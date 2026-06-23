// /api/tiktok-ads/publish/route.js
//
// Creates a real TikTok ad (campaign → ad group → ad) via the TikTok Marketing API.
// Server-side: no browser CORS + needs the app secret. The browser bridges the image
// creative into a short video (imageUrlToVideoBlob, same as YouTube) and POSTs it here
// as multipart form-data; this route uploads it and builds the chain.
//
// ⚠️ UNTESTED SCAFFOLD. TikTok ad creation is validation-heavy; assumptions made here:
//   - Objective TRAFFIC, single-video ad, optimization CLICK / billing CPC.
//   - Campaign + ad group + ad are created PAUSED (`operation_status: "DISABLE"`) so nothing
//     spends until you enable it in TikTok Ads Manager.
//   - `location_ids` (geo) is REQUIRED by TikTok and has no safe default — must be passed in.
//   - An `identity` (TikTok account that "runs" the ad) is required; we use the first one.
//   - A video needs a cover image; TikTok can auto-pick a poster frame, but some accounts
//     require an explicit `image_ids` cover — if it rejects, that's the likely reason.
// Needs NEXT_PUBLIC_TIKTOK_ADS_APP_ID + TIKTOK_ADS_APP_SECRET. Errors surface TikTok's
// exact `code`/`message`.

import { NextResponse } from "next/server";
import crypto from "crypto";

const BASE = "https://business-api.tiktok.com/open_api/v1.3";

export async function POST(req) {
    try {
        const form = await req.formData();
        const access_token = form.get("access_token");
        const advertiser_id = form.get("advertiser_id");
        const video = form.get("video"); // Blob (bridged from the image)
        const ad_text = (form.get("ad_text") || "").toString().slice(0, 100);
        const landing_url = form.get("landing_url") || "";
        const campaign_name = (form.get("campaign_name") || "Creative Klux Campaign").toString();
        const daily_budget = Number(form.get("daily_budget")) || 2000;
        const location_ids = JSON.parse(form.get("location_ids") || "[]"); // e.g. ["6252001"] (US)

        if (!access_token || !advertiser_id)
            return NextResponse.json({ error: "Missing TikTok access token / advertiser id — reconnect TikTok Ads." }, { status: 401 });
        if (!video || typeof video === "string")
            return NextResponse.json({ error: "No video creative received." }, { status: 400 });
        if (!location_ids.length)
            return NextResponse.json({ error: "Targeting location is required for a TikTok ad group." }, { status: 400 });

        const headers = { "Access-Token": access_token, "Content-Type": "application/json" };
        // JSON POST helper that surfaces TikTok's error body.
        const post = async (path, body) => {
            const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
            const data = await res.json();
            if (data.code !== 0) {
                console.error(`tiktok-ads ${path} error:`, JSON.stringify(data));
                throw new Error(data.message || `TikTok API error at ${path}`);
            }
            return data.data;
        };

        // 1. Upload the video (UPLOAD_BY_FILE needs an MD5 signature of the bytes).
        const bytes = Buffer.from(await video.arrayBuffer());
        const signature = crypto.createHash("md5").update(bytes).digest("hex");
        const uploadForm = new FormData();
        uploadForm.append("advertiser_id", advertiser_id);
        uploadForm.append("upload_type", "UPLOAD_BY_FILE");
        uploadForm.append("video_signature", signature);
        uploadForm.append("video_file", new Blob([bytes], { type: "video/mp4" }), "creative.mp4");
        const upRes = await fetch(`${BASE}/file/video/ad/upload/`, {
            method: "POST",
            headers: { "Access-Token": access_token }, // multipart → let fetch set Content-Type
            body: uploadForm,
        });
        const up = await upRes.json();
        if (up.code !== 0) {
            console.error("tiktok-ads video upload error:", JSON.stringify(up));
            return NextResponse.json({ error: up.message || "TikTok video upload failed" }, { status: 400 });
        }
        const video_id = up.data?.[0]?.video_id || up.data?.video_id;

        // 2. Resolve an identity (the TikTok account the ad runs as).
        const idRes = await fetch(`${BASE}/identity/get/?advertiser_id=${advertiser_id}`, {
            headers: { "Access-Token": access_token },
        });
        const idData = await idRes.json();
        const identity = idData.data?.identity_list?.[0];
        if (!identity) return NextResponse.json({ error: "No TikTok identity found for this advertiser. Add one in Ads Manager." }, { status: 400 });

        // 3. Campaign (PAUSED). Budget lives on the ad group.
        const campaign = await post("/campaign/create/", {
            advertiser_id,
            campaign_name: `${campaign_name} ${Date.now().toString(36)}`,
            objective_type: "TRAFFIC",
            budget_mode: "BUDGET_MODE_INFINITE",
            operation_status: "DISABLE",
        });

        // 4. Ad group (PAUSED) — daily budget, geo, CLICK/CPC, smooth pacing.
        const startSec = Math.floor(Date.now() / 1000) + 600; // ~10 min from now
        const adgroup = await post("/adgroup/create/", {
            advertiser_id,
            campaign_id: campaign.campaign_id,
            adgroup_name: `${campaign_name} Ad Group`,
            placement_type: "PLACEMENT_TYPE_NORMAL",
            placements: ["PLACEMENT_TIKTOK"],
            location_ids,
            budget_mode: "BUDGET_MODE_DAY",
            budget: daily_budget,
            schedule_type: "SCHEDULE_FROM_NOW",
            schedule_start_time: startSec,
            optimization_goal: "CLICK",
            billing_event: "CPC",
            bid_type: "BID_TYPE_NO_BID",
            pacing: "PACING_MODE_SMOOTH",
            operation_status: "DISABLE",
        });

        // 5. Ad (PAUSED).
        const ad = await post("/ad/create/", {
            advertiser_id,
            adgroup_id: adgroup.adgroup_id,
            operation_status: "DISABLE",
            creatives: [{
                ad_name: campaign_name,
                identity_id: identity.identity_id,
                identity_type: identity.identity_type,
                ad_format: "SINGLE_VIDEO",
                video_id,
                ad_text: ad_text || campaign_name,
                call_to_action: "LEARN_MORE",
                landing_page_url: landing_url || "https://example.com",
            }],
        });

        return NextResponse.json({
            ok: true,
            campaign_id: campaign.campaign_id,
            adgroup_id: adgroup.adgroup_id,
            ad_ids: ad.ad_ids,
        });
    } catch (err) {
        console.error("tiktok-ads/publish exception:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
