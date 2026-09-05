"use client";

/**
 * magicStudioConfigs.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Per-category configuration for the two-side Magic Studio modal
 * (MagicStudioModal). Modeled on product-studio' `onDeviceToolConfigs` — the
 * modal shell is generic and every category is described here as data:
 *
 *   • header      → title, accent, sample before/after + copy for the empty state
 *   • input       → which primary input the left sidebar renders
 *                   ("prompt" | "script" | "text" | "image" | "audio" | "persona")
 *   • options     → the option ROWS in the sidebar. Each row opens a rich,
 *                   side-anchored FloatingPanel (product-studio styling) whose
 *                   cards carry an image/icon + label + description.
 *   • resultType  → how the right canvas renders output
 *                   ("image" | "video" | "audio" | "text")
 *   • generate    → async ({ input, values, tts }) => result
 *                   Most categories call the backend (generateMagicStudio);
 *                   text_to_audio instead runs FULLY ON-DEVICE via the AI
 *                   engine's `tts` helper the modal passes in (Kokoro-82M in a
 *                   Web Worker — see src/(lib)/ai-engine).
 *
 * Swap the placeholder Unsplash/Pexels URLs in `samples`/option `img`s for real
 * media whenever ready — drop files in /public and use "/your-file.jpg", or
 * paste a full external URL.
 */

import {
  FileImage,
  Video,
  Layers,
  Mic,
  AudioLines,
  User,
  Music,
  Camera,
  Smile,
  Shapes,
  Star,
  Droplet,
  Palette,
  Cpu,
  Minus,
  Film,
  Aperture,
  Zap,
  Clock,
  Gauge,
  Heart,
  Leaf,
  Flame,
  Briefcase,
  Landmark,
  Sparkles,
  BookOpen,
  Info,
  Laugh,
  MessageCircle,
  AlarmClock,
  Pencil,
  Grid3x3,
  FileText,
  Crown,
  Mars,
  Venus,
  Megaphone,
  Share2,
  Box,
  Brush,
  PenTool,
  Blend,
  Scissors,
  Users,
  ImagePlay,
  Speech,
  Eraser,
  Maximize2,
  WandSparkles,
  Waves,
  Wind,
  Frame,
  MonitorPlay,
  Expand,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  generateMagicStudio,
  resolveMediaUrl,
  saveTextToAudio,
} from "@/(lib)/magic-studio-api";
import {
  CATEGORY_ORDER as TEMPLATE_CATEGORY_ORDER,
  CUSTOM_EFFECT,
  VIDEO_EFFECT_TEMPLATES,
  effectImage,
  effectPrompt,
} from "@/app/(components)/magic-studio/videoEffectTemplates";
import { KOKORO_TTS } from "@/(lib)/ai-engine/models";
import {
  backendVoiceId,
  defaultVoiceFor,
  usesBackend,
  voiceFace,
  voiceItemsFor,
  voiceLabelFor,
} from "@/(lib)/magic-studio-audio";

