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
    throw new Error(initData.message || `LinkedIn image init failed (${initRes.status}).`);
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

    // Posting on a member's own behalf: author URN = the connected member's id (profile.sub).
    const author = `urn:li:person:${author_id}`;

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
      console.error("LinkedIn post error:", err);
      return Response.json(
        {
          error:
            err.message ||
            `LinkedIn post failed (${postRes.status}). If this is a permission error, the "Share on LinkedIn" product may not be approved yet.`,
          details: err,
        },
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
