// "use client";

// /**
//  * OAuth popup flow for CreativeKlux integrations.
//  *
//  * How it works:
//  * 1. App Client IDs are set once by the developer in environment variables.
//  *    Users never need to create or provide their own platform app credentials —
//  *    they simply log in with their existing social accounts.
//  * 2. openOAuthPopup(platform) opens the platform's auth dialog in a popup.
//  * 3. Platform redirects to /oauth-callback?platform=xxx&access_token=yyy (implicit flow)
//  *    or /oauth-callback?platform=xxx&code=yyy (code flow — needs backend).
//  * 4. OAuthCallback.jsx posts the result back via postMessage.
//  * 5. We resolve the promise with the token data.
//  *
//  * Flow types by platform:
//  *   Implicit (client-side only):  facebook, instagram, meta_ads, google_ads, linkedin, pinterest
//  *   Code flow (needs backend):    tiktok, tiktok_ads, youtube, twitter, linkedin_ads, snapchat, snapchat_ads, pinterest_ads
//  *
//  * Setup: add these to your .env file (Vite prefix shown — adjust for your framework):
//  *   VITE_FACEBOOK_APP_ID=
//  *   VITE_GOOGLE_CLIENT_ID=
//  *   VITE_TWITTER_CLIENT_ID=
//  *   VITE_LINKEDIN_CLIENT_ID=
//  *   VITE_YOUTUBE_CLIENT_ID=        (can share VITE_GOOGLE_CLIENT_ID if same GCP project)
//  *   VITE_PINTEREST_CLIENT_ID=
//  *   VITE_SNAPCHAT_CLIENT_ID=
//  *   VITE_TIKTOK_CLIENT_KEY=
//  *   VITE_TIKTOK_ADS_APP_ID=
//  */

// // const REDIRECT_URI = `${window.location.origin}/oauth-callback`;
// const REDIRECT_URI = 'https://app.creativeklux.com/oauth-callback'

// /**
//  * Developer-owned app credentials, sourced from environment variables.
//  * These are set once by you — your users never touch them.
//  */
// const CLIENT_IDS = {
//   facebook: '415385890784940',
//   // instagram: import.meta.env.VITE_FACEBOOK_APP_ID,   // same Meta app
//   // meta_ads: import.meta.env.VITE_FACEBOOK_APP_ID,   // same Meta app
//   // google_ads: import.meta.env.VITE_GOOGLE_CLIENT_ID,
//   // youtube: import.meta.env.VITE_YOUTUBE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID,
//   // twitter: import.meta.env.VITE_TWITTER_CLIENT_ID,
//   // linkedin: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
//   // linkedin_ads: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
//   // pinterest: import.meta.env.VITE_PINTEREST_CLIENT_ID,
//   // pinterest_ads: import.meta.env.VITE_PINTEREST_CLIENT_ID,
//   // snapchat: import.meta.env.VITE_SNAPCHAT_CLIENT_ID,
//   // snapchat_ads: import.meta.env.VITE_SNAPCHAT_CLIENT_ID,
//   // tiktok: import.meta.env.VITE_TIKTOK_CLIENT_KEY,
//   // tiktok_ads: import.meta.env.VITE_TIKTOK_ADS_APP_ID,
// };

// /** Returns the app Client ID for a platform, or throws if not configured. */
// export function getClientId(platform) {
//   const id = CLIENT_IDS[platform];
//   if (!id) throw new Error(`Missing env variable for platform: ${platform}. Check your .env file.`);
//   return id;
// }

// // ─── Auth URL Builders ────────────────────────────────────────────────────────

// function buildAuthUrl(platform, clientId) {
//   const redirect = encodeURIComponent(REDIRECT_URI);
//   const state = encodeURIComponent(platform);

//   switch (platform) {

//     // ── Facebook / Instagram / Meta Ads ──────────────────────────────────────
//     // Implicit flow — token returned directly in the URL hash.
//     case 'facebook':
//     case 'instagram':
//     case 'meta_ads': {
//       const scope = encodeURIComponent(
//         'pages_show_list,pages_manage_posts,pages_read_engagement,' +
//         'instagram_basic,instagram_content_publish,' +
//         'ads_management,business_management,read_insights'
//       );
//       return (
//         `https://www.facebook.com/v19.0/dialog/oauth` +
//         `?client_id=${clientId}&redirect_uri=${redirect}` +
//         `&scope=${scope}&response_type=token&state=${state}`
//       );
//     }

