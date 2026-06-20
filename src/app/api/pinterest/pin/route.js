// app/api/pinterest/pin/route.js
//
// Creates a Pin on a board. Server-side (Pinterest API has no browser CORS). Pinterest
// is image-native: we hand it a public image URL via media_source and Pinterest fetches
// it — no multi-step upload like LinkedIn/YouTube.

export async function POST(req) {
  try {
    const { access_token, board_id, title, description, image_url, link } =
      await req.json();

    if (!access_token) {
      return Response.json(
        { error: "Missing access token — reconnect Pinterest." },
        { status: 400 }
      );
    }
    if (!board_id) {
      return Response.json(
        { error: "Pick a Pinterest board to pin to." },
        { status: 400 }
      );
    }
    if (!image_url) {
      return Response.json(
        { error: "Pinterest needs an image to create a pin." },
        { status: 400 }
      );
    }

    const body = {
      board_id,
      title: (title || "").slice(0, 100),
      description: (description || "").slice(0, 800),
      media_source: { source_type: "image_url", url: image_url },
    };
    if (link) body.link = link;

    const res = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.code) {
      console.error("Pinterest pin error:", data);
      return Response.json(
        { error: data.message || `Failed to create pin (${res.status}).`, details: data },
        { status: 400 }
      );
    }

    return Response.json({
      pin_id: data.id,
      url: data.id ? `https://www.pinterest.com/pin/${data.id}` : undefined,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Pinterest publish failed" },
      { status: 500 }
    );
  }
}
