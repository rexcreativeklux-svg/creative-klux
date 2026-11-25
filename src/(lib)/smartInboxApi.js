// smartInboxApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Every Smart Inbox endpoint ("SmartLinks and Smart Inbox API.md", Nov 25 2026).
//
// Base is /api/smart-inbox — NOT /api/creativeklux-userend like creativesApi.js.
// Auth rides the shared axios instance's interceptor; the brand goes as
// X-Brand-Id (left out = the user's active brand on the server).
//
// Shapes checked against the live API on 2026-11-25:
//   summary        {conversations_7d, answered_by_ai, median_reply_sec,
//                   customers_7d, waiting, ai_on} — answered_by_ai and
//                   median_reply_sec are null until there is something to count
//   conversations  {counts{all,needs,dm,comment}, done_count, conversations[],
//                   page, last_page, total} — per_page must be at least 5
//   conversation   full object with messages, notes, drafts, post, assignee…
//
// Every call throws an Error carrying the server's own words (and `.status`).

import api from "@/app/api/axios";
import { redactSecrets } from "@/(lib)/creativesApi";

const BASE = "https://api.creativeklux.com/api/smart-inbox";

const brandHeaders = (brandId) => (brandId ? { "X-Brand-Id": String(brandId) } : {});

export function smartError(error, fallback) {
  const data = error?.response?.data;
  const status = error?.response?.status;
  const fieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
  const message =
    status === 402
      ? "You're out of AI credits. Top up to let the AI write again."
      : fieldError || data?.message || data?.error || (status ? `${fallback} (HTTP ${status})` : error?.message || fallback);
  const err = new Error(redactSecrets(message));
  err.status = status;
  err.data = data;
  return err;
}

/** One request against BASE. `brandId` is optional; the rest is axios config. */
async function call(method, path, { brandId, body, params } = {}, fallback = "Smart Inbox request failed") {
  try {
    const res = await api.request({
      method,
      url: `${BASE}${path}`,
      data: body,
      params,
      headers: brandHeaders(brandId),
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw smartError(error, fallback);
  }
}

// ── Overview ────────────────────────────────────────────────────────────────

/** The brand's last-7-days inbox numbers. */
export const fetchInboxSummary = ({ brandId } = {}) =>
  call("get", "/summary", { brandId }, "Couldn't load the Smart Inbox summary");

/**
 * Conversations, newest first. List items are the short shape:
 * id, name, initials, handle, avatar_url, platform, type, status, unread,
 * stage, assignee, last{from,text}, updated_at.
 */
export const fetchInboxConversations = ({ brandId, tab = "all", state = "open", channels, q, perPage = 5, page = 1 } = {}) =>
  call(
    "get",
    "/conversations",
    {
      brandId,
      params: {
        tab,
        state,
        per_page: Math.max(5, perPage),
        page,
        ...(q ? { q } : {}),
        // axios writes an array as channels[]=instagram&channels[]=facebook
        ...(channels?.length ? { channels } : {}),
      },
    },
    "Couldn't load Smart Inbox conversations",
  );

// ── One conversation ────────────────────────────────────────────────────────

/** Full conversation with messages. Opening it marks it read. */
export const fetchConversation = (id, { brandId } = {}) =>
  call("get", `/conversations/${id}`, { brandId }, "Couldn't open the conversation");

/** Change any of status, stage, tags[], assignee_id, assignee_name, unread, ai_off. */
export const updateConversation = (id, fields, { brandId } = {}) =>
  call("patch", `/conversations/${id}`, { brandId, body: fields }, "Couldn't update the conversation");

/** mode: reply | public | dm | note → {conversation, delivery, error} (502 if the platform refused). */
export const replyToConversation = (id, { text, mode }, { brandId } = {}) =>
  call("post", `/conversations/${id}/reply`, { brandId, body: { text, mode } }, "Couldn't send the reply");

/** AI writes reply options (uses credits) → {drafts[]} */
export const draftReplies = (id, count = 2, { brandId } = {}) =>
  call("post", `/conversations/${id}/draft`, { brandId, body: { count } }, "Couldn't write a draft");

export const discardDrafts = (id, { brandId } = {}) =>
  call("delete", `/conversations/${id}/draft`, { brandId }, "Couldn't discard the draft");

/** Comments only. */
export const hideComment = (id, hidden, { brandId } = {}) =>
  call("post", `/conversations/${id}/hide`, { brandId, body: { hidden } }, "Couldn't change the comment");

/** Deletes a team note shown in the thread (only notes can be deleted). */
export const deleteThreadNote = (id, messageId, { brandId } = {}) =>
  call("delete", `/conversations/${id}/messages/${messageId}`, { brandId }, "Couldn't delete the note");

export const addNote = (id, text, { brandId } = {}) =>
  call("post", `/conversations/${id}/notes`, { brandId, body: { text } }, "Couldn't save the note");
export const updateNote = (id, noteId, text, { brandId } = {}) =>
  call("put", `/conversations/${id}/notes/${noteId}`, { brandId, body: { text } }, "Couldn't update the note");
export const deleteNote = (id, noteId, { brandId } = {}) =>
  call("delete", `/conversations/${id}/notes/${noteId}`, { brandId }, "Couldn't delete the note");

export const deleteConversation = (id, { brandId } = {}) =>
  call("delete", `/conversations/${id}`, { brandId }, "Couldn't delete the conversation");
export const restoreConversation = (id, { brandId } = {}) =>
  call("post", `/conversations/${id}/restore`, { brandId }, "Couldn't restore the conversation");

// ── Saved replies ───────────────────────────────────────────────────────────

export const fetchSavedReplies = ({ brandId } = {}) =>
  call("get", "/saved-replies", { brandId }, "Couldn't load saved replies");
export const createSavedReply = ({ title, text }, { brandId } = {}) =>
  call("post", "/saved-replies", { brandId, body: { title, text } }, "Couldn't create the saved reply");
export const updateSavedReply = (id, { title, text }, { brandId } = {}) =>
  call("put", `/saved-replies/${id}`, { brandId, body: { title, text } }, "Couldn't update the saved reply");
export const deleteSavedReply = (id, { brandId } = {}) =>
  call("delete", `/saved-replies/${id}`, { brandId }, "Couldn't delete the saved reply");

// ── Rules ───────────────────────────────────────────────────────────────────

/** → {rules[{id, name, when, then, on, position}], actions[]} */
export const fetchRules = ({ brandId } = {}) => call("get", "/rules", { brandId }, "Couldn't load AI rules");
export const createRule = (rule, { brandId } = {}) =>
  call("post", "/rules", { brandId, body: rule }, "Couldn't create the rule");
export const updateRule = (id, fields, { brandId } = {}) =>
  call("put", `/rules/${id}`, { brandId, body: fields }, "Couldn't update the rule");
export const reorderRules = (ids, { brandId } = {}) =>
  call("post", "/rules/order", { brandId, body: { ids } }, "Couldn't reorder the rules");
export const deleteRule = (id, { brandId } = {}) =>
  call("delete", `/rules/${id}`, { brandId }, "Couldn't delete the rule");

// ── Settings ────────────────────────────────────────────────────────────────

/** Switch the inbox AI on or off. Off = every message waits for a person. → {ai_on} */
export const updateInboxSettings = ({ brandId, aiOn }) =>
  call("put", "/settings", { brandId, body: { ai_on: !!aiOn } }, "Couldn't change the inbox AI setting");

/** Connected inbox accounts (tokens are never returned). */
export const fetchInboxAccounts = ({ brandId } = {}) =>
  call("get", "/accounts", { brandId }, "Couldn't load connected inbox accounts");
