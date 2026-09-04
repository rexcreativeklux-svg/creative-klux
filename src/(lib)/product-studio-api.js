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
  // The three prompt-driven tools all run the SAME backend engine (`edit`), so
  // they can't be told apart by `tool` alone — see TOOL_SAVE_ENUM below.
  reshaping: "edit",
  poster: "edit",
  pod: "edit",

  // Product Video generates motion rather than a still, but it posts to the same
  // /product-studio/generate endpoint as everything else — only its payload
  // differs (`image_urls` for 1-4 frames, and the reduced VIDEO_SIZES set).
  product_video: "product_video",
};

/**
 * UI tool ids → the `tool_save` value sent alongside `tool` on generate.
 *
 * Reshaping, Product Poster and AI POD all generate through the shared `edit`
 * tool, so `tool` no longer identifies which one produced a result. `tool_save`
 * is the value the generation is RECORDED under, which keeps each tool's
 * history its own: without it all three would read back one merged list.
 *
 * These are therefore also the values to pass to {@link getProductHistory} —
 * the record is stored under `tool_save`, not under `edit`.
 */
export const TOOL_SAVE_ENUM = {
  reshaping: "product_reshaping",
  poster: "product_poster",
  pod: "product_pod",
};

/**
 * Payload key for the optional SECOND image that Reshaping (Scene Reference)
 * and AI POD (Reference Pattern) send. Only present when the user actually
 * attaches one; promptToolConfigs references it via `reference.payloadKey`.
 */
export const REFERENCE_IMAGE_KEY = "reference_image_url";

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