//     // ── X / Twitter ───────────────────────────────────────────────────────────
//     // OAuth 2.0 PKCE code flow — requires backend to exchange code for token.
//     // Generate a real code_challenge from your PKCE verifier in production.
//     case 'twitter': {
//       const scope = encodeURIComponent('tweet.read tweet.write users.read offline.access');
//       const challenge = btoa(Math.random().toString(36)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 43);
//       return (
//         `https://twitter.com/i/oauth2/authorize` +
//         `?response_type=code&client_id=${clientId}` +
//         `&redirect_uri=${redirect}&scope=${scope}` +
//         `&state=${state}&code_challenge=${challenge}&code_challenge_method=plain`
//       );
//     }

//     // ── LinkedIn (organic posts) ──────────────────────────────────────────────
//     // Implicit-style token flow via openid connect.
//     case 'linkedin': {
//       const scope = encodeURIComponent('openid profile email w_member_social');
//       return (
//         `https://www.linkedin.com/oauth/v2/authorization` +
//         `?response_type=token&client_id=${clientId}` +
//         `&redirect_uri=${redirect}&scope=${scope}&state=${state}`
//       );
//     }

//     // ── LinkedIn Campaign Manager (ads) ──────────────────────────────────────
//     // Code flow — requires backend.
//     case 'linkedin_ads': {
//       const scope = encodeURIComponent('r_ads r_ads_reporting rw_ads openid profile email');
//       return (
//         `https://www.linkedin.com/oauth/v2/authorization` +
//         `?response_type=code&client_id=${clientId}` +
//         `&redirect_uri=${redirect}&scope=${scope}&state=${state}`
//       );
//     }

//     // ── YouTube ───────────────────────────────────────────────────────────────
//     // Code flow with offline access — requires backend.
//     case 'youtube': {
//       const scope = encodeURIComponent(
//         'https://www.googleapis.com/auth/youtube ' +
//         'https://www.googleapis.com/auth/youtube.upload ' +
//         'https://www.googleapis.com/auth/userinfo.email ' +
//         'https://www.googleapis.com/auth/userinfo.profile'
//       );
//       return (
//         `https://accounts.google.com/o/oauth2/v2/auth` +
//         `?client_id=${clientId}&redirect_uri=${redirect}` +
//         `&scope=${scope}&response_type=code` +
//         `&state=${state}&access_type=offline&prompt=consent`
//       );
//     }

//     // ── Google Ads ────────────────────────────────────────────────────────────
//     // Implicit (online-only) token flow.
//     case 'google_ads': {
//       const scope = encodeURIComponent(
//         'https://www.googleapis.com/auth/adwords ' +
//         'https://www.googleapis.com/auth/userinfo.email ' +
//         'https://www.googleapis.com/auth/userinfo.profile'
//       );
//       return (
//         `https://accounts.google.com/o/oauth2/v2/auth` +
//         `?client_id=${clientId}&redirect_uri=${redirect}` +
//         `&scope=${scope}&response_type=token` +
//         `&state=${state}&access_type=online`
//       );
//     }

//     // ── Pinterest (organic) ───────────────────────────────────────────────────
//     // Implicit token flow.
//     case 'pinterest': {
//       const scope = encodeURIComponent('boards:read,pins:read,pins:write,user_accounts:read');
//       return (
//         `https://www.pinterest.com/oauth/` +
//         `?client_id=${clientId}&redirect_uri=${redirect}` +
//         `&scope=${scope}&response_type=token&state=${state}`
//       );
//     }

//     // ── Pinterest Ads ─────────────────────────────────────────────────────────
//     // Code flow — requires backend.
//     case 'pinterest_ads': {
//       const scope = encodeURIComponent(
//         'boards:read,pins:read,pins:write,user_accounts:read,ads:read,ads:write'
//       );
//       return (
//         `https://www.pinterest.com/oauth/` +
//         `?client_id=${clientId}&redirect_uri=${redirect}` +
//         `&scope=${scope}&response_type=code&state=${state}`
//       );
//     }

