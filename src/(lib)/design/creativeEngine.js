// creativeEngine.js
// ─────────────────────────────────────────────────────────────────────────────
// Single switch for which backend generates creatives across the whole app.
//
//   "redesign"      → POST /creatives/redesign       (Scraive templates)
//   "create-design" → POST /creatives/create-design  (same payload, no templates)
//
// Every creative flow — the AI chat, Create from URL and every Custom Creation
// form — goes through AuthContext.generateCustomCreative, which reads this flag
// and routes accordingly. Flip this one line to switch them all.
export const CREATIVE_ENGINE = "create-design";

/** Engines that build from Scraive templates (fetched before generating). */
export const usesTemplates = (engine = CREATIVE_ENGINE) => engine === "redesign";

/**
 * How many designs create-design builds when the caller doesn't say. The AI
 * chat sends the count the user asked for; the forms and Create from URL have
 * no count field, so they get this many (one request — see DESIGNS_PER_BATCH).
 */
export const DEFAULT_DESIGN_COUNT = 5;