// File extensions we treat as video when inferring a history item's media type
// — the backend doesn't tag it. Mirrors magic-studio-api's VIDEO_EXT.
const VIDEO_EXT = /\.(mp4|webm|mov|mkv|m4v)(\?|#|$)/i;

/**
 * Statuses that mean the backend is still working on this record.
 *
 * ⚠️ A RECORD EXISTS BEFORE ITS RESULT DOES. The row is written when the request
 * arrives and only filled in when the provider answers, so history genuinely
 * contains runs that have not finished. That matters for Product Video, whose
 * renders take long enough that a user routinely closes the modal mid-run:
 * recognising these is what lets the tool show a wait it did not start.
 */
const PENDING_STATUSES = ["processing", "pending", "queued", "in_progress"];

/**
 * Infer a history item's render type ("image" | "video"). Trusts an explicit
 * `type` when it's one we render, then the field the URL came from, then the
 * tool that produced it (an S3 key can arrive with no extension at all), then
 * the extension. Every other Product Studio tool outputs stills, so "image" is
 * the right default.
 *
 * @param {object} item Raw history record.
 * @param {string|null} url Resolved media URL.
 * @returns {"image"|"video"}
 */
function inferHistoryType(item, url) {
  const explicit = String(item.type || item.content_type || "").toLowerCase();
  if (explicit === "image" || explicit === "video") return explicit;
  if (item.video_url) return "video";
  if (item.tool === TOOL_ENUM.product_video) return "video";
  if (VIDEO_EXT.test(url || "")) return "video";
  return "image";
}

/**
 * Normalize one raw history record (POST /product-studio/history response shape)
 * into what the UI consumes. The generated image lives in `s3_key` (with `url`
 * frequently empty), so we resolve the output from `url` first, then `s3_key`.
 *
 * `type` / `videoSrc` / `thumbnail` are what let a result render as the medium
 * it actually is: ProductHistoryGrid draws a `<video>` for a video item and the
 * shared Lightbox plays it, where both fall back to an `<img>` without them.
 *
 * @param {object} item Raw history record from the API.
 * @returns {{
 *   id: (string|number|null), url: (string|null), sourceUrl: (string|null),
 *   type: ("image"|"video"), videoSrc: (string|null), thumbnail: (string|null),
 *   status: (string|null), pending: boolean, prompt: (string|null),
 *   tool: (string|null), createdAt: (string|null), startedAt: (string|null),
 *   raw: object,
 * }}
 */
function normalizeHistoryItem(item) {
  if (!item || typeof item !== "object") {
    return {
      id: null,
      url: null,
      sourceUrl: null,
      type: "image",
      videoSrc: null,
      thumbnail: null,
      status: null,
      pending: false,
      prompt: null,
      tool: null,
      createdAt: null,
      startedAt: null,
      raw: item,
    };
  }
  const url =
    resolveMediaUrl(item.url) ||
    resolveMediaUrl(item.s3_key) ||
    resolveMediaUrl(item.image_url) ||
    resolveMediaUrl(item.video_url) ||
    null;
  const status = item.status ?? null;
  const type = inferHistoryType(item, url);
  return {
    id: item.id ?? item._id ?? null,
    url,
    sourceUrl: resolveMediaUrl(item.source_s3_key) || null,
    type,
    videoSrc: type === "video" ? url : null,
    thumbnail:
      resolveMediaUrl(item.thumbnail) ||
      resolveMediaUrl(item.poster) ||
      resolveMediaUrl(item.thumbnail_s3_key) ||
      null,
    status,
    pending: PENDING_STATUSES.includes(String(status || "").toLowerCase()),
    prompt: item.prompt ?? null,
    tool: item.tool ?? null,
    createdAt: item.generated_at || item.created_at || null,
    // When the run STARTED, whatever it has done since — the age a staleness
    // check has to be made against. `createdAt` above prefers `generated_at`
    // for display ordering, which is the moment it FINISHED.
    startedAt: item.created_at || null,
    raw: item,
  };
}

/**
 * Fetch the generation history for one tool. The backend returns
 * `{ success, message, data: [...] }` sorted newest-first; we keep that order
 * and drop records that failed or resolved to nothing.
 *
 * ⚠️ RUNS STILL IN FLIGHT COME BACK TOO, marked `pending`. They have no URL and
 * must never reach a grid as if they were results — {@link useProductHistory}
 * splits them into their own list, which is what every consumer should read.
 * This function stays honest about what the server said; deciding how old is too
 * old to keep waiting is the hook's job, not the transport's.
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
      .filter(
        (it) =>
          String(it.status || "").toLowerCase() !== "failed" &&
          (it.url || it.pending),
      );
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
 * Did this request fail because it never actually landed (or because our own
 * server faulted), rather than because the backend deliberately said no?
 *
 * This is the ONLY gate for the on-device fallback in the backend-first tools
 * (see OnDeviceToolModal): a transport fault or a 5xx means "we couldn't ask",
 * so processing locally is a legitimate rescue. Anything the server answered on
 * purpose — 401 unauthenticated, 402 out of credits, 422 validation, 429 quota,
 * 403/404 — is a HARD error by product decision: the user is told why, and we
 * do NOT hand out a free on-device render instead.
 *
 * Handles both error shapes this app produces:
 *   • axios errors — `err.response.status`, or `err.request` with no response
 *   • classifyResult-shaped errors (e.g. AuthContext's uploadMedia) —
 *     `err.status` plus `err.source === "network"`
 *
 * @param {unknown} err The caught error.
 * @returns {boolean} True when the caller may fall back to on-device.
 */
export function isTransientApiError(err) {
  // An explicit HTTP status always decides: only server faults are transient.
  const status = err?.response?.status ?? err?.status;
  if (typeof status === "number") return status >= 500;
  // No status at all — the request never got a reply (offline, DNS, timeout,
  // CORS). Our own thrown Errors have neither marker and are NOT transient.
  return !!(err?.request || err?.source === "network");
}

/**
 * Call the Product Studio generate endpoint.
 *
 * @param {object} payload The request body (already shaped for the backend).
 * @param {object} [options]
 * @param {boolean} [options.suppressTransientToast=false] Skip the error toast
 *   when {@link isTransientApiError} says the call never landed. Backend-first
 *   callers set this because they recover from those themselves (on-device
 *   fallback) and a "generation failed" toast on top of a successful fallback is
 *   pure noise. The error is still logged and still thrown either way.
 * @returns {Promise<object>} The response data (e.g. { url, id, credits_used }).
 */
export async function generateProductPhoto(payload, options = {}) {
  const { suppressTransientToast = false } = options;
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

    // Both halves, not the first one that exists: this API puts a generic
    // headline in `message` ("Generation failed") and the reason that actually
    // helps in `error` ("The selected tool is invalid"). Preferring `message`
    // showed the user — and us — only the headline.
    const serverMsg =
      [data?.message, data?.error]
        .filter(Boolean)
        .filter((part, i, all) => all.indexOf(part) === i)
        .join(" — ") ||
      err?.message ||
      "";

    // The caller is about to rescue this itself — stay quiet and let it explain
    // what it did instead (see `suppressTransientToast`).
    if (suppressTransientToast && isTransientApiError(err)) throw err;

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
