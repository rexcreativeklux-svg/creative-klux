// creativeEngine.js
// ─────────────────────────────────────────────────────────────────────────────
// Single switch for which backend generates creatives across the whole app.
//
//   "involk"   → POST /design/generate-design/involk_llm   (LLM, from scratch)
//   "redesign" → POST /creatives/redesign                  (Scraive templates)
//
// Every creative form goes through AuthContext.generateCustomCreative, which
// reads this flag and routes accordingly. create-from-url defaults its engine
// to this flag too (its ?engine= query param still overrides per-visit).
//
// To send EVERYTHING back to the Scraive template pipeline, flip this one line
// to "redesign" — no other code needs to change.
export const CREATIVE_ENGINE = "redesign";
