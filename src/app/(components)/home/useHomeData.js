"use client";

// useHomeData — the parts of the home dashboard that come from the backend.
//
//   inbox      GET smart-inbox/summary + smart-inbox/conversations
//   campaigns  the brand's connected ad accounts → creatives/campaigns, then
//              creatives/campaign-metrics over the picked range (`days`)
//   networks   the brand's connected social networks, for the tab strip
//   followers  dashboard/followers (Facebook Pages + Instagram) over the range
//   approvals  autopilot/posts waiting for approval, with approve / reject
//   posts      the brand's connected social accounts → creatives/posts, then
//              creatives/post-metrics, ranked by engagement
//
// Each section loads on its own and carries {loading, error, …}, so one slow or
// failing network never blanks the others.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchInboxConversations, fetchInboxSummary } from "@/(lib)/smartInboxApi";
import {
  POST_STATS_PLATFORMS,
  fetchLivePostsFromConnectedAccounts,
  getAdCampaignMetrics,
  getPostStats,
  loadStatsForRows,
} from "@/(lib)/integration";
import { SERVER_PUBLISH_PLATFORMS } from "@/(lib)/creativesApi";
import {
  approveAllAutopilotPosts,
  approveAutopilotPost,
  fetchAutopilotPosts,
  fetchFollowers,
  refreshFollowers,
  rejectAutopilotPost,
} from "@/(lib)/dashboardApi";
import { numeric, postMetrics } from "@/(lib)/postMetrics";

/** First numeric value under any of `keys` — networks name the same count differently. */
const pick = (metrics, ...keys) => {
  for (const k of keys) {
    const v = numeric(metrics?.[k]);
    if (v !== undefined) return v;
  }
  return undefined;
};

const STATUS_RANK = { ACTIVE: 0, ENABLED: 0, PAUSED: 1 };
/** Conversations per Smart Inbox page — the API's minimum is 5. */
const INBOX_PAGE = 5;

/**
 * Every campaign the backend lists, each with its last-7-days metrics.
 *
 * Values are shown EXACTLY as the backend sends them (checked 2026-11-25):
 *   creatives/campaigns         id, name, status, objective, created_time,
 *                               thumbnail, daily_budget — no currency
 *   creatives/campaign-metrics  spend, impressions, reach, clicks, ctr, cpc,
 *                               likes, shares, comments, conversions — null
 *                               when the network has none
 * No currency comes back, so amounts carry no currency sign, and nothing is
 * converted — a daily_budget of 2000 is shown as 2,000. Not all campaigns
 * are capped any more, so totals cover every one the backend lists.
 */
async function loadCampaigns(rows, days) {
  const list = rows
    .filter((r) => r.type === "ad" && !/^(deleted|removed|archived)$/i.test(r.status || ""))
    .sort((a, b) => (STATUS_RANK[a.status] ?? 2) - (STATUS_RANK[b.status] ?? 2));
  const { stats } = await loadStatsForRows(list, (c) =>
    getAdCampaignMetrics({ platform: c.platform, campaign_id: c.post_id, days }),
  );
  const all = list.map((c) => {
    const m = stats[c.id]?.metrics || {};
    return {
      id: c.id,
      name: c.project_title,
      platform: c.platform,
      status: c.status,
      objective: c.objective,
      image: c.image_url,
      dailyBudget: numeric(c.daily_budget),
      spend: m.spend,
      impressions: m.impressions,
      reach: m.reach,
      clicks: m.clicks,
      ctr: m.ctr,
      cpc: m.cpc,
      conversions: m.conversions,
    };
  });
  return { list: all.slice(0, 4), all };
}

async function loadTopPosts(rows) {
  const social = rows
    .filter((r) => r.type === "social" && r.status === "published")
    // Every post the backend lists (creatives/posts returns up to 20 per
    // network) — no cap of our own, so totals cover all of them.
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
  const askable = social.filter((p) => POST_STATS_PLATFORMS.includes(p.platform));
  const { stats } = await loadStatsForRows(askable, (p) =>
    getPostStats({ platform: p.platform, post_id: p.post_id }),
  );
  const recent = social
    .map((p) => {
      const m = postMetrics({ ...p, stats: stats[p.id] }) || {};
      const likes = pick(m, "likes", "like_count");
      const comments = pick(m, "comments", "comment_count");
      const shares = pick(m, "shares", "share_count");
      const views = pick(m, "views", "view_count", "video_views", "reach", "impressions");
      return {
        id: p.id,
        platform: p.platform,
        title: p.project_title || p.caption || "Untitled post",
        image: p.image_url,
        url: p.permalink_url,
        date: p.published_at,
        likes,
        comments,
        shares,
        views,
        score: (likes || 0) + 2 * (comments || 0) + 3 * (shares || 0),
      };
    });
  // `recent` (simplified rows) feeds the top-posts card and the Monday report;
  // `raw` is the same posts in the shape the insights helpers read
  // (networkInsights.js: kpis, bestTimes…), with their stats attached.
  const raw = social.map((p) => ({ ...p, stats: stats[p.id] || p.stats }));
  return { list: [...recent].sort((a, b) => b.score - a.score).slice(0, 6), recent, raw };
}

