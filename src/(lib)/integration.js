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
//     const res = await fetch(
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

const POSTS_KEY = 'creativeklux_published_posts';

// ─────────────────────────────────────────────────────────────
// Meta API Versioning
// ─────────────────────────────────────────────────────────────

const META_API_VERSION = 'v23.0';

const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`;
const META_OAUTH_BASE = `https://www.facebook.com/${META_API_VERSION}`;

// ─────────────────────────────────────────────────────────────
// Published / Scheduled Posts (localStorage)
// ─────────────────────────────────────────────────────────────

export function getPublishedPosts() {
  try {
    return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function savePublishedPost(post) {
  const posts = getPublishedPosts();

  const existing = posts.findIndex((p) => p.id === post.id);

  if (existing >= 0) {
    posts[existing] = post;
  } else {
    posts.unshift({
      ...post,
      id: post.id || `post_${Date.now()}`,
    });
  }

  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));

  return posts.find((p) => p.id === post.id);
}

export function deletePublishedPost(id) {
  const posts = getPublishedPosts().filter((p) => p.id !== id);

  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export function updatePostStats(id, stats) {
  const posts = getPublishedPosts();

  const idx = posts.findIndex((p) => p.id === id);

  if (idx >= 0) {
    posts[idx].stats = {
      ...posts[idx].stats,
      ...stats,
      last_updated: new Date().toISOString(),
    };

    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
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
      case 'facebook':
        map.facebook = {
          ...base,
          page_id: i.int_id,
        };
        break;

      case 'instagram':
        map.instagram = {
          ...base,
          ig_user_id: i.int_id,
        };
        break;

      case 'meta_ads':
        map.meta_ads = {
          ...base,
          ad_account_id: i.int_id,
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
      `${META_GRAPH_BASE}/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token`
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
  access_token,
  page_id,
  image_url,
  caption,
}) {
  if (!access_token) {
    throw new Error(
      'No access token — reconnect your Facebook account.'
    );
  }

  let resolvedPageId = page_id;
  let resolvedToken = access_token;

  // if (!resolvedPageId) {
  //   const page = await fetchFacebookPageId(access_token);

  //   if (!page) {
  //     throw new Error(
  //       'No Facebook Page found — make sure your account manages at least one Page.'
  //     );
  //   }

  //   resolvedPageId = page.page_id;
  //   resolvedToken = page.page_access_token;
  // }
  if (!page_id) {
    throw new Error(
      'Missing Facebook Page ID.'
    );
  }

  // Text-only post
  if (!image_url) {
    const res = await fetch(
      `${META_GRAPH_BASE}/${resolvedPageId}/feed?access_token=${encodeURIComponent(
        resolvedToken
      )}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: caption,
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      post_id: data.id,
    };
  }

  // Image post
  const res = await fetch(
    `${META_GRAPH_BASE}/${resolvedPageId}/photos?access_token=${encodeURIComponent(
      resolvedToken
    )}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: image_url,
        caption,
        published: true,
      }),
    }
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    post_id: data.post_id || data.id,
  };
}

/**
 * Publish to Instagram Business account
 */
export async function publishToInstagram({
  access_token,
  ig_user_id,
  image_url,
  caption,
}) {
  if (!ig_user_id) {
    throw new Error(
      'No Instagram Business Account ID — reconnect Instagram.'
    );
  }

  if (!access_token) {
    throw new Error(
      'No access token — reconnect Instagram.'
    );
  }

  // Create media container
  const containerRes = await fetch(
    `${META_GRAPH_BASE}/${ig_user_id}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url,
        caption,
        access_token,
      }),
    }
  );

  const container = await containerRes.json();

  if (container.error) {
    throw new Error(container.error.message);
  }

  // Publish media
  const publishRes = await fetch(
    `${META_GRAPH_BASE}/${ig_user_id}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: container.id,
        access_token,
      }),
    }
  );

  const publishData = await publishRes.json();

  if (publishData.error) {
    throw new Error(publishData.error.message);
  }

  return {
    post_id: publishData.id,
  };
}

/**
 * Create Meta Ads Campaign
 */
