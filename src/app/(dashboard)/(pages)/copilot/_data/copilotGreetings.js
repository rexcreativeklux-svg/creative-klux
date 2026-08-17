// app/(dashboard)/(pages)/copilot/_data/copilotGreetings.js
// ─────────────────────────────────────────────────────────────────────────────
// The two lines a new conversation opens with: the question under "Hey <name>,"
// and the line beneath it.
//
// ⚠️ THIS ROTATES ON THE CLOCK, NOT ON THE LOAD — and that is the one way it
// deliberately differs from the home hero (home/homeGreetings.js), which re-rolls
// randomly on every visit. A copilot's screen is somewhere you come back to
// several times an hour; copy that changed on every reload would flicker between
// personalities while you worked, and you would never finish reading a line
// before it was replaced. Once an hour is enough for the screen to feel alive
// and slow enough to feel like it is the same copilot each time.
//
// Because the pick is DERIVED from the hour rather than random, it is also
// identical on the server and the client — no effect, no second render. Only an
// hour boundary landing between the two can disagree, which is what the
// suppressHydrationWarning at the call site covers.
//
// ⚠️ EVERY LINE IS THREE PARTS: `lead`, `accent`, `tail`, the same shape the home
// hero uses, because both render through the same markup: gray-900 with ONE
// blue-600 phrase inside it. The accent should land on the phrase worth
// remembering, not on a stray adjective — it is the line's only emphasis.
//
// ⚠️ NO TRAILING SPACE ON `lead`, no leading space on `accent` — the space
// between them is written into the JSX as {" "}, exactly as home does it.
//
// ⚠️ EVERY LINE IS ABOUT HANDING WORK OVER, and names only work this product
// does — designs, posts, ads, product shots, brand kits. Same rule as
// home/homeSuggestions.js and the starter ideas in ./ideas.js: a line offering
// something the studios cannot make writes a cheque they cannot cash.
//
// ⚠️ KEEP EACH OPENER UNDER ~34 CHARACTERS (it renders at up to 40px, on its own
// line under the name) and each SUBHEADING under ~70. Past that they wrap and the
// hero's balance goes with them. Count lead + accent + tail.

import { windowIndex } from "@/app/(components)/home/useRotatingIndex";

/** One rotation window. The whole file's cadence lives in this one number. */
export const HOUR_MS = 3_600_000;

/**
 * @typedef  {Object} HeroLine
 * @property {string} lead   Plain text before the accent. No trailing space.
 * @property {string} accent The phrase that takes blue-600.
 * @property {string} tail   Plain text after it.
 */

/**
 * The question under "Hey <name>,".
 *
 * ⚠️ Every one of these is a QUESTION the user can answer by typing into the box
 * below it. "Here's what I can do." would be a statement in a place the screen
 * has already given to a prompt.
 *
 * @type {HeroLine[]}
 */
export const OPENERS = [
  { lead: "What can I", accent: "do for you", tail: " today?" },
  { lead: "What should we", accent: "get done", tail: "?" },
  { lead: "What's", accent: "on your plate", tail: "?" },
  { lead: "What do you want to", accent: "hand over", tail: "?" },
  { lead: "Where should we", accent: "start", tail: "?" },
  { lead: "What are we", accent: "making", tail: " today?" },
  { lead: "What can I", accent: "take off you", tail: "?" },
];

/**
 * The line under the question.
 *
 * ⚠️ Deliberately a DIFFERENT LENGTH from OPENERS above (5 against 7), so the
 * two lines do not move in lockstep — the same pairing would otherwise come back
 * every hour and the rotation would read as one line, not two.
 *
 * @type {HeroLine[]}
 */
export const SUBHEADINGS = [
  {
    lead: "Ask for something once, or set it to",
    accent: "run every week",
    tail: ".",
  },
  {
    lead: "Tell me the outcome and I'll",
    accent: "handle the steps",
    tail: ".",
  },
  {
    lead: "Everything I make comes out in your",
    accent: "brand's colors and fonts",
    tail: ".",
  },
  {
    lead: "Designs, posts, ads or product shots —",
    accent: "just say which",
    tail: ".",
  },
  {
    lead: "I'll bring the work back for your",
    accent: "review",
    tail: ", never straight out the door.",
  },
];

/**
 * The line this hour lands on.
 *
 * The window is `windowIndex` from home/useRotatingIndex — the app's one answer
 * to "which slot is the clock on?", already used by the home hero's backdrop and
 * now by the home headline too. Its two properties are exactly what is wanted
 * here: stable across reloads inside a window, and identical for every reader at
 * the same moment, since epoch milliseconds are UTC and no timezone enters it.
 *
 * ⚠️ Call from a useState INITIALISER, not the render body: it reads the clock,
 * so a render that called it directly would trip the purity rule (and re-pick on
 * every re-render). Once per mount is the intended cadence — a new conversation
 * is a new mount.
 *
 * @template {HeroLine} T
 * @param {T[]} pool
 * @param {number} [now]  Epoch ms; injectable so this stays testable.
 * @returns {T}
 */
export const lineForNow = (pool, now) =>
  pool[windowIndex(pool.length, HOUR_MS, now)];
