// API client for the Magic Studio "Generate" endpoint.
//
// Backend contract (POST /magic-studio/generate) — a single endpoint with a
// `type` discriminator. Each Magic Studio tool sends its own payload shape (see
// buildMagicPayload in magicStudioConfigs.jsx for how the UI values are mapped):
//
//   text_to_image       → { type, style, ratio, prompt }
//   text_to_video       → { type, style, ratio, duration, prompt }
//   image_variation     → { type, style, source_image, description? }
//   script_to_voiceover → { type, style, narration_tone, speaking_pace, ratio, export_format, prompt }
//   audio_to_text       → { type, audio_file, language, transcript_format, transcript_quality }
//   text_to_audio       → { type, style, speaking_tone, speaking_speed, export_format, audio_quality, prompt }
//   persona_generator   → { type, name, age, occupation, communication_tone, content_type, ratio, description? }
//
// `description` is the OPTIONAL free-text note on the two tools whose real input
// isn't words — a source image, or the persona's four fields. It is sent only
// when something was actually typed, so an untouched composer posts what it
// always did; see descriptionField in magicStudioConfigs.jsx.
//
// Every one of those EXCEPT audio_to_text and text_to_audio also carries
// `variations` — how many results to make in one request, 1–4, from the
// composer's "3x" chip. The two exceptions never reach this endpoint to
// generate: they run Whisper and Kokoro on-device (text_to_audio comes back
// only to store what it made, via saveTextToAudio below).
//
// ✅ `variations` IS CONFIRMED AGAINST THE API (probed 2026-08-15) — accepted,
// and echoed back on the record as `meta.variations` with `requested_count` /
// `completed_count` beside it. Every result of that run lands in ONE record, as
// `meta.outputs: [{ key, url }]`; the record's `url` is only the first of them.
//
// ⚠️ THE RESPONSE MAY NAME A JOB RATHER THAN A RESULT. `POST /generate` answers
// with `{ generation, url, urls, queued }`, and `generation.status` is
// "completed" only when the work is already done — otherwise it is "processing"
// and the run has to be followed with checkGenerationStatus below. Which of the
// two happens is the backend's choice, so no tool may assume it gets a finished
// result back (see startGeneration in magicStudioConfigs.jsx).
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
export const CDN_BASE = (
  process.env.NEXT_PUBLIC_CDN_URL || "https://d3r8chxzp8ea06.cloudfront.net"
).replace(/\/+$/, "");

/**
 * The hosted URL out of an upload response.
 *
 * ⚠️ THE GALLERY ENDPOINT NESTS ITS RESULT UNDER `file`, which is the envelope
 * that matters most here and the one that is easiest to miss:
 *
 *   { success: true, message: "File uploaded successfully",
 *     file: { id, s3_key, image_url, … } }
 *
 * Other endpoints put the same fields under `data`, or at the top level, so all
 * four shapes are tried in order. Getting this wrong doesn't fail loudly at the
 * request — the upload SUCCEEDS and then the caller reports "no URL came back",
 * which sends you looking at the wrong end of the problem entirely.
 *
 * Lives here, beside resolveMediaUrl, because more than one surface uploads on
 * the user's behalf and they were each carrying their own copy of this — which
 * is how the `file` case came to be missing from every one of them at once.
 *
 * @param {object} response Whatever uploadMedia() resolved with.
 * @returns {string|null}
 */
export function pickHostedUrl(response) {
  const roots = [
    response?.file,
    response?.data?.file,
    response?.data,
    response,
  ];
  for (const root of roots) {
    if (!root || typeof root !== "object") continue;
    const url =
      resolveMediaUrl(root.image_url) ||
      resolveMediaUrl(root.url) ||
      resolveMediaUrl(root.file_url) ||
      resolveMediaUrl(root.s3_key);
    if (url) return url;
  }
  return null;
}

/**
 * Is this URL already hosted by us?
 *
 * The test that decides whether a picked image needs uploading: anything from
 * the user's own library is already on the CDN and can be used as-is, where a
 * Pexels result is a third-party URL that has to be pulled into the gallery
 * first. Compares ORIGINS rather than string-prefixes, so a CDN path that
 * differs only by scheme or trailing slash isn't mistaken for a stranger.
 *
 * @param {string} url
 * @returns {boolean} false for anything unparseable — the safe answer, since it
 *   only ever costs an upload that turns out to have been unnecessary.
 */
