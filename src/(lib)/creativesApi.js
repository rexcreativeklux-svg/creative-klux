// creativesApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Server-side social publishing. The API posts to the platforms itself, with
// tokens it holds — the browser sends the creative and where it should go, and
// never touches a platform API or an access token.
//
//   POST   creatives/publish        one creative → one or many platforms
//   GET    creatives/posts          recent posts on one platform
//   GET    creatives/post-metrics   engagement for one post
//   DELETE creatives/post           remove a published post
//
// Auth rides the shared axios instance's interceptor (Bearer from localStorage).
// Every failure is thrown as an Error carrying the SERVER'S OWN WORDS — while
// the contract settles, that text is the only thing worth showing or reporting.

import api from "@/app/api/axios";

const BASE = "https://api.creativeklux.com/api/creativeklux-userend";

// The API's platform keys, where they differ from the app's.
const TO_API_PLATFORM = { twitter: "x" };
export const toApiPlatform = (platform) =>
  TO_API_PLATFORM[platform] || platform;

/** Platforms the publishing API covers (app-side ids). Ads are not among them. */
export const SERVER_PUBLISH_PLATFORMS = [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "youtube",
  "pinterest",
  "tiktok",
];

/** Instagram and TikTok have no delete endpoint — the post is removed in the app. */
export const SERVER_DELETE_PLATFORMS = [
  "facebook",
  "twitter",
  "linkedin",
  "youtube",
  "pinterest",
];

/**
 * The brand a call acts on: the one passed in, else the signed-in user's saved
 * active brand (AuthContext caches the profile under `user`).
 */
function resolveBrandId(brandId) {
  if (brandId) return brandId;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.active_brand_id ?? null;
  } catch {
    return null;
  }
}

function requireBrandId(brandId) {
  const id = resolveBrandId(brandId);
  if (!id) throw new Error("Select a brand first.");
  return id;
}

/** The most specific thing the server said about a failed request. */
function serverMessage(error, fallback) {
  const data = error?.response?.data;
  const fieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
  const status = error?.response?.status;
  return (
    fieldError ||
    data?.message ||
    data?.error ||
    (status ? `${fallback} (HTTP ${status})` : error?.message || fallback)
  );
}

/**
 * Publish one creative to one or many platforms.
 *
 * Partial success is the normal case, so the answer is per platform and is
 * parsed the same for 200 (≥1 published) and 422 (none did):
 *   { published, attempted, results: { [apiPlatform]: { ok, id?, media_id?,
 *     draft_only?, error? } } }
 * Throws only when nothing was attempted (validation, auth, brand, network).
 *
 * @param {Object} payload { platforms: string[], text?, image_url?, video_url?,
 *   title?, link?, board_id?, privacy_level?, brand_id? } — app-side platform ids.
 */
export async function publishCreative({ brand_id, platforms = [], ...fields }) {
  const body = {
    brand_id: requireBrandId(brand_id),
    platforms: platforms.map(toApiPlatform),
    ...fields,
  };
  console.log("📡 [creatives/publish] →", body);

  let data;
  let status;
  try {
    const res = await api.post(`${BASE}/creatives/publish`, body);
    data = res.data;
    status = res.status;
  } catch (error) {
    data = error?.response?.data;
    status = error?.response?.status;
    // 422 with `results` is "every platform failed" — a normal, parseable answer.
    if (!(data && typeof data.results === "object" && data.results)) {
      console.error("❌ [creatives/publish]", status, data || error?.message);
      throw new Error(serverMessage(error, "Publish failed"));
    }
  }
  console.log("📡 [creatives/publish] ←", status, data);

  return {
    published: Number(data?.published) || 0,
    attempted: Number(data?.attempted) || 0,
    results: data?.results || {},
  };
}

/**
 * Publish to ONE platform and return its result, throwing the platform's own
 * error when it didn't go out. The shape the per-platform publishTo* helpers want.
 * @returns {Promise<{post_id, media_id, draft_only, raw}>}
 */
export async function publishToPlatform(platform, fields) {
  const { results } = await publishCreative({ ...fields, platforms: [platform] });
  const result = results[toApiPlatform(platform)];
  if (!result?.ok) {
    throw new Error(result?.error || `Publishing to ${platform} failed.`);
  }
  return {
    post_id: result.id ?? null,
    media_id: result.media_id ?? null,
    draft_only: !!result.draft_only,
    raw: result,
  };
}

/** Recent posts on one platform — `data` is whatever that platform returns. */
export async function fetchPlatformPosts({ brand_id, platform, limit = 20 }) {
  try {
    const res = await api.get(`${BASE}/creatives/posts`, {
      params: {
        brand_id: requireBrandId(brand_id),
        platform: toApiPlatform(platform),
        limit,
      },
    });
    console.log(`📡 [creatives/posts ${platform}] ←`, res.data);
    return res.data?.data ?? res.data;
  } catch (error) {
    throw new Error(serverMessage(error, `Couldn't load ${platform} posts`));
  }
}

/** Engagement for one post — shape differs per network, read defensively. */
export async function fetchPostMetrics({ brand_id, platform, post_id }) {
  try {
    const res = await api.get(`${BASE}/creatives/post-metrics`, {
      params: {
        brand_id: requireBrandId(brand_id),
        platform: toApiPlatform(platform),
        post_id,
      },
    });
    console.log(`📡 [creatives/post-metrics ${platform}] ←`, res.data);
    return res.data?.data ?? res.data;
  } catch (error) {
    throw new Error(serverMessage(error, `Couldn't load ${platform} metrics`));
  }
}

/** Remove a published post. Irreversible — confirm with the user first. */
export async function deletePlatformPost({ brand_id, platform, post_id }) {
  try {
    const res = await api.delete(`${BASE}/creatives/post`, {
      data: {
        brand_id: requireBrandId(brand_id),
        platform: toApiPlatform(platform),
        post_id,
      },
    });
    console.log(`📡 [creatives/post DELETE ${platform}] ←`, res.data);
    return res.data;
  } catch (error) {
    throw new Error(serverMessage(error, `Couldn't delete the ${platform} post`));
  }
}

/**
 * Host a file through the gallery upload and return its public URL. Used to
 * give the publishing API the `video_url` TikTok and YouTube require — our
 * creatives are images, so the clip is built in the browser first.
 */
export async function uploadForPublish(file) {
  const form = new FormData();
  form.append("file", file);

  let data;
  try {
    ({ data } = await api.post(`${BASE}/gallery`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }));
  } catch (error) {
    throw new Error(serverMessage(error, "Couldn't upload the video"));
  }
  console.log("📡 [gallery upload] ←", data);

  const pick = (o) =>
    o?.video ||
    o?.video_url ||
    o?.image ||
    o?.image_url ||
    o?.url ||
    o?.path ||
    o?.src ||
    null;
  const inner = data?.data ?? data;
  const url =
    pick(data) || pick(inner) || (Array.isArray(inner) ? pick(inner[0]) : null);
  if (!url) throw new Error("The upload returned no file URL.");
  return url;
}
