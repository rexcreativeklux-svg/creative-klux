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
 * Connected accounts are now stored in the backend (fetched via fetchIntegrations()).
 * localStorage is only used for published posts tracking.
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
  SERVER_DELETE_PLATFORMS,
  SERVER_PUBLISH_PLATFORMS,
  deletePlatformPost,
  fetchPlatformPosts,
  fetchPostMetrics,
  publishToPlatform,
  uploadForPublish,
} from "./creativesApi";

// Posts are stored per brand — `${POSTS_KEY_PREFIX}${brandId}`. The un-suffixed
// key below is the legacy single bucket that predates brand scoping; it is
// migrated once into the first brand that reads it (see migrateLegacyPosts).
const POSTS_KEY_PREFIX = "creativeklux_published_posts_";
const LEGACY_POSTS_KEY = "creativeklux_published_posts";
// Deliberately outside the POSTS_KEY_PREFIX namespace, so it can never be
// mistaken for the bucket of a brand literally named after it.
const LEGACY_MIGRATED_KEY = "creativeklux_posts_brand_migration_done";

// ─────────────────────────────────────────────────────────────
// Meta API Versioning
// ─────────────────────────────────────────────────────────────

const META_API_VERSION = "v23.0";

const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

const META_OAUTH_BASE = `https://www.facebook.com/${META_API_VERSION}`;

// ─────────────────────────────────────────────────────────────
// Published / Scheduled Posts (localStorage)
// ─────────────────────────────────────────────────────────────

function postsKey(brandId) {
  return `${POSTS_KEY_PREFIX}${brandId}`;
}

/**
 * One-time move of the pre-brand-scoping bucket into `brandId`.
 *
 * The legacy blob carries no brand of its own, so there is nothing to split it
 * by — the whole thing lands in the first brand that reads after this ships,
 * which is the right answer for the single-brand case and a recoverable guess
 * otherwise (published posts on connected platforms come back via Fetch Live
 * Posts regardless). The flag makes it happen once, so a later brand switch
 * doesn't drag the same posts into a second brand.
 */
function migrateLegacyPosts(brandId) {
  try {
    if (localStorage.getItem(LEGACY_MIGRATED_KEY)) return;

    const legacy = localStorage.getItem(LEGACY_POSTS_KEY);
    localStorage.setItem(LEGACY_MIGRATED_KEY, "1");
    if (!legacy) return;

    // Never clobber a brand bucket that already has posts.
    if (!localStorage.getItem(postsKey(brandId)))
      localStorage.setItem(postsKey(brandId), legacy);

    localStorage.removeItem(LEGACY_POSTS_KEY);
  } catch {
    // Storage unavailable — nothing to migrate, and the reads below handle it.
  }
}

export function getPublishedPosts(brandId) {
  // No active brand yet (still loading, or none selected) — there is no bucket
  // to read, and guessing one would show another brand's posts.
  if (!brandId) return [];

  try {
    migrateLegacyPosts(brandId);
    return JSON.parse(localStorage.getItem(postsKey(brandId)) || "[]");
  } catch {
    return [];
  }
}

/** Replace a brand's whole list — used by the live-merge in the content pages. */
export function setPublishedPosts(brandId, posts) {
  if (!brandId) return;

  try {
    localStorage.setItem(postsKey(brandId), JSON.stringify(posts));
  } catch {
    // Quota or a blocked store — the in-memory list still renders this session.
  }
}

export function savePublishedPost(brandId, post) {
  if (!brandId) {
    console.warn("savePublishedPost: no active brand — post not saved");
    return null;
  }

  const posts = getPublishedPosts(brandId);

  const existing = posts.findIndex((p) => p.id === post.id);

  if (existing >= 0) {
    posts[existing] = post;
  } else {
    posts.unshift({
      ...post,
      id: post.id || `post_${Date.now()}`,
    });
  }

  setPublishedPosts(brandId, posts);

  return posts.find((p) => p.id === post.id);
}

export function deletePublishedPost(brandId, id) {
  setPublishedPosts(
    brandId,
    getPublishedPosts(brandId).filter((p) => p.id !== id),
  );
}

