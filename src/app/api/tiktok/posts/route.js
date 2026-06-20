// app/api/tiktok/posts/route.js
//
// Server-side read of the connected account's recent TikTok posts (for the calendar /
// publishing pages). Must run server-side: no browser CORS, and the refresh needs the
// client secret. Refreshes the 24h token first (returns the rotated refresh token so the
// caller persists it), then lists recent videos/photo posts.

const CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const LIST_URL =
  "https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,cover_image_url,create_time,share_url";

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
    const err = new Error(
      data.error_description || data.error || "TikTok session expired."
    );
    err.status = 400;
    throw err;
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refresh_token,
  };
}

export async function POST(req) {
  try {
    const { refresh_token } = await req.json();
    if (!refresh_token) {
      return Response.json({ error: "Missing TikTok session token." }, { status: 400 });
    }
    if (!CLIENT_SECRET) {
      return Response.json({ error: "TikTok not configured." }, { status: 500 });
    }

    const { access_token, refresh_token: newRefresh } =
      await refreshAccessToken(refresh_token);

    const res = await fetch(LIST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_count: 20 }),
    });
    const data = await res.json().catch(() => ({}));

    const ok = res.ok && (!data.error || data.error.code === "ok");
    if (!ok) {
      console.error("TikTok video list error:", res.status, data);
      return Response.json(
        { error: data.error?.message || "Couldn't load TikTok posts.", refresh_token: newRefresh },
        { status: 400 }
      );
    }

    return Response.json({
      videos: data.data?.videos || [],
      refresh_token: newRefresh,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "TikTok posts fetch failed" },
      { status: err.status || 500 }
    );
  }
}
