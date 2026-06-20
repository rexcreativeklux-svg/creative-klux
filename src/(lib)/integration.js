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

      case 'youtube':
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
  scheduled_publish_time, // optional unix seconds — when set, FB schedules instead of posting now
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
          // Scheduling: an unpublished post with a future publish time.
          ...(scheduled_publish_time
            ? { published: false, scheduled_publish_time }
            : {}),
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
        // Scheduling: publish later instead of now.
        published: scheduled_publish_time ? false : true,
        ...(scheduled_publish_time ? { scheduled_publish_time } : {}),
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
    // Surface the full Graph error so we can tell apart permission vs account-restriction vs image issues.
    console.error('Instagram container error:', container.error);
    const e = container.error;
    throw new Error(
      `${e.error_user_msg || e.message}` +
      `${e.code ? ` [code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ''}]` : ''}`
    );
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
    console.error('Instagram publish error:', publishData.error);
    const e = publishData.error;
    throw new Error(
      `${e.error_user_msg || e.message}` +
      `${e.code ? ` [code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ''}]` : ''}`
    );
  }

  return {
    post_id: publishData.id,
  };
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
  awareness:  { objective: 'OUTCOME_AWARENESS',  optimization_goal: 'REACH' },
  traffic:    { objective: 'OUTCOME_TRAFFIC',    optimization_goal: 'LINK_CLICKS' },
  engagement: { objective: 'OUTCOME_ENGAGEMENT', optimization_goal: 'POST_ENGAGEMENT' },
};

