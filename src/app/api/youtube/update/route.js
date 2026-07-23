// app/api/youtube/update/route.js
//
// Updates a published YouTube video's description (and title) via the Data API's
// videos.update. Server-side: googleapis sends no Access-Control-Allow-Origin, so the
// browser can't call it directly (CORS block). Needs a token with the
// `https://www.googleapis.com/auth/youtube` scope — the connect flow already requests it.
//
// videos.update REPLACES the whole snippet (any omitted field is cleared, and
// title + categoryId are required), so we read the current snippet first and only
// swap in the new description/title before writing it back.

export async function POST(req) {
  try {
    const { access_token, video_id, title, description } = await req.json();

    if (!access_token) {
      return Response.json(
        { error: "No access token — reconnect your YouTube account." },
        { status: 400 },
      );
    }
    if (!video_id) {
      return Response.json({ error: "Missing video id." }, { status: 400 });
    }

    // Step 1 — read the existing snippet so we preserve title/categoryId.
    const getRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${video_id}`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    const getData = await getRes.json().catch(() => ({}));
    if (!getRes.ok || getData.error) {
      return Response.json(
        {
          error:
            getData.error?.message ||
            `Couldn't load the video (HTTP ${getRes.status}). If 403, the YouTube edit scope isn't granted — reconnect YouTube.`,
          details: getData,
        },
        { status: 400 },
      );
    }
    const snippet = getData.items?.[0]?.snippet;
    if (!snippet) {
      return Response.json(
        { error: "Video not found — it may have been removed." },
        { status: 404 },
      );
    }

    // Step 2 — write back with the new description (and title, if supplied).
    const updatedSnippet = {
      ...snippet,
      title: (title || snippet.title || "Untitled").slice(0, 100),
      description: description ?? snippet.description ?? "",
      categoryId: snippet.categoryId || "22",
    };

    const putRes = await fetch(
      "https://www.googleapis.com/youtube/v3/videos?part=snippet",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: video_id, snippet: updatedSnippet }),
      },
    );
    const data = await putRes.json().catch(() => ({}));
    if (!putRes.ok || data.error) {
      return Response.json(
        {
          error:
            data.error?.message ||
            `YouTube update failed (HTTP ${putRes.status}).`,
          details: data,
        },
        { status: 400 },
      );
    }

    return Response.json({ ok: true, video_id: data.id || video_id });
  } catch (err) {
    console.error("YouTube update route error:", err);
    return Response.json(
      { error: err.message || "YouTube update failed" },
      { status: 500 },
    );
  }
}
