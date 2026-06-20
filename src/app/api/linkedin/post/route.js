// app/api/linkedin/post/route.js
//
// Server-side publish to LinkedIn (a member's own feed). Server-side because the
// LinkedIn API has no browser CORS — same as X. Uses the modern REST Posts API.
//
// ⚠️ This only works once the LinkedIn app has the "Share on LinkedIn" product
// (w_member_social) approved AND the user reconnected to grant it. Until then the post
// call returns a permission error. The whole feature is gated by LINKEDIN_POSTING_ENABLED
// in src/(lib)/linkedinConfig.js (the Publish modal won't even route here until it's on).
//
// Image flow is 3 steps: initializeUpload → upload the bytes → create the post.

import { LINKEDIN_API_VERSION } from "@/(lib)/linkedinConfig";

const REST_BASE = "https://api.linkedin.com/rest";

function liHeaders(access_token) {
  return {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": LINKEDIN_API_VERSION,
  };
}

// Format a LinkedIn API error into a useful message. A 401/403 here almost always means
// the token is missing `w_member_social` — i.e. "Share on LinkedIn" wasn't approved when
// the user connected, so they need to approve it and RECONNECT (the old token can't gain it).
function liError(status, data, fallback) {
  const base = data?.message || fallback || `LinkedIn request failed (${status}).`;
  if (status === 401 || status === 403) {
    return `${base} — your LinkedIn token is missing the posting permission (w_member_social). Approve "Share on LinkedIn" in your LinkedIn app, then DISCONNECT and RECONNECT LinkedIn here so a fresh token is issued. [HTTP ${status}${data?.serviceErrorCode ? `/${data.serviceErrorCode}` : ""}]`;
  }
  return `${base} [HTTP ${status}${data?.serviceErrorCode ? `/${data.serviceErrorCode}` : ""}]`;
}

// Registers an image, uploads the bytes, and returns the image URN to attach to a post.
async function uploadImage(image_url, author, access_token) {
  // 1. Initialize the upload → LinkedIn gives back an uploadUrl + the image URN.
  const initRes = await fetch(`${REST_BASE}/images?action=initializeUpload`, {
    method: "POST",
    headers: liHeaders(access_token),
    body: JSON.stringify({ initializeUploadRequest: { owner: author } }),
  });
  const initData = await initRes.json().catch(() => ({}));
  if (!initRes.ok) {
    console.error("LinkedIn image init error:", initRes.status, initData);
    throw new Error(liError(initRes.status, initData, "LinkedIn image init failed."));
  }
  const uploadUrl = initData.value?.uploadUrl;
  const imageUrn = initData.value?.image;
  if (!uploadUrl || !imageUrn) {
    throw new Error("LinkedIn did not return an image upload URL.");
  }

  // 2. Download our image, then PUT/POST the raw bytes to LinkedIn's upload URL.
  const imgRes = await fetch(image_url);
  if (!imgRes.ok) throw new Error("Couldn't download the image to attach.");
  const contentType = imgRes.headers.get("content-type") || "image/png";
  const bytes = Buffer.from(await imgRes.arrayBuffer());

  const upRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": contentType,
    },
    body: bytes,
  });
  if (!upRes.ok) {
    const t = await upRes.text().catch(() => "");
    throw new Error(`LinkedIn image upload failed (${upRes.status}). ${t.slice(0, 200)}`);
  }

  return imageUrn;
}

export async function POST(req) {
  try {
    const { access_token, author_id, text, image_url } = await req.json();

    if (!access_token) {
      return Response.json(
        { error: "Missing access token — reconnect LinkedIn." },
        { status: 400 }
      );
    }
    if (!author_id) {
      return Response.json(
        { error: "Missing LinkedIn member id — reconnect LinkedIn." },
        { status: 400 }
      );
    }

    // Token probe: hit the sign-in endpoint first so we can tell a *bad token* apart from a
    // *missing posting scope*. If this fails, the token itself is invalid/expired — no point
    // blaming w_member_social. If it passes, any 401/403 from posting IS the posting scope.
    const probe = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const probeData = await probe.json().catch(() => ({}));
    console.log(
      "LinkedIn token probe:",
      probe.status,
      "tokenLength:", access_token?.length,
      "tokenTail:", access_token?.slice(-6),
      probeData?.sub ? "(sub present)" : probeData
    );
    if (!probe.ok) {
      return Response.json(
        {
          error: `Your LinkedIn token itself is invalid or expired (sign-in check failed: HTTP ${probe.status}). This is NOT a permissions issue — the token is bad. Disconnect and reconnect LinkedIn to mint a new one.`,
          details: probeData,
        },
        { status: 400 }
      );
    }
    // Token is valid for sign-in. Prefer the member id the token itself reports (probeData.sub)
    // over whatever was stored — a mismatch here would also cause posting failures.
    const memberId = probeData?.sub || author_id;

    // Posting on a member's own behalf: author URN = the connected member's id (profile.sub).
    const author = `urn:li:person:${memberId}`;

    // Optional image (3-step upload above).
    let imageUrn;
    if (image_url) {
      imageUrn = await uploadImage(image_url, author, access_token);
    }

    // Create the post (REST Posts API).
    const body = {
      author,
      commentary: text || "",
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };
    if (imageUrn) {
      body.content = {
        media: { altText: (text || "").slice(0, 300), id: imageUrn },
      };
    }

    const postRes = await fetch(`${REST_BASE}/posts`, {
      method: "POST",
      headers: liHeaders(access_token),
      body: JSON.stringify(body),
    });

    if (!postRes.ok) {
      const err = await postRes.json().catch(() => ({}));
      console.error("LinkedIn post error:", postRes.status, err);
      return Response.json(
        { error: liError(postRes.status, err, "LinkedIn post failed."), details: err },
        { status: 400 }
      );
    }

    // A successful create returns 201 with the post URN in a header (body is usually empty).
    const post_id =
      postRes.headers.get("x-restli-id") ||
      postRes.headers.get("x-linkedin-id") ||
      null;

    return Response.json({ post_id });
  } catch (err) {
    return Response.json(
      { error: err.message || "LinkedIn publish failed" },
      { status: 500 }
    );
  }
}
