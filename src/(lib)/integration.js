// /**
//  * Integrations store.
//  * Connected accounts are now stored in the backend (fetched via fetchIntegrations()).
//  * localStorage is only used for published posts tracking.
//  *
//  * Backend integration shape (what fetchIntegrations() returns):
//  * {
//  *   id, user_id, brand_id,
//  *   platform: "facebook" | "instagram" | ...,
//  *   int_id: "175569699735961",   ← platform account/user/page ID
//  *   int_token: "EAAF...",        ← access token
//  *   status: 1,
//  *   created_at, updated_at
//  * }
//  *
//  * Published posts shape:
//  * [{
//  *   id, project_id, project_title, image_url, caption, platform,
//  *   type: 'social' | 'ad',
//  *   status: 'published' | 'scheduled' | 'failed',
//  *   scheduled_at: ISO string | null,
//  *   published_at: ISO string | null,
//  *   post_id: string (platform post ID),
//  *   stats: { impressions, clicks, reach, likes, shares, comments, ctr, spend }
//  * }]
//  */

// const POSTS_KEY = 'creativeklux_published_posts';

// // ─── Published / Scheduled Posts (localStorage) ───────────────────────────────

// export function getPublishedPosts() {
//   try {
//     return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
//   } catch {
//     return [];
//   }
// }

// export function savePublishedPost(post) {
//   const posts = getPublishedPosts();
//   const existing = posts.findIndex(p => p.id === post.id);
//   if (existing >= 0) {
//     posts[existing] = post;
//   } else {
//     posts.unshift({ ...post, id: post.id || `post_${Date.now()}` });
//   }
//   localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
//   return posts.find(p => p.id === post.id);
// }

// export function deletePublishedPost(id) {
//   const posts = getPublishedPosts().filter(p => p.id !== id);
//   localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
// }

// export function updatePostStats(id, stats) {
//   const posts = getPublishedPosts();
//   const idx = posts.findIndex(p => p.id === id);
//   if (idx >= 0) {
//     posts[idx].stats = { ...posts[idx].stats, ...stats, last_updated: new Date().toISOString() };
//     localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
//   }
// }

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// /**
//  * Build a flat accounts map from the backend integrations array.
//  * { facebook: { access_token, page_id, ig_user_id, ad_account_id, ... }, ... }
//  *
//  * The backend stores:
//  *   int_token → access_token
//  *   int_id    → the platform's user/page ID
//  *
//  * For Facebook:  int_id is the Facebook User ID.
//  *                page_id must be fetched separately (see fetchFacebookPageId).
//  * For Instagram: int_id is the Instagram Business Account ID (ig_user_id).
//  * For Meta Ads:  int_id is the Facebook User ID; ad_account_id fetched separately.
//  */
// function buildAccountsMap(integrations) {
//   const map = {};

//   integrations.forEach(i => {
//     map[i.platform] = {
//       access_token: i.int_token,
//       page_id: i.int_id,
//       ig_user_id: i.int_id,
//       ad_account_id: i.int_id,
//     };
//   });

//   return map;
// }

// /**
//  * For Facebook, int_id is the User ID, NOT the Page ID.
//  * We need to call /me/accounts to get the page access token and page ID.
//  * Returns the first page found, or null.
//  */
// export async function fetchFacebookPageId(userAccessToken) {
//   try {
//     const res = await fetch(
//       `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token`
//     );
//     const data = await res.json();
//     if (data.error || !data.data?.length) return null;
//     // Return the first page — in a real app you'd let the user pick
//     return {
//       page_id: data.data[0].id,
//       page_access_token: data.data[0].access_token,
//       page_name: data.data[0].name,
//     };
//   } catch {
//     return null;
//   }
// }

// // ─── Platform API Calls ───────────────────────────────────────────────────────

// /**
//  * Publish an image (or text-only) to a Facebook Page.
//  * Requires: pages_manage_posts scope.
//  * NOTE: The user access token must first be exchanged for a Page access token
//  *       via /me/accounts. We do that automatically here if page_id is the user ID.
//  */
// export async function publishToFacebook({ access_token, page_id, image_url, caption }) {
//   if (!access_token) throw new Error("No access token — reconnect your Facebook account.");

//   // If page_id looks like a user token (or is missing), fetch the real page ID first
//   let resolvedPageId = page_id;
//   let resolvedToken = access_token;

//   if (!resolvedPageId) {
//     const page = await fetchFacebookPageId(access_token);
//     if (!page) throw new Error("No Facebook Page found — make sure your account manages at least one Page.");
//     resolvedPageId = page.page_id;
//     resolvedToken = page.page_access_token;
//   }

//   if (!image_url) {
//     // Text-only post
//     const res = await (
//       `https://graph.facebook.com/v19.0/${resolvedPageId}/feed?access_token=${encodeURIComponent(resolvedToken)}`,
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ message: caption }),
//       }
//     );
//     const data = await res.json();
//     if (data.error) throw new Error(data.error.message);
//     return { post_id: data.id };
//   }

//   // Image post — token in query param, NOT body
//   const res = await fetch(
//     `https://graph.facebook.com/v19.0/${resolvedPageId}/photos?access_token=${encodeURIComponent(resolvedToken)}`,
//     {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ url: image_url, caption, published: true }),
//     }
//   );
//   const data = await res.json();
//   if (data.error) throw new Error(data.error.message);
//   return { post_id: data.post_id || data.id };
// }

