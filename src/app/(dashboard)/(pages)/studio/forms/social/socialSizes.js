// studio/forms/social/socialSizes.js
// ─────────────────────────────────────────────────────────────────────────────
// The Social Creative "Image" tab, as data.
//
// /studio?creative=social_creative used to open onto five category pills — Posts,
// Reels, Banners / Covers, Thumbnails, Memes / Trends — each with its own
// thousand-line form. Four of those five make an IMAGE and differ only in what
// they are FOR, so they are now one form (SocialImageForm) and the old
// distinction is a tag: KINDS below. Reels is the one that makes a video and
// keeps its own form.
//
// ⚠️ THIS FILE IS ALSO WHERE THE TARGET PLATFORM COMES FROM, and that is the
// point of it. The size presets have always been platform-named — "LinkedIn
// Square", "Facebook Feed", "Pinterest Pin" — and the form ALSO asked for a
// target platform in a separate chip row, with nothing keeping the two answers
// in agreement. You could pick "Facebook Feed" and tag it Instagram, and the
// backend got both. The platform now hangs off the size and the field is gone.

/**
 * @typedef {object} SocialSize
 * @property {string} value  "1200x630" — the dimensions the backend gets.
 * @property {string} label  What the user reads, and this size's IDENTITY.
 * @property {string|null} platform  Publishing platform this size implies.
 * @property {string} category  Scraive template category for the redesign engine.
 *
 * ⚠️ THE LABEL IS THE IDENTITY, NOT THE VALUE. LinkedIn Square and Instagram
 * Square are both 1080x1080, so tracking the value alone highlights both tiles
 * and resolves the wrong template category. Every lookup here goes by label,
 * which is why they must stay unique WITHIN a kind (across kinds they may
 * repeat — only one kind is ever on screen).
 *
 * ⚠️ `platform: null` IS A DECISION, NOT A GAP. "Stories / Reels" and
 * "1:1 — Square" name a shape, not a place — Stories exist on Instagram and
 * Facebook both, and a square is a square. Those generate with no platform
 * rather than being assigned a plausible-looking one, because the whole reason
 * the separate field went away is that it let the request claim a platform the
 * user never chose. Do not "complete" this column.
 */

/** Feed posts. The eight presets the old Posts form offered. */
const POST_SIZES = [
  { value: "1200x627", label: "LinkedIn Horizontal", platform: "linkedin" },
  { value: "1080x1080", label: "LinkedIn Square", platform: "linkedin" },
  { value: "1080x1080", label: "Instagram Square", platform: "instagram" },
  { value: "1080x1350", label: "Instagram Portrait", platform: "instagram" },
  { value: "1080x1920", label: "Stories / Reels", platform: null },
  { value: "1200x630", label: "Facebook Feed", platform: "facebook" },
  { value: "1600x900", label: "Twitter / X Post", platform: "twitter" },
  { value: "1000x1500", label: "Pinterest Pin", platform: "pinterest" },
];

// Memes ran the same eight presets as posts — which is exactly why the tag row
// exists: a size alone cannot tell a meme from a post. The one difference is
// LinkedIn Square, which the memes form had at 627x627, so the list is written
// out rather than shared by reference.
const MEME_SIZES = [
  { value: "1200x627", label: "LinkedIn Horizontal", platform: "linkedin" },
  { value: "627x627", label: "LinkedIn Square", platform: "linkedin" },
  { value: "1080x1080", label: "Instagram Square", platform: "instagram" },
  { value: "1080x1350", label: "Instagram Portrait", platform: "instagram" },
  { value: "1080x1920", label: "Stories / Reels", platform: null },
  { value: "1200x630", label: "Facebook Feed", platform: "facebook" },
  { value: "1600x900", label: "Twitter / X Post", platform: "twitter" },
  { value: "1000x1500", label: "Pinterest Pin", platform: "pinterest" },
];

// Profile and channel covers. The display-ad banners (Leaderboard, Medium
// Rectangle, Skyscraper, Mobile) were commented out in BannersForm and stay out
// — they belong to Ads Creative, not here.
const BANNER_SIZES = [
  { value: "820x312", label: "Facebook Cover", platform: "facebook" },
  { value: "1500x500", label: "Twitter / X Cover", platform: "twitter" },
  { value: "1128x191", label: "LinkedIn Cover", platform: "linkedin" },
  { value: "2560x1440", label: "YouTube Channel Art", platform: "youtube" },
  { value: "1080x1080", label: "1:1 — Square", platform: null },
];

