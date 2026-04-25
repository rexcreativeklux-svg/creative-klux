/**
 * OAuth popup flow for CreativeKlux integrations.
 *
 * How it works:
 * 1. User provides their platform App Client ID (stored in localStorage).
 * 2. openOAuthPopup() opens the platform's auth dialog in a popup window.
 * 3. Platform redirects to /oauth-callback?platform=xxx&access_token=yyy (implicit flow)
 *    or /oauth-callback?platform=xxx&code=yyy (code flow — needs backend).
 * 4. OAuthCallback.jsx posts the result back via postMessage.
 * 5. We resolve the promise with the token data.
 *
 * Flow types by platform:
 *   Implicit (client-side only):  facebook, instagram, meta_ads, google_ads, linkedin, pinterest, snapchat, pinterest_ads, snapchat_ads
 *   Code flow (needs backend):    tiktok, tiktok_ads, youtube, twitter, linkedin_ads
 */

// const REDIRECT_URI = `${window.location.origin}/oauth-callback`;
const REDIRECT_URI = 'https://app.creativeklux.com/oauth-callback'


// localStorage keys for app Client IDs
const CLIENT_IDS_KEY = 'creativeklux_oauth_client_ids';

export function getClientIds() {
  try { return JSON.parse(localStorage.getItem(CLIENT_IDS_KEY) || '{}'); } catch { return {}; }
}

export function saveClientId(platform, clientId) {
  const ids = getClientIds();
  ids[platform] = clientId;
  localStorage.setItem(CLIENT_IDS_KEY, JSON.stringify(ids));
}

export function getClientId(platform) {
  return getClientIds()[platform] || null;
}

// ─── Auth URL Builders ────────────────────────────────────────────────────────

