// dashboardApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Home's follower card and Waiting for approval ("SmartLinks and Smart Inbox
// API.md", Nov 25 2026, sections "Followers" and "Autopilot posts").
//
// Base is /api — these live beside /api/smart-inbox, not under it. Auth rides
// the shared axios instance's interceptor; the brand goes as X-Brand-Id.
//
//   followers  {total, change_7d, change_7d_pct, accounts[], by_platform[],
//               daily[{day, followers}], tracking_since, errors[]} — Facebook
//               Pages and Instagram only; change_7d is null until 7 days are
//               recorded
//   posts      {posts[], counts{status: n}, waiting, page, last_page, total}
//
// Every call throws an Error carrying the server's own words (and `.status`).

import api from "@/app/api/axios";
import { smartError } from "@/(lib)/smartInboxApi";

const BASE = "https://api.creativeklux.com/api";

async function call(method, path, { brandId, body, params } = {}, fallback) {
  try {
    const res = await api.request({
      method,
      url: `${BASE}${path}`,
      data: body,
      params,
      headers: brandId ? { "X-Brand-Id": String(brandId) } : {},
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw smartError(error, fallback);
  }
}

// ── Followers ───────────────────────────────────────────────────────────────

/** Follower counts; `days` (7–90) sets how much `daily` history comes back. */
export const fetchFollowers = ({ brandId, days = 30, platform } = {}) =>
  call(
    "get",
    "/dashboard/followers",
    { brandId, params: { days: Math.min(90, Math.max(7, days)), ...(platform ? { platform } : {}) } },
    "Couldn't load your followers",
  );

/** The same, read fresh from the platforms now. */
export const refreshFollowers = ({ brandId } = {}) =>
  call("post", "/dashboard/followers/refresh", { brandId }, "Couldn't refresh your followers");

// ── Autopilot posts (Waiting for approval) ──────────────────────────────────

/** `status` "waiting" (the default) = drafting + pending. */
export const fetchAutopilotPosts = ({ brandId, status = "waiting", perPage } = {}) =>
  call(
    "get",
    "/autopilot/posts",
    { brandId, params: { status, ...(perPage ? { per_page: perPage } : {}) } },
    "Couldn't load posts waiting for approval",
  );

export const approveAutopilotPost = (id, { brandId } = {}) =>
  call("post", `/autopilot/posts/${id}/approve`, { brandId }, "Couldn't approve the post");

/** → {approved}. Without `ids`, approves every pending post. */
export const approveAllAutopilotPosts = (ids, { brandId } = {}) =>
  call("post", "/autopilot/posts/approve-all", { brandId, body: ids?.length ? { ids } : {} }, "Couldn't approve the posts");

export const rejectAutopilotPost = (id, { brandId } = {}) =>
  call("post", `/autopilot/posts/${id}/reject`, { brandId }, "Couldn't turn the post down");