// Thumbnails were ALREADY platform-first: the old form asked for a platform and
// derived the size from it. So this kind arrives at the new model unchanged —
// the label is the platform, and `category` keeps the Scraive sub-category the
// old PLATFORM_SIZES map carried, which is not always the label (Instagram
// thumbnails fetch "Instagram Square" templates).
const THUMBNAIL_SIZES = [
  { value: "1280x720", label: "YouTube", platform: "youtube", category: "YouTube Thumbnail" },
  { value: "1280x720", label: "Twitch", platform: "twitch", category: "Twitch Thumbnail" },
  { value: "1080x1920", label: "TikTok", platform: "tiktok", category: "TikTok Thumbnail" },
  { value: "1080x1080", label: "Instagram", platform: "instagram", category: "Instagram Square" },
  { value: "1200x627", label: "LinkedIn", platform: "linkedin", category: "LinkedIn Horizontal" },
  { value: "1600x900", label: "X / Twitter", platform: "twitter", category: "Twitter / X Post" },
];

/** Everywhere else, the Scraive category IS the label. */
const withCategory = (sizes) =>
  sizes.map((size) => ({ ...size, category: size.category || size.label }));

/**
 * The four kinds of image, in tag-row order.
 *
 * ⚠️ `subType` IS THE BACKEND CONTRACT AND MUST NOT BECOME "image". It is sent
 * as `create_sub_type` (see createDesign in AuthContext), which is what tells
 * the generator it is making a channel cover rather than a feed post — a real
 * difference in output. The TAB the user clicked is now "image" for all four, so
 * the sub-type comes from here instead. These strings are the ids the old
 * category pills used, unchanged, so nothing downstream had to move.
 *
 * @property {string} id        Tag id, stored on formData.socialKind.
 * @property {string} label     Tag text.
 * @property {string} subType   create_sub_type sent to the backend.
 * @property {string} sizeLabel What the size field is called for this kind.
 * @property {string} descLabel What the description field is called.
 * @property {string} descPlaceholder
 * @property {string} generateLabel  The generate button's verb.
 * @property {SocialSize[]} sizes
 * @property {string[]} goals   Campaign goals — they genuinely differ (a
 *   thumbnail chases subscribers, a banner chases event signups).
 * @property {boolean} audience Whether the Audience field shows. Thumbnails
 *   never asked for one.
 * @property {string[]} formats File formats — banners offer SVG, thumbnails
 *   don't offer AVIF.
 * @property {boolean} tone     Post Tone field (posts + memes).
 * @property {boolean} cta      Call to Action field (banners).
 * @property {{value: string, label: string}[]|null} styles Visual Style options,
 *   or null where the kind has no such field.
 */
