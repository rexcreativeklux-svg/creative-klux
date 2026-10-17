// creativeEngine.js
// ─────────────────────────────────────────────────────────────────────────────
// Single switch for which backend generates creatives across the whole app.
//
//   "redesign"      → POST /creatives/redesign       (Scraive templates)
//   "create-design" → POST /creatives/create-design  (same payload, no templates)
//
// Every creative form goes through AuthContext.generateCustomCreative, which
// reads this flag and routes accordingly. create-from-url defaults its engine
// to this flag too (its ?engine= query param still overrides per-visit).
//
// Flip this one line to switch every form — no other code needs to change.
export const CREATIVE_ENGINE = "redesign";

/** Engines that build from Scraive templates (fetched before generating). */
export const usesTemplates = (engine = CREATIVE_ENGINE) => engine === "redesign";