//     // ── Snapchat (organic) ────────────────────────────────────────────────────
//     // Code flow — requires backend.
//     case 'snapchat': {
//       const scope = encodeURIComponent('snapchat-marketing-api');
//       return (
//         `https://accounts.snapchat.com/login/oauth2/authorize` +
//         `?client_id=${clientId}&redirect_uri=${redirect}` +
//         `&scope=${scope}&response_type=code&state=${state}`
//       );
//     }

//     // ── Snapchat Ads ──────────────────────────────────────────────────────────
//     // Code flow — same endpoint, broader scope.
//     case 'snapchat_ads': {
//       const scope = encodeURIComponent(
//         'snapchat-marketing-api snapchat-profile-api'
//       );
//       return (
//         `https://accounts.snapchat.com/login/oauth2/authorize` +
//         `?client_id=${clientId}&redirect_uri=${redirect}` +
//         `&scope=${scope}&response_type=code&state=${state}`
//       );
//     }

//     // ── TikTok (organic) ──────────────────────────────────────────────────────
//     // Code flow — requires backend.
//     case 'tiktok': {
//       const scope = encodeURIComponent('user.info.basic,video.upload,video.list');
//       return (
//         `https://www.tiktok.com/auth/authorize/` +
//         `?client_key=${clientId}&redirect_uri=${redirect}` +
//         `&scope=${scope}&response_type=code&state=${state}`
//       );
//     }

//     // ── TikTok Ads ────────────────────────────────────────────────────────────
//     // Code flow — requires backend.
//     case 'tiktok_ads': {
//       const scope = encodeURIComponent(
//         'user.info.basic,video.upload,video.list,tt_lead_gen_read,tt_lead_gen_write'
//       );
//       return (
//         `https://business-api.tiktok.com/portal/auth` +
//         `?app_id=${clientId}&redirect_uri=${redirect}` +
//         `&state=${state}`
//       );
//     }

//     default:
//       throw new Error(`Unknown platform: ${platform}`);
//   }
// }

// // ─── Popup orchestration ──────────────────────────────────────────────────────

// /**
//  * Open OAuth popup and wait for the token.
//  * Resolves with { access_token, platform } or { code, platform }.
//  * Rejects with an Error on failure or user cancellation.
//  *
//  * Usage: openOAuthPopup('facebook')  — no clientId needed from the caller.
//  */
// export function openOAuthPopup(platform) {
//   return new Promise((resolve, reject) => {
//     const clientId = getClientId(platform);         // resolved from env vars
//     const url = buildAuthUrl(platform, clientId);
//     const width = 600;
//     const height = 700;
//     const left = window.screenX + (window.outerWidth - width) / 2;
//     const top = window.screenY + (window.outerHeight - height) / 2;

//     const popup = window.open(
//       url,
//       `oauth_${platform}`,
//       `width=${width},height=${height},left=${left},top=${top}`
//     );

//     if (!popup) {
//       reject(new Error('Popup was blocked. Please allow popups for this site.'));
//       return;
//     }

//     const handler = (event) => {
//       if (event.origin !== window.location.origin) return;
//       if (event.data?.type !== 'OAUTH_CALLBACK') return;

//       window.removeEventListener('message', handler);
//       clearInterval(pollClosed);

//       if (event.data.error) {
//         reject(new Error(event.data.error));
//       } else if (event.data.access_token) {
//         resolve({ access_token: event.data.access_token, platform: event.data.platform });
//       } else if (event.data.code) {
//         // Code flow — exchange on the backend in production.
//         resolve({ code: event.data.code, platform: event.data.platform });
//       } else {
//         reject(new Error('No token received'));
//       }
//     };

//     window.addEventListener('message', handler);

//     const pollClosed = setInterval(() => {
//       if (popup.closed) {
//         clearInterval(pollClosed);
//         window.removeEventListener('message', handler);
//         reject(new Error('cancelled'));
//       }
//     }, 500);
//   });
// }

// // ─── Meta / Facebook helpers ──────────────────────────────────────────────────