/**
 * @param {number} [days=7] The date picker's range (7–90 days): the period the
 *   ad metrics and the follower history cover. Changing it reloads only those.
 * @param {string} [followerPlatform] "facebook" or "instagram" to count only
 *   that network's followers; left out = every tracked account.
 */
export default function useHomeData(days = 7, followerPlatform) {
  const { activeBrandId, fetchIntegrations } = useAuth();

  const [inbox, setInbox] = useState({ loading: true });
  const [campaigns, setCampaigns] = useState({ loading: true, list: [] });
  const [posts, setPosts] = useState({ loading: true, list: [] });
  const [followers, setFollowers] = useState({ loading: true });
  const [approvals, setApprovals] = useState({ loading: true, list: [] });
  // Connected social networks (app-side ids, publishing order) — the tab strip.
  const [networks, setNetworks] = useState([]);
  // The integrations read, kept so a new date range only reloads ad metrics.
  const [source, setSource] = useState(null);

  // ── Smart Inbox ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeBrandId) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before a brand switch reloads
    setInbox({ loading: true });
    Promise.all([
      fetchInboxSummary({ brandId: activeBrandId }),
      // The API refuses per_page below 5 (422).
      fetchInboxConversations({ brandId: activeBrandId, perPage: INBOX_PAGE }),
    ])
      .then(([summary, convos]) => {
        if (!alive) return;
        console.log("📥 [home] smart inbox ←", summary, convos);
        setInbox({
          loading: false,
          summary: summary || {},
          needs: convos?.counts?.needs ?? summary?.waiting ?? 0,
          list: convos?.conversations || [],
          total: convos?.total ?? (convos?.conversations || []).length,
          page: convos?.page ?? 1,
          lastPage: convos?.last_page ?? 1,
        });
      })
      .catch((err) => {
        console.error("❌ [home] smart inbox:", err.message);
        if (alive) setInbox({ loading: false, error: err.message, list: [] });
      });
    return () => {
      alive = false;
    };
  }, [activeBrandId]);

  // ── Campaigns + top posts (one integrations read feeds both) ───────────────
  useEffect(() => {
    if (!activeBrandId) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before a brand switch reloads
    setCampaigns({ loading: true, list: [] });
    setPosts({ loading: true, list: [] });
    setSource(null);
    (async () => {
      let rows;
      let ints = [];
      try {
        ints = (await fetchIntegrations?.()) || [];
        rows = await fetchLivePostsFromConnectedAccounts(ints);
      } catch (err) {
        if (!alive) return;
        setCampaigns({ loading: false, error: err.message, list: [] });
        setPosts({ loading: false, error: err.message, list: [] });
        return;
      }
      if (!alive) return;
      const errors = rows.errorsByPlatform || {};
      const hasAds = ints.some((i) => /_ads$/.test(i?.platform || ""));
      const hasSocial = ints.some((i) => i?.platform && !/_ads$/.test(i.platform));

      setNetworks(SERVER_PUBLISH_PLATFORMS.filter((p) => ints.some((i) => i?.platform === p)));
      setSource({ rows, errors, hasAds });
      loadTopPosts(rows)
        .then(({ list, recent, raw }) => alive && setPosts({ loading: false, list, recent, raw, connected: hasSocial, errors }))
        .catch((err) => alive && setPosts({ loading: false, error: err.message, list: [], recent: [], raw: [], connected: hasSocial }));
    })();
    return () => {
      alive = false;
    };
  }, [activeBrandId, fetchIntegrations]);

  // ── Campaign metrics for the picked range ─────────────────────────────────
  useEffect(() => {
    if (!source) return;
    let alive = true;
    const { rows, errors, hasAds } = source;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before a new range reloads
    setCampaigns((c) => ({ ...c, loading: true }));
    // The Monday report is always last 7 days, whatever range is picked; its
    // metrics are cached, so this is free once the week has loaded.
    Promise.all([loadCampaigns(rows, days), days === 7 ? null : loadCampaigns(rows, 7)])
      .then(([{ list, all }, week]) => alive && setCampaigns({ loading: false, list, all, week: (week || { all }).all, connected: hasAds, errors }))
      .catch((err) => alive && setCampaigns({ loading: false, error: err.message, list: [], all: [], week: [], connected: hasAds }));
    return () => {
      alive = false;
    };
  }, [source, days]);

  // ── Followers (Facebook Pages + Instagram, saved once a day) ───────────────
  useEffect(() => {
    if (!activeBrandId) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before a new range reloads
    setFollowers((f) => ({ ...f, loading: true, error: undefined }));
    fetchFollowers({ brandId: activeBrandId, days, platform: followerPlatform })
      .then((data) => alive && setFollowers({ loading: false, data }))
      .catch((err) => alive && setFollowers({ loading: false, error: err.message }));
    return () => {
      alive = false;
    };
  }, [activeBrandId, days, followerPlatform]);

  /** Read the counts fresh from the platforms (the card's Refresh). */
  const refreshFollowerCounts = useCallback(async () => {
    setFollowers((f) => ({ ...f, refreshing: true }));
    try {
      await refreshFollowers({ brandId: activeBrandId });
      // Refresh answers for the whole brand over its default days; read again
      // for this tab and range.
      const data = await fetchFollowers({ brandId: activeBrandId, days, platform: followerPlatform });
      setFollowers({ loading: false, data });
    } catch (err) {
      setFollowers((f) => ({ ...f, refreshing: false }));
      throw err;
    }
  }, [activeBrandId, days, followerPlatform]);

  // ── Waiting for approval (autopilot posts: drafting + pending) ─────────────
  const loadApprovals = useCallback(async () => {
    const res = await fetchAutopilotPosts({ brandId: activeBrandId });
    setApprovals({ loading: false, list: res?.posts || [], total: res?.total ?? (res?.posts || []).length });
  }, [activeBrandId]);

  useEffect(() => {
    if (!activeBrandId) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before a brand switch reloads
    setApprovals({ loading: true, list: [] });
    fetchAutopilotPosts({ brandId: activeBrandId })
      .then((res) => alive && setApprovals({ loading: false, list: res?.posts || [], total: res?.total ?? (res?.posts || []).length }))
      .catch((err) => alive && setApprovals({ loading: false, error: err.message, list: [] }));
    return () => {
      alive = false;
    };
  }, [activeBrandId]);

  /**
   * Approve (`approve`), turn down (`reject`) or approve every pending post
   * (`approve-all`, `id` = the ids shown). Approved and turned-down posts
   * leave the list.
   * @returns {Promise<number>} how many posts were approved
   */
  const decideApproval = useCallback(
    async (action, id) => {
      setApprovals((a) => ({ ...a, busy: id ?? action }));
      try {
        let approved = 0;
        if (action === "approve-all") {
          approved = (await approveAllAutopilotPosts(id, { brandId: activeBrandId }))?.approved ?? 0;
        } else if (action === "approve") {
          await approveAutopilotPost(id, { brandId: activeBrandId });
          approved = 1;
        } else {
          await rejectAutopilotPost(id, { brandId: activeBrandId });
        }
        await loadApprovals();
        return approved;
      } finally {
        setApprovals((a) => ({ ...a, busy: undefined }));
      }
    },
    [activeBrandId, loadApprovals],
  );

  /** Smart Inbox "See more": the next page of conversations, appended. */
  const loadMoreInbox = useCallback(async () => {
    const next = (inbox.page || 1) + 1;
    setInbox((s) => ({ ...s, loadingMore: true }));
    try {
      const convos = await fetchInboxConversations({ brandId: activeBrandId, perPage: INBOX_PAGE, page: next });
      setInbox((s) => {
        const seen = new Set(s.list.map((c) => c.id));
        return {
          ...s,
          loadingMore: false,
          list: [...s.list, ...(convos?.conversations || []).filter((c) => !seen.has(c.id))],
          total: convos?.total ?? s.total,
          page: convos?.page ?? next,
          lastPage: convos?.last_page ?? s.lastPage,
        };
      });
    } catch (err) {
      setInbox((s) => ({ ...s, loadingMore: false }));
      throw err;
    }
  }, [activeBrandId, inbox.page]);

  return {
    inbox,
    campaigns,
    posts,
    networks,
    followers,
    approvals,
    loadMoreInbox,
    refreshFollowerCounts,
    decideApproval,
  };
}
