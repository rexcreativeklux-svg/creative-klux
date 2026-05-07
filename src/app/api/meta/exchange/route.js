import { NextResponse } from "next/server";

const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = "https://app.creativeklux.com/oauth-callback";

export async function POST(req) {
  try {
    const body = await req.json();
    const { access_token, code } = body;

    if (!access_token && !code) {
      return NextResponse.json(
        { error: "Missing access_token or code" },
        { status: 400 }
      );
    }

    let shortLivedToken = access_token;

    // ── Step 1: If we got a code, exchange it for a short-lived token first ──
    if (code) {
      const codeExchangeUrl =
        `https://graph.facebook.com/v23.0/oauth/access_token` +
        `?client_id=${APP_ID}` +
        `&client_secret=${APP_SECRET}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&code=${code}`;

      const codeRes = await fetch(codeExchangeUrl);
      const codeData = await codeRes.json();

      if (codeData.error) {
        return NextResponse.json(
          { error: codeData.error.message },
          { status: 400 }
        );
      }

      shortLivedToken = codeData.access_token;
    }

    // ── Step 2: Exchange short-lived token for long-lived token (~60 days) ──
    const longLivedUrl =
      `https://graph.facebook.com/v23.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${APP_ID}` +
      `&client_secret=${APP_SECRET}` +
      `&fb_exchange_token=${shortLivedToken}`;

    const longRes = await fetch(longLivedUrl);
    const longData = await longRes.json();

    if (longData.error) {
      return NextResponse.json(
        { error: longData.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      access_token: longData.access_token,
      expires_in: longData.expires_in,
      token_type: longData.token_type,
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}