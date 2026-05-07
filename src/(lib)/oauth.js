// /**
//  * OAuth popup flow for CreativeKlux integrations.
//  *
//  * How it works:
//  * 1. User provides their platform App Client ID (stored in localStorage).
//  * 2. openOAuthPopup() opens the platform's auth dialog in a popup window.
//  * 3. Platform redirects to /oauth-callback?platform=xxx&access_token=yyy (for implicit flow)
//  *    or /oauth-callback?platform=xxx&code=yyy (for code flow — needs backend).
//  * 4. OAuthCallback.jsx posts the result back via postMessage.
//  * 5. We resolve the promise with the token data.
//  *
//  * For Facebook: uses token implicit flow (response_type=token) — works client-side.
//  * For Google: uses authorization code flow — requires backend to exchange code for token.
//  * For TikTok: uses authorization code flow — requires backend.
//  */

// const REDIRECT_URI = `${window.location.origin}/oauth-callback`;

// // localStorage keys for app Client IDs
// const CLIENT_IDS_KEY = 'creativeklux_oauth_client_ids';

// export function getClientIds() {
//   try { return JSON.parse(localStorage.getItem(CLIENT_IDS_KEY) || '{}'); } catch { return {}; }
// }
// export function saveClientId(platform, clientId) {
//   const ids = getClientIds();
//   ids[platform] = clientId;
//   localStorage.setItem(CLIENT_IDS_KEY, JSON.stringify(ids));
// }

// /**
//  * Build the OAuth authorization URL for each platform.
//  */
// function buildAuthUrl(platform, clientId) {
//   const redirect = encodeURIComponent(REDIRECT_URI);
//   const state = encodeURIComponent(platform);

//   switch (platform) {
//     case 'facebook':
//     case 'instagram':
//     case 'meta_ads': {
//       // Facebook uses implicit flow — returns token directly in hash
//       const scope = encodeURIComponent(
//         'pages_show_list,pages_manage_posts,pages_read_engagement,' +
//         'instagram_basic,instagram_content_publish,' +
//         'ads_management,business_management,read_insights'
//       );
//       return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirect}&scope=${scope}&response_type=token&state=${state}`;
//     }

//     case 'google_ads': {
//       const scope = encodeURIComponent(
//         'https://www.googleapis.com/auth/adwords ' +
//         'https://www.googleapis.com/auth/userinfo.email ' +
//         'https://www.googleapis.com/auth/userinfo.profile'
//       );
//       return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirect}&scope=${scope}&response_type=token&state=${state}&access_type=online`;
//     }

//     case 'tiktok': {
//       const scope = encodeURIComponent('user.info.basic,video.upload,video.list');
//       return `https://www.tiktok.com/auth/authorize/?client_key=${clientId}&redirect_uri=${redirect}&scope=${scope}&response_type=code&state=${state}`;
//     }

//     default:
//       throw new Error(`Unknown platform: ${platform}`);
//   }
// }

// /**
//  * Open OAuth popup and wait for the token.
//  * Returns { access_token, platform } or throws on error/cancel.
//  */
// export function openOAuthPopup(platform, clientId) {
//   return new Promise((resolve, reject) => {
//     const url = buildAuthUrl(platform, clientId);
//     const width = 600, height = 700;
//     const left = window.screenX + (window.outerWidth - width) / 2;
//     const top = window.screenY + (window.outerHeight - height) / 2;

//     const popup = window.open(url, `oauth_${platform}`, `width=${width},height=${height},left=${left},top=${top}`);

//     if (!popup) {
//       reject(new Error('Popup was blocked. Please allow popups for this site.'));
//       return;
//     }

//     // Listen for message from OAuthCallback page
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
//         // Code flow — for now resolve with code so user knows auth succeeded
//         // In production, exchange code for token server-side
//         resolve({ code: event.data.code, platform: event.data.platform });
//       } else {
//         reject(new Error('No token received'));
//       }
//     };
//     window.addEventListener('message', handler);

//     // Detect if popup was manually closed
//     const pollClosed = setInterval(() => {
//       if (popup.closed) {
//         clearInterval(pollClosed);
//         window.removeEventListener('message', handler);
//         reject(new Error('cancelled'));
//       }
//     }, 500);
//   });
// }

// /**
//  * After getting a Facebook user access token, fetch their pages
//  * so the user can pick which page to post to.
//  */
// export async function fetchFacebookPages(access_token) {
//   const res = await fetch(
//     `https://graph.facebook.com/v19.0/me/accounts?access_token=${access_token}&fields=id,name,access_token,picture`
//   );
//   const data = await res.json();
//   if (data.error) throw new Error(data.error.message);
//   return data.data || []; // array of { id, name, access_token (page token), picture }
// }

