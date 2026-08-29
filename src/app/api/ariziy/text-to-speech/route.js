import { NextResponse } from "next/server";

import { upstreamDetail } from "../upstreamError";

/**
 * Ariziy text-to-speech proxy.
 *
 * ⚠️ THIS HOP IS NOT OPTIONAL. api.ariziy.com refuses browser origins outright —
 * a preflight from localhost:3000 comes back `400 Disallowed CORS origin` with
 * no Access-Control-Allow-Origin header — so the page physically cannot call it.
 * That the key also stays server-side here is the second reason, not the first.
 *
 * Upstream contract, probed 2026-08-29:
 *
 *   POST https://api.ariziy.com/v1/text-to-speech
 *   X-API-Key: <key>          → 401 {"detail":"Invalid or missing API key"}
 *   { "text": "…",            → required; 422 with a `detail` array if absent
 *     "voice": "asteria",     → one of 41 Aura-2 names; 422 naming all of them
 *     "speed": 1.0 }          → float; 422 float_parsing on a non-number
 *   200 → RAW MP3 BYTES, Content-Type: audio/mpeg (24 kHz mono, ~48 kbps)
 *
 * ⚠️ `format` AND `quality` ARE FORWARDED THOUGH THEY DO NOTHING TODAY. Probing
 * found every unrecognised field is accepted and silently ignored, so these
 * currently change neither the response nor its Content-Type. They are sent on
 * purpose: the backend is being asked to honour them, and forwarding them now
 * means that lands without a deploy here. The client reads the format off the
 * response's own Content-Type rather than assuming the request was obeyed.
 */

const ARIZIY_API_KEY = process.env.ARIZIY_API_KEY;
const ARIZIY_API_BASE = process.env.ARIZIY_API_BASE || "https://api.ariziy.com";

export async function POST(request) {
  if (!ARIZIY_API_KEY) {
    return NextResponse.json(
      { error: "Ariziy API key not configured" },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    // Caught here rather than upstream: a blank request is still a billed round
    // trip, and the answer is the same either way.
    return NextResponse.json(
      { error: "Please enter some text to convert." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${ARIZIY_API_BASE}/v1/text-to-speech`, {
      method: "POST",
      headers: {
        "X-API-Key": ARIZIY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        ...(body.voice ? { voice: body.voice } : {}),
        ...(Number.isFinite(Number(body.speed))
          ? { speed: Number(body.speed) }
          : {}),
        // Ignored upstream today — see the header. Forwarded so the composer's
        // choice is visible in the request the backend is being asked to honour.
        ...(body.format ? { format: body.format } : {}),
        ...(body.quality ? { quality: body.quality } : {}),
      }),
    });

    if (!upstream.ok) {
      // Ariziy's own `detail` where it sent one — "Unknown voice 'x'. Available:
      // …" is worth far more than "request failed". The 502 case has no JSON at
      // all (Cloudflare answers plain text), hence the try.
      const raw = await upstream.text();
      const detail = upstreamDetail(raw, upstream.status);
      console.error(`❌ [ariziy/tts] upstream ${upstream.status}:`, detail);
      return NextResponse.json(
        { error: "Speech generation failed", detail, status: upstream.status },
        { status: upstream.status },
      );
    }

    // Streamed straight through rather than buffered: it is an audio file, the
    // client wants it as a Blob, and nothing here needs to look inside it.
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("❌ [ariziy/tts] request failed:", error);
    return NextResponse.json(
      { error: "Failed to reach the speech service", detail: error.message },
      { status: 502 },
    );
  }
}
