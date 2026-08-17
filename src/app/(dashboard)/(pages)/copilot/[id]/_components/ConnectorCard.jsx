"use client";

/**
 * ConnectorCard — one connectable app on the Plugins screen.
 *
 * ⚠️ CONNECTING IS NOT WIRED HERE, deliberately: the backend decides how a
 * copilot's integrations work, so this card only reports that the click was
 * heard. When that lands, `onConnect` is the one place to point at it.
 *
 * @param {Object} props
 * @param {Object} props.platform  An entry from the connector catalog
 *                                 ({ id, name, description, Icon, iconBg, isNew }).
 * @param {() => void} props.onConnect
 * @param {boolean} [props.stacked=false] Wrap the description over as many lines
 *   as it needs instead of clamping it to two. The browse modal's two narrow
 *   columns need it; the wide Plugins grid does not.
 */

export default function ConnectorCard({ platform, onConnect, stacked = false }) {
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
        <p
          className={`text-[13px] leading-snug text-gray-500 ${stacked ? "" : "line-clamp-2"}`}
        >
          {description}
        </p>
      </div>
      {/* Revealed on hover on desktop, always there below `lg` — there is no
          hover on a phone, and a Connect button you cannot summon is no button. */}
      <button
        onClick={onConnect}
        className="shrink-0 rounded-lg border border-gray-300 bg-surface px-3 py-1.5 text-xs font-medium text-gray-900 transition-all hover:bg-gray-200 cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
      >
        Connect
      </button>
    </div>
  );
}