// /**
//  * Publish an image to Instagram Business account.
//  * int_id = ig_user_id (Instagram Business Account ID).
//  */
// export async function publishToInstagram({ access_token, ig_user_id, image_url, caption }) {
//   if (!ig_user_id) throw new Error("No Instagram Business Account ID — reconnect Instagram.");
//   if (!access_token) throw new Error("No access token — reconnect Instagram.");

//   const containerRes = await fetch(
//     `https://graph.facebook.com/v19.0/${ig_user_id}/media`,
//     {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ image_url, caption, access_token }),
//     }
//   );
//   const container = await containerRes.json();
//   if (container.error) throw new Error(container.error.message);

//   const publishRes = await fetch(
//     `https://graph.facebook.com/v19.0/${ig_user_id}/media_publish`,
//     {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ creation_id: container.id, access_token }),
//     }
//   );
//   const publishData = await publishRes.json();
//   if (publishData.error) throw new Error(publishData.error.message);
//   return { post_id: publishData.id };
// }

// /**
//  * Create a Meta Ads campaign.
//  * int_id for meta_ads is the ad account ID.
//  */
// export async function publishToMetaAds({ access_token, ad_account_id, image_url, caption, campaign_name }) {
//   const base = `https://graph.facebook.com/v19.0/act_${ad_account_id}`;

//   const imgRes = await fetch(`${base}/adimages`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ url: image_url, access_token }),
//   });
//   const imgData = await imgRes.json();
//   if (imgData.error) throw new Error(imgData.error.message);
//   const imageHash = Object.values(imgData.images || {})[0]?.hash;

//   const campaignRes = await fetch(`${base}/campaigns`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       name: campaign_name || 'CreativeKlux Campaign',
//       objective: 'OUTCOME_AWARENESS',
//       status: 'PAUSED',
//       access_token,
//     }),
//   });
//   const campaignData = await campaignRes.json();
//   if (campaignData.error) throw new Error(campaignData.error.message);

//   return { post_id: campaignData.id, image_hash: imageHash };
// }

// // ─── Stats ────────────────────────────────────────────────────────────────────

// // export async function getFacebookPostStats({ access_token, post_id }) {
// //   const res = await fetch(
// //     `https://graph.facebook.com/v19.0/${post_id}/insights?metric=post_impressions,post_engaged_users,post_clicks,post_reactions_like_total&access_token=${access_token}`
// //   );
// //   const data = await res.json();
// //   if (data.error) throw new Error(data.error.message);
// //   const metrics = {};
// //   (data.data || []).forEach(m => { metrics[m.name] = m.values?.[0]?.value || 0; });
// //   return {
// //     impressions: metrics.post_impressions || 0,
// //     reach: metrics.post_engaged_users || 0,
// //     clicks: metrics.post_clicks || 0,
// //     likes: metrics.post_reactions_like_total || 0,
// //   };
// // }

// export async function getFacebookPostStats({ access_token, post_id }) {
//   const res = await fetch(
//     `https://graph.facebook.com/v19.0/${post_id}/insights` +
//     `?metric=post_media_view,post_reactions_like_total,post_reactions_by_type_total` +
//     `&access_token=${access_token}`
//   );
//   const data = await res.json();
//   if (data.error) throw new Error(data.error.message);

//   const metrics = {};
//   (data.data || []).forEach(m => {
//     // lifetime period returns values array with one entry
//     metrics[m.name] = m.values?.[0]?.value ?? 0;
//   });

//   // post_reactions_by_type_total returns an object like { like: 5, love: 2, ... }
//   const reactionsByType = metrics.post_reactions_by_type_total || {};
//   const totalLikes =
//     typeof reactionsByType === 'object'
//       ? Object.values(reactionsByType).reduce((a, v) => a + (v || 0), 0)
//       : metrics.post_reactions_like_total || 0;

//   return {
//     impressions: metrics.post_media_view || 0,
//     reach: 0,   // post_reach / post_engaged_users both deprecated — no direct replacement
//     clicks: 0,  // post_clicks deprecated — no direct replacement without breakdowns scope
//     likes: totalLikes,
//   };
// }

// export async function getInstagramPostStats({ access_token, post_id }) {
//   const res = await fetch(
//     `https://graph.facebook.com/v19.0/${post_id}/insights?metric=impressions,reach,likes,comments,shares&access_token=${access_token}`
//   );
//   const data = await res.json();
//   if (data.error) throw new Error(data.error.message);
//   const metrics = {};
//   (data.data || []).forEach(m => { metrics[m.name] = m.values?.[0]?.value || 0; });
//   return {
//     impressions: metrics.impressions || 0,
//     reach: metrics.reach || 0,
//     likes: metrics.likes || 0,
//     comments: metrics.comments || 0,
//     shares: metrics.shares || 0,
//   };
// }

// // ─── Fetch Live Posts ─────────────────────────────────────────────────────────

