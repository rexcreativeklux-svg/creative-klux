export async function POST(req) {
    const { code } = await req.json();

    // ─────────────────────────────────────────
    // 1. TOKEN EXCHANGE REQUEST
    // ─────────────────────────────────────────
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        }),
    });

    // ✅ ADD THIS RIGHT HERE (immediately after fetch)
    if (!tokenRes.ok) {
        const err = await tokenRes.json();
        return Response.json(
            { error: "Token exchange failed", details: err },
            { status: 400 }
        );
    }

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
        return Response.json(
            { error: "No access token returned", details: tokenData },
            { status: 400 }
        );
    }

    const access_token = tokenData.access_token;

    // ─────────────────────────────────────────
    // 2. PROFILE REQUEST
    // ─────────────────────────────────────────
    const profileRes = await fetch("https://api.linkedin.com/v2/me", {
        headers: {
            Authorization: `Bearer ${access_token}`,
            "X-Restli-Protocol-Version": "2.0.0",
        },
    });

    // ✅ ADD THIS RIGHT HERE (immediately after fetch)
    if (!profileRes.ok) {
        const err = await profileRes.json();
        return Response.json(
            { error: "Failed to fetch profile", details: err },
            { status: 400 }
        );
    }

    const profile = await profileRes.json();

    return Response.json({
        access_token,
        int_id: profile.id,
    });
}