export function isHostedUrl(url) {
  try {
    return new URL(url).origin === new URL(CDN_BASE).origin;
  } catch {
    return false;
  }
}

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
 * Statuses that mean the backend is still working on this record.
 *
 * ⚠️ A RECORD EXISTS BEFORE ITS RESULT DOES. The row is written when the request
 * arrives and only filled in when the provider answers, so history genuinely
 * contains runs that have not finished — including runs from a tab that was
 * closed minutes ago, because the backend finishes them whether or not anyone is
 * still watching (verified against the API). Recognising them is what lets the
 * tool show a wait it did not start.
 */
const PENDING_STATUSES = ["processing", "pending", "queued", "in_progress"];

/**
 * Every asset one record produced, newest-API-shape first.
 *
 * ⚠️ ONE RECORD CAN HOLD MANY IMAGES, and reading only `url` is why a 4x run
 * used to show a single result. A multi-variation image generation is ONE row
 * whose assets live in `meta.outputs: [{ key, url }]` (mirrored at the response
 * envelope's top level as `urls: [...]`), with `url`/`s3_key` carrying nothing
 * more than the first of them.
 *
 * Video is the other shape entirely — N separate rows sharing `meta.batch_id`,
 * one per variation — which needs no help here: each row is already its own
 * record and arrives as its own item.
 *
 * @param {object} record Raw history/status record.
 * @returns {Array<{url: string, thumbnail: (string|null)}>}
 */
function recordAssets(record) {
  const outputs = record?.meta?.outputs;
  if (Array.isArray(outputs) && outputs.length > 0) {
    return outputs
      .map((output) => ({
        url: resolveMediaUrl(output?.url) || resolveMediaUrl(output?.key),
        thumbnail: resolveMediaUrl(output?.thumbnail) || null,
      }))
      .filter((asset) => asset.url);
  }

  // Single-asset records (everything made before outputs existed, and video).
  const url =
    resolveMediaUrl(record?.url) ||
    resolveMediaUrl(record?.s3_key) ||
    resolveMediaUrl(record?.image_url) ||
    resolveMediaUrl(record?.video_url) ||
    resolveMediaUrl(record?.audio_url) ||
    null;
  if (!url) return [];
  return [
    {
      url,
      thumbnail:
        resolveMediaUrl(record?.thumbnail) ||
        resolveMediaUrl(record?.poster) ||
        resolveMediaUrl(record?.thumbnail_s3_key) ||
        null,
    },
  ];
}

/**
 * Turn one raw Magic Studio record into the items the grids consume — PLURAL,
 * because a single record can carry a whole batch (see {@link recordAssets}).
 *
 * Returns:
 *   • one item per generated asset, for a finished record
 *   • one text item, for a record that only produced copy (persona text)
 *   • one `pending` item, for a record still being worked on
 *   • nothing at all, for a failed record or one that resolved to no result
 *
 * ⚠️ `id` IS `<generationId>:<index>`, NOT the record id. Two tiles from one
 * record would otherwise share a React key and a selection identity. The record
 * id is kept alongside as `generationId` — it is what DELETE and the status
 * endpoint take, and useMagicHistory maps back to it when removing.
 *
 * @param {object} record Raw record from POST /magic-studio/history.
 * @returns {Array<object>}
 */
function expandMagicHistoryRecord(record) {
  if (!record || typeof record !== "object") return [];

  const generationId = record.id ?? record._id ?? null;
  const status = String(record.status || "").toLowerCase();
  if (status === "failed") return [];

  const base = {
    generationId,
    prompt: record.prompt ?? null,
    tool: record.tool ?? null,
    status: record.status ?? null,
    createdAt: record.generated_at || record.created_at || null,
    // When the run started, whatever it has done since — the age a stale check
    // has to be made against. `createdAt` above prefers `generated_at` for
    // display ordering, which is the moment it FINISHED.
    startedAt: record.created_at || null,
    // How many this run was asked for, so a resumed 4x batch can reserve four
    // tiles rather than one. Absent on older records → falls back to 1.
    requestedCount: Number(record?.meta?.requested_count) || null,
    raw: record,
  };

  if (PENDING_STATUSES.includes(status)) {
    return [
      {
        ...base,
        id: `${generationId}:pending`,
        // A record in flight has no file to infer a type from. The persona
        // generator records what it was asked for, which is the one tool where
        // the answer isn't a property of the tool itself.
        type: record?.meta?.content_type || null,
        url: null,
        videoSrc: null,
        thumbnail: null,
        content: null,
        pending: true,
      },
    ];
  }

  const assets = recordAssets(record);
  if (assets.length === 0) {
    // No file — a text-only result (persona copy) still counts as a result.
    const content = record.content ?? record.text ?? null;
    if (!content) return [];
    return [
      {
        ...base,
        id: `${generationId}:0`,
        type: "text",
        url: null,
        videoSrc: null,
        thumbnail: null,
        content,
        pending: false,
      },
    ];
  }

  return assets.map((asset, index) => {
    const type = inferHistoryType(record, asset.url);
    return {
      ...base,
      id: `${generationId}:${index}`,
      type,
      url: asset.url,
      videoSrc: type === "video" ? asset.url : null,
      thumbnail: asset.thumbnail,
      content: null,
      pending: false,
    };
  });
}

