// app/api/twitter/post/route.js
//
// Server-side publish to X (Twitter). This MUST run server-side: the X API has no
// browser CORS, so unlike Facebook/Instagram we can't post from the client.
//
// Flow:
//   1. Refresh the access token (X access tokens last ~2h; X ROTATES the refresh token
//      on every refresh, so we return the new one for the caller to persist).
//   2. (optional) Upload the image to X's v2 media endpoint → media_id. Needs the
//      `media.write` scope on the connected account.
//   3. Create the tweet (v2 /tweets), attaching the media_id when present.

const CLIENT_ID = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

const MAX_TWEET_LEN = 280;

async function refreshAccessToken(refresh_token) {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
      client_id: CLIENT_ID,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    const msg =
      data.error_description ||
      data.error ||
      "X session expired — reconnect your X account.";
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
  return {
    access_token: data.access_token,
    // X rotates the refresh token; fall back to the old one if it didn't send a new one.
    refresh_token: data.refresh_token || refresh_token,
  };
}

async function uploadImage(image_url, access_token) {
  // Download the image server-side (X needs the bytes; the browser can't reach X anyway).
  const imgRes = await fetch(image_url);
  if (!imgRes.ok) {
    const err = new Error("Couldn't download the image to attach to the tweet.");
    err.status = 400;
    throw err;
  }
  const contentType = imgRes.headers.get("content-type") || "image/png";
  const arrayBuf = await imgRes.arrayBuffer();
  const blob = new Blob([arrayBuf], { type: contentType });

  // X v2 media upload (OAuth 2.0 user context; requires the media.write scope).
  const form = new FormData();
  form.append("media", blob);
  form.append("media_category", "tweet_image");

  const upRes = await fetch("https://api.x.com/2/media/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}` },
    body: form,
  });
  const upData = await upRes.json().catch(() => ({}));
  if (!upRes.ok || upData.errors || upData.error) {
    console.error("X media upload error:", upData);
    const msg =
      upData.detail ||
      upData.title ||
      upData.errors?.[0]?.message ||
      "Image upload to X failed — the account may be missing the media.write scope (reconnect X after it's added).";
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
  // v2 returns the id under data.id; cover legacy field names defensively.
  return upData.data?.id || upData.media_id_string || upData.media_id;
}

export async function POST(req) {
  // Hoisted so the catch can return it: the refresh below rotates the token on X's side, so
  // even if a LATER step (media upload, tweet create) throws, the caller MUST get the rotated
  // token back — otherwise it keeps using the now-dead old one and the next attempt fails with
  // "Value passed for the token was invalid." (This is exactly the media-upload "no credits" case.)
  let rotatedRefresh;
  try {
    const { refresh_token, text, image_url } = await req.json();

    if (!refresh_token) {
      return Response.json(
        { error: "Missing X session token — reconnect your X account." },
        { status: 400 }
      );
    }

    // 1. Always refresh → a guaranteed-valid access token (+ the rotated refresh token).
    const { access_token, refresh_token: newRefresh } =
      await refreshAccessToken(refresh_token);
    rotatedRefresh = newRefresh;

    // 2. Optional media.
    let media_ids;
    if (image_url) {
      const mediaId = await uploadImage(image_url, access_token);
      if (mediaId) media_ids = [String(mediaId)];
    }

    // 3. Create the tweet. (Tweets cap at 280 chars; a media-only tweet needs no text.)
    const body = {};
    const trimmed = (text || "").slice(0, MAX_TWEET_LEN);
    if (trimmed) body.text = trimmed;
    if (media_ids) body.media = { media_ids };
    if (!body.text && !body.media) {
      return Response.json(
        { error: "Nothing to post — add a caption or an image.", refresh_token: newRefresh },
        { status: 400 }
      );
    }

    const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(body),
    });
    const tweetData = await tweetRes.json().catch(() => ({}));

    if (!tweetRes.ok || tweetData.errors || tweetData.error) {
      console.error("X tweet error:", tweetData);
      const msg =
        tweetData.detail ||
        tweetData.title ||
        tweetData.errors?.[0]?.message ||
        "Failed to post the tweet.";
      // Still return the rotated refresh token so the caller can persist it.
      return Response.json(
        { error: msg, details: tweetData, refresh_token: newRefresh },
        { status: 400 }
      );
    }

    return Response.json({
      tweet_id: tweetData.data?.id,
      // Caller MUST persist this — the old refresh token is now invalid (rotation).
      refresh_token: newRefresh,
    });
  } catch (err) {
    // Return the rotated refresh token even on failure — the refresh may have already
    // succeeded (rotating the token) before a later step threw, so the caller must persist
    // the new one or the next attempt uses a dead token.
    return Response.json(
      { error: err.message || "X publish failed", refresh_token: rotatedRefresh },
      { status: err.status || 500 }
    );
  }
}
