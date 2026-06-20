// app/api/pinterest/boards/route.js
//
// Lists the connected account's boards (for the Publish modal's board picker — a pin
// must be created on a board). Server-side because the Pinterest API has no browser CORS.

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
      "https://api.pinterest.com/v5/boards?page_size=100",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.code) {
      return Response.json(
        { error: data.message || "Failed to load Pinterest boards." },
        { status: 400 }
      );
    }

    return Response.json({
      boards: (data.items || []).map((b) => ({ id: b.id, name: b.name })),
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Pinterest boards fetch failed" },
      { status: 500 }
    );
  }
}
