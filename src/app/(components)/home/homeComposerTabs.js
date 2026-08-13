// app/(components)/home/homeComposerTabs.js
// ─────────────────────────────────────────────────────────────────────────────
// What the home hero's <ComposerTabs> strip offers, and what each tab does to
// the prompt box underneath it.
//
// Data only — no JSX — so the page, the tabs and anything that later wants the
// same three entry points all read from one list instead of restating the copy.
//
// WHAT EACH TAB DOES, and where it does it:
//   Ai Chat      placeholder only — the prompt goes straight to the assistant.
//   Import Site  placeholder, AND a step BEFORE the assistant: submit sends the
//                link to /brands/import and hands the brand back as the opening
//                message. The three functions at the foot of this file are that
//                step; the page drives them in handleSubmit.
//   Brand Kit    placeholder, and seeds the prompt with the active brand.
//
// So the selected tab is part of submit for Import Site and nothing else. The
// other two still travel no further than the placeholder.

import { Globe, Palette, Sparkles } from "lucide-react";
// The chat API's own `message` cap — the Import Site block is built to fit it.
import { MAX_CHAT_MESSAGE } from "@/app/(components)/studio/attachmentUrls";

/** How much of a scraped "About" is worth sending, in characters. */
const MAX_ABOUT = 500;

export const TAB_WEB = "web";
// Was TAB_MOBILE = "mobile", from a "Mobile App" tab this strip no longer has.
// The id is state and a lookup key only — nothing persists it — so it was renamed
// to what the tab actually does now that submit branches on it.
export const TAB_IMPORT = "import";
export const TAB_BRAND = "brand";

/**
 * The strip, left to right. `placeholder` is what the prompt box shows while
 * that tab is selected — the composer cross-fades between them, so these are
 * read on every switch rather than only at mount.
 */
export const HOME_COMPOSER_TABS = [
  {
    id: TAB_WEB,
    label: "Ai Chat",
    icon: Sparkles,
    placeholder: "Describe your idea we will bring it to life..",
  },
  {
    id: TAB_IMPORT,
    label: "Import Site",
    icon: Globe,
    placeholder: "Paste your website link and we'll learn your brand…",
  },
  {
    id: TAB_BRAND,
    label: "Brand Kit",
    icon: Palette,
    placeholder: "Add anything else you want built around this brand..",
  },
];

/** The placeholder for a tab id, falling back to the first tab's. */
export const placeholderForTab = (tabId) =>
  (HOME_COMPOSER_TABS.find((tab) => tab.id === tabId) ?? HOME_COMPOSER_TABS[0])
    .placeholder;

/**
 * Colour values arrive from the API with stray backticks now and then — the same
 * cleanup /brand/edit does before it puts one in a swatch.
 * @param {unknown} value
 * @returns {string}
 */
const cleanColor = (value) =>
  typeof value === "string" ? value.replace(/`/g, "").trim() : "";

/** Trim anything into a usable single-line string, or "" if there's nothing. */
const cleanText = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

/**
 * The labelled rows a brand record is worth describing with, in reading order.
 * Every field is optional, so each row is included ONLY when it has a value — a
 * half-filled brand produces a short block rather than a list of empty labels.
 *
 * Shared by the Brand Kit tab's seed and the Import Site block below, so the two
 * describe a brand the same way and the assistant reads one format either way.
 *
 * @param {object} brand
 * @returns {[string, string][]}
 */
const brandRows = (brand) =>
  [
    ["Brand", cleanText(brand.name)],
    ["Tagline", cleanText(brand.tagline)],
    ["Industry", cleanText(brand.industry)],
    ["About", cleanText(brand.description)],
    ["Primary colour", cleanColor(brand.primary_color)],
    ["Secondary colour", cleanColor(brand.secondary_color)],
    // The API has spelled this both ways over time; /brand/edit reads the same
    // pair, so keep them in step if either ever goes away.
    ["Font", cleanText(brand.fonts || brand.font)],
    ["Website", cleanText(brand.url || brand.source_url)],
  ].filter(([, value]) => Boolean(value));

/** `[label, value]` pairs as "Label: value" lines. */
const renderRows = (rows) =>
  rows.map(([label, value]) => `${label}: ${value}`).join("\n");

/**
 * The active brand written out as an editable block for the prompt box.
 *
 * If the brand has no name and no colours at all there is nothing worth seeding,
 * and this returns "" so the caller can say so instead of pasting an empty
 * heading.
 *
 * The trailing blank line is deliberate: the caret lands after it, so the user's
 * own instructions start on a fresh line under the details.
 *
 * @param {object|null|undefined} brand The `activeBrand` record from AuthContext.
 * @returns {string} The block, or "" when the brand has nothing to describe.
 */
export function buildBrandPrompt(brand) {
  if (!brand) return "";

  const rows = brandRows(brand);

  if (rows.length === 0) {
    console.warn("⚠️ [home] active brand has no details to seed the prompt with");
    return "";
  }

  return `${renderRows(rows)}\n\n`;
}

// ─── Import Site ─────────────────────────────────────────────────────────────
// The Import Site tab takes a link, POSTs it to /brands/import (AuthContext's
// `sendUrl`) and hands what comes back to the assistant as the opening message.
// These three functions are that trip: read the link out of what was typed,
// normalise the API's brand record, and write it out for the chat.

/**
 * Pull the first thing that looks like a website out of a typed prompt, and
 * return the rest of the text with it removed.
 *
 * The box is free text, not a URL field — a starter chip appends a line under
 * whatever was pasted ("Make ads from this homepage"), and people paste bare
 * domains as often as full links. So this scans token by token rather than
 * trusting the whole string to be a URL, and puts `https://` on a bare domain
 * because the endpoint wants an absolute one.
 *
 * The last label must be two or more letters, which is what keeps "e.g." and
 * "3.5" from reading as domains.
 *
 * @param {string} text
 * @returns {{url: string|null, rest: string}} `rest` is everything else, trimmed.
 */
export function splitPromptUrl(text) {
  const tokens = String(text ?? "").split(/\s+/).filter(Boolean);

  for (let i = 0; i < tokens.length; i += 1) {
    // Trailing sentence punctuation is not part of the address.
    const token = tokens[i].replace(/[.,;:!?)\]]+$/, "");
    const absolute = /^https?:\/\/[^\s/]+\.[^\s/]+/i.test(token);
    const bare = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/\S*)?$/i.test(
      token,
    );
    if (!absolute && !bare) continue;

    const rest = [...tokens.slice(0, i), ...tokens.slice(i + 1)].join(" ").trim();
    return { url: absolute ? token : `https://${token}`, rest };
  }

  return { url: null, rest: String(text ?? "").trim() };
}

