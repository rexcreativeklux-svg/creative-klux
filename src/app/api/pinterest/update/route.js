// app/api/pinterest/update/route.js
//
// Updates a published Pinterest pin's title/description/link via PATCH /v5/pins/{id}.
// Server-side: the Pinterest API sends no browser CORS headers. PATCH only touches the
// fields we send, so an unchanged field is left as-is.

export async function POST(req) {
  try {
    const { access_token, pin_id, title, description, link } = await req.json();

    if (!access_token) {
      return Response.json(
        { error: "Missing access token — reconnect Pinterest." },
        { status: 400 },
      );
    }
    if (!pin_id) {
      return Response.json({ error: "Missing pin id." }, { status: 400 });
    }

    const body = {};
    if (title != null) body.title = String(title).slice(0, 100);
    if (description != null) body.description = String(description).slice(0, 800);
    if (link) body.link = link;

    const res = await fetch(`https://api.pinterest.com/v5/pins/${pin_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.code) {
      console.error("Pinterest update error:", data);
      return Response.json(
        {
          error: data.message || `Failed to update pin (${res.status}).`,
          details: data,
        },
        { status: 400 },
      );
    }

    return Response.json({ ok: true, pin_id: data.id || pin_id });
  } catch (err) {
    return Response.json(
      { error: err.message || "Pinterest update failed" },
      { status: 500 },
    );
  }
}
