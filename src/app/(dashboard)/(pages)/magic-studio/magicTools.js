// app/(dashboard)/(pages)/magic-studio/magicTools.js
// ─────────────────────────────────────────────────────────────────────────────
// The seven Magic Studio tools, as routes.
//
// Four different surfaces need to agree on this list — the secondary sidebar's
// nav, the landing page's history filter row, the composer's tool picker, and
// the [tool] route that has to turn a URL segment back into a category id — so
// it is declared once, here.
//
// ⚠️ THE SLUGS ARE WRITTEN OUT, not derived from the label. A URL is a contract:
// renaming "Persona-based Generator" in creatives.js must not quietly break
// every link to /magic-studio/persona-generator that anyone has bookmarked.
// The check at the bottom of this file catches the opposite mistake — a category
// added to creatives.js and forgotten here.
//
// `backend: false` marks the two tools that run ENTIRELY ON-DEVICE
// (audio_to_text via Whisper, text_to_audio via Kokoro — see
// magicStudioConfigs.jsx). They persist nothing server-side, so they have no
// history to merge into the landing grid and are deliberately absent from its
// filter row. They still get a nav item and a route like everything else.

import {
  AudioLines,
  FileImage,
  Layers,
  Mic,
  Music,
  User,
  Video,
} from "lucide-react";
import { getCreativeById } from "../studio/creatives";

/** The creative these categories belong to, in studio/creatives.js. */
const CREATIVE_ID = "magic_studio";

/**
 * @typedef {object} MagicTool
 * @property {string}  id      Category id — the backend's `tool` enum value.
 * @property {string}  slug    URL segment under /magic-studio.
 * @property {string}  label   Nav + filter label.
 * @property {string}  short   Compact label for the filter pills and the
 *   composer's picker, where the full name would wrap.
 * @property {string}  working What the placeholder tile says while this tool
 *   runs. Written per tool because the waits are not comparable — an image is
 *   seconds where a video is minutes, and a shared "Generating…" would leave
 *   someone three minutes into a video wondering whether it had hung.
 * @property {string} [emptyHint] What the empty canvas says. Only needed where
 *   the default ("Everything you make with X lands here") would be wrong —
 *   which is the two tools that keep no history.
 * @property {boolean} backend Whether generations persist to server history.
 * @property {boolean} [publish] Whether a result of this tool may be sent
 *   straight to a platform from the lattice's ⋯ menu. The five tools that make
 *   a picture or a clip can; the two audio tools cannot — PublishModal posts a
 *   hosted media URL as a post or an ad, and there is no feed anywhere that
 *   takes a transcript or a voice take as the thing being published. The flag
 *   is per TOOL, not per item, because a result's own type isn't enough to
 *   decide it: the persona generator returns text as readily as it returns an
 *   image, and the ⋯ menu still gates on the item having a media URL.
 * @property {import("react").ElementType} icon
 *
 * ⚠️ NO USER-FACING COPY HERE MENTIONS WHERE THE WORK HAPPENS. Two of these
 * tools run entirely on the user's own machine, and saying so in a loader reads
 * to a customer as an excuse — "on your device" sounds like a lesser model, or
 * like no real AI at all, on a paid product. It is an implementation detail and
 * a privacy advantage, not a caveat to lead with. The distinction still matters
 * to US, which is what `backend` is for; it just isn't the user's problem.
 */

/** @type {MagicTool[]} */
export const MAGIC_TOOLS = [
  {
    id: "text_to_image",
    slug: "text-to-image",
    label: "Text to Image",
    short: "Image",
    working: "Painting your image…",
    backend: true,
    publish: true,
    icon: FileImage,
  },
  {
    id: "text_to_video",
    slug: "text-to-video",
    label: "Text to Video",
    short: "Video",
    // The only one that routinely runs into minutes — it says so, because a
    // silent three-minute wait is indistinguishable from a hang.
    working: "Rendering your video — this one takes a few minutes…",
    backend: true,
    publish: true,
    icon: Video,
  },
  {
    id: "image_to_variations",
    slug: "image-to-variations",
    label: "Image to Variations",
    short: "Variations",
    working: "Spinning up variations…",
    backend: true,
    publish: true,
    icon: Layers,
  },
  {
    id: "script_to_voiceover",
    slug: "script-to-voiceover",
    label: "Script to Voiceover to Video",
    short: "Voiceover",
    working: "Recording the voiceover and cutting the video…",
    backend: true,
    publish: true,
    icon: Mic,
  },
  {
    id: "persona_generator",
    slug: "persona-generator",
    label: "Persona-based Generator",
    short: "Persona",
    working: "Writing in your persona's voice…",
    backend: true,
    publish: true,
    icon: User,
  },
  {
    id: "audio_to_text",
    slug: "audio-to-text",
    label: "Audio to Text",
    short: "Transcribe",
    working: "Transcribing your audio…",
    emptyHint: "Your transcript appears here.",
    backend: false,
    icon: AudioLines,
  },
  {
    id: "text_to_audio",
    slug: "text-to-audio",
    label: "Text to Audio",
    short: "Audio",
    working: "Generating your audio…",
    // ⚠️ `backend: true` even though the audio is made in the BROWSER. This flag
    // asks one question — "is there server history to fetch?" — and for this
    // tool the answer is now yes: every run is recorded straight after it
    // generates (recordTextToAudio in magicStudioConfigs). It is the one tool
    // where where-it-runs and where-it-is-stored disagree.
    backend: true,
    icon: Music,
  },
];

/** The tools whose generations the landing grid can actually show. */
export const BACKEND_TOOLS = MAGIC_TOOLS.filter((tool) => tool.backend);

/** Route for a tool. */
export const hrefForTool = (tool) => `/magic-studio/${tool.slug}`;

/** The tool a URL segment names, or null — the [tool] route's 404 test. */
export const toolBySlug = (slug) =>
  MAGIC_TOOLS.find((tool) => tool.slug === slug) || null;

/** The tool a category id names, or null. */
export const toolById = (id) => MAGIC_TOOLS.find((tool) => tool.id === id) || null;

// ── Drift check ──────────────────────────────────────────────────────────────
// creatives.js owns the category list; this file owns their URLs. Adding a
// category there and not here would leave a tool with no nav item and no route,
// which is invisible until someone goes looking for it. Dev-only: it costs a
// module-load loop that production has no use for.
if (process.env.NODE_ENV !== "production") {
  const declared = new Set(MAGIC_TOOLS.map((tool) => tool.id));
  const missing = (getCreativeById(CREATIVE_ID)?.categories || [])
    .map((category) => category.id)
    .filter((id) => !declared.has(id));

  if (missing.length > 0) {
    console.warn(
      `⚠️ [magic-studio] no route declared for: ${missing.join(", ")} — ` +
        "add them to MAGIC_TOOLS in magicTools.js",
    );
  }
}
