// app/(components)/home/homeComposerTabs.js
// ─────────────────────────────────────────────────────────────────────────────
// What the home hero's <ComposerTabs> strip offers, and what each tab does to
// the prompt box underneath it.
//
// Data only — no JSX — so the page, the tabs and anything that later wants the
// same three entry points all read from one list instead of restating the copy.
//
// ⚠️ NOTHING HERE TOUCHES SUBMIT. The selected tab is not yet part of the
// payload the composer hands to the page: it changes the placeholder, and (on
// the brand tab) seeds the prompt text. Wiring the selection into the request is
// a separate, deliberate step — see the note in (dashboard)/page.jsx.

import { Globe, Palette, Smartphone } from "lucide-react";

export const TAB_WEB = "web";
export const TAB_MOBILE = "mobile";
export const TAB_BRAND = "brand";

/**
 * The strip, left to right. `placeholder` is what the prompt box shows while
 * that tab is selected — the composer cross-fades between them, so these are
 * read on every switch rather than only at mount.
 */
export const HOME_COMPOSER_TABS = [
  {
    id: TAB_WEB,
    label: "Web App",
    icon: Globe,
    placeholder: "Describe your idea we will bring it to life..",
  },
  {
    id: TAB_MOBILE,
    label: "Mobile App",
    icon: Smartphone,
    placeholder: "Describe your mobile app idea, we'll bring it to life..",
  },
  {
    id: TAB_BRAND,
    label: "Active Brand",
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
 * The active brand written out as an editable block for the prompt box.
 *
 * Every field is optional on the API's brand record, so each row is included
 * ONLY when it actually has a value — a half-filled brand produces a short block
 * rather than a list of empty labels. If the brand has no name and no colours at
 * all there is nothing worth seeding, and this returns "" so the caller can say
 * so instead of pasting an empty heading.
 *
 * The trailing blank line is deliberate: the caret lands after it, so the user's
 * own instructions start on a fresh line under the details.
 *
 * @param {object|null|undefined} brand The `activeBrand` record from AuthContext.
 * @returns {string} The block, or "" when the brand has nothing to describe.
 */
export function buildBrandPrompt(brand) {
  if (!brand) return "";

  const rows = [
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

  if (rows.length === 0) {
    console.warn("⚠️ [home] active brand has no details to seed the prompt with");
    return "";
  }

  return `${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n`;
}
