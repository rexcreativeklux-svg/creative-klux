"use client";

// app/(components)/integrations/ManageConnectionsModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// "Manage connections" — the pop-up behind a content section's "+ More
// connections" button, laid out like Metricool's: every social and ad network
// in a grid, each under its name. A connected one shows the account the
// backend names (`account_label`) with an × to disconnect; the rest show a
// "Connect a … account" button in the network's colours.
//
// It drives the caller's useIntegrationCatalogue() instance, so the sidebar
// that opened it updates the moment a connect or disconnect lands. Nothing here
// touches a token — the API runs every OAuth (see useIntegrationCatalogue).

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import PlatformPageModal from "@/app/(components)/integrations/PlatformPageModal";
import { SOCIAL_PLATFORMS, AD_PLATFORMS } from "@/(lib)/integrations/platforms";

// What each network's connect button says, in Metricool's wording.
const CONNECT_LABEL = {
  facebook: "Connect a Facebook page",
  instagram: "Connect an Instagram professional account",
  twitter: "Connect an X account",
  linkedin: "Connect a LinkedIn account",
  youtube: "Connect a YouTube channel",
  pinterest: "Connect a Pinterest account",
  tiktok: "Connect a TikTok account",
  meta_ads: "Connect a Meta Ads account",
  google_ads: "Connect a Google Ads account",
  tiktok_ads: "Connect a TikTok Ads account",
  snapchat_ads: "Connect a Snapchat Ads account",
  pinterest_ads: "Connect a Pinterest Ads account",
};

// Networks whose colour is too light for white text (Snapchat's yellow).
const LIGHT_BG = new Set(["snapchat_ads"]);

// Short headings over each tile (the catalogue's labels can be long).
const HEADING = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X",
  meta_ads: "Meta Ads",
};

/** One network's tile: its heading, then its account or its connect button. */
function NetworkTile({ platform, row, catalogue }) {
  const { connect, openChooser, disconnect, connectingId, disconnectingId } = catalogue;
  const [confirming, setConfirming] = useState(false);
  const { Icon } = platform;
  const connected = !!row?.connected;
  const awaiting = !connected && !!row?.awaitingSelection;
  const connecting = connectingId === platform.id;
  const disconnecting = disconnectingId === platform.id;
  const heading = HEADING[platform.id] || row?.label || platform.name;

  return (
    <div className="min-w-0">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md [&_svg]:h-3 [&_svg]:w-3"
          style={{ background: platform.iconBg }}
        >
          <Icon />
        </span>
        {heading}
      </p>

      {connected ? (
        <div className="flex h-14 items-center gap-3 rounded-lg border border-gray-200 bg-surface px-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: platform.iconBg }}
          >
            {(row.accountLabel || heading).replace(/^@/, "").charAt(0).toUpperCase()}
          </span>
          {confirming ? (
            <>
              <p className="min-w-0 flex-1 truncate text-xs text-gray-700">
                Disconnect {row.accountLabel || heading}?
              </p>
              <button
                type="button"
                onClick={async () => {
                  await disconnect(platform.id);
                  setConfirming(false);
                }}
                disabled={disconnecting}
                className="flex cursor-pointer items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {disconnecting && <Loader2 className="h-3 w-3 animate-spin" />}
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={disconnecting}
                className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Check className="h-3 w-3 text-green-600" /> Account
                </p>
                <p className="truncate text-sm font-semibold text-gray-900">
                  {row.accountLabel || "Connected"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-label={`Disconnect ${heading}`}
                title="Disconnect"
                className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (awaiting ? openChooser(platform.id) : connect(platform.id))}
          disabled={connecting}
          className={`group flex h-14 w-full cursor-pointer items-center gap-3 rounded-lg px-4 text-left text-sm font-medium shadow-sm ${
            LIGHT_BG.has(platform.id) ? "text-gray-900 [&_svg]:fill-gray-900" : "text-white"
          } transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0`}
          style={{ background: platform.iconBg }}
        >
          <span className="min-w-0 flex-1 truncate">
            {connecting
              ? "Connecting…"
              : awaiting
                ? "Finish connecting"
                : CONNECT_LABEL[platform.id] || `Connect ${heading}`}
          </span>
          {connecting ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
          ) : (
            <span className="shrink-0 [&_svg]:h-5 [&_svg]:w-5">
              <Icon />
            </span>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * @param {object}  props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {ReturnType<import("./useIntegrationCatalogue").useIntegrationCatalogue>} props.catalogue
 * @param {"social"|"ads"} [props.first="social"] Which group leads the grid —
 *   the section it was opened from.
 */
export default function ManageConnectionsModal({ isOpen, onClose, catalogue, first = "social" }) {
  const { byPlatform, loading, chooser } = catalogue;
  const groups = [
    { key: "social", title: "Social networks", platforms: SOCIAL_PLATFORMS },
    { key: "ads", title: "Advertising", platforms: AD_PLATFORMS },
  ].sort((a, b) => (a.key === first ? -1 : b.key === first ? 1 : 0));

  return (
    <>
      {/* Stepped aside while the account chooser is up, so the two never stack. */}
      <ResponsiveModal
        isOpen={isOpen && !chooser.open}
        onClose={onClose}
        title="Manage connections"
        size="5xl"
        fullHeightSheet
      >
        <div className="space-y-8 px-1 py-2 sm:px-4">
          {groups.map((group) => (
            <section key={group.key}>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {group.title}
              </h3>
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.platforms.map((platform) =>
                  loading ? (
                    <div key={platform.id}>
                      <span className="mb-2 block h-4 w-24 animate-pulse rounded bg-gray-200" />
                      <span className="block h-14 animate-pulse rounded-lg bg-gray-100" />
                    </div>
                  ) : (
                    <NetworkTile
                      key={platform.id}
                      platform={platform}
                      row={byPlatform.get(platform.id)}
                      catalogue={catalogue}
                    />
                  ),
                )}
              </div>
            </section>
          ))}
          <p className="text-xs text-gray-500">
            Connections belong to your active brand. Disconnecting removes access from
            Creative Klux only — to remove the app entirely, revoke it in that
            platform&apos;s own settings.
          </p>
        </div>
      </ResponsiveModal>

      {/* Account chooser (a Page, an Instagram account, an ad account) */}
      {chooser.open && (
        <PlatformPageModal
          pages={chooser.pages}
          message={chooser.message}
          onSelect={chooser.onSelect}
          onClose={chooser.onClose}
          loading={chooser.loadingPageId}
          selectedPageId={null}
          onDisconnect={chooser.onDisconnect}
          disconnecting={chooser.disconnecting}
        />
      )}
    </>
  );
}
