"use client";

/**
 * The skill catalog — the named jobs a copilot can be taught, invoked by slash
 * command in the conversation.
 *
 * ⚠️ A SKILL IS NOT A WORKFLOW, and the two files stay apart because of it. An
 * idea in ./ideas.js is a STANDING job with a trigger ("Every Friday…", "When I
 * upload…") — the copilot runs it without being asked. A skill is a capability
 * you invoke: `/brand-audit` on this batch, now. The same words describe both
 * badly, which is why each has its own list and its own screen.
 *
 * ⚠️ EVERY SKILL IS WORK THIS PRODUCT ACTUALLY DOES — the same rule ./ideas.js
 * follows, and the reason this catalog is nothing like the reference's. Chief of
 * Staff, Financial Manager and Presentation Maker belong to a general-purpose
 * assistant: they read your email, close your books and build slide decks, none
 * of which Creative Klux has ever been able to do. These are brand kits, social
 * posts, ad creative, product photography and performance — the studios the app
 * ships. A skill card promising a P&L is a cheque the product cannot cash.
 *
 * `category` is a browse pill, and deliberately phrased as a JOB ("Make
 * designs") rather than a product surface ("Brand Kits") — this screen is
 * answering "what do you want to do?", which is not the same question the
 * Plugins > Connectors tab or _data/surfaces answers.
 *
 * `surface` IS a key into CATEGORY_SURFACES, so a card's badge is the same glyph
 * as the studio the skill runs in.
 */

/** Browse pills, in order. "Recommended" is a view, not a category — it shows
 *  the featured three plus anything flagged, so it always has something in it. */
export const SKILL_CATEGORIES = [
  "Recommended",
  "Make designs",
  "Plan content",
  "Run ads",
  "Study performance",
  "Prep products",
];

/**
 * The three cards at the top, each with a preview panel.
 *
 * `preview` names a mock in _components/SkillPreview — an illustration of the
 * skill's OUTPUT, not a screenshot, so it cannot go stale when the real screen
 * changes. `platforms` are ids from the integrations registry; an empty array is
 * fine and deliberate (a brand audit touches no platform).
 */
export const FEATURED_SKILLS = [
  {
    slug: "brand-guardian",
    updated: "Jul 12, 2026",
    name: "Brand Guardian",
    surface: "Brand",
    preview: "brand",
    tint: "bg-blue-600",
    platforms: [],
    description:
      "Your standing check on everything that goes out. Reads a batch of designs against your kit and flags every drift in color, font, logo or voice — with a corrected version beside each one.",
  },
  {
    slug: "campaign-builder",
    updated: "Jul 8, 2026",
    name: "Campaign Builder",
    surface: "Ads",
    preview: "campaign",
    tint: "bg-orange-500",
    platforms: ["meta_ads", "instagram"],
    description:
      "Turns one idea into the whole set. Builds the post, the story, the ad and the banner in your brand's colors and fonts, writes the copy variants, and stages them ready to run.",
  },
  {
    slug: "product-line",
    updated: "Jun 30, 2026",
    name: "Product Line",
    surface: "Product",
    preview: "product",
    tint: "bg-violet-600",
    platforms: ["instagram", "pinterest"],
    description:
      "Takes a folder of raw product photos and hands back a catalog. Strips backgrounds, straightens and beautifies, stages each item in a lifestyle shot and a flat lay, and files the set.",
  },
];

/**
 * The browse list.
 *
 * ⚠️ `updated` is a WRITTEN DATE, unlike the `editedAgo` labels in ./copilots.js
 * — and the difference is the point. "32 minutes ago" rots into a lie within the
 * hour; "Jun 16, 2026" is simply the day it last changed and stays true forever.
 * It becomes a real timestamp when the backend owns this catalog.
 */
