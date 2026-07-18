"use client";

// useIntegrationConnect
// ─────────────────────────────────────────────────────────────────────────────
// The shared OAuth "connect engine" behind both the Integrations page and the
// brand-create wizard. It runs the platform handshake (popup or full-page
// redirect), resolves the platform credentials, and — for platforms that expose
// multiple targets — drives the account/page picker. It never persists anything
// itself: every resolved connection is handed to the caller's `onResolved`
// callback, which decides whether to save it to a brand (Integrations page) or
// hold it for later (the wizard sends it when the brand is created).
//
// onResolved receives a normalized payload (NO brand_id — the caller adds it):
//   { platform, access_token, refresh_token, int_id, int_name, page_id? }
//
// Options:
//   brandId    — used only to stash the redirect "pending" state (Integrations).
//   forcePopup — when true, redirect platforms use a popup instead of a full-page
//                redirect, so the caller's page (the wizard) isn't navigated away.

import { useState } from "react";
import { openOAuthPopup, startOAuthRedirect } from "@/(lib)/oauth/page";
import { REDIRECT_PLATFORMS } from "@/(lib)/integrations/platforms";

export function useIntegrationConnect({
  brandId,
  onResolved,
  showToast,
  forcePopup = false,
} = {}) {
  const [loadingPlatformId, setLoadingPlatformId] = useState(null);

  // Account/page picker state (Facebook Pages, ad accounts, advertisers…).
  const [fbPages, setFbPages] = useState([]);
  const [showPageModal, setShowPageModal] = useState(false);
  const [fbLoadingPageId, setFbLoadingPageId] = useState(null);
  const [pendingFbOauth, setPendingFbOauth] = useState(null);

  const toast = (msg, type = "success") => showToast?.(msg, type);

  // ── Per-platform credential resolvers ──────────────────────────────────────
  async function resolveMetaIntegration(platformId, oauthResult) {
    const res = await fetch("/api/meta/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: oauthResult.access_token,
        code: oauthResult.code,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Meta exchange failed");

    const userToken = data.access_token;
    const pagesRes = await fetch(
      `https://graph.facebook.com/v23.0/me/accounts?access_token=${userToken}&fields=id,name,access_token,picture,instagram_business_account{id,username}`,
    );
    const pagesData = await pagesRes.json();
    if (pagesData.error) throw new Error(pagesData.error.message);

    const pages = pagesData.data || [];
    if (!pages.length) throw new Error("No pages found");
    return { type: "meta_pages", userToken, pages };
  }

  async function resolveLinkedInIntegration(oauthResult) {
    const res = await fetch("/api/linkedin/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: oauthResult.code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "LinkedIn failed");
    return { type: "linkedin", int_token: data.access_token, int_id: data.int_id };
  }

  async function resolveTwitterIntegration(oauthResult) {
    const code_verifier = sessionStorage.getItem("creativeklux_pkce_verifier");
    if (!code_verifier)
      throw new Error("Missing PKCE verifier — please try connecting again.");

    const res = await fetch("/api/twitter/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: oauthResult.code, code_verifier }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Twitter exchange failed");

    sessionStorage.removeItem("creativeklux_pkce_verifier");
    return {
      type: "twitter",
      int_token: data.access_token,
      refresh_token: data.refresh_token,
      int_id: data.int_id,
      int_name: data.username ? `@${data.username}` : data.name,
    };
  }

  async function resolvePinterestIntegration(oauthResult) {
    const res = await fetch("/api/pinterest/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: oauthResult.code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Pinterest exchange failed");
    return {
      type: "pinterest",
      int_token: data.access_token,
      int_id: data.int_id,
      int_name: data.name,
    };
  }

  async function resolvePinterestAdsIntegration({ access_token }) {
    const res = await fetch("/api/pinterest-ads/ad-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || "Failed to load Pinterest ad accounts");
    return { adAccounts: data.adAccounts || [] };
  }

  async function resolveTikTokIntegration(oauthResult) {
    const res = await fetch("/api/tiktok/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: oauthResult.code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "TikTok exchange failed");
    return {
      type: "tiktok",
      int_token: data.access_token,
      refresh_token: data.refresh_token,
      int_id: data.int_id,
      int_name: data.name ? `@${data.name}` : "TikTok",
    };
  }

  async function resolveSnapchatAdsIntegration(oauthResult) {
    const res = await fetch("/api/snapchat-ads/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: oauthResult.code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Snapchat Ads connect failed");
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      adAccounts: data.adAccounts || [],
    };
  }

  async function resolveGoogleAdsIntegration(oauthResult) {
    const res = await fetch("/api/google/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: oauthResult.code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Google exchange failed");
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      scope: data.scope,
    };
  }

  async function resolveTikTokAdsIntegration(oauthResult) {
    const res = await fetch("/api/tiktok-ads/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth_code: oauthResult.code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "TikTok Ads exchange failed");
    return data; // { access_token, advertisers: [{ id, name }] }
  }

  async function resolveYouTubeIntegration(oauthResult) {
    const tokenData = await resolveGoogleAdsIntegration(oauthResult);
    if (tokenData.scope && !/auth\/youtube/.test(tokenData.scope)) {
      console.warn("YouTube connect — granted scopes:", tokenData.scope);
      throw new Error(
        "YouTube access wasn't granted. In Google Cloud (the project for this OAuth client): enable YouTube Data API v3 and add the youtube + youtube.upload scopes to the consent screen, then reconnect.",
      );
    }
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    );
    const data = await res.json();
    if (!res.ok) {
      const msg = data.error?.message || "Failed to fetch YouTube channel";
      if (/scope|insufficient|not been used|disabled/i.test(msg)) {
        throw new Error(
          "YouTube rejected the connection (scope/API not enabled). In Google Cloud for this OAuth client: enable YouTube Data API v3 and add the youtube + youtube.upload scopes to the consent screen, then reconnect. (" +
            msg +
            ")",
        );
      }
      throw new Error(msg);
    }
    const channel = data.items?.[0];
    if (!channel)
      throw new Error(
        "No YouTube channel found on this Google account. Create a YouTube channel, then try again.",
      );
    return {
      int_token: tokenData.access_token,
      int_id: channel.id,
      int_name: channel.snippet?.title || "YouTube Channel",
    };
  }

  async function fetchGoogleAdAccounts(access_token) {
    const res = await fetch("/api/google/ad-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || "Failed to fetch Google ad accounts");
    return data.accounts || [];
  }

  async function resolveGenericIntegration(platformId, oauthResult) {
    let access_token = oauthResult.access_token;
    let int_id = null;
    switch (platformId) {
      case "google_ads": {
        const res = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`,
        );
        const data = await res.json();
        int_id = data.id;
        break;
      }
      case "pinterest":
      case "pinterest_ads": {
        const res = await fetch("https://api.pinterest.com/v5/user_account", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const data = await res.json();
        int_id = data.username || data.id;
        break;
      }
      case "snapchat_ads": {
        const res = await fetch("https://adsapi.snapchat.com/v1/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const data = await res.json();
        int_id = data.me?.id;
        break;
      }
    }
    return { int_token: access_token, int_id };
  }

  // Resolve the credentials for a platform. Returns the resolved creds, or null
  // when it instead opened the account/page picker (which finishes via
  // handleSelectPage → onResolved).
  async function resolveIntegrationCredentials(platformId, oauthResult) {
    if (["facebook", "instagram", "meta_ads"].includes(platformId)) {
      const { userToken, pages } = await resolveMetaIntegration(
        platformId,
        oauthResult,
      );
      let pagePicks = pages.map((p) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
        _ig_user_id: p.instagram_business_account?.id || null,
        _ig_username: p.instagram_business_account?.username || null,
      }));
      if (platformId === "instagram") {
        pagePicks = pagePicks.filter((p) => p._ig_user_id);
        if (!pagePicks.length) {
          throw new Error(
            "No Instagram Business account found. Link an Instagram Business/Creator account to your Facebook Page, then try again.",
          );
        }
      }
      setFbPages(pagePicks);
      setPendingFbOauth({ platformId, userToken });
      setShowPageModal(true);
      return null;
    }

    if (platformId === "linkedin")
      return await resolveLinkedInIntegration(oauthResult);
    if (platformId === "twitter")
      return await resolveTwitterIntegration(oauthResult);

    if (platformId === "google_ads") {
      const tokenData = await resolveGoogleAdsIntegration(oauthResult);
      const adAccounts = await fetchGoogleAdAccounts(tokenData.access_token);
      setFbPages(adAccounts.map((acc) => ({ id: acc.id, name: acc.name })));
      setPendingFbOauth({
        platformId: "google_ads",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      });
      setShowPageModal(true);
      return null;
    }

    if (platformId === "pinterest")
      return await resolvePinterestIntegration(oauthResult);

    if (platformId === "pinterest_ads") {
      const tokenData = await resolvePinterestIntegration(oauthResult);
      const result = await resolvePinterestAdsIntegration({
        access_token: tokenData.int_token,
      });
      setFbPages(result.adAccounts.map((acc) => ({ id: acc.id, name: acc.name })));
      setPendingFbOauth({
        platformId: "pinterest_ads",
        access_token: tokenData.int_token,
        userName: tokenData.int_name,
      });
      setShowPageModal(true);
      return null;
    }

    if (platformId === "tiktok_ads") {
      const tokenData = await resolveTikTokAdsIntegration(oauthResult);
      setFbPages(
        (tokenData.advertisers || []).map((a) => ({ id: a.id, name: a.name })),
      );
      setPendingFbOauth({
        platformId: "tiktok_ads",
        access_token: tokenData.access_token,
      });
      setShowPageModal(true);
      return null;
    }

    if (platformId === "snapchat_ads") {
      const tokenData = await resolveSnapchatAdsIntegration(oauthResult);
      setFbPages(
        (tokenData.adAccounts || []).map((a) => ({ id: a.id, name: a.name })),
      );
      setPendingFbOauth({
        platformId: "snapchat_ads",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      });
      setShowPageModal(true);
      return null;
    }

    if (platformId === "youtube")
      return await resolveYouTubeIntegration(oauthResult);
    if (platformId === "tiktok")
      return await resolveTikTokIntegration(oauthResult);

    return await resolveGenericIntegration(platformId, oauthResult);
  }

  // Normalize a directly-resolved cred set and hand it to the caller.
  async function emitResolved(platform, creds) {
    await onResolved?.({
      platform,
      access_token: creds.int_token ?? creds.access_token ?? null,
      refresh_token: creds.refresh_token ?? null,
      int_id: creds.int_id ?? null,
      int_name: creds.int_name ?? null,
    });
  }

  // Run the resolve step for a completed OAuth handshake (popup result OR the
  // code returned from a full-page redirect), then emit unless it opened the
  // picker. Exposed so the Integrations page's redirect-return effect can reuse it.
  async function resolveFromOauth(platform, oauthResult) {
    const creds = await resolveIntegrationCredentials(platform, oauthResult);
    if (!creds) return; // picker path — finishes in handleSelectPage
    await emitResolved(platform, creds);
  }

  // ── Public: start a connect ────────────────────────────────────────────────
  async function connect(platformId) {
    // Redirect platforms (Integrations page only): navigate the whole tab away
    // and finish on return. The wizard passes forcePopup so it never does this.
    if (!forcePopup && REDIRECT_PLATFORMS.includes(platformId)) {
      try {
        sessionStorage.setItem(
          "creativeklux_oauth_pending",
          JSON.stringify({ platform: platformId, brandId }),
        );
        setLoadingPlatformId(platformId);
        await startOAuthRedirect(platformId);
      } catch (err) {
        setLoadingPlatformId(null);
        toast(err.message || "Couldn't start the connection", "error");
      }
      return;
    }

    setLoadingPlatformId(platformId);
    try {
      const oauthResult = await openOAuthPopup(platformId);
      await resolveFromOauth(platformId, oauthResult);
    } catch (err) {
      if (err.message === "cancelled") return;
      console.error("Connect error:", err);
      toast(err.message || "Connection failed", "error");
    } finally {
      setLoadingPlatformId(null);
    }
  }

  // ── Picker: user chose a page / ad account / advertiser ────────────────────
  async function handleSelectPage(page) {
    setFbLoadingPageId(page.id);
    const { platformId, userToken } = pendingFbOauth;
    try {
      let payload;

      if (platformId === "facebook") {
        payload = {
          platform: "facebook",
          access_token: page.access_token,
          int_id: page.id,
          int_name: page.name,
        };
      } else if (platformId === "pinterest_ads") {
        payload = {
          platform: "pinterest_ads",
          access_token: pendingFbOauth.access_token,
          int_id: page.id,
          int_name: `${pendingFbOauth.userName} • ${page.name}`,
        };
      } else if (platformId === "tiktok_ads") {
        payload = {
          platform: "tiktok_ads",
          access_token: pendingFbOauth.access_token,
          int_id: page.id,
          int_name: page.name,
        };
      } else if (platformId === "snapchat_ads") {
        payload = {
          platform: "snapchat_ads",
          access_token: pendingFbOauth.access_token,
          refresh_token: pendingFbOauth.refresh_token,
          int_id: page.id,
          int_name: page.name,
        };
      } else if (platformId === "google_ads") {
        payload = {
          platform: "google_ads",
          access_token: pendingFbOauth.access_token,
          refresh_token: pendingFbOauth.refresh_token,
          int_id: page.id,
          int_name: page.name,
        };
      } else if (platformId === "instagram") {
        payload = {
          platform: "instagram",
          access_token: page.access_token,
          int_id: page._ig_user_id,
          int_name: page._ig_username ? `@${page._ig_username}` : page.name,
        };
      } else if (platformId === "meta_ads") {
        const adRes = await fetch(
          `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,account_status&access_token=${userToken}`,
        );
        const adData = await adRes.json();
        if (adData.error) throw new Error(adData.error.message);
        const accounts = adData.data || [];
        if (!accounts.length) throw new Error("No Meta ad accounts found.");
        const adAccount = accounts[0];
        payload = {
          platform: "meta_ads",
          access_token: userToken,
          int_id: adAccount.id,
          int_name: `${page.name} • ${adAccount.name}`,
          page_id: page.id,
        };
      }

      await onResolved?.(payload);
      setShowPageModal(false);
      setPendingFbOauth(null);
    } catch (err) {
      console.error(err);
      toast(err.message || "Failed to connect", "error");
    } finally {
      setFbLoadingPageId(null);
      setLoadingPlatformId(null);
    }
  }

  function closePageModal() {
    setShowPageModal(false);
    setPendingFbOauth(null);
    setLoadingPlatformId(null);
  }

  return {
    connect,
    loadingPlatformId,
    setLoadingPlatformId,
    resolveFromOauth,
    // Props ready to spread into <PlatformPageModal /> (rendered when open).
    pageModal: {
      open: showPageModal,
      pages: fbPages,
      loadingPageId: fbLoadingPageId,
      onSelect: handleSelectPage,
      onClose: closePageModal,
    },
  };
}
