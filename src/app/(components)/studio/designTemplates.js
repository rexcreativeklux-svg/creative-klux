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
  const brand = data?.brand_details || {};
  const collected = data?.collected || {};
  const generation = data?.generation_data || {};
  const meta = data?.meta || {};

  // `brand_details` is what the live endpoint sends; the other three are older
  // shapes kept as fallbacks. Read in that order or a real reply loses to a
  // container that isn't there.
  //
  // ⚠️ brand_details.category ("instagram_square") IS the Scraive sub-category.
  // Its `create_sub_type` is NOT — that's the piece kind ("posts"), and putting
  // it here queries for a sub-category that doesn't exist, which is why it sits
  // below every other candidate rather than first.
  const category = firstOf(
    brand.category,
    generation.create_sub_type,
    meta.platform_label,
    meta.platform,
    collected.platform,
    brand.create_sub_type,
  );

  const typeSize = firstOf(
    brand.size,
    brand.type_size,
    brand.typeSize,
    generation.size,
    meta.size,
    collected.size,
  );

  if (!category || !typeSize) {
    // Logged with the whole reply, not just the two misses: when this fires the
    // question is always "then what DID it send?", and a create reply that
    // silently produces nothing is the hardest failure here to notice.
    console.warn(
      "⚠️ [templates] a create reply arrived without a platform/size — skipping the fetch",
      { category, typeSize, reply: data },
    );
    return null;
  }

  return {
    // Every existing caller of fetchDesignTemplates queries the image library.
    type: "image",
    category: String(category),
    type_size: String(typeSize),
    // Top-level `variations` is where the live endpoint puts the count the user
    // asked for ("4 versions" → 4). One template in, one design out, so this is
    // also how many designs come back.
    num_template: clampTemplateCount(
      firstOf(
        data?.variations,
        collected.num_variations,
        generation.num_variations,
        meta.num_variations,
      ),
    ),
  };
}

/**
 * Map a `type: "create"` chat reply onto the payload generateCustomCreative()
 * sends down the Scraive → /creatives/redesign path.
 *
 * TWO SOURCES OF TRUTH, deliberately ordered. The conversation says what to
 * MAKE and the brand record says who it is FOR, so anything the assistant
 * collected wins over the stored brand field: the user just said it out loud,
 * and a brand's saved tagline has no business overriding "make it about the
 * weekend sale". The brand only fills the gaps the chat never asked about.
 *
 * The shape mirrors what the studio forms send (see SocialImageForm's
 * handleGenerate). Only `creativeType`, `categoryType`, `templates` and
 * `generatedAt` are read positionally by generateCustomCreative — every other
 * key is swept into `brand_details` by it, so extra fields are additive rather
 * than breaking.
 *
 * @param {object} args
 * @param {object} args.data          The parsed chat response body.
 * @param {object} args.query         A buildTemplateQuery() result.
 * @param {object[]} args.templates   RAW Scraive rows (NOT normalised ones —
 *   the endpoint wants the layout in the shape it published).
 * @param {object} [args.brand]       The active brand record.
 * @param {string|number} args.brandId
 * @param {string} args.creativeType  The page's creative type ("general", …).
 * @param {string[]} [args.images]    Hosted image URLs from the chat message.
 * @returns {object} A generateCustomCreative payload.
 */
export function buildRedesignPayload({
  data,
  query,
  templates,
  brand,
  brandId,
  creativeType,
  images = [],
}) {
  // The chat already answers with a `brand_details` object — the SAME field
  // name /creatives/redesign nests its brief under. So it is forwarded whole
  // rather than copied key by key: the assistant collected audience,
  // campaignGoal, brandColor and the rest during the conversation, and
  // re-deriving those here would mean guessing at a shape the endpoint is
  // already handing us, and silently dropping any field it starts sending.
  const details = data?.brand_details || {};
  const collected = data?.collected || {};

  return {
    // The reply knows its own axis ("social"); the page's creative type is a
    // URL param that says "general" for every chat, which is not one of the
    // values the generator understands.
    creativeType: firstOf(details.creative_type, creativeType),
    categoryType: firstOf(details.create_sub_type, query.category),
    brand_id: brandId,

    // Everything the assistant gathered, verbatim.
    ...details,

    // Brand-record gap fills. These come AFTER the spread but only apply when
    // the reply left them empty — brandName arrives as "" in real replies, and
    // `firstOf` treats "" as absent for exactly this reason.
    brandName: firstOf(details.brandName, brand?.name, brand?.brand_name),
    logo: firstOf(details.logo, brand?.logo, collected.logo),
    description: firstOf(details.description, brand?.description),

    // The reply sends `platforms` as a bare string ("Instagram"); every form
    // sends it as an array and AdPreview / the publish flow read it as a list.
    // Normalised here so redesign gets one shape regardless of the caller.
    platforms: Array.isArray(details.platforms)
      ? details.platforms
      : details.platforms
        ? [details.platforms]
        : [],

    // Resolved from the query so they always agree with the templates that
    // were actually fetched, whatever the reply called them.
    size: query.type_size,
    type_size: query.type_size,
    category: String(query.category).toLowerCase().replace(/\s+/g, "_"),

    // Images attached to the user's message win; otherwise keep whatever the
    // assistant collected, rather than blanking it with an empty array.
    images: images.length ? images : Array.isArray(details.images) ? details.images : [],
    templates,
    generatedAt: new Date().toISOString(),
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

  // TWO SHAPES REACH THIS FUNCTION, and telling them apart matters:
  //
  //   • A WRAPPER — `{ canvas: { canvas, elements } }` — where the layout is
  //     nested one level down, sometimes as a JSON string.
  //   • A LIVE SCRAIVE ROW — where `canvas` IS the canvas spec
  //     ({width, height, background}) and `elements` is its SIBLING on the row.
  //
  // Assuming the wrapper unconditionally is what broke this: `raw.canvas` was
  // taken as the layout, `layout.canvas` came back undefined, and every real
  // template was discarded as unusable.
  let canvas = layout?.canvas ?? null;
  let elements = Array.isArray(layout?.elements) ? layout.elements : null;

  // No nested canvas, but this object measures itself → it IS the canvas spec,
  // so the elements live next to it on the row rather than inside it.
  if (!canvas && Number(layout?.width) && Number(layout?.height)) {
    canvas = layout;
    elements = Array.isArray(raw?.elements) ? raw.elements : null;
  }

  if (!canvas || !elements) return null;

  return {
    id: String(
      raw?.id ??
        `tpl_${Math.round(canvas.width)}x${Math.round(canvas.height)}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,
    ),
    name: raw?.name || "Template",
    canvas,
    elements,
    image: raw?.thumbnail || raw?.preview || raw?.image_url || null,
  };
}