export function updatePostStats(brandId, id, stats) {
  const posts = getPublishedPosts(brandId);

  const idx = posts.findIndex((p) => p.id === id);

  if (idx >= 0) {
    posts[idx].stats = {
      ...posts[idx].stats,
      ...stats,
      last_updated: new Date().toISOString(),
    };

    setPublishedPosts(brandId, posts);
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

// function buildAccountsMap(integrations) {
//   const map = {};

//   integrations.forEach((i) => {
//     map[i.platform] = {
//       access_token: i.int_token,

//       // NOTE:
//       // This is still temporary architecture.
//       // Eventually store dedicated IDs in backend.
//       page_id: i.int_id,
//       ig_user_id: i.int_id,
//       ad_account_id: i.int_id,
//     };
//   });

//   return map;
// }

function buildAccountsMap(integrations) {
  const map = {};

  integrations.forEach((i) => {
    const base = {
      access_token: i.int_token,
    };

    switch (i.platform) {
      case "facebook":
        map.facebook = {
          ...base,
          page_id: i.int_id,
        };
        break;

      case "instagram":
        map.instagram = {
          ...base,
          ig_user_id: i.int_id,
        };
        break;

      case "meta_ads":
        map.meta_ads = {
          ...base,
          ad_account_id: i.int_id,
        };
        break;

      case "youtube":
        map.youtube = {
          ...base,
          channel_id: i.int_id,
        };
        break;

      default:
        map[i.platform] = base;
    }
  });

  return map;
}

/**
 * Fetch Facebook Pages from a user token.
 */
export async function fetchFacebookPageId(userAccessToken) {
  try {
    const res = await fetch(
      `${META_GRAPH_BASE}/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token`,
    );

    const data = await res.json();

    if (data.error || !data.data?.length) {
      return null;
    }

    return {
      page_id: data.data[0].id,
      page_access_token: data.data[0].access_token,
      page_name: data.data[0].name,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Platform API Calls
// ─────────────────────────────────────────────────────────────

/**
 * Publish to Facebook Page
 */
export async function publishToFacebook({
  image_url,
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
    link,
  });
}

/**
 * Publish to Instagram Business account
 */
export async function publishToInstagram({ image_url, caption, brand_id }) {
  if (!image_url) throw new Error("Instagram requires an image or video.");
  return publishToPlatform("instagram", { brand_id, text: caption, image_url });
}

/**
 * Publish a REAL Meta ad: campaign → ad set → ad creative → ad.
 * Goes live (status ACTIVE) — it spends real money, so the caller's form collects budget/etc.
 *
 * Requires:
 *  - ad_account_id  (from the meta_ads integration; needs a payment method set up in Ads Manager)
 *  - page_id        (the ad runs "as" a Facebook Page — taken from the connected facebook integration)
 *  - access_token   (a token with ads_management on that ad account)
 *
 * Form inputs: goal ('awareness'|'traffic'|'engagement'), daily_budget (whole units of the
 * account currency, e.g. 5 = $5/day), days (run length), country (ISO-2 code), link (destination).
 */
const META_ADS_GOALS = {
  awareness: { objective: "OUTCOME_AWARENESS", optimization_goal: "REACH" },
  traffic: { objective: "OUTCOME_TRAFFIC", optimization_goal: "LINK_CLICKS" },
  engagement: {
    objective: "OUTCOME_ENGAGEMENT",
    optimization_goal: "POST_ENGAGEMENT",
  },
};

export async function publishToMetaAds({
  access_token,
  ad_account_id,
  page_id,
  image_url,
  message,
  link,
  goal = "traffic",
  daily_budget,
  days = 7,
  country = "US",
  ad_name,
}) {
  if (!access_token) throw new Error("No access token — reconnect Meta Ads.");
  if (!ad_account_id) throw new Error("No ad account — reconnect Meta Ads.");
  if (!page_id)
    throw new Error("Connect a Facebook Page first — Meta ads run as a Page.");
  if (!image_url) throw new Error("No image to advertise.");
  if (!daily_budget || daily_budget <= 0)
    throw new Error("Enter a daily budget.");

  const acct = ad_account_id.startsWith("act_")
    ? ad_account_id
    : `act_${ad_account_id}`;
  const base = `${META_GRAPH_BASE}/${acct}`;
  const g = META_ADS_GOALS[goal] || META_ADS_GOALS.traffic;
  const dest = link || "https://www.facebook.com";
  const name = ad_name || "CreativeKlux Ad";

  // Small POST helper that surfaces the full Graph error (logs status + body).
  const post = async (path, body) => {
    let res,
      data = {};
    try {
      res = await fetch(`${base}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, access_token }),
      });
      data = await res.json();
    } catch (netErr) {
      console.error(`Meta Ads ${path} network/CORS error:`, netErr);
      throw new Error(
        "Could not reach Meta Ads. Ad-account calls may be blocked from the browser — this likely needs a backend.",
      );
    }
    if (!res.ok || data.error) {
      console.error(`Meta Ads ${path} error (HTTP ${res.status}):`, data);
      const e = data.error || {};
      const msg =
        e.error_user_msg ||
        e.message ||
        `Meta Ads "${path}" failed (HTTP ${res.status}). Usually means: the ad account has no payment method, the token lacks ads_management, or the account/app is restricted.`;
      throw new Error(
        `${msg}${e.code ? ` [code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ""}]` : ""}`,
      );
    }
    return data;
  };

  // Best-effort delete of any object by id (used to clean up after a partial failure).
  // Deleting a campaign cascades to its ad sets / ads, so removing the campaign is enough.
  const del = async (id) => {
    try {
      await fetch(
        `${META_GRAPH_BASE}/${id}?access_token=${encodeURIComponent(access_token)}`,
        { method: "DELETE" },
      );
    } catch (cleanupErr) {
      console.warn(`Meta Ads cleanup of ${id} failed:`, cleanupErr?.message);
    }
  };

  // 1. Campaign (the goal/objective). Budget lives on the ad set, so we must explicitly
  //    opt out of campaign-level budget sharing (is_adset_budget_sharing_enabled).
  const campaign = await post("campaigns", {
    name: `${name} — Campaign`,
    objective: g.objective,
    status: "ACTIVE",
    special_ad_categories: [],
    is_adset_budget_sharing_enabled: false,
  });

  // Steps 2-4 build on the campaign. If any throws, the campaign (and whatever ad set we
  // got to) would be left orphaned in Ads Manager — so delete the campaign before rethrowing.
  let adset, creative, ad;
  try {
    // 2. Ad set (budget, schedule, audience). Budget is in the currency's minor units (×100).
    const now = Math.floor(Date.now() / 1000);
    adset = await post("adsets", {
      name: `${name} — Ad Set`,
      campaign_id: campaign.id,
      daily_budget: Math.round(Number(daily_budget) * 100),
      billing_event: "IMPRESSIONS",
      optimization_goal: g.optimization_goal,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      start_time: now,
      end_time: now + Math.max(1, Number(days)) * 86400,
      targeting: {
        geo_locations: { countries: [country] },
        age_min: 18,
        age_max: 65,
      },
      status: "ACTIVE",
    });

    // 3. Ad creative — use the public image URL directly (`picture`) instead of uploading
    //    to /adimages first (one fewer call, and adimages-by-url is unreliable).
    creative = await post("adcreatives", {
      name: `${name} — Creative`,
      object_story_spec: {
        page_id,
        link_data: {
          picture: image_url,
          message: message || "",
          link: dest,
          call_to_action: { type: "LEARN_MORE", value: { link: dest } },
        },
      },
    });

    // 4. Ad (ties the creative to the ad set, live)
    ad = await post("ads", {
      name,
      adset_id: adset.id,
      creative: { creative_id: creative.id },
      status: "ACTIVE",
    });
  } catch (err) {
    // Roll back: deleting the campaign cascades to the ad set we may have created.
    await del(campaign.id);
    throw err;
  }

  return {
    post_id: ad.id,
    campaign_id: campaign.id,
    adset_id: adset.id,
    creative_id: creative.id,
  };
}

// ─────────────────────────────────────────────────────────────
// Google Ads (UNTESTED wiring)
// ─────────────────────────────────────────────────────────────
//
// Unlike Meta (which works browser-side), the Google Ads API blocks browser CORS and
// needs the developer token, so the whole campaign chain runs server-side in
// /api/google-ads/publish. This just calls that route. The campaign is created PAUSED
// (does NOT spend until reviewed in Ads Manager). See the route for the full caveat list.
export async function publishToGoogleAds({
  refresh_token,
  customer_id,
  image_url,
  final_url,
  headline,
  long_headline,
  description,
  business_name,
  daily_budget,
  campaign_name,
}) {
  const res = await fetch("/api/google-ads/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refresh_token,
      customer_id,
      image_url,
      final_url,
      headline,
      long_headline,
      description,
      business_name,
      daily_budget,
      campaign_name,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Google Ads publish failed");
  return data; // { ok, campaign, responses }
}

// ─────────────────────────────────────────────────────────────
// YouTube
// ─────────────────────────────────────────────────────────────
//
// YouTube ONLY accepts video uploads — there is no "image post". Our creatives
// are images / canvas designs, so to publish we first turn the image into a short
// video clip *in the browser* (canvas + MediaRecorder → a .webm blob), then run
// YouTube's resumable upload. No backend / ffmpeg needed.

// Route http(s) images through the proxy so the canvas isn't CORS-tainted
// (a tainted canvas can't be captured to a video). Leaves data:/blob: alone.
function ytProxiedSrc(src) {
  if (!src) return src;
  if (/^https?:/i.test(src)) {
    return `/api/proxy-image?url=${encodeURIComponent(src)}`;
  }
  return src;
}

function ytLoadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Failed to load the image to build the video."));
    img.src = ytProxiedSrc(url);
  });
}

// Pick a MediaRecorder mime type the browser actually supports. YouTube accepts webm.
function ytPickMime() {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
    for (const m of candidates) {
      if (MediaRecorder.isTypeSupported(m)) return m;
    }
  }
  return "video/webm";
}

/**
 * Turn a still image into a short looping-still video Blob, entirely in-browser.
 * Draws the image onto a canvas, captures the canvas as a media stream, and records
 * it for `durationSec` seconds with MediaRecorder.
 */
export async function imageUrlToVideoBlob(
  imageUrl,
  { durationSec = 5, fps = 30 } = {},
) {
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    throw new Error("Video creation is only available in the browser.");
  }

  const img = await ytLoadImage(imageUrl);

  // Even dimensions (some encoders require it); cap to keep the file reasonable.
  const cap = 1920;
  let w = img.naturalWidth || 1280;
  let h = img.naturalHeight || 720;
  if (w > cap || h > cap) {
    const scale = cap / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  w = Math.max(2, w - (w % 2));
  h = Math.max(2, h - (h % 2));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  const stream = canvas.captureStream(fps);
  const mimeType = ytPickMime();
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    let raf;
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.onstop = () => {
      stop();
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.onerror = (e) => {
      stop();
      reject(e.error || new Error("Video recording failed."));
    };

    // Keep the stream alive by continuously redrawing the still frame.
    const draw = () => {
      ctx.drawImage(img, 0, 0, w, h);
      raf = requestAnimationFrame(draw);
    };
    draw();

    recorder.start();
    setTimeout(
      () => {
        try {
          recorder.stop();
        } catch (err) {
          stop();
          reject(err);
        }
      },
      Math.max(1, durationSec) * 1000,
    );
  });
}

/**
 * The hosted `video_url` the publishing API needs for TikTok and YouTube. Our
 * creatives are images, so unless a real video is passed the image is turned
 * into a short clip in the browser, then uploaded to get a public URL.
 */
async function hostedVideoFor({ image_url, video, durationSec = 5 }) {
  let blob = video || null;
  if (!blob) {
    if (!image_url) {
      throw new Error("Nothing to publish — no video or image was provided.");
    }
    blob = await imageUrlToVideoBlob(image_url, { durationSec });
  }
  const ext = (blob.type || "").includes("mp4") ? "mp4" : "webm";
  return uploadForPublish(
    blob instanceof File
      ? blob
      : new File([blob], `creative.${ext}`, { type: blob.type || "video/webm" }),
  );
}

/**
 * creatives/post-metrics passes through whatever the platform returns, so the
 * shape differs per network — pull the numbers the UI shows from wherever they
 * are (flat fields, or a `public_metrics` / `metrics` / `insights` object).
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
    return 0;
  };
  return {
    impressions: num("impressions", "impression_count", "views", "view_count"),
    reach: num("reach"),
    clicks: num("clicks", "link_clicks"),
    likes: num("likes", "like_count", "reactions"),
    comments: num("comments", "comment_count", "reply_count"),
    shares: num("shares", "share_count", "retweet_count"),
    saves: num("saves", "saved", "bookmark_count"),
  };
}

/**
 * Publish a video to YouTube.
 *
 * The video is built in the BROWSER (canvas + MediaRecorder, which are browser-only) and
 * then handed to /api/youtube/upload, which does the resumable upload SERVER-SIDE —
 * googleapis' upload endpoint has no browser CORS, so a direct upload is blocked.
 *
 * Pass a real `video` Blob/File when you have one; otherwise pass `image_url` and it's
 * converted to a short video first. Requires a token with the `youtube.upload` scope.
 *
 *  - access_token   from the youtube integration (int_token)
 *  - title / description  video metadata (title capped to 100 chars)
 *  - privacyStatus  'public' | 'unlisted' | 'private'
 *  - publishAt      optional ISO string — schedules the video (forces privacyStatus 'private')
 */
export async function publishToYouTube({
  title,
  description,
  image_url,
  video,
  privacyStatus = "public",
  publishAt,
  durationSec = 5,
  brand_id,
}) {
  if (publishAt) {
    throw new Error(
      "Scheduling isn't available yet — the publishing API can only post now.",
    );
  }
  const video_url = await hostedVideoFor({ image_url, video, durationSec });
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
// X has no browser CORS, so the actual posting happens server-side in
// /api/twitter/post. Here we just call that route. X access tokens last ~2h and the
// refresh token rotates on every use, so we keep the *current* refresh token in
// localStorage (keyed by integration id) as a stopgap until the backend persists it,
// and overwrite it with the rotated value the route returns after each post.

const X_REFRESH_KEY = (id) => `ck_x_refresh_${id}`;

export function getStoredXRefresh(integrationId) {
  if (typeof window === "undefined" || !integrationId) return null;
  try {
    return localStorage.getItem(X_REFRESH_KEY(integrationId));
  } catch {
    return null;
  }
}

export function setStoredXRefresh(integrationId, token) {
  if (typeof window === "undefined" || !integrationId || !token) return;
  try {
    localStorage.setItem(X_REFRESH_KEY(integrationId), token);
  } catch {
    /* storage unavailable — ignore */
  }
}

/**
 * Post to X (Twitter). Resolves the refresh token (passed in from the backend record
 * if present, else from localStorage), hands it to the server route, and persists the
 * rotated refresh token the route returns.
 *
 *  - integration_id  the saved integration's id (used as the localStorage key)
 *  - refresh_token   optional — from the backend record once it stores int_refresh_token
 *  - text            tweet body (capped to 280 server-side)
 *  - image_url       optional public image URL to attach
 */
export async function publishToTwitter({ text, image_url, brand_id }) {
  const res = await publishToPlatform("twitter", { brand_id, text, image_url });
  return {
    ...res,
    url: res.post_id ? `https://x.com/i/web/status/${res.post_id}` : undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// LinkedIn
// ─────────────────────────────────────────────────────────────
//
// LinkedIn has no browser CORS, so posting runs server-side in /api/linkedin/post.
// Gated by LINKEDIN_POSTING_ENABLED (linkedinConfig.js): the Publish modal only routes
// here when LinkedIn is `real`, which is tied to that same flag. Token comes from the
// integration record (LinkedIn tokens last ~60 days; no refresh dance like X).

/**
 * Post to LinkedIn (the connected member's own feed).
 *  - access_token  the integration's int_token
 *  - author_id     the integration's int_id (LinkedIn member id = OpenID `sub`)
 *  - text          post commentary
 *  - image_url     optional public image URL to attach
 */
export async function publishToLinkedIn({ text, image_url, brand_id }) {
  const res = await publishToPlatform("linkedin", { brand_id, text, image_url });
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
// Pinterest is image-native: a "pin" is an image on a board. No browser CORS, so the
// calls go through server routes. A pin MUST go on a board, so publishing needs a
// board_id (the modal shows a board picker fed by fetchPinterestBoards).

/** List the connected account's boards (for the board picker). */
export async function fetchPinterestBoards(access_token) {
  const res = await fetch("/api/pinterest/boards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || "Couldn't load your Pinterest boards.");
  }
  return data.boards || [];
}

/**
 * Create a Pin.
 *  - access_token  the integration's int_token
 *  - board_id      which board to pin to (required — pins live on boards)
 *  - title/description  pin metadata
 *  - image_url     public image URL (Pinterest fetches it)
 *  - link          optional click-through URL
 */
export async function publishToPinterest({
  board_id,
  title,
  description,
  image_url,
  link,
  brand_id,
}) {
  if (!board_id) throw new Error("Pick a Pinterest board first.");
  if (!image_url) throw new Error("Pinterest needs an image to create a pin.");
  return publishToPlatform("pinterest", {
    brand_id,
    board_id,
    title,
    text: description,
    image_url,
    link,
  });
}

// ─────────────────────────────────────────────────────────────
// Pinterest ADS (promoted pin, UNTESTED)
// ─────────────────────────────────────────────────────────────
//
// Image-native (no video bridge) — a Pinterest ad is a promoted pin. Reuses the connected
// Pinterest token (pinterest_ads scope already has ads:write). Server-side route builds
// pin → campaign → ad group → ad, all PAUSED. See /api/pinterest-ads/publish for caveats.
export async function publishToPinterestAds({
  access_token,
  ad_account_id,
  board_id,
  image_url,
  title,
  description,
  link,
  daily_budget,
  campaign_name,
}) {
  if (!access_token || !ad_account_id)
    throw new Error("Reconnect Pinterest Ads — missing token / ad account.");
  if (!board_id) throw new Error("Pick a Pinterest board first.");
  if (!image_url) throw new Error("Pinterest needs an image to promote.");

  const res = await fetch("/api/pinterest-ads/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token,
      ad_account_id,
      board_id,
      image_url,
      title,
      description,
      link,
      daily_budget,
      campaign_name,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error)
    throw new Error(data.error || "Pinterest Ads publish failed");
  return data; // { ok, pin_id, campaign_id, ad_group_id, ad_id }
}

/**
 * Publish a single-image Sponsored Content ad to LinkedIn (campaign group → campaign →
 * post → creative), all created DRAFT/PAUSED. Runs server-side (/api/linkedin-ads/publish)
 * because api.linkedin.com has no browser CORS and needs the versioned headers.
 *
 *  - access_token    the LinkedIn ads token (int_token)
 *  - ad_account_id   the chosen LinkedIn ad account id (int_id)
 *  - image_url       public image URL to promote
 *  - text            ad copy / caption
 *  - link            destination URL (brand site) — makes the ad a clickable link share
 *  - daily_budget    daily budget (currency-naïve — uses the ad account's currency)
 *  - country         target country code → LinkedIn geo URN (defaults to US)
 */
export async function publishToLinkedInAds({
  access_token,
  ad_account_id,
  image_url,
  text,
  link,
  daily_budget,
  campaign_name,
  country,
}) {
  if (!access_token || !ad_account_id)
    throw new Error("Reconnect LinkedIn Ads — missing token / ad account.");
  if (!image_url) throw new Error("LinkedIn ads need an image to promote.");

  const res = await fetch("/api/linkedin-ads/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token,
      ad_account_id,
      image_url,
      text,
      link,
      daily_budget,
      campaign_name,
      country,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error)
    throw new Error(data.error || "LinkedIn Ads publish failed");
  return data; // { ok, post_urn, campaign_group_urn, campaign_urn, creative_id }
}

/**
 * Publish a single-image Snap ad (media → creative → campaign → ad squad → ad), all created
 * PAUSED. Runs server-side (/api/snapchat-ads/publish) — Snapchat needs the client secret to
 * refresh its ~1h token and has no browser CORS.
 *
 *  - access_token    Snapchat ads token (int_token)
 *  - refresh_token   long-lived refresh token (int_refresh_token) — used to mint a fresh token
 *  - ad_account_id   the chosen Snapchat ad account id (int_id)
 *  - image_url       public image URL to promote (ideally 9:16)
 *  - headline        short ad headline
 *  - brand_name      brand name shown on the ad
 *  - link            destination URL → makes the ad a clickable web-view ad
 *  - daily_budget    daily budget (currency-naïve; converted to micro-currency server-side)
 *  - country         target country code → Snapchat geo (defaults to US)
 */
export async function publishToSnapchatAds({
  access_token,
  refresh_token,
  ad_account_id,
  image_url,
  headline,
  brand_name,
  link,
  daily_budget,
  campaign_name,
  country,
}) {
  if (!ad_account_id)
    throw new Error("Reconnect Snapchat Ads — missing ad account.");
  if (!image_url) throw new Error("Snapchat ads need an image to promote.");

  const res = await fetch("/api/snapchat-ads/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token,
      refresh_token,
      ad_account_id,
      image_url,
      headline,
      brand_name,
      link,
      daily_budget,
      campaign_name,
      country,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error)
    throw new Error(data.error || "Snapchat Ads publish failed");
  return data; // { ok, media_id, creative_id, campaign_id, ad_squad_id, ad_id }
}

// ─────────────────────────────────────────────────────────────
// TikTok
// ─────────────────────────────────────────────────────────────
//
// TikTok has no browser CORS, so posting + reading run server-side (/api/tiktok/post,
// /api/tiktok/posts). It's a PHOTO post (image-native — no video bridge): TikTok fetches
// the public image URL itself (PULL_FROM_URL). TikTok access tokens last ~24h and the
// refresh token can rotate, so — like X — we keep the *current* refresh token in
// localStorage (keyed by integration id) as a stopgap until the backend persists it, and
// overwrite it with whatever the route returns after each call.

const TIKTOK_REFRESH_KEY = (id) => `ck_tiktok_refresh_${id}`;

export function getStoredTikTokRefresh(integrationId) {
  if (typeof window === "undefined" || !integrationId) return null;
  try {
    return localStorage.getItem(TIKTOK_REFRESH_KEY(integrationId));
  } catch {
    return null;
  }
}

export function setStoredTikTokRefresh(integrationId, token) {
  if (typeof window === "undefined" || !integrationId || !token) return;
  try {
    localStorage.setItem(TIKTOK_REFRESH_KEY(integrationId), token);
  } catch {
    /* storage unavailable — ignore */
  }
}

/**
 * Post a photo to TikTok. Resolves the refresh token (from the backend record if present,
 * else localStorage), hands it to the server route, and persists the rotated refresh token
 * the route returns.
 *
 *  - integration_id  the saved integration's id (used as the localStorage key)
 *  - refresh_token   optional — from the backend record once it stores int_refresh_token
 *  - title           short title (first line of the caption)
 *  - description     full caption
 *  - image_url       public image URL (TikTok fetches it)
 *  - privacy_level   "PUBLIC_TO_EVERYONE" (default) | "SELF_ONLY" (pre-audit testing) | …
 */
export async function publishToTikTok({
  title,
  description,
  image_url,
  video,
  privacy_level,
  brand_id,
}) {
  // The creative goes to the API as it is: an image is sent as `image_url`
  // (the server posts it to TikTok itself). Only a real video is uploaded for a
  // `video_url` — nothing is converted in the browser.
  const video_url = video ? await hostedVideoFor({ video }) : undefined;
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
// TikTok ADS (Marketing API, UNTESTED scaffold)
// ─────────────────────────────────────────────────────────────
//
// Separate from the organic TikTok above (different app/API). TikTok ads are video-first,
// so we bridge the image creative into a short video in-browser (imageUrlToVideoBlob, same
// as YouTube), then POST it (multipart) to /api/tiktok-ads/publish which uploads it and
// builds the campaign → ad group → ad chain (all created PAUSED). See the route for caveats.
export async function publishToTikTokAds({
  access_token,
  advertiser_id,
  image_url,
  video,
  ad_text,
  landing_url,
  daily_budget,
  campaign_name,
  location_ids,
}) {
  if (!access_token || !advertiser_id)
    throw new Error("Reconnect TikTok Ads — missing token / advertiser.");
  // Bridge image → short video (unless a real video Blob is supplied).
  const blob =
    video ||
    (image_url
      ? await imageUrlToVideoBlob(image_url, { durationSec: 5 })
      : null);
  if (!blob) throw new Error("No creative to advertise.");

  const form = new FormData();
  form.append("access_token", access_token);
  form.append("advertiser_id", advertiser_id);
  form.append("video", blob, "creative.mp4");
  form.append("ad_text", ad_text || "");
  form.append("landing_url", landing_url || "");
  form.append("daily_budget", String(daily_budget || 2000));
  form.append("campaign_name", campaign_name || "Creative Klux Campaign");
  form.append("location_ids", JSON.stringify(location_ids || []));

  const res = await fetch("/api/tiktok-ads/publish", {
    method: "POST",
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error)
    throw new Error(data.error || "TikTok Ads publish failed");
  return data; // { ok, campaign_id, adgroup_id, ad_ids }
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

export async function getMetaAdsCampaignStats({ access_token, campaign_id }) {
  const res = await fetch(
    `${META_GRAPH_BASE}/${campaign_id}/insights?fields=impressions,reach,clicks,ctr&access_token=${access_token}`,
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const insight = data.data?.[0] || {};

  return {
    impressions: Number(insight.impressions || 0),
    reach: Number(insight.reach || 0),
    clicks: Number(insight.clicks || 0),
    ctr: Number(insight.ctr || 0),
  };
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
  const accounts = buildAccountsMap(integrations);

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

  // ── Meta Ads ─────────────────────────

  if (accounts.meta_ads?.access_token && accounts.meta_ads?.ad_account_id) {
    try {
      const rawAccountId = accounts.meta_ads.ad_account_id;

      const normalizedAccountId = rawAccountId.startsWith("act_")
        ? rawAccountId
        : `act_${rawAccountId}`;

      const res = await fetch(
        `${META_GRAPH_BASE}/${normalizedAccountId}/campaigns?fields=id,name,status,created_time,objective&limit=20&access_token=${accounts.meta_ads.access_token}`,
      );

      const data = await res.json();

      if (!data.error && data.data) {
        data.data.forEach((campaign) => {
          livePosts.push({
            id: `meta_campaign_${campaign.id}`,
            project_id: null,
            project_title: campaign.name,
            caption: `Objective: ${
              campaign.objective || "N/A"
            } · Status: ${campaign.status}`,
            image_url: null,
            platform: "meta_ads",
            type: "ad",
            status: campaign.status === "ACTIVE" ? "published" : "scheduled",
            published_at: campaign.created_time,
            // Campaigns have no separate schedule time — use created_time so non-ACTIVE
            // campaigns still land on a calendar day (otherwise they're invisible).
            scheduled_at: campaign.created_time,
            post_id: campaign.id,
            live: true,
            stats: {},
          });
        });
      }
    } catch (err) {
      console.warn("Meta Ads live fetch failed:", err.message);
    }
  }

  // ── Server-side ad platforms (Google / TikTok / Pinterest / LinkedIn / Snapchat Ads) ──
  // These APIs block browser CORS, so each lists its campaigns via a BFF route. We map every
  // campaign to a calendar post (type:'ad'); a live/enabled campaign is "published", anything
  // else (paused/draft) is "scheduled" so it still lands on a calendar day. They use the raw
  // integration record (need int_id / int_refresh_token), not buildAccountsMap.
  const pushAdCampaigns = (platform, campaigns, isLive, whenOf) => {
    (campaigns || []).forEach((c) => {
      let when = null;
      try {
        when = whenOf(c);
      } catch {
        when = null;
      }
      const live = isLive(c);
      livePosts.push({
        id: `${platform}_campaign_${c.id}`,
        project_id: null,
        project_title: c.name || `${platform} campaign`,
        caption: `Status: ${c.status || "N/A"}`,
        image_url: null,
        platform,
        type: "ad",
        status: live ? "published" : "scheduled",
        published_at: when,
        scheduled_at: when, // campaigns have no separate schedule time — use created/start
        post_id: c.id,
        live: true,
        stats: {},
      });
    });
  };

  // Google Ads
  {
    const gi = integrations.find((i) => i.platform === "google_ads");
    if (gi?.int_refresh_token && gi.int_id) {
      try {
        const res = await fetch("/api/google-ads/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refresh_token: gi.int_refresh_token,
            customer_id: gi.int_id,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && !data.error) {
          pushAdCampaigns(
            "google_ads",
            data.campaigns,
            (c) => c.status === "ENABLED",
            (c) => (c.start_date ? new Date(c.start_date).toISOString() : null),
          );
        } else console.warn("Google Ads list error:", data.error);
      } catch (err) {
        console.warn("Google Ads live fetch failed:", err.message);
      }
    }
  }

  // TikTok Ads
  {
    const ti = integrations.find((i) => i.platform === "tiktok_ads");
    if (ti?.int_token && ti.int_id) {
      try {
        const res = await fetch("/api/tiktok-ads/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: ti.int_token,
            advertiser_id: ti.int_id,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && !data.error) {
          pushAdCampaigns(
            "tiktok_ads",
            data.campaigns,
            (c) => c.status === "ENABLE",
            (c) =>
              c.create_time
                ? new Date(c.create_time.replace(" ", "T") + "Z").toISOString()
                : null,
          );
        } else console.warn("TikTok Ads list error:", data.error);
      } catch (err) {
        console.warn("TikTok Ads live fetch failed:", err.message);
      }
    }
  }

  // Pinterest Ads
  {
    const pi = integrations.find((i) => i.platform === "pinterest_ads");
    if (pi?.int_token && pi.int_id) {
      try {
        const res = await fetch("/api/pinterest-ads/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: pi.int_token,
            ad_account_id: pi.int_id,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && !data.error) {
          pushAdCampaigns(
            "pinterest_ads",
            data.campaigns,
            (c) => c.status === "ACTIVE",
            (c) =>
              c.created_time
                ? new Date(c.created_time * 1000).toISOString()
                : null,
          );
        } else console.warn("Pinterest Ads list error:", data.error);
      } catch (err) {
        console.warn("Pinterest Ads live fetch failed:", err.message);
      }
    }
  }

  // LinkedIn Ads
  {
    const li = integrations.find((i) => i.platform === "linkedin_ads");
    if (li?.int_token && li.int_id) {
      try {
        const res = await fetch("/api/linkedin-ads/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: li.int_token,
            ad_account_id: li.int_id,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && !data.error) {
          pushAdCampaigns(
            "linkedin_ads",
            data.campaigns,
            (c) => c.status === "ACTIVE",
            (c) =>
              c.created_time ? new Date(c.created_time).toISOString() : null,
          );
        } else console.warn("LinkedIn Ads list error:", data.error);
      } catch (err) {
        console.warn("LinkedIn Ads live fetch failed:", err.message);
      }
    }
  }

  // Snapchat Ads
  {
    const si = integrations.find((i) => i.platform === "snapchat_ads");
    if (si?.int_id && (si.int_token || si.int_refresh_token)) {
      try {
        const res = await fetch("/api/snapchat-ads/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: si.int_token,
            refresh_token: si.int_refresh_token,
            ad_account_id: si.int_id,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && !data.error) {
          pushAdCampaigns(
            "snapchat_ads",
            data.campaigns,
            (c) => c.status === "ACTIVE",
            (c) => (c.created_at ? new Date(c.created_at).toISOString() : null),
          );
        } else console.warn("Snapchat Ads list error:", data.error);
      } catch (err) {
        console.warn("Snapchat Ads live fetch failed:", err.message);
      }
    }
  }

  return livePosts;
}

// ─────────────────────────────────────────────────────────────
// Delete / Update
// ─────────────────────────────────────────────────────────────

/**
 * DELETE a node on the Graph API. fetch() does not reject on 4xx and Graph
 * reports failures in the body, so both have to be inspected — otherwise a
 * refused delete looks identical to a successful one and the post gets dropped
 * locally while it's still live on the platform.
 */
async function deleteMetaNode(nodeId, token) {
  const res = await fetch(`${META_GRAPH_BASE}/${nodeId}?access_token=${token}`, {
    method: "DELETE",
  });
  const data = await res.json().catch(() => ({}));

  if (data.error) {
    // Subcode 33 = the node isn't there (already deleted on the platform, most
    // often by hand). Nothing left to delete, so let the local removal proceed —
    // throwing here would strand the row with no way to clear it.
    if (data.error.error_subcode === 33) return;
    throw new Error(data.error.message);
  }
  if (!res.ok) throw new Error(`Delete failed (HTTP ${res.status})`);
}

/**
 * Whether a delete here also removes the post from the platform. Instagram has
 * no delete API for published media, and the rest are publish-only integrations,
 * so those are local-only removals — the confirm copy says so.
 */
export function platformSupportsDelete(platform) {
  return SERVER_DELETE_PLATFORMS.includes(platform) || platform === "meta_ads";
}

/**
 * Remove a post from the platform, then from local storage.
 *
 * Throws if the platform refuses the delete — the caller surfaces that and the
 * post stays in the list, because it still exists on the platform. Platforms
 * outside platformSupportsDelete() are removed locally only.
 */
export async function deletePostFromPlatform(post, integrations = [], brandId) {
  if (SERVER_DELETE_PLATFORMS.includes(post.platform) && post.post_id) {
    // Social posts are deleted by the API, with the id stored at publish time.
    await deletePlatformPost({
      brand_id: brandId,
      platform: post.platform,
      post_id: post.post_id,
    });
  } else if (post.platform === "meta_ads" && post.post_id) {
    // Ads aren't covered by the publishing API yet — still a direct Graph call.
    const token = buildAccountsMap(integrations).meta_ads?.access_token;
    if (token) await deleteMetaNode(post.post_id, token);
  }

  deletePublishedPost(brandId, post.id);
}

export async function updatePostCaptionOnPlatform(
  post,
  newCaption,
  integrations = [],
) {
  const accounts = buildAccountsMap(integrations);

  if (post.platform === "facebook" && post.post_id) {
    const token = post._page_access_token || accounts.facebook?.access_token;

    if (token) {
      const res = await fetch(
        `${META_GRAPH_BASE}/${post.post_id}?access_token=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: newCaption,
          }),
        },
      );

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message);
      }
    }
  } else if (post.platform === "youtube" && post.post_id) {
    // post.post_id is the YouTube video id. "Caption" maps to the video description.
    const token = accounts.youtube?.access_token;
    if (!token) {
      throw new Error("No access token — reconnect your YouTube account.");
    }
    const res = await fetch("/api/youtube/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: token,
        video_id: post.post_id,
        title: post.project_title,
        description: newCaption,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error || "YouTube update failed.");
    }
  } else if (post.platform === "pinterest" && post.post_id) {
    // post.post_id is the Pinterest pin id. "Caption" maps to the pin description.
    const token = accounts.pinterest?.access_token;
    if (!token) {
      throw new Error("No access token — reconnect Pinterest.");
    }
    const res = await fetch("/api/pinterest/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: token,
        pin_id: post.post_id,
        description: newCaption,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error || "Pinterest update failed.");
    }
  }
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
