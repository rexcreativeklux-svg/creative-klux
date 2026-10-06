// app/(dashboard)/(pages)/studio/ai-chat-page/magicDesign.js
// ─────────────────────────────────────────────────────────────────────────────
// Magic Designs: what to call when the chat's create reply says
// `design_mode: "Magic-Designs"`, and how to show what comes back.
//
// THE BACKEND DECIDES THE MODE; this file only maps it onto an endpoint. Studio
// Designs keep going through Scraive + redesign (untouched). Magic Designs go
// to Magic Studio's own tools — the same configs the /magic-studio page uses,
// called through useMagicGenerate, with nothing in Magic Studio changed:
//
//   medium "video"                      → Text to Video
//   brand_details.creative_type "ads"   → Ads Design
//   brand_details.creative_type "social"→ Social Design
//   anything else ("designer", …)       → Stock Image
//
// Probed against the live API (2026-10-06):
//   · the create reply carries the prompt Magic Studio needs, ready-written, in
//     `generation_prompts[0]`, plus size, variations, duration and brand fields;
//   · /magic-studio/generate can outlive Cloudflare's 120s window and answer 524
//     while the run still completes — useMagicGenerate watches history for
//     exactly that, which is why it is used rather than awaiting the request;
//   · an image comes back as a CDN URL (1024×1024 for a 1:1 request).

import api from "@/app/api/axios";
import { getGenerationError } from "@/app/(dashboard)/(pages)/magic-studio/magicStudioConfigs";

/** Same base the Magic Studio client calls (magic-studio-api.js). */
const API_BASE = "https://api.creativeklux.com/api/creativeklux-userend";

/** Is this create reply a Magic Design? */
export const isMagicDesign = (data) =>
  String(data?.design_mode || "").toLowerCase().startsWith("magic") ||
  String(data?.brand_details?.designMode || "").toLowerCase() === "magic";

/** Magic Studio tool ids this file can route to. */
export const MAGIC_TOOLS = ["ad-design", "social-design", "image-design", "text_to_video"];

const PURPOSE_BY_CREATIVE_TYPE = {
  ads: "ad-design",
  social: "social-design",
  designer: "image-design",
};

/** ads / social / designer → the matching design purpose (Stock Image otherwise). */
const purposeFor = (data) =>
  PURPOSE_BY_CREATIVE_TYPE[String(data?.brand_details?.creative_type || "").toLowerCase()] ||
  "image-design";

/** Video or image — the reply says so twice; either is enough. */
export const isVideo = (data) =>
  String(data?.medium || data?.brand_details?.medium || "").toLowerCase() === "video";

/** Which Magic Studio tool builds this reply. */
export const magicToolFor = (data) => (isVideo(data) ? "text_to_video" : purposeFor(data));

/**
 * Magic Studio's ratio choices. Text to Video offers no Ultra Wide, so it is
 * left out of the search for video.
 */
const RATIOS = [
  { value: "square", w: 1, h: 1 },
  { value: "landscape", w: 16, h: 9 },
  { value: "portrait", w: 9, h: 16 },
  { value: "wide", w: 21, h: 9, imageOnly: true },
];

/** "1200x630" → { width, height }, or null. */
const parseSize = (size) => {
  const m = String(size || "").match(/(\d+)\s*[x×]\s*(\d+)/i);
  return m && +m[1] > 0 && +m[2] > 0 ? { width: +m[1], height: +m[2] } : null;
};

/** The offered ratio closest to a size (compared on the log scale). */
const nearestRatio = (size, video) => {
  const parsed = parseSize(size);
  if (!parsed) return video ? "portrait" : "square";
  const target = Math.log(parsed.width / parsed.height);
  const dist = (r) => Math.abs(Math.log(r.w / r.h) - target);
  return RATIOS.filter((r) => !(video && r.imageOnly)).reduce((a, b) => (dist(b) < dist(a) ? b : a))
    .value;
};

/**
 * Every Magic prompt is kept within 500 characters. Text to Video rejects
 * anything longer (422, "The prompt field must not be greater than 500
 * characters"), and the backend's prompts run 630–1,200 — so all of them are
 * cut, images included, rather than relying on the image tools' looser limit.
 */
const PROMPT_MAX = 500;

