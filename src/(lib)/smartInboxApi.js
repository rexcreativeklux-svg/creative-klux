// smartInboxApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Smart Inbox, read side — the two calls the home page needs.
//
//   GET smart-inbox/summary        {conversations_7d, answered_by_ai (%),
//                                   median_reply_sec, customers_7d, waiting, ai_on}
//   GET smart-inbox/conversations  {counts{all,needs,dm,comment}, done_count,
//                                   conversations[], page, last_page, total}
//
// Base is /api itself, NOT /api/creativeklux-userend like creativesApi.js —
// see "SmartLinks and Smart Inbox API.md". Auth rides the shared axios
// instance's interceptor; the brand goes as X-Brand-Id (left out = the user's
// active brand on the server).

import api from "@/app/api/axios";
import { redactSecrets } from "@/(lib)/creativesApi";

const BASE = "https://api.creativeklux.com/api/smart-inbox";

const brandHeaders = (brandId) => (brandId ? { "X-Brand-Id": String(brandId) } : {});

function inboxError(error, fallback) {
  const data = error?.response?.data;
  const status = error?.response?.status;
  const fieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
  const err = new Error(
    redactSecrets(
      fieldError || data?.message || data?.error || (status ? `${fallback} (HTTP ${status})` : error?.message || fallback),
    ),
  );
  err.status = status;
  return err;
}

/** The brand's last-7-days inbox numbers. */
export async function fetchInboxSummary({ brandId } = {}) {
  try {
    const res = await api.get(`${BASE}/summary`, { headers: brandHeaders(brandId) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw inboxError(error, "Couldn't load the Smart Inbox summary");
  }
}

/** Switch the inbox AI on or off. Off = every message waits for a person. → {ai_on} */
export async function updateInboxSettings({ brandId, aiOn }) {
  try {
    const res = await api.put(`${BASE}/settings`, { ai_on: !!aiOn }, { headers: brandHeaders(brandId) });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw inboxError(error, "Couldn't change the inbox AI setting");
  }
}

/**
 * Open conversations, newest first. List items are the short shape:
 * id, name, initials, handle, avatar_url, platform, type, status, unread,
 * stage, assignee, last{from,text}, updated_at.
 */
export async function fetchInboxConversations({ brandId, tab = "all", state = "open", perPage = 5, page = 1 } = {}) {
  try {
    const res = await api.get(`${BASE}/conversations`, {
      params: { tab, state, per_page: perPage, page },
      headers: brandHeaders(brandId),
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw inboxError(error, "Couldn't load Smart Inbox conversations");
  }
}
