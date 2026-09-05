/**
 * ⚠️ NO LONGER USED BY ANY TOOL — kept, not wired.
 *
 * This was Product Video's template source back when a template was only an id
 * and a live Pexels search could fill the shelf. Templates carry a written
 * prompt now, so they have to be pinned and reviewed: see
 * productVideoTemplates.js. The only thing still importing this file is
 * TemplateBrowserModal's dormant search path (via useTemplates.js), which
 * nothing calls. Delete all three together if no future tool wants a searched
 * template browser.
 *
 * Template sources for the Video Generator modal — Pexels-backed, no hardcoded
 * asset ids.
 *
 * CLIPS EVERYWHERE. Both the template row and the "See all" browser show short
 * looping VIDEOS — the tool makes motion, so a template tile should move. What
 * keeps a grid of them affordable is TemplateTile, which plays only the tiles
 * actually on screen. `kind: "photos"` is still supported (Pexels serves both,
 * and the normalisers collapse them to one tile shape) but nothing asks for it
 * today.
 *
 * CACHE. Results are memoised per (kind, category, per_page) for the lifetime of
 * the tab. The row and the browser are both opened repeatedly inside one
 * session; refetching on every open burns the Pexels quota and reshuffles the
 * shelf under the user. Nothing here caches an empty or aborted result, so a
 * failed load retries on the next open instead of sticking.
 */

// ── Categories ──────────────────────────────────────────────────────────────
// The tabs in the "See all" browser. Each maps to a Pexels search phrase —
// the tab label alone ("Tops", "Bottoms") returns junk, so the query is tuned.
export const TEMPLATE_CATEGORIES = [
  "All",
  "Dresses",
  "Tops",
  "Bottoms",
  "Outerwear",
  "Accessories",
  "Footwear",
  "Bags",
  "Beauty",
  "Food & Drink",
  "Furniture",
];

const CATEGORY_QUERY = {
  Dresses: "elegant dress fashion model",
  Tops: "shirt blouse fashion model",
  Bottoms: "jeans trousers fashion",
  Outerwear: "jacket coat fashion model",
  Accessories: "jewelry watch accessories",
  Footwear: "sneakers shoes product",
  Bags: "handbag leather bag",
  Beauty: "cosmetics skincare beauty product",
  "Food & Drink": "food drink product styling",
  Furniture: "furniture interior styling",
};

// Which categories get blended into the "All" tab. Fetching one broad query for
// "All" returns forty photos of the same thing; interleaving a few narrow ones
// reads as a mixed shelf, which is what the default tab should look like.
const ALL_BLEND = [
  "Dresses",
  "Footwear",
  "Beauty",
  "Bags",
  "Food & Drink",
  "Furniture",
];

// ── Normalisers ─────────────────────────────────────────────────────────────
// Both kinds collapse to the same tile shape so one component renders either:
//   { id, pexelsId, category, poster, src, alt }
// `src` is the playable file for a video and null for a still — that null is
// what TemplateTile switches on.

// Below this width a clip looks mushy even in a 96px tile; above the first file
// that clears it we're just downloading pixels the tile throws away.
const MIN_VIDEO_WIDTH = 360;

const pickVideoFile = (files = []) => {
  const mp4 = files.filter((f) => f.file_type === "video/mp4" && f.link);
  const pool = mp4.length ? mp4 : files.filter((f) => f.link);
  if (!pool.length) return null;
  const bySize = [...pool].sort((a, b) => (a.width || 0) - (b.width || 0));
  const fit = bySize.find((f) => (f.width || 0) >= MIN_VIDEO_WIDTH);
  return (fit || bySize[bySize.length - 1]).link;
};

const normalizeVideo = (v, category) => ({
  id: `${category}-${v.id}`,
  pexelsId: v.id,
  category,
  poster: v.image,
  src: pickVideoFile(v.video_files),
  alt: v.user?.name ? `Template by ${v.user.name}` : `${category} template`,
});

const normalizePhoto = (p, category) => ({
  id: `${category}-${p.id}`,
  pexelsId: p.id,
  category,
  poster: p.src?.large || p.src?.medium || p.src?.original,
  src: null,
  alt: p.alt || `${category} template`,
});

