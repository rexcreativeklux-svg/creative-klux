// app/(components)/studio/templatesApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Data layer for the rail under the Studio composer (home page). THREE tabs
// over TWO live sources, one card contract — the tab row picks between them:
//
//   "recent" → the signed-in brand's own saved designs, via AuthContext's
//              fetchDesigns(). Private, needs a token AND an active brand.
//   "klux"   → the public Scraive template pool (the endpoint below).
//   "chats"  → past AI-chat sessions. NO SOURCE YET — the backend has no
//              endpoint for it, so the tab renders an empty state and nothing
//              is fetched. See CHAT_HISTORY_STATE for where it plugs in.
//
// Both are mapped onto the SAME normalized shape so TemplatesSection, the card
// and the details modal never branch on where a row came from — except through
// `kind` ("design" | "template"), which is what the modal uses to say "Open in
// editor" instead of "Use this template".
//
// ── THE PUBLIC TEMPLATE ENDPOINT ────────────────────────────────────────────
//   POST https://api.scraive.com/api/design-templates/public-template-fetch
//   body { "type": "image" }            ← required; an empty body returns []
//   →    { "designs": [ …~20 rows… ] }
//
// Verified against the live endpoint (2026-07-25, re-probed 2026-08-05):
//   • It is PUBLIC — no bearer token needed. One is still forwarded when the
//     caller has it, matching AuthContext's sibling call to /public-fetch.
//   • It takes NO filters and NO pagination. `design_type`, `sub_category`,
//     `num_template`, `limit`, `page` and `slug` are all accepted and then
//     ignored: every call returns exactly 20 rows and nothing else moves.
//   • Those 20 are a RANDOM SAMPLE, not the whole library. 20 successive draws
//     turned up 178 distinct slugs and were still finding new ones, so the pool
//     is ~200+ and any one template appears in a given draw roughly 1 time in
//     10. The rail doesn't care — it shows a random 12 by design — but it means
//     the pool CANNOT be used to look a template up (see fetchTemplateBySlug).
//   So the Klux tab fetches ONCE; there is nothing to re-query, and the rail
//   sorts what arrived (newest first, see byNewest) rather than showing it in
//   whatever order the endpoint shuffled it into.
//
// ── THE ROWS ────────────────────────────────────────────────────────────────
// A template row carries the full design layout (`canvas` + `elements`), the
// same shape the editor and the chat page paint through renderDesignToCanvas().
// It also carries a `thumbnail`, but that is just the URL of one photo used
// INSIDE the design — not a preview of it — so the card renders the layout
// itself rather than trusting that field.
//
// It ALSO carries `s3_key`, which is what makes share links work: the same
// layout sits on the CDN as a public ~2 KB JSON object addressed by slug. See
// TEMPLATE_OBJECT_PREFIX / fetchTemplateBySlug below.
//
// A saved-design row is close but not identical: its `canvas` is a JSON STRING
// holding `{ canvas, elements }`, and it has no `type_size` / `orientation` /
// `pricing`, so normalizeDesign() derives those from the canvas instead.

/**
 * The rail's tabs. The first two have a real source behind them (see the
 * header); "chats" does NOT yet — the backend has no chat-history endpoint, so
 * that tab deliberately renders an empty state. See CHAT_HISTORY_STATE below
 * for where the fetch plugs in once the endpoint exists.
 *
 * @type {{id: string, label: string}[]}
 */
export const TEMPLATE_TABS = [
  { id: "klux", label: "Templates" },
  { id: "recent", label: "Recent Saved Designs" },
  { id: "chats", label: "Chat History" },
];

/** Tab ids, so callers don't repeat the string literals. */
export const TAB_RECENT = "recent";
export const TAB_KLUX = "klux";
export const TAB_CHATS = "chats";

