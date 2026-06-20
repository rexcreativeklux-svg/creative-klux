// /api/google/exchange/route.js

import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { code } = await req.json();

    const params = new URLSearchParams({
      code,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      // Must match the redirect used to build the Google auth URL (oauth/page.jsx
      // GOOGLE_REDIRECT_URI) and the path registered on the Google OAuth client.
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'https://app.creativeklux.com/auth/google/callback',
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',
        },
        body: params,
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: tokenData.error_description || 'Google token exchange failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      // The space-separated list of scopes Google ACTUALLY granted. If the YouTube
      // scopes aren't here, the consent screen / API config dropped them — that's the
      // "insufficient authentication scopes" cause, not a code bug.
      scope: tokenData.scope,
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}