export const SKILLS = [
  {
    slug: "brand-audit",
    category: "Make designs",
    surface: "Brand",
    updated: "Jun 16, 2026",
    description:
      "Check a batch of designs against your brand kit and flag every drift in color, font, logo or voice — each one with the fix beside it, so approving is one pass rather than a hunt.",
  },
  {
    slug: "resize-everywhere",
    category: "Make designs",
    surface: "Social",
    updated: "Jun 22, 2026",
    description:
      "Take one design and produce it in every platform's size — feed, story, reel cover, banner — reflowing the layout for each rather than cropping, and queue the whole set for review.",
  },
  {
    slug: "logo-swap",
    category: "Make designs",
    surface: "Brand",
    updated: "Jun 16, 2026",
    description:
      "Find every design still carrying an old logo and rebuild them on the new one, keeping each layout's spacing and hierarchy intact.",
  },
  {
    slug: "week-of-posts",
    category: "Plan content",
    surface: "Social",
    updated: "Jun 23, 2026",
    description:
      "Draft a week of posts in your brand voice, size them per platform, pick the slots from what has performed before, and load the lot into next week's calendar.",
  },
  {
    slug: "caption-pass",
    category: "Plan content",
    surface: "Social",
    updated: "Jun 18, 2026",
    description:
      "Rewrite the captions across a set of posts for one platform's tone and length, keeping the hook and the call to action intact.",
  },
  {
    slug: "trend-to-post",
    category: "Plan content",
    surface: "Studio",
    updated: "Jul 2, 2026",
    description:
      "Scan the trends in your niche and turn the ones that fit your brand into post ideas — each with a ready-made hook and a matching design to go with it.",
  },
  {
    slug: "ad-variants",
    category: "Run ads",
    surface: "Ads",
    updated: "Jun 29, 2026",
    description:
      "Build fresh creative variants for a running campaign so nothing goes stale — same offer, new angles — and stage them ready to swap in.",
  },
  {
    slug: "policy-check",
    category: "Run ads",
    surface: "Performance",
    updated: "Jun 16, 2026",
    description:
      "Run new ads through Ad Guard before they go anywhere, and hold anything that would get knocked back with the specific rule it trips and what to change.",
  },
  {
    slug: "headline-test",
    category: "Run ads",
    surface: "Ads",
    updated: "Jul 6, 2026",
    description:
      "Write five headline variants against one creative, each on a different angle, and set them up as a test rather than a guess.",
  },
  {
    slug: "creative-score",
    category: "Study performance",
    surface: "Performance",
    updated: "Jun 20, 2026",
    description:
      "Score a creative out of 100 before it runs and list the priority fixes while there is still time to make them — hook, clarity, contrast, call to action.",
  },
  {
    slug: "rival-brief",
    category: "Study performance",
    surface: "Performance",
    updated: "Jul 9, 2026",
    description:
      "Break down the ads your competitors are running and brief you on the angles they are testing, what is new this week, and where the gap is.",
  },
  {
    slug: "shelf-ready",
    category: "Prep products",
    surface: "Product",
    updated: "Jun 16, 2026",
    description:
      "Strip backgrounds, straighten and beautify a batch of product photos, check the set for framing and lighting that breaks with the rest, and file it ready to use.",
  },
  {
    slug: "model-shots",
    category: "Prep products",
    surface: "Product",
    updated: "Jul 1, 2026",
    description:
      "Generate ghost-mannequin and virtual-model versions of an apparel item, sized for your shop and your socials, from the flat photos you already have.",
  },
];

/** Who publishes these. One string so the byline cannot drift card to card. */
export const SKILL_AUTHOR = "Creative Klux";

/** Featured and browse skills as one list — what the browse modal searches. */
export const ALL_SKILLS = [
  ...FEATURED_SKILLS.map((s) => ({ ...s, featured: true })),
  ...SKILLS,
];

/**
 * The prompt a skill puts in the composer when it is activated.
 *
 * ⚠️ THE SLASH COMMAND IS THE PROMPT. Activating a skill drops `/slug ` into the
 * conversation and stops — it does not send. The user still has to say what to
 * run it ON ("/brand-audit this week's posts"), and a skill that fired the
 * moment it was clicked would run against nothing.
 */
export const skillPrompt = (slug) => `/${slug} `;

/** What "Create skill in chat" opens the conversation with. */
export const CREATE_SKILL_PROMPT =
  "Create a new skill for me. It should ";

// ── Which skills this workspace has added ───────────────────────────────────
// ⚠️ Same shape as the copilot store in ./copilots.js, and for the same reason:
// the browse modal's "Your workspace" tab and its "Suggested" tab are two views
// of one fact, and a `useState` per view would let them disagree the moment
// something is added. Slugs only — the catalog above is the source for the rest.

import { useSyncExternalStore } from "react";

let added = [];
const listeners = new Set();
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const snapshot = () => added;

/** Slugs this workspace has added. */
export function useAddedSkills() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function addSkill(slug) {
  if (added.includes(slug)) return;
  added = [...added, slug];
  listeners.forEach((fn) => fn());
}

export function removeSkill(slug) {
  added = added.filter((s) => s !== slug);
  listeners.forEach((fn) => fn());
}