// /**
//  * Fetch Instagram Business accounts linked to Facebook Pages.
//  */
// export async function fetchInstagramAccounts(pages) {
//   const results = [];
//   for (const page of pages) {
//     const res = await fetch(
//       `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${page.access_token}`
//     );
//     const data = await res.json();
//     if (data.instagram_business_account) {
//       results.push({ ...data.instagram_business_account, page_name: page.name, page_access_token: page.access_token });
//     }
//   }
//   return results;
// }

// /**
//  * Fetch Meta Ad Accounts accessible by the token.
//  */
// export async function fetchMetaAdAccounts(access_token) {
//   const res = await fetch(
//     `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${access_token}`
//   );
//   const data = await res.json();
//   if (data.error) throw new Error(data.error.message);
//   return data.data || [];
// }

// /**
//  * Fetch Google user info after getting a Google access token.
//  */
// export async function fetchGoogleUserInfo(access_token) {
//   const res = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`);
//   const data = await res.json();
//   if (data.error) throw new Error(data.error.message);
//   return data; // { id, email, name, picture }
// }

/**
 * OAuth popup flow for CreativeKlux integrations.
 */

const REDIRECT_URI = `${window.location.origin}/oauth-callback`;

// ─────────────────────────────────────────────────────────────
// Meta API versioning
// ─────────────────────────────────────────────────────────────
const META_API_VERSION = 'v23.0';

const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`;
const META_OAUTH_BASE = `https://www.facebook.com/${META_API_VERSION}`;

// localStorage keys for app Client IDs
const CLIENT_IDS_KEY = 'creativeklux_oauth_client_ids';

export function getClientIds() {
  try {
    return JSON.parse(localStorage.getItem(CLIENT_IDS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveClientId(platform, clientId) {
  const ids = getClientIds();
  ids[platform] = clientId;
  localStorage.setItem(CLIENT_IDS_KEY, JSON.stringify(ids));
}

/**
 * Build OAuth authorization URL
 */
function buildAuthUrl(platform, clientId) {
  const redirect = encodeURIComponent(REDIRECT_URI);
  const state = encodeURIComponent(platform);

  switch (platform) {
    case 'facebook':
    case 'instagram':
    case 'meta_ads': {
      const scope = encodeURIComponent([
        'pages_show_list',
        'pages_manage_posts',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_content_publish',
        'ads_management',
        'business_management',
        'read_insights',
      ].join(','));

      return `${META_OAUTH_BASE}/dialog/oauth?client_id=${clientId}&redirect_uri=${redirect}&scope=${scope}&response_type=token&state=${state}`;
    }

    case 'google_ads': {
      const scope = encodeURIComponent([
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '));

      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirect}&scope=${scope}&response_type=token&state=${state}&access_type=online&prompt=consent`;
    }

    case 'tiktok': {
      const scope = encodeURIComponent(
        'user.info.basic,video.upload,video.list'
      );

      return `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientId}&redirect_uri=${redirect}&scope=${scope}&response_type=code&state=${state}`;
    }

    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * Open OAuth popup
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
      reject(new Error('Popup was blocked. Please allow popups.'));
      return;
    }

    const handler = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'OAUTH_CALLBACK') return;

      window.removeEventListener('message', handler);
      clearInterval(pollClosed);

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }

      if (event.data.access_token) {
        resolve({
          access_token: event.data.access_token,
          platform: event.data.platform,
        });
        return;
      }

      if (event.data.code) {
        resolve({
          code: event.data.code,
          platform: event.data.platform,
        });
        return;
      }

      reject(new Error('No token received'));
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

/**
 * Fetch Facebook Pages
 */
export async function fetchFacebookPages(access_token) {
  const res = await fetch(
    `${META_GRAPH_BASE}/me/accounts?access_token=${access_token}&fields=id,name,access_token,picture`
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data || [];
}

/**
 * Fetch Instagram Business Accounts
 */
export async function fetchInstagramAccounts(pages) {
  const results = [];

  for (const page of pages) {
    const res = await fetch(
      `${META_GRAPH_BASE}/${page.id}?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${page.access_token}`
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

/**
 * Fetch Meta Ad Accounts
 */
export async function fetchMetaAdAccounts(access_token) {
  const res = await fetch(
    `${META_GRAPH_BASE}/me/adaccounts?fields=id,name,account_status&access_token=${access_token}`
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data || [];
}

/**
 * Fetch Google User Info
 */
export async function fetchGoogleUserInfo(access_token) {
  const res = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data;
}