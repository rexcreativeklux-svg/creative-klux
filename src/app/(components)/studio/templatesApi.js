// app/(components)/studio/templatesApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Data layer for the template rail under the Studio composer (home page).
//
// ── THE ENDPOINT ────────────────────────────────────────────────────────────
//   POST https://api.scraive.com/api/design-templates/public-template-fetch
//   body { "type": "image" }            ← required; an empty body returns []
//   →    { "designs": [ …~20 rows… ] }
//
// Verified against the live endpoint (2026-07-25):
//   • It is PUBLIC — no bearer token needed. One is still forwarded when the
//     caller has it, matching AuthContext's sibling call to /public-fetch.
//   • It takes NO other filters. `design_type`, `sub_category`, `num_template`
//     and `page` are all accepted and then ignored — every call returns the same
//     ~20-row public pool in a different random order. That is why the rail
//     fetches ONCE and the tab row above it is presentational only; wiring a tab
//     to this endpoint a second time would just re-shuffle the same cards.
//
// ── THE ROWS ────────────────────────────────────────────────────────────────
// Each row carries the full design layout (`canvas` + `elements`), the same
// shape the editor and the chat page paint through renderDesignToCanvas(). It
// also carries a `thumbnail`, but that is just the URL of one photo used INSIDE
// the design — not a preview of the design — so the card renders the layout
// itself rather than trusting that field.

/**
 * The rail's tabs. PRESENTATIONAL ONLY for now: every tab shows the same fetched
 * templates, because there is exactly one endpoint behind them (see above).
 * When per-tab endpoints land, give each tab its own `endpoint` and switch
 * fetchPublicTemplates() to take the tab id.
 * @type {{id: string, label: string}[]}
 */
export const TEMPLATE_TABS = [
  { id: "recent", label: "Recent designs" },
  { id: "community", label: "Community templates" },
  { id: "klux", label: "Klux templates" },
];

/**
 * Query param that deep-links one template's details modal, e.g. `/?template=
 * qfyilyfgbf1ggnetbk48-1784731443-gqi9`. The rail reads it on mount and opens
 * the matching card; the modal's "Copy link" writes it. The value is the row's
 * `slug` (stable and shareable), with the numeric id accepted as a fallback.
 */
export const TEMPLATE_PARAM = "template";

/** The public template pool. Absolute — this one lives on Scraive, not our API. */
export const PUBLIC_TEMPLATES_ENDPOINT =
  "https://api.scraive.com/api/design-templates/public-template-fetch";

/** The only body the endpoint acts on. `image` is the design (non-video) library. */
const REQUEST_BODY = { type: "image" };

/** How many cards the rail renders. The pool is ~20; each card paints a canvas. */
export const TEMPLATE_DISPLAY_LIMIT = 12;

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
    category: humanize(pick(row, ["category"])),
    designType: humanize(pick(row, ["design_type"])),
    orientation: humanize(pick(row, ["orientation"])),
    mediaType: humanize(pick(row, ["type"])),
    typeSize: size,
    createdAt: pick(row, ["created_at"]),
    updatedAt: pick(row, ["updated_at", "modified_at"]),
  };
}

/**
 * Find one template by the key a share link carries — the row's `slug`, with
 * the id accepted too so an older/hand-made link still resolves.
 *
 * @param {object[]} items Normalized templates.
 * @param {string} key The `?template=` value.
 * @returns {object|null}
 */
export function findTemplateByKey(items, key) {
  if (!key || !Array.isArray(items)) return null;
  const needle = String(key).toLowerCase();
  return (
    items.find(
      (item) =>
        String(item.slug ?? "").toLowerCase() === needle ||
        String(item.id ?? "").toLowerCase() === needle,
    ) ?? null
  );
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
    const items = rows.map(normalizeTemplate).filter(Boolean);
    const dropped = rows.length - items.length;
    console.log(
      `✅ [templates] loaded ${items.length} template(s)` +
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
