// app/(components)/home/homeSuggestions.js
// ─────────────────────────────────────────────────────────────────────────────
// The starter prompts under the home composer — the "Not sure where to start?"
// row.
//
// One pool PER TAB, because the tab already says HOW the work starts, and that
// changes what a useful starting line even looks like: Ai Chat starts from a
// description, Import Site starts from a link the user pastes, Brand Kit starts
// from the brand already seeded in the box. A single shared list would be wrong
// on two tabs out of three.
//
// ⚠️ Every line is something THIS PRODUCT MAKES — an ad, a post, a poster, a
// brand asset. The pools used to offer "Booking site for a barber shop" and
// "Route app for a delivery driver", which described a website builder rather
// than Creative Klux; a chip that asks for something the app doesn't produce is
// worse than no chip at all.
//
// Each pool is deliberately longer than the five that show at once. The shuffle
// control walks a window through it (see nextSuggestions below) rather than
// picking at random — random would differ between the server render and the
// client's, and React would tear the row down and rebuild it on hydration.

import { TAB_BRAND, TAB_MOBILE, TAB_WEB } from "./homeComposerTabs";

/** How many chips are on screen at once. */
export const SUGGESTIONS_VISIBLE = 5;

/**
 * The pools.
 *
 * ⚠️ EVERY LINE STAYS UNDER ~32 CHARACTERS, and that is a layout rule, not a
 * style preference. The chips are one centred, wrapping row inside the
 * composer's own width, so where the row breaks is decided by how wide the copy
 * is: five lines of about thirty characters settle as three chips and then two,
 * which is the balanced arrangement you see on the Ai Chat tab. Let one line run
 * to forty and that tab alone breaks 2/2/1 or 2/3, and the tabs stop matching
 * each other.
 *
 * The ceiling applies to ALL TEN in a pool, not just the first five — the
 * shuffle walks a window through the list, so any line can end up on screen with
 * any other four.
 *
 * Short copy is the right shape for these anyway: they are prompts to START
 * from, and a sentence long enough to wrap stops reading as a suggestion and
 * starts reading as an example.
 */
const SUGGESTIONS_BY_TAB = {
  // Ai Chat — nothing has been given to the app yet, so these are plain briefs:
  // one creative, named by what it is and what it's for.
  [TAB_WEB]: [
    "Instagram post for a sale",
    "Product ad for a new launch",
    "Flyer for a weekend event",
    "YouTube thumbnail for a video",
    "Poster for a live show",
    "Logo for a coffee brand",
    "Facebook ad for a discount",
    "Business card for my team",
    "Story ad for a new product",
    "Menu design for a cafe",
  ],
  // Import Site — the box is waiting for a LINK, so every line here says what to
  // make FROM that site. They read as the half-sentence that follows the URL,
  // which is also why none of them is a pretend link: a fake https:// in the box
  // is something the user has to delete before they can paste their own.
  //
  // ⚠️ Picking one REPLACES the box (see handleSuggestionPick on the home page),
  // so a chip clicked after a link is pasted takes the link with it. That is the
  // same rule on all three tabs; if it ever bites here, the fix is to append on
  // this tab, not to soften the copy.
  [TAB_MOBILE]: [
    "Ads from my homepage",
    "Social posts from my site",
    "Banner in my site's colours",
    "Brand kit from my website",
    "Flyer that matches my site",
    "Product ad from my shop page",
    "Email header from my site",
    "Stories in my site's style",
    "Ad copy from my landing page",
    "Deck cover from my website",
  ],
  // Brand Kit — the brand's details are already seeded in the box, so these say
  // what to make WITH them rather than restating the brand.
  [TAB_BRAND]: [
    "Launch campaign in my colours",
    "Instagram carousel about us",
    "One-page media kit for us",
    "Product ad in my palette",
    "Email headers matching my logo",
    "Story templates in my fonts",
    "Pitch deck cover for my brand",
    "Poster for our next promotion",
    "Banners for every channel",
    "Hiring post that looks like us",
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