// /**
//  * Fetch live posts from all connected platforms using the backend integrations.
//  *
//  * IMPORTANT CHANGE: This now accepts `integrations` (from fetchIntegrations() in AuthContext)
//  * instead of reading from localStorage. The backend is the source of truth for connections.
//  *
//  * @param {Array} integrations - Array from fetchIntegrations() API call
//  * @returns {Array} Normalized post objects ready to merge with local posts
//  */
// export async function fetchLivePostsFromConnectedAccounts(integrations = []) {
//   // Build a quick lookup map: { facebook: { access_token, page_id, ... }, ... }
//   const accounts = buildAccountsMap(integrations);
//   const livePosts = [];

//   // ── Facebook ──────────────────────────────────────────────────────────────
//   if (accounts.facebook?.access_token) {
//     try {
//       // int_id for facebook = User ID. We need to get the Page ID and Page token first.
//       const account = accounts.facebook;

//       if (account?.access_token && account?.page_id) {
//         const res = await fetch(
//           `https://graph.facebook.com/v19.0/${account.page_id}/posts` +
//           `?fields=id,message,story,created_time,full_picture,permalink_url` +
//           `&limit=20&access_token=${account.access_token}`
//         );

//         const data = await res.json();
//         if (!data.error && data.data) {
//           data.data.forEach(post => {
//             livePosts.push({
//               id: `fb_${post.id}`,
//               project_id: null,
//               project_title: post.message?.slice(0, 60) || post.story || 'Facebook Post',
//               caption: post.message || '',
//               image_url: post.full_picture || null,
//               platform: 'facebook',
//               type: 'social',
//               status: 'published',
//               published_at: post.created_time,
//               scheduled_at: null,
//               post_id: post.id,
//               // Store the page token for publishing/stats later
//               // _page_access_token: page.page_access_token,
//               // _page_id: page.page_id,
//               permalink_url: post.permalink_url,
//               live: true,
//               stats: {},
//             });
//           });
//         }
//       }
//     } catch (err) {
//       console.warn('Facebook live posts fetch failed:', err.message);
//     }
//   }

//   // ── Instagram ─────────────────────────────────────────────────────────────
//   // int_id = ig_user_id (Instagram Business Account ID)
//   if (accounts.instagram?.access_token && accounts.instagram?.ig_user_id) {
//     try {
//       const res = await fetch(
//         `https://graph.facebook.com/v19.0/${accounts.instagram.ig_user_id}/media` +
//         `?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink` +
//         `&limit=20&access_token=${accounts.instagram.access_token}`
//       );
//       const data = await res.json();
//       if (!data.error && data.data) {
//         data.data.forEach(post => {
//           livePosts.push({
//             id: `ig_${post.id}`,
//             project_id: null,
//             project_title: post.caption?.slice(0, 60) || 'Instagram Post',
//             caption: post.caption || '',
//             image_url: post.media_url || post.thumbnail_url || null,
//             platform: 'instagram',
//             type: 'social',
//             status: 'published',
//             published_at: post.timestamp,
//             scheduled_at: null,
//             post_id: post.id,
//             permalink_url: post.permalink,
//             live: true,
//             stats: {},
//           });
//         });
//       }
//     } catch (err) {
//       console.warn('Instagram live posts fetch failed:', err.message);
//     }
//   }

//   // ── Meta Ads ──────────────────────────────────────────────────────────────
//   if (accounts.meta_ads?.access_token && accounts.meta_ads?.ad_account_id) {
//     try {
//       const res = await fetch(
//         `https://graph.facebook.com/v19.0/act_${accounts.meta_ads.ad_account_id}/campaigns` +
//         `?fields=id,name,status,created_time,objective&limit=20` +
//         `&access_token=${accounts.meta_ads.access_token}`
//       );
//       const data = await res.json();
//       if (!data.error && data.data) {
//         data.data.forEach(campaign => {
//           livePosts.push({
//             id: `meta_campaign_${campaign.id}`,
//             project_id: null,
//             project_title: campaign.name,
//             caption: `Objective: ${campaign.objective || 'N/A'} · Status: ${campaign.status}`,
//             image_url: null,
//             platform: 'meta_ads',
//             type: 'ad',
//             status: campaign.status === 'ACTIVE' ? 'published' : 'scheduled',
//             published_at: campaign.created_time,
//             scheduled_at: null,
//             post_id: campaign.id,
//             live: true,
//             stats: {},
//           });
//         });
//       }
//     } catch (err) {
//       console.warn('Meta Ads live fetch failed:', err.message);
//     }
//   }

//   return livePosts;
// }

// // ─── Delete / Update on platform ─────────────────────────────────────────────

// /**
//  * Delete a post from the real platform AND locally.
//  * Now accepts integrations array instead of reading localStorage.
//  */
// export async function deletePostFromPlatform(post, integrations = []) {
//   const accounts = buildAccountsMap(integrations);

//   if (post.platform === 'facebook' && post.post_id) {
//     const token = post._page_access_token || accounts.facebook?.access_token;
//     if (token) {
//       try {
//         await fetch(`https://graph.facebook.com/v19.0/${post.post_id}?access_token=${token}`, {
//           method: 'DELETE',
//         });
//       } catch { }
//     }
//   } else if (post.platform === 'meta_ads' && accounts.meta_ads?.access_token && post.post_id) {
//     try {
//       await fetch(`https://graph.facebook.com/v19.0/${post.post_id}?access_token=${accounts.meta_ads.access_token}`, {
//         method: 'DELETE',
//       });
//     } catch { }
//   }
//   // Instagram: no delete API for published posts — remove locally only