/**
 * The Chat History tab's stand-in slice.
 *
 * There is no endpoint for past AI-chat sessions yet, so this tab is wired up
 * end to end — tab button, empty panel, "Browse all" suppressed — around a
 * source that is permanently empty rather than being left out of the rail. That
 * way turning it on is a one-place change instead of a re-layout.
 *
 * ⚠️ WHEN THE ENDPOINT LANDS: a chat row is NOT a design. It has no
 * `canvas`/`elements`, so it cannot go through the painting TemplateCard the
 * other two tabs use — it needs its own card (title, last message, timestamp,
 * a link into /studio/ai-chat-page) and its own normalizer alongside
 * normalizeTemplate() / normalizeDesign(). Replace this constant with a
 * fetchChatHistory() written to the same never-rejects contract as
 * fetchRecentDesigns(), and give the rail a branch for `kind: "chat"`.
 *
 * @type {{status: "ok", items: object[]}}
 */
export const CHAT_HISTORY_STATE = { status: "ok", items: [] };

/**
 * Query param that deep-links one template's details modal, e.g. `/?template=
 * qfyilyfgbf1ggnetbk48-1784731443-gqi9`. The rail reads it on mount and opens
 * the matching card; the modal's "Copy link" writes it. The value is the row's
 * `slug` (stable and shareable), with the numeric id accepted as a fallback.
 */
export const TEMPLATE_PARAM = "template";

/**
 * The OPTIONAL companions to `?template=`, written by buildTemplateShareQuery()
 * and read back by readTemplateShareLink().
 *
 * A shared link is resolved through the CDN object (see fetchTemplateBySlug),
 * and that object holds ONLY the layout — `{ canvas, elements }`. Dimensions,
 * orientation and layer count fall out of the layout itself, but four things
 * cannot be derived from it, so they ride in the URL instead:
 *
 *   name   → the template's title, for the modal heading
 *   format → raw `sub_category` ("instagram_portrait"). This one does real
 *            work: "Save to Designs" sends it as `sub_type`, so it decides
 *            which filter tab the copy lands in on /creatives.
 *   kind   → raw `design_type` ("ads" | "social" | "designer"), sent as the
 *            saved copy's creative type.
 *   tier   → "free" | "premium", for the badge and the Access spec row.
 *
 * Every one of them is optional and none is trusted for anything but display
 * and filing. A link with them stripped (or an older/hand-made link that never
 * had them) still resolves and still paints the right design — it just shows a
 * generic title and fewer spec rows.
 */
export const SHARE_PARAM_NAME = "name";
export const SHARE_PARAM_FORMAT = "format";
export const SHARE_PARAM_KIND = "kind";
export const SHARE_PARAM_TIER = "tier";

/** The public template pool. Absolute — this one lives on Scraive, not our API. */
export const PUBLIC_TEMPLATES_ENDPOINT =
  "https://api.scraive.com/api/design-templates/public-template-fetch";

/**
 * CDN the app serves its media from. Mirrors src/(lib)/magic-studio-api.js and
 * src/(lib)/product-studio-api.js — same host, same env override.
 */
const CDN_BASE = (
  process.env.NEXT_PUBLIC_CDN_URL || "https://d3r8chxzp8ea06.cloudfront.net"
).replace(/\/+$/, "");

/**
 * Object-key prefix every public template's layout is stored under.
 *
 * Each pool row carries its full key on `s3_key`, and it is ALWAYS
 * `scraive/templates/30/<slug>.json` — verified across 87 distinct templates on
 * 2026-08-05, every one of them published by the same account (user 30 /
 * workspace 36), which is the whole public library.
 *
 * This is what makes a shared link exact instead of a lottery. The pool
 * endpoint answers 20 random rows out of ~200 and takes no filters, so looking
 * a slug up there lands about 1 time in 10; the object below is a direct hit —
 * ~2 KB, public, no token.
 *
 * ⚠️ It is NOT fetchable from the browser, however tempting that looks. S3
 * only sends `Access-Control-Allow-Origin` when the request carries an `Origin`
 * header, and CloudFront caches whichever variant it saw first — so an edge
 * holding a header-less copy fails CORS in the browser ("200 OK" that fetch
 * still rejects) while the very same URL succeeds from curl or Node, and it can
 * flip when a cache entry expires. The read goes through our own
 * /api/template-layout route instead, which does it server-side where CORS
 * doesn't apply. See templateLayoutPath().
 *
 * If Scraive ever publishes from a second account, the derived key 404/403s for
 * those templates and fetchTemplateBySlug() reports "not-found" — the user is
 * told the link is unavailable rather than being dropped on a blank page.
 */