// /** Fetch Facebook Pages the user manages. */
// export async function fetchFacebookPages(access_token) {
//   const res = await fetch(
//     `https://graph.facebook.com/v19.0/me/accounts?access_token=${access_token}&fields=id,name,access_token,picture`
//   );
//   const data = await res.json();
//   if (data.error) throw new Error(data.error.message);
//   return data.data || [];
// }

// /** Fetch Instagram Business accounts linked to the given Facebook Pages. */
// export async function fetchInstagramAccounts(pages) {
//   const results = [];
//   for (const page of pages) {
//     const res = await fetch(
//       `https://graph.facebook.com/v19.0/${page.id}` +
//       `?fields=instagram_business_account{id,name,username,profile_picture_url}` +
//       `&access_token=${page.access_token}`
//     );
//     const data = await res.json();
//     if (data.instagram_business_account) {
//       results.push({
//         ...data.instagram_business_account,
//         page_name: page.name,
//         page_access_token: page.access_token,
//       });
//     }
//   }
//   return results;
// }

// /** Fetch Meta Ad Accounts accessible by the user token. */
// export async function fetchMetaAdAccounts(access_token) {
//   const res = await fetch(
//     `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${access_token}`
//   );
//   const data = await res.json();
//   if (data.error) throw new Error(data.error.message);
//   return data.data || [];
// }

// // ─── Google helpers ───────────────────────────────────────────────────────────

// /** Fetch Google user info (works for both google_ads and youtube tokens). */
// export async function fetchGoogleUserInfo(access_token) {
//   const res = await fetch(
//     `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
//   );
//   const data = await res.json();
//   if (data.error) throw new Error(data.error.message);
//   return data; // { id, email, name, picture }
// }

// /** Fetch YouTube channels for the authenticated user. */
// export async function fetchYouTubeChannels(access_token) {
//   const res = await fetch(
//     `https://www.googleapis.com/youtube/v3/channels` +
//     `?part=snippet,contentDetails&mine=true&access_token=${access_token}`
//   );
//   const data = await res.json();
//   if (data.error) throw new Error(data.error.message);
//   return (data.items || []).map((ch) => ({
//     id: ch.id,
//     name: ch.snippet.title,
//     description: ch.snippet.description,
//     thumbnail: ch.snippet.thumbnails?.default?.url,
//   }));
// }

// // ─── X / Twitter helpers ──────────────────────────────────────────────────────

// /** Fetch the authenticated Twitter/X user. Requires a valid bearer access_token. */
// export async function fetchTwitterUser(access_token) {
//   const res = await fetch(
//     `https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url`,
//     { headers: { Authorization: `Bearer ${access_token}` } }
//   );
//   const data = await res.json();
//   if (data.errors) throw new Error(data.errors[0].message);
//   return data.data; // { id, name, username, profile_image_url }
// }

// // ─── LinkedIn helpers ─────────────────────────────────────────────────────────

// /** Fetch LinkedIn user profile (OpenID Connect userinfo endpoint). */
// export async function fetchLinkedInProfile(access_token) {
//   const res = await fetch(
//     `https://api.linkedin.com/v2/userinfo`,
//     { headers: { Authorization: `Bearer ${access_token}` } }
//   );
//   const data = await res.json();
//   if (data.status === 401) throw new Error('LinkedIn token is invalid or expired.');
//   return data; // { sub, name, email, picture }
// }

// /** Fetch LinkedIn Ad Accounts the user has access to. */
// export async function fetchLinkedInAdAccounts(access_token) {
//   const res = await fetch(
//     `https://api.linkedin.com/v2/adAccountsV2?q=search&search.type.values[0]=BUSINESS`,
//     { headers: { Authorization: `Bearer ${access_token}` } }
//   );
//   const data = await res.json();
//   if (data.status >= 400) throw new Error(data.message || 'LinkedIn API error');
//   return (data.elements || []).map((a) => ({
//     id: a.id,
//     name: a.name,
//     currency: a.currency,
//     status: a.status,
//   }));
// }

// // ─── Pinterest helpers ────────────────────────────────────────────────────────

// /** Fetch the authenticated Pinterest user. */
// export async function fetchPinterestUser(access_token) {
//   const res = await fetch(
//     `https://api.pinterest.com/v5/user_account`,
//     { headers: { Authorization: `Bearer ${access_token}` } }
//   );
//   const data = await res.json();
//   if (data.code) throw new Error(data.message);
//   return data; // { username, account_type, profile_image, ... }
// }