/**
 * Fetch the generation history for one Magic Studio tool. The backend returns
 * `{ success, message, data: [...] }` newest-first (mirroring product-studio);
 * we keep that order, fan each record out into one item per asset it produced,
 * and drop records that failed or resolved to nothing.
 *
 * ⚠️ RUNS STILL IN FLIGHT COME BACK TOO, marked `pending`. They have no URL and
 * must never reach a grid as if they were results — useMagicHistory splits them
 * off into their own list, which is what every consumer should read. This
 * function stays honest about what the server said; deciding how old is too old
 * to keep waiting is the hook's job, not the transport's.
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
    return list.flatMap(expandMagicHistoryRecord);
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
 * Save a Text to Audio run to the user's history.
 *
 * ⚠️ ITS OWN ENDPOINT, NOT /magic-studio/generate. Text to Audio synthesises in
 * the BROWSER, so there is nothing for a generate route to do — this one exists
 * to store audio that already exists. Sending it to /generate instead answers
 * "The audio field is required", and then 500s from inside that controller.
 *
 * @param {FormData} form The run: the audio file plus its settings.
 * @returns {Promise<object>} The created generation record.
 */
export async function saveTextToAudio(form) {
  console.log("📡 [magic-studio/text-to-audio] saving →", [...form.keys()]);
  try {
    const { data } = await api.post(
      `${BASE_URL}/magic-studio/text-to-audio`,
      form,
      // Let the browser set the multipart boundary — naming a Content-Type
      // here without one leaves the body unparseable.
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    console.log("✅ [magic-studio/text-to-audio] saved ←", data);
    return data;
  } catch (err) {
    console.error("❌ [magic-studio/text-to-audio] failed:", {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    // Rethrown rather than toasted: the only caller fires this after the audio
    // is already in the user's hands, and an error about bookkeeping they never
    // asked for would be noise.
    throw err;
  }
}

/**
 * Check on one generation. Works for every backend tool, not just video — the
 * id is in the URL and no request body is needed.
 *
 * Probed 2026-08-15. The response is the record plus two conveniences:
 *
 *   { generation: { id, tool, status, meta, s3_key, url, error, … },
 *     progress:   { completed: 2, requested: 4 },
 *     urls:       ["https://…", "https://…"] }
 *
 * `urls` is the WHOLE set, where `generation.url` is only the first of them —
 * which is the difference between a 4x run showing four results and showing one.
 *
 * ⚠️ TWO ROUTES, ONE HANDLER. `/magic-studio/{id}/status` answers identically
 * and is what this used to call. The `/generations/` form is the one the backend
 * documents, so it is the one used here; nothing needs to change if the shorter
 * alias is ever retired.
 *
 * ⚠️ IT DOES NOT TOAST. This is called on a timer — a network blip twenty
 * minutes into a batch would otherwise stack a red toast every ten seconds. The
 * caller decides when a run has genuinely failed and says so once.
 *
 * @param {string|number} id The generation id.
 * @returns {Promise<object>} The status payload.
 */
export async function checkGenerationStatus(id) {
  if (id == null) throw new Error("Missing generation id for status check.");
  console.log("📡 [magic-studio/status] checking generation:", id);

  try {
    const { data } = await api.get(
      `${BASE_URL}/magic-studio/generations/${id}/status`,
    );
    console.log("✅ [magic-studio/status] response ←", data);
    return data;
  } catch (err) {
    console.error("❌ [magic-studio/status] failed:", {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    throw err;
  }
}
