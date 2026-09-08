"use client";

/**
 * ConnectorCard — one connectable app on the Plugins screen.
 *
 * ⚠️ CONNECTED STATE IS THE BRAND'S, NOT THE COPILOT'S. There is one set of
 * integrations; connecting here and connecting on /integrations are the same
 * act. So a card showing "Connected" may well have been connected from the
 * publishing page, and disconnecting here takes it away from there too — which
 * is why the button says Disconnect rather than "remove from this copilot".
 *
 * @param {Object} props
 * @param {Object} props.platform  An entry from the connector catalog
 *                                 ({ id, name, description, Icon, iconBg, isNew }).
 * @param {() => void} props.onConnect
 * @param {Object} [props.connected]     The integration row, when connected.
 * @param {() => void} [props.onDisconnect]
 * @param {boolean} [props.busy]         A connect or disconnect is in flight.
 * @param {boolean} [props.stacked=false] Wrap the description over as many lines
 *   as it needs instead of clamping it to two. The browse modal's two narrow
 *   columns need it; the wide Plugins grid does not.
 */

import { Check, Loader2 } from "lucide-react";

export default function ConnectorCard({
  platform,
  onConnect,
  connected,
  onDisconnect,
  busy = false,
  stacked = false,
}) {
  const { name, description, Icon, iconBg, isNew } = platform;
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-surface p-4 transition-colors hover:bg-gray-100">
      {/* The registry's icons are white-fill marks sized for the Integrations
          page's larger tiles, so the `[&_svg]` rules trim them to this one —
          the same trick PlatformChip uses, and for the same reason: element +
          class outranks the icon's own w-5 h-5 whatever order they land in. */}
      <span
        style={{ background: iconBg }}
        className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 [&_svg]:h-5 [&_svg]:w-5"
      >
        <Icon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="truncate">{name}</span>
          {/* Rendered from the data, never guessed — see the ⚠️ on `isNew` in
              _data/connectors.js. */}
          {isNew && (
            <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
              New
            </span>
          )}
        </p>
        {/* Once connected, the account it is connected AS matters more than the
            platform blurb — "Publish photos & reels" is the same sentence for
            everyone, but which page or handle it posts to is the thing people
            get wrong. */}
        <p
          className={`text-[13px] leading-snug ${connected ? "truncate text-gray-600" : `text-gray-500 ${stacked ? "" : "line-clamp-2"}`}`}
        >
          {connected ? connected.int_name || "Connected" : description}
        </p>
      </div>

      {connected ? (
        // Always visible, not hover-revealed: this one reports state as well as
        // offering an action, and state that appears only on hover is state
        // nobody reads.
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            <Check className="h-3 w-3" />
            Connected
          </span>
          <button
            onClick={onDisconnect}
            disabled={busy}
            className="rounded-lg border border-gray-300 bg-surface px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Disconnect"}
          </button>
        </div>
      ) : (
        /* Revealed on hover on desktop, always there below `lg` — there is no
           hover on a phone, and a Connect button you cannot summon is no button. */
        <button
          onClick={onConnect}
          disabled={busy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-surface px-3 py-1.5 text-xs font-medium text-gray-900 transition-all hover:bg-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Connect
        </button>
      )}
    </div>
  );
}
