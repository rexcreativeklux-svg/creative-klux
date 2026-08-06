// app/(components)/home/homeSuggestions.js
// ─────────────────────────────────────────────────────────────────────────────
// The starter prompts under the home composer — the "Not sure where to start?"
// row.
//
// One pool PER TAB, because the tab already says what is being made: offering
// "Route app for a delivery driver" while the Mobile App tab is selected is a
// different suggestion from offering it under Active Brand, and a single shared
// list would be wrong on two tabs out of three.
//
// Each pool is deliberately longer than the five that show at once. The shuffle
// control walks a window through it (see nextSuggestions below) rather than
// picking at random — random would differ between the server render and the
// client's, and React would tear the row down and rebuild it on hydration.

import { TAB_BRAND, TAB_MOBILE, TAB_WEB } from "./homeComposerTabs";

/** How many chips are on screen at once. */
export const SUGGESTIONS_VISIBLE = 5;

/**
 * The pools. Keep every line short enough to sit on one row of a chip — these
 * are prompts to START from, and a sentence that wraps stops reading as a
 * suggestion and starts reading as an example.
 */
const SUGGESTIONS_BY_TAB = {
  [TAB_WEB]: [
    "Booking site for a barber shop",
    "Landing page for a fitness coach",
    "Menu site for a food truck",
    "Portfolio for an interior designer",
    "Client portal for an accountant",
    "Course page for a music teacher",
    "Quote request page for a roofer",
    "Storefront for a candle maker",
    "Event page for a wedding planner",
    "Membership site for a run club",
  ],
  [TAB_MOBILE]: [
    "Route app for a delivery driver",
    "Tip pool tracker for a restaurant manager",
    "Job tracker for a handyman",
    "Shot-list app for a wedding photographer",
    "Lead capture app for an event booth",
    "Shift swap app for a cafe team",
    "Inventory scanner for a boutique",
    "Progress log for a personal trainer",
    "Estimate builder for a landscaper",
    "Check-in app for a dental clinic",
  ],
  [TAB_BRAND]: [
    "A launch campaign in my brand colours",
    "Instagram carousel about what we do",
    "A one-page media kit for my brand",
    "Product ad using my brand palette",
    "Email header set that matches my logo",
    "Story templates in my brand fonts",
    "A pitch deck cover for my brand",
    "Poster for our next promotion",
    "Profile banners for every channel",
    "A hiring post that looks like us",
  ],
};

/**
 * The gradient dots, as whole class strings — Tailwind scans SOURCE TEXT, so a
 * gradient built from variables compiles to classes that were never generated
 * and every dot would come out plain.
 *
 * Cycled by position, not tied to a suggestion: the dot is decoration that keeps
 * the row from reading as a wall of grey pills, and pinning a colour to a line
 * of copy would only invite someone to look for a meaning that isn't there.
 */
const DOT_GRADIENTS = [
  "from-orange-300 to-pink-400",
  "from-emerald-300 to-green-500",
  "from-teal-300 to-emerald-400",
  "from-violet-400 to-teal-300",
  "from-purple-400 to-blue-400",
];

/** The dot gradient for a chip at this position in the row. */
export const dotGradient = (index) =>
  DOT_GRADIENTS[index % DOT_GRADIENTS.length];

/**
 * The five suggestions to show for a tab, starting `offset` items into its pool
 * and wrapping around the end.
 *
 * Wrapping is what lets the offset grow forever without the caller having to
 * reset it when the tab changes — an unknown tab or an offset past the end of a
 * shorter pool both land back at a real suggestion instead of on `undefined`.
 *
 * @param {string} tabId  One of HOME_COMPOSER_TABS' ids.
 * @param {number} offset How far the shuffle control has walked.
 * @returns {string[]} Exactly SUGGESTIONS_VISIBLE lines (fewer only if the pool
 *   itself is shorter than that).
 */
export function nextSuggestions(tabId, offset = 0) {
  const pool = SUGGESTIONS_BY_TAB[tabId] || SUGGESTIONS_BY_TAB[TAB_WEB];
  const count = Math.min(SUGGESTIONS_VISIBLE, pool.length);

  return Array.from(
    { length: count },
    (_, index) => pool[(offset + index) % pool.length],
  );
}