// /** Fetch Pinterest Ad Accounts. */
// export async function fetchPinterestAdAccounts(access_token) {
//   const res = await fetch(
//     `https://api.pinterest.com/v5/ad_accounts`,
//     { headers: { Authorization: `Bearer ${access_token}` } }
//   );
//   const data = await res.json();
//   if (data.code) throw new Error(data.message);
//   return data.items || [];
// }

// // ─── Snapchat helpers ─────────────────────────────────────────────────────────

// /** Fetch Snapchat user info. */
// export async function fetchSnapchatUser(access_token) {
//   const res = await fetch(
//     `https://adsapi.snapchat.com/v1/me`,
//     { headers: { Authorization: `Bearer ${access_token}` } }
//   );
//   const data = await res.json();
//   if (data.request_status === 'ERROR') throw new Error(data.debug_message);
//   return data.me; // { id, email, display_name, ... }
// }

// /** Fetch Snapchat Ad Accounts. */
// export async function fetchSnapchatAdAccounts(access_token) {
//   const me = await fetchSnapchatUser(access_token);
//   const res = await fetch(
//     `https://adsapi.snapchat.com/v1/organizations/${me.organization_id}/adaccounts`,
//     { headers: { Authorization: `Bearer ${access_token}` } }
//   );
//   const data = await res.json();
//   if (data.request_status === 'ERROR') throw new Error(data.debug_message);
//   return (data.adaccounts || []).map((a) => a.adaccount);
// }

// // ─── TikTok helpers ───────────────────────────────────────────────────────────

// /**
//  * Fetch TikTok user info.
//  * NOTE: TikTok uses a code flow — access_token here is the one your backend
//  * exchanged from the authorization code.
//  */
// export async function fetchTikTokUser(access_token) {
//   const res = await fetch(
//     `https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name`,
//     { headers: { Authorization: `Bearer ${access_token}` } }
//   );
//   const data = await res.json();
//   if (data.error?.code !== 'ok') throw new Error(data.error?.message || 'TikTok API error');
//   return data.data.user;
// }

// /** Fetch TikTok Ads advertiser accounts. */
// export async function fetchTikTokAdAccounts(access_token) {
//   const res = await fetch(
//     `https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/`,
//     { headers: { 'Access-Token': access_token } }
//   );
//   const data = await res.json();
//   if (data.code !== 0) throw new Error(data.message);
//   return data.data?.list || [];
// }

"use client";

/**
 * OAuth popup flow for CreativeKlux integrations.
 */

// ─────────────────────────────────────────────────────────────
// Redirect URI
// ─────────────────────────────────────────────────────────────

const REDIRECT_URI =
  'https://app.creativeklux.com/oauth-callback';

// ─────────────────────────────────────────────────────────────
// API Versioning
// ─────────────────────────────────────────────────────────────

const META_API_VERSION = 'v23.0';

const META_GRAPH_BASE =
  `https://graph.facebook.com/${META_API_VERSION}`;

const META_OAUTH_BASE =
  `https://www.facebook.com/${META_API_VERSION}`;

// ─────────────────────────────────────────────────────────────
// Developer-owned app credentials
// ─────────────────────────────────────────────────────────────

const CLIENT_IDS = {
  facebook:
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,

  instagram:
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,

  meta_ads:
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,

  google_ads:
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,

  youtube:
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,

  twitter:
    process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,

  linkedin:
    process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,

  linkedin_ads:
    process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,

  pinterest:
    process.env.NEXT_PUBLIC_PINTEREST_CLIENT_ID,

  pinterest_ads:
    process.env.NEXT_PUBLIC_PINTEREST_CLIENT_ID,

  snapchat:
    process.env.NEXT_PUBLIC_SNAPCHAT_CLIENT_ID,

  snapchat_ads:
    process.env.NEXT_PUBLIC_SNAPCHAT_CLIENT_ID,

  tiktok:
    process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY,

  tiktok_ads:
    process.env.NEXT_PUBLIC_TIKTOK_ADS_APP_ID,
};

/**
 * Get platform Client ID
 */