// Pexels CDN helper (free license, stable URLs) for rich option-card thumbnails.
const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=300`;

// ── Backend payload/response helpers ─────────────────────────────────────────
// The Magic Studio modal renders results from a normalized shape:
//   { assets: [{ id, type, src, videoSrc?, thumbnail?, alt?, content? }], text?, resultType? }
// The backend response shape isn't rigidly fixed, so `normalizeMagicResponse`
// accepts the common shapes (a bare url, { url }, { assets }, arrays, { text })
// and maps them onto that shape for the given result type.

// UI ratio value ("square" | "landscape" | "portrait" | "wide") → "1:1" style
// string the backend expects. Falls back to passing the value straight through.
const RATIO_STRING = {
  square: "1:1",
  landscape: "16:9",
  portrait: "9:16",
  wide: "21:9",
};
const ratioString = (v) => RATIO_STRING[v] || v || "";

// The backend wraps a single generation record as { generation: {...} } (e.g.
// the async video generate/status responses). Unwrap that envelope so the
// extractors below see the record fields (id, status, s3_key, …) directly.
function unwrapGeneration(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (data.generation && typeof data.generation === "object") {
      return data.generation;
    }
  }
  return data;
}

// Pull an array of raw items out of whatever the backend returned.
function extractItems(data) {
  if (!data) return [];
  const root = unwrapGeneration(data);
  if (Array.isArray(root)) return root;

  // ⚠️ THE WHOLE BATCH BEFORE THE FIRST OF IT. A multi-variation image run is
  // ONE record carrying every result — `meta.outputs: [{ key, url }]` on the
  // record, mirrored as `urls: [...]` on the envelope beside it — while
  // `url`/`s3_key` hold only the first. Reading those single fields first is
  // what made a 4x run render one image and quietly drop three that had been
  // generated and paid for.
  const outputs = root?.meta?.outputs;
  if (Array.isArray(outputs) && outputs.length > 0) return outputs;
  // `urls` sits on the envelope, NOT inside `generation` — hence `data` here
  // rather than the unwrapped `root`.
  const urls = data?.urls || root?.urls;
  if (Array.isArray(urls) && urls.length > 0) return urls;

  // Common container keys, in priority order.
  const container =
    root.assets ||
    root.results ||
    root.data ||
    root.items ||
    root.urls ||
    root.images ||
    root.videos;
  if (Array.isArray(container)) return container;
  // Single-result shapes: { url } / { src } / { video_url } / { s3_key } / …
  const single =
    root.url ||
    root.src ||
    root.video_url ||
    root.audio_url ||
    root.image_url ||
    root.s3_key;
  if (single) return [root];
  return [];
}

// Pull a usable media URL off one raw item (item may itself be a string URL).
// Runs every candidate through resolveMediaUrl so a bare S3 object key
// (e.g. "creativeklux/…​.mp4") is turned into a hosted CDN URL, and full URLs
// pass through untouched.
function itemUrl(item) {
  if (!item) return null;
  if (typeof item === "string") return resolveMediaUrl(item);
  return (
    resolveMediaUrl(item.src) ||
    resolveMediaUrl(item.url) ||
    resolveMediaUrl(item.video_url) ||
    resolveMediaUrl(item.videoSrc) ||
    resolveMediaUrl(item.audio_url) ||
    resolveMediaUrl(item.image_url) ||
    resolveMediaUrl(item.s3_key) ||
    // `key` is what an entry in `meta.outputs` calls its object key.
    resolveMediaUrl(item.key) ||
    resolveMediaUrl(item.preview) ||
    null
  );
}

/**
 * Normalize a backend response into the modal's render shape.
 * @param {object|Array} data       Raw response from generateMagicStudio.
 * @param {string} resultType       "image" | "video" | "audio" | "text".
 * @returns {{ assets?: Array, text?: string, resultType: string }}
 */
function normalizeMagicResponse(data, resultType) {
  // Transcript / text tools: prefer an explicit text field.
  if (resultType === "text") {
    const root = unwrapGeneration(data);
    const text =
      root?.text ||
      root?.transcript ||
      root?.transcription ||
      root?.result ||
      root?.content;
    if (typeof text === "string" && text.trim())
      return { text, resultType: "text" };
    // Otherwise fall through to asset extraction (e.g. persona text blocks).
  }

  const items = extractItems(data);
  const assets = items
    .map((item, i) => {
      const url = itemUrl(item);
      // Text asset (persona "Text" content type) — no URL, has copy.
      const content =
        typeof item === "object" ? item.content || item.text : null;
      if (!url && content) {
        return { id: item.id || `magic-txt-${i}`, type: "text", content };
      }
      if (!url) return null;
      const id =
        (typeof item === "object" && item.id) || `magic-${resultType}-${i}`;
      const thumbnail =
        typeof item === "object"
          ? item.thumbnail || item.poster || item.image
          : undefined;
      return {
        id: String(id),
        type: resultType,
        src: url,
        preview: url,
        videoSrc: resultType === "video" ? url : undefined,
        thumbnail,
        alt: (typeof item === "object" && item.alt) || `Result ${i + 1}`,
      };
    })
    .filter(Boolean);

  return { assets, resultType };
}

// ── Async generation jobs ────────────────────────────────────────────────────
// A generation is a JOB, whatever it makes. The record is written when the
// request arrives and filled in when the provider answers, so a response can
// name a job that isn't finished — `{ generation: { id, status: "processing" } }`
// — and the run is followed by polling checkGenerationStatus until it reports
// "completed". These helpers keep the (field-name-tolerant) response handling in
// one place so every tool and every surface agree on the shape.
//
// ⚠️ NAMED FOR JOBS, NOT FOR VIDEO. They read the same three things off any
// tool's response — which job, what state, what went wrong — and were called
// getVideoStatus / normalizeVideoResult / extractVideoJobId back when only the
// two video tools were asynchronous. The behaviour is unchanged; the names
// stopped being true once the image tools started being followed the same way.

// Statuses that mean the job is done / permanently failed. Anything else while a
// job exists is treated as still "processing".
const JOB_DONE_STATES = [
  "completed",
  "complete",
  "done",
  "success",
  "succeeded",
  "ready",
  "finished",
];
const JOB_FAILED_STATES = [
  "failed",
  "error",
  "errored",
  "cancelled",
  "canceled",
];

/**
 * Tolerantly pull the job id out of the initial generate response. The backend
 * returns the record wrapped as { generation: { id, status, … } }, so we unwrap
 * that first before falling back to the other common id field names.
 */
export function extractGenerationId(data) {
  const root = unwrapGeneration(data);
  return (
    root?.id ??
    root?.job_id ??
    root?.jobId ??
    root?.video_id ??
    root?.videoId ??
    root?.generation_id ??
    data?.data?.id ??
    data?.data?.job_id ??
    null
  );
}

/**
 * Normalize a status/final response into the render shape, for whatever the tool
 * makes.
 *
 * @param {object} data A status or generate response.
 * @param {"image"|"video"|"audio"|"text"} [resultType="video"] What the tool
 *   produces. ⚠️ REQUIRED IN PRACTICE for anything but video: the type ends up
 *   on every asset, and the editor drops a result onto the canvas only when it
 *   is `type: "image"` — so a polled image labelled "video" silently vanishes on
 *   the surface that mattered most.
 */
export function normalizeStatusResult(data, resultType = "video") {
  return normalizeMagicResponse(data, resultType);
}

/**
 * Classify a status response → "completed" | "processing" | "failed".
 * Trusts an explicit `status` field; otherwise infers from whether a usable
 * result URL is present yet.
 */
export function getGenerationStatus(data) {
  const root = unwrapGeneration(data);
  const s = String(root?.status ?? data?.data?.status ?? "")
    .toLowerCase()
    .trim();
  if (s) {
    if (JOB_DONE_STATES.includes(s)) return "completed";
    if (JOB_FAILED_STATES.includes(s)) return "failed";
    return "processing";
  }
  return extractItems(data).length > 0 ? "completed" : "processing";
}

/**
 * Why a video job failed, as the backend recorded it — or "" if it didn't say.
 *
 * ⚠️ WORTH SURFACING RATHER THAN SWALLOWING. A failed record carries the real
 * reason on `error`, and it is frequently something the user can act on:
 *
 *   fal.ai queue result error (fal-ai/kling-video):
 *   {"detail":[{"loc":["body","duration"],"msg":"Input should be '5' or '10'"}]}
 *
 * Replacing that with "Video generation failed, please try again" doesn't just
 * lose detail — it gives the wrong instruction, because trying again with the
 * same inputs fails identically every time.
 *
 * @param {object} data A video status/generate response.
 * @returns {string}
 */
export function getGenerationError(data) {
  const root = unwrapGeneration(data);
  const raw =
    root?.error ||
    root?.error_message ||
    root?.message ||
    data?.data?.error ||
    "";
  return typeof raw === "string" ? readableProviderError(raw.trim()) : "";
}

/**
 * Provider failures that are about OUR account rather than the user's request.
 *
 * ⚠️ THESE MUST NEVER REACH THE USER VERBATIM. When the fal.ai balance runs out
 * the provider answers with an instruction addressed to the account holder —
 *
 *   {"detail":"User is locked. Reason: Exhausted balance. Top up your balance
 *   at fal.ai/dashboard/billing."}
 *
 * — which, shown in the composer, names our vendor, exposes our billing state,
 * and tells a paying customer to go top up somebody else's account. It is also
 * the one failure they can do nothing about, so detail buys them nothing.
 *
 * Matched against the WHOLE raw string rather than a parsed field: the wording
 * and the shape both move between providers, and this only has to RECOGNISE the
 * class of failure, not parse it.
 */
const PROVIDER_ACCOUNT_ERROR =
  /exhausted balance|top up|user is locked|insufficient (?:funds|balance|credits?)|quota exceeded|out of credits?|billing/i;

/** What we say instead — deliberately silent about whose problem it is. */
const PROVIDER_ACCOUNT_MESSAGE =
  "This tool is temporarily unavailable. Please try again shortly.";

/**
 * Turn a provider's error dump into one readable line.
 *
 *   fal.ai queue result error (fal-ai/kling-video): {"detail":[{"type":
 *   "literal_error","loc":["body","duration"],"msg":"Input should be '5' or
 *   '10'","input":"3", …}]}
 *     → duration: Input should be '5' or '10'
 *
 *   fal.ai queue submit error (fal-ai/kling-video/v1.6/…): {"detail":"User is
 *   locked. Reason: Exhausted balance. Top up your balance at …"}
 *     → This tool is temporarily unavailable. Please try again shortly.
 *
 * Best-effort by design: anything it doesn't recognise comes back untouched, so
 * a change in the provider's error shape costs detail, never the message. The
 * raw string is logged at the call site either way.
 */
function readableProviderError(raw) {
  // Tested before anything is parsed. An account lock is not a shape worth
  // depending on recognising, and the answer is the same whatever shape it took.
  if (PROVIDER_ACCOUNT_ERROR.test(raw)) return PROVIDER_ACCOUNT_MESSAGE;

  const start = raw.indexOf("{");
  if (start === -1) return raw;
  try {
    const detail = JSON.parse(raw.slice(start))?.detail;

    // One provider-level sentence, rather than the per-field array below. Worth
    // returning on its own: the prefix it arrives wrapped in names the vendor
    // and an internal model id, neither of which means anything to the user.
    if (typeof detail === "string" && detail.trim()) return detail.trim();

    if (!Array.isArray(detail) || detail.length === 0) return raw;
    const lines = detail
      .map((entry) => {
        if (!entry?.msg) return null;
        // `loc` is the path to the offending field — its last segment is the
        // field name the user actually chose ("duration"), where the earlier
        // ones are envelope ("body").
        const field = Array.isArray(entry.loc) ? entry.loc.at(-1) : null;
        return field ? `${field}: ${entry.msg}` : entry.msg;
      })
      .filter(Boolean);
    return lines.length > 0 ? lines.join(" · ") : raw;
  } catch {
    return raw;
  }
}

/**
 * Put a Text to Audio run into the user's history.
 *
 * Text to Audio synthesises in the BROWSER, so unlike every other tool nothing
 * reaches the server as a side effect of generating, and the run would otherwise
 * vanish with the page. This uploads the audio we just made, immediately after
 * it exists, and the backend stores that file.
 *
 * ⚠️ ITS OWN ENDPOINT — POST /magic-studio/text-to-audio, not /generate. There
 * is nothing to generate: the audio exists, and this hands the finished file
 * over to be kept. So what lands in history is the exact file the user heard,
 * and no second synthesis is paid for.
 *
 * ⚠️ NEVER AWAITED, AND IT SWALLOWS ITS OWN FAILURES. The audio the user asked
 * for is already made and playable at this point; the save is bookkeeping. If it
 * is slow the result must not wait behind it, and if it fails — offline, an
 * expired token — the user must still get their audio rather than an error about
 * a save they never asked for. It is logged, not toasted.
 *
 * @param {string} text   The text that was spoken.
 * @param {object} values The tool's option values (voice / speed / format / quality).
 * @param {{blob: Blob, format: string, duration: number}} item The generated audio.
 */
function recordTextToAudio(text, values, item) {
  if (!item?.blob) {
    console.warn("⚠️ [magic-studio] no audio blob to record");
    return;
  }

  const ext = item.format || values.format || "mp3";
  const form = new FormData();
  // ⚠️ REQUIRED, even on this tool's own route. It looks redundant next to a URL
  // that already names the tool, and it isn't — the endpoint validates it, and
  // dropping it answers "The tool field is required."
  form.append("tool", "text_to_audio");
  form.append("prompt", text);
  // A File rather than a bare Blob: multipart needs a filename, and without one
  // the server sees an unnamed part and the extension it stores is a guess.
  form.append(
    "audio",
    new File([item.blob], `text-to-audio-${Date.now()}.${ext}`, {
      type: item.blob.type || `audio/${ext}`,
    }),
  );
  form.append("voice", values.voice);
  // ⚠️ THE NAME, NOT THE NUMBER. `speaking_pace` is the word-valued field —
  // the same one script_to_voiceover posts — and it has always been given
  // "normal" rather than "1". The composer's control is a slider now, so the
  // number is translated back here rather than changing what this endpoint has
  // been receiving since it was written. See paceName.
  form.append("speaking_pace", paceName(values.speed));
  form.append("export_format", values.format);
  form.append("quality", values.quality);

  console.log(
    `🗄️ [magic-studio] recording text_to_audio — ${(item.blob.size / 1024).toFixed(0)} kB ${ext}`,
  );

  // Quiet on failure — saveTextToAudio has already logged the detail, and the
  // audio is in the user's hands either way.
  saveTextToAudio(form).catch(() => {});
}

/**
 * Kick off a generation. POSTs the payload, then returns either a finished
 * result (a URL came back with it) or a pending descriptor `{ pending, jobId }`
 * for the caller to poll on.
 *
 * ⚠️ EVERY BACKEND TOOL GOES THROUGH HERE, not just the video pair. Whether a
 * given run answers immediately or has to be waited on is the BACKEND'S choice,
 * not the tool's: the same endpoint returns a finished record today and a
 * "processing" one the moment that work moves onto a queue. A tool that assumed
 * "my results arrive with the response" would break silently on that day —
 * reporting success with an empty canvas — which is precisely how the image
 * tools behaved before this.
 *
 * ⚠️ THE ID IS RETURNED EVEN WHEN THE RESULT IS. useMagicGenerate watches the
 * run from the moment it starts, so by the time this resolves the poll may
 * already have delivered — `generationId` is how the two are recognised as the
 * same run instead of the result being shown twice.
 *
 * @param {object} payload Request body, already shaped for the backend.
 * @param {"image"|"video"|"audio"|"text"} resultType What this tool produces.
 * @returns {Promise<object>} A render shape, or `{ pending: true, jobId }`.
 */
async function startGeneration(payload, resultType) {
  const data = await generateMagicStudio(payload);
  const status = getGenerationStatus(data);

  if (status === "failed") {
    // The record's own reason where there is one — see getGenerationError.
    throw new Error(
      getGenerationError(data) || "Generation failed. Please try again.",
    );
  }

  const immediate = normalizeMagicResponse(data, resultType);
  const generationId = extractGenerationId(data);
  if (status === "completed" && immediate.assets.length > 0) {
    return { ...immediate, generationId, raw: data };
  }

  return { resultType, pending: true, jobId: generationId, raw: data };
}

// ── Shared aspect-ratio option set (rich cards render a scaled frame) ─────────
const RATIO_SQUARE = {
  value: "square",
  label: "Square",
  ratio: "1:1",
  w: 1,
  h: 1,
};
const RATIO_LANDSCAPE = {
  value: "landscape",
  label: "Landscape",
  ratio: "16:9",
  w: 16,
  h: 9,
};
const RATIO_PORTRAIT = {
  value: "portrait",
  label: "Portrait",
  ratio: "9:16",
  w: 9,
  h: 16,
};
const RATIO_WIDE = {
  value: "wide",
  label: "Ultra Wide",
  ratio: "21:9",
  w: 21,
  h: 9,
};

/**
 * What the result is FOR — shared by the three tools that produce something
 * publishable (Text to Image, Text to Video, Script to Voiceover). Audio to Text
 * and the persona generator have no equivalent: a transcript isn't for anything
 * in this sense, and the persona already carries its own framing.
 *
 * Sent to the backend as `purpose`, on all three. The VALUES are the contract —
 * "ad-design" / "social-design" / "image-design" — so change a `value` here only
 * alongside the backend, where a change to a `label` or `desc` is safe on its
 * own. The values are the backend's design-type names, which is why they read
 * "…-design" rather than matching the labels the user sees.
 *
 * ONE constant rather than three copies: the three tools must offer the same
 * three purposes, or "Ads" would come to mean something different depending on
 * which tool you happened to be in.
 */
const PURPOSE_OPTION = {
  key: "purpose",
  label: "Purpose",
  panel: "list",
  width: 300,
  default: "image-design",
  items: [
    {
      value: "ad-design",
      label: "Ads",
      desc: "Built to sell — a clear offer and a reason to click",
      icon: Megaphone,
    },
    {
      value: "social-design",
      label: "Social",
      desc: "Built for the feed — native, scrollable, shareable",
      icon: Share2,
    },
    {
      value: "image-design",
      label: "General",
      desc: "No particular channel in mind",
      icon: Sparkles,
    },
  ],
};

/**
 * The value meaning "no colour in particular" — the colour option's default.
 *
 * ⚠️ EXPORTED, AND THE PANEL AND THE PAYLOAD BOTH KEY OFF IT. The swatch grid
 * draws this one as an empty slashed square, and `generate` OMITS the field
 * entirely when it is still selected. Those two behaviours have to agree, so the
 * sentinel is declared once here rather than written as a bare "auto" in both
 * places.
 */
export const AUTO_COLOR = "auto";

/**
 * A colour to build the image around — shared by Text to Image and Image to
 * Variations, the two tools that paint something from scratch enough for a
 * colour to mean anything.
 *
 * ⚠️ SENT AS `color`, AND ONLY WHEN ONE IS ACTUALLY CHOSEN. This endpoint
 * validates its payload and rejects fields it doesn't know — the same validator
 * behind "The tool field is required" — so a new key is a real risk on tools
 * that work today. Leaving it out while the option sits on its default means an
 * untouched composer sends the byte-identical payload it sent before this
 * existed, and only a deliberate colour pick can change that. If a 422 appears
 * the moment somebody picks a swatch, this key is what to check with the API.
 *
 * ⚠️ THE PRESETS ARE A STARTING SET, NOT THE POINT. The colour anyone actually
 * wants here is their own brand's, which no fixed palette can hold — the hex box
 * in the panel is what covers that, and it writes the same value a swatch does.
 */
const COLOR_OPTION = {
  key: "color",
  label: "Colour",
  panel: "colors",
  width: 300,
  default: AUTO_COLOR,
  items: [
    { value: AUTO_COLOR, label: "No preference" },
    { value: "#2563eb", label: "Blue" },
    { value: "#0ea5e9", label: "Sky" },
    { value: "#059669", label: "Emerald" },
    { value: "#f59e0b", label: "Amber" },
    { value: "#ef4444", label: "Red" },
    { value: "#ec4899", label: "Pink" },
    { value: "#7c3aed", label: "Violet" },
    { value: "#111827", label: "Near-black" },
    { value: "#f8fafc", label: "Off-white" },
  ],
};

/** The `color` field for a payload — absent unless a real colour was chosen. */
const colorField = (value) =>
  value && value !== AUTO_COLOR ? { color: value } : {};

/**
 * The `description` field for a payload — absent unless something was written.
 *
 * ⚠️ THE TOOLS THAT DON'T READ WORDS STILL WANT THEM. Image to Variations starts
 * from a picture and the Persona Generator from four form fields, so until now
 * neither had anywhere to say "keep the product, warm the background up" or
 * "this is for a Black Friday push" — the entire intent had to be squeezed into
 * a style card. This is that missing sentence.
 *
 * ⚠️ IT IS OPTIONAL, AND OMITTED WHEN EMPTY — the same rule as COLOR_OPTION's,
 * for the same reason. This endpoint rejects fields it doesn't declare, so
 * sending `description: ""` on every run would put a live 422 on two tools that
 * work today. Leaving it out while the box is untouched means those tools go on
 * sending the byte-identical payload they sent before this existed, and only a
 * description somebody actually wrote can change that.
 *
 * ⚠️ THE FIELD NAME IS THE PART TO CHECK FIRST if a 422 appears the moment
 * anyone types in that box. Everything else here is confirmed against the API;
 * this one is named for what it is rather than probed.
 *
 * A tool opts in by declaring `describable: true` — that flag is what puts the
 * box on the composer, and this is what puts what was typed into the payload.
 * The two go together: one without the other is either a box that goes nowhere
 * or a field nobody can fill.
 */
const descriptionField = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? { description: text } : {};
};

/**
 * The `brand_name` / `logo_url` pair for a payload — who the image is for, and
 * optionally the mark to work into it.
 *
 * ⚠️ TWO FIELDS, NOT ONE, AND THEY ANSWER DIFFERENT QUESTIONS. This used to be a
 * single `logo` string carrying either words or a URL, with the backend told to
 * tell them apart by the leading http. It doesn't have to guess any more: the
 * words are the BRAND NAME and go up as `brand_name`, the picked picture is the
 * LOGO and goes up as `logo_url`. Both can be sent on the same run — naming your
 * brand and handing over its mark is one intent, not two competing ones.
 *
 * ⚠️ THE MARK'S WIRE NAME IS `logo_url`, NOT `brand_logo`. It is the name the
 * backend echoes on the record (`meta.logo_url`), and it is not symmetrical with
 * `brand_name` — which is exactly why it gets written down here. Guessing the
 * matching name is how the mark ends up silently ignored on a run that otherwise
 * succeeds: an undeclared key is dropped, and nothing about the result says the
 * logo went missing.
 *
 * ⚠️ `brand_name` IS REQUIRED AND `logo_url` IS NOT. A run with no brand name is
 * blocked before it reaches here (see the tool's `validate`), so the guard below
 * is the belt to that braces rather than the rule itself; the logo is simply
 * omitted when nobody picked one.
 *
 * ⚠️ THE LOGO IS SENT BY ITS OWN URL, NEVER AS A FILE — the field is named for
 * it. Nothing is copied into the gallery on the way — same as the source image
 * on Image to Variations — so the backend fetches it server-side. If a typed
 * brand name works and a picked logo doesn't, that fetch is the thing to check,
 * not this.
 *
 * A tool opts in by declaring `brand: true`, which is what puts the chip on the
 * composer; this is what puts the answers into the payload.
 */
const brandFields = (name, logo) => {
  const brand_name = typeof name === "string" ? name.trim() : "";
  const logo_url = typeof logo === "string" ? logo.trim() : "";
  return {
    ...(brand_name ? { brand_name } : {}),
    ...(logo_url ? { logo_url } : {}),
  };
};

/**
 * The `prompt` field for a payload — absent unless something was written.
 *
 * ⚠️ NOT THE SAME AS {@link descriptionField}, and the difference is the wire
 * name rather than the box. Both read the composer's textarea on a tool whose
 * primary input is a picture; this one sends what was typed as `prompt` because
 * on these tools the words describe the MOTION to create, not a note about a
 * picture that already exists. Sending motion directions under `description`
 * would file them as an aside on a tool where they are the direction.
 *
 * ⚠️ IT IS OPTIONAL, AND OMITTED WHEN EMPTY — the same rule as COLOR_OPTION's
 * and descriptionField's, for the same reason: this endpoint rejects fields it
 * doesn't declare, so an untouched composer must post the payload it always did.
 * Image to Video is genuinely usable with no words at all — a still carries
 * enough for a model to infer the movement — which is why this omits rather than
 * sending an empty string.
 */
const promptField = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? { prompt: text } : {};
};

/**
 * The `sound` field for a payload — absent while the clip is silent.
 *
 * Silence is what a video tool has always produced here, so leaving the field
 * out on the default keeps an untouched run byte-identical to the one before
 * this option existed. Only a deliberate "With sound" says anything on the wire.
 */
const soundField = (value) => (value === "on" ? { sound: true } : {});

/**
 * What the background remover should put behind the subject.
 *
 * ⚠️ THE ONE PLACE {@link AUTO_COLOR} IS *NOT* AN OMISSION. Everywhere else the
 * sentinel means "no preference, leave the field out" — here it means
 * transparent, which is the entire product: a clip with a hole in it, for an
 * editor to drop something behind. Omitting the field would ask for whatever the
 * backend defaults to, which is the opposite of a deliberate choice. So this one
 * always sends, and it sends the literal "transparent".
 *
 * The panel already draws AUTO_COLOR as an empty slashed swatch, which reads as
 * "nothing" rather than as a shade — so the sentinel and the meaning line up
 * with no new panel kind (see OptionPanelBody's `colors` branch).
 */
const backgroundValue = (value) =>
  !value || value === AUTO_COLOR ? "transparent" : value;

/**
 * The container a background-removed clip has to come back in — DERIVED from the
 * background, never chosen.
 *
 * Transparency needs an alpha-capable container and MP4 has none, so the two
 * move together: a transparent result is MOV, and anything with a colour behind
 * it is MP4. Offering a format picker beside the background would let someone
 * ask for a transparent MP4 — a combination with no valid answer — and the
 * failure would only surface after the render.
 *
 * Derived in one place rather than written into the payload at the call site, so
 * the rule can't be applied differently on a second surface.
 */
const formatForBackground = (value) =>
  backgroundValue(value) === "transparent" ? "mov" : "mp4";

/**
 * The nine styles the BACKEND knows by name.
 *
 * ⚠️ THE `value` IS THE WHOLE CONTRACT. Each of these keys is one the backend
 * already holds a full style description for — "photorealistic" expands to
 * "professional advertising photography, cinematic lighting, high end
 * commercial look" on its side, and so on for the other eight. So the frontend
 * sends the bare key and nothing else: writing our own version of that sentence
 * here would give the same style two definitions that drift apart, and the
 * user's would be the one that lost.
 *
 * ⚠️ THE HYPHENS ARE NOT A TYPO next to `oil_painting` below. These nine come
 * from the backend's own list and are spelled the way it spells them; the
 * underscored ones are older frontend values that predate it. Don't "tidy" one
 * convention into the other — the string is what identifies the style.
 *
 * ⚠️ SHARED, NOT COPIED. Both style pickers spread this in — Text to Image /
 * Text to Video, and Image to Variations, which otherwise keeps a set of its own
 * in a different naming convention entirely. One list means a style the backend
 * supports can't end up offered on one tool and missing on another.
 *
 * The thumbnails are Pexels photos chosen to DEMONSTRATE each style rather than
 * to illustrate its name — "Lifestyle" is a candid shot of real people in
 * daylight, not a picture of the word. Every id here was checked against the
 * CDN; a dead one degrades to the icon-on-a-panel state rather than a broken
 * image (see OptionPanelBody), so a photo disappearing is untidy, not broken.
 */
const CORE_STYLES = [
  {
    value: "photorealistic",
    label: "Photorealistic",
    desc: "True-to-life detail",
    icon: Camera,
    img: px(1707820),
  },
  {
    value: "cinematic",
    label: "Cinematic",
    desc: "Film-grade lighting",
    icon: Film,
    img: px(2873486),
  },
  {
    value: "3d-render",
    label: "3D Render",
    desc: "Clean studio 3D",
    icon: Box,
    img: px(28918449),
  },
  {
    value: "illustration",
    label: "Illustration",
    desc: "Editorial artwork",
    icon: Brush,
    img: px(19032025),
  },
  {
    value: "flat-vector",
    label: "Flat Vector",
    desc: "Geometric & solid",
    icon: PenTool,
    img: px(12891180),
  },
  {
    // ⚠️ `minimal`, AND IT USED TO BE `minimalist`. Same card, same place in the
    // picker, one letter different on the wire — this is the spelling the
    // backend documents, and keeping both would have put two cards reading
    // "Minimal" and "Minimalist" side by side meaning the same thing.
    value: "minimal",
    label: "Minimal",
    desc: "Clean & simple",
    icon: Minus,
    img: px(1103970),
  },
  {
    value: "gradient",
    label: "Gradient",
    desc: "Soft light blooms",
    icon: Blend,
    img: px(7135007),
  },
  {
    value: "collage",
    label: "Collage",
    desc: "Layered paper textures",
    icon: Scissors,
    img: px(36591281),
  },
  {
    value: "lifestyle",
    label: "Lifestyle",
    desc: "Candid & natural",
    icon: Users,
    img: px(1616551),
  },
];

// ── Visual-style cards (shared between Text-to-Image / Text-to-Video) ─────────
/**
 * The styles these pickers carried before the backend published its nine.
 *
 * Kept, not replaced: people have been choosing these for months and a style
 * vanishing from the picker is a feature disappearing. `minimalist` is the only
 * one that moved, and it moved INTO {@link CORE_STYLES} as `minimal` — the
 * spelling the backend recognises — rather than out of the list.
 *
 * Named separately from IMAGE_STYLES so Text to Video can say which of them it
 * offers by value; see its `style` option.
 */
const LEGACY_IMAGE_STYLES = [
  {
    value: "anime",
    label: "Anime",
    desc: "Japanese animation",
    icon: Star,
    img: px(1183992),
  },
  {
    value: "cartoon",
    label: "Cartoon",
    desc: "Bold & playful",
    icon: Smile,
    img: px(207983),
  },
  {
    value: "watercolor",
    label: "Watercolor",
    desc: "Soft painted washes",
    icon: Droplet,
    img: px(1053687),
  },
  {
    value: "oil_painting",
    label: "Oil Painting",
    desc: "Rich brush texture",
    icon: Palette,
    img: px(1585325),
  },
  {
    value: "cyberpunk",
    label: "Cyberpunk",
    desc: "Neon futuristic",
    icon: Cpu,
    img: px(2311602),
  },
  {
    value: "abstract",
    label: "Abstract",
    desc: "Shapes & color",
    icon: Shapes,
    img: px(1616403),
  },
  {
    value: "vintage",
    label: "Vintage",
    desc: "Retro film look",
    icon: Aperture,
    img: px(1183434),
  },
  {
    value: "neon",
    label: "Neon / Glow",
    desc: "Vivid glow",
    icon: Zap,
    img: px(1631677),
  },
];

/** Every style Text to Image offers — the backend's nine, then the older ones. */
const IMAGE_STYLES = [...CORE_STYLES, ...LEGACY_IMAGE_STYLES];

// ── Text-to-Audio voice cards (real Kokoro-82M voices, from the AI engine) ───
// The on-device model ships 28 English voices; the "voices" panel groups them
// by accent + gender, each card carrying a portrait over its gender glyph.
// `top` marks the best-graded voices (A/B on the Kokoro voice card) with a ★.
const KOKORO_VOICE_ITEMS = (() => {
  // Faces are dealt per gender so each gender's list walks its own pool — see
  // voiceFace. Kokoro's voices are ordered by accent, so this also keeps two
  // neighbours in the same group off the same photo.
  const seen = { female: 0, male: 0 };
  return KOKORO_TTS.voices.map((v) => ({
    value: v.id,
    label: v.name,
    desc: `${v.accent} · ${v.gender}`,
    icon: v.gender === "male" ? Mars : Venus,
    img: voiceFace(v.gender, seen[v.gender]++),
    gender: v.gender,
    group: `${v.accent} ${v.gender} voices`,
    top: /^[AB]/.test(v.grade),
    // The 28 clips already committed under /voice-samples. `synth: true` is what
    // separates these from the hosted voices: this model runs on the user's own
    // machine, so a missing clip costs a few seconds rather than a generation.
    sample: `/voice-samples/${v.id}.mp3`,
    synth: true,
  }));
})();

/**
 * The words these two options used to be, and the multiplier each meant.
 *
 * ⚠️ KEPT AS A TRANSLATION TABLE, NOT AS THE CHOICES. Speaking speed is a
 * SLIDER now on both tools — see the `speed` and `pace` options — so what the
 * composer holds is a number as a string ("1.05"). This still resolves a stale
 * word to its multiplier, which costs nothing and means a surface still holding
 * "normal" from a session that started before the change carries on working
 * rather than sending a speed of NaN.
 */
const SPEAKING_SPEED = { slow: 0.75, normal: 1, fast: 1.25, rapid: 1.5 };

/**
 * The multiplier to actually speak at, from whatever the option holds.
 *
 * Takes the slider's numeric string, a legacy word, or nothing at all, and
 * always answers a usable positive number — 1 when it cannot tell, because a
 * speed is the one field here where a wrong guess is audible and a missing one
 * is fatal.
 *
 * @param {string|number} value
 * @returns {number}
 */
const speakingSpeed = (value) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  const named = SPEAKING_SPEED[value];
  if (named) return named;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

/**
 * How a speed reads in words — the slider's hint line.
 *
 * The number is already on screen beside it; this says what the number MEANS, so
 * the control is still answerable by someone who has never thought about 1.15×.
 */
/**
 * The pace NAME to send for a slider position — "slow" | "normal" | "fast" |
 * "rapid".
 *
 * ⚠️ SCRIPT TO VOICEOVER'S WIRE FORMAT NEVER CHANGED. `speaking_pace` has always
 * carried one of these four words, and this endpoint rejects what it doesn't
 * recognise — so making the control a slider is a UI change and only a UI
 * change. The number chooses the word; the payload is byte-identical to the one
 * the four cards produced.
 *
 * Passes a word straight through, for a surface still holding one.
 */
const paceName = (value) => {
  if (typeof value === "string" && value in SPEAKING_SPEED) return value;
  const n = speakingSpeed(value);
  if (n < 0.9) return "slow";
  if (n < 1.15) return "normal";
  if (n < 1.4) return "fast";
  return "rapid";
};

const speedWord = (n) => {
  if (n < 0.9) return "Slower — contemplative";
  if (n < 1.05) return "Normal — balanced";
  if (n < 1.3) return "Faster — energetic";
  return "Rapid — punchy";
};

/**
 * Drop the option rows an engine cannot act on.
 *
 * ⚠️ A CONTROL THAT DOES NOTHING IS WORSE THAN A MISSING ONE. The backend's
 * audio payloads take `voice` + `speaking_speed` for speech and `language` for
 * transcription — nothing else. Leaving the export-format, quality and
 * transcript-format cards on screen would let someone pick WAV, wait, and get an
 * MP3, with no way to tell that the choice was never sent. They come straight
 * back when the tool returns to its on-device engine, which does honour them.
 *
 * @param {Array} options The tool's full option list.
 * @param {string[]} keys The option keys this engine actually sends.
 * @returns {Array}
 */
const onlyOptions = (options, keys) =>
  options.filter((option) => keys.includes(option.key));

/** Extension → MIME, for the formats the audio picker accepts. */
const AUDIO_MIME_BY_EXT = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
  webm: "audio/webm",
};

/**
 * A File the transcriber will accept, from one the browser handed us.
 *
 * ⚠️ THE MIME TYPE IS LOAD-BEARING, AND THE BROWSER DOES NOT ALWAYS SUPPLY ONE.
 * A `File` whose `type` is empty is sent as `application/octet-stream`, which
 * the transcriber rejects outright:
 *
 *   HTTP 415: Unsupported audio type: application/octet-stream
 *
 * That reads like a corrupt file and isn't — the bytes are fine, the header is
 * missing. It happens whenever the OS can't map an extension, and it is the
 * whole file that gets blamed.
 *
 * ⚠️ PARAMETERS ARE STRIPPED TOO. MediaRecorder reports
 * `audio/webm;codecs=opus`, and a server matching its allowlist exactly will
 * refuse that where it accepts `audio/webm`. The codec tells the transcriber
 * nothing it cannot read from the file itself.
 *
 * Returns the original File untouched when its type is already a clean
 * `audio/*` — the common case, and not worth a copy.
 *
 * @param {File} file
 * @returns {File}
 */