//   deletePublishedPost(post.id);
// }

// /**
//  * Update a Facebook post caption on the platform.
//  * Now accepts integrations array instead of reading localStorage.
//  */
// export async function updatePostCaptionOnPlatform(post, newCaption, integrations = []) {
//   const accounts = buildAccountsMap(integrations);

//   if (post.platform === 'facebook' && post.post_id) {
//     const token = post._page_access_token || accounts.facebook?.access_token;
//     if (token) {
//       const res = await fetch(
//         `https://graph.facebook.com/v19.0/${post.post_id}?access_token=${token}`,
//         {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ message: newCaption }),
//         }
//       );
//       const data = await res.json();
//       if (data.error) throw new Error(data.error.message);
//     }
//   }
//   // Instagram/others: save locally only
// }

// export const OAUTH_CONFIGS = {
//   facebook: {
//     authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
//     scope: 'pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,ads_management',
//   },
//   google_ads: {
//     authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
//     scope: 'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email',
//   },
//   tiktok: {
//     authUrl: 'https://www.tiktok.com/auth/authorize/',
//     scope: 'video.upload,video.list',
//   },
// };

/**
 * Integrations store.
 * Connected accounts, posts, campaigns and their metrics all live in the
 * backend — nothing here is cached in the browser. The backend is the only
 * source of truth.
 *
 * Backend integration shape:
 * {
 *   id,
 *   user_id,
 *   brand_id,
 *   platform,
 *   int_id,
 *   int_token,
 *   status,
 *   created_at,
 *   updated_at
 * }
 */

import {
  SERVER_AD_PLATFORMS,
  SERVER_DELETE_PLATFORMS,
  SERVER_PUBLISH_PLATFORMS,
  createAd,
  deletePlatformPost,
  fetchCampaignMetrics,
  fetchCampaigns,
  fetchPlatformPosts,
  fetchPostMetrics,
  publishToPlatform,
  setCampaignStatus,
  uploadForPublish,
} from "./creativesApi";

// ─────────────────────────────────────────────────────────────
// Meta API Versioning
// ─────────────────────────────────────────────────────────────

const META_API_VERSION = "v23.0";

const META_OAUTH_BASE = `https://www.facebook.com/${META_API_VERSION}`;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * A fresh list from the backend, with the metrics this session already pulled
 * for the same rows carried over. Metrics are a separate backend call per row,
 * so a refetch of the list shouldn't blank them — but nothing is kept beyond
 * the page's own memory.
 */
export function carryStats(prevRows, nextRows) {
  const prev = new Map(prevRows.map((r) => [r.id, r.stats]));
  return nextRows.map((r) =>
    prev.get(r.id) ? { ...r, stats: prev.get(r.id) } : r,
  );
}

// ─────────────────────────────────────────────────────────────
// Platform API Calls
// ─────────────────────────────────────────────────────────────

/**
 * Publish a post to any social platform as it is — one call to the API
 * (POST creatives/publish), which answers with the platform's own error.
 */
export async function publishPost({ platform, brand_id, image_url, caption }) {
  return publishToPlatform(platform, { brand_id, text: caption, image_url });
}

/**
 * Publish to Facebook Page
 */
export async function publishToFacebook({
  image_url,
  video_url,
  caption,
  link,
  scheduled_publish_time, // unix seconds — not supported by the publishing API yet
  brand_id,
}) {
  // The API has no "publish at" field, and sending one it ignores would post
  // immediately — the opposite of what was asked.
  if (scheduled_publish_time) {
    throw new Error(
      "Scheduling isn't available yet — the publishing API can only post now.",
    );
  }
  return publishToPlatform("facebook", {
    brand_id,
    text: caption,
    image_url,
    video_url,
    link,
  });
}

/**
 * Publish to Instagram Business account
 */
export async function publishToInstagram({ image_url, video_url, caption, brand_id }) {
  return publishToPlatform("instagram", {
    brand_id,
    text: caption,
    image_url,
    video_url,
  });
}

// ─────────────────────────────────────────────────────────────
// Ads
// ─────────────────────────────────────────────────────────────
//
// Ads are created by the API (POST creatives/ads): it holds the ad-account
// tokens and builds campaign → ad set → creative → ad in one call, so nothing
// here reads a token or an ad account id. The brand is the signed-in user's
// active brand, resolved server-side.

// Each network's objectives, in its own vocabulary — the value is sent to the
// API as-is. `default` marks the one the form starts on. Google's "objective"
// is the campaign channel type.
export const AD_OBJECTIVE_OPTIONS = {
  meta_ads: [
    { value: "OUTCOME_AWARENESS", label: "Awareness — more people see it" },
    { value: "OUTCOME_TRAFFIC", label: "Traffic — visit your website", default: true },
    { value: "OUTCOME_ENGAGEMENT", label: "Engagement — likes / comments / messages" },
  ],
  google_ads: [
    { value: "DISPLAY", label: "Display — image ads across Google's sites", default: true },
    { value: "DEMAND_GEN", label: "Demand Gen — YouTube, Discover and Gmail" },
  ],
  tiktok_ads: [
    { value: "REACH", label: "Reach — more people see it" },
    { value: "TRAFFIC", label: "Traffic — visit your website", default: true },
    { value: "ENGAGEMENT", label: "Engagement — likes / comments / follows" },
  ],
  snapchat_ads: [
    { value: "AWARENESS", label: "Awareness — more people see it" },
    { value: "WEB_VIEW", label: "Traffic — visit your website", default: true },
    { value: "ENGAGEMENT", label: "Engagement — swipes / views" },
  ],
  pinterest_ads: [
    { value: "AWARENESS", label: "Awareness — more people see it" },
    { value: "CONSIDERATION", label: "Consideration — visit your website", default: true },
  ],
};

