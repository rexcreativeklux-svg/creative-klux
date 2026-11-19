// app/(components)/composer/composerPlatforms.js
// ─────────────────────────────────────────────────────────────────────────────
// The rules the Create Post composer works to, one entry per social network:
// what it's called, its colour and icon, how long its text may be, what media
// it insists on, and which extra fields it has. Plus the two functions that
// turn a composed post into problems (validatePost) and into a real publish
// call (publishComposedPost).
//
// Kept apart from the component so the composer can be dropped anywhere — the
// rules travel with it, and adding a network is one entry here.
//
// Publishing goes through the same integration helpers PublishModal uses
// (POST creatives/publish): the server holds every token and answers with the
// platform's own words, which come back here as a thrown Error.

import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaLinkedin,
  FaYoutube,
  FaPinterest,
  FaTwitter,
} from "react-icons/fa";
import {
  publishToFacebook,
  publishToInstagram,
  publishToLinkedIn,
  publishToPinterest,
  publishToTikTok,
  publishToTwitter,
  publishToYouTube,
} from "@/(lib)/integration";
import { LINKEDIN_POSTING_ENABLED } from "@/(lib)/linkedinConfig";

/**
 * Each network the composer can post to.
 *
 *   connectLabel  the "+" panel's button for connecting one
 *   maxChars      the network's own limit on the main text
 *   media         "required" | "video" (a video specifically) | "optional"
 *   fields        extra per-network inputs, rendered in that network's section
 *
 * ⚠️ THE FIELDS ARE WHAT OUR PUBLISHER ACTUALLY SENDS, not a copy of another
 * tool's form. Each one maps to an argument the matching integration helper
 * passes to POST creatives/publish (see publishComposedPost below); a setting
 * the API can't receive is not offered, however useful it would look. The
 * limits are each network's own published API limits.
 */
export const COMPOSER_PLATFORMS = {
  facebook: {
    label: "Facebook",
    connectLabel: "Connect a Facebook page",
    color: "#1877F2",
    Icon: FaFacebook,
    maxChars: 63206,
    media: "optional",
    fields: [
      {
        key: "link",
        label: "Link",
        placeholder: "https://…",
        help: "Attached to the post as a link preview.",
      },
    ],
  },
  instagram: {
    label: "Instagram",
    connectLabel: "Connect an Instagram professional account",
    color: "#E1306C",
    Icon: FaInstagram,
    maxChars: 2200,
    media: "required",
    // The publisher sends the caption and the image or video — nothing else.
    fields: [],
  },
  twitter: {
    label: "X / Twitter",
    connectLabel: "Connect an X account",
    color: "#14171A",
    Icon: FaTwitter,
    maxChars: 280,
    media: "optional",
    fields: [],
  },
  linkedin: {
    label: "LinkedIn",
    connectLabel: "Connect a LinkedIn account",
    color: "#0A66C2",
    Icon: FaLinkedin,
    maxChars: 3000,
    media: "optional",
    fields: [],
    enabled: LINKEDIN_POSTING_ENABLED,
  },
  tiktok: {
    label: "TikTok",
    connectLabel: "Connect a TikTok account",
    color: "#010101",
    Icon: FaTiktok,
    maxChars: 2200,
    media: "required",
    fields: [
      {
        key: "title",
        label: "Title",
        placeholder: "First line of the text",
        max: 90,
        help: "Up to 90 characters. Left empty, the first line of the text is used.",
      },
      {
        key: "privacy_level",
        label: "Who can view",
        type: "select",
        // TikTok's own privacy_level values. On "Account default" nothing is
        // sent and TikTok applies the account's setting.
        options: [
          { value: "", label: "Account default" },
          { value: "PUBLIC_TO_EVERYONE", label: "Everyone" },
          { value: "MUTUAL_FOLLOW_FRIENDS", label: "Friends" },
          { value: "FOLLOWER_OF_CREATOR", label: "Followers" },
          { value: "SELF_ONLY", label: "Only me" },
        ],
        help: "A private TikTok account can't post to Everyone — TikTok refuses it.",
      },
    ],
  },
  youtube: {
    label: "YouTube",
    connectLabel: "Connect a YouTube channel",
    color: "#FF0000",
    Icon: FaYoutube,
    maxChars: 5000,
    media: "video",
    fields: [
      {
        key: "title",
        label: "Title",
        placeholder: "First line of the text",
        max: 100,
        help: "Up to 100 characters. The text becomes the video description.",
      },
      {
        key: "privacy",
        label: "Visibility",
        type: "select",
        options: [
          { value: "public", label: "Public" },
          { value: "unlisted", label: "Unlisted" },
          { value: "private", label: "Private" },
        ],
      },
    ],
  },
  pinterest: {
    label: "Pinterest",
    connectLabel: "Connect a Pinterest account",
    color: "#E60023",
    Icon: FaPinterest,
    // Pinterest API v5: a pin's description is at most 800 characters.
    maxChars: 800,
    media: "required",
    // No board picker: the API takes a board_id, but nothing can list a
    // brand's boards yet, so there is no honest way to offer one.
    fields: [
      {
        key: "title",
        label: "Title",
        placeholder: "First line of the text",
        max: 100,
        help: "Up to 100 characters. The text becomes the pin description.",
      },
      {
        key: "link",
        label: "Destination link",
        placeholder: "https://…",
        help: "Where the pin takes people when they tap it.",
      },
    ],
  },
};
/** The order networks appear in the picker. */
export const COMPOSER_ORDER = [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "tiktok",
  "youtube",
  "pinterest",
];