export async function publishToMetaAds({
  access_token,
  ad_account_id,
  page_id,
  image_url,
  message,
  link,
  goal = 'traffic',
  daily_budget,
  days = 7,
  country = 'US',
  ad_name,
}) {
  if (!access_token) throw new Error('No access token — reconnect Meta Ads.');
  if (!ad_account_id) throw new Error('No ad account — reconnect Meta Ads.');
  if (!page_id) throw new Error('Connect a Facebook Page first — Meta ads run as a Page.');
  if (!image_url) throw new Error('No image to advertise.');
  if (!daily_budget || daily_budget <= 0) throw new Error('Enter a daily budget.');

  const acct = ad_account_id.startsWith('act_') ? ad_account_id : `act_${ad_account_id}`;
  const base = `${META_GRAPH_BASE}/${acct}`;
  const g = META_ADS_GOALS[goal] || META_ADS_GOALS.traffic;
  const dest = link || 'https://www.facebook.com';
  const name = ad_name || 'CreativeKlux Ad';

  // Small POST helper that surfaces the full Graph error (logs status + body).
  const post = async (path, body) => {
    let res, data = {};
    try {
      res = await fetch(`${base}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, access_token }),
      });
      data = await res.json();
    } catch (netErr) {
      console.error(`Meta Ads ${path} network/CORS error:`, netErr);
      throw new Error('Could not reach Meta Ads. Ad-account calls may be blocked from the browser — this likely needs a backend.');
    }
    if (!res.ok || data.error) {
      console.error(`Meta Ads ${path} error (HTTP ${res.status}):`, data);
      const e = data.error || {};
      const msg = e.error_user_msg || e.message ||
        `Meta Ads "${path}" failed (HTTP ${res.status}). Usually means: the ad account has no payment method, the token lacks ads_management, or the account/app is restricted.`;
      throw new Error(`${msg}${e.code ? ` [code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ''}]` : ''}`);
    }
    return data;
  };

  // Best-effort delete of any object by id (used to clean up after a partial failure).
  // Deleting a campaign cascades to its ad sets / ads, so removing the campaign is enough.
  const del = async (id) => {
    try {
      await fetch(
        `${META_GRAPH_BASE}/${id}?access_token=${encodeURIComponent(access_token)}`,
        { method: 'DELETE' }
      );
    } catch (cleanupErr) {
      console.warn(`Meta Ads cleanup of ${id} failed:`, cleanupErr?.message);
    }
  };

  // 1. Campaign (the goal/objective). Budget lives on the ad set, so we must explicitly
  //    opt out of campaign-level budget sharing (is_adset_budget_sharing_enabled).
  const campaign = await post('campaigns', {
    name: `${name} — Campaign`,
    objective: g.objective,
    status: 'ACTIVE',
    special_ad_categories: [],
    is_adset_budget_sharing_enabled: false,
  });

  // Steps 2-4 build on the campaign. If any throws, the campaign (and whatever ad set we
  // got to) would be left orphaned in Ads Manager — so delete the campaign before rethrowing.
  let adset, creative, ad;
  try {
    // 2. Ad set (budget, schedule, audience). Budget is in the currency's minor units (×100).
    const now = Math.floor(Date.now() / 1000);
    adset = await post('adsets', {
      name: `${name} — Ad Set`,
      campaign_id: campaign.id,
      daily_budget: Math.round(Number(daily_budget) * 100),
      billing_event: 'IMPRESSIONS',
      optimization_goal: g.optimization_goal,
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      start_time: now,
      end_time: now + Math.max(1, Number(days)) * 86400,
      targeting: { geo_locations: { countries: [country] }, age_min: 18, age_max: 65 },
      status: 'ACTIVE',
    });

    // 3. Ad creative — use the public image URL directly (`picture`) instead of uploading
    //    to /adimages first (one fewer call, and adimages-by-url is unreliable).
    creative = await post('adcreatives', {
      name: `${name} — Creative`,
      object_story_spec: {
        page_id,
        link_data: {
          picture: image_url,
          message: message || '',
          link: dest,
          call_to_action: { type: 'LEARN_MORE', value: { link: dest } },
        },
      },
    });

    // 4. Ad (ties the creative to the ad set, live)
    ad = await post('ads', {
      name,
      adset_id: adset.id,
      creative: { creative_id: creative.id },
      status: 'ACTIVE',
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
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error('Failed to load the image to build the video.'));
    img.src = ytProxiedSrc(url);
  });
}

// Pick a MediaRecorder mime type the browser actually supports. YouTube accepts webm.
function ytPickMime() {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
    for (const m of candidates) {
      if (MediaRecorder.isTypeSupported(m)) return m;
    }
  }
  return 'video/webm';
}

/**
 * Turn a still image into a short looping-still video Blob, entirely in-browser.
 * Draws the image onto a canvas, captures the canvas as a media stream, and records
 * it for `durationSec` seconds with MediaRecorder.
 */
export async function imageUrlToVideoBlob(
  imageUrl,
  { durationSec = 5, fps = 30 } = {}
) {
  if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    throw new Error('Video creation is only available in the browser.');
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

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

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
      reject(e.error || new Error('Video recording failed.'));
    };

    // Keep the stream alive by continuously redrawing the still frame.
    const draw = () => {
      ctx.drawImage(img, 0, 0, w, h);
      raf = requestAnimationFrame(draw);
    };
    draw();

    recorder.start();
    setTimeout(() => {
      try {
        recorder.stop();
      } catch (err) {
        stop();
        reject(err);
      }
    }, Math.max(1, durationSec) * 1000);
  });
}

/**
 * Publish a video to YouTube via the resumable upload API (browser → googleapis).
 *
 * Pass a real `video` Blob/File when you have one; otherwise pass `image_url` and
 * it is converted to a short video first. Requires a token with the
 * `youtube.upload` scope (the YouTube connect flow requests it).
 *
 *  - access_token   from the youtube integration (int_token)
 *  - title / description  video metadata (title capped to 100 chars)
 *  - privacyStatus  'public' | 'unlisted' | 'private'
 *  - publishAt      optional ISO string — schedules the video (forces privacyStatus 'private')
 */
export async function publishToYouTube({
  access_token,
  title,
  description,
  image_url,
  video,
  privacyStatus = 'public',
  publishAt,
  durationSec = 5,
}) {
  if (!access_token) {
    throw new Error('No access token — reconnect your YouTube account.');
  }

  // Resolve a video blob: provided video wins, else build one from the image.
  let videoBlob = video || null;
  if (!videoBlob) {
    if (!image_url) {
      throw new Error('Nothing to publish — no video or image was provided.');
    }
    videoBlob = await imageUrlToVideoBlob(image_url, { durationSec });
  }

  const metadata = {
    snippet: {
      title: (title || 'Untitled').slice(0, 100),
      description: description || '',
      categoryId: '22', // People & Blogs
    },
    status: {
      // Scheduling: YouTube only honors publishAt when the video starts private.
      privacyStatus: publishAt ? 'private' : privacyStatus,
      ...(publishAt ? { publishAt } : {}),
      selfDeclaredMadeForKids: false,
    },
  };

  // Step 1 — open a resumable upload session; YouTube returns the upload URL in `Location`.
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': videoBlob.type || 'video/webm',
        'X-Upload-Content-Length': String(videoBlob.size),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    console.error('YouTube upload init error:', err);
    throw new Error(
      err.error?.message || `YouTube upload couldn't start (${initRes.status}).`
    );
  }

  const uploadUrl =
    initRes.headers.get('Location') || initRes.headers.get('location');
  if (!uploadUrl) {
    throw new Error('YouTube did not return an upload URL.');
  }

  // Step 2 — upload the video bytes.
  const upRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': videoBlob.type || 'video/webm' },
    body: videoBlob,
  });

  const data = await upRes.json().catch(() => ({}));
  if (!upRes.ok || data.error) {
    console.error('YouTube upload error:', data.error || upRes.status);
    throw new Error(
      data.error?.message || `YouTube upload failed (${upRes.status}).`
    );
  }

  return {
    post_id: data.id,
    video_id: data.id,
    url: data.id ? `https://youtube.com/watch?v=${data.id}` : undefined,
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
  if (typeof window === 'undefined' || !integrationId) return null;
  try {
    return localStorage.getItem(X_REFRESH_KEY(integrationId));
  } catch {
    return null;
  }
}