export function getClientId(platform) {
  const id = CLIENT_IDS[platform];

  if (!id) {
    throw new Error(
      `Missing env variable for platform: ${platform}`
    );
  }

  return id;
}

// ─────────────────────────────────────────────────────────────
// PKCE Helpers
// ─────────────────────────────────────────────────────────────

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);

  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(buffer) {
  return btoa(
    String.fromCharCode(...new Uint8Array(buffer))
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// async function generatePKCEChallenge() {
//   const verifier = crypto.randomUUID().replace(/-/g, '');

//   const hashed = await sha256(verifier);

//   const challenge = base64urlencode(hashed);

//   sessionStorage.setItem(
//     'creativeklux_pkce_verifier',
//     verifier
//   );

//   return challenge;
// }

// ─────────────────────────────────────────────────────────────
// OAuth URL Builders
// ─────────────────────────────────────────────────────────────

async function generatePKCEChallenge() {
  // Generate a proper 48-byte random verifier (base64url = ~64 chars, within Twitter's 43–128 requirement)
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  const verifier = base64urlencode(array.buffer);

  const hashed = await sha256(verifier);
  const challenge = base64urlencode(hashed);

  sessionStorage.setItem(
    'creativeklux_pkce_verifier',
    verifier
  );

  return challenge;
}

async function buildAuthUrl(platform, clientId) {
  const redirect = encodeURIComponent(REDIRECT_URI);

  const state = encodeURIComponent(
    `${platform}_${Date.now()}`
  );

  switch (platform) {

    // ────────────────────────────────────────────────────────
    // FACEBOOK (basic Pages access only)
    // ────────────────────────────────────────────────────────
    case 'facebook': {
      const scope = encodeURIComponent([
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'read_insights',
      ].join(','));

      return (
        `${META_OAUTH_BASE}/dialog/oauth` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&state=${state}`
      );
    }

    // ────────────────────────────────────────────────────────
    // INSTAGRAM (Graph API via Facebook login)
    // ────────────────────────────────────────────────────────
    case 'instagram': {
      const scope = encodeURIComponent([
        'pages_show_list',
        'instagram_basic',
        'pages_read_engagement',
      ].join(','));

      return (
        `${META_OAUTH_BASE}/dialog/oauth` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&state=${state}`
      );
    }

    // ────────────────────────────────────────────────────────
    // META ADS (business / ads permissions only)
    // ────────────────────────────────────────────────────────
    case 'meta_ads': {
      const scope = encodeURIComponent([
        'business_management',
        'ads_read',
        'read_insights',
      ].join(','));

      return (
        `${META_OAUTH_BASE}/dialog/oauth` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&state=${state}`
      );
    }

    // ────────────────────────────────────────────────────────
    // Twitter / X
    // ────────────────────────────────────────────────────────
    case 'twitter': {
      const scope = encodeURIComponent(
        'tweet.read tweet.write users.read offline.access'
      );

      const challenge =
        await generatePKCEChallenge();

      return (
        `https://twitter.com/i/oauth2/authorize` +
        `?response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&state=${state}` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256`
      );
    }

    // ────────────────────────────────────────────────────────
    // LinkedIn Organic
    // ────────────────────────────────────────────────────────
    case 'linkedin': {
      const scope = encodeURIComponent(
        'openid profile email w_member_social'
      );

      return (
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&state=${state}`
      );
    }

    // ────────────────────────────────────────────────────────
    // LinkedIn Ads
    // ────────────────────────────────────────────────────────
    case 'linkedin_ads': {
      const scope = encodeURIComponent(
        'r_ads r_ads_reporting rw_ads openid profile email'
      );

      return (
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&state=${state}`
      );
    }

    // ────────────────────────────────────────────────────────
    // YouTube
    // ────────────────────────────────────────────────────────
    case 'youtube': {
      const scope = encodeURIComponent([
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '));

      return (
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&state=${state}` +
        `&access_type=offline` +
        `&prompt=consent`
      );
    }

    // ────────────────────────────────────────────────────────
    // Google Ads
    // ────────────────────────────────────────────────────────
    case 'google_ads': {
      const scope = encodeURIComponent([
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '));

      return (
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&state=${state}` +
        `&access_type=offline` +
        `&prompt=consent`
      );
    }

    // ────────────────────────────────────────────────────────
    // Pinterest Organic
    // ────────────────────────────────────────────────────────
    case 'pinterest': {
      const scope = encodeURIComponent(
        'boards:read,pins:read,pins:write,user_accounts:read'
      );

      return (
        `https://www.pinterest.com/oauth/` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&state=${state}`
      );
    }

    // ────────────────────────────────────────────────────────
    // Pinterest Ads
    // ────────────────────────────────────────────────────────
    case 'pinterest_ads': {
      const scope = encodeURIComponent(
        'boards:read,pins:read,pins:write,user_accounts:read,ads:read,ads:write'
      );

      return (
        `https://www.pinterest.com/oauth/` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&state=${state}`
      );
    }

    // ────────────────────────────────────────────────────────
    // SNAPCHAT
    // ────────────────────────────────────────────────────────
    case 'snapchat': {
      const scope = encodeURIComponent('snapchat-marketing-api');

      return (
        `https://accounts.snapchat.com/login/oauth2/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&state=${state}`
      );
    }

    case 'snapchat_ads': {
      const scope = encodeURIComponent(
        'snapchat-marketing-api snapchat-profile-api'
      );

      return (
        `https://accounts.snapchat.com/login/oauth2/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&state=${state}`
      );
    }

    // ────────────────────────────────────────────────────────
    // TIKTOK
    // ────────────────────────────────────────────────────────
    case 'tiktok': {
      const scope = encodeURIComponent(
        'user.info.basic,video.upload,video.list'
      );

      return (
        `https://www.tiktok.com/v2/auth/authorize/` +
        `?client_key=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&state=${state}`
      );
    }

    // ────────────────────────────────────────────────────────
    // TIKTOK ADS
    // ────────────────────────────────────────────────────────
    case 'tiktok_ads': {
      return (
        `https://business-api.tiktok.com/portal/auth` +
        `?app_id=${clientId}` +
        `&redirect_uri=${redirect}` +
        `&state=${state}`
      );
    }

    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Popup orchestration
// ─────────────────────────────────────────────────────────────

export function openOAuthPopup(platform) {
  return new Promise(async (resolve, reject) => {
    try {
      const clientId =
        getClientId(platform);

      const url = await buildAuthUrl(
        platform,
        clientId
      );

      const width = 600;
      const height = 700;

      const left =
        window.screenX +
        (window.outerWidth - width) / 2;

      const top =
        window.screenY +
        (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        `oauth_${platform}`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        reject(
          new Error(
            'Popup was blocked. Please allow popups.'
          )
        );

        return;
      }

      const handler = (event) => {
        if (
          event.origin !==
          window.location.origin
        ) {
          return;
        }

        if (
          event.data?.type !==
          'OAUTH_CALLBACK'
        ) {
          return;
        }

        window.removeEventListener(
          'message',
          handler
        );

        clearInterval(pollClosed);

        if (event.data.error) {
          reject(
            new Error(event.data.error)
          );

          return;
        }

        if (event.data.access_token) {
          resolve({
            access_token:
              event.data.access_token,

            platform:
              event.data.platform,
          });

          return;
        }

        if (event.data.code) {
          resolve({
            code: event.data.code,
            platform:
              event.data.platform,
          });

          return;
        }

        reject(
          new Error('No token received')
        );
      };

      window.addEventListener(
        'message',
        handler
      );

      const pollClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollClosed);

          window.removeEventListener(
            'message',
            handler
          );

          reject(
            new Error('cancelled')
          );
        }
      }, 500);
    } catch (err) {
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Meta Helpers
// ─────────────────────────────────────────────────────────────

export async function fetchFacebookPages(
  access_token
) {
  const res = await fetch(
    `${META_GRAPH_BASE}/me/accounts?access_token=${access_token}&fields=id,name,access_token,picture`
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data || [];
}

export async function fetchInstagramAccounts(
  pages
) {
  const results = [];

  for (const page of pages) {
    const res = await fetch(
      `${META_GRAPH_BASE}/${page.id}?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${page.access_token}`
    );

    const data = await res.json();

    if (
      data.instagram_business_account
    ) {
      results.push({
        ...data.instagram_business_account,
        page_name: page.name,
        page_access_token:
          page.access_token,
      });
    }
  }

  return results;
}

export async function fetchMetaAdAccounts(
  access_token
) {
  const res = await fetch(
    `${META_GRAPH_BASE}/me/adaccounts?fields=id,name,account_status&access_token=${access_token}`
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data || [];
}

// ─────────────────────────────────────────────────────────────
// Google Helpers
// ─────────────────────────────────────────────────────────────

export async function fetchGoogleUserInfo(
  access_token
) {
  const res = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data;
}

export async function fetchYouTubeChannels(
  access_token
) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true&access_token=${access_token}`
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return (data.items || []).map((ch) => ({
    id: ch.id,
    name: ch.snippet.title,
    description:
      ch.snippet.description,
    thumbnail:
      ch.snippet.thumbnails?.default
        ?.url,
  }));
}

// ─────────────────────────────────────────────────────────────
// Twitter/X Helpers
// ─────────────────────────────────────────────────────────────

export async function fetchTwitterUser(
  access_token
) {
  const res = await fetch(
    `https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  const data = await res.json();

  if (data.errors) {
    throw new Error(
      data.errors[0].message
    );
  }

  return data.data;
}

// ─────────────────────────────────────────────────────────────
// LinkedIn Helpers
// ─────────────────────────────────────────────────────────────

export async function fetchLinkedInProfile(
  access_token
) {
  const res = await fetch(
    `https://api.linkedin.com/v2/userinfo`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  const data = await res.json();

  if (data.status === 401) {
    throw new Error(
      'LinkedIn token is invalid or expired.'
    );
  }

  return data;
}

export async function fetchLinkedInAdAccounts(
  access_token
) {
  const res = await fetch(
    `https://api.linkedin.com/v2/adAccountsV2?q=search&search.type.values=List(BUSINESS)`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0',
      }
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'LinkedIn API error');
  }

  return (data.elements || []).map(
    (a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      status: a.status,
    })
  );
}

// ─────────────────────────────────────────────────────────────
// Pinterest Helpers
// ─────────────────────────────────────────────────────────────

export async function fetchPinterestUser(
  access_token
) {
  const res = await fetch(
    `https://api.pinterest.com/v5/user_account`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  const data = await res.json();

  if (data.code) {
    throw new Error(data.message);
  }

  return data;
}

export async function fetchPinterestAdAccounts(
  access_token
) {
  const res = await fetch(
    `https://api.pinterest.com/v5/ad_accounts`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  const data = await res.json();

  if (data.code) {
    throw new Error(data.message);
  }

  return data.items || [];
}

// ─────────────────────────────────────────────────────────────
// Snapchat Helpers
// ─────────────────────────────────────────────────────────────

export async function fetchSnapchatUser(
  access_token
) {
  const res = await fetch(
    `https://adsapi.snapchat.com/v1/me`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  const data = await res.json();

  if (
    data.request_status === 'ERROR'
  ) {
    throw new Error(
      data.debug_message
    );
  }

  return data.me;
}

export async function fetchSnapchatAdAccounts(
  access_token
) {
  const me =
    await fetchSnapchatUser(
      access_token
    );

  const res = await fetch(
    `https://adsapi.snapchat.com/v1/organizations/${me.organization_id}/adaccounts`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  const data = await res.json();

  if (
    data.request_status === 'ERROR'
  ) {
    throw new Error(
      data.debug_message
    );
  }

  return (
    data.adaccounts || []
  ).map((a) => a.adaccount);
}

// ─────────────────────────────────────────────────────────────
// TikTok Helpers
// ─────────────────────────────────────────────────────────────

export async function fetchTikTokUser(
  access_token
) {
  const res = await fetch(
    `https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  const data = await res.json();

  if (
    data.error?.code !== 'ok'
  ) {
    throw new Error(
      data.error?.message ||
      'TikTok API error'
    );
  }

  return data.data.user;
}

export async function fetchTikTokAdAccounts(
  access_token
) {
  const res = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/`,
    {
      headers: {
        'Access-Token':
          access_token,
      },
    }
  );

  const data = await res.json();

  if (data.code !== 0) {
    throw new Error(data.message);
  }

  return data.data?.list || [];
}