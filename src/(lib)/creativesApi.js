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

/** Social platforms the publishing API covers (app-side ids). Ads have their own endpoints, below. */
export const SERVER_PUBLISH_PLATFORMS = [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "youtube",
  "pinterest",
  "tiktok",
];

/**
 * Platforms whose posts get a delete button. Instagram and TikTok are asked
 * too, even though their APIs don't allow it: the backend answers with its own
 * reason (Instagram, 2026-10-28: 422 "Instagram does not allow deleting posts
 * through its API — it has to be done in the Instagram app."), and that
 * answer is shown to the user as it comes.
 */
export const SERVER_DELETE_PLATFORMS = [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "youtube",
  "pinterest",
  "tiktok",
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

// ─────────────────────────────────────────────────────────────────────────────
// Ads. A separate set of endpoints from social publishing:
//
//   POST   creatives/ads               campaign + ad set + creative + ad, in one call
//   GET    creatives/campaigns         campaigns on one ad platform
//   GET    creatives/campaign-metrics  spend / impressions / clicks for one campaign
//   PATCH  creatives/campaign-status   pause or resume a campaign
//   DELETE creatives/campaign          delete a campaign
//
// The brand is read server-side from the signed-in user's `active_brand_id` —
// these calls take no `brand_id`.
// ─────────────────────────────────────────────────────────────────────────────

/** Ad platforms the API knows (app-side ids match the API's). */
export const SERVER_AD_PLATFORMS = [
  "meta_ads",
  "google_ads",
  "tiktok_ads",
  "snapchat_ads",
  "pinterest_ads",
];

/**
 * Create a complete ad. Created PAUSED unless `status: "ACTIVE"` is sent.
 * Budgets are whole units of the ad account's own currency.
 *
 * @param {Object} ad { platform, name, daily_budget, countries: string[],
 *   image_url | video_url, link, objective?, lifetime_budget?, status?,
 *   start_date?, end_date?, age_min?, age_max?, text?, headline?,
 *   description?, call_to_action? }
 * @returns {Promise<{campaign_id, adset_id, creative_id, ad_id, name, status, currency}>}
 */
export async function createAd(ad) {
  // Drop empty optionals — the API validates a present-but-blank field.
  const body = Object.fromEntries(
    Object.entries(ad).filter(([, v]) => v != null && v !== ""),
  );
  console.log("📡 [creatives/ads] →", body);
  try {
    const res = await api.post(`${BASE}/creatives/ads`, body);
    console.log("📡 [creatives/ads] ←", res.data);
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error(
      "❌ [creatives/ads]",
      error?.response?.status,
      error?.response?.data || error?.message,
    );
    throw new Error(serverMessage(error, "Couldn't create the ad"));
  }
}

/** Campaigns on one ad platform, normalised by the API: { id, name, status, objective, daily_budget, created_time }. */
export async function fetchCampaigns({ platform, limit = 25 }) {
  try {
    const res = await api.get(`${BASE}/creatives/campaigns`, {
      params: { platform, limit },
    });
    console.log(`📡 [creatives/campaigns ${platform}] ←`, res.data);
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : data?.campaigns || [];
  } catch (error) {
    throw new Error(serverMessage(error, `Couldn't load ${platform} campaigns`));
  }
}

/** Spend, impressions, clicks and conversions for one campaign over the last `days` (1–90). */
export async function fetchCampaignMetrics({ platform, campaign_id, days = 7 }) {
  try {
    const res = await api.get(`${BASE}/creatives/campaign-metrics`, {
      params: { platform, campaign_id, days },
    });
    console.log(`📡 [creatives/campaign-metrics ${platform}] ←`, res.data);
    return res.data?.data ?? res.data;
  } catch (error) {
    throw new Error(serverMessage(error, `Couldn't load ${platform} metrics`));
  }
}

/** Pause or resume a campaign. `status` is "ACTIVE" or "PAUSED" — resuming spends money. */
export async function setCampaignStatus({ platform, campaign_id, status }) {
  try {
    const res = await api.patch(`${BASE}/creatives/campaign-status`, {
      platform,
      campaign_id,
      status,
    });
    console.log(`📡 [creatives/campaign-status ${platform}] ←`, res.data);
    return res.data?.data ?? res.data;
  } catch (error) {
    throw new Error(serverMessage(error, "Couldn't update the campaign"));
  }
}

/**
 * Delete a campaign (and with it, on the network, its ad sets and ads).
 * Irreversible — confirm with the user first.
 *
 * ⚠️ THE BODY IS PROVISIONAL. The route exists, but on 2026-10-28 it answered
 * 500 "CreativePublishController::campaignDestroy does not exist" — the
 * controller method was never written, so no request has been validated yet.
 * `{ platform, campaign_id }` mirrors campaign-status, its closest sibling.
 */
export async function deleteCampaign({ platform, campaign_id }) {
  try {
    const res = await api.delete(`${BASE}/creatives/campaign`, {
      data: { platform, campaign_id },
    });
    console.log(`📡 [creatives/campaign DELETE ${platform}] ←`, res.data);
    return res.data?.data ?? res.data;
  } catch (error) {
    throw new Error(serverMessage(error, "Couldn't delete the campaign"));
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
