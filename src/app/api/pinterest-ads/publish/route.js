// /api/pinterest-ads/publish/route.js
//
// Creates a real Pinterest promoted-pin ad: pin → campaign → ad group → ad.
// Server-side (Pinterest API has no browser CORS), reuses the connected Pinterest token
// (the pinterest_ads scope already includes pins:write + ads:write). Image-native — a
// Pinterest ad IS a promoted pin, so no video bridge.
//
// Created PAUSED (campaign/ad group status "PAUSED") so nothing spends until enabled in
// Pinterest Ads Manager. Budget lives on the ad group (daily, micro-currency).
//
// ⚠️ UNTESTED. Assumptions: objective CONSIDERATION (traffic), billable_event CLICKTHROUGH,
// auto-targeting (no geo/interest targeting_spec), automatic bid. Pinterest "Trial access"
// apps can only act on the app owner's own ad account — multi-user needs Standard access.

import { NextResponse } from "next/server";

const V5 = "https://api.pinterest.com/v5";

export async function POST(req) {
    try {
        const {
            access_token,
            ad_account_id,
            board_id,
            image_url,
            title,
            description,
            link,
            daily_budget,           // account-currency units (e.g. 2000)
            campaign_name = "Creative Klux Campaign",
            objective_type = "CONSIDERATION",
        } = await req.json();

        if (!access_token || !ad_account_id)
            return NextResponse.json({ error: "Reconnect Pinterest Ads — missing token / ad account." }, { status: 401 });
        if (!board_id) return NextResponse.json({ error: "Pick a Pinterest board first." }, { status: 400 });
        if (!image_url) return NextResponse.json({ error: "No image to promote." }, { status: 400 });

        const headers = {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
        };
        const budgetMicros = Math.round((Number(daily_budget) || 2000) * 1_000_000);

        // Pinterest v5 ad-entity endpoints are BATCH: body is an array, response is
        // { items: [{ data?, exceptions? }] }. Pull the id / surface the exception.
        const batch = async (path, obj) => {
            const res = await fetch(`${V5}${path}`, { method: "POST", headers, body: JSON.stringify([obj]) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || `Pinterest error at ${path}`);
            const item = data.items?.[0] || {};
            const ex = item.exceptions || item.data?.exceptions;
            if (ex) throw new Error(ex.message || `Pinterest rejected ${path}`);
            const id = item.data?.id || item.id;
            if (!id) throw new Error(`No id returned from ${path}`);
            return id;
        };

        // 1. Create the pin to promote.
        const pinRes = await fetch(`${V5}/pins`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                board_id,
                title: (title || campaign_name).slice(0, 100),
                description: (description || "").slice(0, 800),
                link: link || undefined,
                media_source: { source_type: "image_url", url: image_url },
            }),
        });
        const pin = await pinRes.json();
        if (!pinRes.ok) {
            console.error("pinterest-ads pin error:", JSON.stringify(pin));
            return NextResponse.json({ error: pin.message || "Failed to create the pin" }, { status: 400 });
        }
        const pin_id = pin.id;

        // 2. Campaign (PAUSED).
        const campaign_id = await batch(`/ad_accounts/${ad_account_id}/campaigns`, {
            ad_account_id,
            name: `${campaign_name} ${Date.now().toString(36)}`,
            objective_type,
            status: "PAUSED",
        });

        // 3. Ad group (PAUSED) — daily budget, auto-targeting.
        const ad_group_id = await batch(`/ad_accounts/${ad_account_id}/ad_groups`, {
            ad_account_id,
            campaign_id,
            name: `${campaign_name} Ad Group`,
            status: "PAUSED",
            budget_in_micro_currency: budgetMicros,
            budget_type: "DAILY",
            billable_event: "CLICKTHROUGH",
            auto_targeting_enabled: true,
        });

        // 4. Ad (PAUSED) — the promoted pin.
        const ad_id = await batch(`/ad_accounts/${ad_account_id}/ads`, {
            ad_account_id,
            ad_group_id,
            pin_id,
            creative_type: "REGULAR",
            name: campaign_name,
            status: "PAUSED",
        });

        return NextResponse.json({ ok: true, pin_id, campaign_id, ad_group_id, ad_id });
    } catch (err) {
        console.error("pinterest-ads/publish exception:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
