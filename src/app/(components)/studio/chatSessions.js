// app/(components)/studio/chatSessions.js
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Helpers for the saved-chat endpoints behind `fetchChatSessions` /
 * `fetchChatSession` (AuthContext).
 *
 * Shared rather than colocated because both readers of that history need them:
 * the chat page's own history panel, and the home rail's "Chat History" tab
 * (templatesApi.fetchChatHistory, which formats the same rows into cards).
 *
 * Everything here is defensive about field names on purpose. The list route is
 * pinned down — it answers `{ status, sessions: [...] }` with rows shaped
 * `{ session_id, title, status, messages, started }` — but the detail route's
 * message shape is not, so `normalizeSessionMessages` accepts every spelling
 * the backend plausibly uses and lets the caller find out from real data.
 */

/** Roles the API might send, mapped to the two the chat renders. */
const ASSISTANT_ROLES = new Set(["assistant", "ai", "bot", "system", "klux"]);

/**
 * Turn a session's stored title into one clean line.
 *
 * Titles are the raw first user message, so they arrive with newlines in them —
 * the brand-import prompt in particular is a multi-line block that would push a
 * list row several lines tall. Newlines and repeated whitespace collapse to
 * single spaces; CSS handles the visual truncation (see the panel's ellipsis),
 * so nothing is cut here beyond a generous hard cap.
 *
 * @param {string} title
 * @returns {string}
 */
export function formatSessionTitle(title) {
  const flat = String(title || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!flat) return "Untitled chat";
  return flat.length > 120 ? `${flat.slice(0, 120)}…` : flat;
}

/**
 * The "Brand: <name>" row that opens an imported-site message
 * (homeComposerTabs.buildImportedSitePrompt writes it).
 */
const BRAND_ROW = /(?:^|\n)[ \t]*Brand[ \t]*:[ \t]*([^\n]+)/i;

/** The other "Label: value" rows that block is made of — dropped from `detail`. */
const DETAIL_ROWS =
  /(?:^|\n)[ \t]*(?:Brand|Tagline|Industry|About|Primary colour|Secondary colour|Font|Website|Logo)[ \t]*:[ \t]*[^\n]*/gi;

/**
 * The lead-in imported-brand messages used to open with. It is no longer sent
 * (see buildImportedSitePrompt), but it is baked into the title of every
 * session saved before that changed, so it's stripped on the way out too.
 */
const LEGACY_LEAD_IN = /here'?s my brand,?\s*imported from my website:?/gi;

/**
 * Split a session title into the brand it's about and the rest of it.
 *
 * Most sessions open with an imported brand block, so their titles are all
 * "Brand: woxelo / Industry: … / About: …" and read identically at a glance.
 * Pulling the name out lets a card lead with the brand and keep the detail as a
 * supporting line, instead of showing four rows of scraped fields.
 *
 * A title that isn't a brand block (someone typed "a social post") has no brand
 * and comes back whole as `detail` — which is exactly what should be shown then.
 *
 * @param {string} title
 * @returns {{brand: string|null, detail: string}}
 */
export function parseSessionSummary(title) {
  const raw = String(title || "");
  const brand = raw.match(BRAND_ROW)?.[1]?.trim() || null;

  // With the labelled rows stripped, what's left is the user's own ask ("Create
  // designs for this brand.") — the one part of an imported title that differs
  // between two sessions about the same brand.
  const detail = brand
    ? raw
        .replace(DETAIL_ROWS, " ")
        .replace(LEGACY_LEAD_IN, " ")
        .replace(/\s+/g, " ")
        .trim()
    : formatSessionTitle(raw);

  return { brand, detail };
}

/**
 * Short, scannable date for a list row: a time for today, "Yesterday" for
 * yesterday, otherwise a day/month (plus the year once it isn't this one).
 *
 * @param {string} iso  `started` from the sessions list.
 * @returns {string} Empty string when the value isn't a usable date.
 */
export function formatSessionDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, now)) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

/**
 * How long ago something happened, as a card's meta line reads it: "39 minutes
 * ago", "6 hours ago", "5 days ago".
 *
 * Falls back to formatSessionDate() past a month, where an exact date says more
 * than "2 months ago" does.
 *
 * @param {string} iso  `updated` (or `started`) from the sessions list.
 * @returns {string} Empty string when the value isn't a usable date.
 */
export function formatSessionAge(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return formatSessionDate(iso);
}

/**
 * The monogram a chat tile is stamped with: the first letter of each of the
 * first two words ("Creative Klux" → "CK"), or the first two letters when
 * there's only one ("woxelo" → "WO").
 *
 * @param {string} label Usually the brand; falls back to whatever names the chat.
 * @returns {string} One or two uppercase characters, "?" when there's nothing.
 */
export function sessionInitials(label) {
  const words = String(label || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Pull the readable text out of one stored message.
 *
 * Assistant replies are sometimes persisted as the whole response object rather
 * than a string (the chat endpoint answers with `{ type, reply, … }`), so an
 * object is unwrapped to its reply/message before falling back to JSON — a
 * bubble showing readable text beats one showing `[object Object]`.
 */
function messageText(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const inner = value.reply ?? value.message ?? value.content ?? value.text;
    if (typeof inner === "string") return inner;
    return JSON.stringify(value, null, 2);
  }
  return "";
}

/** Image payloads may be plain URLs or `{ url }` records — flatten to URLs. */
function messageImages(msg) {
  const raw = msg?.images ?? msg?.attachments ?? msg?.image_urls;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((img) => (typeof img === "string" ? img : img?.url || img?.src || ""))
    .filter(Boolean);
}

/**
 * Map stored messages onto the shape <AiChatMessage /> renders:
 * `{ role: "user" | "assistant", content, images, timestamp }`.
 *
 * Rows that carry no text at all are dropped rather than rendered as empty
 * bubbles — that's what an unrecognised shape looks like, and a visibly short
 * thread is a clearer signal than a column of blanks.
 *
 * @param {unknown} raw The `messages` array from fetchChatSession.
 * @returns {{role: string, content: string, images: string[], timestamp: string}[]}
 */
export function normalizeSessionMessages(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((msg) => {
      if (typeof msg === "string") {
        return { role: "assistant", content: msg, images: [], timestamp: "" };
      }

      // `is_user`/`from_user` booleans are checked before the string roles so a
      // record carrying both doesn't get decided by a stray `type: "text"`.
      const rawRole =
        msg?.is_user === true || msg?.from_user === true
          ? "user"
          : msg?.is_user === false || msg?.from_user === false
            ? "assistant"
            : msg?.role ?? msg?.sender ?? msg?.author ?? msg?.type ?? "";

      const role = ASSISTANT_ROLES.has(String(rawRole).toLowerCase())
        ? "assistant"
        : "user";

      const content = messageText(
        msg?.content ?? msg?.message ?? msg?.text ?? msg?.reply ?? msg?.body,
      );

      return {
        role,
        content,
        images: messageImages(msg),
        timestamp: msg?.created_at ?? msg?.timestamp ?? msg?.time ?? "",
      };
    })
    .filter((msg) => msg.content || msg.images.length);
}
