"use client";

/**
 * The Copilot API client — the one place that knows where the backend lives.
 *
 * ⚠️ THE PREFIX IS `/api/creativeklux-userend/`, NOT `/api/`. The backend setup
 * doc names its routes as `/api/copilot/chat` and `/api/integrations/...`, and
 * every one of those 404s. The routes were registered under the app's own
 * prefix, alongside `login` and `integrations`. Probed 2026-09-08:
 *
 *   https://api.creativeklux.com/api/copilot/chat                      → 404
 *   https://api.creativeklux.com/api/creativeklux-userend/copilot/chat → reaches the app
 *
 * The same correction is owed to the doc's `.env` OAuth redirect URIs and its
 * Telegram `setWebhook` URL, which both still point at the 404 form.
 *
 * ⚠️ THE REQUEST SHAPE IS PROVISIONAL. At the time of writing `copilot/chat`
 * answers 500 — `Target class [CopilotController] does not exist` — because the
 * routes were pasted into `api.php` but the controller file was never uploaded.
 * That means the endpoint has never validated a request, so nobody has seen the
 * fields it wants. `{ message }` is the shape our own Developer panel already
 * advertises to integrators, so it is the honest guess; the moment the endpoint
 * returns 422 instead of 500, the error names the real fields and the body below
 * is the only thing that has to change.
 *
 * Auth rides the shared axios instance's interceptor (Bearer, from
 * localStorage), so this module holds no token handling of its own and cannot
 * drift from the way the rest of the app authenticates.
 */

import api from "@/app/api/axios";

/** Absolute, because the shared instance's baseURL is not this API. */
export const COPILOT_API_BASE =
  "https://api.creativeklux.com/api/creativeklux-userend";

const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * ⚠️ A 200 CAN STILL BE A FAILURE. This API answers with a `status` field, and a
 * `status: false` / `"error"` body comes back on a 200 that axios will not
 * reject — it reached us as `{"status":"error","message":"Unauthenticated."}`.
 * Left unchecked it surfaces as an empty list or a missing reply, which reads
 * like a bug in the screen rather than a refusal from the server.
 *
 * Same guard the sibling product's autopilot client uses against the same
 * backend conventions.
 */
function assertOk(payload, fallback) {
  if (isRecord(payload) && (payload.status === false || payload.status === "error")) {
    throw new Error(payload.message || payload.error || fallback);
  }
  return payload;
}

/** The record out of `{ status, copilot: {…} }` and its neighbours. */
export const toCopilotRecord = (payload) =>
  [payload?.copilot, payload?.data?.copilot, payload?.data, payload].find(
    isRecord,
  ) || null;

/**
 * Ask a copilot something.
 *
 * ⚠️ `copilot_id` IS WHAT MAKES THE COPILOTS DIFFER. Without it the server falls
 * back to the first agent that supports the channel, then to a generic prompt —
 * so every copilot on the screen would answer identically however differently
 * they are described. Sent whenever we have one.
 *
 * @param {Object}  args
 * @param {string}  args.message         What the user said.
 * @param {string|number|null} [args.copilotId]  Which agent is being asked.
 * @param {string|number|null} [args.conversationId]  Sent only once the server
 *   has given us one — an invented id would be a lie about state we don't hold.
 * @returns {Promise<Object>} The raw response body, shape not yet known.
 */
export async function sendChat({
  message,
  copilotId = null,
  conversationId = null,
}) {
  const body = { message };
  if (copilotId != null) body.copilot_id = copilotId;
  if (conversationId != null) body.conversation_id = conversationId;

  const res = await api.post(`${COPILOT_API_BASE}/copilot/chat`, body);
  // ⚠️ INTEGRATION AID — the raw body, so the reply and the conversation id it
  // names can be read straight off the console while the contract settles.
  console.log("[copilot] POST copilot/chat ←", res.data);
  return res.data;
}

/** Oldest first; the id settles two messages stamped in the same second. */
const byCreated = (a, b) => {
  const t = (row) => {
    const ms = new Date(row?.created_at ?? 0).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  };
  return t(a) - t(b) || (Number(a?.id) || 0) - (Number(b?.id) || 0);
};

/**
 * One copilot's whole message history, oldest first — what opening a copilot
 * shows. Used the way Macrid uses `GET /agents/{id}/messages`: one call, per
 * copilot, and the backend is the only source — nothing is kept in the browser.
 *
 * ⚠️ `copilots/{id}/conversations` IS THE ROUTE THE BACKEND NAMED for this
 * (2026-09-11). `copilots/{id}/messages` does not exist (404). The response
 * shape has not been seen with data in it yet — an earlier probe came back
 * `{ data: [] }` — so both likely shapes are read:
 *   • a flat list of messages   [{ id, role, content, created_at }, …]
 *   • a list of conversations, each carrying its own `messages`, which are
 *     flattened into one thread
 * The raw body is logged; if messages arrive somewhere else, that log names it.
 *
 * @param {string|number} copilotId
 * @returns {Promise<Object[]>} Raw message rows, oldest first.
 */
