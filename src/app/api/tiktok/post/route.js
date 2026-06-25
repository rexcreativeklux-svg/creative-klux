// app/api/tiktok/post/route.js
//
// Server-side publish to TikTok. Must run server-side: open.tiktokapis.com has no browser
// CORS, and the refresh call needs the client secret.
//
// Flow:
//   1. Refresh the access token (TikTok access tokens last ~24h; the refresh token can
//      rotate, so we return whatever comes back for the caller to persist).
//   2. Create a PHOTO post via the Content Posting API (PULL_FROM_URL — TikTok fetches the
//      public image URL itself, so no byte upload). Our creatives are images, so a photo
//      post is the natural fit (no video bridge needed).
//
// ⚠️ Caveats (TikTok-side, not code):
//   - The app must be AUDITED for direct posting; until then TikTok forces posts to private
//     and only the app owner / added test users can post. Pass privacy_level: "SELF_ONLY"
//     to test before audit.
//   - PULL_FROM_URL requires the image URL's DOMAIN to be verified in the TikTok developer
//     portal (URL properties). Unverified → TikTok rejects with a url-ownership error.

const CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const CONTENT_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/content/init/";

const MAX_TITLE = 90; // TikTok photo title cap
const MAX_DESC = 4000; // photo description cap

async function refreshAccessToken(refresh_token) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const msg =
      data.error_description ||
      data.error ||
      "TikTok session expired — reconnect your TikTok account.";
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
  return {
    access_token: data.access_token,
    // TikTok can rotate the refresh token; fall back to the old one if it didn't send a new one.
    refresh_token: data.refresh_token || refresh_token,
  };
}

export async function POST(req) {
  // Hoisted so the catch returns it even if a step after the refresh throws — the refresh
  // rotates the token on TikTok's side, so the caller must always get the new one back.
  let rotatedRefresh;
  try {
    const {
      refresh_token,
      title,
      description,
      image_url,
      // Default to a real public post; pass "SELF_ONLY" to test before the app is audited.
      privacy_level = "PUBLIC_TO_EVERYONE",
    } = await req.json();

    if (!refresh_token) {
      return Response.json(
        { error: "Missing TikTok session token — reconnect your TikTok account." },
        { status: 400 }
      );
    }
    if (!CLIENT_SECRET) {
      return Response.json(
        { error: "TikTok isn't configured — TIKTOK_CLIENT_SECRET is missing on the server." },
        { status: 500 }
      );
    }
    if (!image_url) {
      return Response.json(
        { error: "TikTok needs an image to create a photo post." },
        { status: 400 }
      );
    }

    // 1. Always refresh → a guaranteed-valid access token (+ the rotated refresh token).
    const { access_token, refresh_token: newRefresh } =
      await refreshAccessToken(refresh_token);
    rotatedRefresh = newRefresh;

    // 2. Create the photo post.
    const body = {
      post_info: {
        title: (title || "").slice(0, MAX_TITLE),
        description: (description || "").slice(0, MAX_DESC),
        disable_comment: false,
        privacy_level,
        auto_add_music: true,
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_cover_index: 0,
        photo_images: [image_url],
      },
      post_mode: "DIRECT_POST",
      media_type: "PHOTO",
    };

    const res = await fetch(CONTENT_INIT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));

    // v2 content endpoints wrap the result: { data: { publish_id }, error: { code: "ok" } }.
    const ok = res.ok && (!data.error || data.error.code === "ok");
    if (!ok) {
      console.error("TikTok content init error:", res.status, data);
      const msg =
        data.error?.message ||
        data.error?.code ||
        `TikTok post failed (HTTP ${res.status}).`;
      // Still return the rotated refresh token so the next attempt doesn't use a dead one.
      return Response.json(
        { error: msg, details: data, refresh_token: newRefresh },
        { status: 400 }
      );
    }

    return Response.json({
      publish_id: data.data?.publish_id,
      // Caller MUST persist this — the old refresh token may now be invalid (rotation).
      refresh_token: newRefresh,
    });
  } catch (err) {
    // Return the rotated token even on failure (refresh may have already rotated it).
    return Response.json(
      { error: err.message || "TikTok publish failed", refresh_token: rotatedRefresh },
      { status: err.status || 500 }
    );
  }
}
