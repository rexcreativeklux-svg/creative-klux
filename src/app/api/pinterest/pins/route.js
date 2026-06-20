// app/api/pinterest/pins/route.js
//
// Lists the connected account's recent pins (for the Calendar / Publishing pages).
// Server-side because the Pinterest API has no browser CORS.

export async function POST(req) {
  try {
    const { access_token } = await req.json();
    if (!access_token) {
      return Response.json(
        { error: "Missing access token — reconnect Pinterest." },
        { status: 400 }
      );
    }

    const res = await fetch(
      "https://api.pinterest.com/v5/pins?page_size=25",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.code) {
      return Response.json(
        { error: data.message || "Failed to fetch pins." },
        { status: 400 }
      );
    }

    return Response.json({ pins: data.items || [] });
  } catch (err) {
    return Response.json(
      { error: err.message || "Pinterest pins fetch failed" },
      { status: 500 }
    );
  }
}