const TEMPLATE_OBJECT_PREFIX = "scraive/templates/30";

/**
 * Where one template's layout lives on the CDN. For the API route that reads it
 * server-side — from the browser, use templateLayoutPath().
 *
 * @param {string} slug
 * @returns {string}
 */
export function templateLayoutUrl(slug) {
  const safe = encodeURIComponent(String(slug).trim());
  return `${CDN_BASE}/${TEMPLATE_OBJECT_PREFIX}/${safe}.json`;
}

/**
 * Same-origin path the browser reads one template's layout from — our route
 * handler, which fetches the CDN object above on the server.
 *
 * @param {string} slug
 * @returns {string}
 */
export function templateLayoutPath(slug) {
  return `/api/template-layout?slug=${encodeURIComponent(String(slug).trim())}`;
}

/** The only body the endpoint acts on. `image` is the design (non-video) library. */
const REQUEST_BODY = { type: "image" };

/** How many cards the rail renders. The pool is ~20; each card paints a canvas. */
export const TEMPLATE_DISPLAY_LIMIT = 12;

/**
 * How many saved designs to ask for. Fetching a few more than the rail shows
 * costs nothing extra (one page) and leaves room for rows dropped as unpaintable.
 */
export const RECENT_DESIGNS_FETCH_LIMIT = 20;

/** Pull the first present value from a list of candidate keys. */
const pick = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

/** "instagram_portrait" → "Instagram portrait". */
const humanize = (value) =>
  typeof value === "string" && value
    ? value.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase())
    : null;

/**
 * Parse a layout that may arrive as an object or as a JSON string, on any of the
 * keys this backend has used. Returns { canvas, elements } or null.
 */
function readLayout(row) {
  let layout = row?.canvas ?? row?.design ?? row?.data ?? null;

  if (typeof layout === "string") {
    try {
      layout = JSON.parse(layout);
    } catch {
      return null;
    }
  }
  if (!layout || typeof layout !== "object") return null;

  // Either { canvas: {...}, elements: [...] } or a bare canvas spec alongside a
  // sibling `elements` array on the row itself (the shape this endpoint sends).
  const canvas = layout.canvas ?? (layout.width && layout.height ? layout : null);
  const elements = Array.isArray(layout.elements)
    ? layout.elements
    : Array.isArray(row?.elements)
      ? row.elements
      : [];

  if (!canvas || !elements.length) return null;
  return { canvas, elements };
}

/**
 * Map ONE raw row onto the contract the card renders. Rows without a usable
 * layout return null so the caller can drop them — a card with nothing to paint
 * is worse than one card fewer.
 *
 * Card contract:
 *   { id, title, subtitle, meta, premium, thumbnail, canvas, elements, href }
 * plus the spec block the details modal reads:
 *   { slug, format, category, designType, orientation, mediaType, typeSize,
 *     createdAt, updatedAt }
 *
 * @param {Record<string, unknown>} raw
 * @param {number} index Positional fallback for a missing id.
 * @returns {object|null}
 */
export function normalizeTemplate(raw, index = 0) {
  const row = raw && typeof raw === "object" ? raw : {};
  const layout = readLayout(row);
  if (!layout) return null;

  const size = pick(row, ["type_size"]);
  const category = humanize(pick(row, ["sub_category", "category"]));

  return {
    id: String(pick(row, ["id", "uuid", "_id", "slug"]) ?? `template-${index}`),
    title: String(pick(row, ["name", "title", "design_name", "label"]) ?? "Untitled"),
    // Stands in for an author, which this endpoint doesn't send: the format is
    // the genuinely useful second line on a template card.
    subtitle: [category, size].filter(Boolean).join(" · ") || null,
    meta: pick(row, ["updated_at", "created_at", "modified_at", "date"]),
    premium: String(pick(row, ["pricing"]) ?? "").toLowerCase() === "premium",
    // Kept only as a last-resort image; the card paints `canvas`/`elements`.
    thumbnail: pick(row, ["thumbnail", "thumbnail_url", "preview", "preview_url"]),
    canvas: layout.canvas,
    elements: layout.elements,
    href: pick(row, ["href", "url", "link", "permalink"]),

    // ── Specs ─────────────────────────────────────────────────────────────
    // The card only ever shows `subtitle`; these are for TemplateDetailsModal,
    // which both lists them and writes its summary sentence from them. Kept
    // humanized here (one place) so no consumer has to re-format "social_
    // contents" → "Social contents" on its own.
    slug: pick(row, ["slug"]),
    format: humanize(pick(row, ["sub_category"])),
    // The un-humanized value, kept because saving a template back as a design
    // sends it as `sub_type` — the backend stores "instagram_portrait", not
    // "Instagram portrait".
    formatKey: pick(row, ["sub_category"]),
    category: humanize(pick(row, ["category"])),
    designType: humanize(pick(row, ["design_type"])),
    orientation: humanize(pick(row, ["orientation"])),
    mediaType: humanize(pick(row, ["type"])),
    typeSize: size,
    createdAt: pick(row, ["created_at"]),
    updatedAt: pick(row, ["updated_at", "modified_at"]),

    // Which source this row came from — the modal's only branch point.
    kind: "template",
    pricing: String(pick(row, ["pricing"]) ?? "").toLowerCase() || null,
  };
}

