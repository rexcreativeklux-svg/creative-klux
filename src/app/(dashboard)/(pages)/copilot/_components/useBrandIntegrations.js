"use client";

/**
 * useBrandIntegrations — the brand's connected apps, for the copilot's Plugins
 * screen.
 *
 * ⚠️ THERE IS ONE SET OF INTEGRATIONS, NOT TWO. Connecting Instagram on the
 * Plugins screen and connecting it on /integrations are the same act, writing
 * the same row to the same `/integrations` table. Whichever screen you do it on,
 * the other shows it. That is the backend's decision and it is the right one —
 * a copilot that has to be handed its own copy of a connection the brand already
 * made is asking the user to authorise Instagram twice.
 *
 * ⚠️ SO THIS IS NOT `POST integrations/{provider}/connect`. That route exists for
 * providers whose OAuth secret the SERVER holds (google, microsoft). The social
 * and ad platforms are connected by the APP: useIntegrationConnect opens the
 * provider's window, exchanges the code through our own /api/* routes, and the
 * resolved token is saved with `saveIntegration`. Using the server route for
 * these is what produced "Unknown integration provider: facebook" — they have no
 * entry in its config, and they are not supposed to.
 *
 * ⚠️ IT REUSES THE PUBLISHING PAGE'S ENGINE rather than repeating it. That engine
 * also drives the account/page picker (Facebook Pages, ad accounts) and carries
 * per-platform stopgaps — X and TikTok refresh tokens are stashed client-side
 * until the backend persists them. A second implementation would be wrong on
 * exactly those details first, and it would be wrong quietly.
 *
 * `forcePopup` so a connect never navigates the copilot away mid-flow; the
 * publishing page can afford a full-page redirect, a settings screen inside a
 * workspace cannot.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { setStoredXRefresh, setStoredTikTokRefresh } from "@/(lib)/integration";
import { useIntegrationConnect } from "@/app/(components)/integrations/useIntegrationConnect";

export function useBrandIntegrations() {
  const {
    activeBrandId,
    fetchIntegrations,
    saveIntegration,
    disconnectIntegration,
  } = useAuth();

  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState(null);

  /**
   * ⚠️ STATE IS ONLY SET IN THE CALLBACK, never in the effect body — a
   * synchronous setState there cascades renders, and this repo's compiler rules
   * reject it. So `loading` starts true rather than being switched on at the
   * top of the load.
   *
   * `alive` drops a response that lands after the screen is gone, which is what
   * switching brand mid-request looks like.
   *
   * A null result means the request FAILED (see fetchIntegrations, which
   * swallows and returns null). Keeping the previous rows is deliberate:
   * blanking to an empty list would claim nothing is connected, which is a much
   * more alarming thing to say than nothing at all.
   */
  useEffect(() => {
    let alive = true;
    fetchIntegrations()
      .then((rows) => {
        if (alive && Array.isArray(rows)) setIntegrations(rows);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [fetchIntegrations]);

  /** Re-read the list. Safe from an event handler, unlike inside an effect. */
  const refresh = useCallback(async () => {
    const rows = await fetchIntegrations();
    if (Array.isArray(rows)) setIntegrations(rows);
  }, [fetchIntegrations]);

  /** platform id → the row that connected it, for O(1) lookups per card. */
  const connectedBy = useMemo(() => {
    const map = new Map();
    for (const row of integrations) {
      if (row?.platform && !map.has(row.platform)) map.set(row.platform, row);
    }
    return map;
  }, [integrations]);

  // Save a resolved connection. Mirrors the publishing page's onResolved so the
  // two cannot store the same connection differently.
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
        toast.error(saved.message || "Failed to save integration");
        return;
      }

      const savedId = saved.data?.id || saved.data?.data?.id || saved.id;

      // Stopgap until the backend persists these: posting later mints fresh
      // tokens from them. Kept identical to the publishing page on purpose —
      // connecting X here must leave the same thing behind as connecting it
      // there, or posting works from one screen and not the other.
      if (payload.platform === "twitter" && payload.refresh_token && savedId)
        setStoredXRefresh(savedId, payload.refresh_token);
      if (payload.platform === "tiktok" && payload.refresh_token && savedId)
        setStoredTikTokRefresh(savedId, payload.refresh_token);

      setIntegrations((prev) => [
        ...prev,
        {
          id: savedId,
          platform: payload.platform,
          int_id: payload.int_id,
          int_name: payload.int_name,
        },
      ]);
      toast.success(`${payload.int_name || payload.platform} connected`);
    },
    [saveIntegration, activeBrandId],
  );

  const { connect, loadingPlatformId, pageModal } = useIntegrationConnect({
    brandId: activeBrandId,
    onResolved,
    // The engine reports through a (message, type) callback; route it to the
    // app's toaster so a failure inside the popup flow is not silent.
    showToast: (message, type) =>
      type === "error" ? toast.error(message) : toast.success(message),
    forcePopup: true,
  });

  /**
   * Start a connect. Guards on the active brand first: an integration is stored
   * against a brand, so without one there is nowhere for it to go — and the
   * engine would open a provider window before discovering that.
   */
  const connectPlatform = useCallback(
    (platformId) => {
      if (!activeBrandId) {
        toast.error("Select a brand before connecting an app.");
        return;
      }
      connect(platformId);
    },
    [activeBrandId, connect],
  );

  const disconnect = useCallback(
    async (integrationId) => {
      setDisconnectingId(integrationId);
      try {
        const result = await disconnectIntegration(integrationId);
        if (result?.ok === false) {
          toast.error(result.message || "Couldn't disconnect that app");
          return;
        }
        setIntegrations((prev) => prev.filter((i) => i.id !== integrationId));
        toast.success("Disconnected");
      } finally {
        setDisconnectingId(null);
      }
    },
    [disconnectIntegration],
  );

  return {
    integrations,
    connectedBy,
    loading,
    connectPlatform,
    connectingId: loadingPlatformId,
    disconnect,
    disconnectingId,
    pageModal,
    refresh,
  };
}
