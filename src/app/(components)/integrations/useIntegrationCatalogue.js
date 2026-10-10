"use client";

// useIntegrationCatalogue
// ─────────────────────────────────────────────────────────────────────────────
// The brand's connected accounts, and the only way to change them. Shared by the
// Integrations page and the copilot's Plugins screen so the two cannot connect
// the same account differently.
//
// Everything is server-side: the API runs each platform's OAuth and holds the
// tokens. This hook only
//   1. reads GET integrations/catalogue — the one source for what is connected,
//      what is waiting for an account choice, and each row's label;
//   2. opens the consent tab for a connect (serverOAuth.js);
//   3. drives the account chooser for the platforms that need one (a Facebook
//      Page, an Instagram business account, an ad account);
//   4. disconnects by platform.
//
// A connection that still needs its account chosen is NOT connected — a tool
// firing with no account id is the bug that state exists to prevent — so it is
// surfaced as `awaitingSelection` ("Finish connecting"), never as connected.
//
// Failures are reported through `notify(message, type)` in the server's own
// words: they name the actual problem ("OAuth client for x is not configured"),
// which is more use than "connection failed".

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toApiPlatform } from "@/(lib)/creativesApi";
import { runServerOAuth } from "./serverOAuth";

// The API's keys, mapped back to the app's ids where they differ (X).
const FROM_API_PLATFORM = { x: "twitter" };
const fromApiPlatform = (provider) => FROM_API_PLATFORM[provider] || provider;

/**
 * @param {object}   [options]
 * @param {(message: string, type: "success"|"error") => void} [options.notify]
 * @returns catalogue state + connect / chooser / disconnect actions.
 */
export function useIntegrationCatalogue({ notify } = {}) {
  const {
    activeBrandId,
    fetchIntegrationCatalogue,
    connectIntegrationProvider,
    fetchIntegrationAccounts,
    selectIntegrationAccount,
    disconnectIntegrationPlatform,
  } = useAuth();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  // Why the catalogue couldn't be read (server's words), or null.
  const [error, setError] = useState(null);
  const [connectingId, setConnectingId] = useState(null);
  const [disconnectingId, setDisconnectingId] = useState(null);
  // The open account chooser: { platformId, accounts, message, loadingId }.
  const [picker, setPicker] = useState(null);

  const say = useCallback(
    (message, type = "success") => {
      if (message) notify?.(message, type);
    },
    [notify],
  );

  /** Store a catalogue response. Returns its rows (or null when it failed). */
  const applyCatalogue = useCallback((res) => {
    if (!res?.ok) {
      setError(res?.message || "Couldn't load your integrations.");
      return null;
    }
    const rows = res.integrations
      .filter((e) => e?.provider)
      .map((e) => ({
        id: fromApiPlatform(e.provider),
        provider: e.provider,
        label: e.label || e.provider,
        family: e.family ?? null,
        isOauth: !!e.is_oauth,
        connected: !!e.connected,
        awaitingSelection: !!e.awaiting_selection,
        selects: !!e.selects,
        accountLabel: e.account_label || null,
      }));
    setEntries(rows);
    setError(null);
    return rows;
  }, []);

  /** Re-read the catalogue. Safe from an event handler. */
  const refresh = useCallback(
    async () => applyCatalogue(await fetchIntegrationCatalogue(activeBrandId)),
    [applyCatalogue, fetchIntegrationCatalogue, activeBrandId],
  );

  // Load on mount and whenever the active brand changes. State is only set in
  // the response callbacks, never synchronously in the effect body. `alive`
  // drops a response that lands after a brand switch.
  useEffect(() => {
    let alive = true;
    fetchIntegrationCatalogue(activeBrandId)
      .then((res) => {
        if (alive) applyCatalogue(res);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [fetchIntegrationCatalogue, activeBrandId, applyCatalogue]);

  /** app platform id → its catalogue row. */
  const byPlatform = useMemo(
    () => new Map(entries.map((e) => [e.id, e])),
    [entries],
  );

  /**
   * Open the account chooser for a platform: fetch what can be picked. An empty
   * list arrives with a `message` saying why (no Pages, a personal Instagram
   * account, no ad accounts shared) — the chooser shows that instead of nothing.
   */
  const openChooser = useCallback(
    async (platformId) => {
      const res = await fetchIntegrationAccounts(
        toApiPlatform(platformId),
        activeBrandId,
      );
      if (!res.ok) {
        say(res.message, "error");
        return;
      }
      setPicker({
        platformId,
        accounts: res.accounts,
        message: res.message,
        loadingId: null,
      });
    },
    [fetchIntegrationAccounts, activeBrandId, say],
  );

  /** Start a connect: consent tab → (maybe) account chooser → refreshed row. */
  const connect = useCallback(
    async (platformId) => {
      if (!activeBrandId) {
        say("Select a brand first.", "error");
        return;
      }

      setConnectingId(platformId);
      try {
        const result = await runServerOAuth(() =>
          connectIntegrationProvider(toApiPlatform(platformId), activeBrandId),
        );

        if (result.status === "blocked") {
          say("Allow pop-ups for this site, then try again.", "error");
          return;
        }
        if (result.status === "error") say(result.message, "error");

        // Whatever the tab reported — or didn't: a closed tab and a dropped
        // message look the same from here — the catalogue says what was stored.
        const rows = await refresh();
        const row = rows?.find((e) => e.id === platformId);

        if (result.needsSelection || row?.awaitingSelection) {
          await openChooser(platformId);
        } else if (result.status === "success") {
          say(result.message || "Connected", "success");
        }
      } finally {
        setConnectingId(null);
      }
    },
    [activeBrandId, connectIntegrationProvider, refresh, openChooser, say],
  );

  /** The user picked an account in the chooser — finish the connection. */
  const pickAccount = useCallback(
    async (account) => {
      if (!picker) return;
      const { platformId } = picker;
      setPicker((p) => (p ? { ...p, loadingId: account.id } : p));

      const res = await selectIntegrationAccount(
        toApiPlatform(platformId),
        account.id,
        activeBrandId,
      );
      if (!res.ok) {
        say(res.message, "error");
        // A refused choice usually means a stale list — fetch it again.
        await openChooser(platformId);
        return;
      }
      setPicker(null);
      say(res.data?.message || `${account.name || "Account"} connected`);
      await refresh();
    },
    [picker, selectIntegrationAccount, activeBrandId, openChooser, refresh, say],
  );

  const closeChooser = useCallback(() => setPicker(null), []);

  const disconnect = useCallback(
    async (platformId) => {
      setDisconnectingId(platformId);
      try {
        const res = await disconnectIntegrationPlatform(
          toApiPlatform(platformId),
          activeBrandId,
        );
        if (!res.ok) {
          say(res.message || "Failed to disconnect", "error");
          return false;
        }
        say("Integration disconnected.");
        await refresh();
        return true;
      } finally {
        setDisconnectingId(null);
      }
    },
    [disconnectIntegrationPlatform, activeBrandId, refresh, say],
  );

  return {
    entries,
    byPlatform,
    loading,
    error,
    refresh,
    connect,
    connectingId,
    disconnect,
    disconnectingId,
    openChooser,
    // Props ready to spread into <PlatformPageModal /> (rendered when open).
    chooser: {
      open: !!picker,
      pages: picker?.accounts || [],
      message: picker?.message || null,
      loadingPageId: picker?.loadingId || null,
      onSelect: pickAccount,
      onClose: closeChooser,
    },
  };
}