function audioForUpload(file) {
  const name = file.name || "audio.mp3";
  // Drop any `;codecs=…` parameter before judging the type.
  const declared = (file.type || "").split(";")[0].trim().toLowerCase();
  if (declared.startsWith("audio/")) {
    return declared === file.type ? file : new File([file], name, { type: declared });
  }

  const ext = name.split(".").pop()?.toLowerCase();
  const type = AUDIO_MIME_BY_EXT[ext] || "audio/mpeg";
  console.warn(
    `⚠️ [magic-studio] audio arrived as "${file.type || "(none)"}" — sending as ${type} (from .${ext})`,
  );
  return new File([file], name, { type });
}

// ── Audio-to-Text languages (real Whisper-base codes, from the AI engine) ────
// `auto` triggers a REAL detection pass in the STT worker (one decoder step on
// the first 30 s — the detected language is then shown in the UI and forced for
// the whole run); every other value is a 2-letter code the multilingual model
// accepts. Shared by the language option and the result's meta line.
const TRANSCRIBE_LANGUAGES = [
  { value: "auto", label: "Auto Detect", flag: "🌐" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "de", label: "German", flag: "🇩🇪" },
  { value: "it", label: "Italian", flag: "🇮🇹" },
  { value: "pt", label: "Portuguese", flag: "🇧🇷" },
  { value: "zh", label: "Chinese", flag: "🇨🇳" },
  { value: "ja", label: "Japanese", flag: "🇯🇵" },
  { value: "ko", label: "Korean", flag: "🇰🇷" },
  { value: "ar", label: "Arabic", flag: "🇸🇦" },
  { value: "hi", label: "Hindi", flag: "🇮🇳" },
  { value: "ru", label: "Russian", flag: "🇷🇺" },
  { value: "nl", label: "Dutch", flag: "🇳🇱" },
];

