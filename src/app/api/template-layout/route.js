// app/api/template-layout/route.js
// ─────────────────────────────────────────────────────────────────────────────
// Server-side read of ONE public Klux template's layout, by slug.
//
// WHY THIS EXISTS — the browser cannot fetch the CDN object itself.
// A shared `?template=<slug>` link resolves to a ~2 KB JSON object on
// CloudFront (see templateLayoutUrl in studio/templatesApi.js). S3 only emits
// `Access-Control-Allow-Origin` when the request carries an `Origin` header,
// and CloudFront caches whichever variant it saw first — so an edge that has
// already cached a header-less copy (from any non-browser request) serves that
// same copy to browsers, which then fail CORS with a "200 OK" that the fetch
// still rejects. It is cache-state dependent: it can work on one machine and
// fail on another, and flip when a cache entry expires.
//
// Reading it here removes the variable entirely — server-side fetch has no CORS
// to satisfy — and the browser talks to its own origin instead. Mirrors the
// existing app/api/proxy-image and app/api/proxy-media handlers.
//
// UNLIKE those two, this route takes a SLUG, not a URL. It builds the CDN
// address itself from a validated slug, so it can't be pointed at an arbitrary
// host and used as an open proxy into the private network.

import { NextResponse } from "next/server";
import { templateLayoutUrl } from "@/app/(components)/studio/templatesApi";

/**
 * Slugs look like `bkbhdjtsgwanackfsvam-1784731449-apq6`. Anything outside this
 * alphabet is rejected before it can reach a URL — no slashes, no dots, no
 * encoded traversal, so the key can only ever address one object under the
 * templates prefix.
 */
const SLUG_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

/** Published templates rarely change; a short cache spares repeat visits. */
const CACHE_CONTROL = "public, max-age=600, stale-while-revalidate=3600";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") || "").trim();

  if (!slug) {
    return NextResponse.json({ message: "Missing slug" }, { status: 400 });
  }
  if (!SLUG_PATTERN.test(slug)) {
    console.warn("⚠️ [template-layout] rejected malformed slug:", slug.slice(0, 80));
    return NextResponse.json({ message: "Invalid slug" }, { status: 400 });
  }

  const url = templateLayoutUrl(slug);

  try {
    const upstream = await fetch(url, { headers: { Accept: "application/json" } });

    // The bucket doesn't allow listing, so a key that isn't there answers 403
    // rather than 404 — both mean "no such template" to the caller.
    if (upstream.status === 403 || upstream.status === 404) {
      console.warn(`⚠️ [template-layout] no object for "${slug}" (HTTP ${upstream.status})`);
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    if (!upstream.ok) {
      console.error(`❌ [template-layout] upstream ${upstream.status} for "${slug}"`);
      return NextResponse.json({ message: "Upstream error" }, { status: 502 });
    }

    // Passed through as text: the client parses and validates the layout, and
    // re-serialising here would only risk changing it.
    const body = await upstream.text();
    console.log(`✅ [template-layout] served "${slug}" (${body.length} bytes)`);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error(`❌ [template-layout] fetch threw for "${slug}":`, error);
    return NextResponse.json({ message: "Upstream unreachable" }, { status: 502 });
  }
}