/** Cut to `max` at the last full sentence, else the last whole word. */
function fitPrompt(text, max) {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const sentence = head.search(/[.!?](?=[^.!?]*$)/);
  const cut =
    sentence > max * 0.5
      ? head.slice(0, sentence + 1).trim()
      : head.slice(0, head.lastIndexOf(" ")).trim();
  // A cut inside a quoted headline ("…a season of love.) leaves the quote
  // open — close it, keeping the result within `max`.
  const open = (cut.match(/“/g) || []).length > (cut.match(/”/g) || []).length;
  return open ? `${cut.slice(0, max - 1)}”` : cut;
}

/** The prompt the backend wrote for this run, else the brief. */
export function magicPromptFrom(data) {
  const details = data?.brand_details || {};
  const prompts = [data?.generation_prompts, details.generation_prompts].find(Array.isArray) || [];
  const prompt = (prompts.find((p) => typeof p === "string" && p.trim()) || details.description || "").trim();
  return fitPrompt(prompt, PROMPT_MAX);
}

/**
 * The video provider (fal.ai kling-video) takes a duration of "5" or "10" and
 * nothing else — a "15" the chat collected failed the run in 37s ("Input
 * should be '5' or '10'"). The reply's seconds snap to the nearer of the two.
 */
const videoDuration = (seconds) =>
  Number.isFinite(seconds) && seconds > 7 ? "10" : "5";

/**
 * The composer values the Magic Studio configs read — the same keys the
 * /magic-studio composer fills in. Unused keys are ignored by each config:
 * Text to Video reads style/ratio/duration/purpose/variations, the design
 * tools read style/ratio/variations/color/brand and fix their own purpose.
 */
export function magicValuesFrom(data, brand) {
  const details = data?.brand_details || {};
  const video = isVideo(data);
  const count = Number.parseInt(data?.variations ?? details.variations, 10);
  const seconds = Number.parseInt(data?.duration ?? details.duration, 10);

  return {
    // The reply's visualStyle ("Elegant", "Modern") isn't one of Magic Studio's
    // styles, so the tools' own default is used.
    style: "photorealistic",
    ratio: nearestRatio(data?.size || details.size || details.type_size, video),
    variations: Number.isFinite(count) && count > 0 ? count : 1,
    duration: videoDuration(seconds),
    purpose: purposeFor(data),
    // "auto" is the composer's "no preference", which the config leaves out.
    color: /^#[0-9a-f]{3,8}$/i.test(details.brandColor || "") ? details.brandColor : "auto",
    brandName: details.brandName || brand?.name || brand?.brand_name || "",
    brandLogo: details.logo || brand?.logo || "",
  };
}

/**
 * A provider error, in words a user can act on.
 *
 * The record's `error` is the provider's raw text — e.g.
 *   fal.ai queue result error (fal-ai/kling-video): {"detail":[{"loc":["body",
 *   "duration"],"msg":"Input should be '5' or '10'", …}]}
 * — so the vendor prefix goes, and a validation `detail` becomes
 * "Duration: Input should be '5' or '10'". getGenerationError has already
 * swapped the account-level ones (exhausted balance) for a neutral message.
 */
export function readableMagicError(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  if (/timed out|timeout/i.test(text)) {
    return "The generator took too long and gave up. Please try again.";
  }

  const json = text.slice(text.indexOf("{"));
  if (json.startsWith("{")) {
    try {
      const { detail } = JSON.parse(json);
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail) && detail.length) {
        return detail
          .map((d) => {
            const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : "";
            const label = field ? `${String(field)[0].toUpperCase()}${String(field).slice(1)}: ` : "";
            return `${label}${d?.msg || "invalid value"}`;
          })
          .join("; ");
      }
    } catch {
      /* not JSON — fall through to the text without its vendor prefix */
    }
  }
  return text.replace(/^[^:]*\([^)]*\):\s*/, "");
}

/**
 * Why a Magic run produced nothing, from its own history record.
 *
 * The generate hook toasts a failure but keeps the reason to itself, and the
 * Magic Studio client's history helper drops failed records — so the raw list
 * is read here and the newest record this run could have created (started no
 * earlier than `startedAt`, with slack for clock skew) is inspected.
 *
 * @returns {Promise<{status: "failed"|"pending"|"none", message: string}>}
 *   "none" when no record was made — the request itself was refused, and the
 *   Magic Studio client has already toasted the server's own message for that.
 */