/** Portrait / Landscape / Square from the canvas, since designs don't send it. */
function orientationOf(canvas) {
  const width = Number(canvas?.width);
  const height = Number(canvas?.height);
  if (!width || !height) return null;
  if (width === height) return "Square";
  return height > width ? "Portrait" : "Landscape";
}

/**
 * Map ONE saved-design row (AuthContext.fetchDesigns) onto the SAME card
 * contract normalizeTemplate() produces, so the rail, the card and the details
 * modal treat both sources identically.
 *
 * Differences from a template row, all handled here:
 *   • `canvas` is a JSON string of `{ canvas, elements }` — readLayout() parses it.
 *   • No `type_size` / `orientation` / `pricing` — derived from the canvas, or
 *     left null so the modal simply omits those rows.
 *   • It HAS a real destination: `/design/<id>` opens it in the editor, which the
 *     home page follows through `item.href`.
 *
 * Rows with no usable layout (image-only Magic Studio output, for instance)
 * return null — the card has nothing to paint.
 *
 * @param {Record<string, unknown>} raw
 * @param {number} index Positional fallback for a missing id.
 * @returns {object|null}
 */
export function normalizeDesign(raw, index = 0) {
  const row = raw && typeof raw === "object" ? raw : {};
  const layout = readLayout(row);
  if (!layout) return null;

  const id = String(pick(row, ["id", "uuid", "_id"]) ?? `design-${index}`);
  const width = Math.round(Number(layout.canvas?.width) || 0);
  const height = Math.round(Number(layout.canvas?.height) || 0);
  const size = width && height ? `${width}x${height}` : null;
  // Designs label themselves with sub_type ("instagram_portrait") when they have
  // one and fall back to the broader `type` ("ads", "social", "image").
  const format = humanize(pick(row, ["sub_type", "sub_category"]));

  return {
    id,
    title: String(pick(row, ["name", "title", "design_name"]) ?? "Untitled design"),
    subtitle: [format, size].filter(Boolean).join(" · ") || null,
    meta: pick(row, ["updated_at", "created_at", "modified_at", "date"]),
    premium: false,
    thumbnail: pick(row, ["image_url", "thumbnail", "thumbnail_url", "preview_url"]),
    canvas: layout.canvas,
    elements: layout.elements,
    // The design editor, opened straight from the modal's primary button.
    href: `/design/${id}`,

    slug: null,
    format,
    formatKey: pick(row, ["sub_type", "sub_category"]),
    // A design's `type` IS its category ("ads", "social", "image") — the same
    // reading /creatives takes. It has no design_type and nothing that means
    // "media", so those stay null and the modal simply omits their rows rather
    // than repeating the category under three different labels.
    category: humanize(pick(row, ["category", "type"])),
    designType: humanize(pick(row, ["design_type"])),
    orientation: orientationOf(layout.canvas),
    mediaType: null,
    typeSize: size,
    createdAt: pick(row, ["created_at"]),
    updatedAt: pick(row, ["updated_at", "modified_at"]),

    kind: "design",
    pricing: null, // your own design is neither "free" nor "premium"
  };
}

