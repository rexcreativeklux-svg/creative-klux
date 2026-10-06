// app/(dashboard)/(pages)/studio/ai-chat-page/magicDesign.js
// ─────────────────────────────────────────────────────────────────────────────
// The chat's "Image" engine: a `type: "create"` reply turned into a Magic Studio
// request, and the pictures that come back turned into designs.
//
// NOTHING IN MAGIC STUDIO IS CHANGED BY THIS. The chat drives the Stock Image /
// Social Design / Ads Design configs exactly as the Magic Studio page does —
// same payload builder, same endpoint, same polling (useMagicGenerate) — and
// only supplies the composer values those configs already read.
//
// The create reply already carries everything those values need:
//
//   generation_prompts[0]        → the prompt (the backend writes it for us)
//   brand_details.creative_type  → which tool: ads / social / designer
//   brand_details.size           → the nearest ratio Magic Studio offers
//   variations                   → how many
//   brand_details.brandColor     → colour
//   brand_details.brandName/logo → brand chip

/**
 * creative_type → Magic Studio design tool id. Confirmed values from live
 * create replies: "ads" (TikTok ad), "social" (Facebook post / cover),
 * "designer" (website image). Anything else is treated as a plain image.
 */
const TOOL_BY_CREATIVE_TYPE = {
  ads: "ad-design",
  social: "social-design",
  designer: "image-design",
};

export const MAGIC_DESIGN_TOOLS = ["ad-design", "social-design", "image-design"];

/** @returns {"ad-design"|"social-design"|"image-design"} */
export function magicToolFor(creativeType) {
  return TOOL_BY_CREATIVE_TYPE[String(creativeType || "").toLowerCase()] || "image-design";
}

/**
 * Magic Studio's ratio choices (its composer's `ratio` values) and their shape.
 * It has no 4:5, 1.91:1 or 2.7:1 — a size between them goes to the nearest.
 */
const RATIOS = [
  { value: "square", w: 1, h: 1 },
  { value: "landscape", w: 16, h: 9 },
  { value: "portrait", w: 9, h: 16 },
  { value: "wide", w: 21, h: 9 },
];

/** "1200x630" → { width: 1200, height: 630 }, or null. */
export function parseSize(size) {
  const match = String(size || "").match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * The Magic Studio ratio closest to a size. Compared on the log scale so 2:1
 * and 1:2 are equally far from square.
 */
export function nearestRatio(size) {
  const parsed = parseSize(size);
  if (!parsed) return "square";
  const target = Math.log(parsed.width / parsed.height);
  return RATIOS.reduce((best, r) =>
    Math.abs(Math.log(r.w / r.h) - target) < Math.abs(Math.log(best.w / best.h) - target)
      ? r
      : best,
  ).value;
}

/**
 * The visual styles Magic Studio's image tools offer. The reply's visualStyle
 * ("Elegant", "Vibrant") is used when it names one of these, otherwise the
 * tool's own default.
 */
const STYLE_VALUES = [
  "photorealistic", "cinematic", "illustration", "flat-vector", "minimal",
  "gradient", "collage", "lifestyle",
];
const DEFAULT_STYLE = "photorealistic";

/** The prompt for the run: the one the backend wrote, else the brief. */
export function magicPromptFrom(data) {
  const details = data?.brand_details || {};
  const prompts = Array.isArray(data?.generation_prompts)
    ? data.generation_prompts
    : Array.isArray(details.generation_prompts)
      ? details.generation_prompts
      : [];
  const prompt = prompts.find((p) => typeof p === "string" && p.trim());
  return (prompt || details.description || "").trim();
}

/**
 * The composer values the Magic Studio design configs read — the same keys the
 * /magic-studio composer fills in. `purpose` is NOT here: each design config
 * fixes its own.
 */
export function magicValuesFrom(data, brand) {
  const details = data?.brand_details || {};
  const style = String(details.visualStyle || "").toLowerCase();
  const count = Number.parseInt(data?.variations ?? details.variations, 10);

  return {
    style: STYLE_VALUES.includes(style) ? style : DEFAULT_STYLE,
    ratio: nearestRatio(details.size || details.type_size),
    variations: Number.isFinite(count) && count > 0 ? count : 1,
    // Left as the composer's "no preference" sentinel when the reply has none,
    // which the config then omits from the payload.
    color: /^#[0-9a-f]{3,8}$/i.test(details.brandColor || "") ? details.brandColor : "auto",
    brandName: details.brandName || brand?.name || brand?.brand_name || "",
    brandLogo: details.logo || brand?.logo || "",
  };
}

/** Natural size of an image URL, or null if it can't be read. */
function imageSize(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve(img.naturalWidth && img.naturalHeight
        ? { width: img.naturalWidth, height: img.naturalHeight }
        : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** A fallback canvas for a ratio, when the picture's own size can't be read. */
const RATIO_CANVAS = {
  square: { width: 1080, height: 1080 },
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1920 },
  wide: { width: 2520, height: 1080 },
};

/**
 * Wrap one Magic Studio picture as a design: a canvas the picture's own size
 * with the picture as its only element. Shown as returned — not cropped to the
 * size the conversation asked for.
 *
 * @param {{id: string, src: string}} asset A normalized Magic Studio asset.
 * @param {object} meta
 * @param {string} meta.name   Card title.
 * @param {string} meta.ratio  The ratio that was requested (fallback size only).
 * @param {string} meta.tool   The Magic Studio tool that made it.
 */
export async function imageToDesign(asset, { name, ratio, tool }) {
  const size = (await imageSize(asset.src)) || RATIO_CANVAS[ratio] || RATIO_CANVAS.square;
  const id = `magic-${asset.id}`;

  return {
    id,
    name,
    source: "magic",
    magicTool: tool,
    canvas: { width: size.width, height: size.height, background: "#ffffff" },
    elements: [
      {
        id: `${id}-image`,
        type: "image",
        src: asset.src,
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        rotation: 0,
        opacity: 1,
      },
    ],
  };
}
