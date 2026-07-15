// API client for the Magic Studio "Generate" endpoint.
//
// Backend contract (POST /magic-studio/generate) — a single endpoint with a
// `type` discriminator. Each Magic Studio tool sends its own payload shape (see
// buildMagicPayload in magicStudioConfigs.jsx for how the UI values are mapped):
//
//   text_to_image       → { type, style, ratio, prompt }
//   text_to_video       → { type, style, ratio, duration, prompt }
//   image_variation     → { type, style, source_image }
//   script_to_voiceover → { type, style, narration_tone, speaking_pace, ratio, export_format, prompt }
//   audio_to_text       → { type, audio_file, language, transcript_format, transcript_quality }
//   text_to_audio       → { type, style, speaking_tone, speaking_speed, export_format, audio_quality, prompt }
//   persona_generator   → { type, name, age, occupation, communication_tone, content_type, ratio }
//
// Auth (Bearer token) is attached by the axios interceptor. Uses the app's
// shared axios instance so baseURL + auth are consistent with the rest of the app.
// Mirrors src/(lib)/product-studio-api.js.

import api from "@/app/api/axios";
import { toast } from "sonner";

const BASE_URL = "https://api.creativeklux.com/api/creativeklux-userend";

// CDN base for turning an S3 object key (e.g. "creativeklux/…​.webp") into a
// hosted URL. History records may carry the output as an `s3_key` with `url`
// empty, so we build the URL from the key against this base (the same
// CloudFront host the app serves its other media from). Mirrors
// src/(lib)/product-studio-api.js.
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
export function resolveMediaUrl(urlOrKey) {
  if (!urlOrKey || typeof urlOrKey !== "string") return null;
  if (/^https?:\/\//i.test(urlOrKey)) return urlOrKey;
  return `${CDN_BASE}/${urlOrKey.replace(/^\/+/, "")}`;
}

// File extensions we treat as video / audio when inferring a history item's
// type from its URL (the backend doesn't always tag the media type).
const VIDEO_EXT = /\.(mp4|webm|mov|mkv|m4v)(\?|#|$)/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac)(\?|#|$)/i;

/**
 * Infer a history item's render type ("image" | "video" | "audio" | "text").
 * Trusts an explicit `type` when it's one we render; otherwise infers from the
 * field the URL came from and the file extension, falling back to "text" for a
 * record that only carries copy (e.g. a persona "Text" result).
 *
 * @param {object} item Raw history record.
 * @param {string|null} url Resolved media URL (may be null for text results).
 * @returns {"image"|"video"|"audio"|"text"}
 */
function inferHistoryType(item, url) {
  const explicit = String(item.type || item.content_type || "").toLowerCase();
  if (["image", "video", "audio", "text"].includes(explicit)) return explicit;
  if (item.video_url || VIDEO_EXT.test(url || "")) return "video";
  if (item.audio_url || AUDIO_EXT.test(url || "")) return "audio";
  if (url) return "image";
  return "text";
}

/**
 * Normalize one raw Magic Studio history record into the shape the modal's
 * history grid consumes. Magic Studio tools produce different media types, so
 * each item carries its own inferred `type`; the generated output usually lives
 * in `s3_key`/`url` (or `video_url`), and text-only results (persona copy) carry
 * `content`.
 *
 * @param {object} item Raw history record from POST /magic-studio/history.
 * @returns {{
 *   id: (string|number|null), type: string, url: (string|null),
 *   videoSrc: (string|null), thumbnail: (string|null), content: (string|null),
 *   prompt: (string|null), tool: (string|null), status: (string|null),
 *   createdAt: (string|null), raw: object,
 * }}
 */
function normalizeMagicHistoryItem(item) {
  if (!item || typeof item !== "object") {
    return {
      id: null,
      type: "image",
      url: null,
      videoSrc: null,
      thumbnail: null,
      content: null,
      prompt: null,
      tool: null,
      status: null,
      createdAt: null,
      raw: item,
    };
  }
  const url =
    resolveMediaUrl(item.url) ||
    resolveMediaUrl(item.s3_key) ||
    resolveMediaUrl(item.image_url) ||
    resolveMediaUrl(item.video_url) ||
    resolveMediaUrl(item.audio_url) ||
    null;
  const type = inferHistoryType(item, url);
  return {
    id: item.id ?? item._id ?? null,
    type,
    url,
    videoSrc: type === "video" ? url : null,
    thumbnail:
      resolveMediaUrl(item.thumbnail) ||
      resolveMediaUrl(item.poster) ||
      resolveMediaUrl(item.thumbnail_s3_key) ||
      null,
    content: item.content ?? item.text ?? null,
    prompt: item.prompt ?? null,
    tool: item.tool ?? null,
    status: item.status ?? null,
    createdAt: item.generated_at || item.created_at || null,
    raw: item,
  };
}

/**
 * Fetch the generation history for one Magic Studio tool. The backend returns
 * `{ success, message, data: [...] }` newest-first (mirroring product-studio);
 * we keep that order and drop records that failed or resolved to nothing (no
 * media URL and no text content) so the grid only shows real results.
 *
 * Only backend tools have server-side history — the on-device tools
 * (audio_to_text, text_to_audio) never persist anything and don't call this.
 *
 * @param {string} tool Backend tool enum (e.g. "text_to_image", "text_to_video").
 * @returns {Promise<Array>}
 */
export async function getMagicHistory(tool) {
  console.log("📡 [magic-studio/history] request → tool:", tool);
  try {
    const { data } = await api.post(`${BASE_URL}/magic-studio/history`, {
      tool,
    });
    console.log("✅ [magic-studio/history] response ←", data);
    const list = Array.isArray(data) ? data : data?.data || [];
    return list
      .map(normalizeMagicHistoryItem)
      .filter((it) => (it.url || it.content) && it.status !== "failed");
  } catch (err) {
    const status = err?.response?.status;
    console.error("❌ [magic-studio/history] failed:", {
      status,
      data: err?.response?.data,
      message: err?.message,
    });
    // Let the caller show its empty state; rethrow so it can distinguish "no
    // history" from "load failed" if it wants to.
    throw err;
  }
}

/**
 * Delete a single history/generation item early (before any auto-cleanup).
 *
 * @param {string|number} id The item's id.
 * @returns {Promise<object>} The response data.
 */
export async function deleteMagicHistoryItem(id) {
  if (id == null) throw new Error("Missing id for delete.");
  console.log("📡 [magic-studio/delete] request → id:", id);
  try {
    const { data } = await api.delete(`${BASE_URL}/magic-studio/${id}`);
    console.log("🗑️ [magic-studio/delete] response ←", data);
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const serverMsg =
      err?.response?.data?.message || err?.response?.data?.error || err?.message;
    console.error("❌ [magic-studio/delete] failed:", {
      status,
      data: err?.response?.data,
      message: err?.message,
    });
    toast.error(serverMsg || "Couldn't delete that item. Please try again.");
    throw err;
  }
}

/**
 * Call the Magic Studio generate endpoint.
 *
 * @param {object|FormData} payload Request body already shaped for the backend.
 *   Pass a FormData for tools that upload a file (audio_to_text).
 * @returns {Promise<object>} The response data from the backend.
 */
export async function generateMagicStudio(payload) {
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
  console.log(
    "📡 [magic-studio/generate] request →",
    isForm ? "[FormData]" : payload,
  );
  try {
    const { data } = await api.post(
      `${BASE_URL}/magic-studio/generate`,
      payload,
      {
        // Let the browser set the multipart boundary for FormData uploads.
        headers: isForm ? { "Content-Type": "multipart/form-data" } : undefined,
      },
    );
    console.log("✅ [magic-studio/generate] response ←", data);
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("❌ [magic-studio/generate] failed:", {
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

/**
 * Poll a Magic Studio video job's status. The job id comes from the initial
 * generate response — no request body is needed, the id is in the URL.
 *
 * @param {string|number} id The generation/job id returned by generateMagicStudio.
 * @returns {Promise<object>} The status payload (e.g. { status, video_url? }).
 */
export async function checkVideoGenerationStatus(id) {
  console.log("📡 [magic-studio/status] checking video job:", id);

  try {
    const { data } = await api.post(`${BASE_URL}/magic-studio/${id}/status`);
    console.log("✅ [magic-studio/status] response ←", data);
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("❌ [magic-studio/status] failed:", {
      status,
      data,
      message: err?.message,
    });

    const serverMsg = data?.message || data?.error || err?.message || "";
    toast.error(serverMsg || "Couldn't check video status. Please try again.");
    throw err;
  }
}
