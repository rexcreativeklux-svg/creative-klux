// app/api/youtube/upload/route.js
//
// Server-side YouTube resumable upload. Must run server-side: googleapis' upload endpoint
// sends no Access-Control-Allow-Origin, so the browser can't upload directly (CORS block).
// The browser builds the video blob (canvas + MediaRecorder — browser-only) and POSTs it
// here as multipart form-data; this route streams it to YouTube.

export async function POST(req) {
  try {
    const form = await req.formData();
    const access_token = form.get("access_token");
    const title = form.get("title");
    const description = form.get("description");
    const privacyStatus = form.get("privacyStatus") || "public";
    const publishAt = form.get("publishAt"); // optional ISO string (scheduling)
    const video = form.get("video"); // Blob/File

    if (!access_token) {
      return Response.json(
        { error: "No access token — reconnect your YouTube account." },
        { status: 400 }
      );
    }
    if (!video || typeof video === "string") {
      return Response.json({ error: "No video data received." }, { status: 400 });
    }

    const bytes = Buffer.from(await video.arrayBuffer());
    const contentType = video.type || "video/webm";

    const metadata = {
      snippet: {
        title: (title || "Untitled").slice(0, 100),
        description: description || "",
        categoryId: "22", // People & Blogs
      },
      status: {
        // Scheduling: YouTube forces private until publishAt.
        privacyStatus: publishAt ? "private" : privacyStatus,
        ...(publishAt ? { publishAt } : {}),
        selfDeclaredMadeForKids: false,
      },
    };

    // Step 1 — open a resumable session; YouTube returns the upload URL in `Location`.
    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": contentType,
          "X-Upload-Content-Length": String(bytes.length),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      console.error("YouTube upload init error:", initRes.status, err);
      return Response.json(
        {
          error:
            err.error?.message ||
            `YouTube upload couldn't start (HTTP ${initRes.status}). If 401, reconnect YouTube; if 403, enable the YouTube Data API on the Google client.`,
          details: err,
        },
        { status: 400 }
      );
    }

    const uploadUrl =
      initRes.headers.get("location") || initRes.headers.get("Location");
    if (!uploadUrl) {
      return Response.json(
        { error: "YouTube did not return an upload URL." },
        { status: 400 }
      );
    }

    // Step 2 — upload the bytes.
    const upRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: bytes,
    });
    const data = await upRes.json().catch(() => ({}));

    if (!upRes.ok || data.error) {
      console.error("YouTube upload error:", upRes.status, data);
      return Response.json(
        {
          error: data.error?.message || `YouTube upload failed (HTTP ${upRes.status}).`,
          details: data,
        },
        { status: 400 }
      );
    }

    return Response.json({
      video_id: data.id,
      url: data.id ? `https://youtube.com/watch?v=${data.id}` : undefined,
    });
  } catch (err) {
    console.error("YouTube upload route error:", err);
    return Response.json(
      { error: err.message || "YouTube upload failed" },
      { status: 500 }
    );
  }
}
