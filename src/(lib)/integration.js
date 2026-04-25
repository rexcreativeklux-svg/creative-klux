/**
 * Integrations store - uses localStorage for now.
 * When ready to use a DB, replace these functions with API calls.
 *
 * Connected accounts shape:
 * {
 *   [platform]: {
 *     access_token: string,
 *     page_id: string (for Facebook/Instagram),
 *     ad_account_id: string (for ads platforms),
 *     user_name: string,
 *     expires_at: number | null,
 *     connected_at: string,
 *   }
 * }
 *
 * Published posts shape:
 * [{
 *   id, project_id, project_title, image_url, caption, platform,
 *   type: 'social' | 'ad',
 *   status: 'published' | 'scheduled' | 'failed',
 *   scheduled_at: ISO string | null,
 *   published_at: ISO string | null,
 *   post_id: string (platform post ID),
 *   stats: { impressions, clicks, reach, likes, shares, comments, ctr, spend }
 * }]
 */

const ACCOUNTS_KEY = 'creativeklux_connected_accounts';
const POSTS_KEY = 'creativeklux_published_posts';

// ---- Connected Accounts ----

export function getConnectedAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveConnectedAccount(platform, data) {
  const accounts = getConnectedAccounts();
  accounts[platform] = { ...data, connected_at: new Date().toISOString() };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function disconnectAccount(platform) {
  const accounts = getConnectedAccounts();
  delete accounts[platform];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function isConnected(platform) {
  const accounts = getConnectedAccounts();
  return !!accounts[platform]?.access_token;
}

// ---- Published / Scheduled Posts ----

export function getPublishedPosts() {
  try {
    return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function savePublishedPost(post) {
  const posts = getPublishedPosts();
  const existing = posts.findIndex(p => p.id === post.id);
  if (existing >= 0) {
    posts[existing] = post;
  } else {
    posts.unshift({ ...post, id: post.id || `post_${Date.now()}` });
  }
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  return posts.find(p => p.id === post.id);
}

export function deletePublishedPost(id) {
  const posts = getPublishedPosts().filter(p => p.id !== id);
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export function updatePostStats(id, stats) {
  const posts = getPublishedPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx >= 0) {
    posts[idx].stats = { ...posts[idx].stats, ...stats, last_updated: new Date().toISOString() };
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }
}

// ---- Platform API Calls ----
// These call the REAL platform APIs. The platform must be connected first.

/**
 * Publish an image to Facebook Page as a post.
 * Requires: pages_manage_posts, pages_read_engagement scope.
 */
export async function publishToFacebook({ access_token, page_id, image_url, caption }) {
  // Step 1: Upload photo to Facebook
  const uploadRes = await fetch(
    `https://graph.facebook.com/v19.0/${page_id}/photos`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: image_url, caption, access_token, published: true }),
    }
  );
  const uploadData = await uploadRes.json();
  if (uploadData.error) throw new Error(uploadData.error.message);
  return { post_id: uploadData.post_id || uploadData.id };
}

/**
 * Publish an image to Instagram Business account.
 * Requires: instagram_basic, instagram_content_publish scope.
 */
export async function publishToInstagram({ access_token, ig_user_id, image_url, caption }) {
  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${ig_user_id}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url, caption, access_token }),
    }
  );
  const container = await containerRes.json();
  if (container.error) throw new Error(container.error.message);

  // Step 2: Publish the container
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${ig_user_id}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: container.id, access_token }),
    }
  );
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(publishData.error.message);
  return { post_id: publishData.id };
}

/**
 * Create a Facebook Ad using Marketing API.
 * Requires: ads_management scope.
 */
export async function publishToMetaAds({ access_token, ad_account_id, image_url, caption, campaign_name }) {
  const base = `https://graph.facebook.com/v19.0/act_${ad_account_id}`;

  // 1. Upload image
  const imgRes = await fetch(`${base}/adimages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: image_url, access_token }),
  });
  const imgData = await imgRes.json();
  if (imgData.error) throw new Error(imgData.error.message);
  const imageHash = Object.values(imgData.images || {})[0]?.hash;

  // 2. Create campaign
  const campaignRes = await fetch(`${base}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: campaign_name || 'CreativeKlux Campaign',
      objective: 'OUTCOME_AWARENESS',
      status: 'PAUSED',
      access_token,
    }),
  });
  const campaignData = await campaignRes.json();
  if (campaignData.error) throw new Error(campaignData.error.message);

  return { post_id: campaignData.id, image_hash: imageHash };
}

/**
 * Get Facebook Page post insights.
 */
export async function getFacebookPostStats({ access_token, post_id }) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${post_id}/insights?metric=post_impressions,post_engaged_users,post_clicks,post_reactions_like_total&access_token=${access_token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const metrics = {};
  (data.data || []).forEach(m => { metrics[m.name] = m.values?.[0]?.value || 0; });
  return {
    impressions: metrics.post_impressions || 0,
    reach: metrics.post_engaged_users || 0,
    clicks: metrics.post_clicks || 0,
    likes: metrics.post_reactions_like_total || 0,
  };
}

/**
 * Get Instagram media insights.
 */
export async function getInstagramPostStats({ access_token, post_id }) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${post_id}/insights?metric=impressions,reach,likes,comments,shares&access_token=${access_token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const metrics = {};
  (data.data || []).forEach(m => { metrics[m.name] = m.values?.[0]?.value || 0; });
  return {
    impressions: metrics.impressions || 0,
    reach: metrics.reach || 0,
    likes: metrics.likes || 0,
    comments: metrics.comments || 0,
    shares: metrics.shares || 0,
  };
}

/**
 * OAuth URLs for each platform.
 * In a real app these redirect to your backend which handles the token exchange.
 * Here we use a window.open OAuth popup pattern.
 */
export const OAUTH_CONFIGS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scope: 'pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,ads_management',
  },
  google_ads: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email',
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    scope: 'video.upload,video.list',
  },
};