/**
 * Newest first, by whichever timestamp the row has.
 *
 * The id tiebreaker matters: the public pool was seeded in bulk, so most of it
 * shares a timestamp to the second. Without it, equal rows would keep the order
 * they arrived in — and this endpoint shuffles that on every call, so the rail
 * would reorder itself on each visit. Higher id = created later.
 */
const byNewest = (a, b) => {
  const byDate =
    new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  if (byDate) return byDate;
  return (Number(b.id) || 0) - (Number(a.id) || 0);
};

// ── "More like this" ────────────────────────────────────────────────────────
//
// The details modal ends on a small strip of sibling rows. There is no
// "related" endpoint — the pool takes no filters at all (see the header) — so
// the strip is picked LOCALLY out of rows the app already holds: the public
// pool for a template, the brand's own saved designs for a design. Nothing
// extra is fetched.

/** How many sibling cards the details modal shows under "More like this". */
export const RELATED_DISPLAY_LIMIT = 3;

/**
 * What makes two rows feel like siblings, heaviest signal first.
 *
 * `formatKey` ("instagram_portrait") outweighs everything else on purpose: it
 * is the one field a user actually shops by — asked for "more Instagram
 * templates", this is the field that answers. The rest only break ties.
 *
 * @type {{key: string, weight: number}[]}
 */
const RELATED_WEIGHTS = [
  { key: "formatKey", weight: 6 }, // instagram_portrait, facebook_cover …
  { key: "designType", weight: 3 }, // Ads / Social / Designer
  { key: "category", weight: 2 },
  { key: "orientation", weight: 1 },
  { key: "pricing", weight: 1 }, // free next to free, premium next to premium
];

/** Case- and whitespace-insensitive equality; a null on either side never matches. */
const sameField = (a, b) =>
  Boolean(a) && Boolean(b) && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

/**
 * How closely one candidate matches the open item, 0 = nothing in common.
 * Exported for the tie-break comment above and for anywhere else that wants to
 * rank rows against a reference row.
 *
 * @param {object} item      The open template or design.
 * @param {object} candidate A row from the same source.
 * @returns {number}
 */
export function relatednessScore(item, candidate) {
  let score = 0;
  for (const { key, weight } of RELATED_WEIGHTS) {
    if (sameField(item?.[key], candidate?.[key])) score += weight;
  }
  return score;
}

/**
 * Pick the sibling rows shown under an open item.
 *
 * Ranked by relatednessScore(), with the pool's existing order as the
 * tie-break — which is also what makes the "no real match" case behave the way
 * the design asks for. A zero-score tail keeps pool order, and the pool is
 * itself a random 20-of-~200 draw from the library (see the header), so an item
 * with nothing in common still gets three plausible cards rather than an empty
 * strip. Stable within a page load: no shuffling on re-render.
 *
 * @param {object|null} item        The open row; excluded from its own strip.
 * @param {object[]} pool           Rows from the SAME source as `item`.
 * @param {number} [limit]          How many to return.
 * @returns {object[]} Up to `limit` rows, best match first. Never null.
 */