/** The objective a network's form starts on. */
export const defaultAdObjective = (platform) => {
  const options = AD_OBJECTIVE_OPTIONS[platform] || [];
  return (options.find((o) => o.default) || options[0])?.value ?? "";
};

// The ad's button. An empty value leaves it to the network's default.
export const AD_CALLS_TO_ACTION = [
  { value: "", label: "Network default" },
  { value: "LEARN_MORE", label: "Learn more" },
  { value: "SHOP_NOW", label: "Shop now" },
  { value: "SIGN_UP", label: "Sign up" },
  { value: "CONTACT_US", label: "Contact us" },
  { value: "BOOK_NOW", label: "Book now" },
  { value: "APPLY_NOW", label: "Apply now" },
  { value: "GET_OFFER", label: "Get offer" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "SUBSCRIBE", label: "Subscribe" },
];

// YYYY-MM-DD in the user's own timezone, `offsetDays` from today.
export const adDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Create an ad on one network. Created PAUSED unless `status` is "ACTIVE" —
 * a paused ad spends nothing until it is resumed from the Ads page.
 *
 *  - platform      meta_ads | google_ads | tiktok_ads | snapchat_ads | pinterest_ads
 *  - name          campaign / ad name
 *  - daily_budget  whole units of the AD ACCOUNT'S currency (not dollars)
 *  - country       ISO-2 code to target (or `countries` for several)
 *  - link          where the ad sends people — required by the API
 *  - objective     the network's own objective (AD_OBJECTIVE_OPTIONS)
 *  - start_date / end_date   YYYY-MM-DD (today → a week out when not given)
 *  - status        "PAUSED" | "ACTIVE"
 *  - call_to_action  AD_CALLS_TO_ACTION value; empty → the network's default
 *  - age_min/max   13–65 (Google: 18–65)
 *  - business_name, logo_url   the brand's; Google shows them on the ad
 *
 * Google's responsive display ad also needs a 1:1 image beside the landscape
 * one, so a square copy of `image_url` is made here and sent as
 * `square_image_url`. Headline/description are cut to Google's 30/90.
 *
 * Nothing is checked here — whatever is missing or refused comes back as the
 * API's (or the network's) own sentence. Only Meta builds a full ad today; the
 * others refuse with a "not available yet" message.
 *
 * @returns {Promise<{post_id, campaign_id, adset_id, creative_id, ad_id, status, currency}>}
 */
export async function publishAd({
  platform,
  name,
  image_url,
  video_url,
  link,
  text,
  headline,
  description,
  objective,
  daily_budget,
  start_date,
  end_date,
  status,
  country,
  countries,
  call_to_action,
  age_min,
  age_max,
  business_name,
  logo_url,
}) {
  const isGoogle = platform === "google_ads";
  const age = (v) => (v == null || v === "" ? undefined : Number(v));
  const ad = await createAd({
    platform,
    name: (name || "Creative Klux Ad").slice(0, 200),
    objective: objective || defaultAdObjective(platform) || undefined,
    status: status || undefined,
    daily_budget:
      daily_budget == null || daily_budget === "" ? undefined : Number(daily_budget),
    countries: countries?.length ? countries : country ? [country] : [],
    image_url,
    video_url,
    link,
    text: text?.slice(0, 2000),
    headline: headline?.trim().slice(0, isGoogle ? 30 : 255),
    description: (description || (isGoogle ? text : ""))
      ?.trim()
      .slice(0, isGoogle ? 90 : 500),
    call_to_action: call_to_action || undefined,
    start_date: start_date || adDate(0),
    end_date: end_date || adDate(7),
    age_min: age(age_min),
    age_max: age(age_max),
    business_name: (business_name || name)?.trim().slice(0, 25),
    logo_url,
    ...(isGoogle && image_url
      ? { square_image_url: await squareImageFor(image_url) }
      : {}),
  });

  // Rows on the Ads pages are campaigns, so that is the id they key on.
  return { ...ad, post_id: ad?.campaign_id ?? ad?.ad_id ?? null };
}

// A 1200×1200 copy of the image, the whole design fitted on white (nothing
// cropped), hosted through the gallery upload. Undefined if the image can't be
// read (CORS) — the API then answers with Google's own refusal.
async function squareImageFor(url) {
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const SIZE = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, SIZE, SIZE);
    const scale = Math.min(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    return await uploadForPublish(
      new File([blob], "square.png", { type: "image/png" }),
    );
  } catch (err) {
    console.warn("Couldn't make the square ad image:", err);
    return undefined;
  }
}

