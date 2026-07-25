// app/(components)/studio/designTemplates.js
// ─────────────────────────────────────────────────────────────────────────────
// Turning a "ready to create" chat reply into a design-template request.
//
// When the assistant has collected everything it needs it answers with
// `type: "create"` plus the brief it assembled:
//
//   {
//     "type": "create",
//     "collected":       { "num_variations": 1, "platform": "Instagram Story", … },
//     "generation_data": { "create_sub_type": "Instagram Story", "size": "1080x1920", … },
//     "meta":            { "platform": "Instagram Story", "size": "1080x1920", … }
//   }
//
// Those three objects overlap, and which one carries a given field varies by
// creative type — so buildTemplateQuery() reads them in priority order rather
// than trusting any single one.
//
// The resulting args feed AuthContext's existing `fetchDesignTemplates`, which
// POSTs to /design-templates/public-fetch. That function lowercases and
// underscores `category` into `sub_category` itself ("Instagram Story" →
// "instagram_story"), so it's passed here in its human form.
//
// `design_type` is deliberately NOT sent: this flow reports creative_type
// "general", which isn't one of the axis values the endpoint understands
// ("ads" / "social" / "designer"). Omitting it returns templates across all
// axes, filtered by size and sub-category alone.

/** The endpoint accepts between 1 and 9 templates per request. */
export const MIN_TEMPLATES = 1;
export const MAX_TEMPLATES = 9;

/** First non-empty value across a list of candidates. */
const firstOf = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "") ?? null;

/**
 * Clamp the user's requested variation count into the endpoint's 1–9 window.
 * Non-numeric input falls back to the minimum rather than throwing.
 *
 * @param {unknown} value
 * @returns {number}
 */
export function clampTemplateCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return MIN_TEMPLATES;
  return Math.min(MAX_TEMPLATES, Math.max(MIN_TEMPLATES, parsed));
}

/**
 * Map a `type: "create"` chat reply onto fetchDesignTemplates() arguments.
 *
 * @param {object} data The parsed chat response body.
 * @returns {{type: string, category: string, type_size: string, num_template: number}|null}
 *   null when the reply is missing the size/sub-category needed to query at all.
 */
export function buildTemplateQuery(data) {
  const collected = data?.collected || {};
  const generation = data?.generation_data || {};
  const meta = data?.meta || {};

  const category = firstOf(
    generation.create_sub_type,
    meta.platform_label,
    meta.platform,
    collected.platform,
  );

  const typeSize = firstOf(generation.size, meta.size, collected.size);

  if (!category || !typeSize) {
    console.warn(
      "⚠️ [templates] a create reply arrived without a platform/size — skipping the fetch",
      { category, typeSize },
    );
    return null;
  }

  return {
    // Every existing caller of fetchDesignTemplates queries the image library.
    type: "image",
    category: String(category),
    type_size: String(typeSize),
    num_template: clampTemplateCount(
      firstOf(collected.num_variations, generation.num_variations, meta.num_variations),
    ),
  };
}

/**
 * Normalise one raw template row into the {canvas, elements} shape the shared
 * renderDesignToCanvas() paints — the same shape the chat's generated
 * variations already use, so both render through one code path.
 *
 * The layout may arrive on `canvas`, `design` or `data`, and may be a JSON
 * string rather than an object; rows that carry no usable layout return null so
 * the caller can filter them out.
 *
 * @param {object} raw
 * @returns {{id: string, name: string, canvas: object, elements: object[], image: string|null}|null}
 */
export function normalizeDesignTemplate(raw) {
  let layout = raw?.canvas ?? raw?.design ?? raw?.data ?? raw;

  if (typeof layout === "string") {
    try {
      layout = JSON.parse(layout);
    } catch {
      return null;
    }
  }

  if (!layout?.canvas || !Array.isArray(layout.elements)) return null;

  return {
    id: String(
      raw?.id ??
        `tpl_${Math.round(layout.canvas.width)}x${Math.round(layout.canvas.height)}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,
    ),
    name: raw?.name || "Template",
    canvas: layout.canvas,
    elements: layout.elements,
    image: raw?.thumbnail || raw?.preview || raw?.image_url || null,
  };
}
