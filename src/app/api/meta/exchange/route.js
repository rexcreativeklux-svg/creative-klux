import { NextResponse } from "next/server";

const APP_ID = process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = "https://app.creativeklux.com/oauth-callback";

/**
 * Exchanges short-lived token → long-lived token
 */
export async function POST(req) {
  try {
    const { access_token } = await req.json();

    if (!access_token) {
      return NextResponse.json(
        { error: "Missing access_token" },
        { status: 400 }
      );
    }

    // Step 1: exchange for long-lived token
    const url =
      `https://graph.facebook.com/v23.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${APP_ID}` +
      `&client_secret=${APP_SECRET}` +
      `&fb_exchange_token=${access_token}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message },
        { status: 400 }
      );
    }

    // data.access_token = long-lived token (~60 days)
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}