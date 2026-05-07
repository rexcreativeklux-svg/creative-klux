export async function POST(req) {
    const { code } = await req.json();

    // ─────────────────────────────────────────
    // 1. TOKEN EXCHANGE
    // ─────────────────────────────────────────
    const tokenRes = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
                client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID, // ⚠️ recommended change
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            }),
        }
    );

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
    // 2. USERINFO (OPENID CONNECT)
    // ─────────────────────────────────────────
    const profileRes = await fetch(
        "https://api.linkedin.com/v2/userinfo",
        {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }
    );

    const profile = await profileRes.json();

    if (!profileRes.ok) {
        return Response.json(
            {
                error: "Failed to fetch profile",
                details: profile,
            },
            { status: profileRes.status }
        );
    }

    return Response.json({
        access_token,

        // LinkedIn OpenID field = stable user ID
        int_id: profile.sub,

        // optional useful fields
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
    });
}