// A real video File/Blob is hosted through the gallery upload to get the
// `video_url` the API takes. Images are never converted to video here — they
// go to the API as `image_url` and the API decides what the platform accepts.
async function hostedVideoFor(video) {
  const ext = (video.type || "").includes("mp4") ? "mp4" : "webm";
  return uploadForPublish(
    video instanceof File
      ? video
      : new File([video], `creative.${ext}`, { type: video.type || "video/webm" }),
  );
}

/**
 * creatives/post-metrics passes through whatever the platform returns, so the
 * shape differs per network — pull the numbers the UI shows from wherever they
 * are (flat fields, or a `public_metrics` / `metrics` / `insights` object).
 * Facebook sends `likes`/`shares`; YouTube sends camelCase strings
 * (`viewCount`, `likeCount`, …).
 *
 * A metric the platform did not send stays `undefined` (shown as "—"), never
 * 0: Facebook reports no impressions for a post, and a 0 would claim it had
 * none.
 */
function normalizeMetrics(data) {
  const src = {
    ...(data || {}),
    ...(data?.insights || {}),
    ...(data?.metrics || {}),
    ...(data?.public_metrics || {}),
  };
  const num = (...keys) => {
    for (const k of keys) {
      const v = src[k];
      if (typeof v === "number") return v;
      if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v)))
        return Number(v);
      if (v?.summary?.total_count != null) return Number(v.summary.total_count);
      if (v && typeof v === "object" && typeof v.count === "number")
        return v.count;
    }
    return undefined;
  };
  return {
    impressions: num(
      "impressions",
      "impression_count",
      "views",
      "view_count",
      "viewCount",
    ),
    reach: num("reach"),
    clicks: num("clicks", "link_clicks"),
    likes: num("likes", "like_count", "likeCount", "reactions"),
    comments: num("comments", "comment_count", "commentCount", "reply_count"),
    shares: num("shares", "share_count", "retweet_count"),
    saves: num("saves", "saved", "bookmark_count", "favoriteCount"),
  };
}

// ─────────────────────────────────────────────────────────────
// YouTube
// ─────────────────────────────────────────────────────────────

/**
 * Publish to YouTube through the API. The creative is sent as it is: an image
 * as `image_url`, a real `video` File/Blob as a hosted `video_url`.
 *
 *  - title / description  video metadata (title capped to 100 chars)
 *  - privacyStatus  'public' | 'unlisted' | 'private'
 *  - publishAt      scheduling — not supported by the publishing API
 */