/**
 * Reshape /brands/import's payload into the same record `buildBrandPrompt`
 * reads, so an imported site and a saved brand are described identically.
 *
 * The endpoint has returned the brand under `data.data` and at the top level at
 * both times, and spells the logo three ways — /studio/create-from-url unwraps
 * exactly the same set, so keep the two in step.
 *
 * @param {object} payload The `data` off sendUrl's result.
 * @param {string} url The link that was imported — kept as the Website row when
 *   the site itself didn't report one.
 * @returns {{name: string, description: string, primary_color: string, logo: string|null, images: string[], url: string}}
 */
export function normalizeImportedBrand(payload, url) {
  const d = payload?.data || payload || {};
  const logo = d.logo || d.logo_url || d.logo?.url || null;

  return {
    ...d,
    logo: typeof logo === "string" ? logo : null,
    images: Array.isArray(d.images)
      ? d.images.filter((src) => typeof src === "string" && src)
      : [],
    url: cleanText(d.url || d.source_url) || url,
  };
}

/**
 * The imported brand written out as the opening message to the assistant.
 *
 * Led by a line saying where this came from, because the assistant is reading a
 * message the user appears to have typed — without it the block is a bare list
 * of fields with no ask attached. `extras` is whatever the user typed alongside
 * the link; when there was nothing, the block still has to end in an
 * instruction, so it falls back to asking for designs.
 *
 * ⚠️ THIS DOES NOT MAKE THE REPLY A `create`. The assistant answers `chat` until
 * it has a platform and a size (see buildTemplateQuery in designTemplates.js),
 * and neither of those is something a website can be scraped for — so the normal
 * outcome here is that it comes back asking which platform and size, with the
 * brand already known. That is the intended conversation, not a miss.
 *
 * @param {object} brand A record from normalizeImportedBrand.
 * @param {string} [extras] Anything the user typed besides the link.
 * @returns {string} The message, or "" when the import found nothing to describe.
 */
export function buildImportedSitePrompt(brand, extras = "") {
  const rows = [...brandRows(brand), ["Logo", cleanText(brand.logo)]]
    .filter(([, value]) => Boolean(value))
    // A scraped "About" can be the site's entire hero section. Long before it
    // threatens the message cap it stops being a brand description, so it's cut
    // here rather than left to the clamp below.
    .map(([label, value]) =>
      label === "About" && value.length > MAX_ABOUT
        ? [label, `${value.slice(0, MAX_ABOUT).trimEnd()}…`]
        : [label, value],
    );

  if (rows.length === 0) {
    console.warn("⚠️ [home] the import returned no brand details to send on");
    return "";
  }

  const head = "Here's my brand, imported from my website:\n\n";
  const tail = `\n\n${extras.trim() || "Create designs for this brand."}`;

  // The API's `message` is capped (MAX_CHAT_MESSAGE) and this message skips the
  // composer's own maxLength — it goes into the URL and is sent verbatim by the
  // chat page. The ask is the part that has to survive, so the DETAILS give way
  // to it rather than the other way round.
  const room = MAX_CHAT_MESSAGE - head.length - tail.length;
  let body = renderRows(rows);
  if (body.length > room) {
    console.warn(
      `⚠️ [home] imported details trimmed from ${body.length} to ${Math.max(0, room)} chars to fit the ${MAX_CHAT_MESSAGE}-char message cap`,
    );
    body = body.slice(0, Math.max(0, room)).trimEnd();
  }

  return `${head}${body}${tail}`.slice(0, MAX_CHAT_MESSAGE);
}
