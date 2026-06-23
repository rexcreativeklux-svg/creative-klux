import { LINKEDIN_API_VERSION } from "@/(lib)/linkedinConfig";

// LinkedIn Ads — list the ad accounts the connected member can access.
// Runs server-side: api.linkedin.com has no browser CORS and the REST API needs the
// versioned headers (LinkedIn-Version + X-Restli-Protocol-Version).
//
// ⚠️ Requires the Marketing Developer Platform (Advertising API) products approved on the
// LinkedIn app so the `r_ads`/`rw_ads` scopes are actually granted at connect — same kind
// of approval gate as "Share on LinkedIn". Without it the finder returns 403 ACCESS_DENIED.
export async function POST(req) {
    const { access_token } = await req.json();

    if (!access_token) {
        return Response.json({ error: "Missing access token" }, { status: 400 });
    }

    // Finder: all ad accounts the authenticated member has a role on.
    const res = await fetch(
        "https://api.linkedin.com/rest/adAccounts?q=search&pageSize=100",
        {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "LinkedIn-Version": LINKEDIN_API_VERSION,
                "X-Restli-Protocol-Version": "2.0.0",
            },
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error("LinkedIn ad-accounts error:", res.status, JSON.stringify(data));
        // 403 here almost always means the Advertising API products aren't approved on the
        // app (so the r_ads/rw_ads scopes weren't really granted) — surface that clearly.
        const hint =
            res.status === 403
                ? " — the LinkedIn app likely doesn't have the Marketing Developer Platform (Advertising API) approved, so the ads scopes weren't granted. Apply for it, then reconnect."
                : "";
        return Response.json(
            { error: (data.message || "Failed to load LinkedIn ad accounts") + hint, details: data },
            { status: res.status }
        );
    }

    const adAccounts = (data.elements || []).map((acc) => ({
        // Numeric id — the publish step builds urn:li:sponsoredAccount:<id> from it.
        id: String(acc.id),
        name: acc.name || `Ad Account ${acc.id}`,
    }));

    if (!adAccounts.length) {
        return Response.json(
            { error: "No LinkedIn ad accounts found for this member." },
            { status: 404 }
        );
    }

    return Response.json({ adAccounts });
}
