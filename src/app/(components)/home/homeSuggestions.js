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
// ⚠️ THE COPY AND THE PICK BEHAVIOUR ARE ONE DECISION, not two. Ai Chat's box is
// empty, so its chips are self-contained briefs and picking one REPLACES. The
// other two tabs have already put something in the box — a pasted URL, the
// seeded brand block — so their chips are written as instructions ABOUT that
// content ("…from this homepage", "…in this palette") and picking one APPENDS
// beneath it. A chip that reads "Make ads from this homepage" is nonsense on its
// own, and one that wipes the link the user just pasted is worse. See
// handleSuggestionPick in (dashboard)/page.jsx — change one, change both.
//
// ⚠️ Every line is something THIS PRODUCT MAKES — an ad, a post, a poster, a
// brand asset. The pools used to offer "Booking site for a barber shop" and
// "Route app for a delivery driver", which described a website builder rather
// than Creative Klux; a chip that asks for something the app doesn't produce is
// worse than no chip at all. The catalogue these are drawn from is CREATIVES in
// (pages)/studio/creatives.js — ads, social, designer, Magic Studio — and the
// platform names come from forms/social/socialSizes.js, so a chip never invents
// a format the studios can't fulfil.
//
// ⚠️ NAME A PLATFORM WHENEVER THE LINE HAS ROOM. This is not flavour: the
// assistant answers `chat` and keeps asking questions until it has BOTH a
// platform and a size (buildTemplateQuery in studio/designTemplates.js bails
// without them), so "Design a sale post for Instagram" lands a question closer
// to a finished design than "Design a sale post" does. Size is the one thing
// the chips leave out — it doesn't fit the character ceiling below, and it's
// the question users can answer instantly when asked.
//
// Each pool is deliberately longer than the five that show at once. The shuffle
// control walks a window through it (see nextSuggestions below) rather than
// picking at random — random would differ between the server render and the
// client's, and React would tear the row down and rebuild it on hydration.

import { TAB_BRAND, TAB_IMPORT, TAB_WEB } from "./homeComposerTabs";

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
  // Ai Chat — the box is empty and the placeholder asks the user to DESCRIBE an
  // idea, so every line is phrased as an instruction they could have typed into
  // the chat themselves: a verb, then the thing to make. Bare noun phrases
  // ("Instagram post for a sale") read as catalogue entries being picked off a
  // shelf, which is the wrong mental model for a tab whose whole promise is that
  // you can just ask.
  //
  // Picking one REPLACES the box — see handleSuggestionPick on the home page.
  // That is right here and only here: on this tab the chip IS the whole brief,
  // so a second click swaps the idea rather than stacking two unrelated ones.
  [TAB_WEB]: [
    "Design a sale post for Instagram",
    "Make a TikTok ad for a product",
    "Design a YouTube thumbnail",
    "Make a Facebook ad for 20% off",
    "Design a LinkedIn banner for us",
    "Make an Instagram story ad",
    "Design a logo for a coffee bar",
    "Make a flyer for a weekend sale",
    "Design a poster for a live show",
    "Make a Pinterest pin for a drop",
  ],
  // Import Site — the box is waiting for a LINK, so these are written to sit
  // UNDER one and point at it: "this" is the site the user just pasted. None of
  // them is a pretend URL, because a fake https:// in the box is something the
  // user has to delete before they can paste their own.
  //
  // ⚠️ Picking one APPENDS (see handleSuggestionPick) — it has to, or the chip
  // would delete the link the tab exists to collect. The wording depends on that:
  // "Make ads from this homepage" only means anything with the URL still above
  // it. If the pick behaviour is ever changed back to replace, this copy has to
  // change with it.
  [TAB_IMPORT]: [
    "Make ads from this homepage",
    "Turn this into Instagram posts",
    "Pull a brand kit from this site",
    "Make a Facebook ad from this",
    "Design a flyer to match this",
    "Turn this into story templates",
    "Make a LinkedIn banner from this",
    "Design a poster in these colours",
    "Make a product ad from this shop",
    "Design a deck cover from this",
  ],
  // Brand Kit — buildBrandPrompt has already written the brand's name, colours
  // and fonts into the box, so these say what to MAKE with them and never
  // restate them. "in this palette" is not vague here: the palette is listed
  // directly above the line.
  //
  // ⚠️ Also APPENDS, for the same reason — the seeded block is the entire point
  // of the tab. buildBrandPrompt's trailing blank line was written to leave room
  // for exactly this.
  [TAB_BRAND]: [
    "Create a launch campaign for us",
    "Design an Instagram post for us",
    "Make a YouTube thumbnail for us",
    "Design an ad in this palette",
    "Make Instagram story templates",
    "Design a LinkedIn cover for us",
    "Make a pitch deck cover",
    "Design business cards for us",
    "Make a poster for our promo",
    "Design a Facebook ad for us",
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