export function setStoredXRefresh(integrationId, token) {
  if (typeof window === 'undefined' || !integrationId || !token) return;
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
export async function publishToTwitter({
  integration_id,
  refresh_token,
  text,
  image_url,
}) {
  const rt = refresh_token || getStoredXRefresh(integration_id);
  if (!rt) {
    throw new Error(
      'No saved X session on this device — reconnect your X account here, then try again.'
    );
  }

  const res = await fetch('/api/twitter/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt, text, image_url }),
  });
  const data = await res.json().catch(() => ({}));

  // X rotates the refresh token on every refresh — persist the new one even on failure,
  // otherwise the next attempt uses a now-invalid token.
  if (data.refresh_token) {
    setStoredXRefresh(integration_id, data.refresh_token);
  }

  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to post to X.');
  }

  return {
    post_id: data.tweet_id,
    url: data.tweet_id
      ? `https://x.com/i/web/status/${data.tweet_id}`
      : undefined,
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
export async function publishToLinkedIn({
  access_token,
  author_id,
  text,
  image_url,
}) {
  if (!access_token) {
    throw new Error('No access token — reconnect your LinkedIn account.');
  }
  if (!author_id) {
    throw new Error('No LinkedIn member id — reconnect your LinkedIn account.');
  }

  const res = await fetch('/api/linkedin/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token, author_id, text, image_url }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to post to LinkedIn.');
  }

  return {
    post_id: data.post_id,
    url: data.post_id
      ? `https://www.linkedin.com/feed/update/${data.post_id}`
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
  const res = await fetch('/api/pinterest/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  access_token,
  board_id,
  title,
  description,
  image_url,
  link,
}) {
  if (!access_token) throw new Error('No access token — reconnect Pinterest.');
  if (!board_id) throw new Error('Pick a Pinterest board first.');
  if (!image_url) throw new Error('Pinterest needs an image to create a pin.');

  const res = await fetch('/api/pinterest/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token, board_id, title, description, image_url, link }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to create pin.');
  }

  return { post_id: data.pin_id, url: data.url };
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

export async function getMetaAdsCampaignStats({
  access_token,
  campaign_id,
}) {
  const res = await fetch(
    `${META_GRAPH_BASE}/${campaign_id}/insights?fields=impressions,reach,clicks,ctr&access_token=${access_token}`
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

export async function fetchLivePostsFromConnectedAccounts(
  integrations = []
) {
  const accounts = buildAccountsMap(integrations);

  const livePosts = [];


  // ── Facebook ─────────────────────────
  if (accounts.facebook?.access_token) {
    try {
      const account = accounts.facebook;
      const pageId = account.page_id; // int_id stored at connect time = page ID
      const pageToken = account.access_token; // int_token stored at connect time = page token

      // Skip /me/accounts entirely — use the page token directly
      const postsRes = await fetch(
        `${META_GRAPH_BASE}/${pageId}/posts` +
        `?fields=id,message,story,created_time,full_picture,permalink_url` +
        `&limit=20&access_token=${pageToken}`
      );

      const postsData = await postsRes.json();

      if (postsData.error) {
        console.warn("Facebook posts error:", postsData.error);
      } else {
        (postsData.data || []).forEach((post) => {
          livePosts.push({
            id: `fb_${post.id}`,
            project_id: null,
            project_title: post.message?.slice(0, 60) || post.story || "Facebook Post",
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

      // Scheduled (unpublished) posts are NOT in /posts — they live under /scheduled_posts.
      const schedRes = await fetch(
        `${META_GRAPH_BASE}/${pageId}/scheduled_posts` +
        `?fields=id,message,story,scheduled_publish_time,full_picture,permalink_url` +
        `&access_token=${pageToken}`
      );
      const schedData = await schedRes.json();
      if (schedData.error) {
        console.warn("Facebook scheduled posts error:", schedData.error);
      } else {
        (schedData.data || []).forEach((post) => {
          livePosts.push({
            id: `fb_${post.id}`,
            project_id: null,
            project_title: post.message?.slice(0, 60) || post.story || "Scheduled Facebook Post",
            caption: post.message || "",
            image_url: post.full_picture || null,
            platform: "facebook",
            type: "social",
            status: "scheduled",
            published_at: null,
            // scheduled_publish_time is unix seconds → ISO string for the calendar.
            scheduled_at: post.scheduled_publish_time
              ? new Date(post.scheduled_publish_time * 1000).toISOString()
              : null,
            post_id: post.id,
            permalink_url: post.permalink_url || null,
            live: true,
            stats: {},
          });
        });
      }
    } catch (err) {
      console.warn("Facebook live posts fetch failed:", err.message);
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

  // ── YouTube ──────────────────────────

  if (accounts.youtube?.access_token) {
    try {
      const token = accounts.youtube.access_token;

      // 1. Resolve the channel's "uploads" playlist (holds every video).
      const chRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true&access_token=${token}`
      );
      const chData = await chRes.json();
      const uploads =
        chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (chData.error) {
        console.warn('YouTube channel fetch error:', chData.error);
      } else if (uploads) {
        // 2. Recent uploads from that playlist.
        const plRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploads}&maxResults=20&access_token=${token}`
        );
        const plData = await plRes.json();

        if (plData.error) {
          console.warn('YouTube uploads fetch error:', plData.error);
        } else {
          const items = plData.items || [];
          const ids = items
            .map((it) => it.snippet?.resourceId?.videoId)
            .filter(Boolean);

          // 3. One status call to tell scheduled (private + publishAt) from published.
          const statusById = {};
          if (ids.length) {
            const vRes = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?part=status&id=${ids.join(
                ','
              )}&access_token=${token}`
            );
            const vData = await vRes.json();
            if (!vData.error) {
              (vData.items || []).forEach((v) => {
                statusById[v.id] = v.status || {};
              });
            }
          }

          items.forEach((it) => {
            const s = it.snippet || {};
            const vid = s.resourceId?.videoId;
            if (!vid) return;

            const st = statusById[vid] || {};
            const scheduled =
              st.privacyStatus === 'private' && st.publishAt;

            livePosts.push({
              id: `yt_${vid}`,
              project_id: null,
              project_title: s.title?.slice(0, 60) || 'YouTube Video',
              caption: s.description || '',
              image_url:
                s.thumbnails?.high?.url ||
                s.thumbnails?.medium?.url ||
                s.thumbnails?.default?.url ||
                null,
              platform: 'youtube',
              type: 'social',
              status: scheduled ? 'scheduled' : 'published',
              published_at: scheduled ? null : s.publishedAt || null,
              scheduled_at: scheduled ? st.publishAt : null,
              post_id: vid,
              permalink_url: `https://youtube.com/watch?v=${vid}`,
              live: true,
              stats: {},
            });
          });
        }
      }
    } catch (err) {
      console.warn('YouTube live posts fetch failed:', err.message);
    }
  }

  // ── X / Twitter ──────────────────────
  // No browser CORS → go through the server route, which refreshes the token and
  // returns recent tweets. Uses the raw integration record (need id + int_id + refresh).
  {
    const tw = integrations.find((i) => i.platform === 'twitter');
    if (tw && tw.int_id) {
      const rt = tw.int_refresh_token || getStoredXRefresh(tw.id);
      if (rt) {
        try {
          const res = await fetch('/api/twitter/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: rt, user_id: tw.int_id }),
          });
          const data = await res.json().catch(() => ({}));

          // Persist the rotated refresh token (even on error — the old one is now dead).
          if (data.refresh_token) setStoredXRefresh(tw.id, data.refresh_token);

          if (res.ok && !data.error) {
            const mediaByKey = {};
            (data.media || []).forEach((m) => {
              mediaByKey[m.media_key] = m;
            });
            (data.tweets || []).forEach((post) => {
              const key = post.attachments?.media_keys?.[0];
              const media = key ? mediaByKey[key] : null;
              livePosts.push({
                id: `tw_${post.id}`,
                project_id: null,
                project_title: post.text?.slice(0, 60) || 'Tweet',
                caption: post.text || '',
                image_url: media?.url || media?.preview_image_url || null,
                platform: 'twitter',
                type: 'social',
                status: 'published',
                published_at: post.created_at || null,
                scheduled_at: null,
                post_id: post.id,
                permalink_url: `https://x.com/i/web/status/${post.id}`,
                live: true,
                stats: {},
              });
            });
          } else {
            console.warn('X posts fetch error:', data.error);
          }
        } catch (err) {
          console.warn('X live posts fetch failed:', err.message);
        }
      }
    }
  }

  // ── Pinterest ────────────────────────
  // No browser CORS → list pins via the server route.
  if (accounts.pinterest?.access_token) {
    try {
      const res = await fetch('/api/pinterest/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accounts.pinterest.access_token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && !data.error) {
        (data.pins || []).forEach((pin) => {
          const imgs = pin.media?.images || {};
          const image_url =
            imgs['600x']?.url ||
            imgs['1200x']?.url ||
            imgs['400x300']?.url ||
            imgs.originals?.url ||
            null;
          livePosts.push({
            id: `pin_${pin.id}`,
            project_id: null,
            project_title: pin.title?.slice(0, 60) || 'Pinterest Pin',
            caption: pin.description || pin.title || '',
            image_url,
            platform: 'pinterest',
            type: 'social',
            status: 'published',
            published_at: pin.created_at || null,
            scheduled_at: null,
            post_id: pin.id,
            permalink_url: `https://www.pinterest.com/pin/${pin.id}`,
            live: true,
            stats: {},
          });
        });
      } else {
        console.warn('Pinterest pins error:', data.error);
      }
    } catch (err) {
      console.warn('Pinterest live posts fetch failed:', err.message);
    }
  }

  // ── Meta Ads ─────────────────────────

  if (
    accounts.meta_ads?.access_token &&
    accounts.meta_ads?.ad_account_id
  ) {
    try {
      const rawAccountId = accounts.meta_ads.ad_account_id;

      const normalizedAccountId = rawAccountId.startsWith('act_')
        ? rawAccountId
        : `act_${rawAccountId}`;

      const res = await fetch(
        `${META_GRAPH_BASE}/${normalizedAccountId}/campaigns?fields=id,name,status,created_time,objective&limit=20&access_token=${accounts.meta_ads.access_token}`
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