// Friendly display name for a Whisper language code. Whisper can DETECT ~100
// languages — far more than the picker offers — so resolve names through
// Intl.DisplayNames first (built-in, covers them all), then the picker labels,
// then the bare code. Exported: the modal's processing checklist also shows
// "Detected: French" from this.
export const languageDisplayLabel = (code) => {
  if (!code || code === "auto") return "Auto-detected"; // safety net — the engine returns a real code
  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(code);
    if (name && name !== code) return name;
  } catch {
    /* unknown/invalid tag — fall through to the picker labels */
  }
  return TRANSCRIBE_LANGUAGES.find((l) => l.value === code)?.label || code.toUpperCase();
};

// Transcript-format value → label for the result's meta row.
const FORMAT_LABELS = {
  plain: "Plain text",
  punctuated: "Punctuated",
  paragraphs: "Paragraphs",
  timestamped: "Timestamped",
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared pieces for the video tools
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Which engine does the work — named for the OUTCOME, not for the provider.
 *
 * ⚠️ THE KEY IS `engine`, AND IT MUST NOT BE `model`. StudioComposer merges its
 * own app-wide model preference into the values at submit — `{ ...values, model,
 * variations }` — so an option keyed `model` is overwritten on the way out with
 * no warning anywhere, and the picker would look like it worked. `engine` also
 * reads better beside that preference: one is about this run, the other is about
 * the user.
 *
 * ⚠️ NO PROVIDER NAMES, DELIBERATELY. The obvious version of this row is a list
 * of the models behind it, and it is the wrong one twice over: the names date
 * within weeks (the reference's own marketing page and its live workspace
 * already disagree on which models it runs), and "which vendor" is not a
 * question a user can answer — "how should this look" is. The mapping from these
 * three to whatever is actually running lives on the backend, where swapping a
 * model is a config change rather than a UI release.
 */
const ENGINE_OPTION = {
  key: "engine",
  label: "Motion engine",
  panel: "list",
  width: 320,
  default: "fast",
  items: [
    {
      value: "fast",
      label: "Fast",
      desc: "Quick, lively motion for the feed",
      icon: Zap,
    },
    {
      value: "cinematic",
      label: "Cinematic",
      desc: "High fidelity, steadier subject",
      icon: Film,
    },
    {
      value: "creative",
      label: "Creative",
      desc: "Looser and more inventive",
      icon: Sparkles,
    },
  ],
};

/**
 * How much movement to put in the clip.
 *
 * ⚠️ THREE NAMED STEPS RATHER THAN A SLIDER, and that is a constraint rather
 * than a preference: there is no slider panel kind (see OptionPanelBody), and
 * inventing a 0–100 scale would put a number on the wire that nothing on either
 * side has agreed the meaning of. Named steps say what they do and map cleanly
 * to whatever range the provider turns out to want.
 */
const MOTION_OPTION = {
  key: "motion",
  label: "Motion",
  panel: "list",
  width: 320,
  default: "balanced",
  items: [
    {
      value: "subtle",
      label: "Subtle",
      desc: "Small, believable movement",
      icon: Waves,
    },
    {
      value: "balanced",
      label: "Balanced",
      desc: "Recommended",
      icon: Gauge,
    },
    {
      value: "dynamic",
      label: "Dynamic",
      desc: "Bigger camera and subject motion",
      icon: Wind,
    },
  ],
};

/** Every resolution any video tool offers, keyed by value. */
const RESOLUTION_ITEMS = {
  "480p": {
    value: "480p",
    label: "480p",
    desc: "Fastest",
    icon: Frame,
  },
  "720p": {
    value: "720p",
    label: "720p",
    desc: "Recommended",
    icon: MonitorPlay,
  },
  "1080p": {
    value: "1080p",
    label: "1080p",
    desc: "Sharpest",
    icon: Expand,
  },
  "2k": {
    value: "2k",
    label: "2K",
    desc: "Maximum detail",
    icon: Maximize2,
  },
};

/**
 * A resolution row for one tool.
 *
 * A FACTORY rather than a shared constant because the tools genuinely differ on
 * both the range and the default — a generator tops out where an upscaler
 * starts — while the CARDS must stay identical, or "1080p" would wear a
 * different glyph and a different description depending on which tool you opened
 * it from. Same reasoning as OPTION_ICONS being keyed centrally in the composer.
 *
 * @param {string[]} values Which resolutions this tool offers, in display order.
 * @param {string} fallback The one selected on an untouched composer.
 */
const resolutionOption = (values, fallback) => ({
  key: "resolution",
  label: "Resolution",
  panel: "list",
  width: 320,
  default: fallback,
  items: values.map((value) => RESOLUTION_ITEMS[value]),
});

/**
 * How long a generated clip runs, in seconds.
 *
 * ⚠️ ONE CONSTANT FOR ALL THREE VIDEO TOOLS, and the history is why. Text to
 * Video, Image to Video and Video Effects each carried their own list, and they
 * disagreed — 5/10 on two of them, 3/5/8/10 on the third — so the same setting
 * offered different answers depending on which tool you opened it from. Sharing
 * it means the accepted range is stated once and cannot drift again.
 *
 * ⚠️ THE RANGE IS THE PROVIDER'S, NOT A UI CHOICE. These lists were once
 * narrowed to the literals '5' and '10' because the model behind them
 * (fal-ai/kling-video) rejected everything else with "Input should be '5' or
 * '10'" — a failure that only surfaced once the job had been queued and come
 * back, so it read as "the tool is broken" rather than as an invalid option. The
 * backend now accepts any whole number of seconds from 1 to 30, which is what
 * this slider offers. If a model is ever swapped in behind `startGeneration`
 * that narrows it again, change `min`/`max` HERE and all three tools follow.
 *
 * A slider rather than a list for the same reason the variations control is one:
 * thirty entries is a menu you have to scroll to answer a question you already
 * know the answer to. See the `slider` panel in OptionPanelBody.
 */
const VIDEO_DURATION_OPTION = {
  key: "duration",
  label: "Duration",
  panel: "slider",
  // Matches the variations panel, which is the control this one is modelled on.
  width: 260,
  min: 1,
  max: 30,
  step: 1,
  unit: "s",
  // A string, like every other option value here — it rides into the payload
  // untouched, and the provider has always been given these as strings.
  default: "5",
  hint: (seconds) =>
    seconds <= 5
      ? "Quick to render"
      : seconds <= 10
        ? "Short form"
        : "Longer clips take longer to render",
};

/** Whether the clip comes back with audio. */
const SOUND_OPTION = {
  key: "sound",
  label: "Sound",
  panel: "list",
  width: 300,
  default: "off",
  items: [
    {
      value: "off",
      label: "Silent",
      desc: "Video only",
      icon: VolumeX,
    },
    {
      value: "on",
      label: "With sound",
      desc: "Generate matching audio",
      icon: Volume2,
    },
  ],
};

/**
 * The narration voices, shared by Script to Voiceover and Digital Human.
 *
 * ⚠️ SHARED ITEMS, PER-TOOL ROW. The VALUES are a contract with the backend and
 * must be identical everywhere — "Warm female" cannot mean two different voices
 * depending on which tool you picked it in — but the row's label differs by
 * tool ("Voiceover style" over a script, "Voice" over an avatar), so each config
 * declares its own row around this one list. Same split CORE_STYLES already
 * uses.
 */
const VOICE_ITEMS = [
  { value: "male_deep", label: "Deep male", desc: "Rich & authoritative", icon: Mic },
  { value: "male_neutral", label: "Neutral male", desc: "Clear & professional", icon: User },
  { value: "female_warm", label: "Warm female", desc: "Friendly & engaging", icon: Heart },
  { value: "female_pro", label: "Pro female", desc: "Polished & confident", icon: Mic },
  { value: "energetic", label: "Energetic", desc: "Upbeat & exciting", icon: Zap },
  { value: "calm", label: "Calm & soothing", desc: "Relaxed & meditative", icon: Leaf },
  { value: "dramatic", label: "Dramatic", desc: "Powerful & intense", icon: Flame },
  { value: "neutral_ai", label: "Neutral AI", desc: "Clean synthetic voice", icon: Cpu },
];

/** The voice an untouched composer starts on. */
const DEFAULT_VOICE = "neutral_ai";

/**
 * The languages the digital human speaks.
 *
 * Eight, in the order the reference publishes them. Deliberately NOT
 * TRANSCRIBE_LANGUAGES: that list is Whisper's, it leads with "Auto Detect" —
 * which is meaningless when you are the one supplying the script — and the two
 * would drift the moment either engine's support changed.
 */
const SPEAKING_LANGUAGES = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "zh", label: "Chinese", flag: "🇨🇳" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "pt", label: "Portuguese", flag: "🇧🇷" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "de", label: "German", flag: "🇩🇪" },
  { value: "ja", label: "Japanese", flag: "🇯🇵" },
  { value: "ko", label: "Korean", flag: "🇰🇷" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Per-category configs
// ─────────────────────────────────────────────────────────────────────────────

export const MAGIC_STUDIO_CONFIGS = {
  // ── TEXT → IMAGE ───────────────────────────────────────────────────────────
  text_to_image: {
    id: "text_to_image",
    title: "Text to Image",
    subtitle: "Turn a written prompt into on-brand images.",
    Icon: FileImage,
    color: "bg-blue-100 text-blue-600",
    input: "prompt",
    resultType: "image",
    generateLabel: "Generate images",
    // Offers the composer's "3x" chip, and `generate` sends the number as
    // `variations` in the payload — ONE request, the backend fans out.
    //
    // ✅ CONFIRMED AGAINST THE API (probed 2026-08-15). The field is accepted
    // and echoed back on the record as `meta.variations`, alongside
    // `meta.requested_count` / `meta.completed_count`. This note used to warn
    // that the name had only been guessed; it hasn't been a guess since.
    //
    // ⚠️ ALL N COME BACK IN ONE RECORD — `meta.outputs: [{ key, url }]`, with
    // the record's own `url` holding just the first of them. Reading that single
    // field is what made a 4x run show one image; see extractItems.
    //
    // ⚠️ ON-DEVICE TOOLS MUST NOT SET THIS. Audio to Text and Text to Audio
    // never reach the endpoint, and three runs of a deterministic local model
    // return the same answer three times.
    variations: true,
    /**
     * Puts the Brand chip on the composer — the brand's name, which this tool
     * REQUIRES, and optionally a logo picked out of the media picker. They reach
     * the payload as `brand_name` and `logo_url`; see {@link brandFields}.
     */
    brand: true,
    /**
     * ⚠️ NO MODEL MENU ON THIS TOOL. Which model paints the image is the
     * backend's choice here — the payload it validates has no field for one, so
     * the chip was a control with nothing on the other end of it: picking
     * "Opus 5" before generating changed nothing and quietly implied it had.
     * The preference itself is app-wide and untouched (the home composer still
     * shows and stores it); this only stops drawing it where it is a lie.
     */
    model: false,
    // Backend `tool` enum for server-side generation history (matches the value
    // `generate` sends). Present only on backend tools — the on-device tools
    // (audio_to_text, text_to_audio) persist nothing and have no history.
    historyTool: "text_to_image",
    sample: {
      before:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
      after:
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80",
      headline: "Describe it — we'll create it",
      subtext:
        "Write a prompt, pick a style, and generate on-brand images in seconds.",
    },
    inputConfig: {
      label: "Text prompt",
      placeholder:
        "Describe the image you want to create… be specific about subject, setting, lighting, and mood.",
      maxLength: 500,
      inspire: [
        "A futuristic city at sunset with neon lights reflecting on wet streets",
        "A cozy coffee shop corner with warm lighting and rainy windows",
        "An elegant product shot of a luxury watch on dark marble",
        "A minimalist workspace with plants and golden hour light streaming in",
        "An abstract cosmic explosion of color and light in deep space",
        "A serene mountain lake at dawn with mist rolling over the water",
      ],
    },
    options: [
      // Purpose leads: it frames every choice after it — an ad and a feed post
      // want different styles and different crops.
      PURPOSE_OPTION,
      {
        key: "style",
        label: "Visual style",
        panel: "cards",
        width: 380,
        default: "photorealistic",
        items: IMAGE_STYLES,
      },
      COLOR_OPTION,
      {
        key: "ratio",
        label: "Aspect ratio",
        panel: "ratios",
        width: 380,
        default: "square",
        items: [RATIO_SQUARE, RATIO_LANDSCAPE, RATIO_PORTRAIT, RATIO_WIDE],
      },
    ],
    /**
     * ⚠️ THE BRAND NAME IS AS REQUIRED AS THE PROMPT. The endpoint wants both on
     * every run — the words describing the image AND who it is for — so a run
     * with an untouched Brand chip is stopped here rather than being sent to
     * earn a 422. The logo is the optional half of that chip and is not checked.
     */
    validate: ({ input, values }) => {
      if (!input?.trim()) return "Please enter a prompt.";
      if (!values?.brandName?.trim()) return "Please enter a brand name.";
      return null;
    },
    generate: async ({ input, values }) => {
      const payload = {
        // ⚠️ `tool` IS THE PURPOSE, not the literal "text_to_image". The backend
        // routes this generation by the design type the user picked, so the two
        // fields carry the same value ("ad-design" / "social-design" /
        // "image-design") and move together — see PURPOSE_OPTION.
        //
        // ⚠️ THIS NO LONGER MATCHES `historyTool` BELOW. That one still says
        // "text_to_image" and is what getMagicHistory filters on, both for the
        // History panel and for the post-generate watcher that finds the new
        // record. They agree only if the backend keeps filing these under
        // text_to_image regardless of what `tool` says here.
        tool: values.purpose,
        visual_style: values.style,
        ratio: ratioString(values.ratio),
        purpose: values.purpose,
        // How many to make in one request — the composer's "3x".
        variations: values.variations,
        // Absent unless a colour was actually picked — see COLOR_OPTION.
        ...colorField(values.color),
        // The brand this is for, and its mark where one was picked. `brand_name`
        // is required and guaranteed present by `validate`; `logo_url` is absent
        // unless a logo was chosen — see brandFields.
        ...brandFields(values.brandName, values.brandLogo),
        prompt: input.trim(),
      };
      // May answer with the finished images or with a job to wait on — the
      // backend decides, and startGeneration reports which. See its ⚠️.
      return startGeneration(payload, "image");
    },
  },

  // ── TEXT → VIDEO ───────────────────────────────────────────────────────────
  text_to_video: {
    id: "text_to_video",
    title: "Text to Video",
    subtitle: "Generate short-form video from a text prompt.",
    Icon: Video,
    color: "bg-purple-100 text-purple-600",
    input: "prompt",
    resultType: "video",
    generateLabel: "Generate videos",
    historyTool: "text_to_video",
    // See the ⚠️ on text_to_image.
    //
    // ⚠️ THE ONE TO WATCH. A video is minutes of compute and real money per
    // clip, so 4x here is four times a bill that is already the largest in the
    // section. It is also the tool whose polling assumes ONE job: the response
    // yields a single `jobId` (extractVideoJobId), so if the backend answers a
    // multi-variation request with several jobs, only the first is followed and
    // the rest land silently in history whenever they finish.
    variations: true,
    sample: {
      before:
        "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&q=80",
      after:
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80",
      headline: "From a sentence to a scene",
      subtext:
        "Describe the motion, pick a duration and format — generate short-form video.",
    },
    inputConfig: {
      label: "Video prompt",
      placeholder:
        "Describe the video scene… include subject, movement, lighting, setting, and camera motion.",
      maxLength: 500,
      inspire: [
        "A luxury car driving on coastal road at sunset with cinematic motion",
        "A chef cooking in cozy kitchen with warm cinematic lighting",
        "Peaceful timelapse of stars over snowy mountains",
        "A rocket launching into space with dramatic slow-motion flames",
        "Brand product reveal with elegant lighting and smooth camera movement",
      ],
    },
    options: [
      PURPOSE_OPTION,
      {
        key: "style",
        label: "Visual style",
        panel: "cards",
        width: 380,
        default: "photorealistic",
        // ⚠️ THIS WAS `IMAGE_STYLES.slice(0, 8)` — an index range standing in
        // for "the eight that suit motion". It survived only as long as nothing
        // was added to the front of that list; the moment the backend's nine
        // went in ahead of it, the same expression silently pointed at a
        // completely different eight and cut two of the nine off this tool.
        // Named exclusions can't drift like that: vintage and neon are the two
        // this picker leaves out, and they stay left out however the list grows.
        items: [
          ...CORE_STYLES,
          ...LEGACY_IMAGE_STYLES.filter(
            (style) => !["vintage", "neon"].includes(style.value),
          ),
        ],
      },
      VIDEO_DURATION_OPTION,
      {
        key: "ratio",
        label: "Aspect ratio",
        panel: "ratios",
        width: 380,
        default: "landscape",
        items: [RATIO_SQUARE, RATIO_LANDSCAPE, RATIO_PORTRAIT],
      },
    ],
    validate: ({ input }) => (input?.trim() ? null : "Please enter a prompt."),
    generate: async ({ input, values }) => {
      const payload = {
        tool: "text_to_video",
        visual_style: values.style,
        ratio: ratioString(values.ratio),
        duration: values.duration,
        purpose: values.purpose,
        variations: values.variations,
        prompt: input.trim(),
      };
      // Async on the backend → returns a finished result or a { pending, jobId }
      // descriptor to poll on.
      return startGeneration(payload, "video");
    },
  },

  // ── IMAGE → VARIATIONS ───────────────────────────────────────────────────────
  image_to_variations: {
    id: "image_to_variations",
    title: "Image to Variations",
    subtitle: "Spin one image into fresh styled variations.",
    Icon: Layers,
    color: "bg-cyan-100 text-cyan-600",
    input: "image",
    resultType: "image",
    generateLabel: "Generate variations",
    // See the ⚠️ on text_to_image. Several takes on one source image is what
    // this tool is FOR, so it is the clearest case for the chip.
    variations: true,
    // Takes an optional description alongside the source image — see
    // descriptionField. A style card can say "watercolour"; only words can say
    // which parts of THIS picture to hold on to.
    describable: true,
    historyTool: "image_to_variations",
    sample: {
      before:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
      after:
        "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80",
      headline: "One image, many directions",
      subtext:
        "Pick a source image and a style — get a fresh set of on-brand variations.",
    },
    inputConfig: {
      label: "Source image",
      helper: "Choose an image from your library, the web, or upload one.",
      // The optional description box (`describable` above). Shorter cap than a
      // prompt tool's 500: this is a note ABOUT a picture that already exists,
      // not the description of one that doesn't.
      placeholder:
        "Optional — what should change, and what should stay? e.g. keep the product exactly as it is, make the background a warm studio grey",
      maxLength: 300,
    },
    options: [
      {
        key: "style",
        label: "Visual style",
        panel: "cards",
        width: 380,
        // ⚠️ THE DEFAULT MOVED to a backend-named style. It was "Vintage Sepia",
        // which is a strong look to put on every untouched run of a tool whose
        // job is "give me this picture again, slightly different".
        default: "photorealistic",
        // ⚠️ TWO NAMING CONVENTIONS, DELIBERATELY. The nine come from the
        // backend and are hyphenated; everything after them is this tool's own
        // older title-case set, kept so no style anyone uses disappears. Its
        // "Cinematic" and "Minimalist" are gone from the tail — not removed, but
        // now served by CORE_STYLES' `cinematic` and `minimal`, which mean the
        // same thing in the spelling the backend recognises.
        items: [
          ...CORE_STYLES,
          {
            value: "Vintage Sepia",
            label: "Vintage Sepia",
            desc: "Warm retro tone",
            icon: Aperture,
            img: px(1183434),
          },
          {
            value: "Futuristic Cyberpunk",
            label: "Cyberpunk",
            desc: "Neon futuristic",
            icon: Cpu,
            img: px(2311602),
          },
          {
            value: "Watercolor Painting",
            label: "Watercolor",
            desc: "Soft washes",
            icon: Droplet,
            img: px(1053687),
          },
          {
            value: "Pixel Art",
            label: "Pixel Art",
            desc: "Retro pixels",
            icon: Grid3x3,
            img: px(1293269),
          },
          {
            value: "Oil Painting",
            label: "Oil Painting",
            desc: "Rich texture",
            icon: Palette,
            img: px(1585325),
          },
          {
            value: "Sketch Drawing",
            label: "Sketch",
            desc: "Hand-drawn",
            icon: Pencil,
            img: px(1109541),
          },
          {
            value: "Cartoon Style",
            label: "Cartoon",
            desc: "Bold & playful",
            icon: Smile,
            img: px(207983),
          },
          {
            value: "Abstract Art",
            label: "Abstract",
            desc: "Shapes & color",
            icon: Shapes,
            img: px(1616403),
          },
        ],
      },
      COLOR_OPTION,
    ],
    validate: ({ input }) =>
      input ? null : "Please pick a source image first.",
    generate: async ({ input, values }) => {
      const payload = {
        tool: "image_to_variations",
        visual_style: values.style,
        variations: values.variations,
        // Absent unless a colour was actually picked — see COLOR_OPTION.
        ...colorField(values.color),
        // Absent unless something was typed — see descriptionField.
        ...descriptionField(values.description),
        image_url: input,
      };
      // Several takes on one image is what this tool is FOR, so it is the one
      // most likely to be waited on rather than answered outright — a 2x run
      // measured at ~106s against the live API. startGeneration reports which of
      // the two happened; useMagicGenerate keeps the wait on screen either way.
      return startGeneration(payload, "image");
    },
  },

  // ── SCRIPT → VOICEOVER → VIDEO ───────────────────────────────────────────────
  script_to_voiceover: {
    id: "script_to_voiceover",
    title: "Script to Voiceover",
    subtitle: "Turn a script into a narrated video.",
    Icon: Mic,
    color: "bg-emerald-100 text-emerald-600",
    input: "script",
    resultType: "video",
    generateLabel: "Generate video",
    historyTool: "script_to_voiceover",
    // See the ⚠️ on text_to_image, and the cost/polling warning on
    // text_to_video — this tool renders video too and shares both.
    variations: true,
    sample: {
      before:
        "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80",
      after:
        "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80",
      headline: "Turn a script into a narrated video",
      subtext:
        "Write your script, choose a voice and tone — we assemble matching footage.",
    },
    inputConfig: {
      label: "Script",
      placeholder:
        "Enter your script here… e.g. 'Welcome to our product launch, where innovation meets possibility…'",
      maxLength: 2000,
      showReadTime: true,
      inspire: [
        "Welcome to our product launch event, where innovation meets possibility. Today, we're unveiling something that will change the way you work forever.",
        "Imagine a world where your brand speaks directly to the heart of every customer. That world starts here, with a single story told the right way.",
        "The future of marketing isn't louder — it's smarter. Join thousands of brands already using AI to connect with their audience on a deeper level.",
      ],
    },
    options: [
      PURPOSE_OPTION,
      {
        key: "voice",
        label: "Voiceover style",
        panel: "list",
        width: 340,
        // Shared with Digital Human — see VOICE_ITEMS. The list moved out of
        // this row rather than being copied into the second tool, so a voice
        // added here can't end up offered on one tool and missing on the other.
        default: DEFAULT_VOICE,
        items: VOICE_ITEMS,
      },
      {
        key: "tone",
        label: "Narration tone",
        panel: "list",
        width: 320,
        default: "Conversational",
        items: [
          {
            value: "Conversational",
            label: "Conversational",
            desc: "Natural & relaxed",
            icon: MessageCircle,
          },
          {
            value: "Formal",
            label: "Formal",
            desc: "Structured & precise",
            icon: Landmark,
          },
          {
            value: "Inspirational",
            label: "Inspirational",
            desc: "Uplifting & bold",
            icon: Sparkles,
          },
          {
            value: "Urgent",
            label: "Urgent",
            desc: "Fast & compelling",
            icon: AlarmClock,
          },
          {
            value: "Storytelling",
            label: "Storytelling",
            desc: "Narrative flow",
            icon: BookOpen,
          },
          {
            value: "Informative",
            label: "Informative",
            desc: "Clear & factual",
            icon: Info,
          },
          {
            value: "Humorous",
            label: "Humorous",
            desc: "Light & witty",
            icon: Laugh,
          },
          {
            value: "Empathetic",
            label: "Empathetic",
            desc: "Warm & caring",
            icon: Heart,
          },
        ],
      },
      {
        key: "pace",
        label: "Speaking pace",
        panel: "slider",
        width: 300,
        /**
         * ⚠️ THE STEP IS THE POINT HERE, and it is coarser than Text to Audio's
         * on purpose. That tool sends a float and can honour any value in its
         * range; this one sends a NAME — `speaking_pace: "normal"` — so the four
         * stops are the four words the backend knows, and 0.25 is what makes the
         * thumb land on exactly those. A finer step would let someone choose
         * 1.1× and quietly send "normal", which is a control that lies about its
         * own precision.
         *
         * It is still a slider rather than the four cards it was: one drag
         * across the whole range beats reading four descriptions to answer "how
         * fast", and {@link paceName} is what turns the number back into the
         * word on the way out.
         */
        min: 0.75,
        max: 1.5,
        step: 0.25,
        unit: "×",
        default: "1",
        hint: speedWord,
      },
      {
        key: "ratio",
        label: "Aspect ratio",
        panel: "ratios",
        width: 380,
        default: "landscape",
        items: [RATIO_SQUARE, RATIO_LANDSCAPE, RATIO_PORTRAIT],
      },
      {
        key: "format",
        label: "Export format",
        panel: "pills",
        width: 300,
        default: "mp4",
        items: [
          { value: "mp4", label: "MP4" },
          { value: "mkv", label: "MKV" },
          { value: "webm", label: "WebM" },
          { value: "mov", label: "MOV" },
        ],
      },
    ],
    validate: ({ input }) =>
      input?.trim() ? null : "Please enter a script first.",
    generate: async ({ input, values }) => {
      const payload = {
        tool: "script_to_voiceover",
        visual_style: values.voice,
        narration_tone: values.tone,
        // The slider's number → the word this endpoint takes — see paceName.
        speaking_pace: paceName(values.pace),
        ratio: ratioString(values.ratio),
        export_format: values.format,
        purpose: values.purpose,
        variations: values.variations,
        prompt: input.trim(),
      };
      // Async on the backend → returns a finished result or a { pending, jobId }
      // descriptor to poll on.
      return startGeneration(payload, "video");
    },
  },

  // ── AUDIO → TEXT ─────────────────────────────────────────────────────────────
  audio_to_text: {
    id: "audio_to_text",
    title: "Audio to Text",
    subtitle: "Transcribe speech into clean text — on-device, private & free.",
    Icon: AudioLines,
    color: "bg-amber-100 text-amber-600",
    input: "audio",
    resultType: "text",
    generateLabel: "Transcribe audio",
    // ⚠️ `onDevice` AND `historyTool` MUST AGREE WITH AUDIO_ENGINE, or the run
    // is never watched: useMagicGenerate takes its no-polling path when
    // `onDevice` is true OR `historyTool` is missing, and a backend job that
    // answers "processing" would then be reported as returning nothing.
    onDevice: !usesBackend("audio_to_text"),
    engine: "stt", // which on-device engine the modal wires into `generate`
    historyTool: usesBackend("audio_to_text") ? "audio_to_text" : undefined,
    sample: {
      before:
        "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80",
      after:
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80",
      headline: "Accurate transcripts in a click",
      subtext:
        "Pick audio from your gallery or record it, choose a language and format — get clean, ready-to-use text, transcribed on your device.",
    },
    inputConfig: {
      label: "Audio",
      // The gallery is the source of truth: audio is picked from (or uploaded
      // into) the user's gallery via the media picker — no direct device upload.
      helper:
        "Pick from your gallery — or upload to it right there · MP3 · WAV · OGG · M4A · WEBM · up to 100 MB",
    },
    // Backend transcription takes `language` and nothing else — the transcript
    // format and quality rows are on-device features. See onlyOptions.
    options: onlyOptions(
      [
      {
        key: "language",
        label: "Language",
        panel: "flags",
        width: 340,
        default: "auto",
        items: TRANSCRIBE_LANGUAGES,
      },
      {
        key: "format",
        label: "Transcript format",
        panel: "list",
        width: 320,
        default: "punctuated",
        items: [
          {
            value: "plain",
            label: "Plain Text",
            desc: "Raw transcript only",
            icon: FileText,
          },
          {
            value: "punctuated",
            label: "Punctuated",
            desc: "Auto-add punctuation",
            icon: FileText,
          },
          {
            value: "paragraphs",
            label: "Paragraphs",
            desc: "Split into paragraphs",
            icon: FileText,
          },
          {
            value: "timestamped",
            label: "Timestamped",
            desc: "Include time markers",
            icon: Clock,
          },
        ],
      },
      {
        key: "quality",
        label: "Transcription quality",
        panel: "list",
        width: 320,
        default: "balanced",
        items: [
          { value: "fast", label: "Fast", desc: "Quick turnaround", icon: Zap },
          {
            value: "balanced",
            label: "Balanced",
            desc: "Speed + accuracy",
            icon: Gauge,
          },
          {
            value: "accurate",
            label: "Accurate",
            desc: "Maximum precision",
            icon: Sparkles,
          },
        ],
      },
      ],
      usesBackend("audio_to_text")
        ? ["language"]
        : ["language", "format", "quality"],
    ),
    validate: ({ input }) => (input ? null : "Please upload or record some audio."),
    generate: async ({ input, values, stt }) => {
      // ── Backend ────────────────────────────────────────────────────────────
      // ⚠️ MULTIPART, AND THE FILE FIELD IS `audio` — not `file`, which is what
      // the endpoint would ignore. `language` is omitted entirely for "auto" so
      // the backend runs its own detection rather than being told to transcribe
      // a language literally named "auto".
      //
      // ⚠️ NO TIMED SEGMENTS COME BACK, so the SRT/VTT downloads have nothing
      // to build from on this path. Whisper produced them locally; if the
      // backend starts returning them, wire them into `segments` below.
      if (usesBackend("audio_to_text")) {
        // ⚠️ audioForUpload, NOT the raw File — a picked file with no `type`
        // goes up as application/octet-stream and comes back 415. See its note.
        const file = audioForUpload(input);
        const form = new FormData();
        form.append("tool", "audio_to_text");
        form.append("audio", file, file.name);
        if (values.language && values.language !== "auto") {
          form.append("language", values.language);
        }
        return startGeneration(form, "text");
      }

      // ── On-device ──────────────────────────────────────────────────────────
      // The modal's Whisper engine (useSpeechToText), reporting real progress
      // (decode → engine download → language detect → transcribe → format) plus
      // a live transcript preview while decoding. Nothing is uploaded.
      const result = await stt.transcribe(input, {
        language: values.language,
        format: values.format,
        quality: values.quality,
      });
      // The engine already toasted the failure — throw quietly so the modal
      // doesn't show a second "nothing came back" toast.
      if (!result) throw new Error("Transcription failed — please try again.");
      const text = (result.text || "").trim();
      if (!text) throw new Error("No speech was detected in that audio.");
      return {
        resultType: "text",
        text,
        meta: {
          words: result.words,
          durationSec: result.durationSec,
          // Real language now — "French · auto-detected" vs "French" (user-picked).
          languageLabel: result.detected
            ? `${languageDisplayLabel(result.language)} · auto-detected`
            : languageDisplayLabel(result.language),
          formatLabel: FORMAT_LABELS[values.format] || FORMAT_LABELS.punctuated,
          segments: result.segments || [], // timed segments → SRT/VTT downloads
          sourceName: input?.name || "", // "movie.mp3" → "movie.srt" filenames
        },
      };
    },
  },

  // ── PERSONA-BASED GENERATOR ──────────────────────────────────────────────────
  persona_generator: {
    id: "persona_generator",
    title: "Persona Generator",
    subtitle: "Create content tuned to a target persona.",
    Icon: User,
    color: "bg-pink-100 text-pink-600",
    input: "persona",
    resultType: "auto", // resolved from the chosen content type at generate time
    generateLabel: "Generate content",
    historyTool: "persona_generator",
    // See the ⚠️ on text_to_image. Several drafts in one persona's voice is a
    // natural ask — this tool writes copy, and the first take is rarely the one.
    variations: true,
    // Takes an optional description alongside the four persona fields — see
    // descriptionField. Who you are talking to is only half a brief; the four
    // fields have no room for what you are talking to them ABOUT.
    describable: true,
    sample: {
      before:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
      after:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
      headline: "Content tuned to a persona",
      subtext:
        "Define who you're speaking to, and generate content shaped to fit them.",
    },
    inputConfig: {
      // The optional description box (`describable` above).
      //
      // ⚠️ `inspire` BELOW IS NOT FOR THIS BOX. It holds worked PERSONAS —
      // objects, not sentences — and it seeds the four fields. The composer's
      // description box deliberately has no "inspire me" affordance for exactly
      // that reason; wiring one up here would drop `[object Object]` into it.
      placeholder:
        "Optional — what is this content about? e.g. launching a free trial for our scheduling app",
      maxLength: 300,
      inspire: [
        {
          name: "Amara Osei",
          occupation: "Marketing Manager",
          tone: "Friendly",
        },
        {
          name: "Raj Patel",
          occupation: "Software Engineer",
          tone: "Professional",
        },
        {
          name: "Sofia Reyes",
          occupation: "Creative Director",
          tone: "Inspirational",
        },
        {
          name: "James Whitfield",
          occupation: "Sales Executive",
          tone: "Bold",
        },
        { name: "Yuki Tanaka", occupation: "Product Manager", tone: "Casual" },
      ],
      occupations: [
        "Marketing Manager",
        "Software Engineer",
        "Entrepreneur",
        "Sales Executive",
        "Creative Director",
        "Product Manager",
        "HR Specialist",
        "Financial Analyst",
        "Teacher",
        "Consultant",
      ],
      ageGroups: [
        { value: "18-24", label: "18–24", desc: "Gen Z" },
        { value: "25-34", label: "25–34", desc: "Millennial" },
        { value: "35-44", label: "35–44", desc: "Gen X" },
        { value: "45-54", label: "45–54", desc: "Boomer+" },
        { value: "55+", label: "55+", desc: "Senior" },
      ],
      tones: [
        { value: "Professional", icon: Briefcase },
        { value: "Friendly", icon: Smile },
        { value: "Authoritative", icon: Crown },
        { value: "Casual", icon: Leaf },
        { value: "Inspirational", icon: Sparkles },
        { value: "Empathetic", icon: Heart },
        { value: "Bold", icon: Flame },
        { value: "Witty", icon: Laugh },
        { value: "Formal", icon: Landmark },
        { value: "Conversational", icon: MessageCircle },
      ],
    },
    options: [
      {
        key: "contentType",
        label: "Content type",
        panel: "list",
        width: 300,
        default: "image",
        items: [
          {
            value: "text",
            label: "Text",
            desc: "Copy & captions",
            icon: FileText,
          },
          {
            value: "image",
            label: "Image",
            desc: "Visual content",
            icon: FileImage,
          },
          {
            value: "video",
            label: "Video",
            desc: "Motion content",
            icon: Film,
          },
        ],
      },
      {
        key: "ratio",
        label: "Aspect ratio",
        panel: "ratios",
        width: 380,
        default: "square",
        items: [RATIO_SQUARE, RATIO_LANDSCAPE, RATIO_PORTRAIT],
      },
    ],
    validate: ({ values }) => {
      if (!values.personaName?.trim()) return "Please enter a persona name.";
      if (!values.personaAge?.trim()) return "Please select or enter an age.";
      if (!values.personaOccupation?.trim())
        return "Please enter an occupation.";
      if (!values.personaTone) return "Please select a tone.";
      return null;
    },
    generate: async ({ values }) => {
      const {
        personaName,
        personaAge,
        personaOccupation,
        personaTone,
        contentType,
        ratio,
      } = values;
      const payload = {
        tool: "persona_generator",
        name: personaName?.trim(),
        age: personaAge?.trim(),
        occupation: personaOccupation?.trim(),
        communication_tone: [personaTone],
        content_type: contentType,
        ratio: ratioString(ratio),
        variations: values.variations,
        // Absent unless something was typed — see descriptionField.
        ...descriptionField(values.description),
      };
      // The chosen content type decides how the canvas renders the result — and
      // it has to be settled BEFORE the request, because a run that comes back
      // as a job to wait on is normalized later, off the status response, with
      // nothing left to say what was asked for.
      const resultType =
        contentType === "text"
          ? "text"
          : contentType === "video"
            ? "video"
            : "image";
      return startGeneration(payload, resultType);
    },
  },

  // ── TEXT → AUDIO (fully ON-DEVICE — Kokoro-82M in a Web Worker) ─────────────
  // Unlike the other categories this never calls the backend: speech is
  // synthesized locally by the AI engine (see src/(lib)/ai-engine). The modal
  // passes its `tts` engine (useTextToSpeech) into `generate`, which reports
  // real progress (engine download → voice → synthesis → polish).
  text_to_audio: {
    id: "text_to_audio",
    title: "Text to Audio",
    subtitle: "Convert text into natural speech — on-device, private & free.",
    Icon: Music,
    color: "bg-indigo-100 text-indigo-600",
    input: "text",
    resultType: "audio",
    generateLabel: "Generate audio",
    // ⚠️ MUST AGREE WITH AUDIO_ENGINE — see the note on audio_to_text above.
    // On the backend path this is a normal server job like any other tool's; on
    // the on-device path it is the one tool that is BOTH on-device and historied,
    // the audio being made locally and then uploaded by recordTextToAudio so the
    // stored file is the one the user actually heard.
    onDevice: !usesBackend("text_to_audio"),
    engine: "tts", // which on-device engine `generate` wires into
    historyTool: "text_to_audio",
    sample: {
      before:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
      after:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
      headline: "Give your words a voice",
      subtext:
        "Pick one of 28 lifelike voices, set speed, format and quality — speech is generated on your device, private and unlimited.",
    },
    inputConfig: {
      label: "Text to convert",
      placeholder:
        "Type or paste the text you want to convert to audio… scripts, announcements, narrations, and more.",
      maxLength: 2000,
      inspire: [
        "Welcome to our product launch event. Today we're thrilled to introduce something that will change the way you work forever.",
        "In a world where every second counts, precision and speed are not just advantages — they are necessities.",
        "Thank you for joining us on this journey. Your support means everything to our team and our mission.",
        "Attention shoppers! For this weekend only, enjoy up to fifty percent off on all premium items storewide.",
      ],
    },
    // Backend speech takes `voice` + `speaking_speed` only — the export-format
    // and quality rows are on-device features. See onlyOptions.
    options: onlyOptions(
      [
      {
        key: "voice",
        label: "Voice",
        panel: "voices",
        width: 360,
        // ⚠️ THE CARDS FOLLOW THE ENGINE — see AUDIO_ENGINE. Kokoro and Aura-2
        // share no voice names, so a fixed set of cards would mean clicking
        // "Bella" and hearing Aura-2's Luna. Both the list and the default swap
        // together; swapping only one leaves the composer holding an id the
        // other engine has never heard of.
        default: defaultVoiceFor("text_to_audio", "af_heart"), // best-graded Kokoro voice
        items: voiceItemsFor("text_to_audio", KOKORO_VOICE_ITEMS),
      },
      {
        key: "speed",
        label: "Speaking speed",
        panel: "slider",
        width: 300,
        /**
         * ⚠️ THE RANGE IS WHAT THE BACKEND HAS BEEN SHOWN TO ACCEPT, NOT WHAT
         * THE FIELD PROBABLY TAKES. Three values have ever been sent — 0.75, 1
         * and 1.25, the old Slow/Normal/Fast cards — so those are the bounds
         * this slider fills in between. Anything outside them is a guess that
         * would only fail after a paid generation, which is exactly how the
         * video duration list came to offer five durations the provider
         * rejected (see text_to_video's `duration`).
         *
         * Widen it the moment the API's real bounds are confirmed — the step is
         * already fine-grained, so 0.5–2.0 is a two-number edit here and nothing
         * downstream cares.
         */
        min: 0.75,
        max: 1.25,
        step: 0.05,
        unit: "×",
        default: "1",
        hint: speedWord,
      },
      {
        key: "format",
        label: "Export format",
        panel: "list",
        width: 300,
        default: "mp3",
        items: [
          {
            value: "mp3",
            label: "MP3",
            desc: "Best compatibility",
            icon: Music,
          },
          {
            value: "wav",
            label: "WAV",
            desc: "Lossless quality",
            icon: AudioLines,
          },
        ],
      },
      {
        key: "quality",
        label: "Audio quality",
        panel: "list",
        width: 320,
        default: "high",
        items: [
          {
            value: "standard",
            label: "Standard",
            desc: "Raw output — fastest",
            icon: Zap,
          },
          {
            value: "high",
            label: "High",
            desc: "Normalized, click-free joins",
            icon: Gauge,
          },
          {
            value: "studio",
            label: "Studio",
            desc: "Loudness-tuned, fades, max bitrate",
            icon: Sparkles,
          },
        ],
      },
      ],
      usesBackend("text_to_audio")
        ? ["voice", "speed"]
        : ["voice", "speed", "format", "quality"],
    ),
    validate: ({ input }) => {
      if (!input?.trim()) return "Please enter some text to convert.";
      if (input.trim().length > 2000)
        return "Text is limited to 2000 characters.";
      return null;
    },
    generate: async ({ input, values, tts }) => {
      const text = input.trim();
      // The slider's number (or a legacy word) → the float the API takes.
      const speed = speakingSpeed(values.speed);

      // ── Backend ────────────────────────────────────────────────────────────
      // ⚠️ FIELDS AT THE TOP LEVEL, NOT UNDER `options` — this tool's payload is
      // flat, unlike the website tools'. And `voice` is an Aura-2 name, which is
      // why the picker offers Aura's voices rather than Kokoro's.
      if (usesBackend("text_to_audio")) {
        return startGeneration(
          {
            tool: "text_to_audio",
            prompt: text,
            voice: backendVoiceId(values.voice),
            speaking_speed: speed,
          },
          "audio",
        );
      }

      // ── On-device ──────────────────────────────────────────────────────────
      // Kokoro-82M in a Web Worker. The only path that honours `format` and
      // `quality`; the backend takes neither.
      const item = await tts.generate(text, {
        voice: values.voice,
        speed,
        format: values.format,
        quality: values.quality,
      });
      // The engine already toasted the failure — throw quietly so the modal
      // doesn't show a second "nothing came back" toast.
      if (!item)
        throw new Error("Speech generation failed — please try again.");

      // Made in the browser, so nothing reached the server as a side effect of
      // generating — this hands the finished file over to be kept. The backend
      // path needs no equivalent: it made the audio and already has it.
      recordTextToAudio(text, values, item);

      return {
        resultType: "audio",
        assets: [
          {
            id: `tts-${Date.now()}`,
            type: "audio",
            src: item.url,
            preview: item.url,
            blob: item.blob,
            duration: item.duration,
            format: item.format,
            voiceLabel: voiceLabelFor("text_to_audio", values.voice),
            alt: text.slice(0, 80),
          },
        ],
      };
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // The video tools
  // ═══════════════════════════════════════════════════════════════════════════
  // Five tools that either make a clip from a still or act on a clip you already
  // have. They follow the same contract as everything above — options as data, a
  // whitelisted payload, startGeneration + polling — and add two flags the older
  // tools had no use for:
  //
  //   requiresPrompt  the composer's secondary textarea is MANDATORY, not a
  //                   note. It joins the submit button's enabled test rather
  //                   than only being caught by validate() after the run fires.
  //   promptFrom      picking this option WRITES its words into that textarea.
  //
  // ⚠️ NO `sample` BLOCK ON ANY OF THESE. The older configs carry one; nothing
  // reads it any more (it fed the deleted MagicStudioModal), so adding ten more
  // image URLs that never render would be noise. The live empty-state copy is
  // `emptyHint` on the MAGIC_TOOLS entry.

  // ── IMAGE → VIDEO ──────────────────────────────────────────────────────────
  image_to_video: {
    id: "image_to_video",
    title: "Image to Video",
    subtitle: "Bring a still image to life as a short clip.",
    Icon: ImagePlay,
    color: "bg-violet-100 text-violet-600",
    input: "image",
    resultType: "video",
    generateLabel: "Generate video",
    historyTool: "image_to_video",
    // Words alongside the picture, and genuinely optional — a still already
    // carries enough for a model to infer plausible movement. See promptField.
    describable: true,
    // ⚠️ NO `variations`. See the ⚠️ on text_to_video: a video is minutes of
    // compute and real money per clip, and the poll follows ONE job — a
    // multi-variation request would leave every clip after the first to land
    // silently in history whenever it finished.
    inputConfig: {
      label: "Source image",
      helper: "Choose an image from your library, the web, or upload one.",
      placeholder:
        "Optional — describe the motion. e.g. the camera pushes in slowly while steam rises and the light shifts across the surface",
      maxLength: 500,
    },
    options: [
      ENGINE_OPTION,
      MOTION_OPTION,
      VIDEO_DURATION_OPTION,
      {
        key: "ratio",
        label: "Aspect ratio",
        panel: "ratios",
        width: 380,
        default: "landscape",
        items: [RATIO_SQUARE, RATIO_LANDSCAPE, RATIO_PORTRAIT],
      },
      resolutionOption(["480p", "720p", "1080p"], "720p"),
      SOUND_OPTION,
    ],
    validate: ({ input }) =>
      input ? null : "Please pick a source image first.",
    generate: async ({ input, values }) => {
      const payload = {
        tool: "image_to_video",
        // The same field name image_to_variations uses for a hosted source
        // image, so the backend has one convention for "the picture this run
        // starts from" rather than one per tool.
        image_url: input,
        engine: values.engine,
        motion: values.motion,
        duration: values.duration,
        ratio: ratioString(values.ratio),
        resolution: values.resolution,
        // Both absent while untouched — see promptField / soundField.
        ...promptField(values.description),
        ...soundField(values.sound),
      };
      return startGeneration(payload, "video");
    },
  },

  // ── DIGITAL HUMAN ──────────────────────────────────────────────────────────
  digital_human: {
    id: "digital_human",
    title: "Digital Human Video",
    subtitle: "Make a portrait speak your script.",
    Icon: Speech,
    color: "bg-teal-100 text-teal-600",
    input: "image",
    resultType: "video",
    generateLabel: "Generate video",
    historyTool: "digital_human",
    // ⚠️ THE SPEECH IS AN UPLOADED RECORDING, NOT A TYPED SCRIPT. The portrait
    // is lip-synced to a real voice track the user supplies, which is why this
    // tool declares a SECOND, required input (see `extraInput`) — no other tool
    // here takes two pieces of media.
    //
    // What that decides, downstream:
    //   • no `voice` and no `language` option. Both described a synthesised
    //     read that no longer happens: the recording carries its own voice and
    //     its own language, and a picker claiming to change either would be a
    //     control with no wire to anything. (The tool used to type a script and
    //     have the backend speak it; that is what those two were for.)
    //   • the prompt box is DESCRIBABLE, not required. It is direction for the
    //     performance — "warm, smiling, slight nod" — never the words being
    //     said, so a run with the box left alone is perfectly valid.
    describable: true,
    /**
     * The second input: the voice track this portrait speaks.
     *
     * ⚠️ IT COMES FROM THE GALLERY, LIKE EVERY OTHER MEDIA INPUT HERE — picked
     * (or uploaded) through the media picker and sent as a hosted `audio_url`,
     * NOT posted as a file on the generate request. That keeps one convention
     * for "media this run starts from" across the whole app, lets a voice track
     * be reused across runs and retries without re-uploading, and means the
     * user's own Text to Audio output is usable here the moment it is saved.
     *
     * The composer hands the chosen URL back on `values.audioUrl`.
     */
    extraInput: {
      kind: "audio",
      required: true,
      label: "Voice track",
      helper: "Pick the voice this portrait should speak from your gallery.",
      // Shown where the user has no audio yet — Text to Audio makes one and
      // saves it straight to the gallery, which is where this reads from.
      emptyHint: "No voice track yet? Generate one with Text to Audio.",
    },
    inputConfig: {
      label: "Portrait",
      helper: "Choose a portrait from your library, the web, or upload one.",
      placeholder:
        "Optional — how should they deliver it? e.g. warm and smiling, with a slight nod",
      maxLength: 600,
    },
    options: [resolutionOption(["480p", "720p", "1080p"], "720p")],
    validate: ({ input, values }) => {
      if (!input) return "Please pick a portrait first.";
      if (!values.audioUrl) return "Please add the voice track to lip-sync to.";
      return null;
    },
    generate: async ({ input, values }) => {
      const payload = {
        tool: "digital_human",
        image_url: input,
        // ⚠️ `audio_url`, matching `image_url` / `video_url` — one name for
        // "hosted media this run starts from", whichever tool is asking.
        audio_url: values.audioUrl,
        resolution: values.resolution,
      };
      // Direction for the performance, and genuinely optional — omitted rather
      // than sent empty, so the backend can tell "no direction given" from "an
      // empty brief".
      const direction = values.description?.trim();
      if (direction) payload.prompt = direction;
      return startGeneration(payload, "video");
    },
  },

  // ── VIDEO BACKGROUND REMOVER ───────────────────────────────────────────────
  video_background_remover: {
    id: "video_background_remover",
    title: "Video Background Remover",
    subtitle: "Cut the background out of a clip — no green screen needed.",
    Icon: Eraser,
    color: "bg-rose-100 text-rose-600",
    input: "video",
    resultType: "video",
    generateLabel: "Remove background",
    historyTool: "video_background_remover",
    inputConfig: {
      label: "Source video",
      // ⚠️ THE CAP IS STATED BECAUSE IT IS LOW. 50 MB is the gallery's own limit
      // for video (FILE_LIMITS in utils/helpers.js — it mirrors the backend's
      // rule), and it is roughly 40 seconds of 1080p. Someone who has to trim a
      // clip should learn that here rather than from a rejected upload.
      helper:
        "Pick a video from your gallery — or upload to it right there · MP4 · MOV · WEBM · MKV · M4V · AVI · up to 50 MB",
    },
    options: [
      {
        key: "background",
        label: "Background",
        panel: "colors",
        width: 300,
        // Transparent. The panel draws AUTO_COLOR as an empty slashed swatch,
        // which is exactly what "no background" should look like — see
        // backgroundValue for why this sentinel is sent rather than omitted.
        default: AUTO_COLOR,
        items: [
          { value: AUTO_COLOR, label: "Transparent" },
          // The two chroma keys come first among the real colours: they are the
          // reason a flat MP4 is useful at all to an editor that can only key,
          // which is the case the reference calls out by name.
          { value: "#00b140", label: "Green screen" },
          { value: "#0047bb", label: "Blue screen" },
          { value: "#ffffff", label: "White" },
          { value: "#111827", label: "Near-black" },
          { value: "#f8fafc", label: "Off-white" },
          { value: "#2563eb", label: "Blue" },
          { value: "#ef4444", label: "Red" },
        ],
      },
    ],
    validate: ({ input }) =>
      input ? null : "Please pick a video to work on.",
    generate: async ({ input, values }) => {
      const payload = {
        tool: "video_background_remover",
        video_url: input,
        background: backgroundValue(values.background),
        // Derived from the background rather than chosen — alpha needs a
        // container MP4 doesn't have. See formatForBackground.
        format: formatForBackground(values.background),
      };
      return startGeneration(payload, "video");
    },
  },

  // ── VIDEO ENHANCER ─────────────────────────────────────────────────────────
  video_enhancer: {
    id: "video_enhancer",
    title: "Video Enhancer",
    subtitle: "Upscale and clean up a clip.",
    Icon: Maximize2,
    color: "bg-orange-100 text-orange-600",
    input: "video",
    resultType: "video",
    generateLabel: "Enhance video",
    historyTool: "video_enhancer",
    inputConfig: {
      label: "Source video",
      helper:
        "Pick a video from your gallery — or upload to it right there · MP4 · MOV · WEBM · MKV · M4V · AVI · up to 50 MB",
    },
    // ⚠️ ONE OPTION, AND THE SHORT LIST IS THE POINT. Denoising, sharpening,
    // deinterlacing, frame-rate interpolation and stabilisation all happen here
    // — they are simply not choices. The reference advertises every one of them
    // in prose and exposes a resolution toggle and nothing else, because the
    // model decides what a given clip needs. Adding toggles for them would put
    // five controls on screen that the engine does not read, which is the exact
    // thing onlyOptions() exists further up this file to prevent.
    options: [resolutionOption(["1080p", "2k"], "1080p")],
    validate: ({ input }) =>
      input ? null : "Please pick a video to enhance.",
    generate: async ({ input, values }) => {
      const payload = {
        tool: "video_enhancer",
        video_url: input,
        resolution: values.resolution,
      };
      return startGeneration(payload, "video");
    },
  },

  // ── VIDEO EFFECTS ──────────────────────────────────────────────────────────
  video_effects: {
    id: "video_effects",
    title: "Video Effects",
    subtitle: "Apply a ready-made motion effect to an image.",
    Icon: WandSparkles,
    color: "bg-fuchsia-100 text-fuchsia-600",
    input: "image",
    resultType: "video",
    generateLabel: "Apply effect",
    historyTool: "video_effects",
    // ⚠️ REQUIRED, BUT RARELY TYPED. Applying any template but "Write your own"
    // fills the box for you (see promptFrom), so in practice this gate only
    // stops an empty run on the custom card. It still has to be a gate: the
    // template IS the prompt, and an empty one is a tool with nothing to do.
    requiresPrompt: true,
    /**
     * Applying a template writes its words into the composer's textarea.
     *
     * ⚠️ THIS IS WHY A TEMPLATE IS EDITABLE rather than a black box. The
     * catalogue's prompt lands in the box as a starting point and the user
     * changes whatever they like before generating — which also means what runs
     * is always exactly what they can see, with no hidden second half.
     */
    promptFrom: {
      option: "template",
      resolve: effectPrompt,
    },
    /**
     * …and selects the still that prompt was written for.
     *
     * ⚠️ THE PAIR IS THE WHOLE POINT. A template's clip is what that prompt did
     * to that exact frame; seeding only the words would leave a first-time user
     * pressing Generate against someone else's brief and their own unrelated
     * photo, and blaming the tool for the result. Selecting both means Generate
     * reproduces what the card just showed them — and swapping in their own
     * picture afterwards is one click.
     *
     * "Write your own" resolves to "" and leaves the current image alone; it
     * must never clear a picture the user has already chosen.
     */
    imageFrom: {
      option: "template",
      resolve: effectImage,
    },
    inputConfig: {
      label: "Source image",
      helper: "Choose an image from your library, the web, or upload one.",
      placeholder:
        "Use a template above to fill this in — or describe the motion yourself.",
      // Roomier than the other prompt tools': the catalogue's own prompts run to
      // ~450 characters, and this box has to hold one with room to edit it.
      maxLength: 800,
    },
    options: [
      {
        key: "template",
        label: "Template",
        panel: "templates",
        // Three cards to a row, each showing a 16:9 clip — the width is what
        // that costs. ToolbarChip clamps it to the viewport on small screens,
        // where the grid drops to two columns on its own.
        width: 720,
        default: CUSTOM_EFFECT,
        items: VIDEO_EFFECT_TEMPLATES,
        // Drives the headings inside the panel; the catalog owns the order.
        categoryOrder: TEMPLATE_CATEGORY_ORDER,
      },
      VIDEO_DURATION_OPTION,
    ],
    validate: ({ input, values }) => {
      if (!input) return "Please pick a source image first.";
      if (!values.description?.trim())
        return "Pick an effect, or describe the motion you want.";
      return null;
    },
    generate: async ({ input, values }) => {
      const payload = {
        tool: "video_effects",
        image_url: input,
        // ⚠️ THE WORDS, NEVER A TEMPLATE ID. The whole template travels inside
        // `prompt` — the convention Product Video settled on for the same
        // reason: an id means the server holds a second copy of every look, and
        // it stops describing what ran the moment anyone edits the box. See
        // videoEffectTemplates.js.
        prompt: values.description.trim(),
        duration: values.duration,
      };
      return startGeneration(payload, "video");
    },
  },
};

export const getMagicConfig = (id) => MAGIC_STUDIO_CONFIGS[id] || null;
