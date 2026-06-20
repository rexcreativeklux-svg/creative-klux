// app/api/twitter/posts/route.js
//
// Server-side fetch of a connected X account's recent tweets (for the Calendar /
// Publishing pages). Server-side because the X API has no browser CORS. Refreshes the
// 2h access token first and returns the rotated refresh token for the caller to persist.

const CLIENT_ID = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

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
    const err = new Error(
      data.error_description || data.error || "X session expired — reconnect X."
    );
    err.status = 400;
    throw err;
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refresh_token, // X rotates it
  };
}

export async function POST(req) {
  try {
    const { refresh_token, user_id } = await req.json();
    if (!refresh_token) {
      return Response.json(
        { error: "Missing X session token — reconnect X." },
        { status: 400 }
      );
    }
    if (!user_id) {
      return Response.json({ error: "Missing X user id." }, { status: 400 });
    }

    const { access_token, refresh_token: newRefresh } =
      await refreshAccessToken(refresh_token);

    // Recent tweets, with any attached media resolved via expansions.
    const url =
      `https://api.twitter.com/2/users/${user_id}/tweets` +
      `?max_results=20&tweet.fields=created_at` +
      `&expansions=attachments.media_keys&media.fields=url,preview_image_url`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.errors) {
      const msg =
        data.detail ||
        data.title ||
        data.errors?.[0]?.message ||
        "Failed to fetch tweets.";
      return Response.json(
        { error: msg, refresh_token: newRefresh },
        { status: 400 }
      );
    }

    return Response.json({
      tweets: data.data || [],
      media: data.includes?.media || [],
      // Caller must persist this — the old refresh token is now invalid (rotation).
      refresh_token: newRefresh,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "X fetch failed" },
      { status: err.status || 500 }
    );
  }
}