/** Networks the composer can post to right now (LinkedIn waits on approval). */
export const isComposable = (platform) =>
  !!COMPOSER_PLATFORMS[platform] && COMPOSER_PLATFORMS[platform].enabled !== false;

/** The first line of the text — the default title wherever a network has one. */
export const firstLine = (text = "") => text.trim().split("\n")[0]?.trim() || "";

/**
 * Everything stopping this post going out, per network.
 *
 * @param {object} post
 * @param {string} post.text  The shared (template) text.
 * @param {(platform: string) => string} [post.textFor]  A network's own text
 *   when it has been edited separately; defaults to the shared text.
 * @param {{type: "image"|"video"}|null} post.media
 * @param {string[]} post.platforms
 * @returns {Array<{platform: string, message: string}>}
 */
export function validatePost({ text: shared, textFor, media, platforms }) {
  const problems = [];
  if (!platforms.length) {
    problems.push({ platform: null, message: "Pick at least one account to post to." });
    return problems;
  }

  for (const platform of platforms) {
    const rules = COMPOSER_PLATFORMS[platform];
    if (!rules) continue;
    const text = textFor ? textFor(platform) : shared;
    const trimmed = text.trim();
    // Networks that insist on media already say so below, more usefully.
    if (!trimmed && !media && rules.media === "optional")
      problems.push({ platform, message: "Add some text or an image or video." });
    if (text.length > rules.maxChars)
      problems.push({
        platform,
        message: `Text is ${(text.length - rules.maxChars).toLocaleString()} characters over the ${rules.maxChars.toLocaleString()} limit.`,
      });
    if (rules.media === "required" && !media)
      problems.push({ platform, message: "Add at least 1 image or video." });
    if (rules.media === "video" && media?.type !== "video")
      problems.push({ platform, message: "Add a video — this network only posts video." });
  }
  return problems;
}

/**
 * Publish the composed post to ONE network. Throws the platform's own error.
 *
 * @param {string} platform
 * @param {object} post
 * @param {string} post.text
 * @param {{url: string, type: "image"|"video"}|null} post.media  already hosted
 * @param {object} post.options  this network's extra fields (title, link, …)
 * @param {number|string} post.brandId
 * @returns {Promise<{message?: string}>} A message when the outcome isn't a plain "posted".
 */
export async function publishComposedPost(platform, { text, media, options = {}, brandId }) {
  const caption = text.trim();
  const mediaArgs = media
    ? media.type === "video"
      ? { video_url: media.url }
      : { image_url: media.url }
    : {};
  const title = (max) => (options.title?.trim() || firstLine(caption)).slice(0, max);

  switch (platform) {
    case "facebook":
      await publishToFacebook({
        brand_id: brandId,
        caption,
        link: options.link?.trim() || undefined,
        ...mediaArgs,
      });
      return {};
    case "instagram":
      await publishToInstagram({ brand_id: brandId, caption, ...mediaArgs });
      return {};
    case "twitter":
      await publishToTwitter({ brand_id: brandId, text: caption, ...mediaArgs });
      return {};
    case "linkedin":
      await publishToLinkedIn({ brand_id: brandId, text: caption, ...mediaArgs });
      return {};
    case "tiktok": {
      const res = await publishToTikTok({
        brand_id: brandId,
        title: title(90),
        description: caption,
        privacy_level: options.privacy_level || undefined,
        ...mediaArgs,
      });
      // With video.upload only, TikTok keeps it as a draft for the creator.
      return res?.draft_only ? { message: "Sent to your TikTok drafts" } : {};
    }
    case "youtube":
      await publishToYouTube({
        brand_id: brandId,
        title: title(100) || "Untitled",
        description: caption,
        privacyStatus: options.privacy || "public",
        ...mediaArgs,
      });
      return {};
    case "pinterest":
      await publishToPinterest({
        brand_id: brandId,
        title: title(100),
        description: caption,
        link: options.link?.trim() || undefined,
        ...mediaArgs,
      });
      return {};
    default:
      throw new Error(`Posting to ${platform} isn't available yet.`);
  }
}
