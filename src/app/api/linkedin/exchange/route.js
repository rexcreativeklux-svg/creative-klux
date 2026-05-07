export async function POST(req) {
    const { code } = await req.json();

    // STEP 1: exchange
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        }),
    });

    const tokenData = await tokenRes.json();

    const access_token = tokenData.access_token;

    // STEP 2: fetch user profile
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });

    const profile = await profileRes.json();

    return Response.json({
        access_token,
        int_id: profile.sub || profile.id || null,
    });
}