export async function publishToMetaAds({
  access_token,
  ad_account_id,
  image_url,
  campaign_name,
}) {
  const base = `${META_GRAPH_BASE}/act_${ad_account_id}`;

  // Upload image
  const imgRes = await fetch(`${base}/adimages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: image_url,
      access_token,
    }),
  });

  const imgData = await imgRes.json();

  if (imgData.error) {
    throw new Error(imgData.error.message);
  }

  const imageHash =
    Object.values(imgData.images || {})[0]?.hash;

  // Create campaign
  const campaignRes = await fetch(`${base}/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: campaign_name || 'CreativeKlux Campaign',
      objective: 'OUTCOME_AWARENESS',
      status: 'PAUSED',
      access_token,
    }),
  });

  const campaignData = await campaignRes.json();

  if (campaignData.error) {
    throw new Error(campaignData.error.message);
  }

  return {
    post_id: campaignData.id,
    image_hash: imageHash,
  };
}

// ─────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────

export async function getFacebookPostStats({
  access_token,
  post_id,
}) {
  const res = await fetch(
    `${META_GRAPH_BASE}/${post_id}/insights?metric=post_media_view,post_reactions_like_total,post_reactions_by_type_total&access_token=${access_token}`
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const metrics = {};

  (data.data || []).forEach((m) => {
    metrics[m.name] = m.values?.[0]?.value ?? 0;
  });

  const reactionsByType =
    metrics.post_reactions_by_type_total || {};

  const totalLikes =
    typeof reactionsByType === 'object'
      ? Object.values(reactionsByType).reduce(
        (a, v) => a + (v || 0),
        0
      )
      : metrics.post_reactions_like_total || 0;

  return {
    impressions: metrics.post_media_view || 0,
    reach: 0,
    clicks: 0,
    likes: totalLikes,
  };
}

export async function getInstagramPostStats({
  access_token,
  post_id,
}) {
  const res = await fetch(
    `${META_GRAPH_BASE}/${post_id}/insights?metric=impressions,reach,likes,comments,shares&access_token=${access_token}`
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const metrics = {};

  (data.data || []).forEach((m) => {
    metrics[m.name] = m.values?.[0]?.value || 0;
  });

  return {
    impressions: metrics.impressions || 0,
    reach: metrics.reach || 0,
    likes: metrics.likes || 0,
    comments: metrics.comments || 0,
    shares: metrics.shares || 0,
  };
}

// ─────────────────────────────────────────────────────────────
// Fetch Live Posts
// ─────────────────────────────────────────────────────────────

export async function fetchLivePostsFromConnectedAccounts(
  integrations = []
) {
  const accounts = buildAccountsMap(integrations);

  const livePosts = [];

  // ── Facebook ─────────────────────────

  if (accounts.facebook?.access_token) {
    try {
      const account = accounts.facebook;

      if (accounts.facebook?.access_token) {
        try {
          const account = accounts.facebook;

          // 🔥 STEP 1: resolve page from user token
          const page = await fetchFacebookPageId(account.access_token);

          if (!page) {
            console.warn("No Facebook page found for this account");
            return;
          }

          const resolvedPageId = page.page_id;
          const resolvedToken = page.page_access_token;

          // 🔥 STEP 2: use PAGE token for graph calls
          const res = await fetch(
            `${META_GRAPH_BASE}/${resolvedPageId}/posts?fields=id,message,story,created_time,full_picture,permalink_url&limit=20&access_token=${encodeURIComponent(
              resolvedToken
            )}`
          );

          const data = await res.json();

          if (!data.error && data.data) {
            data.data.forEach((post) => {
              livePosts.push({
                id: `fb_${post.id}`,
                project_id: null,
                project_title:
                  post.message?.slice(0, 60) ||
                  post.story ||
                  "Facebook Post",
                caption: post.message || "",
                image_url: post.full_picture || null,
                platform: "facebook",
                type: "social",
                status: "published",
                published_at: post.created_time,
                scheduled_at: null,
                post_id: post.id,
                permalink_url: post.permalink_url,
                live: true,
                stats: {},
              });
            });
          }
        } catch (err) {
          console.warn("Facebook live posts fetch failed:", err.message);
        }
      }
    } catch (err) {
      console.warn(
        'Facebook live posts fetch failed:',
        err.message
      );
    }
  }

  // ── Instagram ────────────────────────

  if (
    accounts.instagram?.access_token &&
    accounts.instagram?.ig_user_id
  ) {
    try {
      const res = await fetch(
        `${META_GRAPH_BASE}/${accounts.instagram.ig_user_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&limit=20&access_token=${accounts.instagram.access_token}`
      );

      const data = await res.json();

      if (!data.error && data.data) {
        data.data.forEach((post) => {
          livePosts.push({
            id: `ig_${post.id}`,
            project_id: null,
            project_title:
              post.caption?.slice(0, 60) ||
              'Instagram Post',
            caption: post.caption || '',
            image_url:
              post.media_url ||
              post.thumbnail_url ||
              null,
            platform: 'instagram',
            type: 'social',
            status: 'published',
            published_at: post.timestamp,
            scheduled_at: null,
            post_id: post.id,
            permalink_url: post.permalink,
            live: true,
            stats: {},
          });
        });
      }
    } catch (err) {
      console.warn(
        'Instagram live posts fetch failed:',
        err.message
      );
    }
  }

  // ── Meta Ads ─────────────────────────

  if (
    accounts.meta_ads?.access_token &&
    accounts.meta_ads?.ad_account_id
  ) {
    try {
      const res = await fetch(
        `${META_GRAPH_BASE}/act_${accounts.meta_ads.ad_account_id}/campaigns?fields=id,name,status,created_time,objective&limit=20&access_token=${accounts.meta_ads.access_token}`
      );

      const data = await res.json();

      if (!data.error && data.data) {
        data.data.forEach((campaign) => {
          livePosts.push({
            id: `meta_campaign_${campaign.id}`,
            project_id: null,
            project_title: campaign.name,
            caption: `Objective: ${campaign.objective || 'N/A'
              } · Status: ${campaign.status}`,
            image_url: null,
            platform: 'meta_ads',
            type: 'ad',
            status:
              campaign.status === 'ACTIVE'
                ? 'published'
                : 'scheduled',
            published_at: campaign.created_time,
            scheduled_at: null,
            post_id: campaign.id,
            live: true,
            stats: {},
          });
        });
      }
    } catch (err) {
      console.warn(
        'Meta Ads live fetch failed:',
        err.message
      );
    }
  }

  return livePosts;
}

// ─────────────────────────────────────────────────────────────
// Delete / Update
// ─────────────────────────────────────────────────────────────

export async function deletePostFromPlatform(
  post,
  integrations = []
) {
  const accounts = buildAccountsMap(integrations);

  if (post.platform === 'facebook' && post.post_id) {
    const token =
      post._page_access_token ||
      accounts.facebook?.access_token;

    if (token) {
      try {
        await fetch(
          `${META_GRAPH_BASE}/${post.post_id}?access_token=${token}`,
          {
            method: 'DELETE',
          }
        );
      } catch { }
    }
  } else if (
    post.platform === 'meta_ads' &&
    accounts.meta_ads?.access_token &&
    post.post_id
  ) {
    try {
      await fetch(
        `${META_GRAPH_BASE}/${post.post_id}?access_token=${accounts.meta_ads.access_token}`,
        {
          method: 'DELETE',
        }
      );
    } catch { }
  }

  deletePublishedPost(post.id);
}

export async function updatePostCaptionOnPlatform(
  post,
  newCaption,
  integrations = []
) {
  const accounts = buildAccountsMap(integrations);

  if (post.platform === 'facebook' && post.post_id) {
    const token =
      post._page_access_token ||
      accounts.facebook?.access_token;

    if (token) {
      const res = await fetch(
        `${META_GRAPH_BASE}/${post.post_id}?access_token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: newCaption,
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message);
      }
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
      'pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,ads_management',
  },

  google_ads: {
    authUrl:
      'https://accounts.google.com/o/oauth2/v2/auth',

    scope:
      'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email',
  },

  tiktok: {
    authUrl:
      'https://www.tiktok.com/v2/auth/authorize/',

    scope: 'video.upload,video.list',
  },
};