export function pickRelatedItems(item, pool, limit = RELATED_DISPLAY_LIMIT) {
  if (!item || !Array.isArray(pool) || pool.length === 0) return [];

  // Both keys are checked: a shared template resolved off the CDN is keyed by
  // slug, so its id won't equal the pool row's numeric id even though it IS
  // that template — matching on either keeps it out of its own strip.
  const isSelf = (row) =>
    String(row.id) === String(item.id) ||
    (Boolean(item.slug) && Boolean(row.slug) && String(row.slug) === String(item.slug));

  const ranked = pool
    .filter((row) => row && !isSelf(row))
    .map((row, index) => ({ row, index, score: relatednessScore(item, row) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit);

  if (ranked.length > 0) {
    const matched = ranked.filter((entry) => entry.score > 0).length;
    console.log(
      `🔗 [templates] "${item.title}" → ${ranked.length} related card(s)` +
        (matched === ranked.length
          ? ""
          : ` (${ranked.length - matched} filled from the rest of the pool)`),
    );
  }

  return ranked.map((entry) => entry.row);
}

// ── Share links ─────────────────────────────────────────────────────────────
//
// A shared link is resolved ONLY by fetchTemplateBySlug() below. Searching the
// pool for the slug — which is what this module used to do — cannot work: the
// endpoint answers a random 20 of ~200 rows and takes no filters, so it holds
// any given slug about 1 time in 10.

/**
 * The query string one template is shared with — `template=<slug>` plus the
 * optional display/filing hints described on SHARE_PARAM_*. Returned WITHOUT a
 * leading "?" so the caller decides how to join it onto a URL.
 *
 * `designType` and `pricing` are lowercased back to the raw keys the backend
 * uses ("Social" → "social"): normalizeTemplate() humanizes them for display,
 * and a link should carry what the API speaks, not what the UI shows.
 *
 * @param {object} item A normalized template.
 * @returns {string}
 */
export function buildTemplateShareQuery(item) {
  const params = new URLSearchParams();
  params.set(TEMPLATE_PARAM, String(item?.slug || item?.id || ""));

  if (item?.title) params.set(SHARE_PARAM_NAME, item.title);
  if (item?.formatKey) params.set(SHARE_PARAM_FORMAT, String(item.formatKey));
  if (item?.designType)
    params.set(SHARE_PARAM_KIND, String(item.designType).toLowerCase());
  if (item?.pricing) params.set(SHARE_PARAM_TIER, String(item.pricing).toLowerCase());

  return params.toString();
}

/**
 * Read a share link back off a URL's query string.
 *
 * @param {string} search e.g. `window.location.search`.
 * @returns {{key: string, hints: {title: string|null, formatKey: string|null,
 *            designTypeKey: string|null, pricing: string|null}}|null}
 *   null when the URL carries no `?template=` at all.
 */
export function readTemplateShareLink(search) {
  const params = new URLSearchParams(search || "");
  const key = params.get(TEMPLATE_PARAM);
  if (!key) return null;

  return {
    key,
    hints: {
      title: params.get(SHARE_PARAM_NAME),
      formatKey: params.get(SHARE_PARAM_FORMAT),
      designTypeKey: params.get(SHARE_PARAM_KIND),
      pricing: params.get(SHARE_PARAM_TIER),
    },
  };
}

/**
 * Build a card-contract item from a CDN layout plus a share link's hints —
 * the cold-resolve counterpart to normalizeTemplate().
 *
 * Same shape, same keys, so the modal can't tell the two apart. What the CDN
 * object can't say is simply left null, and the modal drops empty spec rows by
 * itself: `category`, `mediaType` and the created/updated dates are never
 * present on this path.
 *
 * @param {object} args
 * @param {string} args.slug
 * @param {object} args.canvas
 * @param {object[]} args.elements
 * @param {object} [args.hints] From readTemplateShareLink().
 * @returns {object}
 */
export function buildTemplateFromLayout({ slug, canvas, elements, hints = {} }) {
  const width = Math.round(Number(canvas?.width) || 0);
  const height = Math.round(Number(canvas?.height) || 0);
  const size = width && height ? `${width}x${height}` : null;
  const format = humanize(hints.formatKey);
  const pricing = String(hints.pricing || "").toLowerCase() || null;

  return {
    id: String(slug),
    // The link is the only source of a title. Without it the modal still reads
    // sensibly — it just can't name the template.
    title: hints.title || "Klux template",
    subtitle: [format, size].filter(Boolean).join(" · ") || null,
    meta: null,
    premium: pricing === "premium",
    thumbnail: null,
    canvas,
    elements,
    href: null,

    slug: String(slug),
    format,
    formatKey: hints.formatKey || null,
    category: null,
    designType: humanize(hints.designTypeKey),
    orientation: orientationOf(canvas),
    mediaType: null,
    typeSize: size,
    createdAt: null,
    updatedAt: null,

    kind: "template",
    pricing,
  };
}

/**
 * Resolve ONE shared template by slug, exactly.
 *
 * Reads the template's own CDN object — through our /api/template-layout route,
 * because the browser can't reach the CDN directly (see TEMPLATE_OBJECT_PREFIX)
 * — rather than hunting for the slug in the pool: the pool is a random
 * 20-of-~200 sample with no filters and no pagination, so searching it is a
 * ~1-in-10 chance, while this is a single deterministic ~2 KB GET.
 *
 * Same never-rejects contract as fetchPublicTemplates():
 *   "ok"        → `item` is a card-contract template
 *   "not-found" → the slug isn't published (bad or retired link)
 *   "error"     → network/format problem; `message` is safe to show
 *
 * @param {object} opts
 * @param {string} opts.slug        The `?template=` value.
 * @param {object} [opts.hints]     From readTemplateShareLink().
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{status: "ok"|"not-found"|"error", item: object|null,
 *                    message?: string, messageForDevs?: string}>}
 */
export async function fetchTemplateBySlug({ slug, hints, signal } = {}) {
  const key = String(slug || "").trim();
  if (!key) {
    console.error("❌ [templates] fetchTemplateBySlug called without a slug");
    return {
      status: "error",
      item: null,
      message: "That template link is incomplete.",
      messageForDevs: "fetchTemplateBySlug called with an empty slug",
    };
  }

  const url = templateLayoutPath(key);

  try {
    console.log(`📡 [templates] resolving shared template "${key}" →`, url);
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });

    // The route normalises "no such object" (the bucket answers 403 for a
    // missing key, since it doesn't allow listing) into a plain 404.
    if (res.status === 403 || res.status === 404) {
      console.warn(`⚠️ [templates] no published template for "${key}" (HTTP ${res.status})`);
      return {
        status: "not-found",
        item: null,
        message: "That template isn't available any more.",
        messageForDevs: `HTTP ${res.status} for ${url}`,
      };
    }

    if (!res.ok) {
      console.error(`❌ [templates] shared template request failed: HTTP ${res.status}`);
      return {
        status: "error",
        item: null,
        message: "We couldn't open that template. Please try again.",
        messageForDevs: `HTTP ${res.status} for ${url}`,
      };
    }

    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      console.error("❌ [templates] shared template is not JSON:", text.slice(0, 200));
      return {
        status: "error",
        item: null,
        message: "We couldn't open that template. Please try again.",
        messageForDevs: `Non-JSON object at ${url}`,
      };
    }

    // The object is `{ canvas, elements }` — the same shape readLayout() already
    // understands, so both paths parse a layout through one function.
    const layout = readLayout(body);
    if (!layout) {
      console.error(`❌ [templates] shared template "${key}" has no usable layout`);
      return {
        status: "error",
        item: null,
        message: "That template can't be opened.",
        messageForDevs: `No canvas/elements in ${url}`,
      };
    }

    const item = buildTemplateFromLayout({ slug: key, ...layout, hints });
    console.log(
      `✅ [templates] resolved "${item.title}" (${layout.elements.length} layers) from the CDN`,
    );
    return { status: "ok", item };
  } catch (err) {
    // An abort is a normal unmount / superseded link, not a failure.
    if (err?.name === "AbortError") return { status: "ok", item: null };

    console.error("❌ [templates] shared template request threw:", err);
    return {
      status: "error",
      item: null,
      message: "Connection problem. Please check your network and try again.",
      messageForDevs: err?.message || String(err),
    };
  }
}