// ── Fetching ────────────────────────────────────────────────────────────────

// One page size for every caller. The row wants twelve clips and the browser
// wants a gridful, but making them agree means they share ONE cache entry —
// the row slices what it needs. Two different page sizes would mean two
// separate "All" blends, i.e. twelve upstream requests on a cold open instead
// of six, which is exactly how you trip an hourly quota.
export const PER_PAGE = 30;

const CACHE = new Map();

const cacheKey = ({ kind, category, perPage }) =>
  `${kind}:${category}:${perPage}`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestOnce({ kind, query, perPage, signal }) {
  const res = await fetch(
    `/api/pexels?query=${encodeURIComponent(query)}&type=${kind}&per_page=${perPage}&orientation=portrait`,
    { signal },
  );

  if (res.ok) {
    const data = await res.json();
    return (kind === "videos" ? data.videos : data.photos) ?? [];
  }

  // The route forwards Pexels' status and quota headers — carry both onto the
  // error so the UI can say which failure this was.
  const body = await res.json().catch(() => ({}));
  const error = new Error(
    res.status === 429
      ? "Too many template requests — give it a minute and try again."
      : "Couldn't load templates. Check your connection and try again.",
  );
  error.status = res.status;
  error.rateLimit = body.rateLimit;
  throw error;
}

async function search(opts) {
  try {
    return await requestOnce(opts);
  } catch (err) {
    // An abort is a navigation, not a failure — never retry one.
    if (err.name === "AbortError" || opts.signal?.aborted) throw err;
    // Retry a rate limit, a 5xx or a bare network error once: opening this
    // modal fires six requests at once, and a single blip in that burst
    // shouldn't be the difference between a shelf and an error screen. A 4xx
    // that isn't 429 is a bad request — retrying just wastes quota.
    if (err.status && err.status !== 429 && err.status < 500) throw err;
    await wait(700);
    return requestOnce(opts);
  }
}

// Round-robin so the "All" shelf alternates categories rather than running them
// in blocks — the first screenful should show the variety, not six dresses.
const interleave = (lists) => {
  const out = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) if (list[i]) out.push(list[i]);
  }
  return out;
};

const dedupe = (items) => {
  const seen = new Set();
  return items.filter((t) => {
    if (seen.has(t.pexelsId)) return false;
    seen.add(t.pexelsId);
    return true;
  });
};

/** Cached results for this key, or null if we've never loaded them. */
export const peekTemplates = ({ kind, category = "All", perPage = PER_PAGE }) =>
  CACHE.get(cacheKey({ kind, category, perPage })) ?? null;

/**
 * Load templates for one category.
 *
 * @param {object} opts
 * @param {"videos"|"photos"} opts.kind
 * @param {string} [opts.category]   A TEMPLATE_CATEGORIES entry; "All" blends.
 * @param {number} [opts.perPage]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<Array>} Normalised tiles.
 */
export async function fetchTemplates({
  kind,
  category = "All",
  perPage = PER_PAGE,
  signal,
}) {
  const key = cacheKey({ kind, category, perPage });
  const hit = CACHE.get(key);
  if (hit) return hit;

  const normalize = kind === "videos" ? normalizeVideo : normalizePhoto;
  let items;

  if (category === "All") {
    const share = Math.max(3, Math.ceil(perPage / ALL_BLEND.length));
    const lists = await Promise.all(
      ALL_BLEND.map((cat) =>
        search({ kind, query: CATEGORY_QUERY[cat], perPage: share, signal })
          .then((raw) => raw.map((item) => normalize(item, cat)))
          // One category failing shouldn't empty the shelf — the others still
          // fill it, and the miss is invisible.
          .catch(() => []),
      ),
    );
    items = interleave(lists);
  } else {
    const raw = await search({
      kind,
      query: CATEGORY_QUERY[category] ?? category,
      perPage,
      signal,
    });
    items = raw.map((item) => normalize(item, category));
  }

  // A video with no playable file and a still with no poster are both dead
  // tiles; drop them rather than render an empty rectangle.
  items = dedupe(items).filter((t) => t.poster && (kind === "photos" || t.src));

  if (items.length && !signal?.aborted) CACHE.set(key, items);
  return items;
}