export const KINDS = [
  {
    id: "post",
    label: "Post",
    subType: "posts",
    sizeLabel: "Post Size",
    descLabel: "Post Description",
    descPlaceholder:
      "What is this post about? Describe the message, product, or story you want to tell…",
    generateLabel: "Generate Posts",
    sizes: withCategory(POST_SIZES),
    goals: [
      "Brand Awareness",
      "Engagement",
      "Sales",
      "Lead Generation",
      "Website Traffic",
    ],
    audience: true,
    formats: ["PNG", "JPEG", "WEBP", "AVIF"],
    tone: true,
    cta: false,
    styles: null,
  },
  {
    id: "banner",
    label: "Banner / Cover",
    subType: "banners_covers",
    sizeLabel: "Banner Size",
    descLabel: "Description / Brief",
    descPlaceholder:
      "Describe what this banner is for. What's the message? What action should viewers take?",
    generateLabel: "Generate Banners",
    sizes: withCategory(BANNER_SIZES),
    goals: [
      "Brand Awareness",
      "Engagement",
      "Sales",
      "Lead Generation",
      "Website Traffic",
      "Event Registration",
    ],
    audience: true,
    formats: ["PNG", "JPEG", "WEBP", "SVG"],
    tone: false,
    cta: true,
    styles: [
      { value: "clean", label: "Clean" },
      { value: "bold", label: "Bold" },
      { value: "minimal", label: "Minimal" },
      { value: "vibrant", label: "Vibrant" },
      { value: "corporate", label: "Corporate" },
      { value: "dark", label: "Dark" },
      { value: "modern", label: "Modern" },
    ],
  },
  {
    id: "thumbnail",
    label: "Thumbnail",
    subType: "thumbnails",
    sizeLabel: "Platform",
    descLabel: "Video Description / Context",
    descPlaceholder:
      "Brief description of the video — helps the AI match the thumbnail mood…",
    generateLabel: "Generate Thumbnails",
    sizes: THUMBNAIL_SIZES,
    goals: [
      "Views / Reach",
      "Subscriber Growth",
      "Engagement",
      "Website Traffic",
      "Sales / Conversions",
    ],
    audience: false,
    formats: ["PNG", "JPEG", "WEBP"],
    tone: false,
    cta: false,
    styles: [
      { value: "bold", label: "Bold & High Contrast" },
      { value: "clean", label: "Clean & Minimal" },
      { value: "dramatic", label: "Dramatic / Cinematic" },
      { value: "playful", label: "Playful / Colorful" },
      { value: "professional", label: "Professional" },
      { value: "retro", label: "Retro / Vintage" },
    ],
  },
  {
    id: "meme",
    label: "Meme / Trend",
    subType: "memes",
    sizeLabel: "Post Size",
    descLabel: "Post Description",
    descPlaceholder:
      "What's the joke or trend? Describe the format and the punchline you're going for…",
    generateLabel: "Generate Memes",
    sizes: withCategory(MEME_SIZES),
    goals: [
      "Brand Awareness",
      "Engagement",
      "Sales",
      "Lead Generation",
      "Website Traffic",
    ],
    audience: true,
    formats: ["PNG", "JPEG", "WEBP", "AVIF"],
    tone: true,
    cta: false,
    styles: null,
  },
];

/** Call-to-action presets — the banner kind's only list of its own. */
export const CTA_OPTIONS = [
  "Learn More",
  "Shop Now",
  "Get Started",
  "Register Free",
  "Download Now",
  "Book a Demo",
  "View Offer",
];

/** Audience options. Identical across every kind that asks, so declared once. */
export const AUDIENCES = [
  { value: "B2B", label: "B2B", desc: "Business owners, startups, agencies" },
  { value: "B2C", label: "B2C", desc: "End consumers, everyday users" },
  { value: "Casual", label: "Casual", desc: "Broad social media audience" },
  {
    value: "Inspirational",
    label: "Inspirational",
    desc: "Entrepreneurs & creators",
  },
  { value: "Sales", label: "Sales", desc: "Hot leads, ad audiences" },
];

/** Post / meme tone options. */
export const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
  { value: "urgent", label: "Urgent" },
  { value: "educational", label: "Educational" },
];

/** The kind a tag id names, falling back to Post — the tab's default. */
export const kindById = (id) => KINDS.find((k) => k.id === id) || KINDS[0];

/** One kind's sizes. */
export const sizesForKind = (id) => kindById(id).sizes;

/**
 * A size within a kind, by label — with a fallback chain that matters: when the
 * kind changes, the previously-selected label belongs to the OLD kind's list and
 * will not be found, so this hands back that kind's first preset rather than
 * nothing. A form is therefore never in a state with a kind but no size.
 */
export const sizeByLabel = (kindId, label) => {
  const sizes = sizesForKind(kindId);
  return sizes.find((s) => s.label === label) || sizes[0];
};

// ── Drift check ──────────────────────────────────────────────────────────────
// A repeated label inside one kind silently breaks selection: two tiles light up
// together and sizeByLabel resolves whichever comes first. Dev-only.
if (process.env.NODE_ENV !== "production") {
  for (const kind of KINDS) {
    const labels = kind.sizes.map((s) => s.label);
    const dupes = labels.filter((l, i) => labels.indexOf(l) !== i);
    if (dupes.length > 0) {
      console.warn(
        `⚠️ [social-creative] duplicate size label(s) in "${kind.id}": ${[
          ...new Set(dupes),
        ].join(", ")} — labels are the identity, so these cannot repeat`,
      );
    }
  }
}