function buildAuthUrl(platform, clientId) {
  const redirect = encodeURIComponent(REDIRECT_URI);
  const state = encodeURIComponent(platform);

  switch (platform) {

    // ── Facebook / Instagram / Meta Ads ──────────────────────────────────────
    // Implicit flow — token returned directly in the URL hash.
    case 'facebook': {
      const scope = encodeURIComponent(
        'pages_show_list,pages_manage_posts,pages_read_engagement,' +
        'instagram_basic,instagram_content_publish,' +
        'ads_management,business_management,read_insights'
      );

      return (
        `https://www.facebook.com/v19.0/dialog/oauth` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=token` +
        `&state=${state}`
      );
    }

    case 'instagram':
    case 'meta_ads': {
      const scope = encodeURIComponent(
        'pages_show_list,pages_manage_posts,pages_read_engagement,' +
        'instagram_basic,instagram_content_publish,' +
        'ads_management,business_management,read_insights'
      );
      // const scope = encodeURIComponent(
      //   'public_profile,email,pages_show_list'
      // );

      return (
        `https://www.facebook.com/v19.0/dialog/oauth` +
        `?client_id=${clientId}&redirect_uri=${redirect}` +
        `&scope=${scope}&response_type=token&state=${state}`
      );
    }

    // ── X / Twitter ───────────────────────────────────────────────────────────
    // OAuth 2.0 PKCE code flow — requires backend to exchange code for token.
    // Generate a real code_challenge from your PKCE verifier in production.
    case 'twitter': {
      const scope = encodeURIComponent('tweet.read tweet.write users.read offline.access');
      const challenge = btoa(Math.random().toString(36)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 43);
      return (
        `https://twitter.com/i/oauth2/authorize` +
        `?response_type=code&client_id=${clientId}` +
        `&redirect_uri=${redirect}&scope=${scope}` +
        `&state=${state}&code_challenge=${challenge}&code_challenge_method=plain`
      );
    }

    // ── LinkedIn (organic posts) ──────────────────────────────────────────────
    // Implicit-style token flow via openid connect.
    case 'linkedin': {
      const scope = encodeURIComponent('openid profile email w_member_social');
      return (
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=token&client_id=${clientId}` +
        `&redirect_uri=${redirect}&scope=${scope}&state=${state}`
      );
    }

    // ── LinkedIn Campaign Manager (ads) ──────────────────────────────────────
    // Code flow — requires backend.
    case 'linkedin_ads': {
      const scope = encodeURIComponent('r_ads r_ads_reporting rw_ads openid profile email');
      return (
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code&client_id=${clientId}` +
        `&redirect_uri=${redirect}&scope=${scope}&state=${state}`
      );
    }

    // ── YouTube ───────────────────────────────────────────────────────────────
    // Code flow with offline access — requires backend.
    case 'youtube': {
      const scope = encodeURIComponent(
        'https://www.googleapis.com/auth/youtube ' +
        'https://www.googleapis.com/auth/youtube.upload ' +
        'https://www.googleapis.com/auth/userinfo.email ' +
        'https://www.googleapis.com/auth/userinfo.profile'
      );
      return (
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${clientId}&redirect_uri=${redirect}` +
        `&scope=${scope}&response_type=code` +
        `&state=${state}&access_type=offline&prompt=consent`
      );
    }

    // ── Google Ads ────────────────────────────────────────────────────────────
    // Implicit (online-only) token flow.
    case 'google_ads': {
      const scope = encodeURIComponent(
        'https://www.googleapis.com/auth/adwords ' +
        'https://www.googleapis.com/auth/userinfo.email ' +
        'https://www.googleapis.com/auth/userinfo.profile'
      );
      return (
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${clientId}&redirect_uri=${redirect}` +
        `&scope=${scope}&response_type=token` +
        `&state=${state}&access_type=online`
      );
    }

    // ── Pinterest (organic) ───────────────────────────────────────────────────
    // Implicit token flow.
    case 'pinterest': {
      const scope = encodeURIComponent('boards:read,pins:read,pins:write,user_accounts:read');
      return (
        `https://www.pinterest.com/oauth/` +
        `?client_id=${clientId}&redirect_uri=${redirect}` +
        `&scope=${scope}&response_type=token&state=${state}`
      );
    }

    // ── Pinterest Ads ─────────────────────────────────────────────────────────
    // Code flow — requires backend.
    case 'pinterest_ads': {
      const scope = encodeURIComponent(
        'boards:read,pins:read,pins:write,user_accounts:read,ads:read,ads:write'
      );
      return (
        `https://www.pinterest.com/oauth/` +
        `?client_id=${clientId}&redirect_uri=${redirect}` +
        `&scope=${scope}&response_type=code&state=${state}`
      );
    }

    // ── Snapchat (organic) ────────────────────────────────────────────────────
    // Code flow — requires backend.
    case 'snapchat': {
      const scope = encodeURIComponent('snapchat-marketing-api');
      return (
        `https://accounts.snapchat.com/login/oauth2/authorize` +
        `?client_id=${clientId}&redirect_uri=${redirect}` +
        `&scope=${scope}&response_type=code&state=${state}`
      );
    }

    // ── Snapchat Ads ──────────────────────────────────────────────────────────
    // Code flow — same endpoint, broader scope.
    case 'snapchat_ads': {
      const scope = encodeURIComponent(
        'snapchat-marketing-api snapchat-profile-api'
      );
      return (
        `https://accounts.snapchat.com/login/oauth2/authorize` +
        `?client_id=${clientId}&redirect_uri=${redirect}` +
        `&scope=${scope}&response_type=code&state=${state}`
      );
    }

    // ── TikTok (organic) ──────────────────────────────────────────────────────
    // Code flow — requires backend.
    case 'tiktok': {
      const scope = encodeURIComponent('user.info.basic,video.upload,video.list');
      return (
        `https://www.tiktok.com/auth/authorize/` +
        `?client_key=${clientId}&redirect_uri=${redirect}` +
        `&scope=${scope}&response_type=code&state=${state}`
      );
    }

    // ── TikTok Ads ────────────────────────────────────────────────────────────
    // Code flow — requires backend.
    case 'tiktok_ads': {
      const scope = encodeURIComponent(
        'user.info.basic,video.upload,video.list,tt_lead_gen_read,tt_lead_gen_write'
      );
      return (
        `https://business-api.tiktok.com/portal/auth` +
        `?app_id=${clientId}&redirect_uri=${redirect}` +
        `&state=${state}`
      );
    }

    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

// ─── Popup orchestration ──────────────────────────────────────────────────────

/**
 * Open OAuth popup and wait for the token.
 * Resolves with { access_token, platform } or { code, platform }.
 * Rejects with an Error on failure or user cancellation.
 */
export function openOAuthPopup(platform, clientId) {
  return new Promise((resolve, reject) => {
    const url = buildAuthUrl(platform, clientId);
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      `oauth_${platform}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      reject(new Error('Popup was blocked. Please allow popups for this site.'));
      return;
    }

    const handler = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'OAUTH_CALLBACK') return;

      window.removeEventListener('message', handler);
      clearInterval(pollClosed);

      if (event.data.error) {
        reject(new Error(event.data.error));
      } else if (event.data.access_token) {
        resolve({ access_token: event.data.access_token, platform: event.data.platform });
      } else if (event.data.code) {
        // Code flow — exchange on the backend in production.
        resolve({ code: event.data.code, platform: event.data.platform });
      } else {
        reject(new Error('No token received'));
      }
    };

    window.addEventListener('message', handler);

    const pollClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollClosed);
        window.removeEventListener('message', handler);
        reject(new Error('cancelled'));
      }
    }, 500);
  });
}

// ─── Meta / Facebook helpers ──────────────────────────────────────────────────

/** Fetch Facebook Pages the user manages. */
export async function fetchFacebookPages(access_token) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${access_token}&fields=id,name,access_token,picture`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

/** Fetch Instagram Business accounts linked to the given Facebook Pages. */
export async function fetchInstagramAccounts(pages) {
  const results = [];
  for (const page of pages) {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}` +
      `?fields=instagram_business_account{id,name,username,profile_picture_url}` +
      `&access_token=${page.access_token}`
    );
    const data = await res.json();
    if (data.instagram_business_account) {
      results.push({
        ...data.instagram_business_account,
        page_name: page.name,
        page_access_token: page.access_token,
      });
    }
  }
  return results;
}

/** Fetch Meta Ad Accounts accessible by the user token. */
export async function fetchMetaAdAccounts(access_token) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${access_token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

// ─── Google helpers ───────────────────────────────────────────────────────────

/** Fetch Google user info (works for both google_ads and youtube tokens). */
export async function fetchGoogleUserInfo(access_token) {
  const res = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data; // { id, email, name, picture }
}

/** Fetch YouTube channels for the authenticated user. */
export async function fetchYouTubeChannels(access_token) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels` +
    `?part=snippet,contentDetails&mine=true&access_token=${access_token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.items || []).map((ch) => ({
    id: ch.id,
    name: ch.snippet.title,
    description: ch.snippet.description,
    thumbnail: ch.snippet.thumbnails?.default?.url,
  }));
}

// ─── X / Twitter helpers ──────────────────────────────────────────────────────

/** Fetch the authenticated Twitter/X user. Requires a valid bearer access_token. */
export async function fetchTwitterUser(access_token) {
  const res = await fetch(
    `https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data; // { id, name, username, profile_image_url }
}

// ─── LinkedIn helpers ─────────────────────────────────────────────────────────

/** Fetch LinkedIn user profile (OpenID Connect userinfo endpoint). */
export async function fetchLinkedInProfile(access_token) {
  const res = await fetch(
    `https://api.linkedin.com/v2/userinfo`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const data = await res.json();
  if (data.status === 401) throw new Error('LinkedIn token is invalid or expired.');
  return data; // { sub, name, email, picture }
}

/** Fetch LinkedIn Ad Accounts the user has access to. */
export async function fetchLinkedInAdAccounts(access_token) {
  const res = await fetch(
    `https://api.linkedin.com/v2/adAccountsV2?q=search&search.type.values[0]=BUSINESS`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const data = await res.json();
  if (data.status >= 400) throw new Error(data.message || 'LinkedIn API error');
  return (data.elements || []).map((a) => ({
    id: a.id,
    name: a.name,
    currency: a.currency,
    status: a.status,
  }));
}

// ─── Pinterest helpers ────────────────────────────────────────────────────────

/** Fetch the authenticated Pinterest user. */
export async function fetchPinterestUser(access_token) {
  const res = await fetch(
    `https://api.pinterest.com/v5/user_account`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const data = await res.json();
  if (data.code) throw new Error(data.message);
  return data; // { username, account_type, profile_image, ... }
}

/** Fetch Pinterest Ad Accounts. */
export async function fetchPinterestAdAccounts(access_token) {
  const res = await fetch(
    `https://api.pinterest.com/v5/ad_accounts`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const data = await res.json();
  if (data.code) throw new Error(data.message);
  return data.items || [];
}

// ─── Snapchat helpers ─────────────────────────────────────────────────────────

/** Fetch Snapchat user info. */
export async function fetchSnapchatUser(access_token) {
  const res = await fetch(
    `https://adsapi.snapchat.com/v1/me`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const data = await res.json();
  if (data.request_status === 'ERROR') throw new Error(data.debug_message);
  return data.me; // { id, email, display_name, ... }
}

/** Fetch Snapchat Ad Accounts. */
export async function fetchSnapchatAdAccounts(access_token) {
  const me = await fetchSnapchatUser(access_token);
  const res = await fetch(
    `https://adsapi.snapchat.com/v1/organizations/${me.organization_id}/adaccounts`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const data = await res.json();
  if (data.request_status === 'ERROR') throw new Error(data.debug_message);
  return (data.adaccounts || []).map((a) => a.adaccount);
}

// ─── TikTok helpers ───────────────────────────────────────────────────────────

/**
 * Fetch TikTok user info.
 * NOTE: TikTok uses a code flow — access_token here is the one your backend
 * exchanged from the authorization code.
 */
export async function fetchTikTokUser(access_token) {
  const res = await fetch(
    `https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const data = await res.json();
  if (data.error?.code !== 'ok') throw new Error(data.error?.message || 'TikTok API error');
  return data.data.user;
}

/** Fetch TikTok Ads advertiser accounts. */
export async function fetchTikTokAdAccounts(access_token) {
  const res = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/`,
    { headers: { 'Access-Token': access_token } }
  );
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message);
  return data.data?.list || [];
}