export async function fetchMessages(copilotId) {
  const res = await api.get(
    `${COPILOT_API_BASE}/copilots/${copilotId}/conversations`,
  );
  // ⚠️ INTEGRATION AID — the raw body, so a thread that opens empty can be told
  // apart from one whose messages arrived under a key we don't read.
  console.log(`[copilot] GET copilots/${copilotId}/conversations ←`, res.data);
  const data = assertOk(res.data, "Could not load the conversation.");

  const rows =
    [
      data?.messages,
      data?.conversations,
      data?.data?.messages,
      data?.data?.conversations,
      data?.data?.data, // Laravel's paginator
      data?.data,
      data,
    ].find(Array.isArray) ?? [];

  // Conversations carrying their messages → one thread, in the order said.
  const conversations = rows.filter((row) => Array.isArray(row?.messages));
  const messages = conversations.length
    ? conversations.flatMap((row) => row.messages)
    : rows;
  return [...messages].sort(byCreated);
}

/* ── Copilots (the backend calls them agents) ──────────────────────────────
 *
 * A copilot is a row owned by a brand: { name, description, instructions,
 * greeting, channels, allowed_tools }. The brand and the user are resolved from
 * the bearer token — the server derived brand_id 5 / user_id 126 on its own —
 * so nothing here sends them.
 *
 * ⚠️ `channels: null` means EVERY channel and `allowed_tools: null` means every
 * tool the brand has connected. Null and [] are opposites here, so a payload
 * must never "helpfully" default one of these to an empty array.
 */

/** The whole catalog for the signed-in brand. */
export async function listCopilots() {
  const res = await api.get(`${COPILOT_API_BASE}/copilots`);
  return assertOk(res.data, "Could not load your copilots.");
}

/** One copilot. */
export async function getCopilot(id) {
  const res = await api.get(`${COPILOT_API_BASE}/copilots/${id}`);
  return assertOk(res.data, "Could not load that copilot.");
}

/**
 * Make one.
 *
 * ⚠️ `name` IS REQUIRED — an empty body comes back 422 "The name field is
 * required". The caller supplies a placeholder (see defaultCopilotName in
 * ./copilots) so the user is never asked to name a thing before making it.
 *
 * This differs from the sibling product's `POST /autopilots`, which takes no
 * body and names the record itself. Worth having the same here: the placeholder
 * only exists because the column has no default.
 */
export async function createCopilot(payload = {}) {
  const res = await api.post(`${COPILOT_API_BASE}/copilots`, payload);
  return assertOk(res.data, "Could not create the copilot.");
}

export async function patchCopilot(id, patch) {
  const res = await api.put(`${COPILOT_API_BASE}/copilots/${id}`, patch);
  return assertOk(res.data, "Could not save that change.");
}

export async function destroyCopilot(id) {
  const res = await api.delete(`${COPILOT_API_BASE}/copilots/${id}`);
  return assertOk(res.data, "Could not delete that copilot.");
}

/**
 * Begin an OAuth connect. The route is generic over the provider — probing
 * `integrations/zzz/connect` gets a 200 route and a 422 from the config lookup —
 * so the provider key is a path segment, and an unknown one fails at the server
 * rather than here.
 */
export async function connectProvider(provider) {
  const res = await api.post(
    `${COPILOT_API_BASE}/integrations/${provider}/connect`,
    {},
  );
  return res.data;
}

/** The authorize URL out of a connect response, whichever key it arrives under. */
export function authorizeUrlFrom(data) {
  return (
    data?.url ?? data?.authorize_url ?? data?.redirect ?? data?.data?.url ?? null
  );
}

/**
 * Start an OAuth connect and hand the browser to the provider.
 *
 * ⚠️ A FULL NAVIGATION, not a popup. The consent screen is the provider's own
 * page and it sets its own framing rules; the callback then lands back on our
 * domain, which is where the token gets stored. A popup would have to postMessage
 * the result across origins for no gain.
 *
 * ⚠️ A 200 WITH NO URL IS A FAILURE. Treated as one explicitly, because the
 * silent version of this bug is a Connect button that appears to work and simply
 * does nothing — the hardest kind to report.
 */
export async function beginConnect(provider) {
  const url = authorizeUrlFrom(await connectProvider(provider));
  if (!url) {
    throw new Error(
      `The connect endpoint returned no authorize URL for "${provider}".`,
    );
  }
  window.location.href = url;
}

/**
 * Turn a failed request into something a person can act on.
 *
 * ⚠️ IT REPORTS THE SERVER'S OWN WORDS. While the backend is half-deployed the
 * whole value of a failure is its exact text — "Target class [CopilotController]
 * does not exist" is the sentence that tells the backend dev which file is
 * missing, and paraphrasing it to something friendly would throw away the only
 * useful thing on the screen.
 *
 * Laravel's 422 puts the field names in `errors`, so those are pulled out
 * too: that response is precisely what we are waiting for, and reading it is
 * how the request shape above gets corrected.
 *
 * @returns {{status: number|null, detail: string, fields: string[], text: string}}
 */
export function describeApiError(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;

  const detail =
    (typeof data === "string" && data) ||
    data?.message ||
    data?.error ||
    error?.message ||
    "Request failed";

  const fields = data?.errors ? Object.keys(data.errors) : [];

  const parts = [status ? `${status}` : "Network error", detail];
  if (fields.length) parts.push(`Fields: ${fields.join(", ")}`);

  return { status, detail, fields, text: parts.join(" — ") };
}