/**
 * Find the array of rows in the response body. This endpoint answers
 * `{ designs: [...] }`; the other shapes are tolerated so a backend tweak can't
 * blank the rail.
 */
function extractRows(body) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];

  const direct =
    body.designs ?? body.data ?? body.templates ?? body.items ?? body.results;
  if (Array.isArray(direct)) return direct;

  // Laravel paginator nested one level deeper.
  if (direct && typeof direct === "object") {
    const nested = direct.data ?? direct.designs ?? direct.templates ?? direct.items;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

/**
 * Load the public template pool.
 *
 * Resolves (never rejects) so a dead rail can't take the home page down — the
 * caller renders `status` directly:
 *   "ok"    → `items` holds normalized cards (possibly an empty list)
 *   "error" → `message` is safe to show, `messageForDevs` is console-only
 *
 * @param {object} [opts]
 * @param {string|null} [opts.token]  Forwarded when present; not required.
 * @param {AbortSignal} [opts.signal] Lets the caller cancel on unmount.
 * @returns {Promise<{status: "ok"|"error", items: object[],
 *                    message?: string, messageForDevs?: string}>}
 */
export async function fetchPublicTemplates({ token, signal } = {}) {
  try {
    console.log("📡 [templates] fetching public templates →", PUBLIC_TEMPLATES_ENDPOINT);
    const res = await fetch(PUBLIC_TEMPLATES_ENDPOINT, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(REQUEST_BODY),
    });

    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      console.error("❌ [templates] non-JSON response:", text.slice(0, 200));
      return {
        status: "error",
        items: [],
        message: "We couldn't load templates. Please try again.",
        messageForDevs: `Non-JSON response from ${PUBLIC_TEMPLATES_ENDPOINT}`,
      };
    }

    if (!res.ok) {
      const devMessage = body?.message || body?.error || `HTTP ${res.status}`;
      console.error("❌ [templates] request failed:", devMessage);
      return {
        status: "error",
        items: [],
        message: "We couldn't load templates. Please try again.",
        messageForDevs: devMessage,
      };
    }

    const rows = extractRows(body);
    // Sorted here, not by the endpoint — it answers in a random order, so the
    // rail would otherwise show a different twelve of the ~20 on every visit.
    const items = rows.map(normalizeTemplate).filter(Boolean).sort(byNewest);
    const dropped = rows.length - items.length;
    console.log(
      `✅ [templates] loaded ${items.length} template(s), newest first` +
        (dropped > 0 ? ` (${dropped} skipped — no usable layout)` : ""),
    );
    return { status: "ok", items };
  } catch (err) {
    // An abort is a normal unmount, not a failure — report an empty ok result so
    // the caller drops it silently.
    if (err?.name === "AbortError") return { status: "ok", items: [] };

    console.error("❌ [templates] request threw:", err);
    return {
      status: "error",
      items: [],
      message: "Connection problem. Please check your network and try again.",
      messageForDevs: err?.message || String(err),
    };
  }
}

