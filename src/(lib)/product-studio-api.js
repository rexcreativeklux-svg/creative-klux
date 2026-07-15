// API client for the Product Studio "Generate" (photoreal) endpoint.
//
// Backend contract (POST /product-studio/generate) — send any of:
//   tool, image, prompt, quality, size, apply_brand_style, workspace_id,
//   model_name, pose
// `tool` is one of: product_staging | product_beautifier | flat_lay |
//   virtual_model | ghost_mannequin
//
// Auth (Bearer token) is attached by the axios interceptor. Uses the app's
// shared axios instance so baseURL + auth are consistent with the rest of the app.

import api from "@/app/api/axios";
import { toast } from "sonner";

/** UI tool ids → backend `tool` enum values. */
export const TOOL_ENUM = {
  virtual_model: "virtual_model",
  staging: "product_staging",
  beautifier: "product_beautifier",
  flatlay: "flat_lay",
  mannequin: "ghost_mannequin",
};

// Get the active brand id from local storage (if any) and include it in the request payload. This is used to apply the brand style to the generated product photo.
// export function getBrandIdFromLocalStorage() {
//   try {
//     const activeBrand = localStorage.getItem("activeBrand");
//     console.log("Retrieved activeBrand from localStorage:", activeBrand);
//   } catch (err) {
//     console.error("Failed to read activeBrandId from localStorage:", err);
//     return null;
//   }
// }

// getBrandIdFromLocalStorage();

/** UI quality tiers → backend quality strings. */
export const QUALITY_ENUM = {
  Standard: "standard",
  High: "high",
  Ultra: "ultra",
};

const BASE_URL = "https://api.creativeklux.com/api/creativeklux-userend";

// CDN base for turning an S3 object key (e.g. "creativeklux/…​.webp") into a
// hosted URL. History records carry the output as an `s3_key` and often leave
// `url` empty, so we build the URL from the key against this base (the same
// CloudFront host the app already serves brand/model assets from).
const CDN_BASE = (
  process.env.NEXT_PUBLIC_CDN_URL || "https://d3r8chxzp8ea06.cloudfront.net"
).replace(/\/+$/, "");

/**
 * Resolve a hosted URL from either a full URL or an S3 object key. Returns null
 * for empty input; passes http(s) URLs through untouched; otherwise prefixes the
 * key with {@link CDN_BASE}.
 *
 * @param {string} [urlOrKey]
 * @returns {string|null}
 */
function resolveMediaUrl(urlOrKey) {
  if (!urlOrKey || typeof urlOrKey !== "string") return null;
  if (/^https?:\/\//i.test(urlOrKey)) return urlOrKey;
  return `${CDN_BASE}/${urlOrKey.replace(/^\/+/, "")}`;
}

/**
 * Normalize one raw history record (POST /product-studio/history response shape)
 * into what the UI consumes. The generated image lives in `s3_key` (with `url`
 * frequently empty), so we resolve the output from `url` first, then `s3_key`.
 *
 * @param {object} item Raw history record from the API.
 * @returns {{
 *   id: (string|number|null), url: (string|null), sourceUrl: (string|null),
 *   status: (string|null), prompt: (string|null), tool: (string|null),
 *   createdAt: (string|null), raw: object,
 * }}
 */
function normalizeHistoryItem(item) {
  if (!item || typeof item !== "object") {
    return {
      id: null,
      url: null,
      sourceUrl: null,
      status: null,
      prompt: null,
      tool: null,
      createdAt: null,
      raw: item,
    };
  }
  const url =
    resolveMediaUrl(item.url) ||
    resolveMediaUrl(item.s3_key) ||
    resolveMediaUrl(item.image_url) ||
    resolveMediaUrl(item.video_url) ||
    null;
  return {
    id: item.id ?? item._id ?? null,
    url,
    sourceUrl: resolveMediaUrl(item.source_s3_key) || null,
    status: item.status ?? null,
    prompt: item.prompt ?? null,
    tool: item.tool ?? null,
    createdAt: item.generated_at || item.created_at || null,
    raw: item,
  };
}

/**
 * Fetch the generation history for one tool. The backend returns
 * `{ success, message, data: [...] }` sorted newest-first; we keep that order
 * and surface only records that (a) didn't fail and (b) resolve to an image —
 * pending/failed rows without an output are dropped so the grid only shows real
 * results.
 *
 * @param {string} tool Backend tool enum (e.g. "virtual_model", "ghost_mannequin").
 * @returns {Promise<Array>}
 */
export async function getProductHistory(tool) {
  console.log("📡 [product-studio/history] request → tool:", tool);
  try {
    const { data } = await api.post(`${BASE_URL}/product-studio/history`, {
      tool,
    });
    console.log("✅ [product-studio/history] response ←", data);
    const list = Array.isArray(data) ? data : data?.data || [];
    return list
      .map(normalizeHistoryItem)
      .filter((it) => it.url && it.status !== "failed");
  } catch (err) {
    const status = err?.response?.status;
    console.error("❌ [product-studio/history] failed:", {
      status,
      data: err?.response?.data,
      message: err?.message,
    });
    // Let the caller decide how to surface an empty/failed history (it shows the
    // normal empty state); rethrow so it can distinguish "no history" from "load
    // failed" if it wants to.
    throw err;
  }
}

/**
 * Delete a single history/generation item early (before the 30-day auto-cleanup).
 *
 * @param {string|number} id The item's id.
 * @returns {Promise<object>} The response data.
 */
export async function deleteProductHistoryItem(id) {
  if (id == null) throw new Error("Missing id for delete.");
  console.log("📡 [product-studio/delete] request → id:", id);
  try {
    const { data } = await api.delete(`${BASE_URL}/product-studio/${id}`);
    console.log("🗑️ [product-studio/delete] response ←", data);
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const serverMsg =
      err?.response?.data?.message || err?.response?.data?.error || err?.message;
    console.error("❌ [product-studio/delete] failed:", {
      status,
      data: err?.response?.data,
      message: err?.message,
    });
    toast.error(serverMsg || "Couldn't delete that item. Please try again.");
    throw err;
  }
}

/**
 * Call the Product Studio generate endpoint.
 *
 * @param {object} payload The request body (already shaped for the backend).
 * @returns {Promise<object>} The response data (e.g. { url, id, credits_used }).
 */
export async function generateProductPhoto(payload) {
  console.log("📡 [product-studio/generate] request →", payload);
  try {
    const { data } = await api.post(
      `${BASE_URL}/product-studio/generate`,
      payload,
    );
    console.log("✅ [product-studio/generate] response ←", data);
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("❌ [product-studio/generate] failed:", {
      status,
      data,
      message: err?.message,
    });

    const serverMsg = data?.message || data?.error || err?.message || "";
    if (status === 402 || /limit|credits?/i.test(serverMsg)) {
      toast.error(
        "Monthly AI credits limit reached. Please upgrade your plan to continue.",
        { duration: 6000 },
      );
    } else {
      toast.error(serverMsg || "AI generation failed. Please try again.");
    }
    throw err;
  }
}
