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
} from "lucide-react";

import { generateMagicStudio, resolveMediaUrl } from "@/(lib)/magic-studio-api";
import { KOKORO_TTS } from "@/(lib)/ai-engine/models";

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

// ── Async video jobs ─────────────────────────────────────────────────────────
// Video tools (text_to_video, script_to_voiceover) are asynchronous on the
// backend: the generate call returns a job id + "processing" status instead of a
// finished URL, and the modal polls checkVideoGenerationStatus until it reports
// "completed". These helpers keep the (field-name-tolerant) response handling in
// one place so both video tools and the modal agree on the shape.

// Statuses that mean the job is done / permanently failed. Anything else while a
// job exists is treated as still "processing".
const VIDEO_DONE_STATES = [
  "completed",
  "complete",
  "done",
  "success",
  "succeeded",
  "ready",
  "finished",
];
const VIDEO_FAILED_STATES = [
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
export function extractVideoJobId(data) {
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

/** Normalize a status/final response into the modal's render shape. */
export function normalizeVideoResult(data) {
  return normalizeMagicResponse(data, "video");
}

/**
 * Classify a status response → "completed" | "processing" | "failed".
 * Trusts an explicit `status` field; otherwise infers from whether a usable
 * video URL is present yet.
 */
export function getVideoStatus(data) {
  const root = unwrapGeneration(data);
  const s = String(root?.status ?? data?.data?.status ?? "")
    .toLowerCase()
    .trim();
  if (s) {
    if (VIDEO_DONE_STATES.includes(s)) return "completed";
    if (VIDEO_FAILED_STATES.includes(s)) return "failed";
    return "processing";
  }
  return normalizeMagicResponse(data, "video").assets.length > 0
    ? "completed"
    : "processing";
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
export function getVideoError(data) {
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
 * Turn a provider's validation dump into one readable line.
 *
 *   fal.ai queue result error (fal-ai/kling-video): {"detail":[{"type":
 *   "literal_error","loc":["body","duration"],"msg":"Input should be '5' or
 *   '10'","input":"3", …}]}
 *     → duration: Input should be '5' or '10'
 *
 * Best-effort by design: anything it doesn't recognise comes back untouched, so
 * a change in the provider's error shape costs detail, never the message. The
 * raw string is logged at the call site either way.
 */
function readableProviderError(raw) {
  const start = raw.indexOf("{");
  if (start === -1) return raw;
  try {
    const detail = JSON.parse(raw.slice(start))?.detail;
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
 * Kick off an async video generation. POSTs the payload, then either returns a
 * finished result (fast path, if a URL already came back) or a pending
 * descriptor { pending, jobId } for the modal to poll on. Shared by both video
 * tools so the async contract lives in exactly one spot.
 */
async function startVideoGeneration(payload) {
  const data = await generateMagicStudio(payload);
  const immediate = normalizeMagicResponse(data, "video");
  if (immediate.assets.length > 0) return immediate; // already finished
  return {
    resultType: "video",
    pending: true,
    jobId: extractVideoJobId(data),
    raw: data,
  };
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
 * ⚠️ NOT IN ANY PAYLOAD YET. Each `generate` below builds an explicit,
 * whitelisted body, so `values.purpose` rides along and is simply not read —
 * deliberately, because posting a field the API hasn't declared is how you earn
 * a 422. Sending it is one line per config once the backend names the field.
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
  default: "general",
  items: [
    {
      value: "ads",
      label: "Ads",
      desc: "Built to sell — a clear offer and a reason to click",
      icon: Megaphone,
    },
    {
      value: "social",
      label: "Social",
      desc: "Built for the feed — native, scrollable, shareable",
      icon: Share2,
    },
    {
      value: "general",
      label: "General",
      desc: "No particular channel in mind",
      icon: Sparkles,
    },
  ],
};

// ── Visual-style cards (shared between Text-to-Image / Text-to-Video) ─────────
const IMAGE_STYLES = [
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
    value: "minimalist",
    label: "Minimalist",
    desc: "Clean & simple",
    icon: Minus,
    img: px(1103970),
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

// ── Text-to-Audio voice cards (real Kokoro-82M voices, from the AI engine) ───
// The on-device model ships 28 English voices; the "voices" panel groups them
// by accent + gender with a gender icon per row. `top` marks the best-graded
// voices (A/B on the Kokoro voice card) with a ★ badge.
const KOKORO_VOICE_ITEMS = KOKORO_TTS.voices.map((v) => ({
  value: v.id,
  label: v.name,
  desc: `${v.accent} · ${v.gender}`,
  icon: v.gender === "male" ? Mars : Venus,
  gender: v.gender,
  group: `${v.accent} ${v.gender} voices`,
  top: /^[AB]/.test(v.grade),
}));

// UI speed value → the multiplier the speech engine actually applies.
const SPEAKING_SPEED = { slow: 0.75, normal: 1, fast: 1.25 };

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
      {
        key: "ratio",
        label: "Aspect ratio",
        panel: "ratios",
        width: 380,
        default: "square",
        items: [RATIO_SQUARE, RATIO_LANDSCAPE, RATIO_PORTRAIT, RATIO_WIDE],
      },
    ],
    validate: ({ input }) => (input?.trim() ? null : "Please enter a prompt."),
    generate: async ({ input, values }) => {
      const payload = {
        tool: "text_to_image",
        visual_style: values.style,
        ratio: ratioString(values.ratio),
        prompt: input.trim(),
      };
      const data = await generateMagicStudio(payload);
      return normalizeMagicResponse(data, "image");
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
        items: IMAGE_STYLES.slice(0, 8),
      },
      {
        key: "duration",
        label: "Duration",
        panel: "list",
        width: 320,
        // ⚠️ FIVE AND TEN ARE THE ONLY VALUES THE PROVIDER ACCEPTS. The video
        // model behind this tool (fal-ai/kling-video) validates `duration`
        // against the literals '5' and '10' and rejects the request outright
        // otherwise:
        //
        //   Input should be '5' or '10'
        //
        // This list used to offer 1, 2, 3, 15 and 30 as well, and DEFAULT TO 3 —
        // so five of the seven choices failed and the default was one of them.
        // The failure only surfaces once the job has been queued and come back,
        // which is why it read as "text to video is broken" rather than as an
        // invalid option.
        //
        // Do not add durations here to widen the menu. The provider's contract
        // is what decides this list; if a different model is swapped in behind
        // `startVideoGeneration`, change these to match ITS accepted values.
        default: "5",
        items: [
          { value: "5", label: "5 seconds", desc: "Short clip", icon: Clock },
          { value: "10", label: "10 seconds", desc: "Short form", icon: Clock },
        ],
      },
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
        prompt: input.trim(),
      };
      // Async on the backend → returns a finished result or a { pending, jobId }
      // descriptor the modal polls on.
      return startVideoGeneration(payload);
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
    },
    options: [
      {
        key: "style",
        label: "Visual style",
        panel: "cards",
        width: 380,
        default: "Vintage Sepia",
        items: [
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
          {
            value: "Cinematic",
            label: "Cinematic",
            desc: "Film-grade",
            icon: Film,
            img: px(2873486),
          },
          {
            value: "Minimalist",
            label: "Minimalist",
            desc: "Clean & simple",
            icon: Minus,
            img: px(1103970),
          },
        ],
      },
    ],
    validate: ({ input }) =>
      input ? null : "Please pick a source image first.",
    generate: async ({ input, values }) => {
      const payload = {
        tool: "image_to_variations",
        visual_style: values.style,
        image_url: input,
      };
      const data = await generateMagicStudio(payload);
      return normalizeMagicResponse(data, "image");
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
        default: "neutral_ai",
        items: [
          {
            value: "male_deep",
            label: "Deep male",
            desc: "Rich & authoritative",
            icon: Mic,
          },
          {
            value: "male_neutral",
            label: "Neutral male",
            desc: "Clear & professional",
            icon: User,
          },
          {
            value: "female_warm",
            label: "Warm female",
            desc: "Friendly & engaging",
            icon: Heart,
          },
          {
            value: "female_pro",
            label: "Pro female",
            desc: "Polished & confident",
            icon: Mic,
          },
          {
            value: "energetic",
            label: "Energetic",
            desc: "Upbeat & exciting",
            icon: Zap,
          },
          {
            value: "calm",
            label: "Calm & soothing",
            desc: "Relaxed & meditative",
            icon: Leaf,
          },
          {
            value: "dramatic",
            label: "Dramatic",
            desc: "Powerful & intense",
            icon: Flame,
          },
          {
            value: "neutral_ai",
            label: "Neutral AI",
            desc: "Clean synthetic voice",
            icon: Cpu,
          },
        ],
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
        panel: "list",
        width: 320,
        default: "normal",
        items: [
          {
            value: "slow",
            label: "Slow",
            desc: "0.75× — contemplative",
            icon: Gauge,
          },
          {
            value: "normal",
            label: "Normal",
            desc: "1× — balanced",
            icon: Gauge,
          },
          {
            value: "fast",
            label: "Fast",
            desc: "1.25× — energetic",
            icon: Gauge,
          },
          {
            value: "rapid",
            label: "Rapid",
            desc: "1.5× — punchy",
            icon: Gauge,
          },
        ],
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
        speaking_pace: values.pace,
        ratio: ratioString(values.ratio),
        export_format: values.format,
        prompt: input.trim(),
      };
      // Async on the backend → returns a finished result or a { pending, jobId }
      // descriptor the modal polls on.
      return startVideoGeneration(payload);
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
    onDevice: true, // modal shows the real-progress processing state
    engine: "stt", // which on-device engine the modal wires into `generate`
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
    options: [
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
    validate: ({ input }) => (input ? null : "Please upload or record some audio."),
    generate: async ({ input, values, stt }) => {
      // Fully on-device — the modal passes its Whisper engine (useSpeechToText),
      // which reports real progress (decode → engine download → language detect
      // → transcribe → format) plus a live transcript preview while decoding.
      // Nothing is uploaded.
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
      };
      const data = await generateMagicStudio(payload);
      // The chosen content type decides how the right canvas renders the result.
      const resultType =
        contentType === "text"
          ? "text"
          : contentType === "video"
            ? "video"
            : "image";
      return normalizeMagicResponse(data, resultType);
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
    onDevice: true, // modal shows the real-progress processing state
    engine: "tts", // which on-device engine the modal wires into `generate`
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
    options: [
      {
        key: "voice",
        label: "Voice",
        panel: "voices",
        width: 360,
        default: "af_heart", // best-graded Kokoro voice
        items: KOKORO_VOICE_ITEMS,
      },
      {
        key: "speed",
        label: "Speaking speed",
        panel: "list",
        width: 300,
        default: "normal",
        items: [
          { value: "slow", label: "Slow", desc: "0.75× speed", icon: Gauge },
          { value: "normal", label: "Normal", desc: "1.0× speed", icon: Gauge },
          { value: "fast", label: "Fast", desc: "1.25× speed", icon: Gauge },
        ],
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
    validate: ({ input }) => {
      if (!input?.trim()) return "Please enter some text to convert.";
      if (input.trim().length > 2000)
        return "Text is limited to 2000 characters.";
      return null;
    },
    generate: async ({ input, values, tts }) => {
      const item = await tts.generate(input.trim(), {
        voice: values.voice,
        speed: SPEAKING_SPEED[values.speed] ?? 1,
        format: values.format,
        quality: values.quality,
      });
      // The engine already toasted the failure — throw quietly so the modal
      // doesn't show a second "nothing came back" toast.
      if (!item)
        throw new Error("Speech generation failed — please try again.");
      const voice = KOKORO_TTS.voices.find((v) => v.id === values.voice);
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
            voiceLabel: voice?.label || "Kokoro voice",
            alt: input.trim().slice(0, 80),
          },
        ],
      };
    },
  },
};

export const getMagicConfig = (id) => MAGIC_STUDIO_CONFIGS[id] || null;
