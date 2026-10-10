"use client";

/**
 * useBrandIntegrations — the brand's connected apps, for the copilot's Plugins
 * screen.
 *
 * ⚠️ THERE IS ONE SET OF INTEGRATIONS, NOT TWO. Connecting Instagram on the
 * Plugins screen and connecting it on /integrations are the same act, writing
 * the same row to the same table. Whichever screen you do it on, the other
 * shows it. That is the backend's decision and it is the right one — a copilot
 * that has to be handed its own copy of a connection the brand already made is
 * asking the user to authorise Instagram twice.
 *
 * ⚠️ IT REUSES THE INTEGRATIONS PAGE'S ENGINE rather than repeating it:
 * useIntegrationCatalogue reads the catalogue, opens the API's server-side OAuth
 * in a tab, and drives the account chooser (Facebook Pages, ad accounts). The
 * API holds every token — nothing here sees one. A second implementation would
 * be wrong on exactly the chooser and "awaiting selection" details first, and it
 * would be wrong quietly.
 *
 * This hook only reshapes that into what the Plugins cards already read: a
 * `connectedBy` map of platform id → `{ id, platform, int_name }`.
 */

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useIntegrationCatalogue } from "@/app/(components)/integrations/useIntegrationCatalogue";

export function useBrandIntegrations() {
  // The engine reports through a (message, type) callback; route it to the app's
  // toaster so a failure inside the connect flow is not silent.
  const notify = useCallback(
    (message, type) =>
      type === "error" ? toast.error(message) : toast.success(message),
    [],
  );

  const {
    entries,
    loading,
    refresh,
    connect,
    connectingId,
    disconnect,
    disconnectingId,
    chooser,
  } = useIntegrationCatalogue({ notify });

  /**
   * The connected rows, in the shape the cards read. `id` is the platform id —
   * disconnecting is by platform now, so that is what `disconnect` takes.
   * A connection still waiting for its account to be chosen is NOT in here.
   */
  const integrations = useMemo(
    () =>
      entries
        .filter((e) => e.connected)
        .map((e) => ({ id: e.id, platform: e.id, int_name: e.accountLabel })),
    [entries],
  );

  /** platform id → the row that connected it, for O(1) lookups per card. */
  const connectedBy = useMemo(
    () => new Map(integrations.map((row) => [row.platform, row])),
    [integrations],
  );

  return {
    integrations,
    connectedBy,
    loading,
    connectPlatform: connect,
    connectingId,
    disconnect,
    disconnectingId,
    // Same prop names the Plugins page already spreads into <PlatformPageModal />.
    pageModal: chooser,
    refresh,
  };
}
