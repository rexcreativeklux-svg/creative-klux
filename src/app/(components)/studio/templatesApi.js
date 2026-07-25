// app/(components)/studio/templatesApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Data layer for the three template rails under the AI Select composer.
//
// ⚠️ THE ENDPOINTS ARE NOT LIVE YET. Every tab is deliberately stubbed: until a
// URL is filled into TEMPLATE_ENDPOINTS below, fetchTemplates() resolves to an
// "unconfigured" result and the UI renders a calm "coming soon" state instead of
// an error. To switch a tab on, paste its URL into TEMPLATE_ENDPOINTS — nothing
// else needs to change, because every backend shape is funnelled through
// normalizeTemplate() into one card contract.
//
// ── HOW TO GO LIVE (per tab) ────────────────────────────────────────────────
//   1. Paste the endpoint:   recent: `${BASE}/creative-designs/recent`
//   2. Reload — the tab fetches, normalizes, and renders real cards.
//   3. If the backend field names differ from the ones normalizeTemplate()
//      already tries, add them to the fallback chains there (one line each).
//
// The fetch sends the bearer token when one is passed in, mirrors the app's
// classified-error convention (user-safe `message`, dev-only `messageForDevs`),
// and never throws for an unconfigured tab.

/**
 * The three rails, in display order. `id` is what fetchTemplates() switches on.
 * @type {{id: string, label: string, emptyHint: string}[]}
 */
export const TEMPLATE_TABS = [
  {
    id: "recent",
    label: "Recent designs",
    emptyHint: "Your recent designs will show up here once you create a few.",
  },
  {
    id: "community",
    label: "Community templates",
    emptyHint: "Community templates are coming soon.",
  },
  {
    id: "klux",
    label: "Klux templates",
    emptyHint: "Curated Klux templates are coming soon.",
  },
];

/**
 * 👉 PASTE ENDPOINTS HERE. An empty string means "not wired yet" and the tab
 * shows its coming-soon state. Absolute URLs and same-origin paths both work.
 * @type {Record<string, string>}
 */
export const TEMPLATE_ENDPOINTS = {
  recent: "",
  community: "",
  klux: "",
};

/** True when a tab has a real endpoint configured. */
export const isTabConfigured = (tabId) =>
  typeof TEMPLATE_ENDPOINTS[tabId] === "string" &&
  TEMPLATE_ENDPOINTS[tabId].trim().length > 0;

/**
 * Pull the first present value from a list of candidate keys. Lets one
 * normalizer absorb several backend shapes without a rewrite per endpoint.
 */
const pick = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

/**
 * Map ONE raw backend row onto the card contract the UI renders. Every field is
 * optional on the wire — the card degrades gracefully when a field is missing.
 *
 * Card contract:
 *   { id, title, description, thumbnail, author, meta, href, canvas }
 *
 * `canvas` is passed through untouched so a design row can later be painted with
 * the shared renderDesignToCanvas() instead of an <img>, exactly like the
 * dashboard's recent-projects grid does.
 *
 * @param {Record<string, unknown>} raw
 * @param {number} index Positional fallback for a missing id.
 * @returns {{id: string, title: string, description: string|null, thumbnail: string|null,
 *            author: string|null, meta: string|null, href: string|null, canvas: unknown}}
 */
export function normalizeTemplate(raw, index = 0) {
  const row = raw && typeof raw === "object" ? raw : {};

  return {
    id: String(pick(row, ["id", "uuid", "_id", "slug"]) ?? `template-${index}`),
    title: String(
      pick(row, ["title", "name", "design_name", "label"]) ?? "Untitled",
    ),
    description: pick(row, ["description", "summary", "subtitle", "caption"]),
    thumbnail: pick(row, [
      "thumbnail",
      "thumbnail_url",
      "preview",
      "preview_url",
      "image",
      "image_url",
      "cover",
      "cover_url",
    ]),
    author: pick(row, ["author", "creator", "owner", "user_name", "brand_name"]),
    meta: pick(row, ["updated_at", "created_at", "modified_at", "date"]),
    href: pick(row, ["href", "url", "link", "permalink"]),
    canvas: row.canvas ?? null,
  };
}

/**
 * Find the array of rows inside a response body, tolerating the shapes this
 * backend already uses elsewhere: a bare array, `{ data: [] }`, `{ designs: [] }`,
 * `{ templates: [] }`, or a Laravel paginator (`{ data: { data: [] } }`).
 *
 * @param {unknown} body
 * @returns {unknown[]}
 */
function extractRows(body) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];

  const direct =
    body.data ?? body.designs ?? body.templates ?? body.items ?? body.results;
  if (Array.isArray(direct)) return direct;

  // Laravel paginator nested one level deeper.
  if (direct && typeof direct === "object") {
    const nested =
      direct.data ?? direct.designs ?? direct.templates ?? direct.items;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

/**
 * Load one template rail.
 *
 * Resolves (never rejects) so a dead rail can't take the page down — the caller
 * renders `status` directly:
 *   "unconfigured" → endpoint blank, show the coming-soon state
 *   "ok"           → `items` holds normalized cards (possibly an empty list)
 *   "error"        → `message` is safe to show, `messageForDevs` is console-only
 *
 * @param {string} tabId One of TEMPLATE_TABS[].id
 * @param {object} [opts]
 * @param {string|null} [opts.token] Bearer token, when the endpoint needs auth.
 * @param {AbortSignal} [opts.signal] Lets the caller cancel on tab switch/unmount.
 * @returns {Promise<{status: "unconfigured"|"ok"|"error", items: object[],
 *                    message?: string, messageForDevs?: string}>}
 */
export async function fetchTemplates(tabId, { token, signal } = {}) {
  if (!isTabConfigured(tabId)) {
    console.log(`🧩 [templates] "${tabId}" has no endpoint yet — showing the coming-soon state`);
    return { status: "unconfigured", items: [] };
  }

  const url = TEMPLATE_ENDPOINTS[tabId];

  try {
    console.log(`📡 [templates] fetching "${tabId}" →`, url);
    const res = await fetch(url, {
      method: "GET",
      signal,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      console.error(`❌ [templates] "${tabId}" returned non-JSON:`, text.slice(0, 200));
      return {
        status: "error",
        items: [],
        message: "We couldn't load these templates. Please try again.",
        messageForDevs: `Non-JSON response from ${url}`,
      };
    }

    if (!res.ok) {
      const devMessage = body?.message || body?.error || `HTTP ${res.status}`;
      console.error(`❌ [templates] "${tabId}" failed:`, devMessage);
      return {
        status: "error",
        items: [],
        message:
          res.status === 401
            ? "Your session expired — please sign in again to see these."
            : "We couldn't load these templates. Please try again.",
        messageForDevs: devMessage,
      };
    }

    const items = extractRows(body).map(normalizeTemplate);
    console.log(`✅ [templates] "${tabId}" loaded ${items.length} item(s)`);
    return { status: "ok", items };
  } catch (err) {
    // An abort is a normal tab switch, not a failure — report it as such so the
    // caller can drop the result silently.
    if (err?.name === "AbortError") {
      return { status: "ok", items: [] };
    }
    console.error(`❌ [templates] "${tabId}" request threw:`, err);
    return {
      status: "error",
      items: [],
      message: "Connection problem. Please check your network and try again.",
      messageForDevs: err?.message || String(err),
    };
  }
}
