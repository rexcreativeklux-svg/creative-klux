"use client";

import { useState, useCallback } from "react";
import { Info, AlertCircle, Check, Loader2, Plug } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/app/(components)/Toast";
import { getPublishedPosts, setPublishedPosts } from "@/(lib)/integration";
import {
  SOCIAL_PLATFORMS,
  AD_PLATFORMS,
  PRODUCTIVITY_PLATFORMS,
} from "@/(lib)/integrations/platforms";
import IntegrationsSkeleton from "@/app/(components)/integrations/IntegrationsSkeleton";
import PlatformPageModal from "@/app/(components)/integrations/PlatformPageModal";
import { useIntegrationCatalogue } from "@/app/(components)/integrations/useIntegrationCatalogue";

// Look for a catalogue provider the frontend has no icon/description for yet.
const GENERIC_APP = {
  Icon: () => <Plug className="w-5 h-5 text-white" />,
  iconBg: "linear-gradient(135deg, #64748B, #475569)",
  description: "",
};

// Ids the Social and Ads sections own; every other catalogue row is Productivity.
const SECTIONED_IDS = new Set(
  [...SOCIAL_PLATFORMS, ...AD_PLATFORMS].map((p) => p.id),
);

// ── Platform Card ─────────────────────────────────────────────────────────────
// `row` is the platform's catalogue entry (undefined while the catalogue can't
// be read). Three states, straight from the server:
//   connected           → green chip + Disconnect
//   awaiting selection  → consent done, account not chosen yet: "Finish connecting"
//   neither             → Connect
const PlatformCard = ({
  platform,
  row,
  onConnect,
  onFinish,
  onDisconnect,
  connectingId,
  disconnectingId,
}) => {
  const { Icon } = platform;
  const isConnected = !!row?.connected;
  const isAwaiting = !isConnected && !!row?.awaitingSelection;
  const connecting = connectingId === platform.id;
  const disconnecting = disconnectingId === platform.id;
  const busy = connecting || disconnecting;

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
                {row.accountLabel || "Connected"}
              </span>
            ) : isAwaiting ? (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Choose an account to finish
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
              onClick={() => onDisconnect(platform.id)}
              disabled={busy}
              className="px-3 py-1.5 cursor-pointer text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : (
            <button
              onClick={() =>
                isAwaiting ? onFinish(platform.id) : onConnect(platform.id)
              }
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:scale-105 cursor-pointer text-xs text-white rounded-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #155dfc, #3b82f6)" }}
            >
              {connecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {connecting
                ? "Connecting…"
                : isAwaiting
                  ? "Finish connecting"
                  : "Connect"}
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
// Every row's state comes from GET integrations/catalogue, and every connect is
// the API's server-side OAuth (see useIntegrationCatalogue). Nothing here
// handles a token.
const IntegrationsPage = () => {
  const { activeBrandId } = useAuth();

  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });
  const showToast = useCallback(
    (message, type = "success") => setToast({ isOpen: true, message, type }),
    [],
  );
  const closeToast = () => setToast((prev) => ({ ...prev, isOpen: false }));

  const {
    entries,
    byPlatform,
    loading,
    error,
    connect,
    connectingId,
    disconnect,
    disconnectingId,
    openChooser,
    chooser,
  } = useIntegrationCatalogue({ notify: showToast });

  // Disconnecting also drops that platform's live posts from this brand's local
  // list — they belonged to the connection that is going away.
  const handleDisconnect = useCallback(
    async (platformId) => {
      const done = await disconnect(platformId);
      if (!done) return;
      try {
        const cleaned = getPublishedPosts(activeBrandId).filter(
          (p) => !(p.live && p.platform === platformId),
        );
        setPublishedPosts(activeBrandId, cleaned);
      } catch (e) {
        console.warn("Failed to clean localStorage posts:", e);
      }
    },
    [disconnect, activeBrandId],
  );

  // A section's rows: its known platforms, each named by the catalogue when the
  // catalogue has it.
  const rowsFor = (platforms) =>
    platforms.map((platform) => ({
      ...platform,
      name: byPlatform.get(platform.id)?.label || platform.name,
    }));

  // Productivity is whatever the catalogue lists outside Social/Ads, in its
  // order and under its labels — so a provider the backend adds or renames shows
  // up without a frontend change (with a generic mark until it has an icon).
  // If the catalogue couldn't be read, the local list stands in.
  const productivityEntries = entries.filter((e) => !SECTIONED_IDS.has(e.id));
  const productivityRows = productivityEntries.length
    ? productivityEntries.map((entry) => ({
        ...(PRODUCTIVITY_PLATFORMS.find((p) => p.id === entry.id) ||
          GENERIC_APP),
        id: entry.id,
        name: entry.label,
      }))
    : PRODUCTIVITY_PLATFORMS;

  const sections = [
    { title: "Social Media", rows: rowsFor(SOCIAL_PLATFORMS) },
    { title: "Advertising Platforms", rows: rowsFor(AD_PLATFORMS) },
    { title: "Productivity", rows: productivityRows },
  ];

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
            platform login, you approve, and it&apos;s done.
          </p>
        </div>

        {/* How it works banner */}
        <div className="mb-6 flex gap-3 items-start bg-[#eff4ff] border border-[#c7d9fd] rounded-xl px-4 py-3.5">
          <Info className="h-4 w-4 text-[#155dfc] shrink-0 mt-0.5" />
          <p className="text-sm text-[#1e40af] leading-relaxed">
            <span className="font-semibold">How it works: </span>
            Click <span className="italic font-medium">Connect</span> on any
            platform. A new tab opens where you log in and approve permissions.
            Some platforms then ask which Page or account to use. The
            connection is saved to your active brand.
          </p>
        </div>

        {/* The catalogue couldn't be read — say why, in the server's words. The
            rows below still render (as not connected) so the page isn't blank. */}
        {!loading && error && (
          <div className="mb-6 flex gap-3 items-start bg-red-50 border border-red-200 rounded-xl px-4 py-3.5">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 leading-relaxed">
              <span className="font-semibold">
                Couldn&apos;t load your connections:{" "}
              </span>
              {error}
            </p>
          </div>
        )}

        {loading ? (
          /* The platform rows themselves, greyed out — the list is a known set
             of platforms, so its shape is known before the request returns and
             only each row's connected state is actually pending. Same component
             the route's loading.jsx uses, so the two frames are
             indistinguishable. */
          <IntegrationsSkeleton />
        ) : (
          <>
            {sections.map((section) => (
              <div key={section.title} className="mb-8">
                <SectionHeader title={section.title} />
                <div className="flex flex-col gap-3">
                  {section.rows.map((platform) => (
                    <PlatformCard
                      key={platform.id}
                      platform={platform}
                      row={byPlatform.get(platform.id)}
                      onConnect={connect}
                      onFinish={openChooser}
                      onDisconnect={handleDisconnect}
                      connectingId={connectingId}
                      disconnectingId={disconnectingId}
                    />
                  ))}
                </div>
              </div>
            ))}
            <p className="-mt-4 mb-8 text-xs text-gray-500">
              Disconnecting removes access from Creative Klux only — to remove
              the app from your account entirely, revoke it in that
              platform&apos;s own security settings.
            </p>
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

      {/* Account chooser (a Page, an Instagram account, an ad account) */}
      {chooser.open && (
        <PlatformPageModal
          pages={chooser.pages}
          message={chooser.message}
          onSelect={chooser.onSelect}
          onClose={chooser.onClose}
          loading={chooser.loadingPageId}
          selectedPageId={null}
        />
      )}
    </div>
  );
};

export default IntegrationsPage;
