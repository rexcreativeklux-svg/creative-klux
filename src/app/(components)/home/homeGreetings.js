// app/(components)/home/homeGreetings.js
// ─────────────────────────────────────────────────────────────────────────────
// The home hero's headline. Six time bands, several lines each, one picked per
// page load.
//
// This replaced a fixed "Good morning / afternoon / evening, <first name>."
// Three lines meant the hero said the same thing on nearly every visit, and the
// name made it a personalised greeting rather than an opening line — so the name
// is gone and the variety carries it instead.
//
// ⚠️ SIX BANDS, NOT THREE. The old split was the conversational one (noon, 5pm)
// and nothing else. These are narrower because the LINES need them to be:
// "Welcome back, night owl." is wrong at 9am and "Up before the algorithm." is
// wrong at 2am, where a plain "Good morning" was merely bland at both. Narrow
// bands are what let the copy be specific.
//
// ⚠️ EVERY LINE IS THREE PARTS: `lead`, `accent`, `tail`. The accent is the one
// phrase that takes blue-600 — the hero follows /copilot's heading, which blues
// a single phrase inside an otherwise gray-900 line (see the ⚠️ note on the <h1>
// in (dashboard)/page.jsx). Splitting the copy here rather than marking it up at
// the call site keeps the whole pool readable as sentences.
//
// ⚠️ KEEP EACH FULL LINE UNDER ~34 CHARACTERS. It renders at up to 40px inside
// max-w-5xl; past that it wraps to two lines, which pushes the composer down and
// costs the hero its balance. Count `lead + accent + tail`, not just the copy
// you're adding.
//
// ⚠️ NO LINE SENDS ANYONE TO BED. Someone opening this at 2am is working, and
// the headline should read as company rather than concern. That rule is why the
// late bands lean on night-owl pride rather than "still up?".

/**
 * A headline.
 *
 * @typedef  {Object} Greeting
 * @property {string} lead   Plain text before the accent.
 * @property {string} accent The phrase that takes blue-600.
 * @property {string} tail   Plain text after it — usually just the full stop.
 */

/**
 * The bands, in clock order. `from` is inclusive and each band runs until the
 * next one's `from`; the last wraps to midnight. Editing a boundary is editing
 * which lines someone can see, so move them with the copy in view.
 */
export const GREETING_BANDS = [
  {
    id: "lateNight", // 00:00–04:59
    from: 0,
    lines: [
      { lead: "Welcome back,", accent: "night owl", tail: "." },
      { lead: "Still burning the", accent: "midnight oil", tail: "." },
      { lead: "The", accent: "quiet hours", tail: " are yours." },
      { lead: "Working the", accent: "late shift", tail: "." },
      { lead: "Nobody around but", accent: "the good ideas", tail: "." },
    ],
  },
  {
    id: "earlyMorning", // 05:00–08:59
    from: 5,
    lines: [
      { lead: "Morning,", accent: "early bird", tail: "." },
      { lead: "First light,", accent: "first draft", tail: "." },
      { lead: "Up before the", accent: "algorithm", tail: "." },
      { lead: "The", accent: "early start", tail: " pays off." },
      { lead: "Quiet morning,", accent: "clear head", tail: "." },
    ],
  },
  {
    id: "morning", // 09:00–11:59
    from: 9,
    lines: [
      { lead: "Good morning,", accent: "creator", tail: "." },
      { lead: "Fresh page,", accent: "fresh ideas", tail: "." },
      { lead: "Morning. Let's", accent: "make something", tail: "." },
      { lead: "The day's", accent: "wide open", tail: "." },
      { lead: "Blank canvas,", accent: "full morning", tail: "." },
    ],
  },
  {
    id: "afternoon", // 12:00–16:59
    from: 12,
    lines: [
      { lead: "Good afternoon,", accent: "creator", tail: "." },
      { lead: "Riding the", accent: "afternoon momentum", tail: "." },
      { lead: "Still", accent: "shipping", tail: "." },
      { lead: "Halfway through. Keep", accent: "going", tail: "." },
      { lead: "Afternoon. What's", accent: "next", tail: "?" },
    ],
  },
  {
    id: "evening", // 17:00–20:59
    from: 17,
    lines: [
      { lead: "Good evening,", accent: "creator", tail: "." },
      { lead: "Golden hour,", accent: "golden ideas", tail: "." },
      { lead: "Evening. One more", accent: "good one", tail: "." },
      { lead: "Winding down or", accent: "just starting", tail: "?" },
      { lead: "The", accent: "best light", tail: " of the day." },
    ],
  },
  {
    id: "night", // 21:00–23:59
    from: 21,
    lines: [
      { lead: "Late, but", accent: "in the zone", tail: "." },
      { lead: "The best ideas come", accent: "after dark", tail: "." },
      { lead: "Evening shift,", accent: "full focus", tail: "." },
      { lead: "Day's done. Now the", accent: "fun part", tail: "." },
      { lead: "Hello,", accent: "night owl", tail: "." },
    ],
  },
];

/**
 * The band covering a 0–23 hour. Walks backwards so the first match is the
 * latest band that has started, which also makes 0–4 fall out of the loop
 * naturally rather than needing a wrap case.
 *
 * @param {number} hour
 * @returns {typeof GREETING_BANDS[number]}
 */
export function greetingBandForHour(hour) {
  for (let i = GREETING_BANDS.length - 1; i >= 0; i--) {
    if (hour >= GREETING_BANDS[i].from) return GREETING_BANDS[i];
  }
  return GREETING_BANDS[0];
}

/**
 * The band's first line. Deterministic, and that is the point: this is what
 * first paint uses, so the server's HTML and the client's first render agree.
 * Picking randomly here would mismatch on hydration.
 *
 * @param {number} hour
 * @returns {Greeting}
 */
export function firstGreetingForHour(hour) {
  return greetingBandForHour(hour).lines[0];
}

/**
 * A random line from the band. CLIENT-ONLY — call it from an effect, never
 * during render, for the reason above.
 *
 * @param {number} hour
 * @returns {Greeting}
 */
export function randomGreetingForHour(hour) {
  const { lines } = greetingBandForHour(hour);
  return lines[Math.floor(Math.random() * lines.length)];
}
