"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Info, AlertCircle, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/app/(components)/Toast";
import {
  setStoredXRefresh,
  setStoredTikTokRefresh,
  getPublishedPosts,
  setPublishedPosts,
} from "@/(lib)/integration";
import {
  SOCIAL_PLATFORMS,
  AD_PLATFORMS,
  PRODUCTIVITY_PLATFORMS,
  getPlatformName,
} from "@/(lib)/integrations/platforms";
import IntegrationsSkeleton from "@/app/(components)/integrations/IntegrationsSkeleton";
import PlatformPageModal from "@/app/(components)/integrations/PlatformPageModal";
import { useIntegrationConnect } from "@/app/(components)/integrations/useIntegrationConnect";
import { runServerOAuth } from "@/app/(components)/integrations/serverOAuth";

// ── Platform Card ─────────────────────────────────────────────────────────────
const PlatformCard = ({
  platform,
  integrations,
  onConnect,
  onDisconnect,
  loadingPlatformId,
  loadingIntegrationId,
}) => {
  const { Icon } = platform;
  const isConnected = integrations.length > 0;
  const integration = integrations[0]; // first connected integration

  const isPending =
    loadingPlatformId === platform.id ||
    integrations.some((i) => i.id === loadingIntegrationId);

  const connectedLabel = integration?.int_name || integration?.int_id || null;

  return (
    <div className="rounded-xl border bg-surface border-gray-200 hover:shadow transition-all">
      <div className="flex items-center gap-4 px-5 py-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm shrink-0"
          style={{ background: platform.iconBg }}
        >
          <Icon />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{platform.name}</span>
            {isConnected ? (
              <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {connectedLabel ? connectedLabel : "Connected"}
              </span>
            ) : (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border">
                Not connected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {platform.description}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {isConnected ? (
            <button
              onClick={() => onDisconnect(integration.id)}
              disabled={isPending}
              className="px-3 py-1.5 cursor-pointer text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : (
            <button
              onClick={() => onConnect(platform.id)}
              disabled={isPending}
              className="px-3 py-1.5 hover:scale-105 cursor-pointer text-xs text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #155dfc, #3b82f6)" }}
            >
              {isPending ? "Connecting…" : "Connect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <h2 className="text-base font-bold text-gray-900 tracking-tight mb-3">
    {title}
  </h2>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const IntegrationsPage = () => {
  const {
    saveIntegration,
    disconnectIntegration,
    fetchIntegrations,
    connectIntegrationProvider,
    fetchIntegrationCatalogue,
    disconnectIntegrationPlatform,
    activeBrandId,
    token,
  } = useAuth();

  const [loadingIntegrationId, setLoadingIntegrationId] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [integrations, setIntegrations] = useState([]);
  // Server-owned providers (Productivity): their state comes from the catalogue,
  // never from POST/GET /integrations rows.
  const [catalogue, setCatalogue] = useState([]);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState(null);

  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") =>
    setToast({ isOpen: true, message, type });
  const closeToast = () => setToast((prev) => ({ ...prev, isOpen: false }));

  // ── Fetch existing integrations on mount ──
  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const [data, entries] = await Promise.all([
          fetchIntegrations(),
          fetchIntegrationCatalogue(),
        ]);
        if (Array.isArray(data)) setIntegrations(data);
        if (Array.isArray(entries)) setCatalogue(entries);
      } catch (err) {
        console.error("Failed to load integrations:", err);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [fetchIntegrations, fetchIntegrationCatalogue]);

  const refreshCatalogue = useCallback(async () => {
    const entries = await fetchIntegrationCatalogue();
    if (Array.isArray(entries)) setCatalogue(entries);
  }, [fetchIntegrationCatalogue]);

  // ── Server-owned connect (Google Workspace / Outlook) ──
  // The API runs the OAuth; we open its consent URL and wait for the callback's
  // postMessage. The catalogue is re-read whatever the outcome — it's the only
  // record of what was actually stored. A failed connect is never retried.
  const handleServerConnect = useCallback(
    async (platformId) => {
      const provider = PRODUCTIVITY_PLATFORMS.find(
        (p) => p.id === platformId,
      )?.provider;
      if (!provider) return;
      if (!activeBrandId) {
        showToast("Select a brand first.", "error");
        return;
      }

      setConnectingProvider(provider);
      try {
        const result = await runServerOAuth(() =>
          connectIntegrationProvider(provider, activeBrandId),
        );
        if (result.status === "blocked") {
          showToast("Allow popups for this site, then try again.", "error");
          return;
        }
        if (result.status === "success") {
          showToast(result.message || "Connected", "success");
        } else if (result.status === "error") {
          showToast(result.message, "error");
        }
        // "closed": the user shut the popup — say nothing, just refresh.
        await refreshCatalogue();
      } finally {
        setConnectingProvider(null);
      }
    },
    [activeBrandId, connectIntegrationProvider, refreshCatalogue],
  );

  // ── Server-owned disconnect ── (`provider` is the card's synthetic row id)
  const handleServerDisconnect = useCallback(
    async (provider) => {
      setDisconnectingProvider(provider);
      try {
        const result = await disconnectIntegrationPlatform(provider);
        if (!result.ok) {
          showToast(result.message || "Failed to disconnect", "error");
          return;
        }
        showToast("Integration disconnected.", "success");
        await refreshCatalogue();
      } finally {
        setDisconnectingProvider(null);
      }
    },
    [disconnectIntegrationPlatform, refreshCatalogue],
  );

  // A Productivity card's "integrations" — one synthetic row (id = provider)
  // when the catalogue says its provider is connected, so PlatformCard renders
  // it like any other connection.
  const catalogueRowsFor = (provider) => {
    const entry = catalogue.find((e) => e.platform === provider);
    return entry?.connected
      ? [{ id: provider, platform: provider, int_name: entry.account_label }]
      : [];
  };

  // Persist a resolved connection against the active brand, then reflect it in
  // the list. This is the Integrations-page behaviour for the shared engine.
  const onResolved = useCallback(
    async (payload) => {
      const saved = await saveIntegration({
        platform: payload.platform,
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        brand_id: activeBrandId,
        int_id: payload.int_id,
        int_name: payload.int_name,
        ...(payload.page_id ? { page_id: payload.page_id } : {}),
      });

      if (!saved.ok) {
        showToast(saved.message || "Failed to save integration", "error");
        return;
      }

      // X / TikTok: stash the refresh token keyed by the saved integration id
      // (stopgap until the backend persists it) so posting can mint fresh tokens.
      const savedId = saved.data?.id || saved.data?.data?.id || saved.id;
      if (payload.platform === "twitter" && payload.refresh_token && savedId)
        setStoredXRefresh(savedId, payload.refresh_token);
      if (payload.platform === "tiktok" && payload.refresh_token && savedId)
        setStoredTikTokRefresh(savedId, payload.refresh_token);

      showToast(
        `${getPlatformName(payload.platform)} connected successfully!`,
        "success",
      );
      setIntegrations((prev) => [
        ...prev,
        {
          id: savedId,
          platform: payload.platform,
          int_id: payload.int_id,
          int_name: payload.int_name,
        },
      ]);
    },
    [saveIntegration, activeBrandId],
  );

  const {
    connect,
    loadingPlatformId,
    setLoadingPlatformId,
    resolveFromOauth,
    pageModal,
  } = useIntegrationConnect({
    brandId: activeBrandId,
    onResolved,
    showToast,
  });

  // ── Connect handler (guards on active brand, then delegates to the engine) ──
  const handleConnect = useCallback(
    (platformId) => {
      if (!activeBrandId) {
        showToast("Please select an active brand before connecting.", "error");
        return;
      }
      connect(platformId);
    },
    [activeBrandId, connect],
  );

  // ── Finish a full-page redirect connect (X etc.) on return ──
  const redirectHandled = useRef(false);
  useEffect(() => {
    if (redirectHandled.current) return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get("oauth_code");
    const oauthError = url.searchParams.get("oauth_error");
    const rawState = url.searchParams.get("oauth_state");
    if (!code && !oauthError) return;
    if (!token) return; // wait until the app session is restored

    redirectHandled.current = true;

    let pending = null;
    try {
      pending = JSON.parse(
        sessionStorage.getItem("creativeklux_oauth_pending") || "null",
      );
    } catch {
      /* ignore */
    }
    const platform =
      pending?.platform || rawState?.replace(/_\d+$/, "") || null;

    window.history.replaceState({}, "", "/integrations");
    sessionStorage.removeItem("creativeklux_oauth_pending");

    if (!platform) return;

    (async () => {
      setLoadingPlatformId(platform);
      try {
        if (oauthError) throw new Error(oauthError);
        await resolveFromOauth(platform, { code, platform });
      } catch (err) {
        console.error("Redirect connect error:", err);
        showToast(err.message || "Connection failed", "error");
      } finally {
        setLoadingPlatformId(null);
      }
    })();
  }, [token, resolveFromOauth, setLoadingPlatformId]);

  // ── Disconnect handler ──
  const handleDisconnect = useCallback(
    async (integrationId) => {
      setLoadingIntegrationId(integrationId);
      try {
        const result = await disconnectIntegration(integrationId);
        if (!result.ok) {
          showToast(result.message || "Failed to disconnect", "error");
          return;
        }

        const disconnectedPlatform = integrations.find(
          (i) => i.id === integrationId,
        )?.platform;

        setIntegrations((prev) => prev.filter((i) => i.id !== integrationId));

        if (disconnectedPlatform) {
          // Only this brand's bucket — the integration belonged to it, and the
          // other brands' posts have nothing to do with this disconnect.
          try {
            const cleaned = getPublishedPosts(activeBrandId).filter(
              (p) => !(p.live && p.platform === disconnectedPlatform),
            );
            setPublishedPosts(activeBrandId, cleaned);
          } catch (e) {
            console.warn("Failed to clean localStorage posts:", e);
          }
        }

        showToast("Integration disconnected.", "success");
      } catch (err) {
        console.error("Disconnect error:", err);
        showToast(err.message || "Disconnect failed", "error");
      } finally {
        setLoadingIntegrationId(null);
      }
    },
    [disconnectIntegration, integrations, activeBrandId],
  );

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />

      <div className="flex-1">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Integrations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect your accounts with one click — CreativeKlux opens the
            platform login, you approve, and it's done.
          </p>
        </div>

        {/* How it works banner */}
        <div className="mb-6 flex gap-3 items-start bg-[#eff4ff] border border-[#c7d9fd] rounded-xl px-4 py-3.5">
          <Info className="h-4 w-4 text-[#155dfc] shrink-0 mt-0.5" />
          <p className="text-sm text-[#1e40af] leading-relaxed">
            <span className="font-semibold">How it works: </span>
            Click <span className="italic font-medium">Connect</span> on any
            platform. A popup opens where you log in and approve permissions.
            Your credentials are saved automatically to your active brand.
          </p>
        </div>

        {fetching ? (
          /* The platform rows themselves, greyed out — the list is a fixed set
             of platforms, so its shape is known before the request returns and
             only each row's connected/not-connected state is actually pending.
             Same component the route's loading.jsx uses, so the two frames are
             indistinguishable. */
          <IntegrationsSkeleton />
        ) : (
          <>
            <div className="mb-8">
              <SectionHeader title="Social Media" />
              <div className="flex flex-col gap-3">
                {SOCIAL_PLATFORMS.map((platform) => (
                  <PlatformCard
                    key={platform.id}
                    platform={platform}
                    integrations={integrations.filter(
                      (i) => i.platform === platform.id,
                    )}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    loadingPlatformId={loadingPlatformId}
                    loadingIntegrationId={loadingIntegrationId}
                  />
                ))}
              </div>
            </div>

            <div className="mb-8">
              <SectionHeader title="Advertising Platforms" />
              <div className="flex flex-col gap-3">
                {AD_PLATFORMS.map((platform) => (
                  <PlatformCard
                    key={platform.id}
                    platform={platform}
                    integrations={integrations.filter(
                      (i) => i.platform === platform.id,
                    )}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    loadingPlatformId={loadingPlatformId}
                    loadingIntegrationId={loadingIntegrationId}
                  />
                ))}
              </div>
            </div>

            <div className="mb-8">
              <SectionHeader title="Productivity" />
              <div className="flex flex-col gap-3">
                {PRODUCTIVITY_PLATFORMS.map((platform) => (
                  <PlatformCard
                    key={platform.id}
                    platform={platform}
                    integrations={catalogueRowsFor(platform.provider)}
                    onConnect={handleServerConnect}
                    onDisconnect={handleServerDisconnect}
                    // Rows sharing a provider (Gmail + Sheets) go busy together.
                    loadingPlatformId={
                      connectingProvider === platform.provider
                        ? platform.id
                        : null
                    }
                    loadingIntegrationId={disconnectingProvider}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Gmail and Google Sheets share one Google connection. Disconnecting
                removes access from Creative Klux only — to remove the app from
                your account entirely, revoke it in your Google or Microsoft
                security settings.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom note */}
      <div className="mt-auto pt-2 pb-6">
        <div className="flex gap-2.5 items-start bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <span className="font-semibold">Note: </span>
            Connected integrations are linked to your active brand. Switch your
            active brand to manage integrations for other brands.
          </p>
        </div>
      </div>

      {/* Account / page selector modal */}
      {pageModal.open && (
        <PlatformPageModal
          pages={pageModal.pages}
          onSelect={pageModal.onSelect}
          onClose={pageModal.onClose}
          loading={pageModal.loadingPageId}
          selectedPageId={null}
        />
      )}
    </div>
  );
};

export default IntegrationsPage;