export async function findRunOutcome(tool, startedAt) {
  try {
    const { data } = await api.post(`${API_BASE}/magic-studio/history`, { tool });
    const list = Array.isArray(data) ? data : data?.data || [];
    const run = list
      .filter((r) => Date.parse(r?.created_at || "") >= startedAt - 15000)
      .sort((a, b) => Number(b.id) - Number(a.id))[0];

    if (!run) return { status: "none", message: "" };
    const status = String(run.status || "").toLowerCase();
    if (status === "failed") {
      return {
        status: "failed",
        message: readableMagicError(getGenerationError(run)) || "The generator reported a failure.",
      };
    }
    return { status: "pending", message: "" };
  } catch (err) {
    console.warn("⚠️ [chat] couldn't read the Magic run's outcome:", err?.message);
    return { status: "none", message: "" };
  }
}

/** Natural size of an image URL, or null. */
function imageSize(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve(img.naturalWidth ? { width: img.naturalWidth, height: img.naturalHeight } : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * A video's size and one still frame from it (as a JPEG data URL).
 *
 * The still is what makes a saved video a usable design: saveDesign paints the
 * thumbnail from the elements, and canvas can't paint a <video> element — so
 * the frame sits under the video and is what the lists and the PNG export show.
 * The CDN answers `Access-Control-Allow-Origin: *`, which is what lets the frame
 * be read back off a canvas; if that ever fails, `poster` is null and the
 * design is saved without one.
 *
 * @returns {Promise<{width: number, height: number, poster: string|null}|null>}
 */
function videoStill(src) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "auto";
    let size = null;
    const done = (poster) => {
      clearTimeout(timer);
      resolve(size ? { ...size, poster } : null);
    };
    // A slow CDN mustn't hold the results back — give up on the still, not the video.
    const timer = setTimeout(() => done(null), 15000);

    video.onloadedmetadata = () => {
      size = video.videoWidth ? { width: video.videoWidth, height: video.videoHeight } : null;
      // A beat in, past any fade from black.
      video.currentTime = Math.min(1, (video.duration || 2) / 2);
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        done(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        done(null); // tainted canvas — no CORS header this time
      }
    };
    video.onerror = () => done(null);
    video.src = src;
  });
}

/** Size to fall back on when the media's own size can't be read. */
const RATIO_SIZE = {
  square: { width: 1024, height: 1024 },
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1920 },
  wide: { width: 2520, height: 1080 },
};

/**
 * One Magic Studio result as a design, shown exactly as returned — a canvas
 * the media's own size, so it previews, saves (through the normal design save)
 * and opens in the editor like any other design.
 *
 *   image → the picture as the only element.
 *   video → a still frame (image) with the video on top. The still is what
 *           the thumbnail and PNG export paint; the editor plays the video.
 *           `kind: "video"` + `src` let the preview pane play it too.
 *
 * @param {{id: string, src: string, type: string}} asset A normalized Magic Studio asset.
 * @param {{name: string, ratio: string, tool: string}} meta
 */
export async function magicResultToVariation(asset, { name, ratio, tool }) {
  const video = asset.type === "video";
  const id = `magic-${asset.id}`;
  const fallback = RATIO_SIZE[ratio] || RATIO_SIZE.square;
  const layer = (type, src, size) => ({
    id: `${id}-${type}`,
    type,
    src,
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    rotation: 0,
    opacity: 1,
  });

  if (video) {
    const still = await videoStill(asset.src);
    const size = still || fallback;
    return {
      id,
      name,
      source: "magic",
      magicTool: tool,
      kind: "video",
      src: asset.src,
      canvas: { width: size.width, height: size.height, background: "#000000" },
      elements: [
        ...(still?.poster ? [layer("image", still.poster, size)] : []),
        layer("video", asset.src, size),
      ],
    };
  }

  const size = (await imageSize(asset.src)) || fallback;
  return {
    id,
    name,
    source: "magic",
    magicTool: tool,
    canvas: { width: size.width, height: size.height, background: "#ffffff" },
    elements: [layer("image", asset.src, size)],
  };
}
