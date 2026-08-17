// app/(components)/home/homeSubheadings.js
// ─────────────────────────────────────────────────────────────────────────────
// The line UNDER the home hero's headline. A pool, one picked per page load —
// the same treatment homeGreetings.js gives the headline, so the two lines swap
// together and the hero is never twice the same on two visits.
//
// ⚠️ FLAT POOL, NO TIME BANDS — and that is the one way this deliberately
// differs from homeGreetings.js. The headline changes with the clock because a
// greeting is ABOUT the hour; this line is about what the product makes, and an
// ad is no more an afternoon thing than a morning one. Banding it would only
// hide four fifths of the copy behind a clock for no reason.
//
// ⚠️ EVERY LINE IS THREE PARTS: `lead`, `accent`, `tail` — the identical shape
// homeGreetings.js uses, because both lines render through the same markup and
// follow /copilot's heading: gray-900 with ONE blue-600 phrase inside it. Keep
// the accent to the phrase the line is really about (what gets MADE, or the
// promise being made about it), not to a stray adjective — it is the only
// emphasis in the line and it should land on the word worth remembering.
//
// ⚠️ EVERY LINE NAMES SOMETHING THIS PRODUCT ACTUALLY MAKES. Same rule as the
// starter chips in homeSuggestions.js, and for the same reason: ads, social
// posts, thumbnails, logos, posters, brand kits. A line promising websites or
// email campaigns writes a cheque the studios can't cash.
//
// ⚠️ KEEP EACH FULL LINE UNDER ~70 CHARACTERS. It renders at up to 19px and
// sits one line deep from `sm` up; past ~70 it wraps on desktop too and the
// hero's balance goes with it. Count `lead + accent + tail`.

import { windowIndex } from "./useRotatingIndex";
import { HOUR_MS } from "./homeGreetings";

/**
 * A subheading.
 *
 * ⚠️ NO TRAILING SPACE ON `lead`, and no leading space on `accent` — the space
 * between them is written into the JSX as `{" "}`, exactly as the headline does
 * it. The two lines render through near-identical markup, so a pool that spaced
 * itself differently from its neighbour would be a trap for whoever edits them
 * next. It does mean every line here needs a lead; a line wanting to OPEN on its
 * accent would leave a stray leading space, and should be reworded.
 *
 * @typedef  {Object} Subheading
 * @property {string} lead   Plain text before the accent. No trailing space.
 * @property {string} accent The phrase that takes blue-600.
 * @property {string} tail   Plain text after it.
 */

/**
 * The pool.
 *
 * ⚠️ INDEX 0 IS LOAD-BEARING — it is what the SERVER renders (see
 * FIRST_SUBHEADING below), so it is the line most likely to be read and the one
 * that has to be right for everybody. Reorder freely, but whatever ends up
 * first should be the broadest line in the list, not the cleverest.
 *
 * @type {Subheading[]}
 */
export const SUBHEADINGS = [
  {
    lead: "Turn any idea into",
    accent: "scroll-stopping",
    tail: " ads, social content, and designs.",
  },
  {
    lead: "One prompt, a",
    accent: "full set",
    tail: " of ads, posts, and designs.",
  },
  {
    lead: "Describe it once and watch it become a",
    accent: "finished design",
    tail: ".",
  },
  {
    lead: "Ads, posts, thumbnails and logos —",
    accent: "made in minutes",
    tail: ".",
  },
  {
    lead: "From",
    accent: "blank page",
    tail: " to on-brand campaign, without the wait.",
  },
  {
    lead: "Your brand's colours and fonts, on",
    accent: "everything you make",
    tail: ".",
  },
  {
    lead: "Social posts, ad creative, and",
    accent: "designs that convert",
    tail: ".",
  },
  {
    lead: "Import your site and get a",
    accent: "brand kit",
    tail: " in seconds.",
  },
  {
    lead: "Bring your brand and let AI do the",
    accent: "heavy lifting",
    tail: ".",
  },
  {
    lead: "Every format you need,",
    accent: "Instagram to LinkedIn",
    tail: ", in one place.",
  },
];

/**
 * The line to show right now — the hour picks it, exactly as it picks the
 * headline above. See the ⚠️ at the top of homeGreetings.js for why this is on
 * the clock rather than on the load.
 *
 * ⚠️ A DIFFERENT LENGTH from any one greeting band, which is worth keeping: pools
 * of the same size would pair the same two lines every time and the hero's two
 * rows would read as one rotating unit rather than two.
 *
 * ⚠️ Call from a useState INITIALISER, not the render body — it reads the clock.
 *
 * @param {Date} [date]  Injectable so this stays testable.
 * @returns {Subheading}
 */
export function subheadingForNow(date = new Date()) {
  return SUBHEADINGS[windowIndex(SUBHEADINGS.length, HOUR_MS, date.getTime())];
}