export async function publishToYouTube({
  title,
  description,
  image_url,
  video_url: hostedVideoUrl,
  video,
  privacyStatus = "public",
  publishAt,
  brand_id,
}) {
  // The API has no "publish at" field, and sending one it ignores would post
  // immediately — the opposite of what was asked.
  if (publishAt) {
    throw new Error(
      "Scheduling isn't available yet — the publishing API can only post now.",
    );
  }
  const video_url =
    hostedVideoUrl || (video ? await hostedVideoFor(video) : undefined);
  const res = await publishToPlatform("youtube", {
    brand_id,
    title: (title || "Untitled").slice(0, 100),
    text: description || "",
    image_url,
    video_url,
    privacy_level: privacyStatus,
  });
  return {
    ...res,
    video_id: res.post_id,
    url: res.post_id ? `https://www.youtube.com/watch?v=${res.post_id}` : undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// X / Twitter
// ─────────────────────────────────────────────────────────────
//
// Posted by the API (POST creatives/publish, platform `x`).

/** Post to X (Twitter): `text`, plus an optional public `image_url`. */
export async function publishToTwitter({ text, image_url, video_url, brand_id }) {
  const res = await publishToPlatform("twitter", {
    brand_id,
    text,
    image_url,
    video_url,
  });
  return {
    ...res,
    url: res.post_id ? `https://x.com/i/web/status/${res.post_id}` : undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// LinkedIn
// ─────────────────────────────────────────────────────────────
//
// Posted by the API (POST creatives/publish).

/** Post to LinkedIn: `text`, plus an optional public `image_url`. */
export async function publishToLinkedIn({ text, image_url, video_url, brand_id }) {
  const res = await publishToPlatform("linkedin", {
    brand_id,
    text,
    image_url,
    video_url,
  });
  return {
    ...res,
    url: res.post_id
      ? `https://www.linkedin.com/feed/update/${res.post_id}`
      : undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// Pinterest
// ─────────────────────────────────────────────────────────────
//
// A pin is an image on a board. The API has no boards endpoint, so no board is
// picked here — it is sent only if the caller has one, and the API answers.

/** Create a Pin: `title` / `description`, a public `image_url`, optional `link` and `board_id`. */
export async function publishToPinterest({
  board_id,
  title,
  description,
  image_url,
  video_url,
  link,
  brand_id,
}) {
  return publishToPlatform("pinterest", {
    brand_id,
    board_id,
    title,
    text: description,
    image_url,
    video_url,
    link,
  });
}

// ─────────────────────────────────────────────────────────────
// TikTok
// ─────────────────────────────────────────────────────────────
//
// Posted by the API (POST creatives/publish). The image goes up as `image_url`.

/**
 * Post to TikTok.
 *  - title          short title (first line of the caption)
 *  - description    full caption
 *  - image_url      public image URL
 *  - privacy_level  "PUBLIC_TO_EVERYONE" (default) | "SELF_ONLY" | …
 */
export async function publishToTikTok({
  title,
  description,
  image_url,
  video_url: hostedVideoUrl,
  video,
  privacy_level,
  brand_id,
}) {
  // The creative goes to the API as it is: an image is sent as `image_url`
  // (the server posts it to TikTok itself). An already-hosted clip goes as its
  // `video_url`; a video File is uploaded for one — nothing is converted.
  const video_url =
    hostedVideoUrl || (video ? await hostedVideoFor(video) : undefined);
  // `draft_only` on the result: with video.upload alone TikTok takes it as a
  // draft the creator finishes in the app — callers should say so.
  return publishToPlatform("tiktok", {
    brand_id,
    title,
    text: description,
    image_url,
    ...(video_url ? { video_url } : {}),
    ...(privacy_level ? { privacy_level } : {}),
  });
}

// ─────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────

export async function getFacebookPostStats({ post_id, brand_id }) {
  return normalizeMetrics(
    await fetchPostMetrics({ brand_id, platform: "facebook", post_id }),
  );
}

export async function getInstagramPostStats({ post_id, brand_id }) {
  return normalizeMetrics(
    await fetchPostMetrics({ brand_id, platform: "instagram", post_id }),
  );
}

/** Platforms creatives/post-metrics answers for. */
export const POST_STATS_PLATFORMS = ["facebook", "instagram", "youtube"];

/** One post's metrics on any of POST_STATS_PLATFORMS. */
export async function getPostStats({ platform, post_id, brand_id }) {
  return normalizeMetrics(
    await fetchPostMetrics({ brand_id, platform, post_id }),
  );
}

/**
 * Load metrics for many rows at once, a few requests at a time. Resolves to
 * `{ stats: { [rowId]: stats }, errors: { [platform]: message } }` — each
 * platform's failure is kept once, in the server's own words, so a page can
 * report "Instagram: no permission" a single time rather than per row.
 *
 * @param {Array} rows Rows with `id`, `platform`, `post_id`.
 * @param {(row) => Promise<object>} load Fetches one row's stats.
 * @param {number} [concurrency=4]
 */
export async function loadStatsForRows(rows, load, concurrency = 4) {
  const stats = {};
  const errors = {};
  const failures = {};
  const queue = [...rows];
  const worker = async () => {
    while (queue.length) {
      const row = queue.shift();
      // A platform that has refused twice (e.g. missing permission) will
      // refuse every row the same way — stop spending a request per row on it.
      // One failure alone may just be that post, so the rest still load.
      if ((failures[row.platform] || 0) >= 2) continue;
      try {
        stats[row.id] = {
          ...(await load(row)),
          last_updated: new Date().toISOString(),
        };
      } catch (err) {
        failures[row.platform] = (failures[row.platform] || 0) + 1;
        errors[row.platform] ??= err?.message || "Couldn't load stats";
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { stats, errors };
}

/**
 * Spend / impressions / clicks for one campaign (GET creatives/campaign-metrics).
 * `metrics` comes back as one object or as rows (per day / per breakdown), with
 * only the numbers the network reports — rows are summed.
 */
export async function getAdCampaignStats({ platform, campaign_id, days = 7 }) {
  const data = await fetchCampaignMetrics({ platform, campaign_id, days });
  const raw = data?.metrics ?? data ?? {};
  const rows = Array.isArray(raw) ? raw : [raw];
  const sum = (...keys) =>
    rows.reduce((total, row) => {
      for (const k of keys) {
        const v = Number(row?.[k]);
        if (row?.[k] != null && row[k] !== "" && !Number.isNaN(v))
          return total + v;
      }
      return total;
    }, 0);

  const impressions = sum("impressions");
  const clicks = sum("clicks", "link_clicks", "swipes");
  return {
    impressions,
    reach: sum("reach"),
    clicks,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    spend: sum("spend", "cost"),
    conversions: sum("conversions"),
  };
}

/** Pause or resume a campaign. Resuming ("ACTIVE") starts spending real money. */
export async function setAdCampaignStatus({ platform, campaign_id, status }) {
  return setCampaignStatus({ platform, campaign_id, status });
}

// ─────────────────────────────────────────────────────────────
// Fetch Live Posts
// ─────────────────────────────────────────────────────────────

/** A platform's own post list → the rows the calendar / publishing pages render. */
function normalizeLivePosts(platform, data) {
  const rows = Array.isArray(data)
    ? data
    : data?.data ||
      data?.posts ||
      data?.items ||
      data?.videos ||
      data?.tweets ||
      data?.pins ||
      [];
  if (!Array.isArray(rows)) return [];

  const prefix =
    { facebook: "fb", instagram: "ig", twitter: "x", youtube: "yt" }[platform] ||
    platform;

  const toIso = (v) => {
    if (v == null || v === "") return null;
    // Unix seconds (TikTok create_time, Facebook scheduled_publish_time).
    const d =
      typeof v === "number" || /^\d+$/.test(String(v))
        ? new Date(Number(v) * 1000)
        : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  return rows
    .map((post) => {
      const snippet = post.snippet || {};
      const id = post.id?.videoId || post.id || post.video_id || post.pin_id;
      if (!id) return null;

      const text =
        post.message ||
        post.caption ||
        post.text ||
        post.description ||
        post.video_description ||
        snippet.description ||
        "";
      const title =
        post.title || snippet.title || post.story || text.slice(0, 60);
      const scheduledAt = toIso(post.scheduled_publish_time);

      return {
        id: `${prefix}_${id}`,
        project_id: null,
        project_title: title || `${platform} post`,
        caption: text,
        image_url:
          post.full_picture ||
          post.thumbnail_url ||
          post.media_url ||
          post.cover_image_url ||
          post.image_url ||
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.default?.url ||
          post.media?.images?.["600x"]?.url ||
          null,
        platform,
        type: "social",
        status: scheduledAt ? "scheduled" : "published",
        published_at: scheduledAt
          ? null
          : toIso(
              post.created_time ||
                post.timestamp ||
                post.created_at ||
                post.create_time ||
                snippet.publishedAt,
            ),
        scheduled_at: scheduledAt,
        post_id: String(id),
        permalink_url:
          post.permalink_url ||
          post.permalink ||
          post.share_url ||
          post.url ||
          post.link ||
          null,
        live: true,
        stats: {},
      };
    })
    .filter(Boolean);
}

export async function fetchLivePostsFromConnectedAccounts(
  integrations = [],
) {
  const livePosts = [];

  // ── Social platforms — read through the API (creatives/posts) ────────────
  // One call per connected platform; the API holds the tokens. `data` passes
  // through whatever the platform returns, so rows are normalized defensively.
  // LinkedIn has no post listing for third-party apps. A platform that fails
  // is skipped — its error is logged with the server's own words.
  const fetchErrors = [];
  const LISTABLE = SERVER_PUBLISH_PLATFORMS.filter((p) => p !== "linkedin");
  const connected = LISTABLE.filter((p) =>
    integrations.some((i) => i.platform === p),
  );

  const socialLists = await Promise.all(
    connected.map(async (platform) => {
      try {
        const data = await fetchPlatformPosts({ platform, limit: 20 });
        return normalizeLivePosts(platform, data);
      } catch (err) {
        console.warn(`${platform} live posts fetch failed:`, err.message);
        fetchErrors.push(`${platform}: ${err.message}`);
        return [];
      }
    }),
  );
  socialLists.forEach((list) => livePosts.push(...list));
  // Riding on the array so existing callers keep working: the server's own
  // words for each platform that failed, for the page to surface.
  livePosts.errors = fetchErrors;

  // ── Ad platforms — campaigns through the API (creatives/campaigns) ───────
  // One call per connected ad platform; the list comes back normalised. Each
  // campaign is a row (type:'ad') carrying the network's own status as it
  // came back ("ACTIVE", "PAUSED", …) — nothing is mapped or guessed. Its only
  // date is when it was created.
  const connectedAds = SERVER_AD_PLATFORMS.filter((p) =>
    integrations.some((i) => i.platform === p),
  );
  const adLists = await Promise.all(
    connectedAds.map(async (platform) => {
      try {
        const campaigns = await fetchCampaigns({ platform, limit: 25 });
        return campaigns.map((c) => {
          const created = c.created_time ? new Date(c.created_time) : null;
          return {
            id: `${platform}_campaign_${c.id}`,
            project_id: null,
            project_title: c.name || `${platform} campaign`,
            caption: c.objective ? `Objective: ${c.objective}` : "",
            // The ad's own creative image, when the network gives one (Meta
            // does; Google sends null).
            image_url: c.thumbnail || null,
            platform,
            type: "ad",
            status: c.status || "UNKNOWN",
            created_at:
              created && !Number.isNaN(created.getTime())
                ? created.toISOString()
                : null,
            post_id: String(c.id),
            stats: {},
          };
        });
      } catch (err) {
        console.warn(`${platform} campaigns fetch failed:`, err.message);
        fetchErrors.push(`${platform}: ${err.message}`);
        return [];
      }
    }),
  );
  adLists.forEach((list) => livePosts.push(...list));

  return livePosts;
}

// ─────────────────────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────────────────────

/**
 * Whether the backend can delete this platform's posts. Nothing else can be
 * deleted from here — there is no local list to drop a row from, so the pages
 * only offer delete where this is true. Ads have no delete endpoint at all; a
 * campaign is paused instead (or removed in the network's own Ads Manager).
 */
export function platformSupportsDelete(platform) {
  return SERVER_DELETE_PLATFORMS.includes(platform);
}

/**
 * Delete a post through the backend. Throws with the backend's own words when
 * it refuses — the post is still on the platform, so the caller keeps the row.
 */
export async function deletePostFromPlatform(post, brandId) {
  if (!platformSupportsDelete(post.platform) || !post.post_id) {
    throw new Error(`${post.platform} posts can't be deleted from here.`);
  }
  await deletePlatformPost({
    brand_id: brandId,
    platform: post.platform,
    post_id: post.post_id,
  });
}

// ─────────────────────────────────────────────────────────────
// OAuth Configs
// ─────────────────────────────────────────────────────────────

export const OAUTH_CONFIGS = {
  facebook: {
    authUrl: `${META_OAUTH_BASE}/dialog/oauth`,
    scope:
      "pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,ads_management",
  },

  google_ads: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",

    scope:
      "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email",
  },

  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",

    scope: "video.upload,video.list",
  },
};