/**
 * Load the signed-in brand's most recent saved designs for the "Recent designs"
 * tab, mapped onto the same card contract as the templates.
 *
 * Takes AuthContext's `fetchDesigns` as an argument rather than importing it:
 * this module stays plain data-layer code with no React dependency, and the
 * caller already holds the hook.
 *
 * fetchDesigns() answers null for every failure it handles itself (no token, no
 * active brand, bad JSON, non-2xx) and logs the reason, so null is reported here
 * as one user-safe error.
 *
 * Same never-rejects contract as fetchPublicTemplates().
 *
 * @param {object} opts
 * @param {(perPage: number, page: number) => Promise<object|null>} opts.fetchDesigns
 * @param {number} [opts.limit] How many rows to request.
 * @returns {Promise<{status: "ok"|"error", items: object[],
 *                    message?: string, messageForDevs?: string}>}
 */
export async function fetchRecentDesigns({
  fetchDesigns,
  limit = RECENT_DESIGNS_FETCH_LIMIT,
} = {}) {
  if (typeof fetchDesigns !== "function") {
    console.error("❌ [templates] fetchRecentDesigns called without fetchDesigns()");
    return {
      status: "error",
      items: [],
      message: "We couldn't load your designs. Please try again.",
      messageForDevs: "fetchDesigns was not provided",
    };
  }

  try {
    console.log(`📡 [templates] fetching up to ${limit} recent design(s)`);
    const result = await fetchDesigns(limit, 1);

    if (!result) {
      // fetchDesigns has already logged which of its guards tripped.
      return {
        status: "error",
        items: [],
        message: "We couldn't load your designs. Please try again.",
        messageForDevs: "fetchDesigns returned null",
      };
    }

    // Tolerate both the paginator object and a bare array, the same way every
    // other fetchDesigns caller in the app does.
    const rows = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : [];

    const items = rows.map(normalizeDesign).filter(Boolean).sort(byNewest);
    const dropped = rows.length - items.length;
    console.log(
      `✅ [templates] loaded ${items.length} recent design(s)` +
        (dropped > 0 ? ` (${dropped} skipped — no usable layout)` : ""),
    );
    return { status: "ok", items };
  } catch (err) {
    console.error("❌ [templates] recent designs request threw:", err);
    return {
      status: "error",
      items: [],
      message: "Connection problem. Please check your network and try again.",
      messageForDevs: err?.message || String(err),
    };
  }
}
