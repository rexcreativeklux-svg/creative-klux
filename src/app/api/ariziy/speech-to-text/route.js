import { NextResponse } from "next/server";

import { upstreamDetail } from "../upstreamError";

/**
 * Ariziy speech-to-text proxy.
 *
 * ⚠️ THE UPSTREAM ENDPOINT IS BROKEN AS OF 2026-08-29, and this handler is
 * written knowing it. Probed behaviour:
 *
 *   no file part          → 422 {"detail":[{"loc":["body","file"],"msg":"Field required"}]}
 *   file, text/plain      → 415 {"detail":"Unsupported audio type: text/plain"}
 *   file, octet-stream    → 415 {"detail":"Unsupported audio type: application/octet-stream"}
 *   file, audio/mpeg      → 502  error code: 502   ← every time, ~1.5s
 *   file, audio/wav       → 502  error code: 502
 *
 * So it validates the upload and then dies upstream. 1.5s is far too fast to be
 * a transcription timing out; this is Ariziy's to fix. The success shape has
 * therefore never been seen — see extractTranscript in magic-studio-audio.js,
 * which guesses at four common ones and logs anything it doesn't recognise.
 *
 * ⚠️ THE MIME TYPE IS LOAD-BEARING. A file part sent without an explicit type
 * arrives as application/octet-stream and is rejected with a 415 before any
 * transcription is attempted, so the part is re-added below with its type
 * preserved rather than the request being forwarded as-is.
 *
 *   POST https://api.ariziy.com/v1/speech-to-text
 *   X-API-Key: <key>
 *   multipart/form-data; file=<audio>
 */

const ARIZIY_API_KEY = process.env.ARIZIY_API_KEY;
const ARIZIY_API_BASE = process.env.ARIZIY_API_BASE || "https://api.ariziy.com";

/** Extensions we can name a Content-Type for when the browser didn't. */
const MIME_BY_EXT = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
  webm: "audio/webm",
};

export async function POST(request) {
  if (!ARIZIY_API_KEY) {
    return NextResponse.json(
      { error: "Ariziy API key not configured" },
      { status: 500 },
    );
  }

  let file;
  let incoming;
  try {
    incoming = await request.formData();
    file = incoming.get("file");
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 },
    );
  }

  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "Please upload or record some audio." },
      { status: 400 },
    );
  }

  // Give the part a real audio type. Without one the upload reaches Ariziy as
  // application/octet-stream and is refused with a 415 that reads like a bad
  // file rather than a missing header.
  const name = file.name || "audio.mp3";
  const ext = name.split(".").pop()?.toLowerCase();
  const type =
    file.type && file.type !== "application/octet-stream"
      ? file.type
      : MIME_BY_EXT[ext] || "audio/mpeg";

  const form = new FormData();
  form.append("file", new File([await file.arrayBuffer()], name, { type }));
  // Forwarded on the chance the endpoint supports them once it works — none of
  // them could be confirmed while every audio request 502s.
  for (const key of ["language", "format", "quality"]) {
    const value = incoming.get(key);
    if (typeof value === "string" && value) form.append(key, value);
  }

  try {
    const upstream = await fetch(`${ARIZIY_API_BASE}/v1/speech-to-text`, {
      method: "POST",
      headers: { "X-API-Key": ARIZIY_API_KEY },
      body: form,
    });

    const raw = await upstream.text();

    if (!upstream.ok) {
      const detail = upstreamDetail(raw, upstream.status);
      console.error(`❌ [ariziy/stt] upstream ${upstream.status}:`, detail);

      // 502 is the known-broken path and deserves its own sentence — "please
      // try again" is wrong advice for a service that has failed identically on
      // every request since it was first probed.
      const message =
        upstream.status === 502
          ? "The transcription service is currently unavailable."
          : "Transcription failed";

      return NextResponse.json(
        { error: message, detail, status: upstream.status },
        { status: upstream.status },
      );
    }

    try {
      return NextResponse.json(JSON.parse(raw));
    } catch {
      // A 200 that isn't JSON — plain text is a plausible shape for a
      // transcript, so pass it on rather than failing a successful run.
      console.warn("⚠️ [ariziy/stt] non-JSON 200, treating as plain text");
      return NextResponse.json({ text: raw });
    }
  } catch (error) {
    console.error("❌ [ariziy/stt] request failed:", error);
    return NextResponse.json(
      { error: "Failed to reach the transcription service", detail: error.message },
      { status: 502 },
    );
  }
}
